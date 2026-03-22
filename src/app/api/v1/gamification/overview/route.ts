import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getXpOverview } from "@/lib/gamification/xp-service";
import { getStreakInfo } from "@/lib/gamification/streak-service";

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

    const [xpOverview, streakInfo] = await Promise.all([
      getXpOverview(user.id),
      getStreakInfo(user.id),
    ]);

    if (!xpOverview) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Data gamifikasi tidak ditemukan" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        level: {
          current: xpOverview.currentLevel,
          totalXp: xpOverview.totalXp,
          xpInLevel: xpOverview.xpForCurrentLevel,
          xpNeeded: xpOverview.xpForNextLevel,
          progressPercent: xpOverview.xpProgressPercent,
        },
        streak: {
          current: xpOverview.currentStreak,
          longest: xpOverview.longestStreak,
          freezes: xpOverview.streakFreezes,
          isActiveToday: streakInfo?.isActiveToday ?? false,
          atRisk: streakInfo?.streakAtRisk ?? false,
        },
        daily: {
          xpEarned: xpOverview.dailyXpEarned,
          xpGoal: xpOverview.dailyGoalXp,
          goalMet: xpOverview.dailyGoalMet,
          progressPercent: xpOverview.dailyGoalPercent,
        },
        stats: {
          totalReviews: xpOverview.totalReviews,
          totalWordsLearned: xpOverview.totalWordsLearned,
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/gamification/overview]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengambil data gamifikasi" } },
      { status: 500 }
    );
  }
}
