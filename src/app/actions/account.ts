"use server";

import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import { db } from "@/db";
import { user } from "@/db/schema/user";
import {
  userGamification,
  xpTransaction,
  achievementUnlock,
  userChapterProgress,
  dailyActivity,
} from "@/db/schema/gamification";
import { srsCard, reviewLog } from "@/db/schema/srs";
import { quizSession, quizAnswer } from "@/db/schema/quiz";
import {
  aiChatSession,
  aiChatMessage,
  pronunciationAttempt,
} from "@/db/schema/ai";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";

const deleteConfirmSchema = z.literal("HAPUS AKUN");

export async function deleteUserAccount(confirmText: string) {
  try {
    const parsed = deleteConfirmSchema.safeParse(confirmText);
    if (!parsed.success) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Teks konfirmasi tidak cocok" },
      };
    }

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      };
    }

    const userId = await getInternalUserId(authUser.id);
    if (!userId) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "User not found" },
      };
    }

    // Delete in order (child tables first) for safety, even though CASCADE should handle it
    // 1. AI chat messages (via sessions)
    const userSessions = await db
      .select({ id: aiChatSession.id })
      .from(aiChatSession)
      .where(eq(aiChatSession.userId, userId));
    for (const session of userSessions) {
      await db.delete(aiChatMessage).where(eq(aiChatMessage.sessionId, session.id));
    }
    // 2. AI chat sessions
    await db.delete(aiChatSession).where(eq(aiChatSession.userId, userId));
    // 3. Pronunciation attempts
    await db.delete(pronunciationAttempt).where(eq(pronunciationAttempt.userId, userId));
    // 4. Quiz answers (via sessions)
    const userQuizSessions = await db
      .select({ id: quizSession.id })
      .from(quizSession)
      .where(eq(quizSession.userId, userId));
    for (const qs of userQuizSessions) {
      await db.delete(quizAnswer).where(eq(quizAnswer.sessionId, qs.id));
    }
    // 5. Quiz sessions
    await db.delete(quizSession).where(eq(quizSession.userId, userId));
    // 6. Review logs
    await db.delete(reviewLog).where(eq(reviewLog.userId, userId));
    // 7. SRS cards
    await db.delete(srsCard).where(eq(srsCard.userId, userId));
    // 8. XP transactions
    await db.delete(xpTransaction).where(eq(xpTransaction.userId, userId));
    // 9. Daily activity
    await db.delete(dailyActivity).where(eq(dailyActivity.userId, userId));
    // 10. Achievement unlocks
    await db.delete(achievementUnlock).where(eq(achievementUnlock.userId, userId));
    // 11. User gamification
    await db.delete(userGamification).where(eq(userGamification.userId, userId));
    // 12. User chapter progress
    await db.delete(userChapterProgress).where(eq(userChapterProgress.userId, userId));
    // 13. User record
    await db.delete(user).where(eq(user.id, userId));

    // 14. Delete Supabase Auth user (requires service_role_key)
    const adminClient = createAdminClient();
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
      authUser.id
    );
    if (authDeleteError) {
      console.error("[account] deleteUser auth error:", authDeleteError);
      // Data is already deleted, log but don't fail
    }

    // Sign out current session
    await supabase.auth.signOut();

    return { success: true };
  } catch (e) {
    console.error("[account] deleteUserAccount error:", e);
    return {
      success: false,
      error: { code: "INTERNAL", message: "Gagal menghapus akun. Silakan coba lagi." },
    };
  }
}
