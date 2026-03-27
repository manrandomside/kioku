"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

import { db } from "@/db";
import { user } from "@/db/schema/user";
import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";

const dailyGoalSchema = z.enum(["100", "300", "500", "750", "1000"]);

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

export async function updateDailyGoal(goal: string) {
  try {
    const parsed = dailyGoalSchema.safeParse(goal);
    if (!parsed.success) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid daily goal value" } };
    }

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

    const [currentUser] = await db
      .select({ dailyGoalXp: user.dailyGoalXp })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    console.log("[user-settings] updateDailyGoal:", {
      userId,
      oldValue: currentUser?.dailyGoalXp,
      newValue: parsed.data,
    });

    await db
      .update(user)
      .set({ dailyGoalXp: parsed.data })
      .where(eq(user.id, userId));

    revalidatePath("/home");
    revalidatePath("/profile");

    return { success: true, data: { dailyGoalXp: parsed.data } };
  } catch (e) {
    const err = e instanceof Error ? { message: e.message, stack: e.stack } : e;
    console.error("[user-settings] updateDailyGoal error:", err);
    return { success: false, error: { code: "INTERNAL", message: "Failed to update daily goal" } };
  }
}
