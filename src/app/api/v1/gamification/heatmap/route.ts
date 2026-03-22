import { NextResponse } from "next/server";
import { eq, and, gte, lte } from "drizzle-orm";

import { db } from "@/db";
import { dailyActivity } from "@/db/schema/gamification";
import { createClient } from "@/lib/supabase/server";

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

    // Last 365 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 364);

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const rows = await db
      .select({
        date: dailyActivity.activityDate,
        xpEarned: dailyActivity.xpEarned,
        reviewsCount: dailyActivity.reviewsCount,
        quizCount: dailyActivity.quizCount,
      })
      .from(dailyActivity)
      .where(
        and(
          eq(dailyActivity.userId, user.id),
          gte(dailyActivity.activityDate, startStr),
          lte(dailyActivity.activityDate, endStr)
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        activities: rows,
        startDate: startStr,
        endDate: endStr,
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/gamification/heatmap]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengambil data heatmap" } },
      { status: 500 }
    );
  }
}
