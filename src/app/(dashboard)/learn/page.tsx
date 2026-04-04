import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Languages,
  Info,
  Clock,
  CheckCircle2,
  Sparkles,
  Zap,
  RotateCcw,
  Flame,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { getSmartSessionStatus } from "@/lib/services/smart-study-service";
import { getSrsStats } from "@/lib/queries/review";
import { getLeechSummary } from "@/lib/services/leech-service";
import { ReviewCountdown } from "@/components/gamification/review-countdown";

export const metadata: Metadata = { title: "Belajar" };

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const internalId = await getInternalUserId(user.id);

  // Fetch data in parallel; gracefully handle missing internal ID
  const [studyStatus, srsStats, leechSummary] = internalId
    ? await Promise.all([
        getSmartSessionStatus(internalId),
        getSrsStats(internalId),
        getLeechSummary(internalId),
      ])
    : [null, null, null];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
          Belajar
        </h1>
        <p className="mt-1 text-muted-foreground">
          Mulai dari mana kamu mau belajar hari ini?
        </p>
      </div>

      {/* Section 1: Metode Belajar */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Metode Belajar
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {/* Card 1 — Belajar Sekarang */}
          <Link
            href="/study/session"
            className="group relative min-h-[180px] overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-[#C2E959]/[0.08] to-transparent p-5 transition-all duration-300 hover:scale-[1.02] hover:border-[#C2E959]/50 hover:shadow-xl sm:p-8 lg:min-h-[220px]"
          >
            {/* Decorative character */}
            <div className="pointer-events-none absolute -bottom-4 -right-2 select-none font-jp" aria-hidden="true">
              <span className="inline-block text-[120px] leading-none text-foreground/[0.06] -rotate-[10deg]">
                {"\u5B66"}
              </span>
            </div>

            <div className="relative z-10">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#C2E959]/15">
                {studyStatus?.dailyGoalMet ? (
                  <Sparkles className="size-7 text-[#C2E959]" />
                ) : (
                  <Zap className="size-7 text-[#C2E959]" />
                )}
              </div>
              <h3 className="mt-5 text-xl font-bold">Belajar Sekarang</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sesi otomatis 3 fase: review, kata baru, dan quiz
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {studyStatus ? (
                  <>
                    {studyStatus.dailyGoalMet ? (
                      <span className="rounded-full bg-[#C2E959]/15 px-3 py-1 text-xs font-medium text-[#C2E959]">
                        Target Tercapai
                      </span>
                    ) : studyStatus.hasReviewCards || studyStatus.hasNewWords ? (
                      <>
                        {studyStatus.reviewCount > 0 && (
                          <span className="rounded-full bg-[#C2E959]/15 px-3 py-1 text-xs font-medium text-[#C2E959]">
                            {studyStatus.reviewCount} Review
                          </span>
                        )}
                        {studyStatus.newWordsCount > 0 && (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                            {studyStatus.newWordsCount} Kata Baru
                          </span>
                        )}
                        {studyStatus.estimatedMinutes > 0 && (
                          <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            ~{studyStatus.estimatedMinutes} menit
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        Siap Memulai
                      </span>
                    )}
                  </>
                ) : (
                  <span className="h-6 w-24 animate-pulse rounded-full bg-muted" />
                )}
              </div>
            </div>
          </Link>

          {/* Card 2 — Review */}
          <Link
            href="/review"
            className="group relative min-h-[180px] overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-[#248288]/10 to-transparent p-5 transition-all duration-300 hover:scale-[1.02] hover:border-[#248288]/50 hover:shadow-xl sm:p-8 lg:min-h-[220px]"
          >
            {/* Decorative character */}
            <div className="pointer-events-none absolute -bottom-4 -right-2 select-none font-jp" aria-hidden="true">
              <span className="inline-block text-[120px] leading-none text-foreground/[0.06] rotate-[8deg]">
                {"\u5FA9"}
              </span>
            </div>

            <div className="relative z-10">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#248288]/15">
                <RotateCcw className="size-7 text-[#248288]" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Review</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Kartu SRS yang jatuh tempo untuk diulang
              </p>

              {srsStats ? (
                <>
                  <p className="mt-3 text-2xl font-bold leading-none">
                    {srsStats.dueNow}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      kartu
                    </span>
                  </p>
                  {srsStats.dueNow > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {srsStats.dueLearning > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs text-yellow-600 dark:text-yellow-400">
                          <span className="size-1.5 rounded-full bg-yellow-500" />
                          {srsStats.dueLearning} Learning
                        </span>
                      )}
                      {srsStats.dueReview > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-600 dark:text-green-400">
                          <span className="size-1.5 rounded-full bg-green-500" />
                          {srsStats.dueReview} Review
                        </span>
                      )}
                      {srsStats.overdue > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400">
                          <span className="size-1.5 rounded-full bg-red-500" />
                          {srsStats.overdue} Terlambat
                        </span>
                      )}
                    </div>
                  )}
                  {(srsStats.overdue > 0 || srsStats.nextDueAt) && (
                    <div className="mt-2">
                      <ReviewCountdown
                        overdue={srsStats.overdue}
                        nextDueAt={srsStats.nextDueAt}
                        nextDueCount={srsStats.nextDueCount}
                      />
                    </div>
                  )}
                  {srsStats.dueNow === 0 && !srsStats.nextDueAt && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Belum ada kartu yang perlu di-review
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-3 space-y-2">
                  <span className="inline-block h-8 w-20 animate-pulse rounded-lg bg-muted" />
                  <span className="inline-block h-5 w-32 animate-pulse rounded-full bg-muted" />
                </div>
              )}
            </div>
          </Link>

          {/* Card 3 — Kata Sulit */}
          <Link
            href="/kata-sulit"
            className="group relative min-h-[180px] overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-[#F59E0B]/[0.08] to-transparent p-5 transition-all duration-300 hover:scale-[1.02] hover:border-[#F59E0B]/50 hover:shadow-xl sm:p-8 lg:min-h-[220px]"
          >
            {/* Decorative character */}
            <div className="pointer-events-none absolute -bottom-4 -right-2 select-none font-jp" aria-hidden="true">
              <span className="inline-block text-[120px] leading-none text-foreground/[0.06] -rotate-[5deg]">
                {"\u96E3"}
              </span>
            </div>

            <div className="relative z-10">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F59E0B]/15">
                {leechSummary && (leechSummary.totalLeechCards > 0 || leechSummary.totalConfusedPairs > 0) ? (
                  <Flame className="size-7 text-[#F59E0B]" />
                ) : (
                  <CheckCircle2 className="size-7 text-green-500" />
                )}
              </div>
              <h3 className="mt-5 text-xl font-bold">Kata Sulit</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Latihan khusus untuk kata yang sering lupa
              </p>

              {leechSummary ? (
                leechSummary.totalLeechCards > 0 || leechSummary.totalConfusedPairs > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {leechSummary.totalLeechCards > 0 && (
                      <span className="rounded-full bg-[#F59E0B]/15 px-3 py-1 text-xs font-medium text-[#F59E0B]">
                        {leechSummary.totalLeechCards} Kata Lupa
                      </span>
                    )}
                    {leechSummary.totalConfusedPairs > 0 && (
                      <span className="rounded-full bg-[#F59E0B]/15 px-3 py-1 text-xs font-medium text-[#F59E0B]">
                        {leechSummary.totalConfusedPairs} Pasangan Tertukar
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-1">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Tidak ada kata sulit
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                        Semua Baik
                      </span>
                    </div>
                  </div>
                )
              ) : (
                <div className="mt-4">
                  <span className="inline-block h-6 w-32 animate-pulse rounded-full bg-muted" />
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Section 2: Materi */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Materi
        </h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Card 1 — Hirakata */}
          <Link
            href="/learn/hirakata"
            className="group relative min-h-[180px] overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-[#248288]/10 to-transparent p-5 transition-all duration-300 hover:scale-[1.02] hover:border-[#248288]/50 hover:shadow-xl sm:p-8 lg:min-h-[220px]"
          >
            {/* Decorative characters */}
            <div className="pointer-events-none absolute -bottom-4 -right-2 select-none font-jp" aria-hidden="true">
              <span className="text-[120px] leading-none text-foreground/[0.06] -rotate-[10deg] inline-block">
                {"\u3042"}
              </span>
              <span className="text-[100px] leading-none text-foreground/[0.04] rotate-[5deg] inline-block -ml-8">
                {"\u30A2"}
              </span>
            </div>

            <div className="relative z-10">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#248288]/15">
                <Languages className="size-7 text-[#248288]" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Hiragana & Katakana</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Langkah pertama untuk membaca bahasa Jepang
              </p>
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                Pelajari 214 karakter dasar dengan flashcard interaktif dan quiz. Fondasi wajib sebelum mulai kosakata.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#248288]/15 px-3 py-1 text-xs font-medium text-[#248288]">
                  Pemula
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  214 Karakter
                </span>
              </div>
            </div>
          </Link>

          {/* Card 2 — Minna no Nihongo */}
          <Link
            href="/learn/mnn"
            className="group relative min-h-[180px] overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-[#C2E959]/[0.08] to-transparent p-5 transition-all duration-300 hover:scale-[1.02] hover:border-[#C2E959]/50 hover:shadow-xl sm:p-8 lg:min-h-[220px]"
          >
            {/* Decorative characters */}
            <div className="pointer-events-none absolute -bottom-4 -right-2 select-none font-jp" aria-hidden="true">
              <span className="text-[120px] leading-none text-foreground/[0.05] rotate-[8deg] inline-block">
                {"\u6F22"}
              </span>
              <span className="text-[100px] leading-none text-foreground/[0.04] -rotate-[5deg] inline-block -ml-10">
                {"\u5B57"}
              </span>
            </div>

            <div className="relative z-10">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#C2E959]/15">
                <BookOpen className="size-7 text-[#C2E959]" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Minna no Nihongo</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Kosakata lengkap dari buku standar bahasa Jepang
              </p>
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                2.900+ kosakata dari Bab 1-50 (MNN I & II). Dipetakan ke JLPT N5 dan N4 dengan terjemahan Bahasa Indonesia.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#C2E959]/15 px-3 py-1 text-xs font-medium text-[#C2E959]">
                  JLPT N5-N4
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  50 Bab
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  2.900+ Kata
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Tips bar */}
      <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-400" />
        <p className="text-sm text-muted-foreground">
          Baru pertama kali? Mulai dari <strong className="text-foreground">Hiragana & Katakana</strong> agar bisa membaca huruf Jepang.
        </p>
      </div>
    </div>
  );
}
