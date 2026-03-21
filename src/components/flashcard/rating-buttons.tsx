"use client";

import { cn } from "@/lib/utils";

import type { SrsRating, SchedulingPreview } from "@/types/flashcard";

interface RatingButtonsProps {
  previews: SchedulingPreview[];
  onRate: (rating: SrsRating) => void;
  disabled: boolean;
}

const RATING_CONFIG: Record<
  SrsRating,
  { label: string; className: string; activeClassName: string }
> = {
  again: {
    label: "Lagi",
    className: "border-red-500/30 text-red-500 hover:bg-red-500/10",
    activeClassName: "bg-red-500 text-white",
  },
  hard: {
    label: "Sulit",
    className: "border-orange-500/30 text-orange-500 hover:bg-orange-500/10",
    activeClassName: "bg-orange-500 text-white",
  },
  good: {
    label: "Baik",
    className: "border-green-500/30 text-green-500 hover:bg-green-500/10",
    activeClassName: "bg-green-500 text-white",
  },
  easy: {
    label: "Mudah",
    className: "border-teal-500/30 text-teal-500 hover:bg-teal-500/10",
    activeClassName: "bg-teal-500 text-white",
  },
};

export function RatingButtons({ previews, onRate, disabled }: RatingButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {previews.map((preview) => {
        const config = RATING_CONFIG[preview.rating];
        return (
          <button
            key={preview.rating}
            onClick={() => onRate(preview.rating)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-sm font-medium transition-all",
              "focus-visible:ring-2 focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "active:scale-95",
              config.className
            )}
          >
            <span className="text-xs font-normal opacity-70">
              {preview.intervalLabel}
            </span>
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
