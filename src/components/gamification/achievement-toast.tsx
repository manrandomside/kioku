"use client";

import { toast } from "sonner";
import {
  Flame,
  FlameKindling,
  Crown,
  Trophy,
  Footprints,
  BookOpen,
  BookText,
  Library,
  GraduationCap,
  Sparkles,
  CircleHelp,
  Star,
  Stars,
  Award,
  Brain,
  Timer,
  Zap,
  Bolt,
  BookmarkCheck,
  BookMarked,
  PartyPopper,
  BadgeCheck,
  ArrowUpCircle,
  Shield,
  Gem,
  RotateCcw,
  Repeat,
  Infinity,
  Languages,
  ScrollText,
  Sunrise,
  Moon,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";

import type { UnlockedAchievement } from "@/lib/gamification/achievement-service";

const ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  "flame-kindling": FlameKindling,
  crown: Crown,
  trophy: Trophy,
  footprints: Footprints,
  "book-open": BookOpen,
  "book-text": BookText,
  library: Library,
  "graduation-cap": GraduationCap,
  sparkles: Sparkles,
  "circle-help": CircleHelp,
  star: Star,
  stars: Stars,
  award: Award,
  brain: Brain,
  timer: Timer,
  zap: Zap,
  bolt: Bolt,
  "bookmark-check": BookmarkCheck,
  "book-marked": BookMarked,
  "party-popper": PartyPopper,
  "badge-check": BadgeCheck,
  "arrow-up-circle": ArrowUpCircle,
  shield: Shield,
  gem: Gem,
  "rotate-ccw": RotateCcw,
  repeat: Repeat,
  infinity: Infinity,
  languages: Languages,
  "scroll-text": ScrollText,
  sunrise: Sunrise,
  moon: Moon,
  "calendar-check": CalendarCheck,
};

export function showAchievementToast(achievement: UnlockedAchievement) {
  const IconComponent = ICON_MAP[achievement.icon] ?? Star;
  const color = achievement.badgeColor ?? "#C2E959";

  toast.custom(
    () => (
      <div className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-lg">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2"
          style={{
            borderColor: color,
            backgroundColor: `${color}15`,
          }}
        >
          <IconComponent className="size-6" style={{ color }} />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Achievement Terbuka!
          </p>
          <p className="font-bold leading-tight">{achievement.name}</p>
          <p className="text-xs text-muted-foreground">
            {achievement.description}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-success">
            +{achievement.xpReward} XP
          </p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: "bottom-center",
    }
  );
}

// Show toasts for multiple achievements with staggered timing
export function showAchievementToasts(achievements: UnlockedAchievement[]) {
  achievements.forEach((ach, index) => {
    setTimeout(() => {
      showAchievementToast(ach);
    }, index * 800);
  });
}
