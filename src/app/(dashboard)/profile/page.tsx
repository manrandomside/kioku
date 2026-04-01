import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = { title: "Profil" };
import {
  Trophy,
  Zap,
  Star,
  Flame,
} from "lucide-react";
import { eq } from "drizzle-orm";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { db } from "@/db";
import { user } from "@/db/schema/user";
import { userGamification } from "@/db/schema/gamification";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DisplayModeSetting } from "@/components/profile/display-mode-setting";
import { AutoPlaySetting } from "@/components/profile/auto-play-setting";
import { DailyGoalSetting } from "@/components/profile/daily-goal-setting";
import { LogoutButton } from "@/components/auth/logout-overlay";
import { EditDisplayName } from "@/components/profile/edit-display-name";

import type { DisplayMode } from "@/stores/display-mode-store";

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
      displayMode: user.displayMode,
      autoPlayAudio: user.autoPlayAudio,
      dailyGoalXp: user.dailyGoalXp,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!profile) redirect("/onboarding");

  // Fetch gamification stats
  const [gamification] = await db
    .select({
      totalXp: userGamification.totalXp,
      currentLevel: userGamification.currentLevel,
      currentStreak: userGamification.currentStreak,
    })
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  const stats = gamification ?? { totalXp: 0, currentLevel: 1, currentStreak: 0 };
  const name = profile.preferredName ?? profile.displayName ?? "User";

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header Card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: "linear-gradient(135deg, #0A3A3A 0%, #0F4F4F 100%)" }}
      >
        {/* Gradient mesh overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse at 80% 20%, rgba(194,233,89,0.1), transparent 50%)",
              "radial-gradient(ellipse at 20% 80%, rgba(166,226,172,0.08), transparent 50%)",
            ].join(", "),
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="rounded-full ring-2 ring-[#C2E959]/40 ring-offset-2 ring-offset-[#0A3A3A]">
            <Avatar className="size-20">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={name ?? undefined} />
              ) : null}
              <AvatarFallback className="text-xl">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex flex-col items-center text-center">
            <EditDisplayName initialName={name} />
            <p className="mt-0.5 text-sm text-white/50">{profile.email}</p>
            {profile.jlptTarget && (
              <div className="mt-2 flex flex-col items-center gap-1">
                <span className="inline-block rounded-full bg-[#C2E959] px-3 py-1 text-xs font-bold text-[#0A3A3A]">
                  Target JLPT {profile.jlptTarget}
                </span>
                <span className="text-[10px] text-white/30">
                  Level otomatis berubah berdasarkan progres belajar
                </span>
              </div>
            )}
          </div>

          {/* Mini stats */}
          <div className="mt-1 flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <Zap className="size-4 text-[#C2E959]" />
              <span className="text-sm font-bold text-white">{stats.totalXp.toLocaleString("id-ID")}</span>
              <span className="text-xs text-white/40">XP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="size-4 text-[#C2E959]" />
              <span className="text-sm font-bold text-white">Lv.{stats.currentLevel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="size-4 text-[#C2E959]" />
              <span className="text-sm font-bold text-white">{stats.currentStreak}</span>
              <span className="text-xs text-white/40">hari</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
        <div className="p-5">
          <DisplayModeSetting initialMode={(profile.displayMode as DisplayMode) ?? "kanji"} />
        </div>
        <div className="h-px bg-border/50" />
        <div className="p-5">
          <AutoPlaySetting initialEnabled={profile.autoPlayAudio ?? true} />
        </div>
        <div className="h-px bg-border/50" />
        <div className="p-5">
          <DailyGoalSetting initialGoal={profile.dailyGoalXp ?? "100"} />
        </div>
      </div>

      {/* Quick Links */}
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

      {/* Sign Out */}
      <LogoutButton className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10" />

      {/* Footer */}
      <div className="pb-2 text-center">
        <p className="text-xs text-muted-foreground">
          Kioku v1.0 &mdash; Platform belajar kosakata bahasa Jepang
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/60">
          Dibuat sebagai project portfolio fullstack + AI
        </p>
      </div>
    </div>
  );
}
