"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ReviewCountdownProps {
  nextDueAt: string;
  dueNow: number;
}

export function ReviewCountdown({ nextDueAt, dueNow }: ReviewCountdownProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isDue, setIsDue] = useState(false);

  useEffect(() => {
    function calculateTimeLeft() {
      const now = new Date().getTime();
      const target = new Date(nextDueAt).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsDue(true);
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
  }, [nextDueAt, router]);

  if (isDue) {
    return (
      <span className="animate-pulse text-xs font-medium text-[#C2E959]">
        Kartu baru siap di-review!
      </span>
    );
  }

  return (
    <span className="text-xs tabular-nums text-muted-foreground">
      Review berikutnya: {timeLeft}
    </span>
  );
}
