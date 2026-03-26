// Fix vocabulary entries that were matched via "substring" strategy during sync.
// These have correct meaning_id but wrong hiragana/kanji/romaji (DB has shorter form).
//
// Usage: npx tsx scripts/fix-substring-matches.ts              (dry-run)
//        npx tsx scripts/fix-substring-matches.ts --apply      (apply DB changes)
//
// Audio regeneration: after --apply, run:
//   python scripts/generate-audio.py --all --no-skip
// to regenerate audio for changed entries (the script uses hiragana for TTS text).

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { eq, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { toRomaji } from "wanakana";

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
  romaji: string;
  meaningId: string;
  audioUrl: string | null;
  chapterNumber: number;
}

type Strategy =
  | "exact"
  | "normalized"
  | "strip-o"
  | "na-adj"
  | "slash-split"
  | "kanji-exact"
  | "kanji-norm"
  | "hiragana-vs-kanji"
  | "kanji-vs-hiragana"
  | "substring";

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

// Generate romaji from hiragana (strip special chars first)
function generateRomaji(hiragana: string): string {
  const cleaned = normalize(hiragana);
  return toRomaji(cleaned);
}

// -- Main --------------------------------------------------------------------

async function main() {
  const { db, client } = createDb();
  const entries = vocabData as VocabEntry[];
  const applyMode = process.argv.includes("--apply");

  console.log(`\nLoaded ${entries.length} entries from JSON.`);
  console.log(`Mode: ${applyMode ? "APPLY (will modify DB)" : "DRY-RUN (read-only)"}\n`);

  // Fetch all published vocabulary + chapter numbers from DB
  const dbRows: DbVocab[] = await db
    .select({
      id: vocabulary.id,
      hiragana: vocabulary.hiragana,
      kanji: vocabulary.kanji,
      romaji: vocabulary.romaji,
      meaningId: vocabulary.meaningId,
      audioUrl: vocabulary.audioUrl,
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

  // Run matching (same logic as sync-vocabulary.ts)
  const matched: MatchResult[] = [];
  const matchedDbIds = new Set<string>();
  const substringMatches: MatchResult[] = [];

  function tryLookup(
    map: Map<string, DbVocab[]>,
    key: string,
    entry: VocabEntry,
    strategy: Strategy,
  ): boolean {
    const candidates = map.get(key);
    if (!candidates) return false;
    const available = candidates.find((m) => !matchedDbIds.has(m.id));
    if (!available) return false;
    const result: MatchResult = { entry, dbVocab: available, strategy };
    matched.push(result);
    matchedDbIds.add(available.id);
    if (strategy === "substring") substringMatches.push(result);
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
        const result: MatchResult = { entry, dbVocab: row, strategy: "substring" };
        matched.push(result);
        matchedDbIds.add(row.id);
        substringMatches.push(result);
        return true;
      }
    }
    return false;
  }

  for (const entry of entries) {
    const ch = entry.chapter;
    const normE = normalize(entry.hiragana);
    const stripOE = stripO(entry.hiragana);

    // Strategies A-I (non-substring)
    if (tryLookup(exactHiragana, `${ch}:${entry.hiragana}`, entry, "exact")) continue;
    if (normE && tryLookup(normHiragana, `${ch}:${normE}`, entry, "normalized")) continue;
    if (stripOE && tryLookup(stripOHiragana, `${ch}:${stripOE}`, entry, "strip-o")) continue;

    if (normE.endsWith("な") && normE.length >= 3) {
      if (tryLookup(naAdjHiragana, `${ch}:${normE}`, entry, "na-adj")) continue;
    }
    const strippedNaE = stripNa(entry.hiragana);
    if (strippedNaE !== normE && tryLookup(normHiragana, `${ch}:${strippedNaE}`, entry, "na-adj")) continue;

    if (entry.hiragana.includes("／")) {
      const parts = entry.hiragana.split("／").map(p => normalize(p)).filter(p => p.length > 0);
      let slashMatched = false;
      for (const part of parts) {
        if (tryLookup(normHiragana, `${ch}:${part}`, entry, "slash-split")) { slashMatched = true; break; }
        if (tryLookup(stripOHiragana, `${ch}:${stripO(part)}`, entry, "slash-split")) { slashMatched = true; break; }
      }
      if (slashMatched) continue;
      if (entry.kanji?.includes("／")) {
        const kanjiParts = entry.kanji.split("／").map(p => normalize(p)).filter(p => p.length > 0);
        let kanjiSlashMatched = false;
        for (const kp of kanjiParts) {
          if (tryLookup(normKanji, `${ch}:${kp}`, entry, "slash-split")) { kanjiSlashMatched = true; break; }
        }
        if (kanjiSlashMatched) continue;
      }
    }

    if (entry.kanji && tryLookup(exactKanji, `${ch}:${entry.kanji}`, entry, "kanji-exact")) continue;
    if (entry.kanji) {
      const normK = normalize(entry.kanji);
      if (normK && tryLookup(normKanji, `${ch}:${normK}`, entry, "kanji-norm")) continue;
    }
    if (normE && tryLookup(normKanji, `${ch}:${normE}`, entry, "hiragana-vs-kanji")) continue;
    if (stripOE && tryLookup(normKanji, `${ch}:${stripOE}`, entry, "hiragana-vs-kanji")) continue;
    if (entry.kanji) {
      const normK = normalize(entry.kanji);
      if (normK && tryLookup(normHiragana, `${ch}:${normK}`, entry, "kanji-vs-hiragana")) continue;
      const stripOK = stripO(entry.kanji);
      if (stripOK && tryLookup(stripOHiragana, `${ch}:${stripOK}`, entry, "kanji-vs-hiragana")) continue;
    }

    // Strategy J: Substring (last resort)
    if (trySubstring(entry)) continue;
  }

  // Filter substring matches where hiragana actually differs
  const fixes = substringMatches.filter((m) => {
    const normDb = normalize(m.dbVocab.hiragana);
    const normPdf = normalize(m.entry.hiragana);
    return normDb !== normPdf;
  });

  console.log(`Total matched: ${matched.length}`);
  console.log(`Substring matches: ${substringMatches.length}`);
  console.log(`Substring matches with different hiragana: ${fixes.length}\n`);

  if (fixes.length === 0) {
    console.log("No substring matches need fixing.");
    await client.end();
    return;
  }

  // Display all fixes
  console.log("=== SUBSTRING MATCHES TO FIX ===\n");

  for (const m of fixes) {
    const newRomaji = generateRomaji(m.entry.hiragana);
    const kanjiChange = m.dbVocab.kanji !== m.entry.kanji
      ? ` | kanji: ${m.dbVocab.kanji ?? "NULL"} -> ${m.entry.kanji ?? "NULL"}`
      : "";
    const romajiChange = m.dbVocab.romaji !== newRomaji
      ? ` | romaji: ${m.dbVocab.romaji} -> ${newRomaji}`
      : "";

    console.log(
      `  Bab ${m.entry.chapter}: ${m.dbVocab.hiragana} -> ${m.entry.hiragana}` +
      (m.entry.kanji ? ` (kanji: ${m.entry.kanji})` : "") +
      kanjiChange +
      romajiChange +
      ` | "${m.dbVocab.meaningId}"`
    );
  }

  // Summary by chapter
  const chapterCounts = new Map<number, number>();
  for (const m of fixes) {
    chapterCounts.set(m.entry.chapter, (chapterCounts.get(m.entry.chapter) ?? 0) + 1);
  }
  console.log("\n=== PER-CHAPTER SUMMARY ===\n");
  for (const [ch, count] of [...chapterCounts.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`  Bab ${ch}: ${count} fixes`);
  }

  // Audio regeneration needed
  const audioRegenNeeded = fixes.filter((m) => m.dbVocab.audioUrl);
  console.log(`\nAudio regeneration needed: ${audioRegenNeeded.length} entries (hiragana changed, existing audio based on old hiragana)`);

  if (!applyMode) {
    console.log("\n=== DRY-RUN COMPLETE ===");
    console.log("Run with --apply to execute changes.");
    console.log("After --apply, regenerate audio with:");
    console.log("  python scripts/generate-audio.py --all --no-skip");
    await client.end();
    return;
  }

  // --- APPLY MODE ---
  console.log("\n=== APPLYING CHANGES ===\n");

  let updated = 0;
  for (const m of fixes) {
    const newRomaji = generateRomaji(m.entry.hiragana);

    await db
      .update(vocabulary)
      .set({
        hiragana: m.entry.hiragana,
        kanji: m.entry.kanji,
        romaji: newRomaji,
        // Clear audio_url so generate-audio.py will regenerate it
        audioUrl: null,
      })
      .where(eq(vocabulary.id, m.dbVocab.id));

    updated++;
  }

  console.log(`Updated ${updated} vocabulary entries (hiragana, kanji, romaji, audio_url cleared).`);
  console.log("\nNext step: regenerate audio for affected entries:");
  console.log("  python scripts/generate-audio.py --all");
  console.log("  (will only generate for entries with null audio_url)");

  console.log("\nDone!");
  await client.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
