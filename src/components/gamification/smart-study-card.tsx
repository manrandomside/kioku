"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Sparkles } from "lucide-react";

interface StudyStatus {
  hasReviewCards: boolean;
  reviewCount: number;
  hasNewWords: boolean;
  newWordsCount: number;
  quizCount: number;
  estimatedMinutes: number;
  activeChapterNumber: number | null;
  dailyGoalMet: boolean;
}

export function SmartStudyCard() {
  const [status, setStatus] = useState<StudyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/v1/study/status");
        const json = await res.json();
        if (json.success && json.data) {
          setStatus(json.data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  // Skeleton loading state
  if (loading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-72 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-36 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="h-12 w-36 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  // Error fallback
  if (error || !status) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#248288]/10">
              <BookOpen className="size-6 text-[#248288]" />
            </div>
            <div>
              <h2 className="text-xl font-bold md:text-2xl">
                Belajar Sekarang
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Mulai belajar hari ini
              </p>
            </div>
          </div>
          <Link
            href="/learn"
            className="inline-flex items-center justify-center rounded-full bg-[#C2E959] px-8 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Mulai Belajar
          </Link>
        </div>
      </div>
    );
  }

  // Build subtitle
  let subtitle = "";
  if (status.dailyGoalMet) {
    subtitle = "Target Harian Tercapai! Istirahat dulu, atau...";
  } else if (status.hasReviewCards && status.hasNewWords) {
    subtitle = `Sesi hari ini: ${status.reviewCount} review + ${status.newWordsCount} kata baru + ${status.quizCount} quiz`;
  } else if (status.hasReviewCards) {
    subtitle = `Sesi hari ini: ${status.reviewCount} review + ${status.quizCount} quiz`;
  } else if (status.hasNewWords && status.activeChapterNumber) {
    subtitle = `Mari pelajari kata baru dari Bab ${status.activeChapterNumber}`;
  } else {
    subtitle = "Mulai belajar hari ini";
  }

  const buttonLabel = status.dailyGoalMet ? "Belajar Lagi" : "Mulai Sesi";
  const hasContent = status.hasReviewCards || status.hasNewWords;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#248288]/10">
            {status.dailyGoalMet ? (
              <Sparkles className="size-6 text-[#C2E959]" />
            ) : (
              <BookOpen className="size-6 text-[#248288]" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold md:text-2xl">
              Belajar Sekarang
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {subtitle}
            </p>
            {hasContent && status.estimatedMinutes > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                Estimasi: ~{status.estimatedMinutes} menit
              </div>
            )}
          </div>
        </div>

        <Link
          href="/study/session"
          className={`inline-flex shrink-0 items-center justify-center rounded-full px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
            status.dailyGoalMet
              ? "border border-border bg-muted text-muted-foreground"
              : "bg-[#C2E959] text-black"
          }`}
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}
