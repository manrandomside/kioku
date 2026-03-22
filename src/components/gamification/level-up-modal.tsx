"use client";

import { useEffect, useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Zap } from "lucide-react";

import { playLevelUpSound } from "@/lib/audio/sound-effects";

interface LevelUpModalProps {
  level: number | null;
  onDismiss: () => void;
}

export function LevelUpModal({ level, onDismiss }: LevelUpModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (level === null) {
      setVisible(false);
      return;
    }
    setVisible(true);
    playLevelUpSound();

    // Fire confetti burst
    const duration = 1500;
    const end = Date.now() + duration;

    function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#C2E959", "#248288", "#A6E2AC", "#FBBF24"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#C2E959", "#248288", "#A6E2AC", "#FBBF24"],
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }
    frame();

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [level, onDismiss]);

  const handleClick = useCallback(() => {
    setVisible(false);
    onDismiss();
  }, [onDismiss]);

  return (
    <AnimatePresence>
      {visible && level !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClick}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-[#C2E959]/30 bg-card p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(194,233,89,0)",
                  "0 0 30px 10px rgba(194,233,89,0.3)",
                  "0 0 0 0 rgba(194,233,89,0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#248288] to-[#C2E959]"
            >
              <Zap className="size-10 text-white" />
            </motion.div>

            <div className="text-center">
              <p className="text-sm font-medium text-[#C2E959]">Level Up!</p>
              <p className="font-display text-3xl font-bold tracking-tight">
                Level {level}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Terus belajar untuk naik level!
              </p>
            </div>

            <button
              onClick={handleClick}
              className="rounded-lg bg-[#248288] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#248288]/80"
            >
              Lanjutkan
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
