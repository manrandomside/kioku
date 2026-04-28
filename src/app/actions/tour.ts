"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/user";
import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";

export async function markTourCompleted() {
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
      .set({ tourCompleted: true })
      .where(eq(user.id, userId));

    return { success: true, data: { tourCompleted: true } };
  } catch (e) {
    console.error("[tour] markTourCompleted error:", e);
    return { success: false, error: { code: "INTERNAL", message: "Failed to mark tour as completed" } };
  }
}

export async function getTourCompletedStatus() {
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

    const [row] = await db
      .select({ tourCompleted: user.tourCompleted })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return { success: true, data: { tourCompleted: row?.tourCompleted ?? false } };
  } catch (e) {
    // Graceful fallback when column does not yet exist (pre-migration)
    console.error("[tour] getTourCompletedStatus error:", e);
    return { success: true, data: { tourCompleted: false } };
  }
}
