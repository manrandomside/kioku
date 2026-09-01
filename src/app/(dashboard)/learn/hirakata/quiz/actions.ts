"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { after } from "next/server";

import { db } from "@/db";
import { quizSession, quizAnswer } from "@/db/schema/quiz";
import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { awardQuizXp, getQuizTierBonus } from "@/lib/gamification/xp-service";
import { checkAndUpdateStreak } from "@/lib/gamification/streak-service";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievement-service";

import type { QuizAnswer } from "@/types/quiz";
import type { KanaQuestionType } from "@/types/quiz";

const XP_PER_CORRECT = 3;

const KANA_CATEGORIES = [
  "hiragana_basic", "hiragana_dakuten", "hiragana_combo",
  "katakana_basic", "katakana_dakuten", "katakana_combo",
] as const;

const createSessionSchema = z.object({
  kanaCategory: z.enum(KANA_CATEGORIES),
  totalQuestions: z.number().int().min(1).max(50),
});

const submitResultSchema = z.object({
  sessionId: z.string().uuid(),
  timeSpentMs: z.number().int().nonnegative().max(3_600_000),
});

export async function createQuizSession(
  kanaCategory: string,
  totalQuestions: number
) {
  try {
    const parsed = createSessionSchema.safeParse({ kanaCategory, totalQuestions });
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
      .select({
        isCompleted: quizSession.isCompleted,
        userId: quizSession.userId,
        correctCount: quizSession.correctCount,
        scorePercent: quizSession.scorePercent,
        xpEarned: quizSession.xpEarned,
        isPerfect: quizSession.isPerfect,
      })
      .from(quizSession)
      .where(eq(quizSession.id, sessionId))
      .limit(1);

    if (!existingSession || existingSession.userId !== userId) {
      return { success: false, error: { code: "NOT_FOUND", message: "Sesi quiz tidak ditemukan" } };
    }

    // Already saved: return the stored result instead of failing, so a client
    // retry after a lost response can still populate the summary screen.
    // XP is not awarded again.
    if (existingSession.isCompleted) {
      const storedCorrect = existingSession.correctCount ?? 0;
      const storedScore = existingSession.scorePercent ?? 0;
      const storedBase = storedCorrect * XP_PER_CORRECT;
      const storedTier = getQuizTierBonus(storedScore);

      return {
        success: true,
        data: {
          correctCount: storedCorrect,
          scorePercent: storedScore,
          xpEarned: existingSession.xpEarned ?? storedBase,
          isPerfect: existingSession.isPerfect ?? false,
          xp: {
            awarded: storedBase + storedTier.amount,
            baseXp: storedBase,
            bonusXp: storedTier.amount,
            bonusLabel: storedTier.label,
            total: 0,
            leveledUp: false,
            currentLevel: 0,
          },
          achievements: [],
        },
      };
    }

    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalQuestions = answers.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const isPerfect = correctCount === totalQuestions;
    const xpEarned = correctCount * XP_PER_CORRECT;

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

    // Award XP inline: the summary screen and the level-up modal both need
    // these exact numbers, so this is the one gamification step worth waiting for.
    const xpResult = await awardQuizXp(userId, sessionId, correctCount, scorePercent);

    // Streak and achievements are heavy DB work whose result the summary screen
    // does not display. Running them inline used to push the whole action past
    // the serverless response window, which lost the XP payload entirely.
    after(async () => {
      try {
        await checkAndUpdateStreak(userId);
      } catch (err) {
        console.error("[submitQuizResult:after] checkAndUpdateStreak failed:", err);
      }
      try {
        await checkAndUnlockAchievements(userId);
      } catch (err) {
        console.error("[submitQuizResult:after] checkAndUnlockAchievements failed:", err);
      }
    });

    return {
      success: true,
      data: {
        correctCount,
        scorePercent,
        xpEarned: xpResult.xpAwarded,
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
        achievements: [],
      },
    };
  } catch (error) {
    console.error("[submitQuizResult]", error);
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan hasil quiz" } };
  }
}
