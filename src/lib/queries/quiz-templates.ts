import { eq, and, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { aiQuestionTemplate } from "@/db/schema/ai";
import { vocabulary } from "@/db/schema/content";

export type QuestionTypeFilter =
  | "meaning_to_word"
  | "word_to_meaning"
  | "fill_in_blank";

export interface QuizTemplate {
  id: string;
  vocabularyId: string;
  questionType: string;
  questionText: string;
  correctAnswer: string;
  wrongAnswers: string[];
}

// Get all AI-generated templates for a chapter
export async function getTemplatesForChapter(
  chapterId: string
): Promise<QuizTemplate[]> {
  const rows = await db
    .select({
      id: aiQuestionTemplate.id,
      vocabularyId: aiQuestionTemplate.vocabularyId,
      questionType: aiQuestionTemplate.questionType,
      questionText: aiQuestionTemplate.questionText,
      correctAnswer: aiQuestionTemplate.correctAnswer,
      wrongAnswers: aiQuestionTemplate.wrongAnswers,
    })
    .from(aiQuestionTemplate)
    .innerJoin(vocabulary, eq(aiQuestionTemplate.vocabularyId, vocabulary.id))
    .where(and(eq(vocabulary.chapterId, chapterId), eq(vocabulary.isPublished, true)));

  return rows.map((r) => ({
    ...r,
    wrongAnswers: r.wrongAnswers as string[],
  }));
}

// Get random templates for a quiz session, optionally filtered by question types
export async function getRandomTemplates(
  chapterId: string,
  count: number,
  types?: QuestionTypeFilter[]
): Promise<QuizTemplate[]> {
  const conditions = [eq(vocabulary.chapterId, chapterId), eq(vocabulary.isPublished, true)];

  if (types && types.length > 0) {
    conditions.push(
      inArray(aiQuestionTemplate.questionType, types)
    );
  }

  const rows = await db
    .select({
      id: aiQuestionTemplate.id,
      vocabularyId: aiQuestionTemplate.vocabularyId,
      questionType: aiQuestionTemplate.questionType,
      questionText: aiQuestionTemplate.questionText,
      correctAnswer: aiQuestionTemplate.correctAnswer,
      wrongAnswers: aiQuestionTemplate.wrongAnswers,
    })
    .from(aiQuestionTemplate)
    .innerJoin(vocabulary, eq(aiQuestionTemplate.vocabularyId, vocabulary.id))
    .where(and(...conditions))
    .orderBy(sql`random()`)
    .limit(count);

  return rows.map((r) => ({
    ...r,
    wrongAnswers: r.wrongAnswers as string[],
  }));
}

// Check if a chapter has any AI-generated templates
export async function hasTemplatesForChapter(
  chapterId: string
): Promise<boolean> {
  const rows = await db
    .select({ id: aiQuestionTemplate.id })
    .from(aiQuestionTemplate)
    .innerJoin(vocabulary, eq(aiQuestionTemplate.vocabularyId, vocabulary.id))
    .where(and(eq(vocabulary.chapterId, chapterId), eq(vocabulary.isPublished, true)))
    .limit(1);

  return rows.length > 0;
}
