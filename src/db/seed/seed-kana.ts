import { config } from "dotenv";

config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { kana } from "../schema/content";
import { ALL_KANA } from "./kana-data";

async function seedKana() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[seed-kana] DATABASE_URL is not set");
    process.exit(1);
  }

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  console.log(`[seed-kana] Seeding ${ALL_KANA.length} kana characters...`);

  const rows = ALL_KANA.map((entry) => ({
    character: entry.character,
    romaji: entry.romaji,
    category: entry.category as typeof kana.$inferInsert.category,
    rowGroup: entry.rowGroup,
    columnPosition: entry.columnPosition,
  }));

  const result = await db
    .insert(kana)
    .values(rows)
    .onConflictDoNothing({ target: kana.character });

  console.log(`[seed-kana] Inserted ${result.count} kana characters (skipped duplicates)`);

  await client.end();
  console.log("[seed-kana] Done");
}

seedKana().catch((err) => {
  console.error("[seed-kana] Error:", err);
  process.exit(1);
});
