import { eq, and, asc } from "drizzle-orm";

import { db } from "@/db";
import { book, chapter, vocabulary } from "@/db/schema/content";
import { srsCard } from "@/db/schema/srs";
import { userChapterProgress } from "@/db/schema/gamification";
import { getQuizMasteredVocabIds, getQuizMasteredWordsAll } from "@/lib/progress/quiz-mastery";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";

import type { BookWithChapters, ChapterWithProgress, VocabularyWithSrs } from "@/types/vocabulary";

// Accepts Supabase auth ID, resolves to internal user ID for all queries
export async function getBooksWithChapters(authUserId?: string): Promise<BookWithChapters[]> {
  const books = await db
    .select()
    .from(book)
    .orderBy(asc(book.chapterStart));

  const chapters = await db
    .select()
    .from(chapter)
    .orderBy(asc(chapter.chapterNumber));

  let masteryMap: Map<string, number> = new Map();
  let bestQuizMap: Map<string, number | null> = new Map();

  const userId = authUserId ? await getInternalUserId(authUserId) : null;

  if (userId) {
    // Get quiz-based mastery counts for all chapters
    masteryMap = await getQuizMasteredWordsAll(userId);

    // Get best quiz scores from progress table
    const progress = await db
      .select({
        chapterId: userChapterProgress.chapterId,
        bestQuizScore: userChapterProgress.bestQuizScore,
      })
      .from(userChapterProgress)
      .where(eq(userChapterProgress.userId, userId));

    for (const p of progress) {
      bestQuizMap.set(p.chapterId, p.bestQuizScore);
    }
  }

  return books.map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    jlptLevel: b.jlptLevel,
    chapterStart: b.chapterStart,
    chapterEnd: b.chapterEnd,
    chapters: chapters
      .filter((c) => c.bookId === b.id)
      .map((c): ChapterWithProgress => {
        const mastered = masteryMap.get(c.id) ?? 0;
        const total = c.vocabCount;
        const completionPercent = total > 0 ? Math.round((mastered / total) * 100) : 0;
        return {
          id: c.id,
          bookId: c.bookId,
          chapterNumber: c.chapterNumber,
          slug: c.slug,
          vocabCount: total,
          vocabMastered: mastered,
          completionPercent,
          bestQuizScore: bestQuizMap.get(c.id) ?? null,
        };
      }),
  }));
}

export async function getChapterBySlug(slug: string): Promise<{
  id: string;
  bookId: string;
  chapterNumber: number;
  slug: string;
  vocabCount: number;
  bookTitle: string;
  bookSlug: string;
  jlptLevel: string;
} | null> {
  const rows = await db
    .select({
      id: chapter.id,
      bookId: chapter.bookId,
      chapterNumber: chapter.chapterNumber,
      slug: chapter.slug,
      vocabCount: chapter.vocabCount,
      bookTitle: book.title,
      bookSlug: book.slug,
      jlptLevel: book.jlptLevel,
    })
    .from(chapter)
    .innerJoin(book, eq(chapter.bookId, book.id))
    .where(eq(chapter.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

// Accepts Supabase auth ID, resolves to internal user ID for all queries
export async function getVocabularyForChapter(
  chapterId: string,
  authUserId?: string
): Promise<VocabularyWithSrs[]> {
  const selectFields = {
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
  };

  const userId = authUserId ? await getInternalUserId(authUserId) : null;

  // Get mastered vocab IDs from quiz history
  let masteredIds: Set<string> = new Set();
  if (userId) {
    masteredIds = await getQuizMasteredVocabIds(userId, chapterId);
  }

  if (!userId) {
    const rows = await db
      .select(selectFields)
      .from(vocabulary)
      .where(and(eq(vocabulary.chapterId, chapterId), eq(vocabulary.isPublished, true)))
      .orderBy(asc(vocabulary.sortOrder));

    return rows.map((r) => ({ ...r, srsStatus: null, isMastered: false }));
  }

  const rows = await db
    .select({
      ...selectFields,
      srsStatus: srsCard.status,
    })
    .from(vocabulary)
    .leftJoin(
      srsCard,
      and(eq(srsCard.vocabularyId, vocabulary.id), eq(srsCard.userId, userId))
    )
    .where(and(eq(vocabulary.chapterId, chapterId), eq(vocabulary.isPublished, true)))
    .orderBy(asc(vocabulary.sortOrder));

  return rows.map((r) => ({
    ...r,
    isMastered: masteredIds.has(r.id),
  }));
}
