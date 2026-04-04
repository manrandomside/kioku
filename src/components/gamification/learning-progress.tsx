"use client";

import Link from "next/link";
import { BookOpen, Target, TrendingUp, HelpCircle } from "lucide-react";

import { useCountUp } from "@/hooks/use-count-up";

interface LearningProgressProps {
  progress: {
    totalMasteredWords: number;
    totalVocab: number;
    masteredChapters: number;
    totalChapters: number;
    quizCompleted: number;
    quizAvgScore: number;
    lastQuizScore: number | null;
  };
}

function ProgressBar({ value, max, delay = 0 }: { value: number; max: number; delay?: number }) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-accent transition-all duration-1000 ease-out"
        style={{
          width: `${percent}%`,
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}

function MiniStat({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-foreground/5 px-3 py-3 sm:px-4">
      <div className="text-muted-foreground">{icon}</div>
      <p className="text-xl font-bold leading-none text-foreground sm:text-2xl">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function LearningProgress({ progress }: LearningProgressProps) {
  const animatedWords = useCountUp(progress.totalMasteredWords, 800, 200);
  const animatedChapters = useCountUp(progress.masteredChapters, 600, 400);
  const animatedQuiz = useCountUp(progress.quizCompleted, 600, 300);

  const wordPercent = progress.totalVocab > 0
    ? Math.round((progress.totalMasteredWords / progress.totalVocab) * 100 * 10) / 10
    : 0;
  const chapterPercent = progress.totalChapters > 0
    ? Math.round((progress.masteredChapters / progress.totalChapters) * 100)
    : 0;

  const hasQuizData = progress.quizCompleted > 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <BookOpen className="size-4.5 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Progres Belajar</h3>
      </div>

      {/* Progress bars */}
      <div className="flex flex-col gap-5">
        {/* Kata Dikuasai */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Kata Dikuasai</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground">{animatedWords.toLocaleString("id-ID")}</span>
              <span className="text-sm text-muted-foreground">/ {progress.totalVocab.toLocaleString("id-ID")}</span>
              <span className="ml-1 text-xs font-medium text-accent">{wordPercent}%</span>
            </div>
          </div>
          <ProgressBar value={progress.totalMasteredWords} max={progress.totalVocab} delay={200} />
        </div>

        {/* Bab Dikuasai */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Bab Dikuasai</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground">{animatedChapters}</span>
              <span className="text-sm text-muted-foreground">/ {progress.totalChapters}</span>
              <span className="ml-1 text-xs font-medium text-accent">{chapterPercent}%</span>
            </div>
          </div>
          <ProgressBar value={progress.masteredChapters} max={progress.totalChapters} delay={400} />
        </div>
        <p className="text-xs text-muted-foreground/70">
          Dikuasai = pernah dijawab benar di Quiz
        </p>
      </div>

      {/* Divider */}
      <div className="my-5 h-px bg-border" />

      {/* Mini stats or empty state */}
      {hasQuizData ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <MiniStat
            value={animatedQuiz.toLocaleString("id-ID")}
            label="Quiz Selesai"
            icon={<Target className="size-4" />}
          />
          <MiniStat
            value={`${progress.quizAvgScore}%`}
            label="Akurasi Quiz"
            icon={<TrendingUp className="size-4" />}
          />
          <MiniStat
            value={progress.lastQuizScore !== null ? `${progress.lastQuizScore}%` : "--"}
            label="Skor Terakhir"
            icon={<BookOpen className="size-4" />}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-sm text-muted-foreground">Belum ada quiz yang diselesaikan</p>
          <Link
            href="/learn/mnn"
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/80"
          >
            <HelpCircle className="size-4" />
            Mulai Quiz Pertama
          </Link>
        </div>
      )}
    </div>
  );
}
