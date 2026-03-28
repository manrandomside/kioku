"use client";

import Link from "next/link";
import { BookOpen, Check } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ChapterWithProgress } from "@/types/vocabulary";

interface ChapterCardProps {
  chapter: ChapterWithProgress;
}

export function ChapterCard({ chapter }: ChapterCardProps) {
  const hasProgress = chapter.vocabMastered > 0;
  const isComplete = chapter.vocabMastered >= chapter.vocabCount && chapter.vocabCount > 0;
  const masteryPercent = chapter.vocabCount > 0
    ? Math.round((chapter.vocabMastered / chapter.vocabCount) * 100)
    : 0;

  return (
    <Link
      href={`/learn/mnn/${chapter.slug}`}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30",
        isComplete && "border-green-500/40 bg-green-500/5"
      )}
    >
      {/* Chapter number + mastery badge */}
      <div className="flex items-start justify-between">
        <div className={cn(
          "flex size-10 items-center justify-center rounded-lg font-mono text-sm font-bold",
          isComplete
            ? "bg-green-500/15 text-green-600 dark:text-green-400"
            : "bg-primary/10 text-primary"
        )}>
          {chapter.chapterNumber}
        </div>
        {isComplete && (
          <div className="flex size-5 items-center justify-center rounded-full bg-green-500">
            <Check className="size-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <h3 className="text-sm font-medium leading-tight">
          Bab {chapter.chapterNumber}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <BookOpen className="size-3" />
          {chapter.vocabCount} kata
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isComplete ? "bg-green-500" : hasProgress ? "bg-primary" : "bg-transparent"
            )}
            style={{ width: `${masteryPercent}%` }}
          />
        </div>
        <span className="text-right text-[10px] text-muted-foreground">
          {isComplete
            ? "Dikuasai"
            : hasProgress
              ? `${chapter.vocabMastered}/${chapter.vocabCount} dikuasai`
              : "Belum dimulai"}
        </span>
      </div>
    </Link>
  );
}
