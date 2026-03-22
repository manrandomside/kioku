"use server";

import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { srsCard, reviewLog } from "@/db/schema/srs";
import { createClient } from "@/lib/supabase/server";
import {
  processReview,
  createNewCardData,
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

async function ensureVocabSrsCard(userId: string, vocabularyId: string) {
  const existing = await db
    .select()
    .from(srsCard)
    .where(and(eq(srsCard.userId, userId), eq(srsCard.vocabularyId, vocabularyId)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const newCard = createNewCardData();
  const [created] = await db
    .insert(srsCard)
    .values({
      userId,
      vocabularyId,
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

export async function submitVocabReview(
  vocabularyId: string,
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

    const card = await ensureVocabSrsCard(user.id, vocabularyId);

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

    // Update chapter progress after SRS review
    const chapterId = await getChapterIdFromVocabulary(vocabularyId);
    if (chapterId) {
      await updateChapterProgress(user.id, chapterId);
    }

    // Award XP and check streak
    await checkAndUpdateStreak(user.id);
    const xpResult = await awardReviewXp(user.id, card.id);
    const newAchievements = await checkAndUnlockAchievements(user.id);

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
    console.error("[submitVocabReview]", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan review" },
    };
  }
}
