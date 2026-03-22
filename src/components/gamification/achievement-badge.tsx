"use client";

import { motion } from "framer-motion";
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

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

// Map icon name strings to Lucide components
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

export interface AchievementData {
  id: string;
  name: string;
  nameEn: string | null;
  description: string;
  icon: string;
  badgeColor: string | null;
  type: string;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

interface AchievementBadgeProps {
  achievement: AchievementData;
  size?: "sm" | "md" | "lg";
}

export function AchievementBadge({ achievement, size = "md" }: AchievementBadgeProps) {
  const IconComponent = ICON_MAP[achievement.icon] ?? Star;
  const color = achievement.badgeColor ?? "#9CA3AF";

  const sizeClasses = {
    sm: "size-12",
    md: "size-16",
    lg: "size-20",
  };

  const iconSizes = {
    sm: "size-5",
    md: "size-7",
    lg: "size-9",
  };

  const formattedDate = achievement.unlockedAt
    ? new Date(achievement.unlockedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`${sizeClasses[size]} flex items-center justify-center rounded-2xl border-2 transition-all ${
                achievement.isUnlocked
                  ? "shadow-md"
                  : "border-border/50 opacity-40 grayscale"
              }`}
              style={
                achievement.isUnlocked
                  ? {
                      borderColor: color,
                      backgroundColor: `${color}15`,
                    }
                  : undefined
              }
            >
              <IconComponent
                className={iconSizes[size]}
                style={
                  achievement.isUnlocked ? { color } : { color: "#9CA3AF" }
                }
              />
            </div>
            {size !== "sm" && (
              <span
                className={`max-w-[5rem] text-center text-[11px] leading-tight font-medium ${
                  achievement.isUnlocked
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {achievement.name}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-1 py-1">
            <p className="font-semibold">{achievement.name}</p>
            <p className="text-xs opacity-80">{achievement.description}</p>
            <div className="mt-0.5 flex items-center gap-2 text-xs">
              <span>+{achievement.xpReward} XP</span>
              {formattedDate && (
                <span className="opacity-60">Terbuka {formattedDate}</span>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
