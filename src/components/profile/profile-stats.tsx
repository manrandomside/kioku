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
    wordsLearned: number;
    quizCompleted: number;
    quizAccuracy: number;
    daysActive: number;
    totalReviews: number;
    joinedAt: string;
  };
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const cells = [
    {
      value: stats.totalXp.toLocaleString("id-ID"),
      label: "Total XP",
      icon: Zap,
      color: "text-[#C2E959]",
    },
    {
      value: `Lv.${stats.currentLevel}`,
      label: "Level",
      icon: Star,
      color: "text-[#C2E959]",
    },
    {
      value: `${stats.currentStreak} hari`,
      label: "Streak",
      icon: Flame,
      color: "text-orange-400",
    },
    {
      value: stats.wordsLearned.toLocaleString("id-ID"),
      label: "Kata Dikuasai",
      icon: BookOpen,
      color: "text-blue-400",
    },
    {
      value: stats.quizCompleted.toString(),
      label: "Quiz Selesai",
      icon: Target,
      color: "text-green-400",
    },
    {
      value: `${stats.quizAccuracy}%`,
      label: "Akurasi Quiz",
      icon: Percent,
      color: "text-purple-400",
    },
    {
      value: `${stats.daysActive} hari`,
      label: "Hari Aktif",
      icon: CalendarDays,
      color: "text-teal-400",
    },
    {
      value: `${stats.totalReviews.toLocaleString("id-ID")} review`,
      label: "Total Review",
      icon: RotateCcw,
      color: "text-cyan-400",
    },
    {
      value: formatDate(stats.joinedAt),
      label: "Bergabung",
      icon: CalendarPlus,
      color: "text-pink-400",
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <Zap className="size-4 text-[#C2E959]" />
        <h3 className="text-sm font-semibold">Statistik Belajar</h3>
      </div>
      <div className="grid grid-cols-3 gap-px bg-border/30 px-1 pb-1">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="flex flex-col items-center gap-1 rounded-lg bg-card px-2 py-3 text-center"
          >
            <cell.icon className={`size-3.5 ${cell.color}`} />
            <span className="text-base font-bold leading-tight sm:text-lg">{cell.value}</span>
            <span className="text-[10px] leading-tight text-muted-foreground sm:text-xs">{cell.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
