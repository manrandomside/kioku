import { eq, and, notInArray, count, sql, gte } from "drizzle-orm";

import { db } from "@/db";
import {
  achievement,
  achievementUnlock,
  userGamification,
  userChapterProgress,
} from "@/db/schema/gamification";
import { quizSession } from "@/db/schema/quiz";
import { srsCard } from "@/db/schema/srs";
import { kana } from "@/db/schema/content";

import { type AwardXpResult } from "./xp-service";

export interface UnlockedAchievement {
  id: string;
  name: string;
  nameEn: string | null;
  description: string;
  icon: string;
  badgeColor: string | null;
  type: string;
  xpReward: number;
}

// Condition shape stored in JSONB
interface AchievementCondition {
  type: string;
  value?: number | string;
  max_time_ms?: number;
  category?: string;
  before_hour?: number;
  after_hour?: number;
}

// Check all achievements and unlock any newly qualified ones
export async function checkAndUnlockAchievements(
  userId: string
): Promise<UnlockedAchievement[]> {
  // Get already unlocked achievement IDs
  const unlocked = await db
    .select({ achievementId: achievementUnlock.achievementId })
    .from(achievementUnlock)
    .where(eq(achievementUnlock.userId, userId));

  const unlockedIds = unlocked.map((u) => u.achievementId);

  // Get all achievements not yet unlocked
  const candidates =
    unlockedIds.length > 0
      ? await db
          .select()
          .from(achievement)
          .where(notInArray(achievement.id, unlockedIds))
          .orderBy(achievement.sortOrder)
      : await db
          .select()
          .from(achievement)
          .orderBy(achievement.sortOrder);

  if (candidates.length === 0) return [];

  // Get user gamification stats
  const [stats] = await db
    .select()
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  if (!stats) return [];

  // Batch-fetch contextual data needed for condition checks
  const [quizStats, chapterStats, kanaStats, speedQuiz] = await Promise.all([
    getQuizStats(userId),
    getChapterCompleteCount(userId),
    getKanaLearnedStats(userId),
    getLatestQuizSpeed(userId),
  ]);

  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay(); // 0=Sunday, 6=Saturday

  const newlyUnlocked: UnlockedAchievement[] = [];

  for (const ach of candidates) {
    const cond = ach.condition as AchievementCondition;
    let qualified = false;

    switch (cond.type) {
      case "streak":
        qualified = stats.currentStreak >= (cond.value as number);
        break;

      case "words_learned":
        qualified = stats.totalWordsLearned >= (cond.value as number);
        break;

      case "review_count":
        qualified = stats.totalReviews >= (cond.value as number);
        break;

      case "level_reach":
        qualified = stats.currentLevel >= (cond.value as number);
        break;

      case "quiz_complete":
        qualified = quizStats.totalCompleted >= (cond.value as number);
        break;

      case "perfect_quiz":
        qualified = quizStats.totalPerfect >= (cond.value as number);
        break;

      case "quiz_speed":
        qualified =
          speedQuiz !== null &&
          speedQuiz.timeSpentMs !== null &&
          speedQuiz.isPerfect &&
          speedQuiz.timeSpentMs <= (cond.max_time_ms as number);
        break;

      case "chapter_complete":
        qualified = chapterStats >= (cond.value as number);
        break;

      case "jlpt_complete":
        // Handled by checking all chapters of a JLPT level are 100%
        // For now, map to chapter complete count thresholds
        if (cond.value === "N5") qualified = chapterStats >= 25;
        if (cond.value === "N4") qualified = chapterStats >= 50;
        break;

      case "kana_complete":
        if (cond.category === "hiragana") qualified = kanaStats.hiraganaComplete;
        else if (cond.category === "katakana") qualified = kanaStats.katakanaComplete;
        else if (cond.category === "all") qualified = kanaStats.hiraganaComplete && kanaStats.katakanaComplete;
        break;

      case "time_of_day":
        if (cond.before_hour !== undefined) qualified = currentHour < cond.before_hour;
        if (cond.after_hour !== undefined) qualified = currentHour >= cond.after_hour;
        break;

      case "weekend_activity":
        qualified = currentDay === 0 || currentDay === 6;
        break;
    }

    if (qualified) {
      newlyUnlocked.push({
        id: ach.id,
        name: ach.name,
        nameEn: ach.nameEn,
        description: ach.description,
        icon: ach.icon,
        badgeColor: ach.badgeColor,
        type: ach.type,
        xpReward: ach.xpReward,
      });
    }
  }

  // Insert unlock records and award XP for each
  if (newlyUnlocked.length > 0) {
    await db.insert(achievementUnlock).values(
      newlyUnlocked.map((ach) => ({
        userId,
        achievementId: ach.id,
        unlockedAt: new Date().toISOString(),
      }))
    );

    // Award achievement XP (import inline to avoid circular dependency)
    const { awardAchievementXp } = await import("./xp-service");
    for (const ach of newlyUnlocked) {
      if (ach.xpReward > 0) {
        await awardAchievementXp(userId, ach.xpReward, ach.name, ach.id);
      }
    }
  }

  return newlyUnlocked;
}

// Get all achievements with unlock status for a user
export async function getAllAchievementsWithStatus(userId: string) {
  const allAchievements = await db
    .select()
    .from(achievement)
    .orderBy(achievement.sortOrder);

  const unlocks = await db
    .select({
      achievementId: achievementUnlock.achievementId,
      unlockedAt: achievementUnlock.unlockedAt,
    })
    .from(achievementUnlock)
    .where(eq(achievementUnlock.userId, userId));

  const unlockMap = new Map(
    unlocks.map((u) => [u.achievementId, u.unlockedAt])
  );

  const totalUnlocked = unlocks.length;

  return {
    achievements: allAchievements.map((ach) => ({
      id: ach.id,
      name: ach.name,
      nameEn: ach.nameEn,
      description: ach.description,
      icon: ach.icon,
      badgeColor: ach.badgeColor,
      type: ach.type,
      condition: ach.condition as AchievementCondition,
      xpReward: ach.xpReward,
      sortOrder: ach.sortOrder,
      isUnlocked: unlockMap.has(ach.id),
      unlockedAt: unlockMap.get(ach.id) ?? null,
    })),
    totalCount: allAchievements.length,
    unlockedCount: totalUnlocked,
  };
}

// Helper: quiz completion and perfect stats
async function getQuizStats(userId: string) {
  const [completed] = await db
    .select({ count: count() })
    .from(quizSession)
    .where(
      and(eq(quizSession.userId, userId), eq(quizSession.isCompleted, true))
    );

  const [perfect] = await db
    .select({ count: count() })
    .from(quizSession)
    .where(
      and(
        eq(quizSession.userId, userId),
        eq(quizSession.isCompleted, true),
        eq(quizSession.isPerfect, true)
      )
    );

  return {
    totalCompleted: completed.count,
    totalPerfect: perfect.count,
  };
}

// Helper: count chapters with 100% completion
async function getChapterCompleteCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(userChapterProgress)
    .where(
      and(
        eq(userChapterProgress.userId, userId),
        gte(userChapterProgress.completionPercent, 100)
      )
    );

  return result.count;
}

// Helper: latest quiz speed (for speed achievements)
async function getLatestQuizSpeed(userId: string) {
  const [latest] = await db
    .select({
      timeSpentMs: quizSession.timeSpentMs,
      isPerfect: quizSession.isPerfect,
    })
    .from(quizSession)
    .where(
      and(eq(quizSession.userId, userId), eq(quizSession.isCompleted, true))
    )
    .orderBy(sql`${quizSession.completedAt} DESC`)
    .limit(1);

  return latest ?? null;
}

// Helper: kana learned stats (check if all hiragana/katakana SRS cards are in review status)
async function getKanaLearnedStats(userId: string) {
  // Count total kana per category group
  const hiraganaCategories = [
    "hiragana_basic",
    "hiragana_dakuten",
    "hiragana_combo",
  ] as const;
  const katakanaCategories = [
    "katakana_basic",
    "katakana_dakuten",
    "katakana_combo",
  ] as const;

  const [totalHiragana] = await db
    .select({ count: count() })
    .from(kana)
    .where(
      sql`${kana.category} IN ('hiragana_basic', 'hiragana_dakuten', 'hiragana_combo')`
    );

  const [totalKatakana] = await db
    .select({ count: count() })
    .from(kana)
    .where(
      sql`${kana.category} IN ('katakana_basic', 'katakana_dakuten', 'katakana_combo')`
    );

  // Count kana SRS cards in review status (mastered)
  const [learnedHiragana] = await db
    .select({ count: count() })
    .from(srsCard)
    .innerJoin(kana, eq(srsCard.kanaId, kana.id))
    .where(
      and(
        eq(srsCard.userId, userId),
        eq(srsCard.status, "review"),
        sql`${kana.category} IN ('hiragana_basic', 'hiragana_dakuten', 'hiragana_combo')`
      )
    );

  const [learnedKatakana] = await db
    .select({ count: count() })
    .from(srsCard)
    .innerJoin(kana, eq(srsCard.kanaId, kana.id))
    .where(
      and(
        eq(srsCard.userId, userId),
        eq(srsCard.status, "review"),
        sql`${kana.category} IN ('katakana_basic', 'katakana_dakuten', 'katakana_combo')`
      )
    );

  return {
    hiraganaComplete:
      totalHiragana.count > 0 && learnedHiragana.count >= totalHiragana.count,
    katakanaComplete:
      totalKatakana.count > 0 && learnedKatakana.count >= totalKatakana.count,
  };
}
