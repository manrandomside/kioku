import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { eq, asc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { chapter, vocabulary } from "../src/db/schema/content";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

const applyMode = process.argv.includes("--apply");

// Known fixes: [hiragana, chapterNumber] -> new meaningId
// These are applied regardless of duplicate detection
const KNOWN_FIXES: Record<string, string> = {
  // Bab 1
  "しゃいん": "Pegawai perusahaan (dipakai untuk kalangan sendiri)",
  "きょうし": "Guru, dosen (dipakai untuk kalangan sendiri)",
  // Bab 3
  "ここ": "Disini (biasa)",
  "こちら:3": "Disini (sopan)",
  "そこ": "Disitu (biasa)",
  "そちら:3": "Disitu (sopan)",
  "あそこ": "Disana (biasa)",
  "あちら": "Disana (sopan)",
  "どこ": "Dimana? (biasa)",
  "どちら:3": "Dimana? (sopan)",
};

// Disambiguation rules for common duplicate patterns
// Format: hiragana -> meaning suffix to add
const DISAMBIGUATION_RULES: Record<string, string> = {
  // Casual vs polite pairs
  "だれ": "(biasa)",
  "どなた": "(sopan)",
  "なんさい": "(biasa)",
  "おいくつ": "(sopan)",
  "あのひと": "(biasa)",
  "あのかた": "(sopan)",
  // Ko-so-a-do demonstratives
  "これ": "(dekat pembicara)",
  "それ": "(dekat lawan bicara)",
  "あれ": "(jauh dari keduanya)",
  "どれ": "(pertanyaan)",
  "この": "(dekat pembicara)",
  "その": "(dekat lawan bicara)",
  "あの": "(jauh dari keduanya)",
  "どの": "(pertanyaan)",
  "こっち": "(dekat pembicara, biasa)",
  "そっち": "(dekat lawan bicara, biasa)",
  "あっち": "(jauh, biasa)",
  "どっち": "(pertanyaan, biasa)",
  // Existence verbs
  "います": "(benda hidup)",
  "あります": "(benda mati)",
  // Family terms (own vs others)
  "ちち": "(sendiri)",
  "おとうさん": "(orang lain)",
  "はは": "(sendiri)",
  "おかあさん": "(orang lain)",
  "あに": "(sendiri)",
  "おにいさん": "(orang lain)",
  "あね": "(sendiri)",
  "おねえさん": "(orang lain)",
  "おとうと": "(sendiri)",
  "おとうとさん": "(orang lain)",
  "いもうと": "(sendiri)",
  "いもうとさん": "(orang lain)",
  "そふ": "(sendiri)",
  "おじいさん": "(orang lain)",
  "そぼ": "(sendiri)",
  "おばあさん": "(orang lain)",
  "おじ": "(sendiri)",
  "おじさん": "(orang lain)",
  "おば": "(sendiri)",
  "おばさん": "(orang lain)",
  "しゅじん": "(sendiri)",
  "ごしゅじん": "(orang lain)",
  "かない": "(sendiri)",
  "おくさん": "(orang lain)",
  "むすこ": "(sendiri)",
  "むすこさん": "(orang lain)",
  "むすめ": "(sendiri)",
  "むすめさん": "(orang lain)",
  "りょうしん": "(sendiri)",
  "ごりょうしん": "(orang lain)",
  "きょうだい": "(sendiri)",
  "ごきょうだい": "(orang lain)",
  "かぞく": "(sendiri)",
  "ごかぞく": "(orang lain)",
};

interface VocabRow {
  id: string;
  hiragana: string;
  kanji: string | null;
  meaningId: string;
  meaningEn: string;
  chapterNumber: number;
  chapterId: string;
}

async function main() {
  console.log(`Mode: ${applyMode ? "APPLY" : "DRY-RUN"}\n`);

  // Query all published vocabulary with chapter info
  const rows: VocabRow[] = await db
    .select({
      id: vocabulary.id,
      hiragana: vocabulary.hiragana,
      kanji: vocabulary.kanji,
      meaningId: vocabulary.meaningId,
      meaningEn: vocabulary.meaningEn,
      chapterNumber: chapter.chapterNumber,
      chapterId: vocabulary.chapterId,
    })
    .from(vocabulary)
    .innerJoin(chapter, eq(vocabulary.chapterId, chapter.id))
    .where(eq(vocabulary.isPublished, true))
    .orderBy(asc(chapter.chapterNumber), asc(vocabulary.sortOrder));

  console.log(`Total published vocabulary: ${rows.length}\n`);

  // ── Step 1: Find duplicates within same chapter ──
  const byChapterMeaning = new Map<string, VocabRow[]>();
  for (const row of rows) {
    const key = `${row.chapterNumber}::${row.meaningId}`;
    if (!byChapterMeaning.has(key)) byChapterMeaning.set(key, []);
    byChapterMeaning.get(key)!.push(row);
  }

  const intraChapterDups: [number, string, VocabRow[]][] = [];
  for (const [key, group] of byChapterMeaning) {
    if (group.length <= 1) continue;
    // Skip if ALL items already have disambiguation in parentheses
    const allHaveParens = group.every((v) => /\(.+\)/.test(v.meaningId));
    if (allHaveParens) continue;
    const [chNum, meaning] = key.split("::");
    intraChapterDups.push([parseInt(chNum), meaning, group]);
  }

  // ── Step 2: Find duplicates across chapters ──
  const byMeaning = new Map<string, VocabRow[]>();
  for (const row of rows) {
    const m = row.meaningId;
    if (!byMeaning.has(m)) byMeaning.set(m, []);
    byMeaning.get(m)!.push(row);
  }

  const crossChapterDups: [string, VocabRow[]][] = [];
  for (const [meaning, group] of byMeaning) {
    if (group.length <= 1) continue;
    // Only include if they span different chapters
    const chapters = new Set(group.map((v) => v.chapterNumber));
    if (chapters.size <= 1) continue;
    // Skip if all already have disambiguation
    const allHaveParens = group.every((v) => /\(.+\)/.test(v.meaningId));
    if (allHaveParens) continue;
    crossChapterDups.push([meaning, group]);
  }

  // ── Display duplicates ──
  console.log("═══════════════════════════════════════════");
  console.log("  DUPLIKAT DALAM BAB YANG SAMA");
  console.log("═══════════════════════════════════════════\n");

  if (intraChapterDups.length === 0) {
    console.log("  (tidak ada duplikat intra-bab)\n");
  }
  for (const [chNum, meaning, group] of intraChapterDups.sort((a, b) => a[0] - b[0])) {
    console.log(`  Bab ${chNum}: "${meaning}" dipakai oleh:`);
    for (const v of group) {
      console.log(`    - ${v.hiragana}${v.kanji ? ` (${v.kanji})` : ""}`);
    }
    console.log();
  }

  console.log("═══════════════════════════════════════════");
  console.log("  DUPLIKAT ANTAR BAB (meaning_id identik)");
  console.log("═══════════════════════════════════════════\n");

  if (crossChapterDups.length === 0) {
    console.log("  (tidak ada duplikat antar-bab)\n");
  }
  for (const [meaning, group] of crossChapterDups.sort((a, b) => a[0].localeCompare(b[0]))) {
    const chapters = [...new Set(group.map((v) => v.chapterNumber))].sort((a, b) => a - b);
    console.log(`  "${meaning}" — muncul di Bab ${chapters.join(", ")}:`);
    for (const v of group) {
      console.log(`    - Bab ${v.chapterNumber}: ${v.hiragana}${v.kanji ? ` (${v.kanji})` : ""}`);
    }
    console.log();
  }

  // ── Build update plan ──
  const updates: { id: string; hiragana: string; kanji: string | null; chapterNumber: number; oldMeaning: string; newMeaning: string }[] = [];

  // Helper: check if meaningId already has parenthetical disambiguation
  function alreadyHasContext(meaningId: string): boolean {
    return /\(.+\)\s*$/.test(meaningId);
  }

  // Apply known fixes
  for (const row of rows) {
    // Try exact hiragana match first, then hiragana:chapterNumber
    const keyExact = row.hiragana;
    const keyWithChapter = `${row.hiragana}:${row.chapterNumber}`;
    const newMeaning = KNOWN_FIXES[keyWithChapter] ?? KNOWN_FIXES[keyExact];

    if (newMeaning && row.meaningId !== newMeaning && !alreadyHasContext(row.meaningId)) {
      updates.push({
        id: row.id,
        hiragana: row.hiragana,
        kanji: row.kanji,
        chapterNumber: row.chapterNumber,
        oldMeaning: row.meaningId,
        newMeaning,
      });
    }
  }

  // Apply disambiguation rules for detected duplicates
  const allDupVocabIds = new Set<string>();
  for (const [, , group] of intraChapterDups) {
    for (const v of group) allDupVocabIds.add(v.id);
  }
  for (const [, group] of crossChapterDups) {
    for (const v of group) allDupVocabIds.add(v.id);
  }

  for (const row of rows) {
    if (!allDupVocabIds.has(row.id)) continue;
    if (alreadyHasContext(row.meaningId)) continue;
    // Skip if already in known fixes
    if (updates.some((u) => u.id === row.id)) continue;

    const suffix = DISAMBIGUATION_RULES[row.hiragana];
    if (!suffix) continue;

    const newMeaning = `${row.meaningId} ${suffix}`;
    updates.push({
      id: row.id,
      hiragana: row.hiragana,
      kanji: row.kanji,
      chapterNumber: row.chapterNumber,
      oldMeaning: row.meaningId,
      newMeaning,
    });
  }

  // ── Display update plan ──
  console.log("═══════════════════════════════════════════");
  console.log("  RENCANA UPDATE");
  console.log("═══════════════════════════════════════════\n");

  if (updates.length === 0) {
    console.log("  Tidak ada yang perlu diupdate.\n");
  } else {
    for (const u of updates.sort((a, b) => a.chapterNumber - b.chapterNumber)) {
      console.log(`  Bab ${u.chapterNumber}: ${u.hiragana}${u.kanji ? ` (${u.kanji})` : ""}`);
      console.log(`    BEFORE: "${u.oldMeaning}"`);
      console.log(`    AFTER:  "${u.newMeaning}"`);
      console.log();
    }
    console.log(`  Total: ${updates.length} vocabulary akan diupdate.\n`);
  }

  // ── Apply if --apply flag is set ──
  if (applyMode && updates.length > 0) {
    console.log("Applying updates...\n");
    let success = 0;
    for (const u of updates) {
      await db
        .update(vocabulary)
        .set({ meaningId: u.newMeaning })
        .where(eq(vocabulary.id, u.id));
      success++;
    }
    console.log(`Updated ${success}/${updates.length} rows.\n`);
  } else if (!applyMode && updates.length > 0) {
    console.log("Dry-run selesai. Jalankan dengan --apply untuk menerapkan perubahan.\n");
  }

  await client.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
