import { eq, and, sql, desc, count } from "drizzle-orm";

import { db } from "@/db";
import { srsCard, reviewLog } from "@/db/schema/srs";
import { vocabulary, chapter } from "@/db/schema/content";
import { quizSession, quizAnswer } from "@/db/schema/quiz";

export interface LeechCard {
  srsCardId: string;
  vocabularyId: string;
  kanji: string | null;
  hiragana: string;
  romaji: string;
  meaningId: string;
  audioUrl: string | null;
  chapterNumber: number;
  lapses: number;
  lastReview: string | null;
  difficulty: number;
  status: string;
}

export interface ConfusedPairWord {
  vocabularyId: string;
  kanji: string | null;
  hiragana: string;
  meaningId: string;
  audioUrl: string | null;
}

export interface ConfusedPair {
  wordA: ConfusedPairWord;
  wordB: ConfusedPairWord;
  confusionCount: number;
  explanation: string | null;
}

export interface LeechSummary {
  totalLeechCards: number;
  totalConfusedPairs: number;
  mostDifficultWord: {
    hiragana: string;
    meaningId: string;
    lapses: number;
  } | null;
}

// Question types where options are Japanese words (user picks a Japanese word)
const JP_OPTION_TYPES = ["meaning_to_word", "audio_to_word"];

// Question types where options are meanings (user picks a meaning)
const MEANING_OPTION_TYPES = ["word_to_meaning", "audio_to_meaning"];

// All multiple choice types we consider for confused pairs
const MC_TYPES = [...JP_OPTION_TYPES, ...MEANING_OPTION_TYPES];

export async function getLeechCards(userId: string): Promise<LeechCard[]> {
  const rows = await db
    .select({
      srsCardId: srsCard.id,
      vocabularyId: srsCard.vocabularyId,
      kanji: vocabulary.kanji,
      hiragana: vocabulary.hiragana,
      romaji: vocabulary.romaji,
      meaningId: vocabulary.meaningId,
      audioUrl: vocabulary.audioUrl,
      chapterNumber: chapter.chapterNumber,
      lapses: srsCard.lapses,
      difficulty: srsCard.difficulty,
      status: srsCard.status,
      updatedAt: srsCard.updatedAt,
    })
    .from(srsCard)
    .innerJoin(vocabulary, eq(srsCard.vocabularyId, vocabulary.id))
    .innerJoin(chapter, eq(vocabulary.chapterId, chapter.id))
    .where(
      and(
        eq(srsCard.userId, userId),
        sql`${srsCard.lapses} >= 4`,
        sql`${srsCard.vocabularyId} IS NOT NULL`
      )
    )
    .orderBy(desc(srsCard.lapses), desc(srsCard.difficulty));

  // For each card, find the last review timestamp
  const cardIds = rows.map((r) => r.srsCardId);

  let lastReviewMap = new Map<string, string>();
  if (cardIds.length > 0) {
    const reviewRows = await db
      .select({
        cardId: reviewLog.cardId,
        lastReview: sql<string>`MAX(${reviewLog.reviewedAt})`,
      })
      .from(reviewLog)
      .where(
        sql`${reviewLog.cardId} IN (${sql.join(
          cardIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      )
      .groupBy(reviewLog.cardId);

    lastReviewMap = new Map(reviewRows.map((r) => [r.cardId, r.lastReview]));
  }

  return rows.map((row) => ({
    srsCardId: row.srsCardId,
    vocabularyId: row.vocabularyId!,
    kanji: row.kanji,
    hiragana: row.hiragana!,
    romaji: row.romaji!,
    meaningId: row.meaningId!,
    audioUrl: row.audioUrl,
    chapterNumber: row.chapterNumber,
    lapses: row.lapses,
    lastReview: lastReviewMap.get(row.srsCardId) ?? null,
    difficulty: row.difficulty,
    status: row.status,
  }));
}

export async function getConfusedPairs(userId: string): Promise<ConfusedPair[]> {
  // Get aggregated wrong answers grouped by (correct vocab, user answer, question type)
  const wrongAnswerGroups = await db
    .select({
      vocabularyId: quizAnswer.vocabularyId,
      userAnswer: quizAnswer.userAnswer,
      questionType: quizAnswer.questionType,
      confusionCount: count(),
    })
    .from(quizAnswer)
    .innerJoin(quizSession, eq(quizAnswer.sessionId, quizSession.id))
    .where(
      and(
        eq(quizSession.userId, userId),
        eq(quizAnswer.isCorrect, false),
        sql`${quizAnswer.vocabularyId} IS NOT NULL`,
        sql`${quizAnswer.userAnswer} IS NOT NULL`,
        sql`${quizAnswer.questionType} IN (${sql.join(
          MC_TYPES.map((t) => sql`${t}`),
          sql`, `
        )})`
      )
    )
    .groupBy(quizAnswer.vocabularyId, quizAnswer.userAnswer, quizAnswer.questionType)
    .having(sql`COUNT(*) >= 2`)
    .orderBy(desc(count()));

  if (wrongAnswerGroups.length === 0) return [];

  // Collect all vocabulary IDs we need (correct words)
  const correctVocabIds = new Set(
    wrongAnswerGroups.map((g) => g.vocabularyId!).filter(Boolean)
  );

  // Fetch all vocabulary data we might need
  const allVocab = await db
    .select({
      id: vocabulary.id,
      kanji: vocabulary.kanji,
      hiragana: vocabulary.hiragana,
      meaningId: vocabulary.meaningId,
      audioUrl: vocabulary.audioUrl,
    })
    .from(vocabulary)
    .where(eq(vocabulary.isPublished, true));

  // Build lookup maps
  const vocabById = new Map(allVocab.map((v) => [v.id, v]));
  const vocabByKanji = new Map<string, typeof allVocab[0]>();
  const vocabByHiragana = new Map<string, typeof allVocab[0]>();
  const vocabByMeaning = new Map<string, typeof allVocab[0]>();

  for (const v of allVocab) {
    if (v.kanji) vocabByKanji.set(v.kanji, v);
    vocabByHiragana.set(v.hiragana!, v);
    vocabByMeaning.set(v.meaningId!, v);
  }

  // Build confused pairs
  const pairMap = new Map<string, ConfusedPair>();

  for (const group of wrongAnswerGroups) {
    const correctVocab = vocabById.get(group.vocabularyId!);
    if (!correctVocab) continue;

    // Try to match userAnswer to a vocabulary
    let confusedVocab: typeof allVocab[0] | undefined;

    if (JP_OPTION_TYPES.includes(group.questionType)) {
      // User answer is Japanese text
      confusedVocab =
        vocabByKanji.get(group.userAnswer!) ??
        vocabByHiragana.get(group.userAnswer!);
    } else if (MEANING_OPTION_TYPES.includes(group.questionType)) {
      // User answer is Indonesian meaning
      confusedVocab = vocabByMeaning.get(group.userAnswer!);
    }

    if (!confusedVocab) continue;
    if (confusedVocab.id === correctVocab.id) continue;

    // Normalize pair key so A-B and B-A merge
    const ids = [correctVocab.id, confusedVocab.id].sort();
    const pairKey = `${ids[0]}:${ids[1]}`;

    const existing = pairMap.get(pairKey);
    if (existing) {
      existing.confusionCount += group.confusionCount;
    } else {
      pairMap.set(pairKey, {
        wordA: {
          vocabularyId: correctVocab.id,
          kanji: correctVocab.kanji,
          hiragana: correctVocab.hiragana!,
          meaningId: correctVocab.meaningId!,
          audioUrl: correctVocab.audioUrl,
        },
        wordB: {
          vocabularyId: confusedVocab.id,
          kanji: confusedVocab.kanji,
          hiragana: confusedVocab.hiragana!,
          meaningId: confusedVocab.meaningId!,
          audioUrl: confusedVocab.audioUrl,
        },
        confusionCount: group.confusionCount,
        explanation: null,
      });
    }
  }

  return Array.from(pairMap.values()).sort(
    (a, b) => b.confusionCount - a.confusionCount
  );
}

// Extended leech card with extra fields needed for flashcard + quiz training
export interface LeechCardFull extends LeechCard {
  meaningEn: string;
  wordType: string;
  jlptLevel: string;
  exampleJp: string | null;
  exampleId: string | null;
  sortOrder: number;
}

export async function getLeechCardsForTraining(
  userId: string,
  vocabId?: string
): Promise<LeechCardFull[]> {
  const conditions = [
    eq(srsCard.userId, userId),
    sql`${srsCard.lapses} >= 4`,
    sql`${srsCard.vocabularyId} IS NOT NULL`,
  ];

  if (vocabId) {
    conditions.push(eq(srsCard.vocabularyId, vocabId));
  }

  const rows = await db
    .select({
      srsCardId: srsCard.id,
      vocabularyId: srsCard.vocabularyId,
      kanji: vocabulary.kanji,
      hiragana: vocabulary.hiragana,
      romaji: vocabulary.romaji,
      meaningId: vocabulary.meaningId,
      meaningEn: vocabulary.meaningEn,
      wordType: vocabulary.wordType,
      jlptLevel: vocabulary.jlptLevel,
      audioUrl: vocabulary.audioUrl,
      exampleJp: vocabulary.exampleJp,
      exampleId: vocabulary.exampleId,
      sortOrder: vocabulary.sortOrder,
      chapterNumber: chapter.chapterNumber,
      chapterId: vocabulary.chapterId,
      lapses: srsCard.lapses,
      difficulty: srsCard.difficulty,
      status: srsCard.status,
    })
    .from(srsCard)
    .innerJoin(vocabulary, eq(srsCard.vocabularyId, vocabulary.id))
    .innerJoin(chapter, eq(vocabulary.chapterId, chapter.id))
    .where(and(...conditions))
    .orderBy(desc(srsCard.lapses), desc(srsCard.difficulty));

  return rows.map((row) => ({
    srsCardId: row.srsCardId,
    vocabularyId: row.vocabularyId!,
    kanji: row.kanji,
    hiragana: row.hiragana!,
    romaji: row.romaji!,
    meaningId: row.meaningId!,
    meaningEn: row.meaningEn,
    wordType: row.wordType,
    jlptLevel: row.jlptLevel,
    audioUrl: row.audioUrl,
    exampleJp: row.exampleJp,
    exampleId: row.exampleId,
    sortOrder: row.sortOrder,
    chapterNumber: row.chapterNumber,
    lapses: row.lapses,
    lastReview: null,
    difficulty: row.difficulty,
    status: row.status,
  }));
}

// Get vocabulary from same chapters as leech cards (for distractor pool)
export async function getChapterVocabPool(
  chapterNumbers: number[]
): Promise<{ id: string; kanji: string | null; hiragana: string; meaningId: string; audioUrl: string | null }[]> {
  if (chapterNumbers.length === 0) return [];

  const rows = await db
    .select({
      id: vocabulary.id,
      kanji: vocabulary.kanji,
      hiragana: vocabulary.hiragana,
      meaningId: vocabulary.meaningId,
      audioUrl: vocabulary.audioUrl,
    })
    .from(vocabulary)
    .innerJoin(chapter, eq(vocabulary.chapterId, chapter.id))
    .where(
      and(
        eq(vocabulary.isPublished, true),
        sql`${chapter.chapterNumber} IN (${sql.join(
          chapterNumbers.map((n) => sql`${n}`),
          sql`, `
        )})`
      )
    );

  return rows.map((r) => ({
    id: r.id,
    kanji: r.kanji,
    hiragana: r.hiragana!,
    meaningId: r.meaningId!,
    audioUrl: r.audioUrl,
  }));
}

export async function getLeechSummary(userId: string): Promise<LeechSummary> {
  // Get leech count and most difficult word in one query
  const leechRows = await db
    .select({
      hiragana: vocabulary.hiragana,
      meaningId: vocabulary.meaningId,
      lapses: srsCard.lapses,
    })
    .from(srsCard)
    .innerJoin(vocabulary, eq(srsCard.vocabularyId, vocabulary.id))
    .where(
      and(
        eq(srsCard.userId, userId),
        sql`${srsCard.lapses} >= 4`,
        sql`${srsCard.vocabularyId} IS NOT NULL`
      )
    )
    .orderBy(desc(srsCard.lapses))
    .limit(1);

  const [leechCountResult] = await db
    .select({ count: count() })
    .from(srsCard)
    .where(
      and(
        eq(srsCard.userId, userId),
        sql`${srsCard.lapses} >= 4`,
        sql`${srsCard.vocabularyId} IS NOT NULL`
      )
    );

  // Get confused pairs count (lightweight — just count distinct pairs)
  const wrongAnswerGroups = await db
    .select({
      vocabularyId: quizAnswer.vocabularyId,
      userAnswer: quizAnswer.userAnswer,
      questionType: quizAnswer.questionType,
      cnt: count(),
    })
    .from(quizAnswer)
    .innerJoin(quizSession, eq(quizAnswer.sessionId, quizSession.id))
    .where(
      and(
        eq(quizSession.userId, userId),
        eq(quizAnswer.isCorrect, false),
        sql`${quizAnswer.vocabularyId} IS NOT NULL`,
        sql`${quizAnswer.userAnswer} IS NOT NULL`,
        sql`${quizAnswer.questionType} IN (${sql.join(
          MC_TYPES.map((t) => sql`${t}`),
          sql`, `
        )})`
      )
    )
    .groupBy(quizAnswer.vocabularyId, quizAnswer.userAnswer, quizAnswer.questionType)
    .having(sql`COUNT(*) >= 2`);

  // Approximate confused pairs count (upper bound, actual may be less due to matching)
  const confusedPairsCount = wrongAnswerGroups.length;

  const mostDifficult = leechRows[0]
    ? {
        hiragana: leechRows[0].hiragana!,
        meaningId: leechRows[0].meaningId!,
        lapses: leechRows[0].lapses,
      }
    : null;

  return {
    totalLeechCards: leechCountResult.count,
    totalConfusedPairs: confusedPairsCount,
    mostDifficultWord: mostDifficult,
  };
}
