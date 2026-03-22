"use client";

import { Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { WORD_TYPE_CONFIG, SRS_STATUS_CONFIG } from "@/types/vocabulary";

import type { VocabularyWithSrs } from "@/types/vocabulary";

interface VocabularyItemProps {
  vocab: VocabularyWithSrs;
  showRomaji?: boolean;
}

export function VocabularyItem({ vocab, showRomaji = true }: VocabularyItemProps) {
  const wordConfig = WORD_TYPE_CONFIG[vocab.wordType] ?? WORD_TYPE_CONFIG.noun;
  const srsStatus = vocab.srsStatus ?? "new";
  const srsConfig = SRS_STATUS_CONFIG[srsStatus];

  function playAudio() {
    if (vocab.audioUrl) {
      const audio = new Audio(vocab.audioUrl);
      audio.play().catch(() => {});
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/30 sm:p-4">
      {/* SRS status dot */}
      <div className="mt-1.5 flex flex-col items-center gap-1">
        <span
          className={cn("size-2.5 rounded-full", `bg-srs-${srsStatus}`)}
          title={srsConfig.label}
        />
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Japanese word */}
        <div className="flex flex-wrap items-baseline gap-2">
          {vocab.kanji && (
            <span className="font-jp text-lg font-medium leading-tight text-foreground sm:text-xl">
              {vocab.kanji}
            </span>
          )}
          <span
            className={cn(
              "font-jp leading-tight text-foreground",
              vocab.kanji
                ? "text-sm text-muted-foreground"
                : "text-lg font-medium sm:text-xl"
            )}
          >
            {vocab.hiragana}
          </span>
          {showRomaji && (
            <span className="font-mono text-xs text-muted-foreground">
              {vocab.romaji}
            </span>
          )}
        </div>

        {/* Meaning */}
        <p className="text-sm text-foreground/80">{vocab.meaningId}</p>

        {/* Example sentence */}
        {vocab.exampleJp && (
          <div className="mt-1 rounded-lg bg-muted/50 px-2.5 py-1.5">
            <p className="font-jp text-xs leading-relaxed text-muted-foreground">
              {vocab.exampleJp}
            </p>
            {vocab.exampleId && (
              <p className="mt-0.5 text-xs text-muted-foreground/70">
                {vocab.exampleId}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right side: badges + audio */}
      <div className="flex flex-col items-end gap-2">
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
            wordConfig.className
          )}
        >
          {wordConfig.label}
        </span>
        {vocab.audioUrl && (
          <button
            type="button"
            onClick={playAudio}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Putar audio"
          >
            <Volume2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
