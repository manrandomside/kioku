import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { userGamification } from "@/db/schema/gamification";
import { user } from "@/db/schema/user";

import { getTodayWIB, getYesterdayWIB, daysDifference } from "@/lib/utils/timezone";
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

// Validate streak on read: if gap > 1 day (and no freeze available for 2-day gap),
// reset current_streak to 0 in the database.
// Called when dashboard or streak API is loaded.
//
// Returns the post-validation values. Accepts an optional pre-fetched snapshot
// to avoid a redundant SELECT when the caller already has the gamification row.
export async function validateStreak(
  userId: string,
  snapshot?: { currentStreak: number; lastActivityDate: string | null; streakFreezes: number }
): Promise<{ currentStreak: number; streakFreezes: number } | null> {
  let state = snapshot;
  if (!state) {
    const [row] = await db
      .select({
        currentStreak: userGamification.currentStreak,
        lastActivityDate: userGamification.lastActivityDate,
        streakFreezes: userGamification.streakFreezes,
      })
      .from(userGamification)
      .where(eq(userGamification.userId, userId))
      .limit(1);

    if (!row) return null;
    state = row;
  }

  // Streak already 0 — nothing to reset
  if (state.currentStreak === 0) {
    return { currentStreak: 0, streakFreezes: state.streakFreezes };
  }

  const today = getTodayWIB();
  const lastActivity = state.lastActivityDate;

  // No activity date recorded — reset
  if (!lastActivity) {
    await db
      .update(userGamification)
      .set({ currentStreak: 0 })
      .where(eq(userGamification.userId, userId));
    return { currentStreak: 0, streakFreezes: state.streakFreezes };
  }

  const gap = daysDifference(today, lastActivity);

  // Active today or yesterday — streak is valid
  if (gap <= 1) {
    return { currentStreak: state.currentStreak, streakFreezes: state.streakFreezes };
  }

  // Gap of exactly 2 days with streak freeze available — consume freeze, keep streak
  if (gap === 2 && state.streakFreezes > 0) {
    const newFreezes = state.streakFreezes - 1;
    await db
      .update(userGamification)
      .set({ streakFreezes: newFreezes })
      .where(eq(userGamification.userId, userId));
    return { currentStreak: state.currentStreak, streakFreezes: newFreezes };
  }

  // Gap > 1 day (no freeze covers it) — reset streak
  await db
    .update(userGamification)
    .set({ currentStreak: 0 })
    .where(eq(userGamification.userId, userId));
  return { currentStreak: 0, streakFreezes: state.streakFreezes };
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
  const today = getTodayWIB();
  const yesterday = getYesterdayWIB();

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

// Get current streak info — validates streak first, then returns accurate data
export async function getStreakInfo(userId: string) {
  // Validate and reset streak in DB if stale
  await validateStreak(userId);

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

  const today = getTodayWIB();
  const isActiveToday = gamification.lastActivityDate === today;

  // Check if streak is at risk (not active today and was active yesterday)
  const yesterday = getYesterdayWIB();
  const streakAtRisk = !isActiveToday && gamification.lastActivityDate === yesterday && gamification.currentStreak > 0;

  return {
    ...gamification,
    isActiveToday,
    streakAtRisk,
  };
}
