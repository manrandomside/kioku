import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { userGamification } from "@/db/schema/gamification";
import { user } from "@/db/schema/user";

import { checkAndAwardStreakMilestone } from "./xp-service";

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
export async function checkAndUpdateStreak(userId: string): Promise<StreakCheckResult> {
  const [gamification] = await db
    .select()
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  if (!gamification) {
    throw new Error("Data gamifikasi tidak ditemukan");
  }

  // Get user daily goal setting
  const [userData] = await db
    .select({ dailyGoalXp: user.dailyGoalXp })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const dailyGoalXp = parseInt(userData?.dailyGoalXp ?? "30", 10);
  const today = getTodayDate();
  const lastActivity = gamification.lastActivityDate;

  // Already checked in today, return current state
  if (lastActivity === today) {
    return {
      currentStreak: gamification.currentStreak,
      longestStreak: gamification.longestStreak,
      streakFreezes: gamification.streakFreezes,
      streakContinued: false,
      freezeUsed: false,
      streakReset: false,
      streakMilestone: null,
      dailyGoalXp,
      dailyXpEarned: gamification.dailyXpEarned,
      dailyGoalMet: gamification.dailyGoalMet,
    };
  }

  let newStreak = gamification.currentStreak;
  let freezeUsed = false;
  let streakReset = false;
  let newFreezes = gamification.streakFreezes;

  if (!lastActivity) {
    // First time activity ever
    newStreak = 1;
  } else {
    const daysSinceLastActivity = daysDifference(today, lastActivity);

    if (daysSinceLastActivity === 1) {
      // Active yesterday, continue streak
      newStreak = gamification.currentStreak + 1;
    } else if (daysSinceLastActivity === 2 && gamification.streakFreezes > 0) {
      // Missed one day but have freeze available
      newStreak = gamification.currentStreak + 1;
      newFreezes = gamification.streakFreezes - 1;
      freezeUsed = true;
    } else {
      // Missed too many days or no freeze, reset streak
      newStreak = 1;
      streakReset = gamification.currentStreak > 0;
    }
  }

  const newLongestStreak = Math.max(gamification.longestStreak, newStreak);

  // Reset daily counters for new day
  await db
    .update(userGamification)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      streakFreezes: newFreezes,
      lastActivityDate: today,
      dailyXpEarned: 0,
      dailyGoalMet: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userGamification.userId, userId));

  // Check for streak milestone rewards
  const milestone = await checkAndAwardStreakMilestone(userId, newStreak);

  // Update freezes again if milestone awarded additional freezes
  if (milestone && milestone.freezes > 0) {
    newFreezes += milestone.freezes;
  }

  return {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    streakFreezes: newFreezes,
    streakContinued: !streakReset && newStreak > 1,
    freezeUsed,
    streakReset,
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
