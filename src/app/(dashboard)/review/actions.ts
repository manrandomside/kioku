"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { srsCard, reviewLog } from "@/db/schema/srs";
import { createClient } from "@/lib/supabase/server";
import {
  processReview,
  type SrsRating,
  type SrsCardData,
} from "@/lib/srs/fsrs-engine";
import {
  updateChapterProgress,
  getChapterIdFromVocabulary,
} from "@/lib/progress/update-chapter-progress";

export async function submitReviewByCardId(
  cardId: string,
  rating: SrsRating,
  reviewDurationMs: number
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
    }

    // Fetch the card
    const [card] = await db
      .select()
      .from(srsCard)
      .where(eq(srsCard.id, cardId))
      .limit(1);

    if (!card || card.userId !== user.id) {
      return { success: false, error: { code: "NOT_FOUND", message: "Kartu tidak ditemukan" } };
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
      userId: user.id,
      cardId: card.id,
      rating,
      prevStability: result.prevStability,
      newStability: result.newStability,
      prevDifficulty: result.prevDifficulty,
      newDifficulty: result.newDifficulty,
      prevStatus: result.prevStatus as "new" | "learning" | "review" | "relearning",
      newStatus: result.newStatus as "new" | "learning" | "review" | "relearning",
      reviewDurationMs,
    });

    // Update chapter progress if this is a vocabulary card
    if (card.vocabularyId) {
      const chapterId = await getChapterIdFromVocabulary(card.vocabularyId);
      if (chapterId) {
        await updateChapterProgress(user.id, chapterId);
      }
    }

    return {
      success: true,
      data: {
        newStatus: result.updatedCard.status,
        isLapse: rating === "again" && cardData.status === "review",
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
