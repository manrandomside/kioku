"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Trophy, Target, Zap, Clock, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/use-count-up";

import type { VocabQuizResult } from "@/types/vocab-quiz";

interface VocabQuizSummaryProps {
  result: VocabQuizResult;
  chapterSlug: string;
  chapterNumber: number;
  onRestart: () => void;
  jlptUpgrade?: { previousLevel: string; newLevel: string } | null;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatCountedTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getGrade(percent: number): { label: string; color: string; message: string } {
  if (percent === 100) return { label: "S", color: "text-yellow-500", message: "Sempurna! Luar biasa!" };
  if (percent >= 90) return { label: "A", color: "text-green-500", message: "Hebat! Hampir sempurna!" };
  if (percent >= 70) return { label: "B", color: "text-blue-500", message: "Bagus! Terus berlatih!" };
  if (percent >= 50) return { label: "C", color: "text-orange-500", message: "Lumayan, coba lagi!" };
  return { label: "D", color: "text-red-500", message: "Jangan menyerah, ayo ulangi!" };
}

export function VocabQuizSummary({
  result,
  chapterSlug,
  chapterNumber,
  onRestart,
  jlptUpgrade,
}: VocabQuizSummaryProps) {
  const grade = getGrade(result.scorePercent);
  const hasXpData = result.xpEarned > 0;
  const totalSeconds = Math.floor(result.timeSpentMs / 1000);
  const wrongAnswers = result.answers.filter((a) => !a.isCorrect);

  const scoreCount = useCountUp(result.scorePercent, 800, 300);
  const correctCount = useCountUp(result.correctCount, 800, 500);
  const xpCount = useCountUp(hasXpData ? result.xpEarned : 0, 1000, 700);
  const timeCount = useCountUp(totalSeconds, 800, 900);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4">
      {/* Grade Circle */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="flex size-28 items-center justify-center rounded-full border-4 border-primary/20 bg-card shadow-lg">
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
            className={`font-display text-5xl font-bold ${grade.color}`}
          >
            {grade.label}
          </motion.span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Quiz Selesai!
        </h2>
        <p className="text-sm text-muted-foreground">{grade.message}</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid w-full max-w-sm grid-cols-2 gap-3"
      >
        <StatCard
          icon={<Target className="size-5 text-blue-500" />}
          label="Skor"
          value={`${scoreCount}%`}
        />
        <StatCard
          icon={<Trophy className="size-5 text-yellow-500" />}
          label="Benar"
          value={`${correctCount}/${result.totalQuestions}`}
        />
        {hasXpData ? (
          <StatCard
            icon={<Zap className="size-5 text-green-500" />}
            label="XP Diperoleh"
            value={`+${xpCount}`}
          />
        ) : (
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <Zap className="size-5 text-green-500" />
            <div className="flex flex-col gap-1.5">
              <div className="h-5 w-12 animate-pulse rounded bg-muted" />
              <span className="text-xs text-muted-foreground">XP Diperoleh</span>
            </div>
          </div>
        )}
        <StatCard
          icon={<Clock className="size-5 text-purple-500" />}
          label="Waktu"
          value={formatCountedTime(timeCount)}
        />
      </motion.div>

      {/* XP Breakdown */}
      {result.xpBaseXp !== undefined ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="flex w-full max-w-sm flex-col gap-1.5 rounded-lg border bg-card px-4 py-3 text-sm"
        >
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Jawaban benar: {result.correctCount} x 3
            </span>
            <span className="font-medium">{result.xpBaseXp} XP</span>
          </div>
          {result.xpBonusXp !== undefined && result.xpBonusXp > 0 && (
            <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
              <span>Bonus {result.xpBonusLabel}</span>
              <span className="font-medium">+{result.xpBonusXp} XP</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t pt-1.5 font-bold">
            <span>Total</span>
            <span className="text-green-600 dark:text-green-400">{result.xpEarned} XP</span>
          </div>
        </motion.div>
      ) : hasXpData ? null : (
        <div className="flex w-full max-w-sm flex-col gap-2 rounded-lg border bg-card px-4 py-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      )}

      {/* Answer Review */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <p className="mb-3 text-sm font-medium text-muted-foreground">Ringkasan Jawaban</p>
        <div className="flex flex-wrap gap-1.5">
          {result.answers.map((answer) => (
            <div
              key={answer.questionNumber}
              className={`flex size-8 items-center justify-center rounded-lg text-xs font-bold ${
                answer.isCorrect
                  ? "bg-green-500/15 text-green-600 dark:text-green-400"
                  : "bg-red-500/15 text-red-600 dark:text-red-400"
              }`}
              title={`${answer.correctAnswer}: ${answer.isCorrect ? "Benar" : `Jawaban: ${answer.userAnswer}`}`}
            >
              {answer.questionNumber}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Kata yang Perlu Diulang */}
      {wrongAnswers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <p className="mb-3 text-sm font-medium text-red-500">
            Kata yang Perlu Diulang ({wrongAnswers.length})
          </p>
          <div className="flex flex-col gap-2">
            {wrongAnswers.map((answer) => (
              <div
                key={answer.questionNumber}
                className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-jp text-base font-bold">{answer.correctAnswerHiragana || answer.correctAnswer}</span>
                    <span className="text-xs text-muted-foreground">#{answer.questionNumber}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Jawaban kamu: <span className="font-jp text-red-400">{answer.userAnswer}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* JLPT Upgrade Banner */}
      {jlptUpgrade && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="w-full max-w-sm rounded-2xl border-2 border-[#C2E959]/30 bg-gradient-to-b from-[#C2E959]/10 to-transparent p-5 text-center"
        >
          <GraduationCap className="mx-auto size-8 text-[#C2E959]" />
          <p className="mt-2 font-display text-lg font-bold">Level JLPT Naik!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {jlptUpgrade.previousLevel} &rarr; <span className="font-bold text-[#C2E959]">{jlptUpgrade.newLevel}</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Selamat! Semua kosakata {jlptUpgrade.previousLevel} telah dikuasai.
          </p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: wrongAnswers.length > 0 ? 2.0 : 1.7, duration: 0.4 }}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <Button onClick={onRestart} className="h-11 w-full gap-2">
          <RotateCcw className="size-4" />
          Ulangi Quiz
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

function StatCard({
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
