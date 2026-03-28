import { eq, and, sql } from "drizzle-orm";

import { db } from "@/db";
import { quizSession, quizAnswer } from "@/db/schema/quiz";
import { vocabulary } from "@/db/schema/content";

// Count unique vocabulary IDs answered correctly in quizzes for a specific chapter
export async function getQuizMasteredWords(
  userId: string,
  chapterId: string
): Promise<number> {
  const [result] = await db
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

  return Number(result?.count ?? 0);
}

// Get mastered word counts for ALL chapters at once (efficient batch query)
export async function getQuizMasteredWordsAll(
  userId: string
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      chapterId: quizSession.chapterId,
      count: sql<number>`count(distinct ${quizAnswer.vocabularyId})`.as("count"),
    })
    .from(quizAnswer)
    .innerJoin(quizSession, eq(quizAnswer.sessionId, quizSession.id))
    .where(
      and(
        eq(quizSession.userId, userId),
        eq(quizAnswer.isCorrect, true),
        sql`${quizAnswer.vocabularyId} is not null`,
        sql`${quizSession.chapterId} is not null`
      )
    )
    .groupBy(quizSession.chapterId);

  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.chapterId) {
      map.set(row.chapterId, Number(row.count));
    }
  }
  return map;
}

// Get the SET of mastered vocabulary IDs for a specific chapter
export async function getQuizMasteredVocabIds(
  userId: string,
  chapterId: string
): Promise<Set<string>> {
  const rows = await db
    .selectDistinct({
      vocabularyId: quizAnswer.vocabularyId,
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

  const set = new Set<string>();
  for (const row of rows) {
    if (row.vocabularyId) {
      set.add(row.vocabularyId);
    }
  }
  return set;
}

// Get total mastered words across ALL chapters (for dashboard)
export async function getTotalQuizMasteredWords(
  userId: string
): Promise<number> {
  const [result] = await db
    .select({
      count: sql<number>`count(distinct ${quizAnswer.vocabularyId})`.as("count"),
    })
    .from(quizAnswer)
    .innerJoin(quizSession, eq(quizAnswer.sessionId, quizSession.id))
    .where(
      and(
        eq(quizSession.userId, userId),
        eq(quizAnswer.isCorrect, true),
        sql`${quizAnswer.vocabularyId} is not null`
      )
    );

  return Number(result?.count ?? 0);
}

// Get total mastered kana from kana quizzes (for HIRAKATA progress)
export async function getTotalQuizMasteredKana(
  userId: string
): Promise<number> {
  const [result] = await db
    .select({
      count: sql<number>`count(distinct ${quizAnswer.kanaId})`.as("count"),
    })
    .from(quizAnswer)
    .innerJoin(quizSession, eq(quizAnswer.sessionId, quizSession.id))
    .where(
      and(
        eq(quizSession.userId, userId),
        eq(quizAnswer.isCorrect, true),
        sql`${quizAnswer.kanaId} is not null`
      )
    );

  return Number(result?.count ?? 0);
}

// Get the SET of mastered kana IDs for HIRAKATA
export async function getQuizMasteredKanaIds(
  userId: string
): Promise<Set<string>> {
  const rows = await db
    .selectDistinct({
      kanaId: quizAnswer.kanaId,
    })
    .from(quizAnswer)
    .innerJoin(quizSession, eq(quizAnswer.sessionId, quizSession.id))
    .where(
      and(
        eq(quizSession.userId, userId),
        eq(quizAnswer.isCorrect, true),
        sql`${quizAnswer.kanaId} is not null`
      )
    );

  const set = new Set<string>();
  for (const row of rows) {
    if (row.kanaId) {
      set.add(row.kanaId);
    }
  }
  return set;
}
