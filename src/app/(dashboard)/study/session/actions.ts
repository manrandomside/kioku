"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { quizSession, quizAnswer } from "@/db/schema/quiz";
import { xpTransaction } from "@/db/schema/gamification";
import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { awardQuizXp } from "@/lib/gamification/xp-service";
import { checkAndUpdateStreak } from "@/lib/gamification/streak-service";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievement-service";

import type { VocabQuizAnswer, VocabQuestionType } from "@/types/vocab-quiz";

// Create a smart study quiz session (no chapterId)
export async function createSmartStudyQuizSession(totalQuestions: number) {
  try {
    const parsed = z.number().int().min(1).max(50).safeParse(totalQuestions);
    if (!parsed.success) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Input tidak valid" } };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
        totalQuestions,
      })
      .returning();

    return { success: true, data: { sessionId: session.id } };
  } catch (error) {
    console.error("[createSmartStudyQuizSession]", error);
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal membuat sesi quiz" } };
  }
}

// Submit smart study quiz results
export async function submitSmartStudyQuizResult(
  sessionId: string,
  answers: VocabQuizAnswer[],
  timeSpentMs: number
) {
  try {
    const parsed = z.object({
      sessionId: z.string().uuid(),
      timeSpentMs: z.number().int().nonnegative().max(3_600_000),
    }).safeParse({ sessionId, timeSpentMs });

    if (!parsed.success) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Input tidak valid" } };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
    }

    const userId = await getInternalUserId(user.id);
    if (!userId) {
      return { success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } };
    }

    // Idempotency check
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

    await db
      .update(quizSession)
      .set({
        correctCount,
        scorePercent,
        xpEarned: correctCount * 3,
        timeSpentMs,
        isCompleted: true,
        isPerfect,
        completedAt: new Date().toISOString(),
      })
      .where(eq(quizSession.id, sessionId));

    // Award XP and check streak
    await checkAndUpdateStreak(userId);
    const xpResult = await awardQuizXp(userId, sessionId, correctCount, scorePercent);
    const newAchievements = await checkAndUnlockAchievements(userId);

    return {
      success: true,
      data: {
        correctCount,
        scorePercent,
        isPerfect,
        xp: {
          awarded: xpResult.xpAwarded,
          baseXp: xpResult.baseXp,
          bonusXp: xpResult.bonusXp,
          bonusLabel: xpResult.bonusLabel,
          total: xpResult.totalXp,
          leveledUp: xpResult.leveledUp,
          currentLevel: xpResult.currentLevel,
        },
        achievements: newAchievements,
      },
    };
  } catch (error) {
    console.error("[submitSmartStudyQuizResult]", error);
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan hasil quiz" } };
  }
}

// Award session completion bonus (15 XP, idempotent via referenceId check)
const SESSION_BONUS_XP = 15;

export async function awardSmartStudyBonus(quizSessionId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
    }

    const userId = await getInternalUserId(user.id);
    if (!userId) {
      return { success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } };
    }

    // Idempotency: check if bonus already awarded for this session
    const bonusRef = `smart_study_bonus_${quizSessionId}`;
    const [existing] = await db
      .select({ id: xpTransaction.id })
      .from(xpTransaction)
      .where(eq(xpTransaction.referenceId, bonusRef))
      .limit(1);

    if (existing) {
      return { success: true, data: { alreadyAwarded: true, xp: SESSION_BONUS_XP } };
    }

    // Award bonus using quiz source (fits existing enum)
    await db.insert(xpTransaction).values({
      userId,
      source: "quiz",
      amount: SESSION_BONUS_XP,
      description: "Bonus Smart Study sesi selesai",
      referenceId: bonusRef,
      createdAt: new Date().toISOString(),
    });

    // Also increment total XP in gamification (simplified, not going through awardXpInternal to avoid double daily activity update)
    const { sql } = await import("drizzle-orm");
    const { userGamification } = await import("@/db/schema/gamification");
    const { getTodayWIB } = await import("@/lib/utils/timezone");
    const today = getTodayWIB();

    await db
      .update(userGamification)
      .set({
        totalXp: sql`${userGamification.totalXp} + ${SESSION_BONUS_XP}`,
        dailyXpEarned: sql`CASE WHEN ${userGamification.lastActivityDate}::text = ${today} THEN ${userGamification.dailyXpEarned} + ${SESSION_BONUS_XP} ELSE ${SESSION_BONUS_XP} END`,
        lastActivityDate: today,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userGamification.userId, userId));

    return { success: true, data: { alreadyAwarded: false, xp: SESSION_BONUS_XP } };
  } catch (error) {
    console.error("[awardSmartStudyBonus]", error);
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memberikan bonus XP" } };
  }
}
