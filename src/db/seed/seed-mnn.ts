import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "fs";
import { parse } from "yaml";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { book, chapter, vocabulary } from "../schema/content";

interface YamlEntry {
  id: [number, number];
  edition: number[];
  kanji: string | null;
  kana: string;
  romaji: string;
  meaning: { en: string; fr?: string };
}

// Detect word type from English meaning and kana patterns
function detectWordType(entry: YamlEntry): string {
  const en = entry.meaning.en.toLowerCase();
  const kana = entry.kana;

  // Verb patterns: ends with ます, contains "to " at start of meaning
  if (en.startsWith("to ") || en.startsWith("[to ") || kana.endsWith("ます") || kana.endsWith("る")) {
    if (en.startsWith("to ") || en.startsWith("[to ")) return "verb";
  }

  // i-adjective: kana ends with い and meaning contains adjective-like words
  if (kana.endsWith("い") && !kana.endsWith("きれい") && en.match(/^(big|small|new|old|good|bad|hot|cold|high|low|long|short|expensive|cheap|interesting|boring|difficult|easy|busy|fun|beautiful|fast|slow|wide|narrow|heavy|light|thick|thin|sweet|sour|salty|spicy|young|near|far|dark|bright|delicious|famous|warm|cool)/i)) {
    return "i_adjective";
  }

  // na-adjective patterns
  if (en.match(/^(quiet|convenient|kind|famous|lively|various|necessary|important|safe|free|simple|special|wonderful|strange)/i)) {
    return "na_adjective";
  }

  // Adverb patterns
  if (en.match(/^(very|always|sometimes|often|usually|already|still|also|about|more|most|first|together|slowly|quickly|immediately|especially)/i)) {
    return "adverb";
  }

  // Expression patterns
  if (en.includes("(used ") || en.includes("(lit.") || en.endsWith(".") || en.endsWith(".)") ||
      kana.includes("ます") || kana.includes("ください") || kana.includes("ません")) {
    if (en.length > 30 || kana.includes("。")) return "expression";
  }

  // Particle
  if (kana.startsWith("～") && kana.length <= 3) return "particle";

  // Counter
  if (en.includes("counter for") || en.match(/^\d|^-.*counter/)) return "counter";

  // Conjunction
  if (en.match(/^(but|and|or|so|because|therefore|however|if|when|although|though)/i) && en.length < 30) {
    return "conjunction";
  }

  // Interjection
  if (en.match(/^(oh|ah|well|hey|wow|er\b|hmm|yes|no$|no,)/i) && en.length < 20) {
    return "interjection";
  }

  // Pronoun
  if (en.match(/^(I$|I,|you$|you |he$|she$|we$|they$|this |that |these|those|who$|what$)/i) && en.length < 40) {
    return "pronoun";
  }

  return "noun";
}

// Clean kana: remove brackets, notes, and normalize
function cleanKana(kana: string): string {
  return kana
    .replace(/（[^）]*）/g, "")     // Remove Japanese parenthetical notes
    .replace(/\([^)]*\)/g, "")      // Remove English parenthetical notes
    .replace(/［[^］]*］/g, "")     // Remove Japanese bracket notes
    .replace(/\[[^\]]*\]/g, "")     // Remove English bracket notes
    .replace(/～/g, "")             // Remove tilde
    .replace(/／.*$/g, "")          // Take first of slash-separated entries
    .replace(/。/g, "")             // Remove period
    .replace(/\s+/g, "")            // Remove whitespace
    .trim();
}

function cleanKanji(kanji: string | null): string | null {
  if (!kanji) return null;
  return kanji
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/［[^］]*］/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/～/g, "")
    .replace(/／.*$/g, "")
    .replace(/。/g, "")
    .replace(/\s+/g, "")
    .trim() || null;
}

function cleanRomaji(romaji: string): string {
  return romaji
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/~|～/g, "")
    .replace(/\/.*$/g, "")
    .replace(/\.\s*$/g, "")
    .trim();
}

async function seedMNN() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[seed-mnn] DATABASE_URL is not set");
    process.exit(1);
  }

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  // Read and parse YAML
  const raw = readFileSync("src/db/seed/minna-no-ds.yaml", "utf8");
  const data = parse(raw);

  // Step 1: Create books
  console.log("[seed-mnn] Creating books...");
  const [book1] = await db
    .insert(book)
    .values({
      title: "Minna no Nihongo Shokyuu I",
      slug: "mnn-1",
      jlptLevel: "N5",
      chapterStart: 1,
      chapterEnd: 25,
    })
    .onConflictDoNothing({ target: book.slug })
    .returning();

  const [book2] = await db
    .insert(book)
    .values({
      title: "Minna no Nihongo Shokyuu II",
      slug: "mnn-2",
      jlptLevel: "N4",
      chapterStart: 26,
      chapterEnd: 50,
    })
    .onConflictDoNothing({ target: book.slug })
    .returning();

  // If books already exist, fetch them
  let book1Id = book1?.id;
  let book2Id = book2?.id;

  if (!book1Id || !book2Id) {
    const existingBooks = await db.select().from(book);
    for (const b of existingBooks) {
      if (b.slug === "mnn-1") book1Id = b.id;
      if (b.slug === "mnn-2") book2Id = b.id;
    }
  }

  console.log(`[seed-mnn] Book 1 ID: ${book1Id}`);
  console.log(`[seed-mnn] Book 2 ID: ${book2Id}`);

  // Step 2: Create chapters
  console.log("[seed-mnn] Creating chapters...");
  const chapterIds: Record<number, string> = {};

  for (let i = 1; i <= 50; i++) {
    const bookId = i <= 25 ? book1Id! : book2Id!;
    const lessonKey = `lesson-${String(i).padStart(2, "0")}`;
    const entries = data[lessonKey] as YamlEntry[];

    const [ch] = await db
      .insert(chapter)
      .values({
        bookId,
        chapterNumber: i,
        slug: `bab-${i}`,
        vocabCount: entries.length,
      })
      .onConflictDoNothing({ target: chapter.slug })
      .returning();

    if (ch) {
      chapterIds[i] = ch.id;
    }
  }

  // Fetch existing chapters if some were skipped
  if (Object.keys(chapterIds).length < 50) {
    const existingChapters = await db.select().from(chapter);
    for (const ch of existingChapters) {
      chapterIds[ch.chapterNumber] = ch.id;
    }
  }

  console.log(`[seed-mnn] Created/found ${Object.keys(chapterIds).length} chapters`);

  // Step 3: Insert vocabulary
  console.log("[seed-mnn] Inserting vocabulary...");
  let totalInserted = 0;

  for (let lessonNum = 1; lessonNum <= 50; lessonNum++) {
    const lessonKey = `lesson-${String(lessonNum).padStart(2, "0")}`;
    const entries = data[lessonKey] as YamlEntry[];
    const chapterId = chapterIds[lessonNum];
    const jlptLevel = lessonNum <= 25 ? "N5" : "N4";

    if (!chapterId) {
      console.error(`[seed-mnn] No chapter ID for lesson ${lessonNum}`);
      continue;
    }

    const vocabRows = entries.map((entry, index) => {
      const hiragana = cleanKana(entry.kana);
      const kanji = cleanKanji(entry.kanji);
      const romaji = cleanRomaji(entry.romaji);
      const meaningEn = entry.meaning.en;
      const wordType = detectWordType(entry);

      return {
        chapterId,
        kanji,
        hiragana,
        romaji,
        meaningId: meaningEn,  // English as placeholder; Indonesian translations added later
        meaningEn,
        wordType: wordType as typeof vocabulary.$inferInsert.wordType,
        jlptLevel: jlptLevel as typeof vocabulary.$inferInsert.jlptLevel,
        sortOrder: index + 1,
      };
    });

    const result = await db.insert(vocabulary).values(vocabRows).onConflictDoNothing();
    totalInserted += result.count;
    console.log(`[seed-mnn] Lesson ${lessonNum}: ${result.count}/${entries.length} inserted`);
  }

  console.log(`[seed-mnn] Total vocabulary inserted: ${totalInserted}`);
  await client.end();
  console.log("[seed-mnn] Done");
}

seedMNN().catch((err) => {
  console.error("[seed-mnn] Error:", err);
  process.exit(1);
});
