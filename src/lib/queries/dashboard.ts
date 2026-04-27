import { eq, and, count, sql, desc, asc, avg, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/user";
import { userGamification, achievementUnlock, achievement, userChapterProgress } from "@/db/schema/gamification";
import { quizSession } from "@/db/schema/quiz";
import { book, chapter, vocabulary } from "@/db/schema/content";

import { getSrsStats, type SrsStats } from "./review";
import { safeQuery } from "./safe-query";
import { getTotalQuizMasteredWords, getQuizMasteredWordsAll } from "@/lib/progress/quiz-mastery";
import { checkAndUpgradeJlpt } from "@/lib/gamification/jlpt-upgrade-service";
import { validateStreak } from "@/lib/gamification/streak-service";
import { getLeechSummary } from "@/lib/services/leech-service";
import { getTodayWIB, getYesterdayWIB } from "@/lib/utils/timezone";

// Default values returned when a sub-query fails or times out.
// Dashboard renders with these instead of blocking the whole page.
const FALLBACK_SRS_STATS: SrsStats = {
  totalCards: 0,
  dueNow: 0,
  newCount: 0,
  learningCount: 0,
  reviewCount: 0,
  relearningCount: 0,
  dueLearning: 0,
  dueReview: 0,
  overdue: 0,
  nextDueAt: null,
  nextDueCount: 0,
};

const FALLBACK_LEECH = { totalLeechCards: 0, totalConfusedPairs: 0, mostDifficultWord: null };

const FALLBACK_VOCAB_COUNTS = {
  totalVocab: 0,
  totalChapters: 0,
  chapterVocabMap: new Map<string, number>(),
};

const FALLBACK_UPGRADE = { upgraded: false, previousLevel: "", newLevel: "" };

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

export interface MnnRecommendation {
  status: "continue" | "start" | "completed";
  chapterNumber: number;
  chapterSlug: string;
  vocabMastered: number;
  vocabCount: number;
  completedChapters: number;
  totalChapters: number;
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
  mnnRecommendation: MnnRecommendation | null;
  jlptUpgrade: { previousLevel: string; newLevel: string } | null;
  leechCount: number;
  confusedPairsCount: number;
}

export async function getUserJlptTarget(authUserId: string): Promise<string> {
  const [row] = await db
    .select({ jlptTarget: user.jlptTarget })
    .from(user)
    .where(eq(user.supabaseAuthId, authUserId))
    .limit(1);

  return row?.jlptTarget ?? "N5";
}

export async function getDashboardData(
  authUserId: string
): Promise<DashboardData | null> {
  const overallStart = Date.now();
  console.log(`[dashboard] getDashboardData start authUserId=${authUserId.slice(0, 8)}`);

  // Step 1: Fetch user profile — needed to resolve internal user ID before any other query.
  // This is the only query that blocks; if it fails, we can't render anything user-specific.
  const userData = await safeQuery(
    "user-profile",
    async () => {
      const [row] = await db
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
      return row ?? null;
    },
    null
  );

  if (!userData) return null;

  const internalUserId = userData.id;
  const dailyGoalXp = parseInt(userData.dailyGoalXp ?? "100", 10);
  const currentJlptTarget = userData.jlptTarget ?? "N5";

  // Shared masteryMap promise — consumed by getRecommendedChapter + checkAndUpgradeJlpt.
  // Wrapped to always resolve (empty Map on failure) so consumers don't need to handle errors.
  const masteryMapPromise: Promise<Map<string, number>> = safeQuery(
    "masteryMap",
    () => getQuizMasteredWordsAll(internalUserId),
    new Map<string, number>()
  );

  // Gamification row + streak validation. Streak validation may UPDATE — if it fails,
  // we still return the unvalidated row rather than null.
  const gamificationWithValidationPromise = safeQuery(
    "gamification+validateStreak",
    async () => {
      const [row] = await db
        .select()
        .from(userGamification)
        .where(eq(userGamification.userId, internalUserId))
        .limit(1);

      if (!row) return null;

      try {
        const validated = await validateStreak(internalUserId, {
          currentStreak: row.currentStreak,
          lastActivityDate: row.lastActivityDate,
          streakFreezes: row.streakFreezes,
        });
        return validated
          ? { ...row, currentStreak: validated.currentStreak, streakFreezes: validated.streakFreezes }
          : row;
      } catch (err) {
        // Streak validation failed — return unvalidated row rather than blocking dashboard
        console.error("[dashboard] validateStreak inner error:", err);
        return row;
      }
    },
    null
  );

  const [
    gamificationValidated,
    masteryMap,
    quizStats,
    srsStats,
    totalMasteredWords,
    vocabAndChapterCounts,
    achievementData,
    mnnRecommendation,
    leechSummary,
    upgradeResult,
  ] = await Promise.all([
    gamificationWithValidationPromise,
    masteryMapPromise,
    safeQuery("quizStats", () => getQuizStatsForDashboard(internalUserId), { completed: 0, avgScore: 0, lastScore: null }),
    safeQuery("srsStats", () => getSrsStats(internalUserId), FALLBACK_SRS_STATS),
    safeQuery("totalMasteredWords", () => getTotalQuizMasteredWords(internalUserId), 0),
    safeQuery("vocabAndChapterCounts", () => getVocabAndChapterCounts(), FALLBACK_VOCAB_COUNTS),
    safeQuery("achievements", () => getAchievementData(internalUserId), { recent: [], counts: { unlocked: 0, total: 0 } }),
    safeQuery(
      "mnnRecommendation",
      () => getRecommendedChapter(internalUserId, currentJlptTarget, masteryMapPromise),
      null
    ),
    safeQuery("leechSummary", () => getLeechSummary(internalUserId), FALLBACK_LEECH),
    safeQuery(
      "checkAndUpgradeJlpt",
      () =>
        checkAndUpgradeJlpt(internalUserId, {
          currentLevel: currentJlptTarget,
          masteryMap: masteryMapPromise,
        }),
      FALLBACK_UPGRADE
    ),
  ]);

  // Default gamification values if row doesn't exist yet
  const gam = gamificationValidated ?? {
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    streakFreezes: 0,
    lastActivityDate: null as string | null,
    totalReviews: 0,
    totalWordsLearned: 0,
    dailyXpEarned: 0,
    dailyGoalMet: false,
  };

  const { level, xpInLevel, xpNeeded } = calculateLevel(gam.totalXp);
  const today = getTodayWIB();
  const isActiveToday = gam.lastActivityDate === today;

  // Check if streak is at risk
  const yesterdayStr = getYesterdayWIB();
  const atRisk =
    !isActiveToday &&
    gam.lastActivityDate === yesterdayStr &&
    gam.currentStreak > 0;

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

  const jlptUpgrade = upgradeResult.upgraded
    ? { previousLevel: upgradeResult.previousLevel, newLevel: upgradeResult.newLevel }
    : null;

  // If upgraded, refresh the profile jlptTarget for this response
  if (jlptUpgrade) {
    userData.jlptTarget = upgradeResult.newLevel as typeof userData.jlptTarget;
  }

  const totalElapsed = Date.now() - overallStart;
  if (totalElapsed > 3000) {
    console.warn(`[dashboard] getDashboardData total elapsed: ${totalElapsed}ms`);
  }

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
      lastQuizScore: quizStats.lastScore,
    },
    srs: srsStats,
    recentAchievements: achievementData.recent,
    totalAchievements: achievementData.counts,
    mnnRecommendation,
    jlptUpgrade,
    leechCount: leechSummary.totalLeechCards,
    confusedPairsCount: leechSummary.totalConfusedPairs,
  };
}

async function getQuizStatsForDashboard(userId: string) {
  // Fetch count + avg + last score in parallel (2 queries, same connection context)
  const [[row], [lastRow]] = await Promise.all([
    db
      .select({
        count: count(),
        avg: avg(quizSession.scorePercent),
      })
      .from(quizSession)
      .where(
        and(eq(quizSession.userId, userId), eq(quizSession.isCompleted, true))
      ),
    db
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
      .limit(1),
  ]);

  return {
    completed: row?.count ?? 0,
    avgScore: row?.avg ? Math.round(Number(row.avg)) : 0,
    lastScore: lastRow?.scorePercent != null ? Math.round(lastRow.scorePercent) : null,
  };
}

async function getAchievementData(userId: string) {
  // Combine recent achievements + counts into a single function to reduce connection usage
  const [recentRows, [totalResult], [unlockedResult]] = await Promise.all([
    db
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
      .limit(5),
    db.select({ count: count() }).from(achievement),
    db
      .select({ count: count() })
      .from(achievementUnlock)
      .where(eq(achievementUnlock.userId, userId)),
  ]);

  return {
    recent: recentRows,
    counts: {
      unlocked: unlockedResult.count,
      total: totalResult.count,
    },
  };
}

async function getVocabAndChapterCounts() {
  const [[vocabResult], chapters] = await Promise.all([
    db
      .select({ count: count() })
      .from(vocabulary)
      .where(eq(vocabulary.isPublished, true)),
    db
      .select({
        id: chapter.id,
        vocabCount: chapter.vocabCount,
      })
      .from(chapter),
  ]);

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

async function getRecommendedChapter(
  userId: string,
  jlptTarget: string,
  masteryMapInput?: Map<string, number> | Promise<Map<string, number>>
): Promise<MnnRecommendation | null> {
  const targetLevel = jlptTarget as "N5" | "N4" | "N3" | "N2" | "N1";

  // Find book matching target level
  const [targetBook] = await db
    .select()
    .from(book)
    .where(eq(book.jlptLevel, targetLevel))
    .limit(1);

  if (!targetBook) return null;

  // Get chapters for this book
  const chapters = await db
    .select({
      id: chapter.id,
      chapterNumber: chapter.chapterNumber,
      slug: chapter.slug,
      vocabCount: chapter.vocabCount,
    })
    .from(chapter)
    .where(eq(chapter.bookId, targetBook.id))
    .orderBy(asc(chapter.chapterNumber));

  if (chapters.length === 0) return null;

  // Reuse shared mastery map if caller provided one — avoids duplicate aggregation
  const masteryMap =
    masteryMapInput !== undefined
      ? await masteryMapInput
      : await getQuizMasteredWordsAll(userId);

  // Compute completion per chapter
  const chaptersWithMastery = chapters.map((c) => ({
    ...c,
    vocabMastered: masteryMap.get(c.id) ?? 0,
    isCompleted: c.vocabCount > 0 && (masteryMap.get(c.id) ?? 0) >= c.vocabCount,
  }));

  const completedCount = chaptersWithMastery.filter((c) => c.isCompleted).length;
  const totalCount = chaptersWithMastery.length;

  // All completed
  if (completedCount >= totalCount && totalCount > 0) {
    const last = chaptersWithMastery[chaptersWithMastery.length - 1];
    return {
      status: "completed",
      chapterNumber: last.chapterNumber,
      chapterSlug: last.slug,
      vocabMastered: last.vocabMastered,
      vocabCount: last.vocabCount,
      completedChapters: completedCount,
      totalChapters: totalCount,
    };
  }

  // Find the most recently studied chapter via userChapterProgress.updatedAt
  const [lastStudied] = await db
    .select({
      chapterId: userChapterProgress.chapterId,
    })
    .from(userChapterProgress)
    .where(
      and(
        eq(userChapterProgress.userId, userId),
        sql`${userChapterProgress.chapterId} in (${sql.join(chapters.map((c) => sql`${c.id}`), sql`, `)})`
      )
    )
    .orderBy(desc(userChapterProgress.updatedAt))
    .limit(1);

  // If user has studied a chapter, recommend it (if incomplete) or the next one
  if (lastStudied) {
    const lastChapter = chaptersWithMastery.find((c) => c.id === lastStudied.chapterId);
    if (lastChapter && !lastChapter.isCompleted) {
      return {
        status: "continue",
        chapterNumber: lastChapter.chapterNumber,
        chapterSlug: lastChapter.slug,
        vocabMastered: lastChapter.vocabMastered,
        vocabCount: lastChapter.vocabCount,
        completedChapters: completedCount,
        totalChapters: totalCount,
      };
    }
    // Last studied is completed — find next incomplete
    const nextIncomplete = chaptersWithMastery.find((c) => !c.isCompleted);
    if (nextIncomplete) {
      return {
        status: "continue",
        chapterNumber: nextIncomplete.chapterNumber,
        chapterSlug: nextIncomplete.slug,
        vocabMastered: nextIncomplete.vocabMastered,
        vocabCount: nextIncomplete.vocabCount,
        completedChapters: completedCount,
        totalChapters: totalCount,
      };
    }
  }

  // No progress — suggest first chapter
  const first = chaptersWithMastery[0];
  return {
    status: "start",
    chapterNumber: first.chapterNumber,
    chapterSlug: first.slug,
    vocabMastered: 0,
    vocabCount: first.vocabCount,
    completedChapters: 0,
    totalChapters: totalCount,
  };
}
