import { eq, and, sql, count } from "drizzle-orm";

import { db } from "@/db";
import { vocabulary } from "@/db/schema/content";
import { userChapterProgress } from "@/db/schema/gamification";
import { quizSession, quizAnswer } from "@/db/schema/quiz";

// Recalculate and upsert chapter progress for a user (quiz-based mastery)
export async function updateChapterProgress(
  userId: string,
  chapterId: string
) {
  // Count unique vocabulary IDs answered correctly in quizzes for this chapter
  const [masteredResult] = await db
    .select({
      count: sql<number>`count(distinct ${quizAnswer.vocabularyId})`.as("count"),
    })
    .from(quizAnswer)
    .innerJoin(quizSession, eq(quizAnswer.sessionId, quizSession.id))
    .where(
      and(
        eq(quizSession.userId, userId),
        eq(quizSession.chapterId, chapterId),
        eq(quizAnswer.isCorrect, true),
        sql`${quizAnswer.vocabularyId} is not null`
      )
    );

  const vocabMastered = Number(masteredResult?.count ?? 0);

  // Get total vocab count for chapter
  const [vocabTotal] = await db
    .select({ count: count() })
    .from(vocabulary)
    .where(and(eq(vocabulary.chapterId, chapterId), eq(vocabulary.isPublished, true)));

  const totalCount = Number(vocabTotal.count);
  const completionPercent =
    totalCount > 0 ? Math.round((vocabMastered / totalCount) * 100) : 0;

  // Get best quiz score for this chapter
  const [bestQuiz] = await db
    .select({
      bestScore: sql<number>`max(${quizSession.scorePercent})`.as("best_score"),
    })
    .from(quizSession)
    .where(
      and(
        eq(quizSession.userId, userId),
        eq(quizSession.chapterId, chapterId),
        eq(quizSession.isCompleted, true)
      )
    );

  const bestQuizScore = bestQuiz?.bestScore != null
    ? Math.round(bestQuiz.bestScore)
    : null;

  // Upsert progress row — reuse vocabSeen/vocabLearning/vocabReview columns:
  // vocabReview = mastered count (quiz-based)
  // vocabSeen = mastered count (same, for backwards compat)
  // vocabLearning = 0 (not used in quiz-based system)
  const existing = await db
    .select({ id: userChapterProgress.id })
    .from(userChapterProgress)
    .where(
      and(
        eq(userChapterProgress.userId, userId),
        eq(userChapterProgress.chapterId, chapterId)
      )
    )
    .limit(1);

  const progressData = {
    vocabSeen: vocabMastered,
    vocabLearning: 0,
    vocabReview: vocabMastered,
    completionPercent,
    bestQuizScore,
    updatedAt: new Date().toISOString(),
  };

  if (existing.length > 0) {
    await db
      .update(userChapterProgress)
      .set(progressData)
      .where(eq(userChapterProgress.id, existing[0].id));
  } else {
    await db.insert(userChapterProgress).values({
      userId,
      chapterId,
      ...progressData,
    });
  }
}

// Resolve chapterId from a vocabularyId
export async function getChapterIdFromVocabulary(
  vocabularyId: string
): Promise<string | null> {
  const [row] = await db
    .select({ chapterId: vocabulary.chapterId })
    .from(vocabulary)
    .where(eq(vocabulary.id, vocabularyId))
    .limit(1);

  return row?.chapterId ?? null;
}
