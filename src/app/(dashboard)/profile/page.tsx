import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { eq } from "drizzle-orm";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { db } from "@/db";
import { user } from "@/db/schema/user";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const userId = await getInternalUserId(authUser.id);
  if (!userId) redirect("/onboarding");

  const [profile] = await db
    .select({
      displayName: user.displayName,
      preferredName: user.preferredName,
      avatarUrl: user.avatarUrl,
      jlptTarget: user.jlptTarget,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!profile) redirect("/onboarding");

  const name = profile.preferredName ?? profile.displayName ?? "User";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card p-6">
        <Avatar size="lg">
          {profile.avatarUrl ? (
            <AvatarImage src={profile.avatarUrl} alt={name ?? undefined} />
          ) : null}
          <AvatarFallback>
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h1 className="font-display text-xl font-bold tracking-tight">
            {name}
          </h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          {profile.jlptTarget && (
            <p className="mt-1 text-sm text-muted-foreground">
              Target JLPT {profile.jlptTarget}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        <Link
          href="/profile/achievements"
          className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-yellow-500/10">
            <Trophy className="size-4.5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Achievement</p>
            <p className="text-xs text-muted-foreground">Lihat semua badge</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
