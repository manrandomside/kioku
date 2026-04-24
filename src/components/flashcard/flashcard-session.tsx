"use client";

import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Clock,
  Zap,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/use-count-up";
import { FlashcardCard } from "@/components/flashcard/flashcard-card";
import { FlashcardRatingButtons } from "@/components/flashcard/flashcard-rating-buttons";
import { XpPopup, useXpPopup } from "@/components/gamification/xp-popup";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { submitKanaReview } from "@/app/(dashboard)/learn/hirakata/flashcard/actions";

import type { KanaWithSrs } from "@/types/kana";

interface FlashcardSessionProps {
  cards: KanaWithSrs[];
  script: string;
  filter: string;
}

const MAX_RETRIES = 3;

interface QueueItem {
  card: KanaWithSrs;
  retryNumber: number;
}

export function FlashcardSession({ cards, script, filter }: FlashcardSessionProps) {
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    cards.map((card) => ({ card, retryNumber: 0 }))
  );
  const [completedCount, setCompletedCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewStartTime, setReviewStartTime] = useState(() => Date.now());
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [pronunciationOpen, setPronunciationOpen] = useState(false);
  const [sessionStartTime] = useState(() => Date.now());
  const { events: xpEvents, showXp } = useXpPopup();

  // Track retry counts per card ID
  const [retryCount, setRetryCount] = useState<Map<string, number>>(() => new Map());
  const [understoodIds] = useState<Set<string>>(() => new Set());
  const [retriedIds] = useState<Set<string>>(() => new Set());

  const isCompleted = queue.length === 0 && completedCount > 0;
  const currentItem = queue.length > 0 ? queue[0] : null;
  const retryQueueCount = queue.filter((item) => item.retryNumber > 0).length;

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const advanceQueue = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setQueue((prev) => prev.slice(1));
      setReviewStartTime(Date.now());
      setIsSubmitting(false);
    }, 300);
  }, []);

  const handleUnderstood = useCallback(() => {
    if (!currentItem || isSubmitting) return;
    setIsSubmitting(true);

    const durationMs = Date.now() - reviewStartTime;
    const cardId = currentItem.card.id;

    understoodIds.add(cardId);
    setCompletedCount((prev) => prev + 1);
    showXp(2);
    advanceQueue();

    submitKanaReview(cardId, "good", durationMs).then((response) => {
      if (!response.success) {
        console.error("[flashcard] submitKanaReview failed:", JSON.stringify(response.error));
      }
      if (response.success && response.data?.xp?.leveledUp) {
        setLevelUpLevel(response.data.xp.currentLevel);
      }
    });
  }, [currentItem, isSubmitting, reviewStartTime, advanceQueue, showXp, understoodIds]);

  const handleNotUnderstood = useCallback(() => {
    if (!currentItem || isSubmitting) return;
    setIsSubmitting(true);

    const durationMs = Date.now() - reviewStartTime;
    const cardId = currentItem.card.id;
    const currentRetries = retryCount.get(cardId) ?? 0;
    const newRetries = currentRetries + 1;

    setRetryCount((prev) => {
      const next = new Map(prev);
      next.set(cardId, newRetries);
      return next;
    });
    retriedIds.add(cardId);

    if (newRetries < MAX_RETRIES) {
      setQueue((prev) => [
        ...prev.slice(1),
        { card: currentItem.card, retryNumber: newRetries },
      ]);
    } else {
      setCompletedCount((prev) => prev + 1);
      setQueue((prev) => prev.slice(1));
    }

    setIsFlipped(false);
    setTimeout(() => {
      setReviewStartTime(Date.now());
      setIsSubmitting(false);
    }, 300);

    submitKanaReview(cardId, "again", durationMs).then((response) => {
      if (!response.success) {
        console.error("[flashcard] submitKanaReview failed:", JSON.stringify(response.error));
      }
      if (response.success && response.data?.xp?.leveledUp) {
        setLevelUpLevel(response.data.xp.currentLevel);
      }
    });
  }, [currentItem, isSubmitting, reviewStartTime, retryCount, retriedIds]);

  const handleRestart = useCallback(() => {
    setQueue(cards.map((card) => ({ card, retryNumber: 0 })));
    setCompletedCount(0);
    setIsFlipped(false);
    setRetryCount(new Map());
    understoodIds.clear();
    retriedIds.clear();
    setReviewStartTime(Date.now());
  }, [cards, understoodIds, retriedIds]);

  // Summary data
  const summaryData = useMemo(() => {
    const directlyUnderstood = cards.filter(
      (c) => understoodIds.has(c.id) && !retriedIds.has(c.id)
    ).length;
    const retriedCount = retriedIds.size;
    const totalRetries = Array.from(retryCount.values()).reduce((a, b) => a + b, 0);
    const avgRetries = retriedCount > 0 ? totalRetries / retriedCount : 0;
    const timeSpentMs = Date.now() - sessionStartTime;

    const difficultCards = Array.from(retryCount.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const card = cards.find((c) => c.id === id);
        return card ? { card, retries: count } : null;
      })
      .filter(Boolean) as { card: KanaWithSrs; retries: number }[];

    return { directlyUnderstood, retriedCount, avgRetries, timeSpentMs, difficultCards };
  }, [cards, understoodIds, retriedIds, retryCount, sessionStartTime]);

  if (cards.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-muted-foreground">
          Tidak ada kartu untuk kategori ini.
        </p>
        <Link
          href="/learn/hirakata"
          className="text-sm font-medium text-primary hover:underline"
        >
          Kembali ke HIRAKATA
        </Link>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <>
        <KanaFlashcardSummary
          data={summaryData}
          script={script}
          filter={filter}
          onRestart={handleRestart}
        />
        <LevelUpModal
          level={levelUpLevel}
          onDismiss={() => setLevelUpLevel(null)}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/learn/hirakata"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
        <span className="font-mono text-sm text-muted-foreground">
          {completedCount} / {cards.length}
          {retryQueueCount > 0 && (
            <span className="text-amber-500"> · {retryQueueCount} ulang</span>
          )}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / cards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Flashcard */}
      {currentItem && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentItem.card.id}-${currentItem.retryNumber}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="relative"
          >
            {/* Retry badge */}
            {currentItem.retryNumber > 0 && (
              <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <RefreshCw className="size-3" />
                  Ulang ke-{currentItem.retryNumber + 1}
                </span>
              </div>
            )}
            <FlashcardCard
              kana={currentItem.card}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              onPronunciationChange={setPronunciationOpen}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Rating buttons (hidden when pronunciation modal is open) */}
      <AnimatePresence>
        {isFlipped && !pronunciationOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="mx-auto w-full max-w-sm px-2 sm:px-0"
          >
            <FlashcardRatingButtons
              onNotUnderstood={handleNotUnderstood}
              onUnderstood={handleUnderstood}
              disabled={isSubmitting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap hint when not flipped */}
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

// Summary component for kana flashcard
interface KanaFlashcardSummaryProps {
  data: {
    directlyUnderstood: number;
    retriedCount: number;
    avgRetries: number;
    timeSpentMs: number;
    difficultCards: { card: KanaWithSrs; retries: number }[];
  };
  script: string;
  filter: string;
  onRestart: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} menit ${seconds} detik`;
}

function KanaFlashcardSummary({
  data,
  script,
  filter,
  onRestart,
}: KanaFlashcardSummaryProps) {
  const understoodCount = useCountUp(data.directlyUnderstood, 800, 300);
  const retriedCount = useCountUp(data.retriedCount, 800, 500);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="text-center"
      >
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Sesi Selesai!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan hasil belajar kamu
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm space-y-3"
      >
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <CheckCircle2 className="size-5 text-green-500" />
          <div className="flex flex-col">
            <span className="text-lg font-bold">{understoodCount} karakter</span>
            <span className="text-xs text-muted-foreground">Langsung paham</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <RefreshCw className="size-5 text-amber-500" />
          <div className="flex flex-col">
            <span className="text-lg font-bold">
              {retriedCount} karakter
              {data.retriedCount > 0 && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  (rata-rata {data.avgRetries.toFixed(1)}x ulangan)
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">Perlu diulang</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Clock className="size-5 text-purple-500" />
          <div className="flex flex-col">
            <span className="text-lg font-bold">{formatTime(data.timeSpentMs)}</span>
            <span className="text-xs text-muted-foreground">Waktu belajar</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Zap className="size-5 text-green-500" />
          <div className="flex flex-col">
            <span className="text-lg font-bold">
              +{(data.directlyUnderstood + data.retriedCount) * 2} XP
            </span>
            <span className="text-xs text-muted-foreground">XP diperoleh</span>
          </div>
        </div>
      </motion.div>

      {/* Difficult cards */}
      {data.difficultCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Karakter yang paling sulit</p>
          </div>
          <div className="space-y-2">
            {data.difficultCards.map(({ card, retries }) => (
              <div
                key={card.id}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-jp text-xl font-medium text-foreground">
                    {card.character}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">
                    {card.romaji}
                  </span>
                </div>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {retries}x ulangan
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <Link
          href={`/learn/hirakata/quiz?script=${script}&filter=${filter}`}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors",
            "bg-[#C2E959] text-[#0A3A3A] hover:bg-[#C2E959]/80"
          )}
        >
          Mulai Quiz
        </Link>
        <Button variant="outline" onClick={onRestart} className="h-11 w-full gap-2">
          <RotateCcw className="size-4" />
          Ulangi Sesi
        </Button>
        <Link
          href={`/learn/hirakata?script=${script}&filter=${filter}`}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Grid
        </Link>
      </motion.div>
    </div>
  );
}
