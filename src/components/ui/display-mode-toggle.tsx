"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import type { DisplayMode } from "@/stores/display-mode-store";

interface DisplayModeToggleProps {
  mode: DisplayMode;
  onToggle: (newMode: DisplayMode) => void;
  size?: "sm" | "md";
}

export function DisplayModeToggle({ mode, onToggle, size = "sm" }: DisplayModeToggleProps) {
  const isKanji = mode === "kanji";

  function handleToggle() {
    onToggle(isKanji ? "kana" : "kanji");
  }

  const sizeClasses = size === "sm"
    ? "h-8 text-xs gap-0.5 px-0.5"
    : "h-9 text-sm gap-1 px-1";

  const buttonSize = size === "sm" ? "px-2 py-1" : "px-3 py-1.5";

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "relative inline-flex items-center rounded-lg border bg-muted/50 transition-colors",
        sizeClasses
      )}
      title={isKanji ? "Tampilan Kanji" : "Tampilan Kana"}
    >
      <span
        className={cn(
          "relative z-10 rounded-md font-jp font-medium transition-colors",
          buttonSize,
          isKanji ? "text-primary-foreground" : "text-muted-foreground"
        )}
      >
        漢
      </span>
      <span
        className={cn(
          "relative z-10 rounded-md font-jp font-medium transition-colors",
          buttonSize,
          !isKanji ? "text-primary-foreground" : "text-muted-foreground"
        )}
      >
        あ
      </span>

      {/* Sliding background */}
      <motion.div
        className="absolute inset-y-0.5 rounded-md bg-primary"
        initial={false}
        animate={{
          left: isKanji ? "2px" : "50%",
          right: isKanji ? "50%" : "2px",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    </button>
  );
}
