import { config } from "dotenv";

config({ path: ".env.local" });

async function recheckAchievements() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[recheck-achievements] DATABASE_URL is not set");
    process.exit(1);
  }

  const { drizzle } = await import("drizzle-orm/postgres-js");
  const postgres = (await import("postgres")).default;
  const { user } = await import("../schema/user");
  const { checkAndUnlockAchievements } = await import(
    "@/lib/gamification/achievement-service"
  );

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  console.log("[recheck-achievements] Fetching all users...");

  const users = await db
    .select({ id: user.id, displayName: user.displayName, email: user.email })
    .from(user);

  console.log(`[recheck-achievements] Found ${users.length} user(s)\n`);

  let totalUnlocked = 0;

  for (const u of users) {
    const name = u.displayName || u.email;
    try {
      const unlocked = await checkAndUnlockAchievements(u.id);
      totalUnlocked += unlocked.length;

      if (unlocked.length > 0) {
        console.log(`  ${name}: ${unlocked.length} achievement(s) unlocked`);
        for (const ach of unlocked) {
          console.log(`    - ${ach.name} (+${ach.xpReward} XP)`);
        }
      } else {
        console.log(`  ${name}: no new achievements`);
      }
    } catch (err) {
      console.error(`  ${name}: ERROR -`, err);
    }
  }

  console.log(
    `\n[recheck-achievements] Done. Total unlocked: ${totalUnlocked}`
  );
  await client.end();
  process.exit(0);
}

recheckAchievements().catch((err) => {
  console.error("[recheck-achievements] Error:", err);
  process.exit(1);
});
