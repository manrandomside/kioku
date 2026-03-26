// Batch update vocabulary.meaning_id to Indonesian translations.
// Usage: npx tsx scripts/update-vocabulary-meanings.ts
//        npx tsx scripts/update-vocabulary-meanings.ts --dry-run
//
// Data source: scripts/data/mnn-vocabulary-indonesian.json (2909 entries)
// Requires DATABASE_URL in .env.local

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { eq, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { chapter, vocabulary } from "../src/db/schema/content";

import vocabData from "./data/mnn-vocabulary-indonesian.json";

// -- Types -------------------------------------------------------------------

interface VocabEntry {
  chapter: number;
  hiragana: string;
  kanji: string | null;
  meaning_id: string;
}

interface DbVocab {
  id: string;
  hiragana: string;
  kanji: string | null;
  meaningId: string;
  chapterNumber: number;
}

type Strategy = "exact" | "normalized" | "kanji";

interface MatchResult {
  entry: VocabEntry;
  dbVocab: DbVocab;
  strategy: Strategy;
}

// -- DB connection -----------------------------------------------------------

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.local values.");
  }
  const client = postgres(connectionString, { prepare: false });
  return { db: drizzle(client, { schema }), client };
}

// -- Helpers -----------------------------------------------------------------

// Normalize hiragana for fuzzy matching: strip prefixes, suffixes, punctuation
function normalizeHiragana(h: string): string {
  return h
    .replace(/[～－\-]/g, "")       // strip ～ and － and -
    .replace(/（[^）]*）/g, "")      // strip fullwidth parens content like （な）
    .replace(/\([^)]*\)/g, "")       // strip ASCII parens content
    .replace(/[？?。、！!]/g, "")     // strip punctuation
    .replace(/\s+/g, "")             // strip whitespace
    .trim();
}

// -- Main --------------------------------------------------------------------

async function main() {
  const { db, client } = createDb();
  const entries = vocabData as VocabEntry[];

  console.log(`\nLoaded ${entries.length} entries from JSON.\n`);

  // Fetch all vocabulary + chapter numbers from DB
  const dbRows: DbVocab[] = await db
    .select({
      id: vocabulary.id,
      hiragana: vocabulary.hiragana,
      kanji: vocabulary.kanji,
      meaningId: vocabulary.meaningId,
      chapterNumber: chapter.chapterNumber,
    })
    .from(vocabulary)
    .innerJoin(chapter, eq(vocabulary.chapterId, chapter.id))
    .orderBy(asc(chapter.chapterNumber), asc(vocabulary.sortOrder));

  console.log(`Fetched ${dbRows.length} vocabulary rows from DB.\n`);

  // Build lookup maps keyed by chapter
  // Map<"chapterNum:hiragana", DbVocab[]> for exact match
  const exactLookup = new Map<string, DbVocab[]>();
  // Map<"chapterNum:normalizedHiragana", DbVocab[]> for normalized match
  const normLookup = new Map<string, DbVocab[]>();
  // Map<"chapterNum:kanji", DbVocab[]> for kanji match
  const kanjiLookup = new Map<string, DbVocab[]>();

  for (const row of dbRows) {
    // Exact
    const exactKey = `${row.chapterNumber}:${row.hiragana}`;
    (exactLookup.get(exactKey) ?? (exactLookup.set(exactKey, []), exactLookup.get(exactKey)!)).push(row);

    // Normalized
    const normKey = `${row.chapterNumber}:${normalizeHiragana(row.hiragana)}`;
    (normLookup.get(normKey) ?? (normLookup.set(normKey, []), normLookup.get(normKey)!)).push(row);

    // Kanji (if present)
    if (row.kanji) {
      const kanjiKey = `${row.chapterNumber}:${normalizeHiragana(row.kanji)}`;
      (kanjiLookup.get(kanjiKey) ?? (kanjiLookup.set(kanjiKey, []), kanjiLookup.get(kanjiKey)!)).push(row);
    }
  }

  // Match entries using multiple strategies
  const matched: MatchResult[] = [];
  const unmatched: VocabEntry[] = [];
  const matchedDbIds = new Set<string>();

  function tryLookup(
    map: Map<string, DbVocab[]>,
    key: string,
    entry: VocabEntry,
    strategy: Strategy
  ): boolean {
    const candidates = map.get(key);
    if (!candidates) return false;
    const available = candidates.find((m) => !matchedDbIds.has(m.id));
    if (!available) return false;
    matched.push({ entry, dbVocab: available, strategy });
    matchedDbIds.add(available.id);
    return true;
  }

  for (const entry of entries) {
    const ch = entry.chapter;

    // Strategy A: Exact hiragana match
    if (tryLookup(exactLookup, `${ch}:${entry.hiragana}`, entry, "exact")) continue;

    // Strategy B: Normalized hiragana match
    const normEntry = normalizeHiragana(entry.hiragana);
    if (normEntry && tryLookup(normLookup, `${ch}:${normEntry}`, entry, "normalized")) continue;

    // Strategy C: Match JSON kanji against DB kanji
    if (entry.kanji) {
      const normKanji = normalizeHiragana(entry.kanji);
      if (normKanji && tryLookup(kanjiLookup, `${ch}:${normKanji}`, entry, "kanji")) continue;
    }

    // Strategy D: Match JSON hiragana against DB kanji (for entries like おみやげ → お土産)
    if (tryLookup(kanjiLookup, `${ch}:${normEntry}`, entry, "kanji")) continue;

    unmatched.push(entry);
  }

  // Per-chapter summary
  const chapterStats = new Map<number, { matched: number; unmatched: number; total: number }>();
  for (const m of matched) {
    const ch = m.entry.chapter;
    const s = chapterStats.get(ch) ?? { matched: 0, unmatched: 0, total: 0 };
    s.matched++;
    s.total++;
    chapterStats.set(ch, s);
  }
  for (const u of unmatched) {
    const ch = u.chapter;
    const s = chapterStats.get(ch) ?? { matched: 0, unmatched: 0, total: 0 };
    s.unmatched++;
    s.total++;
    chapterStats.set(ch, s);
  }

  const sortedChapters = [...chapterStats.entries()].sort((a, b) => a[0] - b[0]);
  for (const [ch, s] of sortedChapters) {
    const unmatchedNote = s.unmatched > 0 ? ` (${s.unmatched} unmatched)` : "";
    console.log(`Bab ${ch}: ${s.matched}/${s.total} matched${unmatchedNote}`);
  }

  console.log(`\n--- TOTAL ---`);
  console.log(`Matched: ${matched.length}`);
  console.log(`Unmatched: ${unmatched.length}`);
  console.log(`DB rows without match: ${dbRows.length - matchedDbIds.size}`);

  if (unmatched.length > 100) {
    console.error(`\nWARNING: ${unmatched.length} unmatched entries (JSON entries not found in DB).`);
    console.log("This is expected — JSON has phrases/expressions not stored as vocabulary.\n");
    console.log("First 30 unmatched:");
    for (const u of unmatched.slice(0, 30)) {
      console.log(`  Bab ${u.chapter}: ${u.hiragana} (${u.kanji ?? "-"}) → ${u.meaning_id}`);
    }
  } else if (unmatched.length > 0) {
    console.log("\nUnmatched entries:");
    for (const u of unmatched) {
      console.log(`  Bab ${u.chapter}: ${u.hiragana} (${u.kanji ?? "-"}) → ${u.meaning_id}`);
    }
  }

  // Preview 10 examples (before → after)
  console.log("\n--- PREVIEW (10 examples, before → after) ---");
  const changedExamples = matched.filter((m) => m.dbVocab.meaningId !== m.entry.meaning_id);
  const preview = changedExamples.slice(0, 10);
  for (const m of preview) {
    console.log(
      `  [Bab ${m.entry.chapter}] ${m.dbVocab.hiragana}: "${m.dbVocab.meaningId}" → "${m.entry.meaning_id}" (${m.strategy})`
    );
  }
  console.log(`  ... ${changedExamples.length} total will be updated`);

  // Check for --dry-run flag
  if (process.argv.includes("--dry-run")) {
    console.log("\n--dry-run: Skipping database updates.");
    await client.end();
    return;
  }

  // Execute updates
  console.log(`\nUpdating ${changedExamples.length} rows...`);
  let updated = 0;

  for (const m of matched) {
    if (m.dbVocab.meaningId === m.entry.meaning_id) continue;
    await db
      .update(vocabulary)
      .set({ meaningId: m.entry.meaning_id })
      .where(eq(vocabulary.id, m.dbVocab.id));
    updated++;
  }

  const skipped = matched.length - updated;
  console.log(`\nDone! Updated: ${updated}, Skipped (already correct): ${skipped}`);
  await client.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
