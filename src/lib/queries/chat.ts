import { eq, desc, and, sql } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/user";
import { userGamification } from "@/db/schema/gamification";
import { aiChatSession, aiChatMessage } from "@/db/schema/ai";
import type { UserContext } from "@/lib/ai/system-prompt";

// Fetch user context for building the AI system prompt
export async function getUserContextForChat(
  internalUserId: string
): Promise<UserContext> {
  const [[userData], [gamData]] = await Promise.all([
    db
      .select({
        displayName: user.displayName,
        jlptTarget: user.jlptTarget,
        hirakataKnown: user.hirakataKnown,
      })
      .from(user)
      .where(eq(user.id, internalUserId))
      .limit(1),
    db
      .select({
        totalWordsLearned: userGamification.totalWordsLearned,
      })
      .from(userGamification)
      .where(eq(userGamification.userId, internalUserId))
      .limit(1),
  ]);

  return {
    displayName: userData?.displayName ?? null,
    jlptTarget: userData?.jlptTarget ?? "N5",
    currentChapter: null,
    hirakataKnown: userData?.hirakataKnown ?? false,
    totalWordsLearned: gamData?.totalWordsLearned ?? 0,
  };
}

// Create a new chat session
export async function createChatSession(
  internalUserId: string,
  title?: string
) {
  const [session] = await db
    .insert(aiChatSession)
    .values({
      userId: internalUserId,
      title: title ?? "Percakapan baru",
      messageCount: 0,
    })
    .returning();

  return session;
}

// Save a chat message to a session
export async function saveChatMessage(
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string,
  providerUsed?: string
) {
  const [message] = await db
    .insert(aiChatMessage)
    .values({
      sessionId,
      role,
      content,
      providerUsed: providerUsed ?? null,
    })
    .returning();

  // Increment message count
  await db
    .update(aiChatSession)
    .set({
      messageCount: sql`${aiChatSession.messageCount} + 1`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(aiChatSession.id, sessionId));

  return message;
}

// Auto-generate session title from first user message
export async function updateSessionTitle(
  sessionId: string,
  firstMessage: string
) {
  const title =
    firstMessage.length > 60
      ? firstMessage.slice(0, 57) + "..."
      : firstMessage;

  await db
    .update(aiChatSession)
    .set({ title, updatedAt: new Date().toISOString() })
    .where(eq(aiChatSession.id, sessionId));
}

// Get chat sessions for a user (most recent first)
export async function getChatSessions(internalUserId: string, limit = 20) {
  return db
    .select({
      id: aiChatSession.id,
      title: aiChatSession.title,
      messageCount: aiChatSession.messageCount,
      createdAt: aiChatSession.createdAt,
      updatedAt: aiChatSession.updatedAt,
    })
    .from(aiChatSession)
    .where(eq(aiChatSession.userId, internalUserId))
    .orderBy(desc(aiChatSession.updatedAt))
    .limit(limit);
}

// Get all messages in a session
export async function getSessionMessages(sessionId: string) {
  return db
    .select({
      id: aiChatMessage.id,
      role: aiChatMessage.role,
      content: aiChatMessage.content,
      providerUsed: aiChatMessage.providerUsed,
      createdAt: aiChatMessage.createdAt,
    })
    .from(aiChatMessage)
    .where(eq(aiChatMessage.sessionId, sessionId))
    .orderBy(aiChatMessage.createdAt);
}

// Verify a session belongs to a user
export async function verifySessionOwner(
  sessionId: string,
  internalUserId: string
): Promise<boolean> {
  const [session] = await db
    .select({ id: aiChatSession.id })
    .from(aiChatSession)
    .where(
      and(
        eq(aiChatSession.id, sessionId),
        eq(aiChatSession.userId, internalUserId)
      )
    )
    .limit(1);

  return !!session;
}

// Delete a chat session (cascades to messages)
export async function deleteChatSession(sessionId: string) {
  await db
    .delete(aiChatSession)
    .where(eq(aiChatSession.id, sessionId));
}
