import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { getLeechCardsForTraining, getChapterVocabPool } from "@/lib/services/leech-service";

export async function GET(request: NextRequest) {
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

    const vocabId = request.nextUrl.searchParams.get("vocab") ?? undefined;

    const leechCards = await getLeechCardsForTraining(userId, vocabId);

    // Get distractor pool from same chapters
    const chapterNumbers = [...new Set(leechCards.map((c) => c.chapterNumber))];
    const distractorPool = await getChapterVocabPool(chapterNumbers);

    return NextResponse.json({
      success: true,
      data: { leechCards, distractorPool },
    });
  } catch (error) {
    console.error("[GET /api/v1/leech/training]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat data latihan" } },
      { status: 500 }
    );
  }
}
