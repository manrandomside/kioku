import { eq, and, lte, gt, sql, count, or, isNull } from "drizzle-orm";

import { db } from "@/db";
import { srsCard } from "@/db/schema/srs";
import { vocabulary, kana } from "@/db/schema/content";

export type DueCardType = "kana" | "vocabulary";

export interface DueCard {
  cardId: string;
  type: DueCardType;
  status: "new" | "learning" | "review" | "relearning";
  stability: number;
  difficulty: number;
  dueDate: string;
  scheduledDays: number;
  reps: number;
  lapses: number;
  // Kana fields (null if vocab)
  kanaId: string | null;
  character: string | null;
  kanaRomaji: string | null;
  kanaCategory: string | null;
  kanaAudioUrl: string | null;
  // Vocabulary fields (null if kana)
  vocabularyId: string | null;
  kanji: string | null;
  hiragana: string | null;
  romaji: string | null;
  meaningId: string | null;
  meaningEn: string | null;
  wordType: string | null;
  jlptLevel: string | null;
  vocabAudioUrl: string | null;
  exampleJp: string | null;
  exampleId: string | null;
}

export interface SrsStats {
  totalCards: number;
  dueNow: number;
  newCount: number;
  learningCount: number;
  reviewCount: number;
  relearningCount: number;
  dueLearning: number;
  dueReview: number;
  overdue: number;
  nextDueAt: string | null;
  nextDueCount: number;
}

export async function getDueCards(userId: string): Promise<DueCard[]> {
  const now = new Date().toISOString();

  // Get all due SRS cards with their associated kana or vocabulary data
  const rows = await db
    .select({
      cardId: srsCard.id,
      status: srsCard.status,
      stability: srsCard.stability,
      difficulty: srsCard.difficulty,
      dueDate: srsCard.dueDate,
      scheduledDays: srsCard.scheduledDays,
      reps: srsCard.reps,
      lapses: srsCard.lapses,
      kanaId: srsCard.kanaId,
      character: kana.character,
      kanaRomaji: kana.romaji,
      kanaCategory: kana.category,
      kanaAudioUrl: kana.audioUrl,
      vocabularyId: srsCard.vocabularyId,
      kanji: vocabulary.kanji,
      hiragana: vocabulary.hiragana,
      romaji: vocabulary.romaji,
      meaningId: vocabulary.meaningId,
      meaningEn: vocabulary.meaningEn,
      wordType: vocabulary.wordType,
      jlptLevel: vocabulary.jlptLevel,
      vocabAudioUrl: vocabulary.audioUrl,
      exampleJp: vocabulary.exampleJp,
      exampleId: vocabulary.exampleId,
    })
    .from(srsCard)
    .leftJoin(kana, eq(srsCard.kanaId, kana.id))
    .leftJoin(vocabulary, eq(srsCard.vocabularyId, vocabulary.id))
    .where(
      and(
        eq(srsCard.userId, userId),
        lte(srsCard.dueDate, now),
        or(eq(vocabulary.isPublished, true), isNull(srsCard.vocabularyId))
      )
    )
    .orderBy(srsCard.dueDate);

  return rows.map((row) => ({
    ...row,
    type: (row.kanaId ? "kana" : "vocabulary") as DueCardType,
  }));
}

export async function getSrsStats(userId: string): Promise<SrsStats> {
  const now = new Date().toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Run 5 independent aggregates in parallel
  const [
    [totalResult],
    [dueResult],
    statusCounts,
    dueBreakdown,
    [overdueResult],
    [nextDueResult],
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(srsCard)
      .where(eq(srsCard.userId, userId)),
    db
      .select({ count: count() })
      .from(srsCard)
      .where(and(eq(srsCard.userId, userId), lte(srsCard.dueDate, now))),
    db
      .select({
        status: srsCard.status,
        count: count(),
      })
      .from(srsCard)
      .where(eq(srsCard.userId, userId))
      .groupBy(srsCard.status),
    db
      .select({
        status: srsCard.status,
        count: count(),
      })
      .from(srsCard)
      .where(
        and(
          eq(srsCard.userId, userId),
          lte(srsCard.dueDate, now),
          sql`${srsCard.status} != 'new'`
        )
      )
      .groupBy(srsCard.status),
    db
      .select({ count: count() })
      .from(srsCard)
      .where(
        and(
          eq(srsCard.userId, userId),
          lte(srsCard.dueDate, oneDayAgo),
          sql`${srsCard.status} != 'new'`
        )
      ),
    db
      .select({ nextDue: sql<string>`min(${srsCard.dueDate})` })
      .from(srsCard)
      .where(
        and(
          eq(srsCard.userId, userId),
          gt(srsCard.dueDate, now),
          sql`${srsCard.status} != 'new'`
        )
      ),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of statusCounts) {
    statusMap[row.status] = row.count;
  }

  const dueStatusMap: Record<string, number> = {};
  for (const row of dueBreakdown) {
    dueStatusMap[row.status] = row.count;
  }

  // Next-due-count query depends on nextDueAt from previous batch, so it runs after
  const nextDueAt = nextDueResult?.nextDue ?? null;
  let nextDueCount = 0;

  if (nextDueAt) {
    const [nextDueCountResult] = await db
      .select({ count: count() })
      .from(srsCard)
      .where(
        and(
          eq(srsCard.userId, userId),
          eq(srsCard.dueDate, nextDueAt),
          sql`${srsCard.status} != 'new'`
        )
      );
    nextDueCount = nextDueCountResult?.count ?? 0;
  }

  return {
    totalCards: totalResult.count,
    dueNow: dueResult.count,
    newCount: statusMap["new"] ?? 0,
    learningCount: statusMap["learning"] ?? 0,
    reviewCount: statusMap["review"] ?? 0,
    relearningCount: statusMap["relearning"] ?? 0,
    dueLearning: (dueStatusMap["learning"] ?? 0) + (dueStatusMap["relearning"] ?? 0),
    dueReview: dueStatusMap["review"] ?? 0,
    overdue: overdueResult?.count ?? 0,
    nextDueAt,
    nextDueCount,
  };
}
