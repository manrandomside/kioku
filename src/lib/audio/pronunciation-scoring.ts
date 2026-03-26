// Pronunciation scoring using multi-strategy comparison

import { kanjiToHiragana as KANJI_READINGS } from "./kanji-hiragana-dict";

export interface PronunciationResult {
  score: number;
  isCorrect: boolean;
  feedback: string;
}

// Hiragana → romaji mapping (including dakuten, handakuten, combo)
const HIRAGANA_MAP: Record<string, string> = {
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
  // Handakuten
  "ぱ": "pa", "ぴ": "pi", "ぷ": "pu", "ぺ": "pe", "ぽ": "po",
  // Small kana (used in combos)
  "ぁ": "a", "ぃ": "i", "ぅ": "u", "ぇ": "e", "ぉ": "o",
  "っ": "tt", // Double consonant marker
  "ゃ": "ya", "ゅ": "yu", "ょ": "yo",
};

// Combo hiragana (must be checked before single chars)
const HIRAGANA_COMBOS: [string, string][] = [
  // K-combos
  ["きゃ", "kya"], ["きゅ", "kyu"], ["きょ", "kyo"],
  // S-combos
  ["しゃ", "sha"], ["しゅ", "shu"], ["しょ", "sho"],
  // C-combos
  ["ちゃ", "cha"], ["ちゅ", "chu"], ["ちょ", "cho"],
  // N-combos
  ["にゃ", "nya"], ["にゅ", "nyu"], ["にょ", "nyo"],
  // H-combos
  ["ひゃ", "hya"], ["ひゅ", "hyu"], ["ひょ", "hyo"],
  // M-combos
  ["みゃ", "mya"], ["みゅ", "myu"], ["みょ", "myo"],
  // R-combos
  ["りゃ", "rya"], ["りゅ", "ryu"], ["りょ", "ryo"],
  // G-combos
  ["ぎゃ", "gya"], ["ぎゅ", "gyu"], ["ぎょ", "gyo"],
  // J-combos
  ["じゃ", "ja"], ["じゅ", "ju"], ["じょ", "jo"],
  // B-combos
  ["びゃ", "bya"], ["びゅ", "byu"], ["びょ", "byo"],
  // P-combos
  ["ぴゃ", "pya"], ["ぴゅ", "pyu"], ["ぴょ", "pyo"],
];

// Katakana → hiragana offset (Unicode)
const KATAKANA_START = 0x30A0;
const HIRAGANA_START = 0x3040;

function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - KATAKANA_START + HIRAGANA_START)
  );
}

// Convert any Japanese text (hiragana, katakana, or mixed) to romaji
export function kanaToRomaji(text: string): string {
  // First convert katakana to hiragana
  let s = katakanaToHiragana(text);
  let result = "";

  while (s.length > 0) {
    // Try combos first (2-char)
    let matched = false;
    if (s.length >= 2) {
      const pair = s.slice(0, 2);
      for (const [kana, romaji] of HIRAGANA_COMBOS) {
        if (pair === kana) {
          result += romaji;
          s = s.slice(2);
          matched = true;
          break;
        }
      }
    }
    if (matched) continue;

    // Try single char
    const ch = s[0];
    const rom = HIRAGANA_MAP[ch];
    if (rom) {
      // Handle っ (double consonant): peek next char
      if (ch === "っ" && s.length > 1) {
        const nextRom = HIRAGANA_MAP[s[1]];
        if (nextRom && nextRom.length > 0) {
          result += nextRom[0]; // Double the first consonant of next char
          s = s.slice(1);
          continue;
        }
      }
      result += rom;
    } else {
      // Non-kana character (kanji, punctuation, etc.) — pass through
      result += ch;
    }
    s = s.slice(1);
  }

  return result;
}

// Try to convert kanji to hiragana using known readings (~1766 entries)
function kanjiToHiragana(text: string): string {
  let result = text;
  // Sort by length descending so longer compounds match first
  const entries = Object.entries(KANJI_READINGS).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [kanji, reading] of entries) {
    result = result.split(kanji).join(reading);
  }
  return result;
}

// Normalize text for comparison
function normalize(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, "")
    .normalize("NFKC");
}

// Standard Levenshtein distance
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

// Calculate Levenshtein-based percentage score
function levenshteinScore(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 100;
  const dist = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return Math.round(Math.max(0, (1 - dist / maxLen) * 100));
}

const CORRECT_THRESHOLD = 70;

export interface PronunciationOptions {
  kanji?: string | null;
  romaji?: string | null;
}

export function calculatePronunciationScore(
  expected: string,
  recognized: string,
  options?: PronunciationOptions
): PronunciationResult {
  const normExpected = normalize(expected);
  const normRecognized = normalize(recognized);

  if (!normExpected || !normRecognized) {
    return {
      score: 0,
      isCorrect: false,
      feedback: "Tidak ada suara yang terdeteksi. Coba bicara lebih keras.",
    };
  }

  // Exact match (fast path)
  if (normExpected === normRecognized) {
    return { score: 100, isCorrect: true, feedback: "Pengucapan sempurna!" };
  }

  const scores: number[] = [];
  const words = recognized.trim().split(/[\s、。,]+/);
  const firstWord = words[0] ? normalize(words[0]) : "";

  // --- Kanji-based strategies (most reliable for Speech API) ---
  // Speech API almost always returns kanji. If we know the expected kanji,
  // direct comparison is the most accurate strategy.
  const expectedKanji = options?.kanji ? normalize(options.kanji) : null;

  if (expectedKanji) {
    // Strategy K1: recognized vs expected kanji (exact or fuzzy)
    scores.push(levenshteinScore(expectedKanji, normRecognized));

    // Strategy K2: first word of recognized vs expected kanji
    if (firstWord) {
      scores.push(levenshteinScore(expectedKanji, firstWord));
    }

    // Strategy K3: recognized contains expected kanji
    if (normRecognized.includes(expectedKanji)) {
      scores.push(95);
    }

    // Strategy K4: check each word individually against kanji
    for (const word of words) {
      const normWord = normalize(word);
      if (normWord === expectedKanji) {
        scores.push(100);
        break;
      }
      scores.push(levenshteinScore(expectedKanji, normWord));
    }
  }

  // --- Hiragana-based strategies ---
  const recHiragana = normalize(katakanaToHiragana(kanjiToHiragana(normRecognized)));
  const expHiragana = normalize(katakanaToHiragana(normExpected));

  // Strategy H1: Direct hiragana comparison
  scores.push(levenshteinScore(expHiragana, recHiragana));

  // Strategy H2: First word hiragana
  if (firstWord) {
    const firstWordHiragana = normalize(katakanaToHiragana(kanjiToHiragana(firstWord)));
    scores.push(levenshteinScore(expHiragana, firstWordHiragana));
  }

  // Strategy H3: Contains check
  if (recHiragana.includes(expHiragana)) {
    scores.push(95);
  }

  // --- Romaji-based strategies ---
  const expectedRomaji = options?.romaji
    ? normalize(options.romaji).toLowerCase()
    : kanaToRomaji(expHiragana).toLowerCase();
  const recognizedRomaji = kanaToRomaji(recHiragana).toLowerCase();

  // Strategy R1: Full romaji comparison
  scores.push(levenshteinScore(expectedRomaji, recognizedRomaji));

  // Strategy R2: First word romaji
  if (firstWord) {
    const firstWordHiragana = normalize(katakanaToHiragana(kanjiToHiragana(firstWord)));
    const firstWordRomaji = kanaToRomaji(firstWordHiragana).toLowerCase();
    scores.push(levenshteinScore(expectedRomaji, firstWordRomaji));
  }

  // Strategy R3: Romaji contains check
  if (recognizedRomaji.includes(expectedRomaji) && expectedRomaji.length >= 2) {
    scores.push(95);
  }

  // --- Per-word hiragana check ---
  for (const word of words) {
    const wordHiragana = normalize(katakanaToHiragana(kanjiToHiragana(word)));
    if (wordHiragana === expHiragana) {
      scores.push(100);
      break;
    }
    scores.push(levenshteinScore(expHiragana, wordHiragana));
  }

  const score = Math.max(...scores);
  const isCorrect = score >= CORRECT_THRESHOLD;

  let feedback: string;
  if (score >= 90) {
    feedback = "Pengucapan sempurna!";
  } else if (score >= 70) {
    feedback = "Cukup bagus! Coba lagi untuk hasil lebih baik.";
  } else if (score >= 50) {
    feedback = "Hampir tepat. Perhatikan pengucapan setiap suku kata.";
  } else {
    feedback = "Coba dengarkan contoh audio dan ulangi.";
  }

  return { score, isCorrect, feedback };
}
