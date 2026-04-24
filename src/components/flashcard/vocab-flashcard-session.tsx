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
import { DisplayModeToggle } from "@/components/ui/display-mode-toggle";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { useCountUp } from "@/hooks/use-count-up";
import { VocabFlashcardCard } from "@/components/flashcard/vocab-flashcard-card";
import { FlashcardRatingButtons } from "@/components/flashcard/flashcard-rating-buttons";
import { XpPopup, useXpPopup } from "@/components/gamification/xp-popup";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { submitVocabReview } from "@/app/(dashboard)/learn/mnn/[chapter]/flashcard/actions";

import type { VocabularyWithSrs } from "@/types/vocabulary";

interface VocabFlashcardSessionProps {
  cards: VocabularyWithSrs[];
  chapterSlug: string;
  chapterNumber: number;
}

const MAX_RETRIES = 3;

interface QueueItem {
  card: VocabularyWithSrs;
  retryNumber: number;
}

export function VocabFlashcardSession({ cards, chapterSlug, chapterNumber }: VocabFlashcardSessionProps) {
  const { effectiveMode, toggleLocal } = useDisplayMode();
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
  // Track which cards were understood immediately vs retried
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

    // Track as understood
    understoodIds.add(cardId);
    setCompletedCount((prev) => prev + 1);
    showXp(2);
    advanceQueue();

    // Submit "good" rating to FSRS
    submitVocabReview(cardId, "good", durationMs).then((response) => {
      if (!response.success) {
        console.error("[vocab-flashcard] submitVocabReview failed:", response.error);
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

    // Update retry count
    setRetryCount((prev) => {
      const next = new Map(prev);
      next.set(cardId, newRetries);
      return next;
    });
    retriedIds.add(cardId);

    if (newRetries < MAX_RETRIES) {
      // Add card back to the end of the queue
      setQueue((prev) => [
        ...prev.slice(1),
        { card: currentItem.card, retryNumber: newRetries },
      ]);
    } else {
      // Max retries reached, mark as completed (difficult)
      setCompletedCount((prev) => prev + 1);
      setQueue((prev) => prev.slice(1));
    }

    setIsFlipped(false);
    setTimeout(() => {
      setReviewStartTime(Date.now());
      setIsSubmitting(false);
    }, 300);

    // Submit "again" rating to FSRS
    submitVocabReview(cardId, "again", durationMs).then((response) => {
      if (!response.success) {
        console.error("[vocab-flashcard] submitVocabReview failed:", response.error);
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

    // Most difficult cards (sorted by retry count desc, max 5)
    const difficultCards = Array.from(retryCount.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const card = cards.find((c) => c.id === id);
        return card ? { card, retries: count } : null;
      })
      .filter(Boolean) as { card: VocabularyWithSrs; retries: number }[];

    return { directlyUnderstood, retriedCount, avgRetries, timeSpentMs, difficultCards };
  }, [cards, understoodIds, retriedIds, retryCount, sessionStartTime]);

  if (cards.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-muted-foreground">
          Tidak ada kosakata di bab ini.
        </p>
        <Link
          href={`/learn/mnn/${chapterSlug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Kembali ke Bab {chapterNumber}
        </Link>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <>
        <VocabFlashcardSummary
          data={summaryData}
          chapterSlug={chapterSlug}
          chapterNumber={chapterNumber}
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
          href={`/learn/mnn/${chapterSlug}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Bab {chapterNumber}
        </Link>
        <div className="flex items-center gap-2">
          <DisplayModeToggle mode={effectiveMode} onToggle={toggleLocal} />
          <span className="font-mono text-sm text-muted-foreground">
            {completedCount} / {cards.length}
            {retryQueueCount > 0 && (
              <span className="text-amber-500"> · {retryQueueCount} ulang</span>
            )}
          </span>
        </div>
      </div>

      {/* Progress bar — based on completed cards out of total initial */}
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
            <VocabFlashcardCard
              vocab={currentItem.card}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              onPronunciationChange={setPronunciationOpen}
              displayMode={effectiveMode}
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

// Summary component for vocab flashcard
interface VocabFlashcardSummaryProps {
  data: {
    directlyUnderstood: number;
    retriedCount: number;
    avgRetries: number;
    timeSpentMs: number;
    difficultCards: { card: VocabularyWithSrs; retries: number }[];
  };
  chapterSlug: string;
  chapterNumber: number;
  onRestart: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} menit ${seconds} detik`;
}

function VocabFlashcardSummary({
  data,
  chapterSlug,
  chapterNumber,
  onRestart,
}: VocabFlashcardSummaryProps) {
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
          Ringkasan belajar Bab {chapterNumber}
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
            <span className="text-lg font-bold">{understoodCount} kata</span>
            <span className="text-xs text-muted-foreground">Langsung paham</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <RefreshCw className="size-5 text-amber-500" />
          <div className="flex flex-col">
            <span className="text-lg font-bold">
              {retriedCount} kata
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
            <p className="text-sm font-medium text-muted-foreground">Kata yang paling sulit</p>
          </div>
          <div className="space-y-2">
            {data.difficultCards.map(({ card, retries }) => (
              <div
                key={card.id}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-jp text-base font-medium text-foreground">
                    {card.hiragana}
                  </span>
                  {card.kanji && (
                    <span className="font-jp text-xs text-muted-foreground">
                      {card.kanji}
                    </span>
                  )}
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
          href={`/learn/mnn/${chapterSlug}/quiz`}
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
          href={`/learn/mnn/${chapterSlug}`}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Bab {chapterNumber}
        </Link>
      </motion.div>
    </div>
  );
}
