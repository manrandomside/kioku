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
type MasteryFilter = "all" | "not_mastered" | "mastered";

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
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const masteryStats = useMemo(() => {
    const mastered = vocabList.filter((v) => v.isMastered).length;
    return { total: vocabList.length, mastered, notMastered: vocabList.length - mastered };
  }, [vocabList]);

  const masteryPercent = masteryStats.total > 0
    ? Math.round((masteryStats.mastered / masteryStats.total) * 100)
    : 0;

  const filteredVocab = useMemo(() => {
    let result = vocabList;

    // Word type filter
    if (activeTab !== "all") {
      const types = WORD_TYPE_GROUPS[activeTab];
      result = result.filter((v) => types.includes(v.wordType));
    }

    // Mastery filter
    if (masteryFilter === "mastered") {
      result = result.filter((v) => v.isMastered);
    } else if (masteryFilter === "not_mastered") {
      result = result.filter((v) => !v.isMastered);
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
  }, [vocabList, activeTab, masteryFilter, searchQuery]);

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

      {/* Progress Overview — quiz-based */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progres Kosakata</span>
          <span className="font-medium">
            {masteryStats.mastered}/{masteryStats.total} kata dikuasai ({masteryPercent}%)
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          {masteryStats.mastered > 0 && (
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${masteryPercent}%` }}
            />
          )}
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-green-500" />
            Dikuasai ({masteryStats.mastered})
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            Belum dikuasai ({masteryStats.notMastered})
          </div>
        </div>
        <p className="text-xs italic text-muted-foreground/70">
          Kata dikuasai = pernah dijawab benar di Quiz bab ini
        </p>
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
        <span className="font-jp text-sm">{effectiveMode === "kana" ? "\u3042" : "\u6F22"}</span>
        {effectiveMode === "kana"
          ? "Mode Kana \u2014 soal kanji tidak akan muncul di quiz"
          : "Mode Kanji \u2014 termasuk soal baca kanji di quiz"}
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

      {/* Mastery Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { key: "all" as const, label: "Semua" },
          { key: "not_mastered" as const, label: "Belum Dikuasai", count: masteryStats.notMastered },
          { key: "mastered" as const, label: "Dikuasai", count: masteryStats.mastered },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => setMasteryFilter(f.key)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              masteryFilter === f.key
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
            {f.count !== undefined && (
              <span className="ml-1 opacity-60">{f.count}</span>
            )}
          </button>
        ))}
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
