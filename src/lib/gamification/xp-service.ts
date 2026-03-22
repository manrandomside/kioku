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
// Level 1: 0 XP, Level 2: 200 XP (50*2^2), Level 3: 450 XP (50*3^2), etc.
// Cumulative XP for level N = sum(50 * i^2) for i from 2 to N
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

// Get today's date string in YYYY-MM-DD format
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

// Core function to award XP and update gamification state
async function awardXpInternal(
  userId: string,
  amount: number,
  source: XpSource,
  description: string,
  referenceId?: string
): Promise<AwardXpResult> {
  // Get current gamification state
  const [gamification] = await db
    .select()
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  if (!gamification) {
    throw new Error("Data gamifikasi tidak ditemukan");
  }

  // Get user's daily goal setting
  const [userData] = await db
    .select({ dailyGoalXp: user.dailyGoalXp })
    .from(user)
    .where(eq(user.supabaseAuthId, userId))
    .limit(1);

  const dailyGoalXp = parseInt(userData?.dailyGoalXp ?? "30", 10);
  const today = getTodayDate();
  const isNewDay = gamification.lastActivityDate !== today;

  // Reset daily counters if new day
  const currentDailyXp = isNewDay ? 0 : gamification.dailyXpEarned;
  const currentDailyGoalMet = isNewDay ? false : gamification.dailyGoalMet;

  const newTotalXp = gamification.totalXp + amount;
  const newDailyXp = currentDailyXp + amount;
  const prevLevel = gamification.currentLevel;
  const { level: newLevel, xpForCurrentLevel, xpForNextLevel } = calculateLevel(newTotalXp);
  const leveledUp = newLevel > prevLevel;

  // Check if daily goal just completed
  const dailyGoalJustCompleted = !currentDailyGoalMet && newDailyXp >= dailyGoalXp;

  // Insert XP transaction
  await db.insert(xpTransaction).values({
    userId,
    source,
    amount,
    description,
    referenceId: referenceId ?? null,
  });

  // Update gamification stats
  await db
    .update(userGamification)
    .set({
      totalXp: newTotalXp,
      currentLevel: newLevel,
      dailyXpEarned: newDailyXp,
      dailyGoalMet: currentDailyGoalMet || dailyGoalJustCompleted,
      lastActivityDate: today,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userGamification.userId, userId));

  // Update daily activity
  await upsertDailyActivity(userId, today, { xpEarned: amount, goalMet: dailyGoalJustCompleted || currentDailyGoalMet });

  return {
    xpAwarded: amount,
    totalXp: newTotalXp,
    currentLevel: newLevel,
    leveledUp,
    dailyXpEarned: newDailyXp,
    dailyGoalMet: currentDailyGoalMet || dailyGoalJustCompleted,
    dailyGoalJustCompleted,
  };
}

// Upsert daily activity row
async function upsertDailyActivity(
  userId: string,
  date: string,
  updates: { reviewsCount?: number; quizCount?: number; xpEarned?: number; goalMet?: boolean }
) {
  const existing = await db
    .select()
    .from(dailyActivity)
    .where(
      and(
        eq(dailyActivity.userId, userId),
        eq(dailyActivity.activityDate, date)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const row = existing[0];
    await db
      .update(dailyActivity)
      .set({
        reviewsCount: row.reviewsCount + (updates.reviewsCount ?? 0),
        quizCount: row.quizCount + (updates.quizCount ?? 0),
        xpEarned: row.xpEarned + (updates.xpEarned ?? 0),
        goalMet: updates.goalMet ?? row.goalMet,
      })
      .where(eq(dailyActivity.id, row.id));
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
    .where(eq(user.supabaseAuthId, userId))
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
