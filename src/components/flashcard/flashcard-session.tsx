"use client";

import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { FlashcardCard } from "@/components/flashcard/flashcard-card";
import { RatingButtons } from "@/components/flashcard/rating-buttons";
import { FlashcardSummary } from "@/components/flashcard/session-summary";
import { XpPopup, useXpPopup } from "@/components/gamification/xp-popup";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { getSchedulingPreview, createNewCardData } from "@/lib/srs/fsrs-engine";
import { submitKanaReview } from "@/app/(dashboard)/learn/hirakata/flashcard/actions";

import type { KanaWithSrs } from "@/types/kana";
import type { SrsRating, FlashcardResult, SessionSummary } from "@/types/flashcard";

interface FlashcardSessionProps {
  cards: KanaWithSrs[];
  script: string;
  filter: string;
}

export function FlashcardSession({ cards, script, filter }: FlashcardSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<FlashcardResult[]>([]);
  const [reviewStartTime, setReviewStartTime] = useState(() => Date.now());
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const { events: xpEvents, showXp } = useXpPopup();

  const isCompleted = currentIndex >= cards.length;
  const currentCard = isCompleted ? null : cards[currentIndex];

  // Scheduling preview for current card
  const schedulingPreviews = useMemo(() => {
    if (!currentCard) return [];
    const cardData = createNewCardData();
    // Use actual SRS data if card has been reviewed before
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
      showXp(5);
      setResults((prev) => [...prev, { kanaId: cardId, rating, prevStatus, newStatus: prevStatus }]);
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setReviewStartTime(Date.now());
        setIsSubmitting(false);
      }, 300);

      // Fire server action in background (handle level-up from server response)
      submitKanaReview(cardId, rating, durationMs).then((response) => {
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

  // Session summary
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
      <FlashcardSummary
        summary={summary}
        script={script}
        filter={filter}
        onRestart={handleRestart}
      />
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
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex) / cards.length) * 100}%` }}
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
            <FlashcardCard
              kana={currentCard}
              isFlipped={isFlipped}
              onFlip={handleFlip}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Rating buttons (only visible when flipped) */}
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
