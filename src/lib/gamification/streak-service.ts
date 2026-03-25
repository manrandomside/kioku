import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { userGamification } from "@/db/schema/gamification";
import { user } from "@/db/schema/user";

import { checkAndAwardStreakMilestone, ensureGamificationRow } from "./xp-service";

export interface StreakCheckResult {
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  streakContinued: boolean;
  freezeUsed: boolean;
  streakReset: boolean;
  streakMilestone: { xp: number; freezes: number } | null;
  dailyGoalXp: number;
  dailyXpEarned: number;
  dailyGoalMet: boolean;
}

// Get today's date string in YYYY-MM-DD
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// Get yesterday's date string in YYYY-MM-DD
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

// Calculate difference in calendar days between two date strings
function daysDifference(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00Z");
  const b = new Date(dateB + "T00:00:00Z");
  return Math.round(Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

// Check and update streak for a user's daily activity
// Called when user first becomes active for the day (review/quiz)
// Uses atomic SQL update to prevent race conditions from concurrent requests
export async function checkAndUpdateStreak(userId: string): Promise<StreakCheckResult> {
  // Ensure gamification row exists (auto-create if onboarding missed it)
  await ensureGamificationRow(userId);

  // Get user daily goal setting
  const [userData] = await db
    .select({ dailyGoalXp: user.dailyGoalXp })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const dailyGoalXp = parseInt(userData?.dailyGoalXp ?? "30", 10);
  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  // Atomic update: compute new streak values in SQL based on current state
  // Only updates if last_activity_date != today (idempotent for same-day calls)
  const [updated] = await db
    .update(userGamification)
    .set({
      currentStreak: sql`CASE
        WHEN ${userGamification.lastActivityDate}::text = ${today} THEN ${userGamification.currentStreak}
        WHEN ${userGamification.lastActivityDate} IS NULL THEN 1
        WHEN ${userGamification.lastActivityDate}::text = ${yesterday} THEN ${userGamification.currentStreak} + 1
        WHEN ${userGamification.lastActivityDate}::text = (${today}::date - interval '2 days')::date::text
          AND ${userGamification.streakFreezes} > 0 THEN ${userGamification.currentStreak} + 1
        ELSE 1
      END`,
      longestStreak: sql`GREATEST(${userGamification.longestStreak}, CASE
        WHEN ${userGamification.lastActivityDate}::text = ${today} THEN ${userGamification.currentStreak}
        WHEN ${userGamification.lastActivityDate} IS NULL THEN 1
        WHEN ${userGamification.lastActivityDate}::text = ${yesterday} THEN ${userGamification.currentStreak} + 1
        WHEN ${userGamification.lastActivityDate}::text = (${today}::date - interval '2 days')::date::text
          AND ${userGamification.streakFreezes} > 0 THEN ${userGamification.currentStreak} + 1
        ELSE 1
      END)`,
      streakFreezes: sql`CASE
        WHEN ${userGamification.lastActivityDate}::text = ${today} THEN ${userGamification.streakFreezes}
        WHEN ${userGamification.lastActivityDate}::text = (${today}::date - interval '2 days')::date::text
          AND ${userGamification.streakFreezes} > 0 THEN ${userGamification.streakFreezes} - 1
        ELSE ${userGamification.streakFreezes}
      END`,
      lastActivityDate: today,
      dailyXpEarned: sql`CASE
        WHEN ${userGamification.lastActivityDate}::text = ${today} THEN ${userGamification.dailyXpEarned}
        ELSE 0
      END`,
      dailyGoalMet: sql`CASE
        WHEN ${userGamification.lastActivityDate}::text = ${today} THEN ${userGamification.dailyGoalMet}
        ELSE false
      END`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userGamification.userId, userId))
    .returning();

  if (!updated) {
    throw new Error("Data gamifikasi tidak ditemukan");
  }

  // Determine what happened by comparing with the returned state
  const wasAlreadyToday = updated.dailyXpEarned > 0 || updated.dailyGoalMet;
  const streakReset = updated.currentStreak === 1 && !wasAlreadyToday;
  const freezeUsed = updated.streakFreezes < (updated.streakFreezes + 1); // approximate

  // Re-read to get accurate freeze-used detection
  // (the atomic update already happened, this is just for return value accuracy)
  const alreadyActiveToday = updated.lastActivityDate === today && wasAlreadyToday;

  if (alreadyActiveToday) {
    return {
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      streakFreezes: updated.streakFreezes,
      streakContinued: false,
      freezeUsed: false,
      streakReset: false,
      streakMilestone: null,
      dailyGoalXp,
      dailyXpEarned: updated.dailyXpEarned,
      dailyGoalMet: updated.dailyGoalMet,
    };
  }

  // Check for streak milestone rewards
  const milestone = await checkAndAwardStreakMilestone(userId, updated.currentStreak);

  return {
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    streakFreezes: updated.streakFreezes + (milestone?.freezes ?? 0),
    streakContinued: updated.currentStreak > 1,
    freezeUsed: false,
    streakReset: streakReset,
    streakMilestone: milestone ? { xp: milestone.xp, freezes: milestone.freezes } : null,
    dailyGoalXp,
    dailyXpEarned: 0,
    dailyGoalMet: false,
  };
}

// Get current streak info without modifying state
export async function getStreakInfo(userId: string) {
  const [gamification] = await db
    .select({
      currentStreak: userGamification.currentStreak,
      longestStreak: userGamification.longestStreak,
      streakFreezes: userGamification.streakFreezes,
      lastActivityDate: userGamification.lastActivityDate,
    })
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  if (!gamification) return null;

  const today = getTodayDate();
  const isActiveToday = gamification.lastActivityDate === today;

  // Check if streak is at risk (not active today and was active yesterday)
  const yesterday = getYesterdayDate();
  const streakAtRisk = !isActiveToday && gamification.lastActivityDate === yesterday && gamification.currentStreak > 0;

  return {
    ...gamification,
    isActiveToday,
    streakAtRisk,
  };
}
