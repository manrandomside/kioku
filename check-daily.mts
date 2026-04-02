import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const pgSql = postgres(process.env.DATABASE_URL!);

const FIX_MODE = process.argv.includes("--fix");

// Target user
const TARGET_USER_ID = "0a19f69f-0820-4772-a3de-f95add9f6f0a";

// ===== STEP 1: Show current state =====

console.log("=== daily_activity for April 2 ===");
const rows = await pgSql`
  SELECT id, user_id, activity_date, xp_earned, reviews_count, quiz_count, goal_met, created_at
  FROM daily_activity
  WHERE activity_date = '2026-04-02' AND user_id = ${TARGET_USER_ID}
`;
for (const r of rows) {
  console.log(JSON.stringify(r, null, 2));
}

console.log("\n=== user_gamification for target user ===");
const gam = await pgSql`
  SELECT id, user_id, total_xp, current_level, daily_xp_earned, daily_goal_met, last_activity_date
  FROM user_gamification
  WHERE user_id = ${TARGET_USER_ID}
`;
for (const g of gam) {
  console.log(JSON.stringify(g, null, 2));
}

// ===== STEP 2: Fix dirty data =====

if (!FIX_MODE) {
  console.log("\n--- DRY RUN MODE ---");
  console.log("Run with --fix to apply corrections:");
  console.log("  npx tsx check-daily.mts --fix\n");
  console.log("Will fix for user", TARGET_USER_ID, ":");
  console.log("  1. daily_activity April 2: xp_earned -> 2, reviews_count -> 1");
  console.log("  2. user_gamification: daily_xp_earned -> 2, daily_goal_met -> false");
  await pgSql.end();
  process.exit(0);
}

console.log("\n=== APPLYING FIXES ===");

// Fix 1: daily_activity for April 2 — only 1 review = 2 XP
console.log("Fixing daily_activity: xp_earned -> 2, reviews_count -> 1, goal_met -> false");
await pgSql`
  UPDATE daily_activity
  SET xp_earned = 2, reviews_count = 1, goal_met = false
  WHERE activity_date = '2026-04-02' AND user_id = ${TARGET_USER_ID}
`;

// Fix 2: user_gamification — reset daily counters to match
console.log("Fixing user_gamification: daily_xp_earned -> 2, daily_goal_met -> false");
await pgSql`
  UPDATE user_gamification
  SET daily_xp_earned = 2, daily_goal_met = false
  WHERE user_id = ${TARGET_USER_ID}
`;

// Verify
console.log("\n=== VERIFICATION ===");
const verifyDaily = await pgSql`
  SELECT xp_earned, reviews_count, goal_met FROM daily_activity
  WHERE activity_date = '2026-04-02' AND user_id = ${TARGET_USER_ID}
`;
console.log("daily_activity after fix:", JSON.stringify(verifyDaily[0]));

const verifyGam = await pgSql`
  SELECT daily_xp_earned, daily_goal_met, total_xp FROM user_gamification
  WHERE user_id = ${TARGET_USER_ID}
`;
console.log("user_gamification after fix:", JSON.stringify(verifyGam[0]));

console.log("\nDone! total_xp (", verifyGam[0]?.total_xp, ") is NOT changed — only daily counters were reset.");

await pgSql.end();
process.exit(0);
