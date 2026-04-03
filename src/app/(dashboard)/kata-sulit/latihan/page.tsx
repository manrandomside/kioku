"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  RefreshCw,
  Loader2,
  ArrowRight,
  Volume2,
  Trophy,
  Clock,
  Star,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toHiragana, toKatakana, isKatakana } from "wanakana";

import { cn } from "@/lib/utils";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { useCountUp } from "@/hooks/use-count-up";
import { useAutoPlayAudio } from "@/hooks/use-auto-play-audio";
import { VocabFlashcardCard } from "@/components/flashcard/vocab-flashcard-card";
import { FlashcardRatingButtons } from "@/components/flashcard/flashcard-rating-buttons";
import { QuizOption } from "@/components/quiz/quiz-option";
import { DisplayModeToggle } from "@/components/ui/display-mode-toggle";
import { XpPopup, useXpPopup } from "@/components/gamification/xp-popup";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { playCorrectSound, playIncorrectSound } from "@/lib/audio/sound-effects";
import { playAudio } from "@/lib/audio/play-audio";
import {
  createLeechTrainingSession,
  submitLeechTrainingResult,
  awardLeechTrainingBonus,
} from "./actions";

import type { LeechCardFull } from "@/lib/services/leech-service";
import type { VocabQuizAnswer, VocabQuizQuestion } from "@/types/vocab-quiz";
import type { VocabularyWithSrs } from "@/types/vocabulary";

const MAX_FLASHCARD_RETRIES = 5;
const MAX_QUIZ_QUESTIONS = 20;
const QUIZ_RETRY_DELAY = 3; // re-insert wrong answers 3 questions later

type Phase = "loading" | "flashcard" | "quiz" | "summary";

interface FlashcardItem {
  card: LeechCardFull;
  retryNumber: number;
}

interface DistractorVocab {
  id: string;
  kanji: string | null;
  hiragana: string;
  meaningId: string;
  audioUrl: string | null;
}

export default function LeechTrainingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vocabFilter = searchParams.get("vocab");

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Data
  const [leechCards, setLeechCards] = useState<LeechCardFull[]>([]);
  const [distractorPool, setDistractorPool] = useState<DistractorVocab[]>([]);

  // Flashcard phase state
  const [flashcardQueue, setFlashcardQueue] = useState<FlashcardItem[]>([]);
  const [flashcardResults, setFlashcardResults] = useState<Map<string, "remembered" | "forgot">>(new Map());
  const [flashcardCompletedCount, setFlashcardCompletedCount] = useState(0);

  // Quiz phase state
  const [quizQuestions, setQuizQuestions] = useState<VocabQuizQuestion[]>([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<VocabQuizAnswer[]>([]);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [quizRetryInsertions, setQuizRetryInsertions] = useState<Map<number, VocabQuizQuestion>>(new Map());

  // Summary
  const [quizXpData, setQuizXpData] = useState<{
    awarded: number;
    baseXp: number;
    bonusXp: number;
    bonusLabel: string;
    leveledUp: boolean;
    currentLevel: number;
  } | null>(null);

  // Timing
  const sessionStartTime = useRef(Date.now());

  // Fetch training data
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const url = vocabFilter
          ? `/api/v1/leech/training?vocab=${vocabFilter}`
          : "/api/v1/leech/training";
        const res = await fetch(url);
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message ?? "Gagal memuat data");
        if (cancelled) return;

        const cards: LeechCardFull[] = json.data.leechCards;
        const pool: DistractorVocab[] = json.data.distractorPool;

        if (cards.length === 0) {
          setError("Tidak ada kata sulit untuk dilatih.");
          return;
        }

        setLeechCards(cards);
        setDistractorPool(pool);
        setFlashcardQueue(cards.map((c) => ({ card: c, retryNumber: 0 })));
        setPhase("flashcard");
        sessionStartTime.current = Date.now();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        }
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [vocabFilter]);

  function handleExit() {
    setShowExitConfirm(true);
  }

  function confirmExit() {
    router.push("/kata-sulit");
  }

  // Transition from flashcard to quiz
  function startQuizPhase() {
    const questions = generateLeechQuizQuestions(leechCards, distractorPool);
    setQuizQuestions(questions);
    setQuizCurrentIndex(0);
    setQuizAnswers([]);
    setPhase("quiz");
  }

  // Loading
  if (phase === "loading") {
    if (error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
          <p className="text-center text-sm text-red-400">{error}</p>
          <Link
            href="/kata-sulit"
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Kembali
          </Link>
        </div>
      );
    }
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Menyiapkan latihan...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 pb-8">
      {/* Exit button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleExit}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
          Keluar
        </button>
        <span className="text-xs font-medium text-muted-foreground">
          {phase === "flashcard" && "Fase 1: Flashcard"}
          {phase === "quiz" && "Fase 2: Quiz"}
          {phase === "summary" && "Ringkasan"}
        </span>
      </div>

      {phase === "flashcard" && (
        <FlashcardPhase
          queue={flashcardQueue}
          setQueue={setFlashcardQueue}
          results={flashcardResults}
          setResults={setFlashcardResults}
          completedCount={flashcardCompletedCount}
          setCompletedCount={setFlashcardCompletedCount}
          totalCards={leechCards.length}
          onComplete={startQuizPhase}
        />
      )}

      {phase === "quiz" && (
        <QuizPhase
          questions={quizQuestions}
          setQuestions={setQuizQuestions}
          currentIndex={quizCurrentIndex}
          setCurrentIndex={setQuizCurrentIndex}
          answers={quizAnswers}
          setAnswers={setQuizAnswers}
          sessionId={quizSessionId}
          setSessionId={setQuizSessionId}
          retryInsertions={quizRetryInsertions}
          setRetryInsertions={setQuizRetryInsertions}
          leechCards={leechCards}
          distractorPool={distractorPool}
          sessionStartTime={sessionStartTime.current}
          onXpData={setQuizXpData}
          onComplete={() => setPhase("summary")}
        />
      )}

      {phase === "summary" && (
        <SummaryScreen
          leechCards={leechCards}
          flashcardResults={flashcardResults}
          quizAnswers={quizAnswers}
          quizXpData={quizXpData}
          sessionId={quizSessionId}
          sessionStartTime={sessionStartTime.current}
        />
      )}

      {/* Exit confirm dialog */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs rounded-2xl border bg-card p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold">Keluar dari latihan?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Progres latihan tidak akan disimpan.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
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

// === FLASHCARD PHASE ===
function FlashcardPhase({
  queue,
  setQueue,
  results,
  setResults,
  completedCount,
  setCompletedCount,
  totalCards,
  onComplete,
}: {
  queue: FlashcardItem[];
  setQueue: React.Dispatch<React.SetStateAction<FlashcardItem[]>>;
  results: Map<string, "remembered" | "forgot">;
  setResults: React.Dispatch<React.SetStateAction<Map<string, "remembered" | "forgot">>>;
  completedCount: number;
  setCompletedCount: React.Dispatch<React.SetStateAction<number>>;
  totalCards: number;
  onComplete: () => void;
}) {
  const { effectiveMode, toggleLocal } = useDisplayMode();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pronunciationOpen, setPronunciationOpen] = useState(false);

  const currentItem = queue[0] ?? null;
  const retryQueueCount = queue.filter((q) => q.retryNumber > 0).length;

  // Convert LeechCardFull to VocabularyWithSrs for flashcard component
  const vocabForCard: VocabularyWithSrs | null = currentItem
    ? {
        id: currentItem.card.vocabularyId,
        kanji: currentItem.card.kanji,
        hiragana: currentItem.card.hiragana,
        romaji: currentItem.card.romaji,
        meaningId: currentItem.card.meaningId,
        meaningEn: currentItem.card.meaningEn,
        wordType: currentItem.card.wordType as VocabularyWithSrs["wordType"],
        jlptLevel: currentItem.card.jlptLevel,
        audioUrl: currentItem.card.audioUrl,
        exampleJp: currentItem.card.exampleJp,
        exampleId: currentItem.card.exampleId,
        sortOrder: currentItem.card.sortOrder,
        srsStatus: currentItem.card.status as VocabularyWithSrs["srsStatus"],
      }
    : null;

  const handleFlip = useCallback(() => {
    if (!isFlipped) setIsFlipped(true);
  }, [isFlipped]);

  const handleNotUnderstood = useCallback(() => {
    if (!currentItem || isSubmitting) return;
    setIsSubmitting(true);

    setResults((prev) => {
      const next = new Map(prev);
      next.set(currentItem.card.vocabularyId, "forgot");
      return next;
    });

    const newRetry = currentItem.retryNumber + 1;
    setQueue((prev) => {
      const rest = prev.slice(1);
      if (newRetry < MAX_FLASHCARD_RETRIES) {
        // Re-insert after 2 cards (or at end if queue is short)
        const insertAt = Math.min(2, rest.length);
        const updated = [...rest];
        updated.splice(insertAt, 0, { card: currentItem.card, retryNumber: newRetry });
        return updated;
      }
      return rest;
    });

    setIsFlipped(false);
    setTimeout(() => {
      setCompletedCount((c) => c + 1);
      setIsSubmitting(false);
    }, 200);
  }, [currentItem, isSubmitting, setQueue, setResults, setCompletedCount]);

  const handleUnderstood = useCallback(() => {
    if (!currentItem || isSubmitting) return;
    setIsSubmitting(true);

    setResults((prev) => {
      const next = new Map(prev);
      next.set(currentItem.card.vocabularyId, "remembered");
      return next;
    });

    setQueue((prev) => prev.slice(1));
    setIsFlipped(false);
    setTimeout(() => {
      setCompletedCount((c) => c + 1);
      setIsSubmitting(false);
    }, 200);
  }, [currentItem, isSubmitting, setQueue, setResults, setCompletedCount]);

  // Check if flashcard phase is done
  useEffect(() => {
    if (queue.length === 0 && totalCards > 0) {
      onComplete();
    }
  }, [queue.length, totalCards, onComplete]);

  if (!currentItem || !vocabForCard) return null;

  const progress = totalCards > 0 ? Math.min(100, (completedCount / (totalCards + retryQueueCount + completedCount)) * 100) : 0;

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DisplayModeToggle mode={effectiveMode} onToggle={toggleLocal} />
          {retryQueueCount > 0 && (
            <span className="text-xs text-amber-500">
              {retryQueueCount} ulang
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {queue.length} tersisa
        </span>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentItem.card.vocabularyId}-${currentItem.retryNumber}`}
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

          {/* Lapses badge */}
          <div className="absolute -top-2 right-2 z-10">
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
              currentItem.card.lapses >= 6
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
            )}>
              Lupa {currentItem.card.lapses}x
            </span>
          </div>

          <VocabFlashcardCard
            vocab={vocabForCard}
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
    </div>
  );
}

// === QUIZ PHASE ===
function QuizPhase({
  questions,
  setQuestions,
  currentIndex,
  setCurrentIndex,
  answers,
  setAnswers,
  sessionId,
  setSessionId,
  retryInsertions,
  setRetryInsertions,
  leechCards,
  distractorPool,
  sessionStartTime,
  onXpData,
  onComplete,
}: {
  questions: VocabQuizQuestion[];
  setQuestions: React.Dispatch<React.SetStateAction<VocabQuizQuestion[]>>;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  answers: VocabQuizAnswer[];
  setAnswers: React.Dispatch<React.SetStateAction<VocabQuizAnswer[]>>;
  sessionId: string | null;
  setSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  retryInsertions: Map<number, VocabQuizQuestion>;
  setRetryInsertions: React.Dispatch<React.SetStateAction<Map<number, VocabQuizQuestion>>>;
  leechCards: LeechCardFull[];
  distractorPool: DistractorVocab[];
  sessionStartTime: number;
  onXpData: (data: { awarded: number; baseXp: number; bonusXp: number; bonusLabel: string; leveledUp: boolean; currentLevel: number }) => void;
  onComplete: () => void;
}) {
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

  const totalQuestions = questions.length;
  const currentQuestion = currentIndex < totalQuestions ? questions[currentIndex] : null;
  const progress = totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0;

  // Build kanji->hiragana mapping for display mode
  const kanjiToHiragana = useMemo(() => {
    const map: Record<string, string> = {};
    for (const card of leechCards) {
      if (card.kanji) {
        map[card.kanji] = card.hiragana;
      }
    }
    for (const v of distractorPool) {
      if (v.kanji) {
        map[v.kanji] = v.hiragana;
      }
    }
    return map;
  }, [leechCards, distractorPool]);

  function toKana(text: string): string {
    if (!isKanaMode) return text;
    return kanjiToHiragana[text] ?? text;
  }

  // Create quiz session on mount
  useEffect(() => {
    if (totalQuestions > 0 && !sessionId) {
      createLeechTrainingSession(totalQuestions).then((res) => {
        if (res.success && res.data) {
          setSessionId(res.data.sessionId);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalQuestions]);

  // Auto-play audio for audio questions
  const AUTO_PLAY_TYPES = ["audio_to_meaning", "audio_to_word"];
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

  // Submit when all questions answered
  useEffect(() => {
    if (currentIndex >= totalQuestions && totalQuestions > 0 && answers.length > 0) {
      const timeSpentMs = Date.now() - sessionStartTime;
      if (sessionId) {
        submitLeechTrainingResult(sessionId, answers, timeSpentMs).then((res) => {
          if (res.success && res.data?.xp) {
            onXpData({
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
      onComplete();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, totalQuestions]);

  // Skip to summary if no quiz questions
  useEffect(() => {
    if (totalQuestions === 0) {
      onComplete();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalQuestions]);

  const handleSelectAnswer = useCallback((option: string) => {
    if (selectedAnswer || !currentQuestion || isRevealed) return;
    const isCorrect = option === currentQuestion.correctAnswer;
    setSelectedAnswer(option);
    setIsRevealed(true);

    if (isCorrect) {
      playCorrectSound();
      showXp(3);
    } else {
      playIncorrectSound();
      // Retry: re-insert this question QUIZ_RETRY_DELAY questions later
      const retryAt = currentIndex + QUIZ_RETRY_DELAY + 1;
      if (retryAt <= totalQuestions + 5) { // don't add infinite retries
        const retryQuestion: VocabQuizQuestion = {
          ...currentQuestion,
          number: totalQuestions + 1, // will be renumbered
        };
        setQuestions((prev) => {
          const updated = [...prev];
          const insertIdx = Math.min(retryAt, updated.length);
          updated.splice(insertIdx, 0, { ...retryQuestion, number: insertIdx + 1 });
          // Renumber from insertIdx onward
          for (let i = insertIdx; i < updated.length; i++) {
            updated[i] = { ...updated[i], number: i + 1 };
          }
          return updated;
        });
      }
    }

    if (currentQuestion.audioUrl) {
      setTimeout(() => playIfEnabled(currentQuestion.audioUrl), 300);
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionNumber: currentQuestion.number,
        questionType: currentQuestion.type,
        vocabularyId: currentQuestion.vocabularyId,
        userAnswer: option,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect,
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnswer, currentQuestion, isRevealed, currentIndex, totalQuestions]);

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
      // Retry wrong typing answers too
      const retryAt = currentIndex + QUIZ_RETRY_DELAY + 1;
      if (retryAt <= totalQuestions + 5) {
        setQuestions((prev) => {
          const updated = [...prev];
          const insertIdx = Math.min(retryAt, updated.length);
          updated.splice(insertIdx, 0, { ...currentQuestion, number: insertIdx + 1 });
          for (let i = insertIdx; i < updated.length; i++) {
            updated[i] = { ...updated[i], number: i + 1 };
          }
          return updated;
        });
      }
    }

    if (currentQuestion.audioUrl) {
      setTimeout(() => playIfEnabled(currentQuestion.audioUrl), 300);
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionNumber: currentQuestion.number,
        questionType: currentQuestion.type,
        vocabularyId: currentQuestion.vocabularyId,
        userAnswer: userInput,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect,
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, isRevealed, typedAnswer, currentIndex, totalQuestions]);

  const handleNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setTypedAnswer("");
    setIsRevealed(false);
    setCurrentIndex((i) => i + 1);
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

  const isAudioOnly = currentQuestion.type === "audio_to_meaning";
  const isJapaneseDisplay = false; // We don't use word_to_meaning in leech quiz

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
          key={`${currentIndex}-${currentQuestion.number}`}
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
                className="text-center text-xl font-semibold leading-tight text-primary sm:text-2xl"
              >
                {currentQuestion.questionText}
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
                    isRevealed && answers.length > 0 && answers[answers.length - 1].isCorrect
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
                  const lastAnswer = answers[answers.length - 1];
                  const isCorrect = lastAnswer?.isCorrect ?? false;
                  const feedbackCard = leechCards.find(
                    (c) => c.vocabularyId === currentQuestion.vocabularyId
                  );
                  const isJapaneseAnswer = ["meaning_to_word", "audio_to_word", "fill_in_blank"].includes(currentQuestion.type);

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
                        {!isCorrect && (
                          <p className="mt-1 text-center text-sm">
                            Jawaban yang benar:{" "}
                            {isJapaneseAnswer && feedbackCard?.kanji ? (
                              <span className="inline-flex flex-col items-center align-bottom">
                                <span className="font-jp text-[10px] leading-tight opacity-50">
                                  {isKanaMode ? feedbackCard.kanji : feedbackCard.hiragana}
                                </span>
                                <span className="font-jp font-bold">
                                  {isKanaMode ? feedbackCard.hiragana : feedbackCard.kanji}
                                </span>
                              </span>
                            ) : (
                              <span className="font-jp font-bold">
                                {currentQuestion.correctAnswer}
                              </span>
                            )}
                            {feedbackCard ? (
                              <span className="opacity-70"> ({feedbackCard.meaningId})</span>
                            ) : currentQuestion.hint ? (
                              <span className="opacity-70"> ({currentQuestion.hint})</span>
                            ) : null}
                          </p>
                        )}
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

// === SUMMARY ===
function SummaryScreen({
  leechCards,
  flashcardResults,
  quizAnswers,
  quizXpData,
  sessionId,
  sessionStartTime,
}: {
  leechCards: LeechCardFull[];
  flashcardResults: Map<string, "remembered" | "forgot">;
  quizAnswers: VocabQuizAnswer[];
  quizXpData: { awarded: number; baseXp: number; bonusXp: number; bonusLabel: string; leveledUp: boolean; currentLevel: number } | null;
  sessionId: string | null;
  sessionStartTime: number;
}) {
  const { effectiveMode } = useDisplayMode();
  const isKanaMode = effectiveMode === "kana";
  const [bonusAwarded, setBonusAwarded] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);

  const timeSpentMs = Date.now() - sessionStartTime;
  const timeMin = Math.floor(timeSpentMs / 60000);
  const timeSec = Math.floor((timeSpentMs % 60000) / 1000);

  // Quiz stats
  const quizCorrect = quizAnswers.filter((a) => a.isCorrect).length;
  const quizTotal = quizAnswers.length;
  const quizPercent = quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0;

  // Per-word result
  const wordResults = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>();
    for (const a of quizAnswers) {
      const existing = map.get(a.vocabularyId) ?? { correct: 0, total: 0 };
      existing.total++;
      if (a.isCorrect) existing.correct++;
      map.set(a.vocabularyId, existing);
    }
    return map;
  }, [quizAnswers]);

  // XP
  const quizBaseXp = quizXpData?.baseXp ?? quizCorrect * 3;
  const quizBonusXp = quizXpData?.bonusXp ?? 0;
  const completionBonusXp = 20;
  const totalXp = quizBaseXp + quizBonusXp + completionBonusXp;

  // Award bonus
  useEffect(() => {
    if (bonusAwarded || !sessionId) return;
    setBonusAwarded(true);
    awardLeechTrainingBonus(sessionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

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
          Latihan Selesai!
        </h2>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          {timeMin} menit {timeSec} detik
        </p>
      </motion.div>

      {/* Quiz stats */}
      {quizTotal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm rounded-xl border border-border/50 bg-card p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <Star className="size-5 text-purple-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quiz</h3>
          </div>
          <p className="text-sm font-semibold">
            {quizCorrect}/{quizTotal} benar ({quizPercent}%)
          </p>
        </motion.div>
      )}

      {/* Per-word breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm"
      >
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Performa Per Kata
        </h3>
        <div className="space-y-2">
          {leechCards.map((card) => {
            const result = wordResults.get(card.vocabularyId);
            const allCorrect = result ? result.correct === result.total : false;

            return (
              <div
                key={card.vocabularyId}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-jp text-base font-medium">
                    {isKanaMode
                      ? card.hiragana
                      : card.kanji || card.hiragana}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {card.meaningId}
                  </span>
                </div>
                {result ? (
                  allCorrect ? (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-semibold text-green-600 dark:text-green-400">
                      <CheckCircle2 className="size-3" />
                      Membaik!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400">
                      <AlertTriangle className="size-3" />
                      Perlu latihan
                    </span>
                  )
                ) : (
                  <span className="text-[11px] text-muted-foreground">-</span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* XP breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="size-5 text-[#C2E959]" />
            <h3 className="text-sm font-semibold">XP Diperoleh</h3>
          </div>
          <div className="space-y-2 text-sm">
            {quizTotal > 0 && (
              <XpRow label={`Quiz (${quizCorrect}/${quizTotal} benar)`} xp={quizBaseXp + quizBonusXp} delay={500} />
            )}
            <XpRow label="Bonus Latihan Selesai" xp={completionBonusXp} delay={700} />
            <div className="border-t border-border/50 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-[#C2E959]">
                  +<CountUpValue target={totalXp} delay={900} /> XP
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
        transition={{ delay: 0.5 }}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <Link
          href="/kata-sulit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Kembali ke Kata Sulit
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium transition-colors hover:bg-muted"
        >
          <RefreshCw className="size-4" />
          Latih Lagi
        </button>
      </motion.div>

      <LevelUpModal
        level={levelUpLevel}
        onDismiss={() => setLevelUpLevel(null)}
      />
    </div>
  );
}

// === HELPERS ===
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

// === QUIZ QUESTION GENERATOR ===
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getDisplayWord(card: { kanji: string | null; hiragana: string }): string {
  return card.kanji || card.hiragana;
}

function generateLeechQuizQuestions(
  leechCards: LeechCardFull[],
  distractorPool: DistractorVocab[]
): VocabQuizQuestion[] {
  if (leechCards.length === 0) return [];

  // Build combined pool for distractors: leech cards + chapter vocab
  const allVocab = new Map<string, DistractorVocab>();
  for (const card of leechCards) {
    allVocab.set(card.vocabularyId, {
      id: card.vocabularyId,
      kanji: card.kanji,
      hiragana: card.hiragana,
      meaningId: card.meaningId,
      audioUrl: card.audioUrl,
    });
  }
  for (const v of distractorPool) {
    if (!allVocab.has(v.id)) {
      allVocab.set(v.id, v);
    }
  }
  const pool = Array.from(allVocab.values());

  // Available question types for leech training (harder types only)
  const LEECH_TYPES: Array<{ type: VocabQuizQuestion["type"]; mode: VocabQuizQuestion["mode"] }> = [];

  // type_hiragana: show meaning -> type hiragana (hardest)
  LEECH_TYPES.push({ type: "fill_in_blank", mode: "typing" });

  // audio_to_meaning: listen -> pick meaning (4 choices)
  if (leechCards.some((c) => c.audioUrl)) {
    LEECH_TYPES.push({ type: "audio_to_meaning", mode: "multiple_choice" });
  }

  // fill_blank with sentence: use example sentence -> pick word
  // We'll implement this as meaning_to_word but only if we have enough distractors
  if (pool.length >= 4) {
    LEECH_TYPES.push({ type: "meaning_to_word", mode: "multiple_choice" });
  }

  if (LEECH_TYPES.length === 0) return [];

  // Sort leech cards by lapses (hardest first) for priority
  const sortedCards = [...leechCards].sort((a, b) => b.lapses - a.lapses);

  // Each leech card gets 2 questions (different types)
  const questions: VocabQuizQuestion[] = [];
  let questionNum = 1;

  for (const card of sortedCards) {
    if (questions.length >= MAX_QUIZ_QUESTIONS) break;

    // Pick 2 different types for this card
    const availableForCard = LEECH_TYPES.filter((t) => {
      if (t.type === "audio_to_meaning" && !card.audioUrl) return false;
      return true;
    });

    const shuffledTypes = shuffle(availableForCard);
    const typesForCard = shuffledTypes.slice(0, 2);

    for (const { type } of typesForCard) {
      if (questions.length >= MAX_QUIZ_QUESTIONS) break;

      const q = buildLeechQuestion(card, pool, type, questionNum);
      if (q) {
        questions.push(q);
        questionNum++;
      }
    }
  }

  return shuffle(questions).map((q, i) => ({ ...q, number: i + 1 }));
}

function pickDistractorsFromPool(
  pool: DistractorVocab[],
  excludeId: string,
  count: number,
  getField: (v: DistractorVocab) => string
): string[] {
  const excludeVal = getField(pool.find((v) => v.id === excludeId)!);
  const candidates = pool.filter((v) => v.id !== excludeId && getField(v) !== excludeVal);
  return shuffle(candidates).slice(0, count).map(getField);
}

function buildLeechQuestion(
  card: LeechCardFull,
  pool: DistractorVocab[],
  type: VocabQuizQuestion["type"],
  number: number
): VocabQuizQuestion | null {
  switch (type) {
    case "fill_in_blank": {
      // Forced recall: show meaning, user types hiragana
      return {
        number,
        type: "fill_in_blank",
        mode: "typing",
        vocabularyId: card.vocabularyId,
        questionText: card.meaningId,
        questionLabel: "Ketik dalam hiragana",
        options: [],
        correctAnswer: card.hiragana,
        audioUrl: card.audioUrl,
        hint: card.romaji,
      };
    }

    case "audio_to_meaning": {
      if (!card.audioUrl) return null;
      const distractors = pickDistractorsFromPool(
        pool,
        card.vocabularyId,
        3,
        (v) => v.meaningId
      );
      if (distractors.length < 3) return null;
      return {
        number,
        type: "audio_to_meaning",
        mode: "multiple_choice",
        vocabularyId: card.vocabularyId,
        questionText: "",
        questionLabel: "Dengarkan dan pilih artinya",
        options: shuffle([card.meaningId, ...distractors]),
        correctAnswer: card.meaningId,
        audioUrl: card.audioUrl,
        hint: getDisplayWord(card),
      };
    }

    case "meaning_to_word": {
      // Show meaning, pick the correct Japanese word
      const distractors = pickDistractorsFromPool(
        pool,
        card.vocabularyId,
        3,
        (v) => getDisplayWord(v)
      );
      if (distractors.length < 3) return null;
      return {
        number,
        type: "meaning_to_word",
        mode: "multiple_choice",
        vocabularyId: card.vocabularyId,
        questionText: card.meaningId,
        questionLabel: "Pilih kata Jepang yang benar",
        options: shuffle([getDisplayWord(card), ...distractors]),
        correctAnswer: getDisplayWord(card),
        audioUrl: card.audioUrl,
        hint: card.romaji,
      };
    }

    default:
      return null;
  }
}
