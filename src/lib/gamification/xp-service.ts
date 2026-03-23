import { eq, and, sql } from "drizzle-orm";

import { db } from "@/db";
import { userGamification, xpTransaction, dailyActivity } from "@/db/schema/gamification";
import { user } from "@/db/schema/user";

// XP amounts per action
const XP_REVIEW_CARD = 5;
const XP_QUIZ_COMPLETE = 15;
const XP_QUIZ_PERFECT_BONUS = 10;
const XP_DAILY_GOAL_BONUS = 10;

// Streak milestone rewards: [days, xpReward, freezesAwarded]
const STREAK_MILESTONES: [number, number, number][] = [
  [7, 50, 1],
  [14, 75, 0],
  [30, 100, 2],
  [60, 200, 1],
  [90, 300, 1],
  [180, 400, 2],
  [365, 500, 3],
];

// Level formula: XP needed to reach level N = 50 * N^2
function calculateLevel(totalXp: number): { level: number; xpForCurrentLevel: number; xpForNextLevel: number } {
  let level = 1;
  let cumulativeXp = 0;

  while (true) {
    const nextLevelXp = 50 * ((level + 1) ** 2);
    if (cumulativeXp + nextLevelXp > totalXp) {
      return {
        level,
        xpForCurrentLevel: totalXp - cumulativeXp,
        xpForNextLevel: nextLevelXp,
      };
    }
    cumulativeXp += nextLevelXp;
    level++;
  }
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export type XpSource = "review" | "quiz" | "perfect_quiz" | "streak_bonus" | "achievement" | "daily_bonus";

export interface AwardXpResult {
  xpAwarded: number;
  totalXp: number;
  currentLevel: number;
  leveledUp: boolean;
  dailyXpEarned: number;
  dailyGoalMet: boolean;
  dailyGoalJustCompleted: boolean;
}

// Core function to award XP using atomic SQL increments
async function awardXpInternal(
  userId: string,
  amount: number,
  source: XpSource,
  description: string,
  referenceId?: string
): Promise<AwardXpResult> {
  // Get user's daily goal setting
  const [userData] = await db
    .select({ dailyGoalXp: user.dailyGoalXp })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const dailyGoalXp = parseInt(userData?.dailyGoalXp ?? "30", 10);
  const today = getTodayDate();

  // Insert XP transaction
  await db.insert(xpTransaction).values({
    userId,
    source,
    amount,
    description,
    referenceId: referenceId ?? null,
  });

  // Atomic increment: update total_xp and daily_xp using SQL expressions
  // Also reset daily counters if it's a new day
  const [updated] = await db
    .update(userGamification)
    .set({
      totalXp: sql`${userGamification.totalXp} + ${amount}`,
      dailyXpEarned: sql`CASE WHEN ${userGamification.lastActivityDate} = ${today} THEN ${userGamification.dailyXpEarned} + ${amount} ELSE ${amount} END`,
      dailyGoalMet: sql`CASE WHEN ${userGamification.lastActivityDate} = ${today} THEN (${userGamification.dailyGoalMet} OR (${userGamification.dailyXpEarned} + ${amount} >= ${dailyGoalXp})) ELSE (${amount} >= ${dailyGoalXp}) END`,
      lastActivityDate: today,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userGamification.userId, userId))
    .returning();

  if (!updated) {
    throw new Error("Data gamifikasi tidak ditemukan");
  }

  const newTotalXp = updated.totalXp;
  const newDailyXp = updated.dailyXpEarned;
  const prevLevel = updated.currentLevel;
  const { level: newLevel } = calculateLevel(newTotalXp);
  const leveledUp = newLevel > prevLevel;

  // Update level if changed
  if (leveledUp) {
    await db
      .update(userGamification)
      .set({ currentLevel: newLevel })
      .where(eq(userGamification.userId, userId));
  }

  // Check if daily goal was just completed this call
  const dailyGoalJustCompleted = updated.dailyGoalMet && (newDailyXp - amount) < dailyGoalXp;

  // Update daily activity
  await upsertDailyActivity(userId, today, { xpEarned: amount, goalMet: updated.dailyGoalMet });

  return {
    xpAwarded: amount,
    totalXp: newTotalXp,
    currentLevel: leveledUp ? newLevel : prevLevel,
    leveledUp,
    dailyXpEarned: newDailyXp,
    dailyGoalMet: updated.dailyGoalMet,
    dailyGoalJustCompleted,
  };
}

// Upsert daily activity row using atomic increments
async function upsertDailyActivity(
  userId: string,
  date: string,
  updates: { reviewsCount?: number; quizCount?: number; xpEarned?: number; goalMet?: boolean }
) {
  const existing = await db
    .select({ id: dailyActivity.id })
    .from(dailyActivity)
    .where(
      and(
        eq(dailyActivity.userId, userId),
        eq(dailyActivity.activityDate, date)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const setClause: Record<string, unknown> = {};
    if (updates.reviewsCount) {
      setClause.reviewsCount = sql`${dailyActivity.reviewsCount} + ${updates.reviewsCount}`;
    }
    if (updates.quizCount) {
      setClause.quizCount = sql`${dailyActivity.quizCount} + ${updates.quizCount}`;
    }
    if (updates.xpEarned) {
      setClause.xpEarned = sql`${dailyActivity.xpEarned} + ${updates.xpEarned}`;
    }
    if (updates.goalMet !== undefined) {
      setClause.goalMet = updates.goalMet;
    }
    if (Object.keys(setClause).length > 0) {
      await db
        .update(dailyActivity)
        .set(setClause)
        .where(eq(dailyActivity.id, existing[0].id));
    }
  } else {
    await db.insert(dailyActivity).values({
      userId,
      activityDate: date,
      reviewsCount: updates.reviewsCount ?? 0,
      quizCount: updates.quizCount ?? 0,
      xpEarned: updates.xpEarned ?? 0,
      goalMet: updates.goalMet ?? false,
    });
  }
}

// Award XP for a flashcard review (5 XP per card)
export async function awardReviewXp(
  userId: string,
  cardId: string
): Promise<AwardXpResult> {
  const result = await awardXpInternal(
    userId,
    XP_REVIEW_CARD,
    "review",
    "Review kartu",
    cardId
  );

  // Update daily activity review count
  await upsertDailyActivity(userId, getTodayDate(), { reviewsCount: 1 });

  // Update total reviews in gamification
  await db
    .update(userGamification)
    .set({
      totalReviews: sql`${userGamification.totalReviews} + 1`,
    })
    .where(eq(userGamification.userId, userId));

  // Award daily goal bonus if just completed
  if (result.dailyGoalJustCompleted) {
    await awardDailyGoalXp(userId);
  }

  return result;
}

// Award XP for quiz completion (15 XP + 10 bonus if perfect)
export async function awardQuizXp(
  userId: string,
  sessionId: string,
  isPerfect: boolean
): Promise<AwardXpResult> {
  let result = await awardXpInternal(
    userId,
    XP_QUIZ_COMPLETE,
    "quiz",
    "Menyelesaikan quiz",
    sessionId
  );

  // Update daily activity quiz count
  await upsertDailyActivity(userId, getTodayDate(), { quizCount: 1 });

  // Award perfect quiz bonus
  if (isPerfect) {
    result = await awardXpInternal(
      userId,
      XP_QUIZ_PERFECT_BONUS,
      "perfect_quiz",
      "Quiz sempurna! Bonus XP",
      sessionId
    );
  }

  // Award daily goal bonus if just completed
  if (result.dailyGoalJustCompleted) {
    await awardDailyGoalXp(userId);
  }

  return result;
}

// Award daily goal bonus XP
async function awardDailyGoalXp(userId: string): Promise<void> {
  await awardXpInternal(
    userId,
    XP_DAILY_GOAL_BONUS,
    "daily_bonus",
    "Target harian tercapai! Bonus XP"
  );
}

// Award streak milestone XP and freezes
export async function checkAndAwardStreakMilestone(
  userId: string,
  currentStreak: number
): Promise<{ awarded: boolean; xp: number; freezes: number } | null> {
  const milestone = STREAK_MILESTONES.find(([days]) => days === currentStreak);
  if (!milestone) return null;

  const [days, xpReward, freezesAwarded] = milestone;

  await awardXpInternal(
    userId,
    xpReward,
    "streak_bonus",
    `Streak ${days} hari! Bonus XP`
  );

  if (freezesAwarded > 0) {
    await db
      .update(userGamification)
      .set({
        streakFreezes: sql`${userGamification.streakFreezes} + ${freezesAwarded}`,
      })
      .where(eq(userGamification.userId, userId));
  }

  return { awarded: true, xp: xpReward, freezes: freezesAwarded };
}

// Award XP for achievement unlock
export async function awardAchievementXp(
  userId: string,
  amount: number,
  achievementName: string,
  achievementId: string
): Promise<void> {
  await awardXpInternal(
    userId,
    amount,
    "achievement",
    `Achievement: ${achievementName}`,
    achievementId
  );
}

// Get XP overview for a user
export async function getXpOverview(userId: string) {
  const [gamification] = await db
    .select()
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  if (!gamification) return null;

  const { level, xpForCurrentLevel, xpForNextLevel } = calculateLevel(gamification.totalXp);

  // Get user's daily goal setting
  const [userData] = await db
    .select({ dailyGoalXp: user.dailyGoalXp })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const dailyGoalXp = parseInt(userData?.dailyGoalXp ?? "30", 10);

  return {
    totalXp: gamification.totalXp,
    currentLevel: level,
    xpForCurrentLevel,
    xpForNextLevel,
    xpProgressPercent: Math.round((xpForCurrentLevel / xpForNextLevel) * 100),
    currentStreak: gamification.currentStreak,
    longestStreak: gamification.longestStreak,
    streakFreezes: gamification.streakFreezes,
    totalReviews: gamification.totalReviews,
    totalWordsLearned: gamification.totalWordsLearned,
    dailyXpEarned: gamification.dailyXpEarned,
    dailyGoalXp,
    dailyGoalMet: gamification.dailyGoalMet,
    dailyGoalPercent: Math.min(100, Math.round((gamification.dailyXpEarned / dailyGoalXp) * 100)),
    lastActivityDate: gamification.lastActivityDate,
  };
}
