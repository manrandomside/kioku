"use server";

import { db } from "@/db";
import { quizSession, quizAnswer } from "@/db/schema/quiz";
import { createClient } from "@/lib/supabase/server";

import type { QuizAnswer } from "@/types/quiz";
import type { KanaQuestionType } from "@/types/quiz";

const XP_PER_CORRECT = 5;
const XP_PERFECT_BONUS = 20;

export async function createQuizSession(
  kanaCategory: string,
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
        kanaCategory: kanaCategory as "hiragana_basic" | "hiragana_dakuten" | "hiragana_combo" | "katakana_basic" | "katakana_dakuten" | "katakana_combo",
        totalQuestions,
      })
      .returning();

    return { success: true, data: { sessionId: session.id } };
  } catch (error) {
    console.error("[createQuizSession]", error);
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal membuat sesi quiz" } };
  }
}

export async function submitQuizResult(
  sessionId: string,
  answers: QuizAnswer[],
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

    // Insert all answers
    await db.insert(quizAnswer).values(
      answers.map((a) => ({
        sessionId,
        questionNumber: a.questionNumber,
        questionType: a.questionType as KanaQuestionType,
        kanaId: a.kanaId,
        questionText: a.correctAnswer,
        correctAnswer: a.correctAnswer,
        options: [] as string[],
        userAnswer: a.userAnswer,
        isCorrect: a.isCorrect,
        answeredAt: new Date().toISOString(),
      }))
    );

    // Update session
    const { eq } = await import("drizzle-orm");
    await db
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
      .where(eq(quizSession.id, sessionId));

    return {
      success: true,
      data: { correctCount, scorePercent, xpEarned, isPerfect },
    };
  } catch (error) {
    console.error("[submitQuizResult]", error);
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan hasil quiz" } };
  }
}
