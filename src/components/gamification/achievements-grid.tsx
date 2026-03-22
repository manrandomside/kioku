"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import {
  AchievementBadge,
  type AchievementData,
} from "@/components/gamification/achievement-badge";

const CATEGORIES = [
  { value: "all", label: "Semua" },
  { value: "streak", label: "Streak" },
  { value: "words_learned", label: "Kosakata" },
  { value: "quiz_score", label: "Quiz" },
  { value: "quiz_speed", label: "Kecepatan" },
  { value: "chapter_complete", label: "Bab" },
  { value: "level", label: "Level" },
  { value: "review_count", label: "Review" },
  { value: "special", label: "Spesial" },
] as const;

interface AchievementsGridProps {
  achievements: AchievementData[];
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? achievements
      : achievements.filter((a) => a.type === activeCategory);

  const unlockedInCategory = filtered.filter((a) => a.isUnlocked).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Category filter */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value;
          const categoryCount =
            cat.value === "all"
              ? achievements.length
              : achievements.filter((a) => a.type === cat.value).length;

          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {cat.label}
              <span className="ml-1 opacity-60">({categoryCount})</span>
            </button>
          );
        })}
      </div>

      {/* Category stats */}
      {activeCategory !== "all" && (
        <p className="text-sm text-muted-foreground">
          {unlockedInCategory}/{filtered.length} terbuka
        </p>
      )}

      {/* Badge grid */}
      <motion.div
        layout
        className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 sm:gap-4"
      >
        {filtered.map((ach) => (
          <motion.div
            key={ach.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <AchievementBadge achievement={ach} />
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          Belum ada achievement di kategori ini.
        </div>
      )}
    </div>
  );
}
