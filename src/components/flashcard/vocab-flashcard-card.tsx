"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Volume2, Mic } from "lucide-react";

import { cn } from "@/lib/utils";
import { playFlipSound } from "@/lib/audio/sound-effects";
import { Button } from "@/components/ui/button";
import { WORD_TYPE_CONFIG, SRS_STATUS_CONFIG } from "@/types/vocabulary";
import { PronunciationRecorder } from "@/components/audio/pronunciation-recorder";

import type { VocabularyWithSrs } from "@/types/vocabulary";
import type { DisplayMode } from "@/stores/display-mode-store";

interface VocabFlashcardCardProps {
  vocab: VocabularyWithSrs;
  isFlipped: boolean;
  onFlip: () => void;
  onPronunciationChange?: (open: boolean) => void;
  displayMode?: DisplayMode;
}

export function VocabFlashcardCard({ vocab, isFlipped, onFlip, onPronunciationChange, displayMode = "kanji" }: VocabFlashcardCardProps) {
  const isKanaMode = displayMode === "kana";
  const [showPronunciation, setShowPronunciation] = useState(false);

  function setPronunciationOpen(open: boolean) {
    setShowPronunciation(open);
    onPronunciationChange?.(open);
  }
  const status = vocab.srsStatus ?? "new";
  const srsBadge = SRS_STATUS_CONFIG[status] ?? SRS_STATUS_CONFIG.new;
  const wordConfig = WORD_TYPE_CONFIG[vocab.wordType] ?? WORD_TYPE_CONFIG.noun;

  function playAudio() {
    if (vocab.audioUrl) {
      const audio = new Audio(vocab.audioUrl);
      audio.play().catch(() => {});
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
        className="relative h-80 w-full sm:h-96"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front Side: hiragana besar + kanji kecil di atas (furigana terbalik) */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-card shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* SRS badge */}
          <span
            className={cn(
              "mb-6 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium",
              srsBadge.className
            )}
          >
            {srsBadge.label}
          </span>

          {isKanaMode ? (
            <>
              {/* Kana mode: kanji small above, hiragana large, romaji below */}
              {vocab.kanji && (
                <span className="mb-1 font-jp text-lg text-muted-foreground">
                  {vocab.kanji}
                </span>
              )}
              <span className="font-jp text-6xl font-medium leading-tight text-foreground sm:text-7xl">
                {vocab.hiragana}
              </span>
              <span className="mt-3 font-mono text-sm text-muted-foreground">
                {vocab.romaji}
              </span>
            </>
          ) : (
            <>
              {/* Kanji mode: only kanji large (fallback to hiragana if no kanji) */}
              <span className="font-jp text-6xl font-medium leading-tight text-foreground sm:text-7xl">
                {vocab.kanji || vocab.hiragana}
              </span>
            </>
          )}

          <p className="mt-6 text-sm text-muted-foreground">
            Ketuk untuk membalik
          </p>
        </div>

        {/* Back Side: meaning, word type, example */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto rounded-2xl border bg-card px-6 py-8 shadow-lg"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Word in Japanese (compact) */}
          <div className="flex items-baseline gap-2">
            {vocab.kanji && (
              <span className="font-jp text-2xl font-medium text-foreground">
                {vocab.kanji}
              </span>
            )}
            <span
              className={cn(
                "font-jp text-foreground",
                vocab.kanji ? "text-base text-muted-foreground" : "text-2xl font-medium"
              )}
            >
              {vocab.hiragana}
            </span>
          </div>

          {/* Word type badge */}
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium",
              wordConfig.className
            )}
          >
            {wordConfig.label}
          </span>

          {/* Meaning (large) */}
          <span className="text-center text-2xl font-semibold text-primary">
            {vocab.meaningId}
          </span>

          {/* Example sentence */}
          {vocab.exampleJp && (
            <div className="mt-2 w-full rounded-lg bg-muted/50 px-3 py-2">
              <p className="font-jp text-center text-xs leading-relaxed text-muted-foreground">
                {vocab.exampleJp}
              </p>
              {vocab.exampleId && (
                <p className="mt-1 text-center text-xs text-muted-foreground/70">
                  {vocab.exampleId}
                </p>
              )}
            </div>
          )}

          {/* Audio + Pronunciation buttons */}
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation();
                playAudio();
              }}
              disabled={!vocab.audioUrl}
            >
              <Volume2 className="size-4" />
              {vocab.audioUrl ? "Dengarkan" : "Audio belum tersedia"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation();
                setPronunciationOpen(true);
              }}
              title="Latihan pengucapan"
            >
              <Mic className="size-4" />
              Ucapkan
            </Button>
          </div>
        </div>
      </motion.div>

      <PronunciationRecorder
        target={{
          id: vocab.id,
          type: "vocabulary",
          hiragana: vocab.hiragana,
          kanji: vocab.kanji,
          romaji: vocab.romaji,
          meaning: vocab.meaningId,
          audioUrl: vocab.audioUrl,
        }}
        isOpen={showPronunciation}
        onClose={() => setPronunciationOpen(false)}
      />
    </div>
  );
}
