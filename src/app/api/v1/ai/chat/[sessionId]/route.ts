import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { verifySessionOwner, deleteChatSession } from "@/lib/queries/chat";

export async function DELETE(
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

    await deleteChatSession(sessionId);

    return NextResponse.json({
      success: true,
      data: { message: "Sesi chat berhasil dihapus" },
    });
  } catch (error) {
    console.error("[DELETE /api/v1/ai/chat/:sessionId]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menghapus sesi" } },
      { status: 500 }
    );
  }
}
