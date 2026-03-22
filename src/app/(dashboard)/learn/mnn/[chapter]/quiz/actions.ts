"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { quizSession, quizAnswer } from "@/db/schema/quiz";
import { createClient } from "@/lib/supabase/server";
import { updateChapterProgress } from "@/lib/progress/update-chapter-progress";

import type { VocabQuizAnswer, VocabQuestionType } from "@/types/vocab-quiz";

const XP_PER_CORRECT = 5;
const XP_PERFECT_BONUS = 20;

export async function createVocabQuizSession(
  chapterId: string,
  totalQuestions: number
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
    }

    const [session] = await db
      .insert(quizSession)
      .values({
        userId: user.id,
        chapterId,
        totalQuestions,
      })
      .returning();

    return { success: true, data: { sessionId: session.id } };
  } catch (error) {
    console.error("[createVocabQuizSession]", error);
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal membuat sesi quiz" } };
  }
}

export async function submitVocabQuizResult(
  sessionId: string,
  answers: VocabQuizAnswer[],
  timeSpentMs: number
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
    }

    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalQuestions = answers.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const isPerfect = correctCount === totalQuestions;
    const xpEarned = correctCount * XP_PER_CORRECT + (isPerfect ? XP_PERFECT_BONUS : 0);

    await db.insert(quizAnswer).values(
      answers.map((a) => ({
        sessionId,
        questionNumber: a.questionNumber,
        questionType: a.questionType as VocabQuestionType,
        vocabularyId: a.vocabularyId,
        questionText: a.correctAnswer,
        correctAnswer: a.correctAnswer,
        options: [] as string[],
        userAnswer: a.userAnswer,
        isCorrect: a.isCorrect,
        answeredAt: new Date().toISOString(),
      }))
    );

    const [updatedSession] = await db
      .update(quizSession)
      .set({
        correctCount,
        scorePercent,
        xpEarned,
        timeSpentMs,
        isCompleted: true,
        isPerfect,
        completedAt: new Date().toISOString(),
      })
      .where(eq(quizSession.id, sessionId))
      .returning({ chapterId: quizSession.chapterId });

    // Update chapter progress after quiz completion
    if (updatedSession?.chapterId) {
      await updateChapterProgress(user.id, updatedSession.chapterId);
    }

    return {
      success: true,
      data: { correctCount, scorePercent, xpEarned, isPerfect },
    };
  } catch (error) {
    console.error("[submitVocabQuizResult]", error);
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan hasil quiz" } };
  }
}
