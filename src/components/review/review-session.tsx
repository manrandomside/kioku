"use client";

import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Trophy, Target, Zap, Clock, Lightbulb } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DisplayModeToggle } from "@/components/ui/display-mode-toggle";
import { useDisplayMode } from "@/hooks/use-display-mode";
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
  const { effectiveMode, toggleLocal } = useDisplayMode();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [reviewStartTime, setReviewStartTime] = useState(() => Date.now());
  const [sessionStartTime] = useState(() => Date.now());
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const { events: xpEvents, showXp } = useXpPopup();

  // Re-queue state for "Again" cards
  const [cardQueue, setCardQueue] = useState(dueCards);
  const [retryCount, setRetryCount] = useState<Map<string, number>>(new Map());
  const MAX_RETRIES = 3;

  const isCompleted = currentIndex >= cardQueue.length;
  const currentCard = isCompleted ? null : cardQueue[currentIndex];

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
    const previews = getSchedulingPreview(cardData);
    // Override "Again" label to show "Ulang" instead of interval
    return previews.map((p) =>
      p.rating === "again" ? { ...p, intervalLabel: "Ulang" } : p
    );
  }, [currentCard]);

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleRate = useCallback(
    (rating: SrsRating) => {
      if (!currentCard || isSubmitting) return;

      setIsSubmitting(true);
      const durationMs = Date.now() - reviewStartTime;
      const cardId = currentCard.cardId;
      const prevStatus = currentCard.status;

      // Optimistic: show XP popup, record result, and advance card immediately
      showXp(2);
      setResults((prev) => [...prev, { cardId, rating, prevStatus, newStatus: prevStatus }]);

      // Re-queue "Again" cards (max 3 retries)
      if (rating === "again") {
        const currentRetries = retryCount.get(cardId) ?? 0;
        if (currentRetries < MAX_RETRIES) {
          setCardQueue((prev) => [...prev, currentCard]);
          setRetryCount((prev) => new Map(prev).set(cardId, currentRetries + 1));
        }
      }

      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setReviewStartTime(Date.now());
        setIsSubmitting(false);
      }, 300);

      // Fire server action in background (handle level-up from server response)
      submitReviewByCardId(cardId, rating, durationMs).then((response) => {
        if (!response.success) {
          console.error("[review] submitReviewByCardId failed:", JSON.stringify(response.error), "cardId:", cardId, "rating:", rating);
        }
        if (response.success && response.data?.xp?.leveledUp) {
          setLevelUpLevel(response.data.xp.currentLevel);
        }
      });
    },
    [currentCard, isSubmitting, reviewStartTime, retryCount]
  );

  // Summary stats (deduplicated by last rating per card)
  const summary = useMemo(() => {
    const lastRating = new Map<string, ReviewResult>();
    results.forEach((r) => lastRating.set(r.cardId, r));
    const uniqueResults = Array.from(lastRating.values());

    const totalReviewed = uniqueResults.length;
    const goodOrEasy = uniqueResults.filter((r) => r.rating === "good" || r.rating === "easy").length;
    const lapses = uniqueResults.filter((r) => r.rating === "again" && r.prevStatus === "review").length;
    const timeSpentMs = Date.now() - sessionStartTime;
    return { totalReviewed, goodOrEasy, lapses, timeSpentMs };
  }, [results, sessionStartTime]);

  // Rating distribution (deduplicated by last rating per card)
  const ratingDistribution = useMemo(() => {
    const lastRating = new Map<string, string>();
    results.forEach((r) => lastRating.set(r.cardId, r.rating));
    const ratings = Array.from(lastRating.values());
    return {
      again: ratings.filter((r) => r === "again").length,
      hard: ratings.filter((r) => r === "hard").length,
      good: ratings.filter((r) => r === "good").length,
      easy: ratings.filter((r) => r === "easy").length,
    };
  }, [results]);

  // againCards for "Perlu Diulang" section — uses original dueCards
  const againCards = useMemo(() => {
    const lastRating = new Map<string, string>();
    results.forEach((r) => lastRating.set(r.cardId, r.rating));
    const againIds = new Set(
      Array.from(lastRating.entries()).filter(([, r]) => r === "again").map(([id]) => id)
    );
    return dueCards.filter((c) => againIds.has(c.cardId));
  }, [results, dueCards]);

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
            label="Akurasi"
            value={`${summary.totalReviewed > 0 ? Math.round((summary.goodOrEasy / summary.totalReviewed) * 100) : 0}%`}
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
              const count = ratingDistribution[r];
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

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#248288]/10">
                <Lightbulb className="size-4 text-[#248288]" />
              </div>
              <div>
                <p className="text-sm font-medium">Tips</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {getTip(summary, againCards.length)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Kata yang Sulit */}
        {againCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-sm"
          >
            <p className="mb-3 text-sm font-medium text-red-500">
              Perlu Diulang ({againCards.length})
            </p>
            <div className="flex flex-col gap-2">
              {againCards.map((card) => (
                <div
                  key={card.cardId}
                  className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3"
                >
                  {card.type === "kana" ? (
                    <div className="flex flex-col items-center">
                      <span className="font-jp text-xl font-bold">{card.character}</span>
                      <span className="text-xs text-muted-foreground">{card.kanaRomaji}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {card.kanji && (
                        <span className="text-xs text-muted-foreground">{card.kanji}</span>
                      )}
                      <span className="font-jp text-lg font-bold">{card.hiragana}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">
                      {card.type === "kana" ? card.kanaRomaji : card.meaningId}
                    </span>
                  </div>
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-500">
                    Lagi
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
          {currentCard?.type === "vocabulary" && (
            <DisplayModeToggle mode={effectiveMode} onToggle={toggleLocal} />
          )}
          <span className="font-mono text-sm text-muted-foreground">
            {currentIndex + 1} / {cardQueue.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / cardQueue.length) * 100}%` }}
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
              displayMode={effectiveMode}
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

function getTip(summary: { totalReviewed: number; goodOrEasy: number; lapses: number }, againCount: number) {
  const accuracy = summary.totalReviewed > 0
    ? Math.round((summary.goodOrEasy / summary.totalReviewed) * 100)
    : 0;

  if (againCount === 0 && summary.lapses === 0) {
    return "Sempurna! Tidak ada kartu yang terlupa. Memorimu sangat kuat hari ini!";
  }
  if (accuracy >= 80) {
    return "Hasil bagus! Beberapa kartu perlu diulang — ini normal. FSRS akan menjadwalkan ulang secara optimal.";
  }
  if (accuracy >= 50) {
    return "Lumayan! Kartu yang di-rating 'Lagi' akan muncul lebih sering agar kamu bisa menguasainya. Terus konsisten!";
  }
  return "Banyak kartu yang masih sulit — jangan khawatir! FSRS akan menjadwalkan lebih sering. Konsistensi adalah kunci!";
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
