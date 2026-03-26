"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, HelpCircle, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { VocabularyItem } from "@/components/mnn/vocabulary-item";
import { DisplayModeToggle } from "@/components/ui/display-mode-toggle";
import { useDisplayMode } from "@/hooks/use-display-mode";

import type { VocabularyWithSrs, WordType } from "@/types/vocabulary";

interface ChapterDetailViewProps {
  chapterNumber: number;
  chapterSlug: string;
  bookTitle: string;
  jlptLevel: string;
  vocabList: VocabularyWithSrs[];
}

type FilterTab = "all" | "noun" | "verb" | "adjective" | "other";
type SrsFilter = "all" | "new" | "learning" | "review" | "relearning";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "noun", label: "Kata Benda" },
  { key: "verb", label: "Kata Kerja" },
  { key: "adjective", label: "Adjektiva" },
  { key: "other", label: "Lainnya" },
];

const WORD_TYPE_GROUPS: Record<FilterTab, WordType[]> = {
  all: [],
  noun: ["noun"],
  verb: ["verb"],
  adjective: ["i_adjective", "na_adjective"],
  other: ["adverb", "particle", "conjunction", "expression", "counter", "prefix", "suffix", "pronoun", "interjection"],
};

export function ChapterDetailView({
  chapterNumber,
  chapterSlug,
  bookTitle,
  jlptLevel,
  vocabList,
}: ChapterDetailViewProps) {
  const { effectiveMode, toggleLocal } = useDisplayMode();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [srsFilter, setSrsFilter] = useState<SrsFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const srsStats = useMemo(() => {
    let newCount = 0;
    let learning = 0;
    let review = 0;
    let relearning = 0;
    for (const v of vocabList) {
      const s = v.srsStatus ?? "new";
      if (s === "new") newCount++;
      else if (s === "learning") learning++;
      else if (s === "review") review++;
      else if (s === "relearning") relearning++;
    }
    return { total: vocabList.length, new: newCount, learning, review, relearning };
  }, [vocabList]);

  const filteredVocab = useMemo(() => {
    let result = vocabList;

    // Word type filter
    if (activeTab !== "all") {
      const types = WORD_TYPE_GROUPS[activeTab];
      result = result.filter((v) => types.includes(v.wordType));
    }

    // SRS filter
    if (srsFilter !== "all") {
      result = result.filter((v) => (v.srsStatus ?? "new") === srsFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.hiragana.toLowerCase().includes(q) ||
          v.romaji.toLowerCase().includes(q) ||
          v.meaningId.toLowerCase().includes(q) ||
          v.meaningEn.toLowerCase().includes(q) ||
          (v.kanji && v.kanji.toLowerCase().includes(q))
      );
    }

    return result;
  }, [vocabList, activeTab, srsFilter, searchQuery]);

  const learnedCount = srsStats.review + srsStats.learning + srsStats.relearning;
  const masteredPct = srsStats.total > 0 ? Math.round((srsStats.review / srsStats.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/learn/mnn"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke daftar bab
        </Link>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
              Bab {chapterNumber}
            </h1>
            <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {jlptLevel}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{bookTitle}</p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progres Kosakata</span>
          <span className="font-medium">
            {learnedCount}/{srsStats.total} dipelajari ({masteredPct}% hafal)
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          {srsStats.review > 0 && (
            <div
              className="bg-srs-review transition-all"
              style={{ width: `${(srsStats.review / srsStats.total) * 100}%` }}
            />
          )}
          {srsStats.learning > 0 && (
            <div
              className="bg-srs-learning transition-all"
              style={{ width: `${(srsStats.learning / srsStats.total) * 100}%` }}
            />
          )}
          {srsStats.relearning > 0 && (
            <div
              className="bg-srs-relearning transition-all"
              style={{ width: `${(srsStats.relearning / srsStats.total) * 100}%` }}
            />
          )}
        </div>
        {/* SRS legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <SrsLegendItem label="Baru" count={srsStats.new} className="bg-srs-new" />
          <SrsLegendItem label="Belajar" count={srsStats.learning} className="bg-srs-learning" />
          <SrsLegendItem label="Hafal" count={srsStats.review} className="bg-srs-review" />
          <SrsLegendItem label="Ulang" count={srsStats.relearning} className="bg-srs-relearning" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/learn/mnn/${chapterSlug}/flashcard`}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <BookOpen className="size-4" />
          Mulai Flashcard
        </Link>
        <Link
          href={`/learn/mnn/${chapterSlug}/quiz`}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          <HelpCircle className="size-4" />
          Mulai Quiz
        </Link>
      </div>

      {/* Quiz mode info */}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="font-jp text-sm">{effectiveMode === "kana" ? "あ" : "漢"}</span>
        {effectiveMode === "kana"
          ? "Mode Kana — soal kanji tidak akan muncul di quiz"
          : "Mode Kanji — termasuk soal baca kanji di quiz"}
      </p>

      {/* Search + Display Mode Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari kosakata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <DisplayModeToggle mode={effectiveMode} onToggle={toggleLocal} />
      </div>

      {/* Word Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SRS Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "new", "learning", "review", "relearning"] as const).map((f) => {
          const labels: Record<SrsFilter, string> = {
            all: "Semua",
            new: "Baru",
            learning: "Belajar",
            review: "Hafal",
            relearning: "Ulang",
          };
          return (
            <button
              key={f}
              onClick={() => setSrsFilter(f)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                srsFilter === f
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {labels[f]}
              {f !== "all" && (
                <span className="ml-1 opacity-60">
                  {f === "new" ? srsStats.new : f === "learning" ? srsStats.learning : f === "review" ? srsStats.review : srsStats.relearning}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Vocabulary List */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          {filteredVocab.length} kata ditampilkan
        </p>
        {filteredVocab.length === 0 ? (
          <div className="flex min-h-[20vh] items-center justify-center rounded-xl border bg-card">
            <p className="text-sm text-muted-foreground">
              Tidak ada kosakata yang sesuai filter.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredVocab.map((vocab) => (
              <VocabularyItem key={vocab.id} vocab={vocab} displayMode={effectiveMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SrsLegendItem({ label, count, className }: { label: string; count: number; className: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-full", className)} />
      {label} ({count})
    </div>
  );
}
