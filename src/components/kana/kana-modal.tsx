"use client";

import { Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { playAudio } from "@/lib/audio/play-audio";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import type { KanaWithSrs } from "@/types/kana";

interface KanaModalProps {
  kana: KanaWithSrs | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SRS_LABEL: Record<string, { label: string; className: string }> = {
  new: { label: "Belum dipelajari", className: "bg-srs-new/15 text-srs-new" },
  learning: { label: "Sedang dipelajari", className: "bg-srs-learning/15 text-srs-learning" },
  review: { label: "Sudah hafal", className: "bg-srs-review/15 text-srs-review" },
  relearning: { label: "Belajar ulang", className: "bg-srs-relearning/15 text-srs-relearning" },
};

const CATEGORY_LABEL: Record<string, string> = {
  hiragana_basic: "Hiragana Dasar",
  hiragana_dakuten: "Hiragana Dakuten",
  hiragana_combo: "Hiragana Kombinasi",
  katakana_basic: "Katakana Dasar",
  katakana_dakuten: "Katakana Dakuten",
  katakana_combo: "Katakana Kombinasi",
};

export function KanaModal({ kana, open, onOpenChange }: KanaModalProps) {
  if (!kana) return null;

  const status = kana.srsStatus ?? "new";
  const srsInfo = SRS_LABEL[status] ?? SRS_LABEL.new;

  function handlePlayAudio() {
    playAudio(kana?.audioUrl);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogTitle className="sr-only">{kana.character}</DialogTitle>
        <DialogDescription className="sr-only">
          Detail karakter {kana.character} ({kana.romaji})
        </DialogDescription>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="flex flex-col items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                srsInfo.className
              )}
            >
              {srsInfo.label}
            </span>
            <span className="font-jp text-7xl font-medium leading-none text-foreground">
              {kana.character}
            </span>
            <span className="font-mono text-xl text-muted-foreground">
              {kana.romaji}
            </span>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            {CATEGORY_LABEL[kana.category] ?? kana.category}
          </div>

          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full gap-2"
            onClick={handlePlayAudio}
            disabled={!kana.audioUrl}
          >
            <Volume2 className="size-4" />
            {kana.audioUrl ? "Dengarkan" : "Audio belum tersedia"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
