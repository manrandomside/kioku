"use server";

import { eq, and, gte, desc } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { srsCard, reviewLog } from "@/db/schema/srs";
import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import {
  processReview,
  type SrsRating,
  type SrsCardData,
} from "@/lib/srs/fsrs-engine";
import {
  updateChapterProgress,
  getChapterIdFromVocabulary,
} from "@/lib/progress/update-chapter-progress";
import { awardReviewXp } from "@/lib/gamification/xp-service";
import { checkAndUpdateStreak } from "@/lib/gamification/streak-service";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievement-service";

const submitReviewSchema = z.object({
  cardId: z.string().uuid(),
  rating: z.enum(["again", "hard", "good", "easy"]),
  reviewDurationMs: z.number().int().nonnegative().max(600_000),
});

export async function submitReviewByCardId(
  cardId: string,
  rating: SrsRating,
  reviewDurationMs: number
) {
  try {
    const parsed = submitReviewSchema.safeParse({ cardId, rating, reviewDurationMs });
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

    // Fetch the card
    const [card] = await db
      .select()
      .from(srsCard)
      .where(eq(srsCard.id, cardId))
      .limit(1);

    if (!card || card.userId !== userId) {
      return { success: false, error: { code: "NOT_FOUND", message: "Kartu tidak ditemukan" } };
    }

    // Dedup check: skip if same card was reviewed within last 10 seconds
    const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString();
    const [recentReview] = await db
      .select({ id: reviewLog.id })
      .from(reviewLog)
      .where(
        and(
          eq(reviewLog.cardId, cardId),
          eq(reviewLog.userId, userId),
          gte(reviewLog.reviewedAt, tenSecondsAgo)
        )
      )
      .orderBy(desc(reviewLog.reviewedAt))
      .limit(1);

    if (recentReview) {
      return { success: true, data: { newStatus: card.status, isLapse: false } };
    }

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

    // Update chapter progress if this is a vocabulary card
    if (card.vocabularyId) {
      const chapterId = await getChapterIdFromVocabulary(card.vocabularyId);
      if (chapterId) {
        await updateChapterProgress(userId, chapterId);
      }
    }

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
    console.error("[submitReviewByCardId]", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan review" },
    };
  }
}
