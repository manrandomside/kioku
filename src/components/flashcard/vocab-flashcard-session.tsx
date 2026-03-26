"use client";

import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { VocabFlashcardCard } from "@/components/flashcard/vocab-flashcard-card";
import { RatingButtons } from "@/components/flashcard/rating-buttons";
import { XpPopup, useXpPopup } from "@/components/gamification/xp-popup";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { getSchedulingPreview, createNewCardData } from "@/lib/srs/fsrs-engine";
import { submitVocabReview } from "@/app/(dashboard)/learn/mnn/[chapter]/flashcard/actions";

import type { VocabularyWithSrs } from "@/types/vocabulary";
import type { SrsRating, SessionSummary } from "@/types/flashcard";

interface VocabFlashcardSessionProps {
  cards: VocabularyWithSrs[];
  chapterSlug: string;
  chapterNumber: number;
}

interface VocabFlashcardResult {
  vocabId: string;
  rating: SrsRating;
  prevStatus: string;
  newStatus: string;
}

export function VocabFlashcardSession({ cards, chapterSlug, chapterNumber }: VocabFlashcardSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<VocabFlashcardResult[]>([]);
  const [reviewStartTime, setReviewStartTime] = useState(() => Date.now());
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [pronunciationOpen, setPronunciationOpen] = useState(false);
  const { events: xpEvents, showXp } = useXpPopup();

  const isCompleted = currentIndex >= cards.length;
  const currentCard = isCompleted ? null : cards[currentIndex];

  const schedulingPreviews = useMemo(() => {
    if (!currentCard) return [];
    const cardData = createNewCardData();
    if (currentCard.srsStatus && currentCard.srsStatus !== "new") {
      cardData.status = currentCard.srsStatus;
    }
    return getSchedulingPreview(cardData);
  }, [currentCard]);

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleRate = useCallback(
    (rating: SrsRating) => {
      if (!currentCard || isSubmitting) return;

      setIsSubmitting(true);
      const durationMs = Date.now() - reviewStartTime;
      const cardId = currentCard.id;
      const prevStatus = currentCard.srsStatus ?? "new";

      // Optimistic: show XP popup, record result, and advance card immediately
      showXp(2);
      setResults((prev) => [...prev, { vocabId: cardId, rating, prevStatus, newStatus: prevStatus }]);
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setReviewStartTime(Date.now());
        setIsSubmitting(false);
      }, 300);

      // Fire server action in background (handle level-up from server response)
      submitVocabReview(cardId, rating, durationMs).then((response) => {
        if (!response.success) {
          console.error("[vocab-flashcard] submitVocabReview failed:", response.error);
        }
        if (response.success && response.data?.xp?.leveledUp) {
          setLevelUpLevel(response.data.xp.currentLevel);
        }
      });
    },
    [currentCard, isSubmitting, reviewStartTime]
  );

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults([]);
    setReviewStartTime(Date.now());
  }, []);

  const summary: SessionSummary = useMemo(() => {
    return {
      totalReviewed: results.length,
      newLearned: results.filter((r) => r.prevStatus === "new").length,
      lapses: results.filter((r) => r.rating === "again" && r.prevStatus === "review").length,
    };
  }, [results]);

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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Sesi Selesai!
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan hasil belajar Bab {chapterNumber}
          </p>
        </div>

        <div className="grid w-full max-w-xs grid-cols-3 gap-4">
          <StatCard label="Total" value={summary.totalReviewed} color="text-foreground" />
          <StatCard label="Baru" value={summary.newLearned} color="text-srs-learning" />
          <StatCard label="Lupa" value={summary.lapses} color="text-red-500" />
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <Button onClick={handleRestart} className="h-11 w-full gap-2">
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
        </div>
      </div>
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
        <span className="font-mono text-sm text-muted-foreground">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / cards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Flashcard */}
      {currentCard && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <VocabFlashcardCard
              vocab={currentCard}
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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-4">
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
