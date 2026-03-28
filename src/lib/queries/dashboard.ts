import { eq, and, count, sql, desc, avg, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/user";
import { userGamification, achievementUnlock, achievement } from "@/db/schema/gamification";
import { quizSession, quizAnswer } from "@/db/schema/quiz";
import { chapter, vocabulary } from "@/db/schema/content";
import { srsCard } from "@/db/schema/srs";

import { getSrsStats, type SrsStats } from "./review";
import { getTotalQuizMasteredWords, getQuizMasteredWordsAll } from "@/lib/progress/quiz-mastery";

// User profile data for dashboard display
export interface DashboardUserProfile {
  displayName: string;
  preferredName: string | null;
  avatarUrl: string | null;
  jlptTarget: string;
  dailyGoalXp: number;
}

// Level calculation (same formula as xp-service, duplicated to avoid server/client boundary issues)
function calculateLevel(totalXp: number) {
  let level = 1;
  let cumulativeXp = 0;

  while (true) {
    const nextLevelXp = 50 * ((level + 1) ** 2);
    if (cumulativeXp + nextLevelXp > totalXp) {
      return {
        level,
        xpInLevel: totalXp - cumulativeXp,
        xpNeeded: nextLevelXp,
      };
    }
    cumulativeXp += nextLevelXp;
    level++;
  }
}

export interface DashboardData {
  profile: DashboardUserProfile;
  level: {
    current: number;
    totalXp: number;
    xpInLevel: number;
    xpNeeded: number;
    progressPercent: number;
  };
  streak: {
    current: number;
    longest: number;
    freezes: number;
    isActiveToday: boolean;
    atRisk: boolean;
  };
  daily: {
    xpEarned: number;
    xpGoal: number;
    goalMet: boolean;
    progressPercent: number;
  };
  progress: {
    totalMasteredWords: number;
    totalVocab: number;
    masteredChapters: number;
    totalChapters: number;
    quizCompleted: number;
    quizAvgScore: number;
    lastQuizScore: number | null;
  };
  srs: SrsStats;
  recentAchievements: {
    id: string;
    name: string;
    icon: string;
    badgeColor: string | null;
    xpReward: number;
    unlockedAt: string;
  }[];
  totalAchievements: { unlocked: number; total: number };
}

export async function getDashboardData(
  authUserId: string
): Promise<DashboardData | null> {
  // Get user profile (includes internal user.id)
  const [userData] = await db
    .select({
      id: user.id,
      displayName: user.displayName,
      preferredName: user.preferredName,
      avatarUrl: user.avatarUrl,
      jlptTarget: user.jlptTarget,
      dailyGoalXp: user.dailyGoalXp,
    })
    .from(user)
    .where(eq(user.supabaseAuthId, authUserId))
    .limit(1);

  if (!userData) return null;

  const internalUserId = userData.id;
  const dailyGoalXp = parseInt(userData.dailyGoalXp ?? "100", 10);

  // Get gamification stats using internal user ID (not auth ID)
  const [gamification] = await db
    .select()
    .from(userGamification)
    .where(eq(userGamification.userId, internalUserId))
    .limit(1);

  // Default gamification values if row doesn't exist yet
  const gam = gamification ?? {
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    streakFreezes: 0,
    lastActivityDate: null,
    totalReviews: 0,
    totalWordsLearned: 0,
    dailyXpEarned: 0,
    dailyGoalMet: false,
  };

  const { level, xpInLevel, xpNeeded } = calculateLevel(gam.totalXp);
  const today = new Date().toISOString().split("T")[0];
  const isActiveToday = gam.lastActivityDate === today;

  // Check if streak is at risk
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const atRisk =
    !isActiveToday &&
    gam.lastActivityDate === yesterdayStr &&
    gam.currentStreak > 0;

  // Fetch quiz stats, SRS stats, mastered words, progress, and achievement data in parallel
  const [quizStats, srsStats, totalMasteredWords, masteryMap, vocabAndChapterCounts, lastQuizScore, recentAchievementRows, achievementCounts] =
    await Promise.all([
      getQuizStatsForDashboard(internalUserId),
      getSrsStats(internalUserId),
      getTotalQuizMasteredWords(internalUserId),
      getQuizMasteredWordsAll(internalUserId),
      getVocabAndChapterCounts(),
      getLastQuizScore(internalUserId),
      getRecentAchievements(internalUserId, 5),
      getAchievementCounts(internalUserId),
    ]);

  // Count mastered chapters: chapters where mastered >= vocabCount
  let masteredChapters = 0;
  for (const [chapterId, masteredCount] of masteryMap) {
    const chapterVocab = vocabAndChapterCounts.chapterVocabMap.get(chapterId);
    if (chapterVocab && masteredCount >= chapterVocab) {
      masteredChapters++;
    }
  }

  // Reset daily counters display if new day
  const dailyXpEarned = isActiveToday ? gam.dailyXpEarned : 0;
  const dailyGoalMet = isActiveToday ? gam.dailyGoalMet : false;

  return {
    profile: {
      displayName: userData.displayName ?? "Pelajar",
      preferredName: userData.preferredName,
      avatarUrl: userData.avatarUrl,
      jlptTarget: userData.jlptTarget ?? "N5",
      dailyGoalXp,
    },
    level: {
      current: level,
      totalXp: gam.totalXp,
      xpInLevel,
      xpNeeded,
      progressPercent: xpNeeded > 0 ? Math.round((xpInLevel / xpNeeded) * 100) : 0,
    },
    streak: {
      current: gam.currentStreak,
      longest: gam.longestStreak,
      freezes: gam.streakFreezes,
      isActiveToday,
      atRisk,
    },
    daily: {
      xpEarned: dailyXpEarned,
      xpGoal: dailyGoalXp,
      goalMet: dailyGoalMet,
      progressPercent: dailyGoalXp > 0
        ? Math.min(100, Math.round((dailyXpEarned / dailyGoalXp) * 100))
        : 0,
    },
    progress: {
      totalMasteredWords,
      totalVocab: vocabAndChapterCounts.totalVocab,
      masteredChapters,
      totalChapters: vocabAndChapterCounts.totalChapters,
      quizCompleted: quizStats.completed,
      quizAvgScore: quizStats.avgScore,
      lastQuizScore,
    },
    srs: srsStats,
    recentAchievements: recentAchievementRows,
    totalAchievements: achievementCounts,
  };
}

async function getQuizStatsForDashboard(userId: string) {
  const [completedResult] = await db
    .select({ count: count() })
    .from(quizSession)
    .where(
      and(eq(quizSession.userId, userId), eq(quizSession.isCompleted, true))
    );

  const [avgResult] = await db
    .select({
      avg: avg(quizSession.scorePercent),
    })
    .from(quizSession)
    .where(
      and(eq(quizSession.userId, userId), eq(quizSession.isCompleted, true))
    );

  return {
    completed: completedResult.count,
    avgScore: avgResult.avg ? Math.round(Number(avgResult.avg)) : 0,
  };
}

async function getRecentAchievements(userId: string, limit: number) {
  const rows = await db
    .select({
      id: achievement.id,
      name: achievement.name,
      icon: achievement.icon,
      badgeColor: achievement.badgeColor,
      xpReward: achievement.xpReward,
      unlockedAt: achievementUnlock.unlockedAt,
    })
    .from(achievementUnlock)
    .innerJoin(achievement, eq(achievementUnlock.achievementId, achievement.id))
    .where(eq(achievementUnlock.userId, userId))
    .orderBy(desc(achievementUnlock.unlockedAt))
    .limit(limit);

  return rows;
}

async function getAchievementCounts(userId: string) {
  const [totalResult] = await db
    .select({ count: count() })
    .from(achievement);

  const [unlockedResult] = await db
    .select({ count: count() })
    .from(achievementUnlock)
    .where(eq(achievementUnlock.userId, userId));

  return {
    unlocked: unlockedResult.count,
    total: totalResult.count,
  };
}

async function getVocabAndChapterCounts() {
  const [vocabResult] = await db
    .select({ count: count() })
    .from(vocabulary)
    .where(eq(vocabulary.isPublished, true));

  const chapters = await db
    .select({
      id: chapter.id,
      vocabCount: chapter.vocabCount,
    })
    .from(chapter);

  const chapterVocabMap = new Map<string, number>();
  for (const c of chapters) {
    chapterVocabMap.set(c.id, c.vocabCount);
  }

  return {
    totalVocab: vocabResult.count,
    totalChapters: chapters.length,
    chapterVocabMap,
  };
}

async function getLastQuizScore(userId: string): Promise<number | null> {
  const [row] = await db
    .select({ scorePercent: quizSession.scorePercent })
    .from(quizSession)
    .where(
      and(
        eq(quizSession.userId, userId),
        eq(quizSession.isCompleted, true),
        isNotNull(quizSession.chapterId)
      )
    )
    .orderBy(desc(quizSession.completedAt))
    .limit(1);

  return row?.scorePercent != null ? Math.round(row.scorePercent) : null;
}
