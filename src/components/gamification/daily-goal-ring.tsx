"use client";

interface DailyGoalRingProps {
  earned: number;
  goal: number;
  met: boolean;
}

export function DailyGoalRing({ earned, goal, met }: DailyGoalRingProps) {
  const percent = goal > 0 ? Math.min(100, Math.round((earned / goal) * 100)) : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex size-16 items-center justify-center">
      <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
        {/* Background circle */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={met ? "text-accent" : "text-[#248288]"}
          stroke="currentColor"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {met ? (
          <span className="text-xs font-bold text-accent">Done!</span>
        ) : (
          <>
            <span className="text-xs font-bold leading-none">{percent}%</span>
            <span className="text-[8px] text-muted-foreground">Harian</span>
          </>
        )}
      </div>
    </div>
  );
}
