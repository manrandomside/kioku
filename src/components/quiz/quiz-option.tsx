"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type OptionState = "idle" | "selected-correct" | "selected-wrong" | "reveal-correct" | "disabled";

interface QuizOptionProps {
  label: string;
  state: OptionState;
  isJapanese: boolean;
  onClick: () => void;
  disabled: boolean;
}

const shakeVariants = {
  idle: { x: 0 },
  wrong: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.4 },
  },
};

export function QuizOption({ label, state, isJapanese, onClick, disabled }: QuizOptionProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      variants={shakeVariants}
      animate={state === "selected-wrong" ? "wrong" : "idle"}
      className={cn(
        "relative w-full rounded-xl border-2 px-5 py-4 text-left font-medium transition-colors",
        isJapanese ? "font-jp text-2xl" : "font-mono text-lg",
        state === "idle" &&
          "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5",
        state === "selected-correct" &&
          "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
        state === "selected-wrong" &&
          "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400",
        state === "reveal-correct" &&
          "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
        state === "disabled" &&
          "border-border/50 bg-muted/30 text-muted-foreground opacity-60"
      )}
    >
      {label}
      {(state === "selected-correct" || state === "reveal-correct") && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
        >
          <CorrectIcon />
        </motion.span>
      )}
      {state === "selected-wrong" && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"
        >
          <WrongIcon />
        </motion.span>
      )}
    </motion.button>
  );
}

function CorrectIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WrongIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
