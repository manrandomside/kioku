"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, RefreshCw, Loader2, ArrowRight, Volume2, Trophy, Clock, Target, Zap, BookOpen, Star } from "lucide-react";
import { toHiragana, toKatakana, isKatakana } from "wanakana";

import { cn } from "@/lib/utils";
import { useSmartStudyStore } from "@/stores/smart-study-store";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { useCountUp } from "@/hooks/use-count-up";
import { useAutoPlayAudio } from "@/hooks/use-auto-play-audio";
import { ReviewCard } from "@/components/review/review-card";
import { RatingButtons } from "@/components/flashcard/rating-buttons";
import { VocabFlashcardCard } from "@/components/flashcard/vocab-flashcard-card";
import { FlashcardRatingButtons } from "@/components/flashcard/flashcard-rating-buttons";
import { QuizOption } from "@/components/quiz/quiz-option";
import { DisplayModeToggle } from "@/components/ui/display-mode-toggle";
import { XpPopup, useXpPopup } from "@/components/gamification/xp-popup";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { getSchedulingPreview } from "@/lib/srs/fsrs-engine";
import { playCorrectSound, playIncorrectSound } from "@/lib/audio/sound-effects";
import { playAudio } from "@/lib/audio/play-audio";
import { submitReviewByCardId } from "@/app/(dashboard)/review/actions";
import { submitVocabReview } from "@/app/(dashboard)/learn/mnn/[chapter]/flashcard/actions";
import {
  createSmartStudyQuizSession,
  submitSmartStudyQuizResult,
  awardSmartStudyBonus,
} from "@/app/(dashboard)/study/session/actions";

import type { SrsRating, SrsCardData } from "@/lib/srs/fsrs-engine";
import type { SmartStudySession } from "@/lib/services/smart-study-service";
import type { VocabQuizAnswer, VocabQuestionType } from "@/types/vocab-quiz";

const MAX_RETRIES = 3;

export default function StudySessionPage() {
  const router = useRouter();
  const store = useSmartStudyStore();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Fetch session data on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchSession() {
      try {
        store.setLoading(true);
        const response = await fetch("/api/v1/study/session");
        if (!response.ok) throw new Error("Gagal memuat sesi belajar");
        const json = await response.json();
        if (!json.success) throw new Error(json.error?.message ?? "Gagal memuat sesi belajar");
        if (!cancelled) {
          store.initSession(json.data as SmartStudySession);
        }
      } catch (err) {
        if (!cancelled) {
          store.setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        }
      }
    }

    fetchSession();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleExit() {
    setShowExitConfirm(true);
  }

  function confirmExit() {
    router.push("/home");
  }

  // Loading state
  if (store.isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memuat sesi belajar...</p>
      </div>
    );
  }

  // Error state
  if (store.error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-sm text-red-400">{store.error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <RefreshCw className="size-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!store.sessionData) return null;

  const phases = [
    { key: "review", label: "Review", hasContent: store.sessionData.summary.reviewCount > 0 },
    { key: "new-words", label: "Kata Baru", hasContent: store.sessionData.summary.newWordsCount > 0 },
    { key: "quiz", label: "Quiz", hasContent: store.sessionData.summary.quizCount > 0 },
  ];

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 px-1 py-3 backdrop-blur-sm">
        <button
          onClick={handleExit}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>

        {/* Phase indicators */}
        <div className="flex items-center gap-2">
          {phases.map((phase, i) => {
            const isCurrent =
              store.currentPhase === phase.key ||
              (store.currentPhase === "transition" && store.nextPhaseAfterTransition === phase.key);
            const isPast =
              phases.findIndex((p) => p.key === store.currentPhase) > i ||
              (store.currentPhase === "transition" &&
                phases.findIndex((p) => p.key === store.nextPhaseAfterTransition) > i);

            return (
              <div key={phase.key} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={cn(
                      "h-px w-4 sm:w-6",
                      isPast ? "bg-[#C2E959]" : "bg-border"
                    )}
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "size-2 rounded-full transition-colors",
                      isCurrent
                        ? "bg-[#C2E959]"
                        : isPast
                          ? "bg-[#C2E959]/60"
                          : "bg-muted-foreground/30"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isCurrent
                        ? "text-foreground"
                        : isPast
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50"
                    )}
                  >
                    {phase.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <PhaseProgress />
      </div>

      {/* Body */}
      <div className="flex-1 pb-6">
        <AnimatePresence mode="wait">
          {store.currentPhase === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <ReviewPhase />
            </motion.div>
          )}

          {store.currentPhase === "new-words" && (
            <motion.div
              key="new-words"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <NewWordsPhase />
            </motion.div>
          )}

          {store.currentPhase === "transition" && (
            <motion.div
              key="transition"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex min-h-[50vh] items-center justify-center"
            >
              <TransitionScreen />
            </motion.div>
          )}

          {store.currentPhase === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <QuizPhase />
            </motion.div>
          )}

          {store.currentPhase === "summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              <SummaryScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exit confirmation dialog */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-lg"
            >
              <h3 className="text-lg font-bold">Yakin keluar?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Progres fase ini akan hilang. Review yang sudah disubmit tetap tersimpan.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 rounded-lg border border-border bg-background py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
                >
                  Keluar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Phase progress text in header
function PhaseProgress() {
  const { currentPhase, currentReviewIndex, reviewQueue, newWordCompletedCount, sessionData, quizCurrentIndex } =
    useSmartStudyStore();

  if (currentPhase === "review") {
    return (
      <span className="font-mono text-xs text-muted-foreground">
        {Math.min(currentReviewIndex + 1, reviewQueue.length)}/{reviewQueue.length}
      </span>
    );
  }

  if (currentPhase === "new-words") {
    const total = sessionData?.summary.newWordsCount ?? 0;
    return (
      <span className="font-mono text-xs text-muted-foreground">
        {Math.min(newWordCompletedCount + 1, total)}/{total}
      </span>
    );
  }

  if (currentPhase === "quiz") {
    const total = sessionData?.quizQuestions.length ?? 0;
    return (
      <span className="font-mono text-xs text-muted-foreground">
        {Math.min(quizCurrentIndex + 1, total)}/{total}
      </span>
    );
  }

  return <span className="w-8" />;
}

// Transition screen between phases
function TransitionScreen() {
  const { transitionMessage, completeTransition } = useSmartStudyStore();

  useEffect(() => {
    const timer = setTimeout(completeTransition, 1500);
    return () => clearTimeout(timer);
  }, [completeTransition]);

  return (
    <div className="text-center">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-semibold text-foreground"
      >
        {transitionMessage}
      </motion.p>
    </div>
  );
}

// Phase 1: Review
function ReviewPhase() {
  const store = useSmartStudyStore();
  const { effectiveMode, toggleLocal } = useDisplayMode();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const { events: xpEvents, showXp } = useXpPopup();
  const cardStartRef = useRef(Date.now());

  const currentCard = store.currentReviewIndex < store.reviewQueue.length
    ? store.reviewQueue[store.currentReviewIndex]
    : null;

  // Check if review phase is done
  useEffect(() => {
    if (store.currentReviewIndex >= store.reviewQueue.length && store.reviewQueue.length > 0) {
      // All review cards done, transition to next phase
      const hasNewWords = (store.sessionData?.summary.newWordsCount ?? 0) > 0;
      if (hasNewWords) {
        store.startTransition("Bagus! Sekarang mari pelajari kata baru...", "new-words");
      } else {
        store.startTransition("Hebat! Sekarang mari uji ingatanmu...", "quiz");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.currentReviewIndex, store.reviewQueue.length]);

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

      const durationMs = Date.now() - cardStartRef.current;
      const cardId = currentCard.cardId;

      // Optimistic UI
      showXp(2);
      store.addReviewResult({
        cardId,
        rating,
        prevStatus: currentCard.status,
      });

      // Re-queue "Again" cards (max 3 retries)
      if (rating === "again") {
        const retries = store.reviewRetryCount.get(cardId) ?? 0;
        if (retries < MAX_RETRIES) {
          store.requeueReviewCard(currentCard);
          store.incrementReviewRetry(cardId);
        }
      }

      setIsFlipped(false);
      setTimeout(() => {
        store.advanceReview();
        cardStartRef.current = Date.now();
        setIsSubmitting(false);
      }, 300);

      // Submit to backend
      submitReviewByCardId(cardId, rating, durationMs).then((response) => {
        if (!response.success) {
          console.error("[smart-study/review] submitReviewByCardId failed:", response.error);
        }
        if (response.success && response.data?.xp?.leveledUp) {
          setLevelUpLevel(response.data.xp.currentLevel);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentCard, isSubmitting]
  );

  if (!currentCard) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-[#C2E959]"
          initial={{ width: 0 }}
          animate={{
            width: `${(store.currentReviewIndex / store.reviewQueue.length) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Display mode toggle for vocab cards */}
      {currentCard.type === "vocabulary" && (
        <div className="flex justify-end">
          <DisplayModeToggle mode={effectiveMode} onToggle={toggleLocal} />
        </div>
      )}

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentCard.cardId}-${store.currentReviewIndex}`}
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

      <XpPopup events={xpEvents} />
      <LevelUpModal
        level={levelUpLevel}
        onDismiss={() => setLevelUpLevel(null)}
      />
    </div>
  );
}

// Phase 2: New Words
function NewWordsPhase() {
  const store = useSmartStudyStore();
  const { effectiveMode, toggleLocal } = useDisplayMode();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pronunciationOpen, setPronunciationOpen] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const { events: xpEvents, showXp } = useXpPopup();
  const cardStartRef = useRef(Date.now());

  const currentItem = store.newWordQueue.length > 0 ? store.newWordQueue[0] : null;
  const totalNewWords = store.sessionData?.summary.newWordsCount ?? 0;
  const retryQueueCount = store.newWordQueue.filter((item) => item.retryNumber > 0).length;

  // Check if new words phase is done
  useEffect(() => {
    if (store.newWordQueue.length === 0 && store.newWordCompletedCount > 0) {
      const hasQuiz = (store.sessionData?.summary.quizCount ?? 0) > 0;
      if (hasQuiz) {
        store.startTransition("Hebat! Sekarang mari uji ingatanmu...", "quiz");
      } else {
        store.skipToPhase("summary");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.newWordQueue.length, store.newWordCompletedCount]);

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleUnderstood = useCallback(() => {
    if (!currentItem || isSubmitting) return;
    setIsSubmitting(true);

    const durationMs = Date.now() - cardStartRef.current;
    const vocabId = currentItem.word.id;

    store.markNewWordUnderstood(vocabId);
    store.incrementNewWordCompleted();
    showXp(2);

    setIsFlipped(false);
    setTimeout(() => {
      store.advanceNewWord();
      cardStartRef.current = Date.now();
      setIsSubmitting(false);
    }, 300);

    // Create SRS card via submitVocabReview with "good" rating
    submitVocabReview(vocabId, "good", durationMs).then((response) => {
      if (!response.success) {
        console.error("[smart-study/new-word] submitVocabReview failed:", response.error);
      }
      if (response.success && response.data?.xp?.leveledUp) {
        setLevelUpLevel(response.data.xp.currentLevel);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem, isSubmitting]);

  const handleNotUnderstood = useCallback(() => {
    if (!currentItem || isSubmitting) return;
    setIsSubmitting(true);

    const vocabId = currentItem.word.id;
    const currentRetries = store.newWordRetryCount.get(vocabId) ?? 0;
    const newRetries = currentRetries + 1;

    // Update retry count in store
    const newMap = new Map(store.newWordRetryCount);
    newMap.set(vocabId, newRetries);
    useSmartStudyStore.setState({ newWordRetryCount: newMap });

    store.markNewWordNotUnderstood(vocabId);

    if (newRetries < MAX_RETRIES) {
      // Re-queue at end
      store.requeueNewWord(currentItem.word, newRetries);
    } else {
      // Max retries reached, remove from queue and count as completed
      store.incrementNewWordCompleted();
      store.advanceNewWord();
    }

    setIsFlipped(false);
    setTimeout(() => {
      if (newRetries < MAX_RETRIES) {
        // requeueNewWord already shifted the queue
      }
      cardStartRef.current = Date.now();
      setIsSubmitting(false);
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem, isSubmitting]);

  if (!currentItem) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-[#C2E959]"
          initial={{ width: 0 }}
          animate={{
            width: `${(store.newWordCompletedCount / totalNewWords) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DisplayModeToggle mode={effectiveMode} onToggle={toggleLocal} />
          {retryQueueCount > 0 && (
            <span className="text-xs text-amber-500">
              {retryQueueCount} ulang
            </span>
          )}
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentItem.word.id}-${currentItem.retryNumber}`}
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
            vocab={currentItem.word}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            onPronunciationChange={setPronunciationOpen}
            displayMode={effectiveMode}
          />
        </motion.div>
      </AnimatePresence>

      {/* Rating buttons */}
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

      <XpPopup events={xpEvents} />
      <LevelUpModal
        level={levelUpLevel}
        onDismiss={() => setLevelUpLevel(null)}
      />
    </div>
  );
}

// Phase 3: Quiz
function QuizPhase() {
  const store = useSmartStudyStore();
  const { effectiveMode, toggleLocal } = useDisplayMode();
  const isKanaMode = effectiveMode === "kana";
  const { playIfEnabled } = useAutoPlayAudio();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [kanaInputMode, setKanaInputMode] = useState<"hiragana" | "katakana">("hiragana");
  const [isRevealed, setIsRevealed] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const { events: xpEvents, showXp } = useXpPopup();
  const inputRef = useRef<HTMLInputElement>(null);

  const questions = store.sessionData?.quizQuestions ?? [];
  const totalQuestions = questions.length;
  const currentQuestion = store.quizCurrentIndex < totalQuestions
    ? questions[store.quizCurrentIndex]
    : null;
  const progress = totalQuestions > 0 ? (store.quizCurrentIndex / totalQuestions) * 100 : 0;

  // Build kanji→hiragana mapping from session vocabulary for kana mode display
  const kanjiToHiragana = useMemo(() => {
    const map: Record<string, string> = {};
    if (!store.sessionData) return map;
    for (const card of store.sessionData.reviewCards) {
      if (card.vocabulary?.kanji) {
        map[card.vocabulary.kanji] = card.vocabulary.hiragana;
      }
    }
    for (const word of store.sessionData.newWords) {
      if (word.vocabulary.kanji) {
        map[word.vocabulary.kanji] = word.vocabulary.hiragana;
      }
    }
    return map;
  }, [store.sessionData]);

  function toKana(text: string): string {
    if (!isKanaMode) return text;
    return kanjiToHiragana[text] ?? text;
  }

  // Create quiz session on mount
  useEffect(() => {
    if (totalQuestions > 0 && !store.quizSessionId) {
      createSmartStudyQuizSession(totalQuestions).then((res) => {
        if (res.success && res.data) {
          store.setQuizSessionId(res.data.sessionId);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalQuestions]);

  // Auto-play audio for audio question types
  const AUTO_PLAY_TYPES = ["audio_to_word", "audio_to_meaning", "word_to_meaning"];
  useEffect(() => {
    if (currentQuestion?.audioUrl && AUTO_PLAY_TYPES.includes(currentQuestion.type)) {
      playIfEnabled(currentQuestion.audioUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.number]);

  // Focus input for typing questions
  useEffect(() => {
    if (currentQuestion?.mode === "typing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestion]);

  // Check if quiz is complete and go to summary
  useEffect(() => {
    if (store.quizCurrentIndex >= totalQuestions && totalQuestions > 0 && store.quizAnswers.length > 0) {
      // Submit quiz results
      const timeSpentMs = Date.now() - store.phaseStartTime;
      if (store.quizSessionId) {
        submitSmartStudyQuizResult(store.quizSessionId, store.quizAnswers, timeSpentMs).then((res) => {
          if (res.success && res.data?.xp) {
            store.setQuizXpData({
              awarded: res.data.xp.awarded,
              baseXp: res.data.xp.baseXp,
              bonusXp: res.data.xp.bonusXp,
              bonusLabel: res.data.xp.bonusLabel,
              leveledUp: res.data.xp.leveledUp,
              currentLevel: res.data.xp.currentLevel,
            });
            if (res.data.xp.leveledUp) {
              setLevelUpLevel(res.data.xp.currentLevel);
            }
          }
        });
      }
      store.skipToPhase("summary");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.quizCurrentIndex, totalQuestions]);

  // If no quiz questions, skip to summary
  useEffect(() => {
    if (totalQuestions === 0) {
      store.skipToPhase("summary");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalQuestions]);

  const handleSelectAnswer = useCallback(
    (option: string) => {
      if (selectedAnswer || !currentQuestion || isRevealed) return;
      const isCorrect = option === currentQuestion.correctAnswer;
      setSelectedAnswer(option);
      setIsRevealed(true);

      if (isCorrect) {
        playCorrectSound();
        showXp(3);
      } else {
        playIncorrectSound();
      }

      // Play correct answer audio after feedback
      if (currentQuestion.audioUrl) {
        setTimeout(() => playIfEnabled(currentQuestion.audioUrl), 300);
      }

      store.addQuizAnswer({
        questionNumber: currentQuestion.number,
        questionType: currentQuestion.type,
        vocabularyId: currentQuestion.vocabularyId,
        userAnswer: option,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedAnswer, currentQuestion, isRevealed]
  );

  const handleSubmitTyping = useCallback(() => {
    if (!currentQuestion || isRevealed || !typedAnswer.trim()) return;
    const userInput = typedAnswer.trim();
    const correct = currentQuestion.correctAnswer;
    const userHiragana = toHiragana(userInput, { passRomaji: true }).toLowerCase();
    const correctHiragana = toHiragana(correct, { passRomaji: true }).toLowerCase();
    const isCorrect = userHiragana === correctHiragana;

    setSelectedAnswer(userInput);
    setIsRevealed(true);

    if (isCorrect) {
      playCorrectSound();
      showXp(3);
    } else {
      playIncorrectSound();
    }

    if (currentQuestion.audioUrl) {
      setTimeout(() => playIfEnabled(currentQuestion.audioUrl), 300);
    }

    store.addQuizAnswer({
      questionNumber: currentQuestion.number,
      questionType: currentQuestion.type,
      vocabularyId: currentQuestion.vocabularyId,
      userAnswer: userInput,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, isRevealed, typedAnswer]);

  const handleNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setTypedAnswer("");
    setIsRevealed(false);
    store.advanceQuiz();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayAudio = useCallback(() => {
    if (currentQuestion?.audioUrl) {
      playAudio(currentQuestion.audioUrl);
    }
  }, [currentQuestion]);

  function getOptionState(option: string) {
    if (!isRevealed) return "idle" as const;
    if (option === currentQuestion?.correctAnswer) {
      return option === selectedAnswer
        ? ("selected-correct" as const)
        : ("reveal-correct" as const);
    }
    if (option === selectedAnswer) return "selected-wrong" as const;
    return "disabled" as const;
  }

  function isOptionJapanese(): boolean {
    if (!currentQuestion) return false;
    return ["meaning_to_word", "audio_to_word"].includes(currentQuestion.type);
  }

  if (!currentQuestion) return null;

  const isAudioOnly =
    currentQuestion.type === "audio_to_word" ||
    currentQuestion.type === "audio_to_meaning";
  const isJapaneseDisplay =
    currentQuestion.type === "word_to_meaning";

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-[#C2E959]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Display mode toggle */}
      <div className="flex justify-end">
        <DisplayModeToggle mode={effectiveMode} onToggle={toggleLocal} />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.number}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-6"
        >
          {/* Question label */}
          <p className="text-sm font-medium text-muted-foreground">
            {currentQuestion.questionLabel}
          </p>

          {/* Question display */}
          <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-8">
            {isAudioOnly ? (
              <button
                type="button"
                onClick={handlePlayAudio}
                className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 sm:size-20"
              >
                <Volume2 className="size-8 sm:size-10" />
              </button>
            ) : (
              <span
                className={cn(
                  "text-center leading-tight",
                  isJapaneseDisplay
                    ? "font-jp text-4xl font-medium text-foreground sm:text-5xl"
                    : "text-xl font-semibold text-primary sm:text-2xl"
                )}
              >
                {isJapaneseDisplay ? toKana(currentQuestion.questionText) : currentQuestion.questionText}
              </span>
            )}

            {!isAudioOnly && currentQuestion.audioUrl && (
              <button
                type="button"
                onClick={handlePlayAudio}
                className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Volume2 className="size-4" />
                Dengarkan
              </button>
            )}
          </div>

          {/* Multiple choice options */}
          {currentQuestion.mode === "multiple_choice" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              {currentQuestion.options.map((option) => (
                <QuizOption
                  key={option}
                  label={isOptionJapanese() ? toKana(option) : option}
                  state={getOptionState(option)}
                  isJapanese={isOptionJapanese()}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={isRevealed}
                />
              ))}
            </div>
          )}

          {/* Typing input */}
          {currentQuestion.mode === "typing" && (
            <div className="flex flex-col gap-3">
              {!isRevealed && isKatakana(currentQuestion.correctAnswer) && kanaInputMode === "hiragana" && (
                <p className="text-center text-xs font-medium text-amber-600 dark:text-amber-400">
                  Kata ini ditulis dalam katakana. Gunakan mode \u30A2.
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const newMode = kanaInputMode === "hiragana" ? "katakana" : "hiragana";
                    setKanaInputMode(newMode);
                    if (typedAnswer) {
                      setTypedAnswer(
                        newMode === "katakana"
                          ? toKatakana(typedAnswer, { passRomaji: true })
                          : toHiragana(typedAnswer, { passRomaji: true })
                      );
                    }
                  }}
                  disabled={isRevealed}
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 font-jp text-lg font-bold transition-colors sm:h-14",
                    kanaInputMode === "katakana"
                      ? "border-[#C2E959] bg-[#C2E959] text-[#0A3A3A]"
                      : "border-gray-300 bg-transparent text-gray-400 hover:border-gray-400 dark:border-gray-600 dark:text-gray-500 dark:hover:border-gray-500"
                  )}
                  title={kanaInputMode === "hiragana" ? "Ganti ke katakana" : "Ganti ke hiragana"}
                >
                  {kanaInputMode === "hiragana" ? "\u3042" : "\u30A2"}
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => {
                    const convert = kanaInputMode === "katakana" ? toKatakana : toHiragana;
                    setTypedAnswer(convert(e.target.value, { IMEMode: true }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmitTyping();
                  }}
                  placeholder={
                    kanaInputMode === "katakana"
                      ? "Ketik romaji \u2192 katakana..."
                      : "Ketik romaji \u2192 hiragana..."
                  }
                  disabled={isRevealed}
                  className={cn(
                    "h-12 w-full rounded-xl border-2 px-4 font-jp text-lg outline-none transition-colors placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground sm:h-14 sm:text-xl",
                    isRevealed && store.quizAnswers.length > 0 && store.quizAnswers[store.quizAnswers.length - 1].isCorrect
                      ? "border-green-500 bg-green-500/5"
                      : isRevealed
                        ? "border-red-500 bg-red-500/5"
                        : "border-border bg-card focus:border-primary"
                  )}
                />
              </div>
              {!isRevealed && (
                <button
                  type="button"
                  onClick={handleSubmitTyping}
                  disabled={!typedAnswer.trim()}
                  className="h-11 w-full rounded-xl bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  Periksa
                </button>
              )}
            </div>
          )}

          {/* Feedback + Next button */}
          <AnimatePresence>
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-col gap-3"
              >
                {(() => {
                  const lastAnswer = store.quizAnswers[store.quizAnswers.length - 1];
                  const isCorrect = lastAnswer?.isCorrect ?? false;
                  return (
                    <>
                      <div
                        className={cn(
                          "rounded-xl px-4 py-4",
                          isCorrect
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-red-500/10 text-red-700 dark:text-red-400"
                        )}
                      >
                        <p className="text-center text-base font-bold">
                          {isCorrect ? "Benar!" : "Salah!"}
                        </p>
                        {!isCorrect && (() => {
                          const feedbackVocab = (() => {
                            if (!store.sessionData) return null;
                            for (const card of store.sessionData.reviewCards) {
                              if (card.vocabulary?.id === currentQuestion.vocabularyId) return card.vocabulary;
                            }
                            for (const word of store.sessionData.newWords) {
                              if (word.vocabulary.id === currentQuestion.vocabularyId) return word.vocabulary;
                            }
                            return null;
                          })();
                          const isJapaneseAnswer = ["meaning_to_word", "audio_to_word"].includes(currentQuestion.type);

                          return (
                            <p className="mt-1 text-center text-sm">
                              Jawaban yang benar:{" "}
                              {isJapaneseAnswer && feedbackVocab?.kanji ? (
                                <span className="inline-flex flex-col items-center align-bottom">
                                  <span className="font-jp text-[10px] leading-tight opacity-50">
                                    {isKanaMode ? feedbackVocab.kanji : feedbackVocab.hiragana}
                                  </span>
                                  <span className="font-jp font-bold">
                                    {isKanaMode ? feedbackVocab.hiragana : feedbackVocab.kanji}
                                  </span>
                                </span>
                              ) : (
                                <span className="font-jp font-bold">
                                  {isJapaneseAnswer ? toKana(currentQuestion.correctAnswer) : currentQuestion.correctAnswer}
                                </span>
                              )}
                              {feedbackVocab ? (
                                <span className="opacity-70"> ({feedbackVocab.meaningId})</span>
                              ) : currentQuestion.hint ? (
                                <span className="opacity-70"> ({currentQuestion.hint})</span>
                              ) : null}
                            </p>
                          );
                        })()}
                      </div>

                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C2E959] text-base font-bold text-[#0A3A3A] transition-colors hover:bg-[#C2E959]/80"
                      >
                        Lanjut
                        <ArrowRight className="size-5" />
                      </button>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <XpPopup events={xpEvents} />
      <LevelUpModal
        level={levelUpLevel}
        onDismiss={() => setLevelUpLevel(null)}
      />
    </div>
  );
}

// Summary Screen
function SummaryScreen() {
  const store = useSmartStudyStore();
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [bonusAwarded, setBonusAwarded] = useState(false);

  const sessionData = store.sessionData;
  if (!sessionData) return null;

  const timeSpentMs = Date.now() - store.sessionStartTime;
  const timeMin = Math.floor(timeSpentMs / 60000);
  const timeSec = Math.floor((timeSpentMs % 60000) / 1000);

  // Review stats (deduplicated by last rating)
  const reviewLastRating = new Map<string, string>();
  store.reviewResults.forEach((r) => reviewLastRating.set(r.cardId, r.rating));
  const uniqueReviewResults = Array.from(reviewLastRating.values());
  const reviewCount = new Set(store.reviewResults.map((r) => r.cardId)).size;
  const reviewRatings = {
    again: uniqueReviewResults.filter((r) => r === "again").length,
    hard: uniqueReviewResults.filter((r) => r === "hard").length,
    good: uniqueReviewResults.filter((r) => r === "good").length,
    easy: uniqueReviewResults.filter((r) => r === "easy").length,
  };

  // New words stats
  const newWordsLearned = store.newWordUnderstoodIds.size;
  const newWordsNotMastered = sessionData.summary.newWordsCount - newWordsLearned;
  const activeChapterNumber = sessionData.summary.activeChapter?.chapterNumber;

  // Quiz stats
  const quizCorrect = store.quizAnswers.filter((a) => a.isCorrect).length;
  const quizTotal = store.quizAnswers.length;
  const quizPercent = quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0;
  const isPerfectQuiz = quizCorrect === quizTotal && quizTotal > 0;

  // XP calculation
  const reviewXp = reviewCount * 2;
  const newWordXp = newWordsLearned * 2;
  const quizBaseXp = store.quizXpData?.baseXp ?? quizCorrect * 3;
  const quizBonusXp = store.quizXpData?.bonusXp ?? 0;
  const quizTotalXp = quizBaseXp + quizBonusXp;
  const sessionBonusXp = 15;

  // All 3 phases were available = session complete
  const allPhasesComplete =
    (sessionData.summary.reviewCount === 0 || reviewCount > 0) &&
    (sessionData.summary.newWordsCount === 0 || store.newWordCompletedCount > 0) &&
    (sessionData.quizQuestions.length === 0 || quizTotal > 0);

  const totalXp = reviewXp + newWordXp + quizTotalXp + (allPhasesComplete ? sessionBonusXp : 0);

  // Award session bonus XP (once)
  useEffect(() => {
    if (!allPhasesComplete || bonusAwarded || !store.quizSessionId) return;
    setBonusAwarded(true);
    awardSmartStudyBonus(store.quizSessionId).then((res) => {
      if (res.success && res.data && !res.data.alreadyAwarded) {
        // Bonus awarded
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPhasesComplete, store.quizSessionId]);

  return (
    <div className="flex flex-col items-center gap-6 px-2 py-4">
      {/* Title */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="flex size-20 items-center justify-center rounded-full bg-[#C2E959]/15">
          <Trophy className="size-10 text-[#C2E959]" />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Sesi Selesai!
        </h2>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          {timeMin} menit {timeSec} detik
        </p>
      </motion.div>

      {/* Phase breakdown */}
      <div className="w-full max-w-sm space-y-3">
        {/* Review section */}
        <SummarySection delay={0.1} icon={<Target className="size-5 text-blue-500" />} title="Review">
          {sessionData.summary.reviewCount > 0 ? (
            <>
              <p className="text-sm font-semibold">{reviewCount} kartu</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {reviewRatings.easy > 0 && <RatingBadge label="Mudah" count={reviewRatings.easy} color="teal" />}
                {reviewRatings.good > 0 && <RatingBadge label="Baik" count={reviewRatings.good} color="green" />}
                {reviewRatings.hard > 0 && <RatingBadge label="Sulit" count={reviewRatings.hard} color="orange" />}
                {reviewRatings.again > 0 && <RatingBadge label="Lagi" count={reviewRatings.again} color="red" />}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada review hari ini</p>
          )}
        </SummarySection>

        {/* New words section */}
        <SummarySection delay={0.2} icon={<BookOpen className="size-5 text-green-500" />} title="Kata Baru">
          {sessionData.summary.newWordsCount > 0 ? (
            <>
              <p className="text-sm font-semibold">{newWordsLearned} kata dipelajari</p>
              {activeChapterNumber && (
                <p className="text-xs text-muted-foreground">Dari Bab {activeChapterNumber}</p>
              )}
              {newWordsNotMastered > 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  {newWordsNotMastered} kata belum dikuasai — akan muncul di sesi berikutnya
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Semua kata di bab ini sudah dipelajari</p>
          )}
        </SummarySection>

        {/* Quiz section */}
        {quizTotal > 0 && (
          <SummarySection delay={0.3} icon={<Star className="size-5 text-purple-500" />} title="Quiz">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {quizCorrect}/{quizTotal} benar ({quizPercent}%)
              </p>
              {isPerfectQuiz && (
                <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
                  Sempurna!
                </span>
              )}
            </div>
          </SummarySection>
        )}
      </div>

      {/* XP breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="size-5 text-[#C2E959]" />
            <h3 className="text-sm font-semibold">XP Diperoleh</h3>
          </div>
          <div className="space-y-2 text-sm">
            {reviewCount > 0 && (
              <XpRow label={`Review (${reviewCount} kartu)`} xp={reviewXp} delay={500} />
            )}
            {newWordsLearned > 0 && (
              <XpRow label={`Kata Baru (${newWordsLearned} kata)`} xp={newWordXp} delay={700} />
            )}
            {quizTotal > 0 && (
              <XpRow label={`Quiz (${quizCorrect}/${quizTotal} benar)`} xp={quizTotalXp} delay={900} />
            )}
            {allPhasesComplete && (
              <XpRow label="Bonus Sesi Selesai" xp={sessionBonusXp} delay={1100} />
            )}
            <div className="border-t border-border/50 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-[#C2E959]">
                  +<CountUpValue target={totalXp} delay={1300} /> XP
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
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
          Kembali ke Dashboard
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium transition-colors hover:bg-muted"
        >
          <RefreshCw className="size-4" />
          Belajar Lagi
        </button>
      </motion.div>

      <LevelUpModal
        level={levelUpLevel}
        onDismiss={() => setLevelUpLevel(null)}
      />
    </div>
  );
}

// Summary helpers
function SummarySection({
  delay,
  icon,
  title,
  children,
}: {
  delay: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border/50 bg-card p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function RatingBadge({ label, count, color }: { label: string; count: number; color: string }) {
  const colorMap: Record<string, string> = {
    teal: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    green: "bg-green-500/15 text-green-600 dark:text-green-400",
    orange: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    red: "bg-red-500/15 text-red-600 dark:text-red-400",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", colorMap[color])}>
      {count} {label}
    </span>
  );
}

function XpRow({ label, xp, delay }: { label: string; xp: number; delay: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">+<CountUpValue target={xp} delay={delay} /> XP</span>
    </div>
  );
}

function CountUpValue({ target, delay }: { target: number; delay: number }) {
  const value = useCountUp(target, 800, delay);
  return <>{value}</>;
}
