"use client";

import { X, Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface FlashcardRatingButtonsProps {
  onNotUnderstood: () => void;
  onUnderstood: () => void;
  disabled: boolean;
}

export function FlashcardRatingButtons({
  onNotUnderstood,
  onUnderstood,
  disabled,
}: FlashcardRatingButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onNotUnderstood}
        disabled={disabled}
        className={cn(
          "flex h-14 items-center justify-center gap-2 rounded-xl border-2 text-base font-bold transition-all",
          "border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20",
          "active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <X className="size-5" />
        Belum Paham
      </button>
      <button
        type="button"
        onClick={onUnderstood}
        disabled={disabled}
        className={cn(
          "flex h-14 items-center justify-center gap-2 rounded-xl border-2 text-base font-bold transition-all",
          "border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500/20",
          "active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <Check className="size-5" />
        Sudah Paham
      </button>
    </div>
  );
}
