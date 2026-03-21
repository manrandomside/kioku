"use server";

import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { srsCard } from "@/db/schema/srs";
import { reviewLog } from "@/db/schema/srs";
import { createClient } from "@/lib/supabase/server";
import {
  processReview,
  createNewCardData,
  type SrsRating,
  type SrsCardData,
} from "@/lib/srs/fsrs-engine";

// Ensure SRS card exists for a kana, create if needed
async function ensureSrsCard(userId: string, kanaId: string) {
  const existing = await db
    .select()
    .from(srsCard)
    .where(and(eq(srsCard.userId, userId), eq(srsCard.kanaId, kanaId)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const newCard = createNewCardData();
  const [created] = await db
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
    .returning();

  return created;
}

export async function submitKanaReview(
  kanaId: string,
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

    const card = await ensureSrsCard(user.id, kanaId);

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

    return {
      success: true,
      data: {
        newStatus: result.updatedCard.status,
        isLapse: rating === "again" && cardData.status === "review",
      },
    };
  } catch (error) {
    console.error("[submitKanaReview]", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan review" },
    };
  }
}
