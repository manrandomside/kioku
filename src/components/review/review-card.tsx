"use client";

import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { playFlipSound } from "@/lib/audio/sound-effects";
import { Button } from "@/components/ui/button";
import { WORD_TYPE_CONFIG, SRS_STATUS_CONFIG } from "@/types/vocabulary";

import type { DueCard } from "@/lib/queries/review";

interface ReviewCardProps {
  card: DueCard;
  isFlipped: boolean;
  onFlip: () => void;
}

export function ReviewCard({ card, isFlipped, onFlip }: ReviewCardProps) {
  const srsConfig = SRS_STATUS_CONFIG[card.status] ?? SRS_STATUS_CONFIG.new;

  function playAudio() {
    const url = card.type === "kana" ? card.kanaAudioUrl : card.vocabAudioUrl;
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(() => {});
    }
  }

  const audioUrl = card.type === "kana" ? card.kanaAudioUrl : card.vocabAudioUrl;

  return (
    <div
      className="mx-auto w-full max-w-sm cursor-pointer"
      style={{ perspective: 1000 }}
      onClick={() => {
        if (!isFlipped) {
          playFlipSound();
          onFlip();
        }
      }}
    >
      <motion.div
        className="relative h-80 w-full sm:h-96"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front Side */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-card shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Type + SRS badge */}
          <div className="mb-6 flex items-center gap-2">
            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {card.type === "kana" ? "Kana" : "Kosakata"}
            </span>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                srsConfig.className
              )}
            >
              {srsConfig.label}
            </span>
          </div>

          {card.type === "kana" ? (
            // Kana front: character large
            <span className="font-jp text-8xl font-medium leading-none text-foreground sm:text-9xl">
              {card.character}
            </span>
          ) : (
            // Vocab front: kanji small + hiragana large (furigana terbalik)
            <>
              {card.kanji && (
                <span className="mb-1 font-jp text-lg text-muted-foreground">
                  {card.kanji}
                </span>
              )}
              <span className="font-jp text-6xl font-medium leading-tight text-foreground sm:text-7xl">
                {card.hiragana}
              </span>
              <span className="mt-3 font-mono text-sm text-muted-foreground">
                {card.romaji}
              </span>
            </>
          )}

          <p className="mt-6 text-sm text-muted-foreground">
            Ketuk untuk membalik
          </p>
        </div>

        {/* Back Side */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto rounded-2xl border bg-card px-6 py-8 shadow-lg"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {card.type === "kana" ? (
            // Kana back: character + romaji
            <>
              <span className="font-jp text-5xl font-medium leading-none text-foreground sm:text-6xl">
                {card.character}
              </span>
              <span className="font-mono text-3xl font-semibold text-primary">
                {card.kanaRomaji}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatKanaCategory(card.kanaCategory)}
              </span>
            </>
          ) : (
            // Vocab back: word + type + meaning + example
            <>
              <div className="flex items-baseline gap-2">
                {card.kanji && (
                  <span className="font-jp text-2xl font-medium text-foreground">
                    {card.kanji}
                  </span>
                )}
                <span
                  className={cn(
                    "font-jp text-foreground",
                    card.kanji ? "text-base text-muted-foreground" : "text-2xl font-medium"
                  )}
                >
                  {card.hiragana}
                </span>
              </div>

              {card.wordType && (
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                    (WORD_TYPE_CONFIG[card.wordType] ?? WORD_TYPE_CONFIG.noun).className
                  )}
                >
                  {(WORD_TYPE_CONFIG[card.wordType] ?? WORD_TYPE_CONFIG.noun).label}
                </span>
              )}

              <span className="text-center text-2xl font-semibold text-primary">
                {card.meaningId}
              </span>
              <span className="text-center text-sm text-muted-foreground">
                {card.meaningEn}
              </span>

              {card.exampleJp && (
                <div className="mt-2 w-full rounded-lg bg-muted/50 px-3 py-2">
                  <p className="font-jp text-center text-xs leading-relaxed text-muted-foreground">
                    {card.exampleJp}
                  </p>
                  {card.exampleId && (
                    <p className="mt-1 text-center text-xs text-muted-foreground/70">
                      {card.exampleId}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            className="mt-2 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              playAudio();
            }}
            disabled={!audioUrl}
          >
            <Volume2 className="size-4" />
            {audioUrl ? "Dengarkan" : "Audio belum tersedia"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  hiragana_basic: "Hiragana Dasar",
  hiragana_dakuten: "Hiragana Dakuten",
  hiragana_combo: "Hiragana Kombinasi",
  katakana_basic: "Katakana Dasar",
  katakana_dakuten: "Katakana Dakuten",
  katakana_combo: "Katakana Kombinasi",
};

function formatKanaCategory(category: string | null): string {
  if (!category) return "";
  return CATEGORY_LABELS[category] ?? category;
}
