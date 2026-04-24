"use client";

import dynamic from "next/dynamic";
import { CalendarDays } from "lucide-react";

// Lazy-load the heatmap — it's below the fold, fetches data via API on mount,
// and relies on window/MutationObserver so there is no useful SSR output anyway.
export const ActivityHeatmap = dynamic(
  () => import("./activity-heatmap").then((m) => m.ActivityHeatmap),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-border/50 bg-card p-3 sm:p-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4.5 text-[#248288]" />
          <h3 className="text-sm font-semibold">Aktivitas Belajar</h3>
        </div>
        <div className="mt-4 flex h-[140px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    ),
  }
);
