import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { checkAndUpdateStreak } from "@/lib/gamification/streak-service";

export async function POST() {
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

    const result = await checkAndUpdateStreak(user.id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[POST /api/v1/gamification/daily-check]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengecek aktivitas harian" } },
      { status: 500 }
    );
  }
}
