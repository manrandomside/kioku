"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const IconComponent = ICON_MAP[achievement.icon?.toLowerCase().trim()] ?? Star;
  const color = achievement.badgeColor ?? "#9CA3AF";
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

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

  // Position popover within viewport
  const positionPopover = useCallback(() => {
    const button = containerRef.current;
    const popover = popoverRef.current;
    if (!button || !popover) return;

    const btnRect = button.getBoundingClientRect();
    const popW = popover.offsetWidth;
    const vw = window.innerWidth;
    const padding = 8;

    // Center popover horizontally on the button
    let left = btnRect.left + btnRect.width / 2 - popW / 2;

    // Clamp to viewport
    if (left < padding) left = padding;
    if (left + popW > vw - padding) left = vw - padding - popW;

    // Position above the button
    const top = btnRect.top - popover.offsetHeight - 8;

    setPopoverStyle({
      position: "fixed",
      left,
      top: top < padding ? btnRect.bottom + 8 : top,
      width: popW,
    });
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    if (!showInfo) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(e.target as Node)
      ) {
        setShowInfo(false);
      }
    }

    document.addEventListener("click", handleClickOutside, true);
    return () => document.removeEventListener("click", handleClickOutside, true);
  }, [showInfo]);

  // Reposition on show and scroll
  useEffect(() => {
    if (!showInfo) return;

    // Use requestAnimationFrame to measure after render
    const raf = requestAnimationFrame(positionPopover);

    window.addEventListener("scroll", positionPopover, true);
    window.addEventListener("resize", positionPopover);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", positionPopover, true);
      window.removeEventListener("resize", positionPopover);
    };
  }, [showInfo, positionPopover]);

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setShowInfo((prev) => !prev)}
          className="flex flex-col items-center gap-1.5"
        >
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
        </button>
      </div>

      {showInfo && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-50 w-48 rounded-lg border border-border bg-popover px-3 py-2.5 text-xs shadow-lg"
          style={popoverStyle}
        >
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{achievement.name}</p>
            {achievement.description && (
              <p className="text-muted-foreground">{achievement.description}</p>
            )}
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-medium text-[#C2E959]">+{achievement.xpReward} XP</span>
              {formattedDate && (
                <span className="text-muted-foreground">Terbuka {formattedDate}</span>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
