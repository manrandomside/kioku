import { eq, and, sql, count } from "drizzle-orm";

import { db } from "@/db";
import { vocabulary } from "@/db/schema/content";
import { srsCard } from "@/db/schema/srs";
import { userChapterProgress } from "@/db/schema/gamification";
import { quizSession } from "@/db/schema/quiz";

// Recalculate and upsert chapter progress for a user
export async function updateChapterProgress(
  userId: string,
  chapterId: string
) {
  // Count SRS card statuses for vocab in this chapter
  const statusCounts = await db
    .select({
      status: srsCard.status,
      count: count(),
    })
    .from(srsCard)
    .innerJoin(vocabulary, eq(srsCard.vocabularyId, vocabulary.id))
    .where(
      and(
        eq(srsCard.userId, userId),
        eq(vocabulary.chapterId, chapterId)
      )
    )
    .groupBy(srsCard.status);

  let vocabLearning = 0;
  let vocabReview = 0;
  let vocabSeen = 0;

  for (const row of statusCounts) {
    const c = Number(row.count);
    vocabSeen += c;

    if (row.status === "learning" || row.status === "relearning") {
      vocabLearning += c;
    } else if (row.status === "review") {
      vocabReview += c;
    }
  }

  // Get total vocab count for chapter
  const [vocabTotal] = await db
    .select({ count: count() })
    .from(vocabulary)
    .where(eq(vocabulary.chapterId, chapterId));

  const totalCount = Number(vocabTotal.count);
  const completionPercent =
    totalCount > 0 ? Math.round((vocabReview / totalCount) * 100) : 0;

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

  // Upsert progress row
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
    vocabSeen,
    vocabLearning,
    vocabReview,
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
