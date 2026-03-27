"use client";

import { Zap, Target } from "lucide-react";

interface DailyProgressBarsProps {
  level: {
    current: number;
    totalXp: number;
    xpInLevel: number;
    xpNeeded: number;
    progressPercent: number;
  };
  daily: {
    xpEarned: number;
    xpGoal: number;
    goalMet: boolean;
    progressPercent: number;
  };
}

export function DailyProgressBars({ level, daily }: DailyProgressBarsProps) {
  return (
    <div className="flex w-full flex-col gap-2.5 md:max-w-64">
      {/* Level XP bar */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="size-3.5 text-accent" />
            <span>Level {level.current}</span>
          </div>
          <span className="text-muted-foreground">
            {level.xpInLevel} / {level.xpNeeded} XP
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#248288] to-[#C2E959] transition-all"
            style={{ width: `${level.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Daily XP bar */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Target className="size-3.5 text-[#248288]" />
            <span>Harian</span>
          </div>
          <span className="text-muted-foreground">
            {daily.goalMet ? (
              <span className="font-medium text-accent">Tercapai!</span>
            ) : (
              <>{daily.xpEarned} / {daily.xpGoal} XP</>
            )}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              daily.goalMet
                ? "bg-accent"
                : "bg-[#248288]"
            }`}
            style={{ width: `${daily.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
