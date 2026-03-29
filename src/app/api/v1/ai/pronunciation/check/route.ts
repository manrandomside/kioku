import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { db } from "@/db";
import { pronunciationAttempt } from "@/db/schema/ai";
import { calculatePronunciationScore } from "@/lib/audio/pronunciation-scoring";
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const bodySchema = z.object({
  vocabulary_id: z.string().uuid().optional(),
  kana_id: z.string().uuid().optional(),
  expected_text: z.string().min(1).max(255),
  recognized_text: z.string().min(1).max(255),
  expected_kanji: z.string().max(255).optional(),
  expected_romaji: z.string().max(255).optional(),
  accuracy_score: z.number().min(0).max(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Belum login" } },
        { status: 401 }
      );
    }

    const userId = await getInternalUserId(user.id);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Rate limit per user
    const rl = checkRateLimit(`pronunciation:${userId}`, RATE_LIMITS.aiPronunciation);
    if (!rl.allowed) {
      return rateLimitResponse(rl) as unknown as NextResponse;
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((e) => e.message).join(", "),
          },
        },
        { status: 400 }
      );
    }

    const { vocabulary_id, kana_id, expected_text, recognized_text, expected_kanji, expected_romaji } = parsed.data;

    // Calculate score server-side
    const result = calculatePronunciationScore(expected_text, recognized_text, {
      kanji: expected_kanji,
      romaji: expected_romaji,
    });

    // Save to DB
    await db.insert(pronunciationAttempt).values({
      userId,
      vocabularyId: vocabulary_id ?? null,
      kanaId: kana_id ?? null,
      expectedText: expected_text,
      recognizedText: recognized_text,
      accuracyScore: result.score / 100,
    });

    return NextResponse.json({
      success: true,
      data: {
        score: result.score,
        isCorrect: result.isCorrect,
        feedback: result.feedback,
      },
    });
  } catch (error) {
    console.error("[POST /api/v1/ai/pronunciation/check]", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Terjadi kesalahan server" } },
      { status: 500 }
    );
  }
}
