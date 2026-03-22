"use client";

import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Trophy, Target, Zap, Clock } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "@/components/review/review-card";
import { RatingButtons } from "@/components/flashcard/rating-buttons";
import { XpPopup, useXpPopup } from "@/components/gamification/xp-popup";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { getSchedulingPreview } from "@/lib/srs/fsrs-engine";
import { submitReviewByCardId } from "@/app/(dashboard)/review/actions";

import type { DueCard, SrsStats } from "@/lib/queries/review";
import type { SrsRating, SrsCardData } from "@/lib/srs/fsrs-engine";

interface ReviewSessionProps {
  dueCards: DueCard[];
  stats: SrsStats;
}

interface ReviewResult {
  cardId: string;
  rating: SrsRating;
  prevStatus: string;
  newStatus: string;
}

export function ReviewSession({ dueCards, stats }: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [reviewStartTime, setReviewStartTime] = useState(() => Date.now());
  const [sessionStartTime] = useState(() => Date.now());
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const { events: xpEvents, showXp } = useXpPopup();

  const isCompleted = currentIndex >= dueCards.length;
  const currentCard = isCompleted ? null : dueCards[currentIndex];

  const schedulingPreviews = useMemo(() => {
    if (!currentCard) return [];
    const cardData: SrsCardData = {
      status: currentCard.status,
      stability: currentCard.stability,
      difficulty: currentCard.difficulty,
      dueDate: currentCard.dueDate,
      scheduledDays: currentCard.scheduledDays,
      reps: currentCard.reps,
      lapses: currentCard.lapses,
    };
    return getSchedulingPreview(cardData);
  }, [currentCard]);

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleRate = useCallback(
    async (rating: SrsRating) => {
      if (!currentCard || isSubmitting) return;

      setIsSubmitting(true);
      const durationMs = Date.now() - reviewStartTime;

      const response = await submitReviewByCardId(currentCard.cardId, rating, durationMs);

      const result: ReviewResult = {
        cardId: currentCard.cardId,
        rating,
        prevStatus: currentCard.status,
        newStatus: response.success && response.data ? response.data.newStatus : currentCard.status,
      };

      // Show XP popup and level-up modal
      if (response.success && response.data?.xp) {
        if (response.data.xp.awarded > 0) {
          showXp(response.data.xp.awarded);
        }
        if (response.data.xp.leveledUp) {
          setLevelUpLevel(response.data.xp.currentLevel);
        }
      }

      setResults((prev) => [...prev, result]);
      setIsSubmitting(false);

      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setReviewStartTime(Date.now());
      }, 300);
    },
    [currentCard, isSubmitting, reviewStartTime]
  );

  // Summary stats
  const summary = useMemo(() => {
    const totalReviewed = results.length;
    const goodOrEasy = results.filter((r) => r.rating === "good" || r.rating === "easy").length;
    const lapses = results.filter((r) => r.rating === "again" && r.prevStatus === "review").length;
    const timeSpentMs = Date.now() - sessionStartTime;
    return { totalReviewed, goodOrEasy, lapses, timeSpentMs };
  }, [results, sessionStartTime]);

  // Empty state
  if (dueCards.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        {/* Stats overview even when no due cards */}
        <StatsOverview stats={stats} />

        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-srs-review/10">
            <Trophy className="size-8 text-srs-review" />
          </div>
          <div className="text-center">
            <h2 className="font-display text-xl font-bold tracking-tight">
              Tidak ada kartu untuk di-review!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Semua kartu sudah di-review hari ini. Kembali nanti atau pelajari kartu baru.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/learn/hirakata"
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Belajar Kana
            </Link>
            <Link
              href="/learn/mnn"
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Belajar Kosakata
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Completed state
  if (isCompleted) {
    const timeMin = Math.floor(summary.timeSpentMs / 60000);
    const timeSec = Math.floor((summary.timeSpentMs % 60000) / 1000);

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex size-20 items-center justify-center rounded-full bg-srs-review/10">
            <Trophy className="size-10 text-srs-review" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Review Selesai!
          </h2>
          <p className="text-sm text-muted-foreground">
            Ringkasan sesi review hari ini
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid w-full max-w-sm grid-cols-2 gap-3"
        >
          <SummaryCard
            icon={<Target className="size-5 text-blue-500" />}
            label="Total Review"
            value={`${summary.totalReviewed}`}
          />
          <SummaryCard
            icon={<Zap className="size-5 text-green-500" />}
            label="Baik/Mudah"
            value={`${summary.goodOrEasy}`}
          />
          <SummaryCard
            icon={<RotateCcw className="size-5 text-red-500" />}
            label="Lupa"
            value={`${summary.lapses}`}
          />
          <SummaryCard
            icon={<Clock className="size-5 text-purple-500" />}
            label="Waktu"
            value={`${timeMin}:${timeSec.toString().padStart(2, "0")}`}
          />
        </motion.div>

        {/* Rating distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm"
        >
          <p className="mb-3 text-sm font-medium text-muted-foreground">Distribusi Rating</p>
          <div className="flex gap-2">
            {(["again", "hard", "good", "easy"] as const).map((r) => {
              const count = results.filter((res) => res.rating === r).length;
              const labels = { again: "Lagi", hard: "Sulit", good: "Baik", easy: "Mudah" };
              const colors = {
                again: "bg-red-500/15 text-red-600 dark:text-red-400",
                hard: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
                good: "bg-green-500/15 text-green-600 dark:text-green-400",
                easy: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
              };
              return (
                <div
                  key={r}
                  className={cn("flex flex-1 flex-col items-center gap-1 rounded-xl p-3", colors[r])}
                >
                  <span className="text-xl font-bold">{count}</span>
                  <span className="text-[10px] font-medium">{labels[r]}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex w-full max-w-sm flex-col gap-3"
        >
          <Link
            href="/home"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kembali ke Home
          </Link>
          <Link
            href="/learn/mnn"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium transition-colors hover:bg-muted"
          >
            Belajar Kosakata Baru
          </Link>
        </motion.div>
      </div>
    );
  }

  // Active review
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/home"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {currentCard?.type === "kana" ? "Kana" : "Kosakata"}
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            {currentIndex + 1} / {dueCards.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / dueCards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card */}
      {currentCard && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.cardId}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <ReviewCard
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={handleFlip}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Rating buttons */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="mx-auto w-full max-w-sm px-2 sm:px-0"
          >
            <RatingButtons
              previews={schedulingPreviews}
              onRate={handleRate}
              disabled={isSubmitting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap hint */}
      {!isFlipped && (
        <p className="text-center text-xs text-muted-foreground">
          Ketuk kartu untuk melihat jawaban
        </p>
      )}

      {/* XP popup + Level up modal */}
      <XpPopup events={xpEvents} />
      <LevelUpModal
        level={levelUpLevel}
        onDismiss={() => setLevelUpLevel(null)}
      />
    </div>
  );
}

function StatsOverview({ stats }: { stats: SrsStats }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
          Review
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review kartu yang sudah jatuh tempo hari ini
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Total Kartu" value={stats.totalCards} />
        <MiniStat label="Due Hari Ini" value={stats.dueNow} highlight />
        <MiniStat label="Belajar" value={stats.learningCount} />
        <MiniStat label="Hafal" value={stats.reviewCount} />
      </div>

      {/* SRS distribution bar */}
      {stats.totalCards > 0 && (
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          {stats.reviewCount > 0 && (
            <div
              className="bg-srs-review transition-all"
              style={{ width: `${(stats.reviewCount / stats.totalCards) * 100}%` }}
            />
          )}
          {stats.learningCount > 0 && (
            <div
              className="bg-srs-learning transition-all"
              style={{ width: `${(stats.learningCount / stats.totalCards) * 100}%` }}
            />
          )}
          {stats.relearningCount > 0 && (
            <div
              className="bg-srs-relearning transition-all"
              style={{ width: `${(stats.relearningCount / stats.totalCards) * 100}%` }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-1 rounded-xl border p-3",
      highlight && value > 0 ? "border-primary/30 bg-primary/5" : "bg-card"
    )}>
      <span className={cn("text-xl font-bold", highlight && value > 0 && "text-primary")}>
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      {icon}
      <div className="flex flex-col">
        <span className="text-lg font-bold">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
