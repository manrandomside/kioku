"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakFlameProps {
  streak: number;
  className?: string;
}

// Intensity increases with streak count
function getFlameIntensity(streak: number): { scale: number; glowOpacity: number; speed: number } {
  if (streak <= 0) return { scale: 1, glowOpacity: 0, speed: 0 };
  if (streak <= 3) return { scale: 1.0, glowOpacity: 0.15, speed: 2.5 };
  if (streak <= 7) return { scale: 1.05, glowOpacity: 0.25, speed: 2.0 };
  if (streak <= 14) return { scale: 1.1, glowOpacity: 0.35, speed: 1.5 };
  if (streak <= 30) return { scale: 1.15, glowOpacity: 0.45, speed: 1.2 };
  return { scale: 1.2, glowOpacity: 0.55, speed: 1.0 };
}

export function StreakFlame({ streak, className }: StreakFlameProps) {
  if (streak <= 0) {
    return <Flame className={`size-7 text-muted-foreground ${className ?? ""}`} />;
  }

  const { glowOpacity, speed } = getFlameIntensity(streak);

  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Glow layer */}
      <motion.div
        animate={{
          opacity: [glowOpacity * 0.5, glowOpacity, glowOpacity * 0.5],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full bg-orange-500 blur-md"
      />
      {/* Flame icon with flicker */}
      <motion.div
        animate={{
          scale: [1, 1.08, 0.96, 1.04, 1],
          rotate: [0, -2, 2, -1, 0],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <Flame
          className={`size-7 ${
            streak >= 14
              ? "text-red-500"
              : "text-orange-500"
          }`}
        />
      </motion.div>
    </div>
  );
}
