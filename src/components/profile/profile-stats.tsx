"use client";

import {
  Zap,
  Star,
  Flame,
  BookOpen,
  Target,
  Percent,
  CalendarDays,
  RotateCcw,
  CalendarPlus,
} from "lucide-react";

interface ProfileStatsProps {
  stats: {
    totalXp: number;
    currentLevel: number;
    currentStreak: number;
    longestStreak: number;
    xpInLevel: number;
    xpForNextLevel: number;
    wordsLearned: number;
    quizCompleted: number;
    quizAccuracy: number;
    daysActive: number;
    totalReviews: number;
    joinedAt: string;
  };
}

const ID_MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function formatDate(isoString: string): string {
  try {
    if (!isoString || isoString === "now()") return "-";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "-";
    return `${date.getDate()} ${ID_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return "-";
  }
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const xpProgress = stats.xpForNextLevel > 0
    ? Math.round((stats.xpInLevel / stats.xpForNextLevel) * 100)
    : 0;

  const xpToNextLevel = stats.xpForNextLevel - stats.xpInLevel;

  const highlightCards = [
    {
      value: stats.totalXp.toLocaleString("id-ID"),
      label: "Total XP",
      sub: `${xpProgress}% ke Level ${stats.currentLevel + 1}`,
      icon: Zap,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      borderColor: "border-yellow-400/20",
      progress: xpProgress,
    },
    {
      value: `Level ${stats.currentLevel}`,
      label: `${xpToNextLevel.toLocaleString("id-ID")} XP lagi`,
      sub: `ke Level ${stats.currentLevel + 1}`,
      icon: Star,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/20",
    },
    {
      value: `${stats.currentStreak} hari`,
      label: "Streak",
      sub: `Terpanjang: ${stats.longestStreak} hari`,
      icon: Flame,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      borderColor: "border-orange-400/20",
    },
  ];

  const detailCells = [
    {
      value: stats.wordsLearned.toLocaleString("id-ID"),
      label: "Kata Dikuasai",
      icon: BookOpen,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      value: stats.quizCompleted.toString(),
      label: "Quiz Selesai",
      icon: Target,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      value: `${stats.quizAccuracy}%`,
      label: "Akurasi Quiz",
      icon: Percent,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      value: `${stats.daysActive} hari`,
      label: "Hari Aktif",
      icon: CalendarDays,
      color: "text-teal-400",
      bgColor: "bg-teal-400/10",
    },
    {
      value: stats.totalReviews.toLocaleString("id-ID"),
      label: "Total Review",
      icon: RotateCcw,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
    },
    {
      value: formatDate(stats.joinedAt),
      label: "Bergabung Sejak",
      icon: CalendarPlus,
      color: "text-pink-400",
      bgColor: "bg-pink-400/10",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <Zap className="size-4 text-[#C2E959]" />
        <h3 className="text-sm font-semibold">Statistik Belajar</h3>
      </div>

      {/* Highlight Stats - Row 1 */}
      <div className="grid grid-cols-3 gap-3">
        {highlightCards.map((card) => (
          <div
            key={card.label}
            className={`flex flex-col gap-2 rounded-xl border ${card.borderColor} bg-card p-3 sm:p-4`}
          >
            <div className={`flex size-8 items-center justify-center rounded-lg ${card.bgColor}`}>
              <card.icon className={`size-4 ${card.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight sm:text-2xl">{card.value}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground sm:text-xs">
                {card.label}
              </p>
            </div>
            {card.progress !== undefined ? (
              <div className="mt-auto">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
                <p className="mt-1 text-[9px] text-muted-foreground sm:text-[10px]">{card.sub}</p>
              </div>
            ) : (
              <p className="mt-auto text-[9px] text-muted-foreground sm:text-[10px]">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Detail Stats - Row 2 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {detailCells.map((cell) => (
          <div
            key={cell.label}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-card px-2 py-3 text-center sm:px-3 sm:py-4"
          >
            <div className={`flex size-7 items-center justify-center rounded-lg ${cell.bgColor}`}>
              <cell.icon className={`size-3.5 ${cell.color}`} />
            </div>
            <span className="text-base font-bold leading-tight sm:text-xl">{cell.value}</span>
            <span className="text-[9px] leading-tight text-muted-foreground sm:text-xs">
              {cell.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
