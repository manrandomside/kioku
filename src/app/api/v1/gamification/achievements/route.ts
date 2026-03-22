import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
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

    const data = await getAllAchievementsWithStatus(user.id);

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
