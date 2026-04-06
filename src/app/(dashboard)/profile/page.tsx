import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

import {
  Trophy,
  LogOut,
} from "lucide-react";
import { eq, count, avg, and, sql } from "drizzle-orm";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { db } from "@/db";
import { user } from "@/db/schema/user";
import { userGamification, achievementUnlock, dailyActivity } from "@/db/schema/gamification";
import { quizSession } from "@/db/schema/quiz";
import { aiChatSession } from "@/db/schema/ai";
import { getTotalQuizMasteredWords } from "@/lib/progress/quiz-mastery";
import { calculateLevel } from "@/lib/gamification/xp-service";
import { DisplayModeSetting } from "@/components/profile/display-mode-setting";
import { AutoPlaySetting } from "@/components/profile/auto-play-setting";
import { DailyGoalSetting } from "@/components/profile/daily-goal-setting";
import { SecuritySetting } from "@/components/profile/security-setting";
import { DangerZone } from "@/components/profile/danger-zone";
import { ProfileStats } from "@/components/profile/profile-stats";
import { AvatarPicker } from "@/components/profile/avatar-picker";
import { LogoutButton } from "@/components/auth/logout-overlay";
import { EditDisplayName } from "@/components/profile/edit-display-name";

import type { DisplayMode } from "@/stores/display-mode-store";

function isValidDateString(value: string | null | undefined): boolean {
  if (!value || value === "now()") return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const userId = await getInternalUserId(authUser.id);
  if (!userId) redirect("/onboarding");

  // Detect auth provider
  const authProvider = authUser.app_metadata?.provider ?? "email";

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
      createdAt: user.createdAt,
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
      longestStreak: userGamification.longestStreak,
      totalReviews: userGamification.totalReviews,
    })
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  // Fetch additional stats in parallel (use same query as dashboard for Kata Dikuasai)
  const [
    quizCountResult,
    achievementCountResult,
    chatCountResult,
    quizAccuracyResult,
    daysActiveResult,
    totalMasteredWords,
  ] = await Promise.all([
    db.select({ value: count() }).from(quizSession).where(
      and(eq(quizSession.userId, userId), eq(quizSession.isCompleted, true))
    ),
    db.select({ value: count() }).from(achievementUnlock).where(eq(achievementUnlock.userId, userId)),
    db.select({ value: count() }).from(aiChatSession).where(eq(aiChatSession.userId, userId)),
    db.select({ value: avg(quizSession.scorePercent) }).from(quizSession).where(
      and(eq(quizSession.userId, userId), eq(quizSession.isCompleted, true))
    ),
    db.select({ value: count(sql`DISTINCT ${dailyActivity.activityDate}`) }).from(dailyActivity).where(
      eq(dailyActivity.userId, userId)
    ),
    getTotalQuizMasteredWords(userId),
  ]);

  const stats = gamification ?? { totalXp: 0, currentLevel: 1, currentStreak: 0, longestStreak: 0, totalReviews: 0 };
  const name = profile.preferredName ?? profile.displayName ?? "User";

  const quizCompleted = quizCountResult[0]?.value ?? 0;
  const quizAccuracy = Math.round(Number(quizAccuracyResult[0]?.value ?? 0));
  const daysActive = daysActiveResult[0]?.value ?? 0;

  // Calculate XP level progress
  const { xpForCurrentLevel, xpForNextLevel } = calculateLevel(stats.totalXp);

  const dangerZoneStats = {
    wordsLearned: totalMasteredWords,
    quizSessions: quizCompleted,
    achievementsUnlocked: achievementCountResult[0]?.value ?? 0,
    currentStreak: stats.currentStreak,
    chatSessions: chatCountResult[0]?.value ?? 0,
  };

  const profileStatsData = {
    totalXp: stats.totalXp,
    currentLevel: stats.currentLevel,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    xpInLevel: xpForCurrentLevel,
    xpForNextLevel,
    wordsLearned: totalMasteredWords,
    quizCompleted,
    quizAccuracy,
    daysActive,
    totalReviews: stats.totalReviews,
    // Prefer profile.createdAt if valid, fallback to Supabase Auth created_at (always valid)
    joinedAt: isValidDateString(profile.createdAt) ? profile.createdAt : (authUser.created_at ?? ""),
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header Card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg, #0A3A3A 0%, #0F4F4F 50%, #248288 100%)" }}
      >
        {/* Gradient mesh overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse at 80% 20%, rgba(194,233,89,0.12), transparent 50%)",
              "radial-gradient(ellipse at 20% 80%, rgba(166,226,172,0.08), transparent 50%)",
              "radial-gradient(ellipse at 50% 50%, rgba(36,130,136,0.1), transparent 60%)",
            ].join(", "),
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-5">
          <AvatarPicker currentAvatar={profile.avatarUrl} displayName={name} />

          <div className="flex flex-col items-center text-center">
            <EditDisplayName initialName={name} />
            <p className="mt-0.5 text-sm text-white/50">{profile.email}</p>
            {profile.jlptTarget && (
              <div className="mt-3 flex flex-col items-center gap-1">
                <span className="inline-block rounded-full bg-[#C2E959] px-3 py-1 text-xs font-bold text-[#0A3A3A]">
                  Target JLPT {profile.jlptTarget}
                </span>
                <span className="text-[10px] text-white/30">
                  Level otomatis berubah berdasarkan progres belajar
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistik Belajar */}
      <ProfileStats stats={profileStatsData} />

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

      {/* Security — shown for all users */}
      <SecuritySetting authProvider={authProvider} email={profile.email} />

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

      {/* Danger Zone */}
      <DangerZone stats={dangerZoneStats} />

      {/* Sign Out */}
      <LogoutButton displayName={profile.displayName ?? undefined} className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
        <LogOut className="size-4" />
        Keluar
      </LogoutButton>

      {/* Footer */}
      <div className="pb-2 text-center">
        <p className="text-xs text-muted-foreground">
          Kioku v1.0 &mdash; Platform belajar kosakata bahasa Jepang
        </p>
      </div>
    </div>
  );
}
