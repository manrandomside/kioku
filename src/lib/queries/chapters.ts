import { eq, and, asc } from "drizzle-orm";

import { db } from "@/db";
import { book, chapter, vocabulary } from "@/db/schema/content";
import { srsCard } from "@/db/schema/srs";
import { userChapterProgress } from "@/db/schema/gamification";

import type { BookWithChapters, ChapterWithProgress, VocabularyWithSrs } from "@/types/vocabulary";

export async function getBooksWithChapters(userId?: string): Promise<BookWithChapters[]> {
  const books = await db
    .select()
    .from(book)
    .orderBy(asc(book.chapterStart));

  const chapters = await db
    .select()
    .from(chapter)
    .orderBy(asc(chapter.chapterNumber));

  let progressMap: Map<string, {
    vocabSeen: number;
    vocabLearning: number;
    vocabReview: number;
    completionPercent: number;
    bestQuizScore: number | null;
  }> = new Map();

  if (userId) {
    const progress = await db
      .select()
      .from(userChapterProgress)
      .where(eq(userChapterProgress.userId, userId));

    for (const p of progress) {
      progressMap.set(p.chapterId, {
        vocabSeen: p.vocabSeen,
        vocabLearning: p.vocabLearning,
        vocabReview: p.vocabReview,
        completionPercent: p.completionPercent,
        bestQuizScore: p.bestQuizScore,
      });
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
        const prog = progressMap.get(c.id);
        return {
          id: c.id,
          bookId: c.bookId,
          chapterNumber: c.chapterNumber,
          slug: c.slug,
          vocabCount: c.vocabCount,
          vocabSeen: prog?.vocabSeen ?? 0,
          vocabLearning: prog?.vocabLearning ?? 0,
          vocabReview: prog?.vocabReview ?? 0,
          completionPercent: prog?.completionPercent ?? 0,
          bestQuizScore: prog?.bestQuizScore ?? null,
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

export async function getVocabularyForChapter(
  chapterId: string,
  userId?: string
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

  if (!userId) {
    const rows = await db
      .select(selectFields)
      .from(vocabulary)
      .where(and(eq(vocabulary.chapterId, chapterId), eq(vocabulary.isPublished, true)))
      .orderBy(asc(vocabulary.sortOrder));

    return rows.map((r) => ({ ...r, srsStatus: null }));
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

  return rows;
}
