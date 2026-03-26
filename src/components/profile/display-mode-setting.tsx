"use client";

import { cn } from "@/lib/utils";
import { useDisplayMode } from "@/hooks/use-display-mode";

import type { DisplayMode } from "@/stores/display-mode-store";

interface DisplayModeSettingProps {
  initialMode: DisplayMode;
}

export function DisplayModeSetting({ initialMode }: DisplayModeSettingProps) {
  const { globalMode, toggleGlobal } = useDisplayMode();
  const mode = globalMode || initialMode;

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3.5">
      <div>
        <p className="text-sm font-semibold">Mode Tampilan Default</p>
        <p className="text-xs text-muted-foreground">
          Pilih bagaimana kosakata ditampilkan secara default
        </p>
      </div>
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-0.5">
        <button
          type="button"
          onClick={() => toggleGlobal("kanji")}
          className={cn(
            "rounded-md px-3 py-1.5 font-jp text-sm font-medium transition-colors",
            mode === "kanji"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          漢字
        </button>
        <button
          type="button"
          onClick={() => toggleGlobal("kana")}
          className={cn(
            "rounded-md px-3 py-1.5 font-jp text-sm font-medium transition-colors",
            mode === "kana"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          かな
        </button>
      </div>
    </div>
  );
}
