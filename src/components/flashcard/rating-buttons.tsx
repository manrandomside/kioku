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
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {previews.map((preview) => {
        const config = RATING_CONFIG[preview.rating];
        return (
          <button
            key={preview.rating}
            onClick={() => onRate(preview.rating)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl border px-1.5 py-3 text-sm font-medium transition-all sm:gap-1 sm:px-2",
              "focus-visible:ring-2 focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "active:scale-95",
              config.className
            )}
          >
            <span className="text-[10px] font-normal opacity-70 sm:text-xs">
              {preview.intervalLabel}
            </span>
            <span className="text-xs sm:text-sm">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
