import { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { streamAI } from "@/lib/ai/stream";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import {
  getUserContextForChat,
  createChatSession,
  saveChatMessage,
  updateSessionTitle,
  getSessionMessages,
  verifySessionOwner,
} from "@/lib/queries/chat";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Belum login" } },
        { status: 401 }
      );
    }

    const userId = await getInternalUserId(user.id);
    if (!userId) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    // `id` is the useChat client-side chat ID (not a DB UUID) — ignore it.
    // `sessionId` is our DB session UUID, passed via transport body.
    const { messages: clientMessages, sessionId: bodySessionId } = body;

    // Extract the latest user message text from UIMessage parts
    const lastUserMsg = clientMessages?.findLast(
      (m: { role: string }) => m.role === "user"
    );
    const userText = extractTextFromMessage(lastUserMsg);

    if (!userText) {
      return Response.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Pesan tidak boleh kosong" } },
        { status: 400 }
      );
    }

    // Resolve or create session — only use bodySessionId if it looks like a valid UUID
    const isValidUUID = bodySessionId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bodySessionId);
    let activeSessionId = isValidUUID ? (bodySessionId as string) : undefined;

    if (activeSessionId) {
      const isOwner = await verifySessionOwner(activeSessionId, userId);
      if (!isOwner) {
        return Response.json(
          { success: false, error: { code: "FORBIDDEN", message: "Sesi tidak ditemukan" } },
          { status: 403 }
        );
      }
    } else {
      const session = await createChatSession(userId);
      activeSessionId = session.id;
    }

    // Build conversation history for the AI model
    let conversationMessages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>;

    if (isValidUUID) {
      // Load history from DB + append new user message
      const dbMessages = await getSessionMessages(activeSessionId!);
      conversationMessages = dbMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      conversationMessages.push({ role: "user", content: userText });
    } else {
      conversationMessages = [{ role: "user", content: userText }];
    }

    // Build system prompt with user context
    const userContext = await getUserContextForChat(userId);
    const systemPrompt = buildSystemPrompt(userContext);

    // Save user message to DB
    await saveChatMessage(activeSessionId!, "user", userText);

    // Update title from first message if this is a new session
    if (!isValidUUID) {
      await updateSessionTitle(activeSessionId!, userText);
    }

    // Stream AI response with validated waterfall
    const { body: streamBody, fullText, providerUsed } = await streamAI(userText, {
      system: systemPrompt,
      messages: conversationMessages,
      maxTokens: 1024,
      temperature: 0.7,
    });

    // Save assistant response after streaming completes (in background)
    const finalSessionId = activeSessionId!;
    fullText.then(async (text) => {
      try {
        await saveChatMessage(finalSessionId, "assistant", text, providerUsed);
      } catch (err) {
        console.error("[POST /api/v1/ai/chat] Failed to save assistant message:", err);
      }
    }).catch((err) => {
      console.error("[POST /api/v1/ai/chat] Stream fullText collection failed:", err);
    });

    // Return plain text stream (compatible with TextStreamChatTransport)
    return new Response(streamBody, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Session-Id": finalSessionId,
      },
    });
  } catch (error) {
    console.error("[POST /api/v1/ai/chat]", error);
    return Response.json(
      {
        success: false,
        error: {
          code: "AI_ERROR",
          message: error instanceof Error ? error.message : "Gagal menghubungi AI",
        },
      },
      { status: 500 }
    );
  }
}

// Extract text content from a UIMessage (v6 format with parts) or legacy format
function extractTextFromMessage(
  msg: { parts?: Array<{ type: string; text?: string }>; content?: string } | undefined
): string | null {
  if (!msg) return null;

  // v6 UIMessage format: parts array
  if (msg.parts) {
    const textParts = msg.parts
      .filter((p: { type: string }) => p.type === "text")
      .map((p: { text?: string }) => p.text || "")
      .join("");
    if (textParts) return textParts;
  }

  // Legacy format: content string
  if (typeof msg.content === "string" && msg.content.trim()) {
    return msg.content;
  }

  return null;
}
