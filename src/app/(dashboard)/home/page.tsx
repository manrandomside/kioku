import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  BookOpen,
  ArrowRight,
  Zap,
  Target,
  Brain,
  BarChart3,
  Shield,
  Trophy,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/queries/dashboard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { DailyGoalRing } from "@/components/gamification/daily-goal-ring";
import { SrsDistribution } from "@/components/gamification/srs-distribution";
import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { ActivityHeatmap } from "@/components/gamification/activity-heatmap";
import { StreakFlame } from "@/components/gamification/streak-flame";

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
      {/* Welcome + Level + Daily Goal */}
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

        <div className="flex items-center gap-4 sm:gap-5">
          {/* XP Progress */}
          <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-initial">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="size-3.5 shrink-0 text-[#C2E959]" />
              <span className="truncate">
                {data.level.xpInLevel} / {data.level.xpNeeded} XP
              </span>
            </div>
            <div className="h-2 w-full max-w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#248288] to-[#C2E959] transition-all"
                style={{ width: `${data.level.progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Level {data.level.current} -- {data.level.totalXp} XP total
            </p>
          </div>

          {/* Daily Goal Ring */}
          <DailyGoalRing
            earned={data.daily.xpEarned}
            goal={data.daily.xpGoal}
            met={data.daily.goalMet}
          />
        </div>
      </div>

      {/* Streak + Due Cards Row */}
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
            <p className="text-3xl font-bold leading-none">
              {data.streak.current}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                hari
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
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
            <p className="mt-1 text-xs text-muted-foreground">
              Jatuh tempo untuk review
            </p>
          </div>
          <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Quick Actions */}
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
          href="/learn/mnn"
          className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
            <Brain className="size-4.5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Belajar MNN</p>
            <p className="text-xs text-muted-foreground">Lanjutkan bab</p>
          </div>
        </Link>
        <Link
          href="/learn/hirakata"
          className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10">
            <span className="text-base font-bold text-purple-500">
              あ
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold">Hirakata</p>
            <p className="text-xs text-muted-foreground">Hiragana & Katakana</p>
          </div>
        </Link>
      </div>

      {/* Stats + SRS Distribution */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <StatCard
            icon={<BookOpen className="size-4.5 text-green-500" />}
            label="Kata Dipelajari"
            value={data.stats.totalWordsLearned.toLocaleString("id-ID")}
            bg="bg-green-500/10"
          />
          <StatCard
            icon={<Zap className="size-4.5 text-[#C2E959]" />}
            label="Total Review"
            value={data.stats.totalReviews.toLocaleString("id-ID")}
            bg="bg-[#C2E959]/10"
          />
          <StatCard
            icon={<Target className="size-4.5 text-blue-500" />}
            label="Quiz Selesai"
            value={data.stats.quizCompleted.toLocaleString("id-ID")}
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={<BarChart3 className="size-4.5 text-purple-500" />}
            label="Akurasi Quiz"
            value={data.stats.quizCompleted > 0 ? `${data.stats.quizAvgScore}%` : "--"}
            bg="bg-purple-500/10"
          />
        </div>

        {/* SRS Distribution */}
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Distribusi SRS</h3>
          <SrsDistribution
            newCount={data.srs.newCount}
            learningCount={data.srs.learningCount}
            reviewCount={data.srs.reviewCount}
            relearningCount={data.srs.relearningCount}
            total={data.srs.totalCards}
          />
        </div>
      </div>

      {/* Achievement Preview */}
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

      {/* Activity Heatmap */}
      <ActivityHeatmap />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 sm:p-4">
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9 ${bg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold leading-tight sm:text-lg">{value}</p>
        <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{label}</p>
      </div>
    </div>
  );
}
