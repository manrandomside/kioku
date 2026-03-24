import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { getSessionMessages, verifySessionOwner } from "@/lib/queries/chat";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
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

    const isOwner = await verifySessionOwner(sessionId, userId);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Sesi tidak ditemukan" } },
        { status: 403 }
      );
    }

    const messages = await getSessionMessages(sessionId);

    return NextResponse.json({ success: true, data: { messages } });
  } catch (error) {
    console.error("[GET /api/v1/ai/chat/:sessionId/messages]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengambil pesan" } },
      { status: 500 }
    );
  }
}
