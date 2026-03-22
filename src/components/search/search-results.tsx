"use client";

import Link from "next/link";
import { Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { WORD_TYPE_CONFIG } from "@/types/vocabulary";

import type { VocabularySearchResult } from "@/types/vocabulary";

interface SearchResultsProps {
  results: VocabularySearchResult[];
  query: string;
  isLoading: boolean;
  onClose?: () => void;
}

export function SearchResults({ results, query, isLoading, onClose }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl bg-muted/50 p-3">
            <div className="h-10 w-16 rounded-lg bg-muted" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (query && results.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Tidak ada hasil untuk &ldquo;{query}&rdquo;
        </p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Ketik untuk mencari kosakata...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {results.map((vocab) => (
        <SearchResultItem
          key={vocab.id}
          vocab={vocab}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

function SearchResultItem({
  vocab,
  onClose,
}: {
  vocab: VocabularySearchResult;
  onClose?: () => void;
}) {
  const wordConfig = WORD_TYPE_CONFIG[vocab.wordType] ?? WORD_TYPE_CONFIG.noun;

  function playAudio(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (vocab.audioUrl) {
      const audio = new Audio(vocab.audioUrl);
      audio.play().catch(() => {});
    }
  }

  return (
    <Link
      href={`/learn/mnn/${vocab.chapterSlug}`}
      onClick={onClose}
      className="flex items-center gap-3 border-b border-border/30 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50"
    >
      {/* Japanese display */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline gap-2">
          {vocab.kanji && (
            <span className="font-jp text-base font-medium text-foreground">
              {vocab.kanji}
            </span>
          )}
          <span
            className={cn(
              "font-jp text-foreground",
              vocab.kanji
                ? "text-xs text-muted-foreground"
                : "text-base font-medium"
            )}
          >
            {vocab.hiragana}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {vocab.romaji}
          </span>
        </div>
        <p className="truncate text-sm text-foreground/80">{vocab.meaningId}</p>
      </div>

      {/* Badges + audio */}
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
            wordConfig.className
          )}
        >
          {wordConfig.label}
        </span>
        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Bab {vocab.chapterNumber}
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
    </Link>
  );
}
