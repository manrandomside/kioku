"use client";

import { useState, useEffect, useMemo } from "react";

import { getCurrentHourWIB } from "@/lib/utils/timezone";

interface StreakReminderProps {
  streak: number;
  isActiveToday: boolean;
  displayName: string;
}

type TimeSlot = "dawn" | "morning" | "afternoon" | "evening" | "night";

interface ReminderConfig {
  emoji: string;
  message: string;
  subText: string;
  borderColor: string;
  bgClass: string;
}

function getTimeSlot(hour: number): TimeSlot {
  if (hour < 5) return "dawn";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

function getFirstName(name: string): string {
  return name.split(" ")[0];
}

function getReminder(
  slot: TimeSlot,
  streak: number,
  firstName: string,
): ReminderConfig {
  const nameStr = firstName ? `, ${firstName}` : "";

  switch (slot) {
    case "dawn":
      return {
        emoji: "\uD83C\uDF19",
        message: `Masih begadang${nameStr}?`,
        subText: "Belajar 5 menit sebelum tidur yuk!",
        borderColor: "border-l-indigo-400",
        bgClass: "bg-indigo-500/5",
      };
    case "morning":
      return {
        emoji: "\u2600\uFE0F",
        message: `Ohayou${nameStr}!`,
        subText: "Hari baru, semangat baru! Yuk mulai belajar ~5 menit",
        borderColor: "border-l-yellow-400",
        bgClass: "bg-yellow-500/5",
      };
    case "afternoon":
      return {
        emoji: "\uD83D\uDCDA",
        message: "Sudah siang, belum belajar nih!",
        subText: `Luangkan 5 menit untuk jaga streak ${streak} harimu`,
        borderColor: "border-l-teal-400",
        bgClass: "bg-teal-500/5",
      };
    case "evening":
      return {
        emoji: "\u23F0",
        message: `Streak ${streak} hari dalam bahaya!`,
        subText: "Masih ada waktu \u2014 1 sesi cepat sebelum malam?",
        borderColor: "border-l-orange-400",
        bgClass: "bg-orange-500/5",
      };
    case "night":
      return {
        emoji: "\uD83C\uDF19",
        message: "Hampir tengah malam!",
        subText: `Streak ${streak} hari mau hilang... Cuma butuh 1 review!`,
        borderColor: "border-l-red-400",
        bgClass: "bg-red-500/5",
      };
  }
}

function useNightCountdown(slot: TimeSlot): string | null {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (slot !== "night") {
      setRemaining(null);
      return;
    }

    function calc() {
      const now = new Date();
      const wibStr = now.toLocaleString("en-US", {
        timeZone: "Asia/Jakarta",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      });
      const [h, m] = wibStr.split(":").map(Number);
      const minutesLeft = (23 - h) * 60 + (59 - m);
      if (minutesLeft <= 0) return "kurang dari 1 menit";
      const hours = Math.floor(minutesLeft / 60);
      const mins = minutesLeft % 60;
      if (hours > 0) return `${hours}j ${mins}m`;
      return `${mins}m`;
    }

    setRemaining(calc());
    const interval = setInterval(() => setRemaining(calc()), 60_000);
    return () => clearInterval(interval);
  }, [slot]);

  return remaining;
}

export function StreakReminder({ streak, isActiveToday, displayName }: StreakReminderProps) {
  const [hour, setHour] = useState(() => getCurrentHourWIB());

  useEffect(() => {
    const interval = setInterval(() => setHour(getCurrentHourWIB()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const slot = getTimeSlot(hour);
  const countdown = useNightCountdown(slot);
  const firstName = useMemo(() => getFirstName(displayName), [displayName]);

  // Condition 1: Already studied today
  if (isActiveToday) {
    return (
      <div className="mt-2 rounded-lg border-l-4 border-l-[#C2E959] bg-[#C2E959]/5 px-3 py-2">
        <p className="text-xs font-medium text-foreground">
          {"\uD83D\uDD25"} Streak aman! Kamu sudah belajar hari ini
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Sampai jumpa besok!
        </p>
      </div>
    );
  }

  // Condition 3: Streak is 0
  if (streak <= 0) {
    return (
      <div className="mt-2 rounded-lg border-l-4 border-l-border px-3 py-2">
        <p className="text-xs font-medium text-foreground">
          {"\uD83D\uDCAA"} Mulai streak baru hari ini!
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Setiap perjalanan dimulai dari langkah pertama
        </p>
      </div>
    );
  }

  // Condition 2: Not studied today, streak > 0
  const reminder = getReminder(slot, streak, firstName);

  return (
    <div className={`mt-2 rounded-lg border-l-4 ${reminder.borderColor} ${reminder.bgClass} px-3 py-2`}>
      <p className="text-xs font-medium text-foreground">
        {reminder.emoji} {reminder.message}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {reminder.subText}
      </p>
      {slot === "night" && countdown && (
        <p className="mt-1 text-[11px] font-medium text-red-500 dark:text-red-400">
          Streak hilang dalam {countdown}
        </p>
      )}
    </div>
  );
}
