"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, X } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { QuizOption } from "@/components/quiz/quiz-option";
import { VocabQuizSummary } from "@/components/quiz/vocab-quiz-summary";
import {
  createVocabQuizSession,
  submitVocabQuizResult,
} from "@/app/(dashboard)/learn/mnn/[chapter]/quiz/actions";

import type { VocabQuizQuestion, VocabQuizAnswer, VocabQuizResult } from "@/types/vocab-quiz";

interface VocabQuizSessionProps {
  questions: VocabQuizQuestion[];
  chapterId: string;
  chapterSlug: string;
  chapterNumber: number;
}

const FEEDBACK_DELAY_MS = 1400;

export function VocabQuizSession({
  questions,
  chapterId,
  chapterSlug,
  chapterNumber,
}: VocabQuizSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [answers, setAnswers] = useState<VocabQuizAnswer[]>([]);
  const [sessionResult, setSessionResult] = useState<VocabQuizResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime] = useState(() => Date.now());
  const [hearts, setHearts] = useState(3);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCompleted = currentIndex >= questions.length || hearts <= 0;
  const currentQuestion = isCompleted ? null : questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;

  // Create session on mount
  useEffect(() => {
    createVocabQuizSession(chapterId, questions.length).then((res) => {
      if (res.success && res.data) {
        setSessionId(res.data.sessionId);
      }
    });
  }, [chapterId, questions.length]);

  // Auto-play audio for audio question types
  useEffect(() => {
    if (
      currentQuestion?.audioUrl &&
      (currentQuestion.type === "audio_to_word" ||
        currentQuestion.type === "audio_to_meaning" ||
        currentQuestion.type === "word_to_meaning")
    ) {
      const audio = new Audio(currentQuestion.audioUrl);
      audio.play().catch(() => {});
    }
  }, [currentQuestion]);

  // Focus input for typing questions
  useEffect(() => {
    if (currentQuestion?.mode === "typing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestion]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const recordAnswer = useCallback(
    (userAnswer: string, correct: boolean) => {
      if (!currentQuestion) return;

      if (!correct) {
        setHearts((prev) => prev - 1);
      }

      const answer: VocabQuizAnswer = {
        questionNumber: currentQuestion.number,
        questionType: currentQuestion.type,
        vocabularyId: currentQuestion.vocabularyId,
        userAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: correct,
      };
      setAnswers((prev) => [...prev, answer]);

      feedbackTimerRef.current = setTimeout(() => {
        setSelectedAnswer(null);
        setTypedAnswer("");
        setIsRevealed(false);
        setCurrentIndex((prev) => prev + 1);
      }, FEEDBACK_DELAY_MS);
    },
    [currentQuestion]
  );

  const handleSelectAnswer = useCallback(
    (option: string) => {
      if (selectedAnswer || !currentQuestion || isRevealed) return;
      const isCorrect = option === currentQuestion.correctAnswer;
      setSelectedAnswer(option);
      setIsRevealed(true);
      recordAnswer(option, isCorrect);
    },
    [selectedAnswer, currentQuestion, isRevealed, recordAnswer]
  );

  const handleSubmitTyping = useCallback(() => {
    if (!currentQuestion || isRevealed || !typedAnswer.trim()) return;
    const normalized = typedAnswer.trim().toLowerCase();
    const correctNormalized = currentQuestion.correctAnswer.toLowerCase();
    const isCorrect = normalized === correctNormalized;
    setSelectedAnswer(typedAnswer.trim());
    setIsRevealed(true);
    recordAnswer(typedAnswer.trim(), isCorrect);
  }, [currentQuestion, isRevealed, typedAnswer, recordAnswer]);

  const handlePlayAudio = useCallback(() => {
    if (currentQuestion?.audioUrl) {
      const audio = new Audio(currentQuestion.audioUrl);
      audio.play().catch(() => {});
    }
  }, [currentQuestion]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setIsRevealed(false);
    setAnswers([]);
    setSessionResult(null);
    setHearts(3);

    createVocabQuizSession(chapterId, questions.length).then((res) => {
      if (res.success && res.data) {
        setSessionId(res.data.sessionId);
      }
    });
  }, [chapterId, questions.length]);

  // Submit results on completion
  useEffect(() => {
    if (!isCompleted || sessionResult) return;
    if (answers.length === 0) return;

    const timeSpentMs = Date.now() - startTime;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalQuestions = answers.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const isPerfect = correctCount === totalQuestions && hearts > 0;
    const xpEarned = correctCount * 5 + (isPerfect ? 20 : 0);

    const result: VocabQuizResult = {
      totalQuestions,
      correctCount,
      scorePercent,
      xpEarned,
      isPerfect,
      timeSpentMs,
      answers,
    };
    setSessionResult(result);

    if (sessionId) {
      submitVocabQuizResult(sessionId, answers, timeSpentMs);
    }
  }, [isCompleted, sessionResult, answers, startTime, hearts, sessionId]);

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

  // Determine if options should show in Japanese font
  function isOptionJapanese(): boolean {
    if (!currentQuestion) return false;
    return [
      "meaning_to_word",
      "audio_to_word",
      "kanji_to_hiragana",
      "hiragana_to_kanji",
    ].includes(currentQuestion.type);
  }

  // Empty state
  if (questions.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-muted-foreground">
          Tidak cukup kosakata untuk memulai quiz. Minimal 4 kata diperlukan.
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

  // Summary
  if (sessionResult) {
    return (
      <VocabQuizSummary
        result={sessionResult}
        chapterSlug={chapterSlug}
        chapterNumber={chapterNumber}
        onRestart={handleRestart}
      />
    );
  }

  // Determine question display style
  const isAudioOnly =
    currentQuestion?.type === "audio_to_word" ||
    currentQuestion?.type === "audio_to_meaning";
  const isJapaneseDisplay =
    currentQuestion?.type === "word_to_meaning" ||
    currentQuestion?.type === "kanji_to_hiragana" ||
    currentQuestion?.type === "hiragana_to_kanji";

  return (
    <div className="flex flex-col gap-6">
      {/* Header: Close + Progress + Hearts */}
      <div className="flex items-center gap-3">
        <Link
          href={`/learn/mnn/${chapterSlug}`}
          className="flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Tutup quiz"
        >
          <X className="size-5" />
        </Link>

        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.span
              key={i}
              animate={
                i >= hearts
                  ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 0.3 }}
              className={cn(
                "text-lg",
                i < hearts ? "text-red-500" : "text-muted-foreground/30"
              )}
            >
              {i < hearts ? "\u2764" : "\u2661"}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Question Area */}
      {currentQuestion && (
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
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-8 shadow-sm">
              {isAudioOnly ? (
                // Audio-only: big speaker icon
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                >
                  <Volume2 className="size-10" />
                </button>
              ) : (
                // Text display
                <span
                  className={cn(
                    "text-center leading-tight",
                    isJapaneseDisplay
                      ? "font-jp text-5xl font-medium text-foreground sm:text-6xl"
                      : "text-2xl font-semibold text-primary sm:text-3xl"
                  )}
                >
                  {currentQuestion.questionText}
                </span>
              )}

              {/* Audio button (non-audio-only types) */}
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
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options.map((option) => (
                  <QuizOption
                    key={option}
                    label={option}
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
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmitTyping();
                    }}
                    placeholder="Ketik jawaban dalam hiragana..."
                    disabled={isRevealed}
                    className={cn(
                      "h-14 w-full rounded-xl border-2 px-4 font-jp text-xl outline-none transition-colors placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground",
                      isRevealed && selectedAnswer === currentQuestion.correctAnswer
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

            {/* Feedback bar */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    "rounded-xl px-4 py-3 text-center text-sm font-medium",
                    (currentQuestion.mode === "multiple_choice"
                      ? selectedAnswer === currentQuestion.correctAnswer
                      : typedAnswer.trim().toLowerCase() ===
                        currentQuestion.correctAnswer.toLowerCase())
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  )}
                >
                  {(currentQuestion.mode === "multiple_choice"
                    ? selectedAnswer === currentQuestion.correctAnswer
                    : typedAnswer.trim().toLowerCase() ===
                      currentQuestion.correctAnswer.toLowerCase()) ? (
                    "Benar!"
                  ) : (
                    <>
                      Salah! Jawaban yang benar:{" "}
                      <span className="font-bold">{currentQuestion.correctAnswer}</span>
                      {currentQuestion.hint && (
                        <span className="opacity-70"> ({currentQuestion.hint})</span>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
