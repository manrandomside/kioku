"use client";

import Link from "next/link";
import { BookOpen, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ChapterWithProgress } from "@/types/vocabulary";

interface ChapterCardProps {
  chapter: ChapterWithProgress;
}

export function ChapterCard({ chapter }: ChapterCardProps) {
  const hasProgress = chapter.completionPercent > 0;
  const isComplete = chapter.completionPercent >= 100;
  const progressWidth = Math.min(chapter.completionPercent, 100);

  return (
    <Link
      href={`/learn/mnn/${chapter.slug}`}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30",
        isComplete && "border-srs-review/40"
      )}
    >
      {/* Chapter number + vocab count */}
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
          {chapter.chapterNumber}
        </div>
        {chapter.bestQuizScore !== null && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Trophy className="size-3 text-yellow-500" />
            {chapter.bestQuizScore}%
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
              isComplete ? "bg-srs-review" : hasProgress ? "bg-primary" : "bg-transparent"
            )}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <span className="text-right text-[10px] text-muted-foreground">
          {hasProgress ? `${chapter.completionPercent}%` : "Belum dimulai"}
        </span>
      </div>
    </Link>
  );
}
