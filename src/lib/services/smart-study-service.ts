import { eq, and, lte, sql, asc, notInArray, ne, count } from "drizzle-orm";

import { db } from "@/db";
import { srsCard } from "@/db/schema/srs";
import { vocabulary, kana, chapter, book } from "@/db/schema/content";
import { user } from "@/db/schema/user";
import { userGamification } from "@/db/schema/gamification";

import { getTodayWIB } from "@/lib/utils/timezone";
import {
  buildQuestion,
  shuffle,
} from "@/lib/quiz/vocab-quiz-generator";
import type { VocabularyWithSrs } from "@/types/vocabulary";
import type { VocabQuizQuestion, VocabQuestionType } from "@/types/vocab-quiz";

// Time estimates in seconds
const SECONDS_PER_REVIEW = 30;
const SECONDS_PER_NEW_WORD = 45;
const SECONDS_PER_QUIZ = 20;

const MAX_REVIEW_CARDS = 15;
const MAX_NEW_WORDS = 5;
const QUIZ_QUESTION_COUNT = 8;

// Allowed quiz types for smart study (exclude matching and speaking — too slow)
const SMART_QUIZ_TYPES: VocabQuestionType[] = [
  "meaning_to_word",
  "word_to_meaning",
  "audio_to_word",
  "audio_to_meaning",
  "fill_in_blank",
];

export interface SmartStudyReviewCard {
  cardId: string;
  status: string;
  stability: number;
  difficulty: number;
  dueDate: string;
  scheduledDays: number;
  reps: number;
  lapses: number;
  vocabularyId: string | null;
  kanaId: string | null;
  vocabulary: {
    id: string;
    kanji: string | null;
    hiragana: string;
    romaji: string;
    meaningId: string;
    meaningEn: string;
    wordType: string;
    audioUrl: string | null;
    exampleJp: string | null;
    exampleId: string | null;
  } | null;
  kana: {
    id: string;
    character: string;
    romaji: string;
    category: string;
    audioUrl: string | null;
  } | null;
}

export interface SmartStudyNewWord {
  vocabulary: {
    id: string;
    kanji: string | null;
    hiragana: string;
    romaji: string;
    meaningId: string;
    meaningEn: string;
    wordType: string;
    jlptLevel: string;
    audioUrl: string | null;
    exampleJp: string | null;
    exampleId: string | null;
    sortOrder: number;
  };
  fromChapter: {
    id: string;
    chapterNumber: number;
    bookId: string;
  };
}

export interface SmartStudySession {
  reviewCards: SmartStudyReviewCard[];
  newWords: SmartStudyNewWord[];
  quizQuestions: VocabQuizQuestion[];
  estimatedMinutes: number;
  summary: {
    reviewCount: number;
    newWordsCount: number;
    quizCount: number;
    activeChapter: {
      id: string;
      chapterNumber: number;
      title: string | null;
    } | null;
  };
}

export interface SmartSessionStatus {
  hasReviewCards: boolean;
  reviewCount: number;
  hasNewWords: boolean;
  newWordsCount: number;
  quizCount: number;
  estimatedMinutes: number;
  activeChapterNumber: number | null;
  dailyGoalMet: boolean;
}

// Phase 1: Get due review cards (max 15, most urgent first)
async function getReviewCards(userId: string): Promise<SmartStudyReviewCard[]> {
  const now = new Date().toISOString();

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
      vocabularyId: srsCard.vocabularyId,
      kanaId: srsCard.kanaId,
      // Vocabulary fields
      vocabId: vocabulary.id,
      vocabKanji: vocabulary.kanji,
      vocabHiragana: vocabulary.hiragana,
      vocabRomaji: vocabulary.romaji,
      vocabMeaningId: vocabulary.meaningId,
      vocabMeaningEn: vocabulary.meaningEn,
      vocabWordType: vocabulary.wordType,
      vocabAudioUrl: vocabulary.audioUrl,
      vocabExampleJp: vocabulary.exampleJp,
      vocabExampleId: vocabulary.exampleId,
      // Kana fields
      kanaCharId: kana.id,
      kanaCharacter: kana.character,
      kanaRomaji: kana.romaji,
      kanaCategory: kana.category,
      kanaAudioUrl: kana.audioUrl,
    })
    .from(srsCard)
    .leftJoin(vocabulary, eq(srsCard.vocabularyId, vocabulary.id))
    .leftJoin(kana, eq(srsCard.kanaId, kana.id))
    .where(
      and(
        eq(srsCard.userId, userId),
        lte(srsCard.dueDate, now),
        ne(srsCard.status, "new")
      )
    )
    .orderBy(asc(srsCard.dueDate))
    .limit(MAX_REVIEW_CARDS);

  return rows.map((row) => ({
    cardId: row.cardId,
    status: row.status,
    stability: row.stability,
    difficulty: row.difficulty,
    dueDate: row.dueDate,
    scheduledDays: row.scheduledDays,
    reps: row.reps,
    lapses: row.lapses,
    vocabularyId: row.vocabularyId,
    kanaId: row.kanaId,
    vocabulary: row.vocabId
      ? {
          id: row.vocabId,
          kanji: row.vocabKanji,
          hiragana: row.vocabHiragana!,
          romaji: row.vocabRomaji!,
          meaningId: row.vocabMeaningId!,
          meaningEn: row.vocabMeaningEn!,
          wordType: row.vocabWordType!,
          audioUrl: row.vocabAudioUrl,
          exampleJp: row.vocabExampleJp,
          exampleId: row.vocabExampleId,
        }
      : null,
    kana: row.kanaCharId
      ? {
          id: row.kanaCharId,
          character: row.kanaCharacter!,
          romaji: row.kanaRomaji!,
          category: row.kanaCategory!,
          audioUrl: row.kanaAudioUrl,
        }
      : null,
  }));
}

// Phase 2: Determine active chapter and get new words
async function getActiveChapterAndNewWords(
  userId: string
): Promise<{
  newWords: SmartStudyNewWord[];
  activeChapter: { id: string; chapterNumber: number; title: string | null } | null;
}> {
  // Get user's JLPT target
  const [userData] = await db
    .select({ jlptTarget: user.jlptTarget })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const jlptTarget = (userData?.jlptTarget ?? "N5") as "N5" | "N4" | "N3" | "N2" | "N1";

  // Get all existing srs_card vocabulary IDs for this user (already learned)
  const learnedCards = await db
    .select({ vocabularyId: srsCard.vocabularyId })
    .from(srsCard)
    .where(
      and(
        eq(srsCard.userId, userId),
        sql`${srsCard.vocabularyId} IS NOT NULL`
      )
    );
  const learnedVocabIds = new Set(learnedCards.map((c) => c.vocabularyId!));

  // Get book for the target JLPT level
  const [targetBook] = await db
    .select()
    .from(book)
    .where(eq(book.jlptLevel, jlptTarget))
    .limit(1);

  if (!targetBook) {
    return { newWords: [], activeChapter: null };
  }

  // Get all chapters for this book, ordered by chapter number
  const chapters = await db
    .select({
      id: chapter.id,
      chapterNumber: chapter.chapterNumber,
      bookId: chapter.bookId,
      vocabCount: chapter.vocabCount,
    })
    .from(chapter)
    .where(eq(chapter.bookId, targetBook.id))
    .orderBy(asc(chapter.chapterNumber));

  // Find the active chapter: first chapter with unlearned vocab
  let activeChapterId: string | null = null;
  let activeChapterNumber: number | null = null;
  let activeChapterBookId: string | null = null;

  for (const ch of chapters) {
    // Count unlearned vocab in this chapter
    const [unlearned] = await db
      .select({ count: count() })
      .from(vocabulary)
      .where(
        and(
          eq(vocabulary.chapterId, ch.id),
          eq(vocabulary.isPublished, true),
          learnedVocabIds.size > 0
            ? sql`${vocabulary.id} NOT IN (${sql.join(
                [...learnedVocabIds].map((id) => sql`${id}`),
                sql`, `
              )})`
            : sql`1=1`
        )
      );

    if (unlearned.count > 0) {
      activeChapterId = ch.id;
      activeChapterNumber = ch.chapterNumber;
      activeChapterBookId = ch.bookId;
      break;
    }
  }

  // If all chapters in target level are done, try the other book
  if (!activeChapterId) {
    const otherLevel = jlptTarget === "N5" ? "N4" : "N5";
    const [otherBook] = await db
      .select()
      .from(book)
      .where(eq(book.jlptLevel, otherLevel as "N5" | "N4"))
      .limit(1);

    if (otherBook) {
      const otherChapters = await db
        .select({
          id: chapter.id,
          chapterNumber: chapter.chapterNumber,
          bookId: chapter.bookId,
        })
        .from(chapter)
        .where(eq(chapter.bookId, otherBook.id))
        .orderBy(asc(chapter.chapterNumber));

      for (const ch of otherChapters) {
        const [unlearned] = await db
          .select({ count: count() })
          .from(vocabulary)
          .where(
            and(
              eq(vocabulary.chapterId, ch.id),
              eq(vocabulary.isPublished, true),
              learnedVocabIds.size > 0
                ? sql`${vocabulary.id} NOT IN (${sql.join(
                    [...learnedVocabIds].map((id) => sql`${id}`),
                    sql`, `
                  )})`
                : sql`1=1`
            )
          );

        if (unlearned.count > 0) {
          activeChapterId = ch.id;
          activeChapterNumber = ch.chapterNumber;
          activeChapterBookId = ch.bookId;
          break;
        }
      }
    }
  }

  // If still no active chapter, all vocab learned
  if (!activeChapterId || !activeChapterNumber || !activeChapterBookId) {
    return { newWords: [], activeChapter: null };
  }

  // Get up to MAX_NEW_WORDS unlearned vocab from active chapter
  const newVocabQuery = db
    .select({
      id: vocabulary.id,
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
      chapterId: vocabulary.chapterId,
    })
    .from(vocabulary)
    .where(
      and(
        eq(vocabulary.chapterId, activeChapterId),
        eq(vocabulary.isPublished, true),
        learnedVocabIds.size > 0
          ? sql`${vocabulary.id} NOT IN (${sql.join(
              [...learnedVocabIds].map((id) => sql`${id}`),
              sql`, `
            )})`
          : sql`1=1`
      )
    )
    .orderBy(asc(vocabulary.sortOrder))
    .limit(MAX_NEW_WORDS);

  const newVocab = await newVocabQuery;

  const newWords: SmartStudyNewWord[] = newVocab.map((v) => ({
    vocabulary: {
      id: v.id,
      kanji: v.kanji,
      hiragana: v.hiragana,
      romaji: v.romaji,
      meaningId: v.meaningId,
      meaningEn: v.meaningEn,
      wordType: v.wordType,
      jlptLevel: v.jlptLevel,
      audioUrl: v.audioUrl,
      exampleJp: v.exampleJp,
      exampleId: v.exampleId,
      sortOrder: v.sortOrder,
    },
    fromChapter: {
      id: activeChapterId!,
      chapterNumber: activeChapterNumber!,
      bookId: activeChapterBookId!,
    },
  }));

  return {
    newWords,
    activeChapter: {
      id: activeChapterId,
      chapterNumber: activeChapterNumber,
      title: `Bab ${activeChapterNumber}`,
    },
  };
}

// Phase 3: Generate quiz questions from review + new words
function generateSmartQuiz(
  reviewCards: SmartStudyReviewCard[],
  newWords: SmartStudyNewWord[]
): VocabQuizQuestion[] {
  // Build a VocabularyWithSrs pool from review cards and new words
  const vocabPool: VocabularyWithSrs[] = [];

  for (const card of reviewCards) {
    if (card.vocabulary) {
      vocabPool.push({
        id: card.vocabulary.id,
        kanji: card.vocabulary.kanji,
        hiragana: card.vocabulary.hiragana,
        romaji: card.vocabulary.romaji,
        meaningId: card.vocabulary.meaningId,
        meaningEn: card.vocabulary.meaningEn,
        wordType: card.vocabulary.wordType as VocabularyWithSrs["wordType"],
        jlptLevel: "N5",
        audioUrl: card.vocabulary.audioUrl,
        exampleJp: card.vocabulary.exampleJp,
        exampleId: card.vocabulary.exampleId,
        sortOrder: 0,
        srsStatus: card.status as VocabularyWithSrs["srsStatus"],
      });
    }
  }

  for (const word of newWords) {
    vocabPool.push({
      id: word.vocabulary.id,
      kanji: word.vocabulary.kanji,
      hiragana: word.vocabulary.hiragana,
      romaji: word.vocabulary.romaji,
      meaningId: word.vocabulary.meaningId,
      meaningEn: word.vocabulary.meaningEn,
      wordType: word.vocabulary.wordType as VocabularyWithSrs["wordType"],
      jlptLevel: word.vocabulary.jlptLevel,
      audioUrl: word.vocabulary.audioUrl,
      exampleJp: word.vocabulary.exampleJp,
      exampleId: word.vocabulary.exampleId,
      sortOrder: word.vocabulary.sortOrder,
      srsStatus: "new",
    });
  }

  // Need at least 4 vocab for multiple choice options
  if (vocabPool.length < 4) {
    return [];
  }

  const shuffledPool = shuffle(vocabPool);
  const questions: VocabQuizQuestion[] = [];

  // Filter quiz types based on available data
  const availableTypes = SMART_QUIZ_TYPES.filter((type) => {
    if (type === "audio_to_word" || type === "audio_to_meaning") {
      return vocabPool.some((v) => v.audioUrl);
    }
    return true;
  });

  for (let i = 0; i < QUIZ_QUESTION_COUNT && questions.length < QUIZ_QUESTION_COUNT; i++) {
    const vocab = shuffledPool[i % shuffledPool.length];
    const type = availableTypes[i % availableTypes.length];

    const question = buildQuestion(vocab, vocabPool, type, questions.length + 1);
    if (question) {
      questions.push(question);
    } else {
      // Fallback to meaning_to_word
      const fallback = buildQuestion(vocab, vocabPool, "meaning_to_word", questions.length + 1);
      if (fallback) {
        questions.push(fallback);
      }
    }
  }

  return questions;
}

// Calculate estimated time in minutes
function calculateEstimatedMinutes(
  reviewCount: number,
  newWordsCount: number,
  quizCount: number
): number {
  const totalSeconds =
    reviewCount * SECONDS_PER_REVIEW +
    newWordsCount * SECONDS_PER_NEW_WORD +
    quizCount * SECONDS_PER_QUIZ;

  return Math.max(1, Math.ceil(totalSeconds / 60));
}

// Main function: generate a smart study session
export async function generateSmartSession(
  userId: string
): Promise<SmartStudySession> {
  // Phase 1: Get review cards
  const reviewCards = await getReviewCards(userId);

  // Phase 2: Get new words and active chapter
  const { newWords, activeChapter } = await getActiveChapterAndNewWords(userId);

  // Phase 3: Generate quiz questions
  const quizQuestions = generateSmartQuiz(reviewCards, newWords);

  // Calculate time estimate
  const estimatedMinutes = calculateEstimatedMinutes(
    reviewCards.length,
    newWords.length,
    quizQuestions.length
  );

  return {
    reviewCards,
    newWords,
    quizQuestions,
    estimatedMinutes,
    summary: {
      reviewCount: reviewCards.length,
      newWordsCount: newWords.length,
      quizCount: quizQuestions.length,
      activeChapter,
    },
  };
}

// Lightweight status check for dashboard card
export async function getSmartSessionStatus(
  userId: string
): Promise<SmartSessionStatus> {
  const now = new Date().toISOString();
  const today = getTodayWIB();

  // Count due review cards (non-new)
  const [reviewResult] = await db
    .select({ count: count() })
    .from(srsCard)
    .where(
      and(
        eq(srsCard.userId, userId),
        lte(srsCard.dueDate, now),
        ne(srsCard.status, "new")
      )
    );

  const reviewCount = Math.min(reviewResult.count, MAX_REVIEW_CARDS);

  // Check daily goal status
  const [gamData] = await db
    .select({
      dailyGoalMet: userGamification.dailyGoalMet,
      lastActivityDate: userGamification.lastActivityDate,
    })
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  const dailyGoalMet =
    gamData?.lastActivityDate === today ? gamData.dailyGoalMet : false;

  // Determine active chapter for new words
  const [userData] = await db
    .select({ jlptTarget: user.jlptTarget })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const jlptTarget = (userData?.jlptTarget ?? "N5") as "N5" | "N4";

  // Get learned vocab IDs count
  const learnedCards = await db
    .select({ vocabularyId: srsCard.vocabularyId })
    .from(srsCard)
    .where(
      and(
        eq(srsCard.userId, userId),
        sql`${srsCard.vocabularyId} IS NOT NULL`
      )
    );
  const learnedVocabIds = new Set(learnedCards.map((c) => c.vocabularyId!));

  // Find active chapter number
  let activeChapterNumber: number | null = null;
  let hasNewWords = false;
  let newWordsCount = 0;

  const [targetBook] = await db
    .select()
    .from(book)
    .where(eq(book.jlptLevel, jlptTarget))
    .limit(1);

  if (targetBook) {
    const chapters = await db
      .select({
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
      })
      .from(chapter)
      .where(eq(chapter.bookId, targetBook.id))
      .orderBy(asc(chapter.chapterNumber));

    for (const ch of chapters) {
      const [unlearned] = await db
        .select({ count: count() })
        .from(vocabulary)
        .where(
          and(
            eq(vocabulary.chapterId, ch.id),
            eq(vocabulary.isPublished, true),
            learnedVocabIds.size > 0
              ? sql`${vocabulary.id} NOT IN (${sql.join(
                  [...learnedVocabIds].map((id) => sql`${id}`),
                  sql`, `
                )})`
              : sql`1=1`
          )
        );

      if (unlearned.count > 0) {
        activeChapterNumber = ch.chapterNumber;
        newWordsCount = Math.min(unlearned.count, MAX_NEW_WORDS);
        hasNewWords = true;
        break;
      }
    }
  }

  const quizCount = (reviewCount > 0 || hasNewWords) ? QUIZ_QUESTION_COUNT : 0;
  const estimatedMinutes = calculateEstimatedMinutes(
    reviewCount,
    newWordsCount,
    quizCount
  );

  return {
    hasReviewCards: reviewCount > 0,
    reviewCount,
    hasNewWords,
    newWordsCount,
    quizCount,
    estimatedMinutes,
    activeChapterNumber,
    dailyGoalMet,
  };
}

// Get leech card count (cards with lapses >= 4)
export async function getLeechCardCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(srsCard)
    .where(
      and(
        eq(srsCard.userId, userId),
        sql`${srsCard.lapses} >= 4`
      )
    );

  return result.count;
}
