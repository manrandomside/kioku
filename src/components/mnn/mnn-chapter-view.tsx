"use client";

import { useState, useMemo } from "react";

import { cn } from "@/lib/utils";
import { ChapterCard } from "@/components/mnn/chapter-card";

import type { BookWithChapters } from "@/types/vocabulary";

interface MnnChapterViewProps {
  books: BookWithChapters[];
}

export function MnnChapterView({ books }: MnnChapterViewProps) {
  const [activeBookIndex, setActiveBookIndex] = useState(0);
  const activeBook = books[activeBookIndex];

  const stats = useMemo(() => {
    if (!activeBook) return { total: 0, started: 0, completed: 0, totalVocab: 0, totalMastered: 0 };
    const chapters = activeBook.chapters;
    return {
      total: chapters.length,
      started: chapters.filter((c) => c.vocabMastered > 0).length,
      completed: chapters.filter((c) => c.vocabMastered >= c.vocabCount && c.vocabCount > 0).length,
      totalVocab: chapters.reduce((sum, c) => sum + c.vocabCount, 0),
      totalMastered: chapters.reduce((sum, c) => sum + c.vocabMastered, 0),
    };
  }, [activeBook]);

  if (books.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Belum ada buku tersedia.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
          Minna no Nihongo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Belajar kosakata dari buku Minna no Nihongo
        </p>
      </div>

      {/* Book Toggle */}
      <div className="inline-flex h-9 w-full rounded-lg bg-muted p-0.5 sm:w-auto">
        {books.map((b, idx) => (
          <button
            key={b.id}
            onClick={() => setActiveBookIndex(idx)}
            className={cn(
              "flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all sm:flex-initial",
              activeBookIndex === idx
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {b.slug === "mnn-1" ? "Buku 1 (N5)" : "Buku 2 (N4)"}
          </button>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatItem label="Bab Dikuasai" value={stats.completed} suffix={`/${stats.total}`} />
        <StatItem label="Kata Dikuasai" value={stats.totalMastered} suffix={`/${stats.totalVocab}`} />
        <StatItem label="Dimulai" value={stats.started} />
        <StatItem label="Total Bab" value={stats.total} />
      </div>

      {/* Overall progress bar */}
      {stats.totalVocab > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progres Keseluruhan</span>
            <span className="font-medium">
              {stats.completed}/{stats.total} bab dikuasai · {stats.totalMastered}/{stats.totalVocab} kata dikuasai
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            {stats.totalMastered > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(stats.totalMastered / stats.totalVocab) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Chapter grid */}
      {activeBook && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
          {activeBook.chapters.map((ch) => (
            <ChapterCard key={ch.id} chapter={ch} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-3">
      <span className="text-xl font-bold">
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
