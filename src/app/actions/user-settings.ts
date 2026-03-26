"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/user";
import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";

export async function updateAutoPlayAudio(enabled: boolean) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } };
    }

    const userId = await getInternalUserId(authUser.id);
    if (!userId) {
      return { success: false, error: { code: "NOT_FOUND", message: "User not found" } };
    }

    await db
      .update(user)
      .set({ autoPlayAudio: enabled })
      .where(eq(user.id, userId));

    return { success: true, data: { autoPlayAudio: enabled } };
  } catch (e) {
    console.error("[user-settings] updateAutoPlayAudio error:", e);
    return { success: false, error: { code: "INTERNAL", message: "Failed to update auto-play audio" } };
  }
}

export async function updateDisplayMode(mode: "kanji" | "kana") {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } };
    }

    const userId = await getInternalUserId(authUser.id);
    if (!userId) {
      return { success: false, error: { code: "NOT_FOUND", message: "User not found" } };
    }

    await db
      .update(user)
      .set({ displayMode: mode })
      .where(eq(user.id, userId));

    return { success: true, data: { displayMode: mode } };
  } catch (e) {
    console.error("[user-settings] updateDisplayMode error:", e);
    return { success: false, error: { code: "INTERNAL", message: "Failed to update display mode" } };
  }
}
