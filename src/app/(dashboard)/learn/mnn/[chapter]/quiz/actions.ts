"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { after } from "next/server";

import { db } from "@/db";
import { quizSession, quizAnswer } from "@/db/schema/quiz";
import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { updateChapterProgress } from "@/lib/progress/update-chapter-progress";
import { awardQuizXp } from "@/lib/gamification/xp-service";
import { checkAndUpdateStreak } from "@/lib/gamification/streak-service";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievement-service";
import { checkAndUpgradeJlpt } from "@/lib/gamification/jlpt-upgrade-service";

import type { VocabQuizAnswer, VocabQuestionType } from "@/types/vocab-quiz";

const XP_PER_CORRECT = 3;

const createSessionSchema = z.object({
  chapterId: z.string().uuid(),
  totalQuestions: z.number().int().min(1).max(50),
});

const submitResultSchema = z.object({
  sessionId: z.string().uuid(),
  timeSpentMs: z.number().int().nonnegative().max(3_600_000),
});

export async function createVocabQuizSession(
  chapterId: string,
  totalQuestions: number
) {
  try {
    const parsed = createSessionSchema.safeParse({ chapterId, totalQuestions });
    if (!parsed.success) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Input tidak valid" } };
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
    }

    const userId = await getInternalUserId(user.id);
    if (!userId) {
      return { success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } };
    }

    const [session] = await db
      .insert(quizSession)
      .values({
        userId,
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
    const parsed = submitResultSchema.safeParse({ sessionId, timeSpentMs });
    if (!parsed.success) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Input tidak valid" } };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
    }

    const userId = await getInternalUserId(user.id);
    if (!userId) {
      return { success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } };
    }

    // Idempotency check: prevent double-submission
    const [existingSession] = await db
      .select({ isCompleted: quizSession.isCompleted, userId: quizSession.userId })
      .from(quizSession)
      .where(eq(quizSession.id, sessionId))
      .limit(1);

    if (!existingSession || existingSession.userId !== userId) {
      return { success: false, error: { code: "NOT_FOUND", message: "Sesi quiz tidak ditemukan" } };
    }

    if (existingSession.isCompleted) {
      return { success: false, error: { code: "ALREADY_COMPLETED", message: "Quiz sudah diselesaikan" } };
    }

    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalQuestions = answers.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const isPerfect = correctCount === totalQuestions;
    const xpEarned = correctCount * XP_PER_CORRECT;

    // --- CORE TASK: save quiz data (must be awaited) ---

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

    // Update chapter progress (important for quiz-based mastery)
    if (updatedSession?.chapterId) {
      await updateChapterProgress(userId, updatedSession.chapterId);
    }

    // --- GAMIFICATION TASK: deferred via after() ---
    // These are heavy DB operations (streak, XP, achievements, JLPT upgrade)
    // that should not block the response to the client.
    after(async () => {
      try {
        await checkAndUpdateStreak(userId);

        const [xpResult, newAchievements, upgradeResult] = await Promise.allSettled([
          awardQuizXp(userId, sessionId, correctCount, scorePercent),
          checkAndUnlockAchievements(userId),
          checkAndUpgradeJlpt(userId),
        ]);

        if (xpResult.status === "rejected") {
          console.error("[submitVocabQuizResult:after] awardQuizXp failed:", xpResult.reason);
        }
        if (newAchievements.status === "rejected") {
          console.error("[submitVocabQuizResult:after] checkAchievements failed:", newAchievements.reason);
        }
        if (upgradeResult.status === "rejected") {
          console.error("[submitVocabQuizResult:after] checkJlptUpgrade failed:", upgradeResult.reason);
        }
      } catch (err) {
        console.error("[submitVocabQuizResult:after] gamification task failed:", err);
      }
    });

    // --- Return optimistic response immediately ---
    // Provide estimated XP data so the client can show animations instantly.
    // Actual XP (with bonuses, level-up) will be computed in after().
    const bonusXp = scorePercent === 100 ? 25 : scorePercent >= 90 ? 15 : scorePercent >= 80 ? 10 : 0;
    const bonusLabel = scorePercent === 100 ? "Sempurna (100%)" : scorePercent >= 90 ? "Hebat (90%+)" : scorePercent >= 80 ? "Bagus (80%+)" : "";
    const estimatedTotal = xpEarned + bonusXp;

    return {
      success: true,
      data: {
        correctCount,
        scorePercent,
        xpEarned: estimatedTotal,
        isPerfect,
        xp: {
          awarded: estimatedTotal,
          baseXp: xpEarned,
          bonusXp,
          bonusLabel,
          total: 0,
          leveledUp: false,
          currentLevel: 0,
        },
        achievements: [],
        jlptUpgrade: null,
      },
    };
  } catch (error) {
    console.error("[submitVocabQuizResult]", error);
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan hasil quiz" } };
  }
}

