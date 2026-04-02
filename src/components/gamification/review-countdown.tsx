"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ReviewCountdownProps {
  overdue: number;
  nextDueAt: string | null;
  nextDueCount: number;
}

export function ReviewCountdown({ overdue, nextDueAt, nextDueCount }: ReviewCountdownProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [countdownDone, setCountdownDone] = useState(false);

  useEffect(() => {
    // Condition 1: overdue cards exist — no timer needed
    if (overdue > 0) return;

    // Condition 3: no future due cards — nothing to show
    if (!nextDueAt) return;

    function calculateTimeLeft() {
      const now = new Date().getTime();
      const target = new Date(nextDueAt!).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdownDone(true);
        setTimeLeft("");
        router.refresh();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}d`);
      } else {
        setTimeLeft(`${seconds}d`);
      }
    }

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [nextDueAt, overdue, router]);

  // Condition 1: overdue cards exist
  if (overdue > 0) {
    return (
      <span className="text-[11px] font-medium text-red-400">
        {overdue} kartu siap direview sekarang
      </span>
    );
  }

  // Condition 2 → countdown finished: cards just became due
  if (countdownDone) {
    return (
      <span className="animate-pulse text-[11px] font-medium text-[#C2E959]">
        {nextDueCount} kartu siap direview sekarang
      </span>
    );
  }

  // Condition 2: future cards with active countdown
  if (nextDueAt && timeLeft) {
    return (
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {nextDueCount} kartu akan siap direview dalam {timeLeft}
      </span>
    );
  }

  // Condition 3: nothing to show
  return null;
}
