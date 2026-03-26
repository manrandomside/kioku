"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Volume2, X } from "lucide-react";
import Link from "next/link";

import { toHiragana } from "wanakana";

import { cn } from "@/lib/utils";
import { playCorrectSound, playIncorrectSound } from "@/lib/audio/sound-effects";
import { playAudio } from "@/lib/audio/play-audio";
import { useAutoPlayAudio } from "@/hooks/use-auto-play-audio";
import { DisplayModeToggle } from "@/components/ui/display-mode-toggle";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { QuizOption } from "@/components/quiz/quiz-option";
import { VocabQuizSummary } from "@/components/quiz/vocab-quiz-summary";
import { XpPopup, useXpPopup } from "@/components/gamification/xp-popup";
import { LevelUpModal } from "@/components/gamification/level-up-modal";
import {
  createVocabQuizSession,
  submitVocabQuizResult,
} from "@/app/(dashboard)/learn/mnn/[chapter]/quiz/actions";

import { buildQuestion, shuffle } from "@/lib/quiz/vocab-quiz-generator";

import type { VocabQuizQuestion, VocabQuizAnswer, VocabQuizResult, VocabQuestionType } from "@/types/vocab-quiz";
import type { VocabularyWithSrs } from "@/types/vocabulary";

const KANJI_QUESTION_TYPES: VocabQuestionType[] = ["kanji_to_hiragana", "hiragana_to_kanji"];
const NON_KANJI_TYPES: VocabQuestionType[] = [
  "meaning_to_word",
  "word_to_meaning",
  "fill_in_blank",
];

interface VocabQuizSessionProps {
  questions: VocabQuizQuestion[];
  chapterId: string;
  chapterSlug: string;
  chapterNumber: number;
  kanjiToHiragana?: Record<string, string>;
  vocabList?: VocabularyWithSrs[];
}

export function VocabQuizSession({
  questions: initialQuestions,
  chapterId,
  chapterSlug,
  chapterNumber,
  kanjiToHiragana = {},
  vocabList = [],
}: VocabQuizSessionProps) {
  const { effectiveMode, toggleLocal } = useDisplayMode();
  const { playIfEnabled } = useAutoPlayAudio();
  const isKanaMode = effectiveMode === "kana";
  const [activeQuestions, setActiveQuestions] = useState<VocabQuizQuestion[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [answers, setAnswers] = useState<VocabQuizAnswer[]>([]);
  const [sessionResult, setSessionResult] = useState<VocabQuizResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime] = useState(() => Date.now());
  const [hearts, setHearts] = useState(3);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const { events: xpEvents, showXp } = useXpPopup();
  const inputRef = useRef<HTMLInputElement>(null);

  const isCompleted = currentIndex >= activeQuestions.length || hearts <= 0;
  const currentQuestion = isCompleted ? null : activeQuestions[currentIndex];
  const progress = (currentIndex / activeQuestions.length) * 100;

  // Kanji/hiragana-specific types should not be affected by kana mode toggle
  const isKanjiHiraganaType =
    currentQuestion?.type === "kanji_to_hiragana" ||
    currentQuestion?.type === "hiragana_to_kanji";

  // Swap kanji→hiragana display in kana mode (skip for kanji↔hiragana question types)
  function toKana(text: string): string {
    if (!isKanaMode || isKanjiHiraganaType) return text;
    return kanjiToHiragana[text] ?? text;
  }

  // Create session on mount
  useEffect(() => {
    createVocabQuizSession(chapterId, activeQuestions.length).then((res) => {
      if (res.success && res.data) {
        setSessionId(res.data.sessionId);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  // Auto-play audio when question appears (Japanese-display types)
  const AUTO_PLAY_TYPES = ["word_to_meaning", "kanji_to_hiragana", "hiragana_to_kanji", "audio_to_word", "audio_to_meaning"];
  useEffect(() => {
    if (currentQuestion?.audioUrl && AUTO_PLAY_TYPES.includes(currentQuestion.type)) {
      playIfEnabled(currentQuestion.audioUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  // Focus input for typing questions
  useEffect(() => {
    if (currentQuestion?.mode === "typing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestion]);

  // Replace kanji questions when switching to kana mode mid-quiz
  useEffect(() => {
    if (!isKanaMode || vocabList.length === 0) return;

    const startIdx = isRevealed ? currentIndex + 1 : currentIndex;

    // Check if there are any kanji questions to replace
    const hasKanjiQuestions = activeQuestions
      .slice(startIdx)
      .some((q) => KANJI_QUESTION_TYPES.includes(q.type));
    if (!hasKanjiQuestions) return;

    // Track vocabulary IDs already used in remaining questions to avoid duplicates
    const usedVocabIds = new Set(
      activeQuestions.slice(startIdx).map((q) => q.vocabularyId)
    );

    setActiveQuestions((prev) => {
      const updated = [...prev];
      for (let i = startIdx; i < updated.length; i++) {
        if (!KANJI_QUESTION_TYPES.includes(updated[i].type)) continue;

        // Generate a replacement non-kanji question
        const replacementType = NON_KANJI_TYPES[Math.floor(Math.random() * NON_KANJI_TYPES.length)];

        // Pick a vocab that ideally is not yet used, otherwise reuse
        const shuffledPool = shuffle(vocabList);
        const targetVocab =
          shuffledPool.find((v) => !usedVocabIds.has(v.id)) ?? shuffledPool[0];

        const replacement = buildQuestion(targetVocab, vocabList, replacementType, updated[i].number);
        if (replacement) {
          updated[i] = replacement;
          usedVocabIds.add(targetVocab.id);
        } else {
          // Fallback: try meaning_to_word
          const fallback = buildQuestion(targetVocab, vocabList, "meaning_to_word", updated[i].number);
          if (fallback) {
            updated[i] = fallback;
            usedVocabIds.add(targetVocab.id);
          }
        }
      }
      return updated;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKanaMode]);

  const recordAnswer = useCallback(
    (userAnswer: string, correct: boolean) => {
      if (!currentQuestion) return;

      if (correct) {
        playCorrectSound();
      } else {
        playIncorrectSound();
        setHearts((prev) => prev - 1);
      }

      // Auto-play correct answer audio after sound effect
      if (currentQuestion.audioUrl) {
        setTimeout(() => {
          playIfEnabled(currentQuestion.audioUrl);
        }, 300);
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
    },
    [currentQuestion, playIfEnabled]
  );

  const handleNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setTypedAnswer("");
    setIsRevealed(false);
    setCurrentIndex((prev) => prev + 1);
  }, []);

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
      playAudio(currentQuestion.audioUrl);
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
    setActiveQuestions(initialQuestions);

    createVocabQuizSession(chapterId, initialQuestions.length).then((res) => {
      if (res.success && res.data) {
        setSessionId(res.data.sessionId);
      }
    });
  }, [chapterId, initialQuestions]);

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
      submitVocabQuizResult(sessionId, answers, timeSpentMs).then((res) => {
        if (res.success && res.data?.xp) {
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
  if (activeQuestions.length === 0) {
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
      {/* Header: Close + Progress + Toggle + Hearts */}
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

        <DisplayModeToggle mode={effectiveMode} onToggle={toggleLocal} />

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
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-8">
              {isAudioOnly ? (
                // Audio-only: big speaker icon
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 sm:size-20"
                >
                  <Volume2 className="size-8 sm:size-10" />
                </button>
              ) : (
                // Text display
                <span
                  className={cn(
                    "text-center leading-tight",
                    isJapaneseDisplay
                      ? "font-jp text-4xl font-medium text-foreground sm:text-5xl md:text-6xl"
                      : "text-xl font-semibold text-primary sm:text-2xl md:text-3xl"
                  )}
                >
                  {isJapaneseDisplay ? toKana(currentQuestion.questionText) : currentQuestion.questionText}
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
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(toHiragana(e.target.value, { IMEMode: true }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmitTyping();
                    }}
                    placeholder="Ketik romaji (contoh: isha → いしゃ)..."
                    disabled={isRevealed}
                    className={cn(
                      "h-12 w-full rounded-xl border-2 px-4 font-jp text-lg outline-none transition-colors placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground sm:h-14 sm:text-xl",
                      isRevealed && selectedAnswer === currentQuestion.correctAnswer
                        ? "border-green-500 bg-green-500/5"
                        : isRevealed
                          ? "border-red-500 bg-red-500/5"
                          : "border-border bg-card focus:border-primary"
                    )}
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Ketik dalam romaji, otomatis berubah ke hiragana
                </p>
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
                    const isCorrect =
                      currentQuestion.mode === "multiple_choice"
                        ? selectedAnswer === currentQuestion.correctAnswer
                        : typedAnswer.trim().toLowerCase() ===
                          currentQuestion.correctAnswer.toLowerCase();
                    const vocabInfo = vocabList.find(
                      (v) => v.id === currentQuestion.vocabularyId
                    );
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
                              <span className="font-bold">
                                {currentQuestion.correctAnswer}
                              </span>
                              {currentQuestion.hint && (
                                <span className="opacity-70">
                                  {" "}
                                  ({currentQuestion.hint})
                                </span>
                              )}
                            </p>
                          )}
                          {vocabInfo && (
                            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm opacity-80">
                              {vocabInfo.kanji && (
                                <span className="font-jp font-medium">
                                  {vocabInfo.kanji}
                                </span>
                              )}
                              <span className="font-jp">
                                {vocabInfo.hiragana}
                              </span>
                              <span>({vocabInfo.romaji})</span>
                              <span>— {vocabInfo.meaningId}</span>
                            </div>
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
