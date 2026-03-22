"use client";

import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { playFlipSound } from "@/lib/audio/sound-effects";
import { Button } from "@/components/ui/button";

import type { KanaWithSrs } from "@/types/kana";

interface FlashcardCardProps {
  kana: KanaWithSrs;
  isFlipped: boolean;
  onFlip: () => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  hiragana_basic: "Hiragana Dasar",
  hiragana_dakuten: "Hiragana Dakuten",
  hiragana_combo: "Hiragana Kombinasi",
  katakana_basic: "Katakana Dasar",
  katakana_dakuten: "Katakana Dakuten",
  katakana_combo: "Katakana Kombinasi",
};

const SRS_BADGE: Record<string, { label: string; className: string }> = {
  new: { label: "Baru", className: "bg-srs-new/15 text-srs-new" },
  learning: { label: "Belajar", className: "bg-srs-learning/15 text-srs-learning" },
  review: { label: "Hafal", className: "bg-srs-review/15 text-srs-review" },
  relearning: { label: "Ulang", className: "bg-srs-relearning/15 text-srs-relearning" },
};

export function FlashcardCard({ kana, isFlipped, onFlip }: FlashcardCardProps) {
  const status = kana.srsStatus ?? "new";
  const badge = SRS_BADGE[status] ?? SRS_BADGE.new;

  function playAudio() {
    if (kana.audioUrl) {
      const audio = new Audio(kana.audioUrl);
      audio.play();
    }
  }

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
        className="relative h-80 w-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front Side */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-card shadow-lg",
            "backface-hidden"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <span
            className={cn(
              "mb-4 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium",
              badge.className
            )}
          >
            {badge.label}
          </span>
          <span className="font-jp text-8xl font-medium leading-none text-foreground sm:text-9xl">
            {kana.character}
          </span>
          <p className="mt-6 text-sm text-muted-foreground">
            Ketuk untuk membalik
          </p>
        </div>

        {/* Back Side */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card px-6 shadow-lg"
          )}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <span className="font-jp text-5xl font-medium leading-none text-foreground sm:text-6xl">
            {kana.character}
          </span>
          <span className="font-mono text-3xl font-semibold text-primary">
            {kana.romaji}
          </span>
          <span className="text-sm text-muted-foreground">
            {CATEGORY_LABEL[kana.category] ?? kana.category}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              playAudio();
            }}
            disabled={!kana.audioUrl}
          >
            <Volume2 className="size-4" />
            {kana.audioUrl ? "Dengarkan" : "Audio belum tersedia"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
