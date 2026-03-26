// Check which PDF vocabulary entries are missing from the database.
// Usage: npx tsx scripts/check-missing-vocab.ts
//
// Uses the same matching logic as sync-vocabulary.ts to avoid false positives.
// Read-only — does not modify the database.

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { eq, and, asc } from "drizzle-orm";
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
  chapterNumber: number;
}

// -- Helpers (same as sync-vocabulary.ts) ------------------------------------

function normalize(h: string): string {
  return h
    .replace(/[～－\-]/g, "")
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[？?！!：:、]/g, "")
    .replace(/……/g, "")
    .replace(/。。。。/g, "")
    .replace(/。+/g, "")
    .replace(/…+/g, "")
    .replace(/[「」『』]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function stripO(h: string): string {
  const n = normalize(h);
  return n.startsWith("お") ? n.slice(1) : n;
}

function stripNa(h: string): string {
  const n = normalize(h);
  if (n.length >= 3 && n.endsWith("な")) {
    return n.slice(0, -1);
  }
  return n;
}

function pushMap<T>(map: Map<string, T[]>, key: string, val: T) {
  let arr = map.get(key);
  if (!arr) {
    arr = [];
    map.set(key, arr);
  }
  arr.push(val);
}

// -- Main --------------------------------------------------------------------

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client, { schema });

  const entries = vocabData as VocabEntry[];
  console.log(`\nLoaded ${entries.length} entries from PDF JSON.`);

  // Fetch published vocabulary from DB
  const dbRows: DbVocab[] = await db
    .select({
      id: vocabulary.id,
      hiragana: vocabulary.hiragana,
      kanji: vocabulary.kanji,
      chapterNumber: chapter.chapterNumber,
    })
    .from(vocabulary)
    .innerJoin(chapter, eq(vocabulary.chapterId, chapter.id))
    .where(eq(vocabulary.isPublished, true))
    .orderBy(asc(chapter.chapterNumber), asc(vocabulary.sortOrder));

  console.log(`Fetched ${dbRows.length} published vocabulary rows from DB.\n`);

  // Build lookup maps (same as sync-vocabulary.ts)
  const exactHiragana = new Map<string, DbVocab[]>();
  const normHiragana = new Map<string, DbVocab[]>();
  const stripOHiragana = new Map<string, DbVocab[]>();
  const naAdjHiragana = new Map<string, DbVocab[]>();
  const exactKanji = new Map<string, DbVocab[]>();
  const normKanji = new Map<string, DbVocab[]>();

  for (const row of dbRows) {
    const ch = row.chapterNumber;
    const normH = normalize(row.hiragana);

    pushMap(exactHiragana, `${ch}:${row.hiragana}`, row);
    pushMap(normHiragana, `${ch}:${normH}`, row);
    pushMap(stripOHiragana, `${ch}:${stripO(row.hiragana)}`, row);

    if (normH.length >= 2) {
      pushMap(naAdjHiragana, `${ch}:${normH}な`, row);
    }

    if (row.kanji) {
      pushMap(exactKanji, `${ch}:${row.kanji}`, row);
      pushMap(normKanji, `${ch}:${normalize(row.kanji)}`, row);
    }
  }

  const matchedDbIds = new Set<string>();

  function tryLookup(
    map: Map<string, DbVocab[]>,
    key: string,
  ): boolean {
    const candidates = map.get(key);
    if (!candidates) return false;
    const available = candidates.find((m) => !matchedDbIds.has(m.id));
    if (!available) return false;
    matchedDbIds.add(available.id);
    return true;
  }

  function trySubstring(entry: VocabEntry): boolean {
    const normE = normalize(entry.hiragana);
    if (normE.length < 4) return false;

    for (const row of dbRows) {
      if (row.chapterNumber !== entry.chapter) continue;
      if (matchedDbIds.has(row.id)) continue;

      const normDb = normalize(row.hiragana);
      if (normDb.length < 4) continue;

      if (normE.includes(normDb) || normDb.includes(normE)) {
        matchedDbIds.add(row.id);
        return true;
      }
    }
    return false;
  }

  // Run matching (same strategy order as sync-vocabulary.ts)
  const missing: VocabEntry[] = [];

  for (const entry of entries) {
    const ch = entry.chapter;
    const normE = normalize(entry.hiragana);
    const stripOE = stripO(entry.hiragana);

    // Strategy A: Exact hiragana
    if (tryLookup(exactHiragana, `${ch}:${entry.hiragana}`)) continue;

    // Strategy B: Normalized
    if (normE && tryLookup(normHiragana, `${ch}:${normE}`)) continue;

    // Strategy C: Strip お
    if (stripOE && tryLookup(stripOHiragana, `${ch}:${stripOE}`)) continue;

    // Strategy D: な-adjective
    if (normE.endsWith("な") && normE.length >= 3) {
      if (tryLookup(naAdjHiragana, `${ch}:${normE}`)) continue;
    }
    const strippedNaE = stripNa(entry.hiragana);
    if (strippedNaE !== normE && tryLookup(normHiragana, `${ch}:${strippedNaE}`)) continue;

    // Strategy E: ／ separator
    if (entry.hiragana.includes("／")) {
      const parts = entry.hiragana.split("／").map(p => normalize(p)).filter(p => p.length > 0);
      let slashMatched = false;
      for (const part of parts) {
        if (tryLookup(normHiragana, `${ch}:${part}`)) { slashMatched = true; break; }
        if (tryLookup(stripOHiragana, `${ch}:${part.startsWith("お") ? part.slice(1) : part}`)) { slashMatched = true; break; }
      }
      if (slashMatched) continue;
    }

    // Strategy F: Kanji exact
    if (entry.kanji && tryLookup(exactKanji, `${ch}:${entry.kanji}`)) continue;

    // Strategy G: Kanji normalized
    if (entry.kanji) {
      const normK = normalize(entry.kanji);
      if (normK && tryLookup(normKanji, `${ch}:${normK}`)) continue;
    }

    // Strategy H: Hiragana vs DB kanji
    if (normE && tryLookup(normKanji, `${ch}:${normE}`)) continue;

    // Strategy I: Kanji vs DB hiragana
    if (entry.kanji) {
      const normK = normalize(entry.kanji);
      if (normK && tryLookup(normHiragana, `${ch}:${normK}`)) continue;
    }

    // Strategy J: Substring
    if (trySubstring(entry)) continue;

    missing.push(entry);
  }

  // Group by chapter
  const missingByChapter = new Map<number, VocabEntry[]>();
  for (const m of missing) {
    let arr = missingByChapter.get(m.chapter);
    if (!arr) { arr = []; missingByChapter.set(m.chapter, arr); }
    arr.push(m);
  }

  // Count PDF entries per chapter
  const pdfCountByChapter = new Map<number, number>();
  for (const e of entries) {
    pdfCountByChapter.set(e.chapter, (pdfCountByChapter.get(e.chapter) ?? 0) + 1);
  }

  // Count published DB entries per chapter
  const dbCountByChapter = new Map<number, number>();
  for (const r of dbRows) {
    dbCountByChapter.set(r.chapterNumber, (dbCountByChapter.get(r.chapterNumber) ?? 0) + 1);
  }

  // Display results
  console.log("=== CHAPTERS WITH MISSING VOCABULARY ===\n");

  let totalMissing = 0;

  for (let ch = 1; ch <= 50; ch++) {
    const pdfCount = pdfCountByChapter.get(ch) ?? 0;
    const dbCount = dbCountByChapter.get(ch) ?? 0;
    const chapterMissing = missingByChapter.get(ch);

    if (!chapterMissing || chapterMissing.length === 0) continue;

    totalMissing += chapterMissing.length;

    console.log(`Bab ${ch}: PDF=${pdfCount}, DB=${dbCount}, Missing=${chapterMissing.length}`);
    for (const m of chapterMissing) {
      console.log(`  - ${m.hiragana} (${m.kanji ?? "-"}) = ${m.meaning_id}`);
    }
    console.log();
  }

  console.log(`=== TOTAL MISSING: ${totalMissing} entries ===`);
  console.log(`PDF total: ${entries.length}, DB published: ${dbRows.length}, Matched: ${matchedDbIds.size}`);

  await client.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
