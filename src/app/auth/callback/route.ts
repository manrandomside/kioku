import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { user } from "@/db/schema/user";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const mode = searchParams.get("mode") as "login" | "register" | null;
  const rawRedirect = searchParams.get("redirectTo") ?? "/home";

  console.log("[auth/callback] URL:", request.url);
  console.log("[auth/callback] code:", code ? "present" : "missing");
  console.log("[auth/callback] mode:", mode);

  // Prevent open redirect: only allow relative paths
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
    ? rawRedirect
    : "/home";

  if (!code) {
    console.log("[auth/callback] No code, redirecting to login");
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // No mode parameter (e.g. magic link, email verification) — use default flow
  if (!mode) {
    console.log("[auth/callback] No mode, redirecting to:", redirectTo);
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // Mode-aware flow (OAuth from login/register page)
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    console.error("[auth/callback] No auth user after session exchange");
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  console.log("[auth/callback] Auth user:", authUser.id);

  try {
    const [existingUser] = await db
      .select({ id: user.id, onboardingDone: user.onboardingDone })
      .from(user)
      .where(eq(user.supabaseAuthId, authUser.id))
      .limit(1);

    console.log("[auth/callback] Existing user:", existingUser ? "found" : "not found");

    if (mode === "login" && !existingUser) {
      console.log("[auth/callback] Login mode, user not registered — signing out");
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=not_registered`);
    }

    if (mode === "register" && !existingUser) {
      console.log("[auth/callback] Register mode, new user — redirecting to onboarding");
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    if (mode === "register" && existingUser) {
      if (!existingUser.onboardingDone) {
        console.log("[auth/callback] Register mode, user exists but onboarding not done — redirecting to onboarding");
        return NextResponse.redirect(`${origin}/onboarding?from=dashboard`);
      }
      console.log("[auth/callback] Register mode, user exists — redirecting to home");
      return NextResponse.redirect(`${origin}/home`);
    }

    // mode === "login" && existingUser
    if (existingUser && !existingUser.onboardingDone) {
      console.log("[auth/callback] Login mode, onboarding not done — redirecting to onboarding");
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    console.log("[auth/callback] Login mode, user exists — redirecting to home");
    return NextResponse.redirect(`${origin}/home`);
  } catch (dbError) {
    console.error("[auth/callback] DB query failed:", dbError);
    // DB failed but auth succeeded — still redirect to home, let dashboard handle it
    return NextResponse.redirect(`${origin}/home`);
  }
}
