import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { getAllAchievementsWithStatus } from "@/lib/gamification/achievement-service";

export async function GET() {
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

    const data = await getAllAchievementsWithStatus(userId);

    return NextResponse.json({
      success: true,
      data: {
        achievements: data.achievements,
        totalCount: data.totalCount,
        unlockedCount: data.unlockedCount,
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/gamification/achievements]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengambil data achievement" } },
      { status: 500 }
    );
  }
}
