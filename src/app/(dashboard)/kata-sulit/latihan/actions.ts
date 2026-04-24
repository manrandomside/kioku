"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { quizSession, quizAnswer } from "@/db/schema/quiz";
import { xpTransaction, userGamification } from "@/db/schema/gamification";
import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { awardQuizXp, calculateLevel } from "@/lib/gamification/xp-service";
import { checkAndUpdateStreak } from "@/lib/gamification/streak-service";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievement-service";
import { getTodayWIB } from "@/lib/utils/timezone";

import type { VocabQuizAnswer, VocabQuestionType } from "@/types/vocab-quiz";

// Create a leech training quiz session
export async function createLeechTrainingSession(totalQuestions: number) {
  try {
    const parsed = z.number().int().min(1).max(50).safeParse(totalQuestions);
    if (!parsed.success) {
      return { success: false as const, error: { code: "VALIDATION_ERROR", message: "Input tidak valid" } };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false as const, error: { code: "UNAUTHORIZED", message: "Belum login" } };
    }

    const userId = await getInternalUserId(user.id);
    if (!userId) {
      return { success: false as const, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } };
    }

    const [session] = await db
      .insert(quizSession)
      .values({
        userId,
        totalQuestions,
      })
      .returning();

    return { success: true as const, data: { sessionId: session.id } };
  } catch (error) {
    console.error("[createLeechTrainingSession]", error);
    return { success: false as const, error: { code: "INTERNAL_ERROR", message: "Gagal membuat sesi latihan" } };
  }
}

// Submit leech training quiz results
export async function submitLeechTrainingResult(
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
      return { success: false as const, error: { code: "VALIDATION_ERROR", message: "Input tidak valid" } };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false as const, error: { code: "UNAUTHORIZED", message: "Belum login" } };
    }

    const userId = await getInternalUserId(user.id);
    if (!userId) {
      return { success: false as const, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } };
    }

    // Idempotency check
    const [existingSession] = await db
      .select({ isCompleted: quizSession.isCompleted, userId: quizSession.userId })
      .from(quizSession)
      .where(eq(quizSession.id, sessionId))
      .limit(1);

    if (!existingSession || existingSession.userId !== userId) {
      return { success: false as const, error: { code: "NOT_FOUND", message: "Sesi tidak ditemukan" } };
    }

    if (existingSession.isCompleted) {
      return { success: false as const, error: { code: "ALREADY_COMPLETED", message: "Sesi sudah diselesaikan" } };
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
      success: true as const,
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
    console.error("[submitLeechTrainingResult]", error);
    return { success: false as const, error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan hasil latihan" } };
  }
}

// Award leech training completion bonus (20 XP, idempotent)
const LEECH_BONUS_XP = 20;

export async function awardLeechTrainingBonus(quizSessionId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false as const, error: { code: "UNAUTHORIZED", message: "Belum login" } };
    }

    const userId = await getInternalUserId(user.id);
    if (!userId) {
      return { success: false as const, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } };
    }

    // Idempotency: check if bonus already awarded
    const bonusRef = `leech_training_bonus_${quizSessionId}`;
    const [existing] = await db
      .select({ id: xpTransaction.id })
      .from(xpTransaction)
      .where(eq(xpTransaction.referenceId, bonusRef))
      .limit(1);

    if (existing) {
      return {
        success: true as const,
        data: { alreadyAwarded: true, xp: LEECH_BONUS_XP, leveledUp: false, currentLevel: 0 },
      };
    }

    await db.insert(xpTransaction).values({
      userId,
      source: "quiz",
      amount: LEECH_BONUS_XP,
      description: "Bonus latihan kata sulit selesai",
      referenceId: bonusRef,
      createdAt: new Date().toISOString(),
    });

    const today = getTodayWIB();
    const [updated] = await db
      .update(userGamification)
      .set({
        totalXp: sql`${userGamification.totalXp} + ${LEECH_BONUS_XP}`,
        dailyXpEarned: sql`CASE WHEN ${userGamification.lastActivityDate}::text = ${today} THEN ${userGamification.dailyXpEarned} + ${LEECH_BONUS_XP} ELSE ${LEECH_BONUS_XP} END`,
        lastActivityDate: today,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userGamification.userId, userId))
      .returning();

    const prevLevel = updated?.currentLevel ?? 1;
    const newTotalXp = updated?.totalXp ?? 0;
    const { level: newLevel } = calculateLevel(newTotalXp);
    const leveledUp = newLevel > prevLevel;

    if (leveledUp) {
      await db
        .update(userGamification)
        .set({ currentLevel: newLevel })
        .where(eq(userGamification.userId, userId));
    }

    return {
      success: true as const,
      data: {
        alreadyAwarded: false,
        xp: LEECH_BONUS_XP,
        leveledUp,
        currentLevel: leveledUp ? newLevel : prevLevel,
      },
    };
  } catch (error) {
    console.error("[awardLeechTrainingBonus]", error);
    return { success: false as const, error: { code: "INTERNAL_ERROR", message: "Gagal memberikan bonus XP" } };
  }
}
