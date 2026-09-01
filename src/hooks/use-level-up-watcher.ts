"use client";

import { useCallback, useEffect, useRef } from "react";

// Delays after which the level is re-checked, in milliseconds
const CHECK_DELAYS_MS = [3000, 8000];

/**
 * Watches for a level-up that lands after the quiz response was already sent.
 *
 * Streak milestones and achievement rewards award XP in a deferred background
 * task, so they can cross a level boundary while the summary screen is already
 * on display. This re-reads the level a couple of times and reports a late one.
 */
export function useLevelUpWatcher(onLevelUp: (level: number) => void) {
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const callbackRef = useRef(onLevelUp);

  useEffect(() => {
    callbackRef.current = onLevelUp;
  }, [onLevelUp]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const watchForLevelUp = useCallback((baselineLevel: number) => {
    // A missing baseline (0) would make any level look like a level-up
    if (baselineLevel <= 0) return;

    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();

    let reported = false;

    for (const delay of CHECK_DELAYS_MS) {
      const timer = setTimeout(async () => {
        timersRef.current.delete(timer);
        if (reported) return;

        try {
          const res = await fetch("/api/v1/gamification/overview");
          if (!res.ok) return;

          const json = await res.json();
          const current = json?.data?.level?.current;

          if (typeof current === "number" && current > baselineLevel) {
            reported = true;
            callbackRef.current(current);
          }
        } catch {
          // Best-effort follow-up: the level itself is already correct in the
          // database, only the celebration is missed
        }
      }, delay);

      timersRef.current.add(timer);
    }
  }, []);

  return watchForLevelUp;
}
