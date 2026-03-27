"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Volume2, X } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { playCorrectSound, playIncorrectSound } from "@/lib/audio/sound-effects";
import { QuizOption } from "@/components/quiz/quiz-option";
import { QuizSummary } from "@/components/quiz/quiz-summary";
import { XpPopup, useXpPopup } from "@/components/gamification/xp-popup";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import { createQuizSession, submitQuizResult } from "@/app/(dashboard)/learn/hirakata/quiz/actions";

import type { QuizQuestion, QuizAnswer, QuizSessionResult } from "@/types/quiz";

interface KanaQuizSessionProps {
  questions: QuizQuestion[];
  script: string;
  filter: string;
  category: string;
}

const FEEDBACK_DELAY_MS = 1200;

export function KanaQuizSession({ questions, script, filter, category }: KanaQuizSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [sessionResult, setSessionResult] = useState<QuizSessionResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime] = useState(() => Date.now());
  const [hearts, setHearts] = useState(3);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const { events: xpEvents, showXp } = useXpPopup();
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCompleted = currentIndex >= questions.length || hearts <= 0;
  const currentQuestion = isCompleted ? null : questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;

  // Create quiz session on mount
  useEffect(() => {
    createQuizSession(category, questions.length).then((res) => {
      if (res.success && res.data) {
        setSessionId(res.data.sessionId);
      }
    });
  }, [category, questions.length]);

  // Auto-play audio for word_to_meaning questions (showing kana character)
  useEffect(() => {
    if (currentQuestion?.audioUrl && currentQuestion.type === "word_to_meaning") {
      const audio = new Audio(currentQuestion.audioUrl);
      audio.play().catch(() => {});
    }
  }, [currentQuestion]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const handleSelectAnswer = useCallback(
    (option: string) => {
      if (selectedAnswer || !currentQuestion) return;

      const isCorrect = option === currentQuestion.correctAnswer;
      setSelectedAnswer(option);
      setIsRevealed(true);

      if (isCorrect) {
        playCorrectSound();
      } else {
        playIncorrectSound();
        setHearts((prev) => prev - 1);
      }

      const answer: QuizAnswer = {
        questionNumber: currentQuestion.number,
        questionType: currentQuestion.type,
        kanaId: currentQuestion.kanaId,
        userAnswer: option,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect,
      };
      setAnswers((prev) => [...prev, answer]);

      // Auto-advance after feedback
      feedbackTimerRef.current = setTimeout(() => {
        setSelectedAnswer(null);
        setIsRevealed(false);
        setCurrentIndex((prev) => prev + 1);
      }, FEEDBACK_DELAY_MS);
    },
    [selectedAnswer, currentQuestion]
  );

  const handlePlayAudio = useCallback(() => {
    if (currentQuestion?.audioUrl) {
      const audio = new Audio(currentQuestion.audioUrl);
      audio.play().catch(() => {});
    }
  }, [currentQuestion]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setAnswers([]);
    setSessionResult(null);
    setHearts(3);

    // Create new session
    createQuizSession(category, questions.length).then((res) => {
      if (res.success && res.data) {
        setSessionId(res.data.sessionId);
      }
    });
  }, [category, questions.length]);

  // Submit results when quiz completes
  useEffect(() => {
    if (!isCompleted || sessionResult) return;
    if (answers.length === 0) return;

    const timeSpentMs = Date.now() - startTime;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalQuestions = answers.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const isPerfect = correctCount === totalQuestions && hearts > 0;

    const result: QuizSessionResult = {
      totalQuestions,
      correctCount,
      scorePercent,
      xpEarned: 0,
      isPerfect,
      timeSpentMs,
      answers,
    };
    setSessionResult(result);

    if (sessionId) {
      submitQuizResult(sessionId, answers, timeSpentMs).then((res) => {
        if (res.success && res.data?.xp) {
          setSessionResult((prev) =>
            prev ? {
              ...prev,
              xpEarned: res.data!.xp!.awarded,
              xpBaseXp: res.data!.xp!.baseXp,
              xpBonusXp: res.data!.xp!.bonusXp,
              xpBonusLabel: res.data!.xp!.bonusLabel,
            } : prev
          );
          if (res.data.xp.awarded > 0) {
            showXp(res.data.xp.awarded);
          }
          if (res.data.xp.leveledUp) {
            setLevelUpLevel(res.data.xp.currentLevel);
          }
        }
      });
    }
  }, [isCompleted, sessionResult, answers, startTime, hearts, sessionId, showXp]);

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

  if (questions.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-muted-foreground">
          Tidak cukup karakter kana untuk memulai quiz. Minimal 4 karakter diperlukan.
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

  if (sessionResult) {
    return (
      <>
        <QuizSummary
          result={sessionResult}
          script={script}
          filter={filter}
          onRestart={handleRestart}
        />
        <XpPopup events={xpEvents} />
        <LevelUpModal
          level={levelUpLevel}
          onDismiss={() => setLevelUpLevel(null)}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header: Close + Progress + Hearts */}
      <div className="flex items-center gap-3">
        <Link
          href="/learn/hirakata"
          className="flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Tutup quiz"
        >
          <X className="size-5" />
        </Link>

        {/* Progress bar */}
        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Hearts */}
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
              {currentQuestion.type === "meaning_to_word"
                ? "Pilih karakter yang benar"
                : "Pilih romaji yang benar"}
            </p>

            {/* Question display */}
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-8">
              <span
                className={cn(
                  "leading-none",
                  currentQuestion.type === "meaning_to_word"
                    ? "font-mono text-3xl font-bold text-primary sm:text-4xl md:text-5xl"
                    : "font-jp text-5xl font-medium text-foreground sm:text-6xl md:text-7xl"
                )}
              >
                {currentQuestion.questionText}
              </span>
              {currentQuestion.audioUrl && (
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

            {/* Options */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              {currentQuestion.options.map((option) => (
                <QuizOption
                  key={option}
                  label={option}
                  state={getOptionState(option)}
                  isJapanese={currentQuestion.type === "meaning_to_word"}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={isRevealed}
                />
              ))}
            </div>

            {/* Feedback bar */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    "rounded-xl px-4 py-3 text-center text-sm font-medium",
                    selectedAnswer === currentQuestion.correctAnswer
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  )}
                >
                  {selectedAnswer === currentQuestion.correctAnswer ? (
                    "Benar!"
                  ) : (
                    <>
                      Salah! Jawaban yang benar:{" "}
                      <span className="font-bold">{currentQuestion.correctAnswer}</span>
                      {" "}({currentQuestion.type === "meaning_to_word"
                        ? currentQuestion.romaji
                        : currentQuestion.character})
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
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
