import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { db } from "@/db";
import { user as userTable } from "@/db/schema/user";
import { AppShell } from "@/components/layout/app-shell";
import { DisplayModeProvider } from "@/components/providers/display-mode-provider";
import { AutoPlayProvider } from "@/components/providers/auto-play-provider";

import type { DisplayMode } from "@/stores/display-mode-store";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // avatarUrl is resolved later after DB fetch; declared here for scope
  let dbAvatarUrl: string | null = null;

  // Fetch user preferences and check onboarding
  let displayMode: DisplayMode = "kanji";
  let autoPlayAudio = true;
  const internalUserId = await getInternalUserId(user.id);

  if (!internalUserId) {
    redirect("/onboarding?from=dashboard");
  }

  const [row] = await db
    .select({
      displayMode: userTable.displayMode,
      autoPlayAudio: userTable.autoPlayAudio,
      onboardingDone: userTable.onboardingDone,
      avatarUrl: userTable.avatarUrl,
    })
    .from(userTable)
    .where(eq(userTable.id, internalUserId))
    .limit(1);

  if (!row || !row.onboardingDone) {
    redirect("/onboarding?from=dashboard");
  }

  dbAvatarUrl = row.avatarUrl;

  if (row.displayMode === "kana") {
    displayMode = "kana";
  }
  if (row.autoPlayAudio === false) {
    autoPlayAudio = false;
  }

  // Prefer DB avatarUrl (emoji or custom), fall back to OAuth avatar
  const userInfo = {
    email: user.email,
    displayName: user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name,
    avatarUrl: dbAvatarUrl ?? user.user_metadata?.avatar_url,
  };

  return (
    <AutoPlayProvider initialEnabled={autoPlayAudio}>
      <DisplayModeProvider initialMode={displayMode}>
        <AppShell user={userInfo}>{children}</AppShell>
      </DisplayModeProvider>
    </AutoPlayProvider>
  );
}
