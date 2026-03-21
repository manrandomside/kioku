"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { KanaGrid } from "@/components/kana/kana-grid";
import { KanaModal } from "@/components/kana/kana-modal";

import type { KanaWithSrs } from "@/types/kana";

interface HirakataViewProps {
  kanaList: KanaWithSrs[];
}

type Script = "hiragana" | "katakana";
type SubFilter = "basic" | "dakuten" | "combo";

const SUB_FILTER_LABELS: Record<SubFilter, string> = {
  basic: "Dasar",
  dakuten: "Dakuten",
  combo: "Kombinasi",
};

function SrsLegend() {
  const items = [
    { label: "Belum", className: "bg-srs-new" },
    { label: "Belajar", className: "bg-srs-learning" },
    { label: "Hafal", className: "bg-srs-review" },
    { label: "Ulang", className: "bg-srs-relearning" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", item.className)} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

function StatsBar({ kanaList }: { kanaList: KanaWithSrs[] }) {
  const stats = useMemo(() => {
    let newCount = 0;
    let learning = 0;
    let review = 0;
    let relearning = 0;
    for (const k of kanaList) {
      const s = k.srsStatus ?? "new";
      if (s === "new") newCount++;
      else if (s === "learning") learning++;
      else if (s === "review") review++;
      else if (s === "relearning") relearning++;
    }
    return { total: kanaList.length, new: newCount, learning, review, relearning };
  }, [kanaList]);

  const learned = stats.review + stats.learning + stats.relearning;
  const pct = stats.total > 0 ? Math.round((stats.review / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progres</span>
        <span className="font-medium">{learned}/{stats.total} dipelajari ({pct}% hafal)</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {stats.review > 0 && (
          <div
            className="bg-srs-review transition-all"
            style={{ width: `${(stats.review / stats.total) * 100}%` }}
          />
        )}
        {stats.learning > 0 && (
          <div
            className="bg-srs-learning transition-all"
            style={{ width: `${(stats.learning / stats.total) * 100}%` }}
          />
        )}
        {stats.relearning > 0 && (
          <div
            className="bg-srs-relearning transition-all"
            style={{ width: `${(stats.relearning / stats.total) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}

export function HirakataView({ kanaList }: HirakataViewProps) {
  const [script, setScript] = useState<Script>("hiragana");
  const [subFilter, setSubFilter] = useState<SubFilter>("basic");
  const [selectedKana, setSelectedKana] = useState<KanaWithSrs | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filter kana by current script and sub-filter
  const filteredKana = useMemo(() => {
    const category = `${script}_${subFilter}`;
    return kanaList.filter((k) => k.category === category);
  }, [kanaList, script, subFilter]);

  // Stats for current script (all sub-filters)
  const scriptKana = useMemo(() => {
    return kanaList.filter((k) => k.category.startsWith(script));
  }, [kanaList, script]);

  function handleCellClick(kana: KanaWithSrs) {
    setSelectedKana(kana);
    setModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
          HIRAKATA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Belajar Hiragana dan Katakana dengan grid interaktif
        </p>
      </div>

      {/* Script Toggle (Hiragana / Katakana) */}
      <div className="inline-flex h-9 w-full rounded-lg bg-muted p-0.5 sm:w-auto">
        {(["hiragana", "katakana"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setScript(s);
              setSubFilter("basic");
            }}
            className={cn(
              "flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all sm:flex-initial",
              script === s
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s === "hiragana" ? "Hiragana" : "Katakana"}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <StatsBar kanaList={scriptKana} />

      {/* Sub-filter buttons */}
      <div className="flex gap-2">
        {(["basic", "dakuten", "combo"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setSubFilter(f)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              subFilter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {SUB_FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* SRS Legend */}
      <SrsLegend />

      {/* Kana Grid */}
      <KanaGrid
        key={`${script}_${subFilter}`}
        kanaList={filteredKana}
        filter={subFilter}
        onCellClick={handleCellClick}
      />

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/learn/hirakata/flashcard?script=${script}&filter=${subFilter}`}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <BookOpen className="size-4" />
          Mulai Flashcard
        </Link>
        <Link
          href={`/learn/hirakata/quiz?script=${script}&filter=${subFilter}`}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          <HelpCircle className="size-4" />
          Mulai Quiz
        </Link>
      </div>

      {/* Kana Detail Modal */}
      <KanaModal
        kana={selectedKana}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
