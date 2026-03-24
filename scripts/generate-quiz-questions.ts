// Build-time script to pre-generate AI quiz questions for all vocabulary.
// Usage: npx tsx scripts/generate-quiz-questions.ts
//
// Requires DATABASE_URL and at least one AI provider API key in .env.local
// Idempotent: skips vocabulary that already has templates in the database.

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { eq, and, asc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { chapter, vocabulary } from "../src/db/schema/content";
import { aiQuestionTemplate } from "../src/db/schema/ai";
import { callAI } from "../src/lib/ai/waterfall";

// -- Types -------------------------------------------------------------------

interface VocabItem {
  id: string;
  kanji: string | null;
  hiragana: string;
  romaji: string;
  meaningId: string;
  meaningEn: string;
  wordType: string;
  chapterNumber: number;
}

interface GeneratedQuestion {
  questionType:
    | "meaning_to_word"
    | "word_to_meaning"
    | "fill_in_blank";
  questionText: string;
  correctAnswer: string;
  wrongAnswers: string[];
}

// -- Config ------------------------------------------------------------------

const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES_MS = 2000;
const AI_MAX_TOKENS = 2048;
const AI_TEMPERATURE = 0.4;

// -- DB connection (standalone, not using Next.js runtime) --------------------

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.local values.");
  }
  const client = postgres(connectionString, { prepare: false });
  return { db: drizzle(client, { schema }), client };
}

// -- AI prompt ---------------------------------------------------------------

function buildPrompt(batch: VocabItem[]): string {
  const vocabList = batch
    .map(
      (v, i) =>
        `${i + 1}. ${v.hiragana}${v.kanji ? ` (${v.kanji})` : ""} [${v.romaji}] - "${v.meaningId}" (${v.wordType}, Bab ${v.chapterNumber})`
    )
    .join("\n");

  return `Kamu adalah generator soal kuis bahasa Jepang untuk pelajar Indonesia level N5 (pemula).
Untuk setiap kata di bawah, buatkan 3 soal kuis dengan format JSON.

DAFTAR KATA:
${vocabList}

UNTUK SETIAP KATA, BUAT 3 SOAL:

1. jp_to_id_choice (tipe: "word_to_meaning")
   - questionText: kata Jepang (gunakan kanji jika ada, hiragana jika tidak)
   - correctAnswer: arti dalam Bahasa Indonesia
   - wrongAnswers: 3 arti Indonesia yang plausible tapi salah (kata-kata yang mirip tema/level)

2. id_to_jp_choice (tipe: "meaning_to_word")
   - questionText: arti dalam Bahasa Indonesia
   - correctAnswer: kata Jepang (gunakan kanji jika ada, hiragana jika tidak)
   - wrongAnswers: 3 kata Jepang lain yang plausible (dari level/bab yang sama)

3. fill_blank (tipe: "fill_in_blank")
   - questionText: kalimat Jepang sederhana dengan ___ menggantikan kata target. Tulis dalam hiragana (boleh campur kanji sederhana). Tambahkan terjemahan Indonesia di dalam kurung.
   - correctAnswer: kata target dalam hiragana
   - wrongAnswers: 3 kata Jepang lain dalam hiragana yang bisa masuk secara gramatikal tapi salah artinya

ATURAN PENTING:
- wrongAnswers harus array of 3 strings, plausible tapi jelas salah
- Kalimat fill_blank harus natural dan sederhana (level N5)
- Output HANYA JSON array, tanpa markdown code block, tanpa penjelasan
- Format: array of objects, setiap object punya: vocabIndex (1-based), questionType, questionText, correctAnswer, wrongAnswers

Contoh output format:
[
  {"vocabIndex":1,"questionType":"word_to_meaning","questionText":"食べる","correctAnswer":"makan","wrongAnswers":["minum","tidur","berjalan"]},
  {"vocabIndex":1,"questionType":"meaning_to_word","questionText":"makan","correctAnswer":"食べる","wrongAnswers":["飲む","寝る","歩く"]},
  {"vocabIndex":1,"questionType":"fill_in_blank","questionText":"わたしは ごはんを ___。(Saya makan nasi.)","correctAnswer":"たべます","wrongAnswers":["のみます","ねます","あるきます"]}
]`;
}

// -- Parse AI response -------------------------------------------------------

function parseAIResponse(
  response: string,
  batch: VocabItem[]
): Map<number, GeneratedQuestion[]> {
  const result = new Map<number, GeneratedQuestion[]>();

  // Strip markdown code fences if present
  let cleaned = response.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  let parsed: Array<{
    vocabIndex: number;
    questionType: string;
    questionText: string;
    correctAnswer: string;
    wrongAnswers: string[];
  }>;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("  [ERROR] Gagal parse JSON dari AI response");
    return result;
  }

  if (!Array.isArray(parsed)) {
    console.error("  [ERROR] AI response bukan array");
    return result;
  }

  for (const item of parsed) {
    const idx = item.vocabIndex;
    if (
      typeof idx !== "number" ||
      idx < 1 ||
      idx > batch.length ||
      !item.questionType ||
      !item.questionText ||
      !item.correctAnswer ||
      !Array.isArray(item.wrongAnswers) ||
      item.wrongAnswers.length < 3
    ) {
      continue;
    }

    // Validate questionType
    const validTypes = ["word_to_meaning", "meaning_to_word", "fill_in_blank"];
    if (!validTypes.includes(item.questionType)) continue;

    const questions = result.get(idx) ?? [];
    questions.push({
      questionType: item.questionType as GeneratedQuestion["questionType"],
      questionText: item.questionText,
      correctAnswer: item.correctAnswer,
      wrongAnswers: item.wrongAnswers.slice(0, 3),
    });
    result.set(idx, questions);
  }

  return result;
}

// -- Main --------------------------------------------------------------------

async function main() {
  console.log("=== Kioku: AI Quiz Question Generator ===\n");

  const { db, client } = createDb();

  try {
    // Fetch all chapters ordered by number
    const chapters = await db
      .select({
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
      })
      .from(chapter)
      .orderBy(asc(chapter.chapterNumber));

    console.log(`Ditemukan ${chapters.length} bab.\n`);

    let totalGenerated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const chap of chapters) {
      // Fetch vocabulary for this chapter
      const vocabRows = await db
        .select({
          id: vocabulary.id,
          kanji: vocabulary.kanji,
          hiragana: vocabulary.hiragana,
          romaji: vocabulary.romaji,
          meaningId: vocabulary.meaningId,
          meaningEn: vocabulary.meaningEn,
          wordType: vocabulary.wordType,
        })
        .from(vocabulary)
        .where(eq(vocabulary.chapterId, chap.id))
        .orderBy(asc(vocabulary.sortOrder));

      if (vocabRows.length === 0) {
        console.log(`Bab ${chap.chapterNumber}: tidak ada kosakata, skip.`);
        continue;
      }

      // Check which vocabulary already has templates (resume support)
      const existingTemplates = await db
        .select({ vocabularyId: aiQuestionTemplate.vocabularyId })
        .from(aiQuestionTemplate)
        .where(
          inArray(
            aiQuestionTemplate.vocabularyId,
            vocabRows.map((v) => v.id)
          )
        );

      const existingVocabIds = new Set(
        existingTemplates.map((t) => t.vocabularyId)
      );

      // Filter to only vocab without templates
      const vocabToProcess: VocabItem[] = vocabRows
        .filter((v) => !existingVocabIds.has(v.id))
        .map((v) => ({
          ...v,
          chapterNumber: chap.chapterNumber,
        }));

      const skippedCount = vocabRows.length - vocabToProcess.length;
      totalSkipped += skippedCount;

      if (vocabToProcess.length === 0) {
        console.log(
          `Bab ${chap.chapterNumber}: semua ${vocabRows.length} kata sudah punya template, skip.`
        );
        continue;
      }

      console.log(
        `Bab ${chap.chapterNumber}: ${vocabToProcess.length} kata perlu diproses` +
          (skippedCount > 0 ? ` (${skippedCount} sudah ada)` : "") +
          "..."
      );

      // Process in batches
      for (let i = 0; i < vocabToProcess.length; i += BATCH_SIZE) {
        const batch = vocabToProcess.slice(i, i + BATCH_SIZE);
        const batchEnd = Math.min(i + BATCH_SIZE, vocabToProcess.length);

        process.stdout.write(
          `  Generating questions for Bab ${chap.chapterNumber}... (${batchEnd}/${vocabToProcess.length} words done)\r`
        );

        try {
          const prompt = buildPrompt(batch);
          const aiResult = await callAI(prompt, {
            maxTokens: AI_MAX_TOKENS,
            temperature: AI_TEMPERATURE,
          });

          const questionsMap = parseAIResponse(aiResult.response, batch);

          // Insert generated questions into database
          const inserts: Array<{
            vocabularyId: string;
            questionType:
              | "meaning_to_word"
              | "word_to_meaning"
              | "fill_in_blank"
              | "audio_to_word"
              | "audio_to_meaning"
              | "kanji_to_hiragana"
              | "hiragana_to_kanji";
            questionText: string;
            correctAnswer: string;
            wrongAnswers: string[];
          }> = [];

          for (let j = 0; j < batch.length; j++) {
            const vocabItem = batch[j];
            const questions = questionsMap.get(j + 1);
            if (!questions || questions.length === 0) {
              totalFailed++;
              continue;
            }

            for (const q of questions) {
              inserts.push({
                vocabularyId: vocabItem.id,
                questionType: q.questionType,
                questionText: q.questionText,
                correctAnswer: q.correctAnswer,
                wrongAnswers: q.wrongAnswers,
              });
            }

            totalGenerated++;
          }

          if (inserts.length > 0) {
            await db.insert(aiQuestionTemplate).values(inserts);
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          console.error(
            `\n  [ERROR] Batch gagal (Bab ${chap.chapterNumber}, kata ${i + 1}-${batchEnd}): ${message}`
          );
          totalFailed += batch.length;
        }

        // Delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < vocabToProcess.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS)
          );
        }
      }

      console.log(
        `  Bab ${chap.chapterNumber} selesai.                                    `
      );
    }

    // Summary
    console.log("\n=== Ringkasan ===");
    console.log(`Kata berhasil di-generate : ${totalGenerated}`);
    console.log(`Kata sudah ada (skip)     : ${totalSkipped}`);
    console.log(`Kata gagal                : ${totalFailed}`);
    console.log("Selesai.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
