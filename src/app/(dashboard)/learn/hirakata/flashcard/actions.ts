"use server";

import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { srsCard } from "@/db/schema/srs";
import { reviewLog } from "@/db/schema/srs";
import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import {
  processReview,
  createNewCardData,
  type SrsRating,
  type SrsCardData,
} from "@/lib/srs/fsrs-engine";
import { awardReviewXp } from "@/lib/gamification/xp-service";
import { checkAndUpdateStreak } from "@/lib/gamification/streak-service";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievement-service";

const kanaReviewSchema = z.object({
  kanaId: z.string().uuid(),
  rating: z.enum(["again", "hard", "good", "easy"]),
  reviewDurationMs: z.number().int().nonnegative().max(600_000),
});

// Ensure SRS card exists for a kana, create if needed (race-safe via unique index)
async function ensureSrsCard(userId: string, kanaId: string) {
  const newCard = createNewCardData();
  await db
    .insert(srsCard)
    .values({
      userId,
      kanaId,
      status: newCard.status,
      stability: newCard.stability,
      difficulty: newCard.difficulty,
      dueDate: newCard.dueDate,
      scheduledDays: newCard.scheduledDays,
      reps: newCard.reps,
      lapses: newCard.lapses,
    })
    .onConflictDoNothing();

  const [existing] = await db
    .select()
    .from(srsCard)
    .where(and(eq(srsCard.userId, userId), eq(srsCard.kanaId, kanaId)))
    .limit(1);

  return existing;
}

export async function submitKanaReview(
  kanaId: string,
  rating: SrsRating,
  reviewDurationMs: number
) {
  try {
    const validated = kanaReviewSchema.safeParse({ kanaId, rating, reviewDurationMs });
    if (!validated.success) {
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

    const card = await ensureSrsCard(userId, kanaId);

    const cardData: SrsCardData = {
      status: card.status,
      stability: card.stability,
      difficulty: card.difficulty,
      dueDate: card.dueDate,
      scheduledDays: card.scheduledDays,
      reps: card.reps,
      lapses: card.lapses,
    };

    const result = processReview(cardData, rating);

    // Update the SRS card
    await db
      .update(srsCard)
      .set({
        status: result.updatedCard.status,
        stability: result.updatedCard.stability,
        difficulty: result.updatedCard.difficulty,
        dueDate: result.updatedCard.dueDate,
        scheduledDays: result.updatedCard.scheduledDays,
        reps: result.updatedCard.reps,
        lapses: result.updatedCard.lapses,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(srsCard.id, card.id));

    // Log the review
    await db.insert(reviewLog).values({
      userId,
      cardId: card.id,
      rating,
      prevStability: result.prevStability,
      newStability: result.newStability,
      prevDifficulty: result.prevDifficulty,
      newDifficulty: result.newDifficulty,
      prevStatus: result.prevStatus as "new" | "learning" | "review" | "relearning",
      newStatus: result.newStatus as "new" | "learning" | "review" | "relearning",
      reviewDurationMs,
      reviewedAt: new Date().toISOString(),
    });

    // Award XP and check streak
    await checkAndUpdateStreak(userId);
    const xpResult = await awardReviewXp(userId, card.id);
    const newAchievements = await checkAndUnlockAchievements(userId);

    return {
      success: true,
      data: {
        newStatus: result.updatedCard.status,
        isLapse: rating === "again" && cardData.status === "review",
        xp: {
          awarded: xpResult.xpAwarded,
          total: xpResult.totalXp,
          leveledUp: xpResult.leveledUp,
          currentLevel: xpResult.currentLevel,
        },
        achievements: newAchievements,
      },
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[submitKanaReview] FULL ERROR:", errMsg, error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: errMsg },
    };
  }
}
