"use client";

import { cn } from "@/lib/utils";
import { playAudio } from "@/lib/audio/play-audio";

import type { KanaWithSrs } from "@/types/kana";

interface KanaCellProps {
  kana: KanaWithSrs;
  onClick: (kana: KanaWithSrs) => void;
}

const SRS_STYLES = {
  new: "border-srs-new/30 bg-srs-new/5 text-muted-foreground",
  learning: "border-srs-learning/40 bg-srs-learning/10 text-srs-learning ring-srs-learning/20",
  review: "border-srs-review/40 bg-srs-review/10 text-srs-review ring-srs-review/20",
  relearning: "border-srs-relearning/40 bg-srs-relearning/10 text-srs-relearning ring-srs-relearning/20",
} as const;

export function KanaCell({ kana, onClick }: KanaCellProps) {
  const status = kana.srsStatus ?? "new";
  const statusStyle = SRS_STYLES[status] ?? SRS_STYLES.new;

  return (
    <button
      onClick={() => {
        playAudio(kana.audioUrl);
        onClick(kana);
      }}
      className={cn(
        "group relative flex flex-col items-center justify-center rounded-xl border p-1.5 transition-all",
        "hover:scale-105 hover:shadow-md active:scale-95",
        "focus-visible:ring-2 focus-visible:outline-none",
        "aspect-square min-h-[44px] min-w-[44px] sm:min-h-[52px] sm:min-w-[52px]",
        statusStyle
      )}
    >
      <span className="font-jp text-lg font-medium leading-none sm:text-xl">
        {kana.character}
      </span>
      <span className="mt-0.5 font-mono text-[9px] leading-none text-muted-foreground opacity-70 sm:text-[10px]">
        {kana.romaji}
      </span>
    </button>
  );
}

export function KanaEmptyCell() {
  return <div className="aspect-square min-h-[44px] min-w-[44px] sm:min-h-[52px] sm:min-w-[52px]" />;
}
