"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

import { db } from "@/db";
import { user } from "@/db/schema/user";
import { userGamification } from "@/db/schema/gamification";
import { createClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  displayName: z.string().min(1, "Nama tidak boleh kosong").max(100),
  preferredName: z.string().max(50).optional(),
  jlptTarget: z.enum(["N5", "N4"]),
  dailyGoalXp: z.enum(["100", "300", "500", "750", "1000"]),
  hirakataKnown: z.boolean(),
});

type OnboardingInput = z.infer<typeof onboardingSchema>;

export async function completeOnboarding(data: OnboardingInput) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return {
      success: false as const,
      error: { code: "UNAUTHORIZED", message: "Belum login" },
    };
  }

  const result = onboardingSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false as const,
      error: { code: "VALIDATION_ERROR", message: "Data tidak valid" },
    };
  }

  const validated = result.data;

  try {
    // Check if user profile exists
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.supabaseAuthId, authUser.id))
      .limit(1);

    let userId: string;

    if (existing.length > 0) {
      const [updated] = await db
        .update(user)
        .set({
          displayName: validated.displayName,
          preferredName: validated.preferredName || null,
          jlptTarget: validated.jlptTarget,
          dailyGoalXp: validated.dailyGoalXp,
          hirakataKnown: validated.hirakataKnown,
          onboardingDone: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(user.supabaseAuthId, authUser.id))
        .returning();

      userId = updated.id;
    } else {
      const [created] = await db
        .insert(user)
        .values({
          supabaseAuthId: authUser.id,
          email: authUser.email!,
          displayName: validated.displayName,
          preferredName: validated.preferredName || null,
          avatarUrl: authUser.user_metadata?.avatar_url ?? null,
          jlptTarget: validated.jlptTarget,
          dailyGoalXp: validated.dailyGoalXp,
          hirakataKnown: validated.hirakataKnown,
          onboardingDone: true,
        })
        .returning();

      userId = created.id;
    }

    // Ensure gamification row exists
    const existingGamification = await db
      .select()
      .from(userGamification)
      .where(eq(userGamification.userId, userId))
      .limit(1);

    if (existingGamification.length === 0) {
      await db.insert(userGamification).values({ userId });
    }

    revalidatePath("/", "layout");

    return {
      success: true as const,
      data: { hirakataKnown: validated.hirakataKnown },
    };
  } catch (error) {
    console.error("[completeOnboarding]", error);
    return {
      success: false as const,
      error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan data onboarding" },
    };
  }
}
