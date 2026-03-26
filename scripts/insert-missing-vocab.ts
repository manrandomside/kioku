// Insert missing vocabulary from PDF JSON into the database.
// Also updates sort_order and chapter.vocab_count for all published vocabulary.
//
// Usage: npx tsx scripts/insert-missing-vocab.ts          (dry-run)
//        npx tsx scripts/insert-missing-vocab.ts --apply   (insert + update DB)
//
// Requires DATABASE_URL in .env.local

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { eq, and, asc, sql } from "drizzle-orm";
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

interface ChapterRow {
  id: string;
  chapterNumber: number;
  vocabCount: number;
}

// -- Hiragana to Romaji conversion -------------------------------------------

const HIRAGANA_MAP: Record<string, string> = {
  // Yoon (combo) - must come before single chars for greedy matching
  "きゃ": "kya", "きゅ": "kyu", "きょ": "kyo",
  "しゃ": "sha", "しゅ": "shu", "しょ": "sho",
  "ちゃ": "cha", "ちゅ": "chu", "ちょ": "cho",
  "にゃ": "nya", "にゅ": "nyu", "にょ": "nyo",
  "ひゃ": "hya", "ひゅ": "hyu", "ひょ": "hyo",
  "みゃ": "mya", "みゅ": "myu", "みょ": "myo",
  "りゃ": "rya", "りゅ": "ryu", "りょ": "ryo",
  "ぎゃ": "gya", "ぎゅ": "gyu", "ぎょ": "gyo",
  "じゃ": "ja", "じゅ": "ju", "じょ": "jo",
  "びゃ": "bya", "びゅ": "byu", "びょ": "byo",
  "ぴゃ": "pya", "ぴゅ": "pyu", "ぴょ": "pyo",
  // Basic
  "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
  "か": "ka", "き": "ki", "く": "ku", "け": "ke", "こ": "ko",
  "さ": "sa", "し": "shi", "す": "su", "せ": "se", "そ": "so",
  "た": "ta", "ち": "chi", "つ": "tsu", "て": "te", "と": "to",
  "な": "na", "に": "ni", "ぬ": "nu", "ね": "ne", "の": "no",
  "は": "ha", "ひ": "hi", "ふ": "fu", "へ": "he", "ほ": "ho",
  "ま": "ma", "み": "mi", "む": "mu", "め": "me", "も": "mo",
  "や": "ya", "ゆ": "yu", "よ": "yo",
  "ら": "ra", "り": "ri", "る": "ru", "れ": "re", "ろ": "ro",
  "わ": "wa", "ゐ": "wi", "ゑ": "we", "を": "wo",
  "ん": "n",
  // Dakuten
  "が": "ga", "ぎ": "gi", "ぐ": "gu", "げ": "ge", "ご": "go",
  "ざ": "za", "じ": "ji", "ず": "zu", "ぜ": "ze", "ぞ": "zo",
  "だ": "da", "ぢ": "di", "づ": "du", "で": "de", "ど": "do",
  "ば": "ba", "び": "bi", "ぶ": "bu", "べ": "be", "ぼ": "bo",
  "ぱ": "pa", "ぴ": "pi", "ぷ": "pu", "ぺ": "pe", "ぽ": "po",
};

// Katakana to hiragana offset: カ(0x30A0+) -> か(0x3040+), diff = 0x60
function katakanaToHiragana(str: string): string {
  let result = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    // Katakana range: 0x30A1-0x30F6 (ァ-ヶ), also ー stays as-is
    if (code >= 0x30a1 && code <= 0x30f6) {
      result += String.fromCharCode(code - 0x60);
    } else {
      result += ch;
    }
  }
  return result;
}

function hiraganaToRomaji(input: string): string {
  // Convert katakana to hiragana first
  const str = katakanaToHiragana(input);

  let result = "";
  let i = 0;

  while (i < str.length) {
    // Handle っ (sokuon / double consonant)
    if (str[i] === "っ" || str[i] === "ッ") {
      // Look ahead to get next consonant
      if (i + 1 < str.length) {
        // Try 2-char combo first
        const next2 = str.substring(i + 1, i + 3);
        const rom2 = HIRAGANA_MAP[next2];
        if (rom2 && rom2.length > 0) {
          result += rom2[0]; // double the first consonant
          i++;
          continue;
        }
        const next1 = str[i + 1];
        const rom1 = HIRAGANA_MAP[next1];
        if (rom1 && rom1.length > 0) {
          result += rom1[0];
          i++;
          continue;
        }
      }
      i++;
      continue;
    }

    // Handle ー (long vowel)
    if (str[i] === "ー") {
      // Repeat last vowel
      if (result.length > 0) {
        const lastChar = result[result.length - 1];
        if ("aiueo".includes(lastChar)) {
          result += lastChar;
        }
      }
      i++;
      continue;
    }

    // Try 2-char combo (yoon)
    if (i + 1 < str.length) {
      const pair = str.substring(i, i + 2);
      const romaji = HIRAGANA_MAP[pair];
      if (romaji) {
        result += romaji;
        i += 2;
        continue;
      }
    }

    // Try single char
    const single = HIRAGANA_MAP[str[i]];
    if (single) {
      result += single;
      i++;
      continue;
    }

    // Unknown character (kanji, punctuation, etc.) - skip
    i++;
  }

  return result;
}

// -- Word type detection -----------------------------------------------------

function detectWordType(hiragana: string, kanji: string | null): string {
  const h = hiragana;
  const k = kanji ?? "";

  // Check します verbs first (group 3)
  if (h.endsWith("します") || k.endsWith("します")) return "verb";

  // Check ます ending (verb)
  if (h.endsWith("ます")) return "verb";

  // Check な-adjective patterns
  if (h.includes("（な）") || k.includes("（な）")) return "na_adjective";
  if (h.endsWith("な") && h.length >= 3) return "na_adjective";

  // Check い-adjective (ends with い, at least 3 chars, and not common nouns)
  // Common い-ending nouns to exclude
  const iNounExceptions = [
    "おかし", "すし", "すき", "ごはん",
  ];
  const normalized = h.replace(/[～－\-（）\(\)]/g, "").trim();
  if (
    normalized.endsWith("い") &&
    normalized.length >= 3 &&
    !iNounExceptions.includes(normalized) &&
    // Most い-adjectives end with しい, かい, たい, ない, etc.
    // But to be safe, only mark as i_adj if it looks like one
    !normalized.endsWith("まい") // e.g. うまい is actually i-adj but safer default
  ) {
    // Check against common patterns that are NOT i-adjectives
    // Words ending in かい that are nouns: いかい, etc.
    // This is a rough heuristic - default to noun for safety
    const iAdjSuffixes = [
      "しい", "たい", "ない", "よい", "いい", "かい", "さい",
      "るい", "らい", "すい", "つい", "ぶい", "くい", "どい",
    ];
    const isLikelyIAdj = iAdjSuffixes.some((s) => normalized.endsWith(s))
      || normalized.length <= 4; // Short い words are often adjectives
    if (isLikelyIAdj) return "i_adjective";
  }

  // Default to noun
  return "noun";
}

// -- Matching helpers (same as check-missing-vocab.ts) -----------------------

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
  const applyMode = process.argv.includes("--apply");

  const entries = vocabData as VocabEntry[];
  console.log(`\nLoaded ${entries.length} entries from PDF JSON.`);
  console.log(`Mode: ${applyMode ? "APPLY (will modify DB)" : "DRY-RUN (read-only)"}\n`);

  // Fetch chapters
  const chapters: ChapterRow[] = await db
    .select({
      id: chapter.id,
      chapterNumber: chapter.chapterNumber,
      vocabCount: chapter.vocabCount,
    })
    .from(chapter)
    .orderBy(asc(chapter.chapterNumber));

  const chapterMap = new Map<number, ChapterRow>();
  for (const ch of chapters) {
    chapterMap.set(ch.chapterNumber, ch);
  }
  console.log(`Fetched ${chapters.length} chapters.`);

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

  // Build lookup maps
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

  function tryLookup(map: Map<string, DbVocab[]>, key: string): boolean {
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

  // Run matching
  const missing: Array<VocabEntry & { pdfIndex: number }> = [];

  // Track per-chapter PDF index
  const chapterPdfIndex = new Map<number, number>();

  for (const entry of entries) {
    const ch = entry.chapter;
    const pdfIdx = chapterPdfIndex.get(ch) ?? 0;
    chapterPdfIndex.set(ch, pdfIdx + 1);

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
      const parts = entry.hiragana.split("／").map((p) => normalize(p)).filter((p) => p.length > 0);
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

    missing.push({ ...entry, pdfIndex: pdfIdx });
  }

  console.log(`Matched: ${matchedDbIds.size}, Missing: ${missing.length}\n`);

  // Group missing by chapter
  const missingByChapter = new Map<number, Array<VocabEntry & { pdfIndex: number }>>();
  for (const m of missing) {
    let arr = missingByChapter.get(m.chapter);
    if (!arr) { arr = []; missingByChapter.set(m.chapter, arr); }
    arr.push(m);
  }

  // Display dry-run summary
  console.log("=== MISSING VOCABULARY TO INSERT ===\n");

  let totalToInsert = 0;
  for (let ch = 1; ch <= 50; ch++) {
    const chapterMissing = missingByChapter.get(ch);
    if (!chapterMissing || chapterMissing.length === 0) continue;

    totalToInsert += chapterMissing.length;
    console.log(`Bab ${ch}: ${chapterMissing.length} to insert`);

    // Show first 3 examples
    const examples = chapterMissing.slice(0, 3);
    for (const m of examples) {
      const romaji = hiraganaToRomaji(normalize(m.hiragana));
      const wordType = detectWordType(m.hiragana, m.kanji);
      console.log(`  - ${m.hiragana} (${m.kanji ?? "-"}) = ${m.meaning_id} [${wordType}] romaji=${romaji}`);
    }
    if (chapterMissing.length > 3) {
      console.log(`  ... and ${chapterMissing.length - 3} more`);
    }
    console.log();
  }

  console.log(`=== TOTAL TO INSERT: ${totalToInsert} ===\n`);

  // --- Sort order + vocab_count preview ---

  // Build PDF order map: for each chapter, list of entries in PDF order
  const pdfOrderByChapter = new Map<number, VocabEntry[]>();
  for (const entry of entries) {
    let arr = pdfOrderByChapter.get(entry.chapter);
    if (!arr) { arr = []; pdfOrderByChapter.set(entry.chapter, arr); }
    arr.push(entry);
  }

  // Preview vocab_count changes
  console.log("=== VOCAB_COUNT CHANGES ===\n");

  // After insert, count would be: existing published + newly inserted
  const dbCountByChapter = new Map<number, number>();
  for (const r of dbRows) {
    dbCountByChapter.set(r.chapterNumber, (dbCountByChapter.get(r.chapterNumber) ?? 0) + 1);
  }

  for (let ch = 1; ch <= 50; ch++) {
    const chapterRow = chapterMap.get(ch);
    if (!chapterRow) continue;

    const existingPublished = dbCountByChapter.get(ch) ?? 0;
    const newInserts = missingByChapter.get(ch)?.length ?? 0;
    const newCount = existingPublished + newInserts;
    const oldCount = chapterRow.vocabCount;

    if (oldCount !== newCount) {
      console.log(`Bab ${ch}: ${oldCount} -> ${newCount} (${newInserts > 0 ? `+${newInserts} new` : "recount"})`);
    }
  }

  if (!applyMode) {
    console.log("\n=== DRY-RUN COMPLETE ===");
    console.log("Run with --apply to execute changes.");
    await client.end();
    return;
  }

  // --- APPLY MODE ---
  console.log("\n=== APPLYING CHANGES ===\n");

  // 1. Insert missing vocabulary
  console.log("--- Inserting missing vocabulary ---\n");

  let insertCount = 0;
  for (let ch = 1; ch <= 50; ch++) {
    const chapterMissing = missingByChapter.get(ch);
    if (!chapterMissing || chapterMissing.length === 0) continue;

    const chapterRow = chapterMap.get(ch);
    if (!chapterRow) {
      console.log(`WARNING: Chapter ${ch} not found in DB, skipping.`);
      continue;
    }

    const jlptLevel = ch <= 25 ? "N5" : "N4";

    for (const m of chapterMissing) {
      const normH = normalize(m.hiragana);
      const romaji = hiraganaToRomaji(normH);
      const wordType = detectWordType(m.hiragana, m.kanji);

      await db.insert(vocabulary).values({
        chapterId: chapterRow.id,
        hiragana: m.hiragana,
        kanji: m.kanji ?? undefined,
        romaji: romaji || m.hiragana,
        meaningId: m.meaning_id,
        meaningEn: "",
        wordType: wordType as "noun" | "verb" | "i_adjective" | "na_adjective" | "adverb" | "particle" | "conjunction" | "expression" | "counter" | "prefix" | "suffix" | "pronoun" | "interjection",
        jlptLevel: jlptLevel as "N5" | "N4",
        isPublished: true,
        sortOrder: (m.pdfIndex + 1) * 10,
        audioUrl: null,
        exampleJp: null,
        exampleId: null,
      });
      insertCount++;
    }
    console.log(`Bab ${ch}: inserted ${chapterMissing.length}`);
  }
  console.log(`\nTotal inserted: ${insertCount}\n`);

  // 2. Update sort_order for ALL published vocabulary based on PDF order
  console.log("--- Updating sort_order ---\n");

  // Re-fetch all published vocabulary (including newly inserted)
  const allPublished = await db
    .select({
      id: vocabulary.id,
      hiragana: vocabulary.hiragana,
      kanji: vocabulary.kanji,
      chapterNumber: chapter.chapterNumber,
    })
    .from(vocabulary)
    .innerJoin(chapter, eq(vocabulary.chapterId, chapter.id))
    .where(eq(vocabulary.isPublished, true))
    .orderBy(asc(chapter.chapterNumber));

  // Build new lookup maps for matching
  const newExactHiragana = new Map<string, DbVocab[]>();
  const newNormHiragana = new Map<string, DbVocab[]>();
  const newStripOHiragana = new Map<string, DbVocab[]>();
  const newNaAdjHiragana = new Map<string, DbVocab[]>();
  const newExactKanji = new Map<string, DbVocab[]>();
  const newNormKanji = new Map<string, DbVocab[]>();

  for (const row of allPublished) {
    const ch = row.chapterNumber;
    const normH = normalize(row.hiragana);

    pushMap(newExactHiragana, `${ch}:${row.hiragana}`, row);
    pushMap(newNormHiragana, `${ch}:${normH}`, row);
    pushMap(newStripOHiragana, `${ch}:${stripO(row.hiragana)}`, row);

    if (normH.length >= 2) {
      pushMap(newNaAdjHiragana, `${ch}:${normH}な`, row);
    }

    if (row.kanji) {
      pushMap(newExactKanji, `${ch}:${row.kanji}`, row);
      pushMap(newNormKanji, `${ch}:${normalize(row.kanji)}`, row);
    }
  }

  const sortMatchedIds = new Set<string>();

  function sortTryLookup(map: Map<string, DbVocab[]>, key: string): DbVocab | null {
    const candidates = map.get(key);
    if (!candidates) return null;
    const available = candidates.find((m) => !sortMatchedIds.has(m.id));
    if (!available) return null;
    sortMatchedIds.add(available.id);
    return available;
  }

  function sortTrySubstring(entry: VocabEntry, chapterNum: number): DbVocab | null {
    const normE = normalize(entry.hiragana);
    if (normE.length < 4) return null;

    for (const row of allPublished) {
      if (row.chapterNumber !== chapterNum) continue;
      if (sortMatchedIds.has(row.id)) continue;

      const normDb = normalize(row.hiragana);
      if (normDb.length < 4) continue;

      if (normE.includes(normDb) || normDb.includes(normE)) {
        sortMatchedIds.add(row.id);
        return row;
      }
    }
    return null;
  }

  let sortUpdated = 0;

  for (const entry of entries) {
    const ch = entry.chapter;
    const pdfIdx = entries.filter((e) => e.chapter === ch).indexOf(entry);
    const sortOrder = (pdfIdx + 1) * 10;

    const normE = normalize(entry.hiragana);
    const stripOE = stripO(entry.hiragana);

    let matched: DbVocab | null = null;

    // Same matching strategies
    matched = sortTryLookup(newExactHiragana, `${ch}:${entry.hiragana}`);
    if (!matched && normE) matched = sortTryLookup(newNormHiragana, `${ch}:${normE}`);
    if (!matched && stripOE) matched = sortTryLookup(newStripOHiragana, `${ch}:${stripOE}`);
    if (!matched && normE.endsWith("な") && normE.length >= 3) {
      matched = sortTryLookup(newNaAdjHiragana, `${ch}:${normE}`);
    }
    if (!matched) {
      const strippedNaE = stripNa(entry.hiragana);
      if (strippedNaE !== normE) matched = sortTryLookup(newNormHiragana, `${ch}:${strippedNaE}`);
    }
    if (!matched && entry.hiragana.includes("／")) {
      const parts = entry.hiragana.split("／").map((p) => normalize(p)).filter((p) => p.length > 0);
      for (const part of parts) {
        matched = sortTryLookup(newNormHiragana, `${ch}:${part}`);
        if (matched) break;
        matched = sortTryLookup(newStripOHiragana, `${ch}:${part.startsWith("お") ? part.slice(1) : part}`);
        if (matched) break;
      }
    }
    if (!matched && entry.kanji) matched = sortTryLookup(newExactKanji, `${ch}:${entry.kanji}`);
    if (!matched && entry.kanji) {
      const normK = normalize(entry.kanji);
      if (normK) matched = sortTryLookup(newNormKanji, `${ch}:${normK}`);
    }
    if (!matched && normE) matched = sortTryLookup(newNormKanji, `${ch}:${normE}`);
    if (!matched && entry.kanji) {
      const normK = normalize(entry.kanji);
      if (normK) matched = sortTryLookup(newNormHiragana, `${ch}:${normK}`);
    }
    if (!matched) matched = sortTrySubstring(entry, ch);

    if (matched) {
      await db
        .update(vocabulary)
        .set({ sortOrder: sortOrder })
        .where(eq(vocabulary.id, matched.id));
      sortUpdated++;
    }
  }
  console.log(`sort_order updated: ${sortUpdated}\n`);

  // 3. Update chapter.vocab_count
  console.log("--- Updating chapter.vocab_count ---\n");

  for (let ch = 1; ch <= 50; ch++) {
    const chapterRow = chapterMap.get(ch);
    if (!chapterRow) continue;

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vocabulary)
      .where(and(eq(vocabulary.chapterId, chapterRow.id), eq(vocabulary.isPublished, true)));

    const newCount = countResult[0]?.count ?? 0;
    const oldCount = chapterRow.vocabCount;

    if (oldCount !== newCount) {
      await db
        .update(chapter)
        .set({ vocabCount: newCount })
        .where(eq(chapter.id, chapterRow.id));
      console.log(`Bab ${ch}: ${oldCount} -> ${newCount}`);
    }
  }

  console.log("\nDone!");
  await client.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
