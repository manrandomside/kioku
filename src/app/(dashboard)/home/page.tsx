import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  ArrowRight,
  Shield,
  Trophy,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/queries/dashboard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { DailyProgressBars } from "@/components/gamification/daily-progress-bars";
import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { ActivityHeatmap } from "@/components/gamification/activity-heatmap-lazy";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { StreakReminder } from "@/components/gamification/streak-reminder";
import { LearningProgress } from "@/components/gamification/learning-progress";
import { ReviewCountdown } from "@/components/gamification/review-countdown";
import { JlptUpgradeHandler } from "@/components/gamification/jlpt-upgrade-handler";
import { SmartStudyCard } from "@/components/gamification/smart-study-card";
import { InstallBanner } from "@/components/pwa/install-banner";
import { InteractiveTour } from "@/components/dashboard/interactive-tour";

export const metadata: Metadata = { title: "Dashboard" };

// Always fetch fresh data — XP/streak may have changed from flashcard/quiz sessions
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let data;
  try {
    data = await getDashboardData(user.id);
  } catch (err) {
    console.error("[home] getDashboardData threw:", err);
    data = null;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground">Data belum tersedia.</p>
        <Link href="/onboarding" className="text-primary underline">
          Selesaikan onboarding
        </Link>
      </div>
    );
  }

  const name = data.profile.preferredName || data.profile.displayName;

  return (
    <div className="flex flex-col gap-6">

      {/* Section 1: Welcome + Level + Daily Goal */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <Avatar size="lg">
              {data.profile.avatarUrl && !data.profile.avatarUrl.startsWith("http") ? (
                <AvatarFallback className="text-lg">
                  {data.profile.avatarUrl}
                </AvatarFallback>
              ) : (
                <AvatarFallback>
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="absolute -bottom-1 -right-1 flex h-5 items-center justify-center rounded-full bg-[#248288] px-1.5 text-[10px] font-bold text-white ring-2 ring-card">
              {data.level.current}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">
              Halo, {name}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Target JLPT {data.profile.jlptTarget}
            </p>
          </div>
        </div>

        <DailyProgressBars
          level={data.level}
          daily={data.daily}
        />
      </div>

      {/* Section 2: Belajar Sekarang — Primary CTA */}
      <div id="tour-smart-study">
        <SmartStudyCard />
      </div>

      {/* Overdue warning banner */}
      {data.srs.overdue >= 5 && (
        <Link
          href="/review"
          className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3"
        >
          <AlertTriangle className="size-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-400">
            Kamu punya {data.srs.overdue} kartu yang sudah terlambat di-review.
            Semakin lama ditunda, semakin banyak yang terlupa. Review sekarang hanya butuh ~{Math.ceil(data.srs.dueNow * 0.3)} menit!
          </p>
        </Link>
      )}

      {/* Section 3: Three small cards — Streak + Due Cards + Leech */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Streak Card */}
        <div id="tour-streak" className="flex flex-col rounded-2xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex size-12 items-center justify-center rounded-xl ${
                data.streak.current > 0
                  ? "bg-orange-500/10"
                  : "bg-muted"
              }`}
            >
              <StreakFlame streak={data.streak.current} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">
                Streak Belajar
              </p>
              <p className="mt-0.5 text-2xl font-bold leading-none">
                {data.streak.current}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  hari
                </span>
              </p>
              <div className="mt-1 flex items-center gap-3">
                <p className="text-[11px] text-muted-foreground">
                  Terpanjang: {data.streak.longest} hari
                </p>
                {data.streak.freezes > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Shield className="size-3 text-blue-400" />
                    {data.streak.freezes} freeze
                  </div>
                )}
              </div>
            </div>
          </div>
          <StreakReminder
            streak={data.streak.current}
            isActiveToday={data.streak.isActiveToday}
            displayName={data.profile.displayName}
          />
        </div>

        {/* Due Cards / Review Breakdown */}
        <Link
          id="tour-review"
          href="/review"
          className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 transition-colors hover:border-[#248288]/40 hover:bg-[#248288]/5"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#248288]/10">
            <Clock className="size-6 text-[#248288]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">
              Review
            </p>
            <p className="mt-0.5 text-2xl font-bold leading-none">
              {data.srs.dueNow}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                kartu
              </span>
            </p>

            {data.srs.dueNow > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                {data.srs.dueLearning > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-yellow-400" />
                    {data.srs.dueLearning} learning
                  </span>
                )}
                {data.srs.dueReview > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-green-400" />
                    {data.srs.dueReview} review
                  </span>
                )}
                {data.srs.overdue > 0 && (
                  <span className="flex items-center gap-1 font-medium text-red-400">
                    <span className="size-1.5 rounded-full bg-red-400" />
                    {data.srs.overdue} terlambat
                  </span>
                )}
              </div>
            )}

            {(data.srs.overdue > 0 || data.srs.nextDueAt) && (
              <div className="mt-1">
                <ReviewCountdown
                  overdue={data.srs.overdue}
                  nextDueAt={data.srs.nextDueAt}
                  nextDueCount={data.srs.nextDueCount}
                />
              </div>
            )}

            {data.srs.dueNow === 0 && !data.srs.nextDueAt && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Belum ada kartu
              </p>
            )}
          </div>
        </Link>

        {/* Leech / Kata Sulit Card */}
        <Link
          id="tour-leech"
          href="/kata-sulit"
          className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 transition-colors hover:border-yellow-500/40 hover:bg-yellow-500/5"
        >
          <div
            className={`flex size-12 items-center justify-center rounded-xl ${
              data.leechCount > 0 || data.confusedPairsCount > 0 ? "bg-yellow-500/10" : "bg-green-500/10"
            }`}
          >
            {data.leechCount > 0 || data.confusedPairsCount > 0 ? (
              <AlertTriangle className="size-6 text-yellow-500" />
            ) : (
              <CheckCircle2 className="size-6 text-green-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">
              Kata Sulit
            </p>
            {data.leechCount > 0 || data.confusedPairsCount > 0 ? (
              <div className="mt-0.5 flex flex-col gap-0.5">
                {data.leechCount > 0 && (
                  <p className="text-sm font-bold leading-snug">
                    {data.leechCount}
                    <span className="ml-1 font-normal text-muted-foreground">
                      kata sering lupa
                    </span>
                  </p>
                )}
                {data.confusedPairsCount > 0 && (
                  <p className="text-sm font-bold leading-snug">
                    {data.confusedPairsCount}
                    <span className="ml-1 font-normal text-muted-foreground">
                      pasangan tertukar
                    </span>
                  </p>
                )}
                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-yellow-600 dark:text-yellow-400">
                  Latihan khusus tersedia
                  <ArrowRight className="size-3" />
                </p>
              </div>
            ) : (
              <>
                <p className="mt-0.5 text-sm font-medium text-green-600 dark:text-green-400">
                  Tidak ada kata sulit
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Semua kata terjawab dengan baik. Terus pertahankan!
                </p>
              </>
            )}
          </div>
        </Link>
      </div>

      {/* Section 4: Progres Belajar */}
      <LearningProgress progress={data.progress} />

      {/* Section 5: Achievement Preview */}
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="size-4.5 text-yellow-500" />
            <h3 className="text-sm font-semibold">Achievement</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {data.totalAchievements.unlocked}/{data.totalAchievements.total}
            </span>
          </div>
          <Link
            href="/profile/achievements"
            className="flex items-center gap-1 text-xs font-medium text-[#248288] hover:underline"
          >
            Lihat Semua
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {data.recentAchievements.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {data.recentAchievements.map((ach) => (
              <AchievementBadge
                key={ach.id}
                achievement={{
                  id: ach.id,
                  name: ach.name,
                  nameEn: null,
                  description: "",
                  icon: ach.icon,
                  badgeColor: ach.badgeColor,
                  type: "",
                  xpReward: ach.xpReward,
                  isUnlocked: true,
                  unlockedAt: ach.unlockedAt,
                }}
                size="sm"
              />
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Belum ada achievement. Mulai belajar untuk membuka badge!
          </p>
        )}
      </div>

      {/* Section 6: Activity Heatmap */}
      <ActivityHeatmap />

      {/* JLPT Upgrade Modal */}
      <JlptUpgradeHandler upgrade={data.jlptUpgrade} />

      <InstallBanner variant="dashboard" />

      {/* Interactive Onboarding Tour */}
      <InteractiveTour />
    </div>
  );
}
