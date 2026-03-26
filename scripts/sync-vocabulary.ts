// Sync vocabulary DB with PDF source of truth.
// Usage: npx tsx scripts/sync-vocabulary.ts              (dry-run: show what would change)
//        npx tsx scripts/sync-vocabulary.ts --apply       (apply changes to DB)
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
  meaningEn: string;
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
  jsonIndex: number;
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

// Normalize: strip ～, （...）, punctuation, ellipsis, whitespace
function normalize(h: string): string {
  return h
    .replace(/[～－\-]/g, "")
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[？?！!：:、]/g, "")
    .replace(/……/g, "")             // unicode ellipsis pairs
    .replace(/。。。。/g, "")         // ideographic period runs
    .replace(/。+/g, "")             // remaining periods
    .replace(/…+/g, "")             // remaining ellipsis
    .replace(/[「」『』]/g, "")       // quotation marks
    .replace(/\s+/g, "")
    .trim();
}

// Strip leading お prefix
function stripO(h: string): string {
  const n = normalize(h);
  return n.startsWith("お") ? n.slice(1) : n;
}

// Strip trailing な (for na-adjective matching)
function stripNa(h: string): string {
  const n = normalize(h);
  // Only strip if it ends with な and is at least 2 chars
  // Exclude words where な is integral (さかな, はな, かたかな, ひらがな, etc.)
  if (n.length >= 3 && n.endsWith("な")) {
    return n.slice(0, -1);
  }
  return n;
}

// Push to map helper
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
  const { db, client } = createDb();
  const entries = vocabData as VocabEntry[];
  const applyMode = process.argv.includes("--apply");

  console.log(`\nLoaded ${entries.length} entries from JSON.`);
  console.log(`Mode: ${applyMode ? "APPLY (will modify DB)" : "DRY-RUN (read-only)"}\n`);

  // Fetch all vocabulary + chapter numbers from DB
  const dbRows: DbVocab[] = await db
    .select({
      id: vocabulary.id,
      hiragana: vocabulary.hiragana,
      kanji: vocabulary.kanji,
      meaningId: vocabulary.meaningId,
      meaningEn: vocabulary.meaningEn,
      chapterNumber: chapter.chapterNumber,
    })
    .from(vocabulary)
    .innerJoin(chapter, eq(vocabulary.chapterId, chapter.id))
    .orderBy(asc(chapter.chapterNumber), asc(vocabulary.sortOrder));

  console.log(`Fetched ${dbRows.length} vocabulary rows from DB.\n`);

  // Build lookup maps: "chapterNum:value" -> DbVocab[]
  const exactHiragana = new Map<string, DbVocab[]>();
  const normHiragana = new Map<string, DbVocab[]>();
  const stripOHiragana = new Map<string, DbVocab[]>();
  const naAdjHiragana = new Map<string, DbVocab[]>(); // DB hiragana + な
  const exactKanji = new Map<string, DbVocab[]>();
  const normKanji = new Map<string, DbVocab[]>();

  for (const row of dbRows) {
    const ch = row.chapterNumber;
    const normH = normalize(row.hiragana);

    pushMap(exactHiragana, `${ch}:${row.hiragana}`, row);
    pushMap(normHiragana, `${ch}:${normH}`, row);
    pushMap(stripOHiragana, `${ch}:${stripO(row.hiragana)}`, row);

    // na-adjective: index DB word + な so PDF "たいせつな" matches DB "たいせつ"
    if (normH.length >= 2) {
      pushMap(naAdjHiragana, `${ch}:${normH}な`, row);
    }

    if (row.kanji) {
      pushMap(exactKanji, `${ch}:${row.kanji}`, row);
      pushMap(normKanji, `${ch}:${normalize(row.kanji)}`, row);
    }
  }

  // Track per-chapter JSON index for sort_order
  const chapterJsonIndex = new Map<number, number>();

  // Match entries
  const matched: MatchResult[] = [];
  const unmatchedJson: VocabEntry[] = [];
  const matchedDbIds = new Set<string>();

  // Logs for new strategies
  const naAdjMatches: MatchResult[] = [];
  const slashMatches: MatchResult[] = [];
  const substringMatches: MatchResult[] = [];

  function tryLookup(
    map: Map<string, DbVocab[]>,
    key: string,
    entry: VocabEntry,
    strategy: Strategy,
    jsonIdx: number,
  ): boolean {
    const candidates = map.get(key);
    if (!candidates) return false;
    const available = candidates.find((m) => !matchedDbIds.has(m.id));
    if (!available) return false;
    const result: MatchResult = { entry, dbVocab: available, strategy, jsonIndex: jsonIdx };
    matched.push(result);
    matchedDbIds.add(available.id);
    if (strategy === "na-adj") naAdjMatches.push(result);
    if (strategy === "slash-split") slashMatches.push(result);
    if (strategy === "substring") substringMatches.push(result);
    return true;
  }

  // Try substring match against all DB rows in a chapter (last resort)
  function trySubstring(
    entry: VocabEntry,
    jsonIdx: number,
  ): boolean {
    const normE = normalize(entry.hiragana);
    if (normE.length < 4) return false;

    // Find unmatched DB rows in the same chapter
    for (const row of dbRows) {
      if (row.chapterNumber !== entry.chapter) continue;
      if (matchedDbIds.has(row.id)) continue;

      const normDb = normalize(row.hiragana);
      if (normDb.length < 4) continue;

      // DB is substring of PDF, or PDF is substring of DB
      if (normE.includes(normDb) || normDb.includes(normE)) {
        const result: MatchResult = { entry, dbVocab: row, strategy: "substring", jsonIndex: jsonIdx };
        matched.push(result);
        matchedDbIds.add(row.id);
        substringMatches.push(result);
        return true;
      }
    }
    return false;
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const ch = entry.chapter;

    // Track JSON index per chapter
    const jsonIdx = chapterJsonIndex.get(ch) ?? 0;
    chapterJsonIndex.set(ch, jsonIdx + 1);

    const normE = normalize(entry.hiragana);
    const stripOE = stripO(entry.hiragana);

    // Strategy A: Exact hiragana
    if (tryLookup(exactHiragana, `${ch}:${entry.hiragana}`, entry, "exact", jsonIdx)) continue;

    // Strategy B: Normalized hiragana
    if (normE && tryLookup(normHiragana, `${ch}:${normE}`, entry, "normalized", jsonIdx)) continue;

    // Strategy C: Strip お prefix from both sides
    if (stripOE && tryLookup(stripOHiragana, `${ch}:${stripOE}`, entry, "strip-o", jsonIdx)) continue;

    // Strategy D: な-adjective — PDF "たいせつな" → match DB "たいせつ" (indexed as "たいせつな")
    if (normE.endsWith("な") && normE.length >= 3) {
      if (tryLookup(naAdjHiragana, `${ch}:${normE}`, entry, "na-adj", jsonIdx)) continue;
    }
    // Also try: strip trailing な from PDF, match against DB normalized
    const strippedNaE = stripNa(entry.hiragana);
    if (strippedNaE !== normE && tryLookup(normHiragana, `${ch}:${strippedNaE}`, entry, "na-adj", jsonIdx)) continue;

    // Strategy E: ／ separator — split PDF on ／ and try each part
    if (entry.hiragana.includes("／")) {
      const parts = entry.hiragana.split("／").map(p => normalize(p)).filter(p => p.length > 0);
      let slashMatched = false;
      for (const part of parts) {
        if (tryLookup(normHiragana, `${ch}:${part}`, entry, "slash-split", jsonIdx)) {
          slashMatched = true;
          break;
        }
        if (tryLookup(stripOHiragana, `${ch}:${stripO(part)}`, entry, "slash-split", jsonIdx)) {
          slashMatched = true;
          break;
        }
      }
      if (slashMatched) continue;
      // Also try kanji split
      if (entry.kanji?.includes("／")) {
        const kanjiParts = entry.kanji.split("／").map(p => normalize(p)).filter(p => p.length > 0);
        let kanjiSlashMatched = false;
        for (const kp of kanjiParts) {
          if (tryLookup(normKanji, `${ch}:${kp}`, entry, "slash-split", jsonIdx)) {
            kanjiSlashMatched = true;
            break;
          }
        }
        if (kanjiSlashMatched) continue;
      }
    }

    // Strategy F: Exact kanji match (JSON kanji vs DB kanji)
    if (entry.kanji && tryLookup(exactKanji, `${ch}:${entry.kanji}`, entry, "kanji-exact", jsonIdx)) continue;

    // Strategy G: Normalized kanji match
    if (entry.kanji) {
      const normK = normalize(entry.kanji);
      if (normK && tryLookup(normKanji, `${ch}:${normK}`, entry, "kanji-norm", jsonIdx)) continue;
    }

    // Strategy H: JSON hiragana vs DB kanji
    if (normE && tryLookup(normKanji, `${ch}:${normE}`, entry, "hiragana-vs-kanji", jsonIdx)) continue;
    if (stripOE && tryLookup(normKanji, `${ch}:${stripOE}`, entry, "hiragana-vs-kanji", jsonIdx)) continue;

    // Strategy I: JSON kanji vs DB hiragana
    if (entry.kanji) {
      const normK = normalize(entry.kanji);
      if (normK && tryLookup(normHiragana, `${ch}:${normK}`, entry, "kanji-vs-hiragana", jsonIdx)) continue;
      const stripOK = stripO(entry.kanji);
      if (stripOK && tryLookup(stripOHiragana, `${ch}:${stripOK}`, entry, "kanji-vs-hiragana", jsonIdx)) continue;
    }

    // Strategy J: Substring match (last resort, min 4 chars)
    if (trySubstring(entry, jsonIdx)) continue;

    unmatchedJson.push(entry);
  }

  // Identify unmatched DB rows (to be hidden)
  const unmatchedDb = dbRows.filter((row) => !matchedDbIds.has(row.id));

  // Per-chapter summary
  console.log("=== PER-CHAPTER MATCHING ===\n");
  const allChapters = new Set([...matched.map(m => m.entry.chapter), ...unmatchedDb.map(d => d.chapterNumber)]);
  const sortedChapters = [...allChapters].sort((a, b) => a - b);

  for (const ch of sortedChapters) {
    const chMatched = matched.filter(m => m.entry.chapter === ch).length;
    const chHide = unmatchedDb.filter(d => d.chapterNumber === ch).length;
    const chJsonMiss = unmatchedJson.filter(u => u.chapter === ch).length;
    const parts = [];
    if (chHide > 0) parts.push(`${chHide} hide`);
    if (chJsonMiss > 0) parts.push(`${chJsonMiss} JSON-only`);
    const note = parts.length > 0 ? ` (${parts.join(", ")})` : "";
    console.log(`Bab ${ch}: ${chMatched} matched${note}`);
  }

  // Strategy breakdown
  const stratCounts = new Map<Strategy, number>();
  for (const m of matched) {
    stratCounts.set(m.strategy, (stratCounts.get(m.strategy) ?? 0) + 1);
  }
  console.log("\n=== STRATEGY BREAKDOWN ===\n");
  for (const [s, c] of stratCounts) {
    console.log(`  ${s}: ${c}`);
  }

  console.log(`\n=== TOTALS ===\n`);
  console.log(`DB rows: ${dbRows.length}`);
  console.log(`JSON entries: ${entries.length}`);
  console.log(`MATCHED (DB rows with PDF match): ${matched.length}`);
  console.log(`TO HIDE (DB rows NOT in PDF): ${unmatchedDb.length}`);
  console.log(`JSON-only (PDF entries not in DB): ${unmatchedJson.length}`);

  // Meaning updates needed
  const meaningUpdates = matched.filter(m => m.dbVocab.meaningId !== m.entry.meaning_id);
  console.log(`Meaning updates needed: ${meaningUpdates.length}`);

  // Log new strategy matches for review
  if (naAdjMatches.length > 0) {
    console.log(`\n=== な-ADJECTIVE MATCHES (${naAdjMatches.length}) ===\n`);
    for (const m of naAdjMatches) {
      console.log(`  [Bab ${m.entry.chapter}] DB "${m.dbVocab.hiragana}" <-> PDF "${m.entry.hiragana}" -> "${m.entry.meaning_id}"`);
    }
  }

  if (slashMatches.length > 0) {
    console.log(`\n=== ／ SEPARATOR MATCHES (${slashMatches.length}) ===\n`);
    for (const m of slashMatches) {
      console.log(`  [Bab ${m.entry.chapter}] DB "${m.dbVocab.hiragana}" <-> PDF "${m.entry.hiragana}" -> "${m.entry.meaning_id}"`);
    }
  }

  if (substringMatches.length > 0) {
    console.log(`\n=== SUBSTRING MATCHES (${substringMatches.length}) ===\n`);
    for (const m of substringMatches) {
      console.log(`  [Bab ${m.entry.chapter}] DB "${m.dbVocab.hiragana}" <-> PDF "${m.entry.hiragana}" -> "${m.entry.meaning_id}"`);
    }
  }

  // Preview meaning changes
  if (meaningUpdates.length > 0) {
    console.log(`\n=== PREVIEW: meaning_id CHANGES (first 15) ===\n`);
    for (const m of meaningUpdates.slice(0, 15)) {
      console.log(`  [Bab ${m.entry.chapter}] ${m.dbVocab.hiragana}: "${m.dbVocab.meaningId}" -> "${m.entry.meaning_id}" (${m.strategy})`);
    }
  }

  // Full list of vocabulary to hide
  console.log("\n=== FULL LIST: VOCABULARY TO HIDE (is_published = false) ===\n");
  const hideByChapter = new Map<string, DbVocab[]>();
  for (const row of unmatchedDb) {
    pushMap(hideByChapter, String(row.chapterNumber), row);
  }
  const sortedHideChapters = [...hideByChapter.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
  for (const [ch, rows] of sortedHideChapters) {
    const items = rows.map(r => r.hiragana).join(", ");
    console.log(`Bab ${ch} (${rows.length} items): ${items}`);
  }

  if (!applyMode) {
    console.log("\n=== DRY-RUN COMPLETE ===");
    console.log("Run with --apply to execute changes.");
    await client.end();
    return;
  }

  // --- APPLY MODE ---
  console.log("\n=== APPLYING CHANGES ===\n");

  // 1. Update meaning_id for newly matched entries
  let meaningUpdated = 0;
  for (const m of meaningUpdates) {
    await db
      .update(vocabulary)
      .set({ meaningId: m.entry.meaning_id })
      .where(eq(vocabulary.id, m.dbVocab.id));
    meaningUpdated++;
  }
  console.log(`meaning_id updated: ${meaningUpdated}`);

  // 2. Set is_published = false for unmatched DB rows
  let hidden = 0;
  for (const row of unmatchedDb) {
    await db
      .update(vocabulary)
      .set({ isPublished: false })
      .where(eq(vocabulary.id, row.id));
    hidden++;
  }
  console.log(`Rows hidden (is_published = false): ${hidden}`);

  // 3. Update sort_order for matched entries
  let sortUpdated = 0;
  for (const m of matched) {
    await db
      .update(vocabulary)
      .set({ sortOrder: m.jsonIndex })
      .where(eq(vocabulary.id, m.dbVocab.id));
    sortUpdated++;
  }
  console.log(`sort_order updated: ${sortUpdated}`);

  console.log("\nDone!");
  await client.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
