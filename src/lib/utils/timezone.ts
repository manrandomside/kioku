// Single source of truth for timezone-aware date calculations.
// All "today/yesterday" logic in the app MUST use these functions.

const TIMEZONE = "Asia/Jakarta";

// Today's date in WIB (YYYY-MM-DD)
export function getTodayWIB(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

// Yesterday's date in WIB (YYYY-MM-DD)
export function getYesterdayWIB(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

// Convert a Date object to a WIB date string (YYYY-MM-DD)
export function toDateStringWIB(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

// Current hour in WIB (0-23)
export function getCurrentHourWIB(): number {
  return parseInt(
    new Date().toLocaleString("en-US", { timeZone: TIMEZONE, hour: "numeric", hour12: false }),
    10
  );
}

// Current day of week in WIB (0=Sunday, 6=Saturday)
export function getCurrentDayWIB(): number {
  const dayStr = new Date().toLocaleDateString("en-US", { timeZone: TIMEZONE, weekday: "short" });
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[dayStr] ?? 0;
}

// Difference in calendar days between two YYYY-MM-DD date strings
export function daysDifference(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00Z");
  const b = new Date(dateB + "T00:00:00Z");
  return Math.round(Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}
