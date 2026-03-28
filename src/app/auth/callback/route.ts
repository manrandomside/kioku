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

  // Prevent open redirect: only allow relative paths
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
    ? rawRedirect
    : "/home";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser && mode) {
        // Check if user exists in our database
        const [existingUser] = await db
          .select({ id: user.id, onboardingDone: user.onboardingDone })
          .from(user)
          .where(eq(user.supabaseAuthId, authUser.id))
          .limit(1);

        if (mode === "login" && !existingUser) {
          // User trying to login but not registered — sign out and redirect with error
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=not_registered`);
        }

        if (mode === "register" && existingUser) {
          // User already registered — just log them in
          return NextResponse.redirect(`${origin}/home`);
        }

        if (mode === "register" && !existingUser) {
          // New registration — go to onboarding
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // mode === "login" && existingUser
        if (existingUser && !existingUser.onboardingDone) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
