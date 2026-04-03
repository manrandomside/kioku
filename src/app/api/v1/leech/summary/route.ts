import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { getLeechSummary } from "@/lib/services/leech-service";

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

    const summary = await getLeechSummary(userId);

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("[GET /api/v1/leech/summary]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengambil ringkasan kata sulit" } },
      { status: 500 }
    );
  }
}
