import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai";
import { getAvailableProviders } from "@/lib/ai";

// Development-only endpoint to test AI waterfall
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Endpoint tidak tersedia" } },
      { status: 404 }
    );
  }

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

    const availableProviders = getAvailableProviders();

    if (availableProviders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_PROVIDERS",
            message: "Tidak ada AI provider yang tersedia. Set minimal satu API key.",
          },
          availableProviders: [],
        },
        { status: 503 }
      );
    }

    const result = await callAI("Say hello in Japanese and explain the greeting briefly.", {
      system: "You are a helpful Japanese language tutor. Respond concisely.",
      maxTokens: 256,
    });

    return NextResponse.json({
      success: true,
      data: {
        response: result.response,
        providerUsed: result.providerUsed,
        tokensUsed: result.tokensUsed,
        availableProviders: availableProviders.map((p) => p.name),
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/ai/test]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AI_ERROR",
          message: error instanceof Error ? error.message : "Gagal memanggil AI provider",
        },
      },
      { status: 500 }
    );
  }
}
