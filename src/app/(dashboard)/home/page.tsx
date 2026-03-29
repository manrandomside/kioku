import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  BookOpen,
  ArrowRight,
  Brain,
  Shield,
  Trophy,
  AlertTriangle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/queries/dashboard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { DailyProgressBars } from "@/components/gamification/daily-progress-bars";
import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { ActivityHeatmap } from "@/components/gamification/activity-heatmap";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { LearningProgress } from "@/components/gamification/learning-progress";

export const metadata: Metadata = { title: "Dashboard" };

// Always fetch fresh data — XP/streak may have changed from flashcard/quiz sessions
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const data = await getDashboardData(user.id);

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
              {data.profile.avatarUrl ? (
                <AvatarImage src={data.profile.avatarUrl} alt={name} />
              ) : null}
              <AvatarFallback>
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
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

      {/* Section 2: Quick Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/review"
          className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10">
            <BookOpen className="size-4.5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Review</p>
            <p className="text-xs text-muted-foreground">{data.srs.dueNow} kartu menunggu</p>
          </div>
        </Link>
        <Link
          href={
            data.mnnRecommendation
              ? data.mnnRecommendation.status === "completed"
                ? "/learn/mnn"
                : `/learn/mnn/${data.mnnRecommendation.chapterSlug}`
              : "/learn/mnn"
          }
          className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
            <Brain className="size-4.5 text-blue-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {data.mnnRecommendation?.status === "completed"
                  ? `N${data.profile.jlptTarget === "N5" ? "5" : "4"} Selesai! Siap untuk N${data.profile.jlptTarget === "N5" ? "4" : "3"}?`
                  : "Belajar MNN"}
              </p>
              {data.mnnRecommendation?.status === "completed" && (
                <span className="shrink-0 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
                  Completed
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {!data.mnnRecommendation
                ? "Lanjutkan bab"
                : data.mnnRecommendation.status === "completed"
                  ? `Semua ${data.mnnRecommendation.totalChapters} bab JLPT ${data.profile.jlptTarget} telah dikuasai`
                  : data.mnnRecommendation.status === "start"
                    ? `Mulai dari Bab ${data.mnnRecommendation.chapterNumber}`
                    : `Lanjutkan Bab ${data.mnnRecommendation.chapterNumber} · ${data.mnnRecommendation.vocabMastered}/${data.mnnRecommendation.vocabCount} kata dikuasai`}
            </p>
          </div>
        </Link>
        <Link
          href="/learn/hirakata"
          className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10">
            <span className="text-base font-bold text-purple-500">
              {"\u3042"}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold">Hirakata</p>
            <p className="text-xs text-muted-foreground">Hiragana & Katakana</p>
          </div>
        </Link>
      </div>

      {/* Section 3: Streak + Due Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Streak Card */}
        <div
          className={`flex items-center gap-4 rounded-2xl border p-5 ${
            data.streak.atRisk
              ? "border-yellow-500/40 bg-yellow-500/5"
              : "border-border/50 bg-card"
          }`}
        >
          <div
            className={`flex size-14 items-center justify-center rounded-xl ${
              data.streak.current > 0
                ? "bg-orange-500/10"
                : "bg-muted"
            }`}
          >
            <StreakFlame streak={data.streak.current} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground">
              Streak Belajar
            </p>
            <p className="mt-0.5 text-3xl font-bold leading-none">
              {data.streak.current}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                hari
              </span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Terpanjang: {data.streak.longest} hari
            </p>
            {data.streak.atRisk && (
              <p className="mt-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                Streak terancam! Belajar hari ini.
              </p>
            )}
            {data.streak.freezes > 0 && !data.streak.atRisk && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="size-3 text-blue-400" />
                {data.streak.freezes} freeze tersedia
              </div>
            )}
          </div>
        </div>

        {/* Due Cards */}
        <Link
          href="/review"
          className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 transition-colors hover:border-[#248288]/40 hover:bg-[#248288]/5"
        >
          <div className="flex size-14 items-center justify-center rounded-xl bg-[#248288]/10">
            <Clock className="size-7 text-[#248288]" />
          </div>
          <div className="flex-1">
            <p className="text-3xl font-bold leading-none">
              {data.srs.dueNow}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                kartu
              </span>
            </p>

            {data.srs.dueNow > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
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
                    {data.srs.overdue} terlambat!
                  </span>
                )}
              </div>
            )}

            {data.srs.dueNow === 0 && data.srs.nextDueAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Review berikutnya: {formatRelativeTime(data.srs.nextDueAt)}
              </p>
            )}

            {data.srs.dueNow === 0 && !data.srs.nextDueAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Belum ada kartu untuk di-review
              </p>
            )}
          </div>
          <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
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
    </div>
  );
}

function formatRelativeTime(isoDate: string): string {
  const now = new Date();
  const target = new Date(isoDate);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs < 0) return "sekarang";

  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} menit lagi`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam lagi`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "besok";
  return `${diffDays} hari lagi`;
}
