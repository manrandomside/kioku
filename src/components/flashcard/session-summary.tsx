"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { SessionSummary } from "@/types/flashcard";

interface SessionSummaryProps {
  summary: SessionSummary;
  script: string;
  filter: string;
  onRestart: () => void;
}

export function FlashcardSummary({
  summary,
  script,
  filter,
  onRestart,
}: SessionSummaryProps) {
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid w-full max-w-xs grid-cols-3 gap-4"
      >
        <StatCard label="Total" value={summary.totalReviewed} color="text-foreground" />
        <StatCard label="Baru" value={summary.newLearned} color="text-srs-learning" />
        <StatCard label="Lupa" value={summary.lapses} color="text-red-500" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex w-full max-w-xs flex-col gap-3"
      >
        <Button onClick={onRestart} className="h-11 w-full gap-2">
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

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-4">
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
