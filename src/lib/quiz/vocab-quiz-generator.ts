import type { VocabularyWithSrs } from "@/types/vocabulary";
import type { VocabQuizQuestion, VocabQuestionType } from "@/types/vocab-quiz";

const QUESTIONS_PER_SESSION = 20;
const OPTIONS_COUNT = 4;

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickDistractors(
  pool: VocabularyWithSrs[],
  exclude: VocabularyWithSrs,
  count: number,
  getField: (v: VocabularyWithSrs) => string
): string[] {
  const excludeVal = getField(exclude);
  const candidates = pool.filter(
    (v) => v.id !== exclude.id && getField(v) !== excludeVal
  );
  return shuffle(candidates).slice(0, count).map(getField);
}

function getDisplayWord(v: VocabularyWithSrs): string {
  return v.kanji || v.hiragana;
}

// Determine which question types are available for a given vocab pool
function getAvailableTypes(pool: VocabularyWithSrs[]): VocabQuestionType[] {
  const types: VocabQuestionType[] = [
    "meaning_to_word",
    "word_to_meaning",
  ];

  // audio types only if some vocab have audio
  if (pool.some((v) => v.audioUrl)) {
    types.push("audio_to_word", "audio_to_meaning");
  }

  // kanji types only if enough vocab have kanji
  const withKanji = pool.filter((v) => v.kanji);
  if (withKanji.length >= OPTIONS_COUNT) {
    types.push("kanji_to_hiragana", "hiragana_to_kanji");
  }

  // fill_in_blank always available
  types.push("fill_in_blank");

  return types;
}

function buildQuestion(
  vocab: VocabularyWithSrs,
  pool: VocabularyWithSrs[],
  type: VocabQuestionType,
  number: number
): VocabQuizQuestion | null {
  switch (type) {
    case "meaning_to_word": {
      // Show meaning, pick the correct Japanese word
      const distractors = pickDistractors(pool, vocab, OPTIONS_COUNT - 1, getDisplayWord);
      if (distractors.length < OPTIONS_COUNT - 1) return null;
      return {
        number,
        type,
        mode: "multiple_choice",
        vocabularyId: vocab.id,
        questionText: vocab.meaningId,
        questionLabel: "Pilih kata Jepang yang benar",
        options: shuffle([getDisplayWord(vocab), ...distractors]),
        correctAnswer: getDisplayWord(vocab),
        audioUrl: vocab.audioUrl,
        hint: vocab.romaji,
      };
    }

    case "word_to_meaning": {
      // Show Japanese word, pick the correct meaning
      const distractors = pickDistractors(pool, vocab, OPTIONS_COUNT - 1, (v) => v.meaningId);
      if (distractors.length < OPTIONS_COUNT - 1) return null;
      return {
        number,
        type,
        mode: "multiple_choice",
        vocabularyId: vocab.id,
        questionText: getDisplayWord(vocab),
        questionLabel: "Pilih arti yang benar",
        options: shuffle([vocab.meaningId, ...distractors]),
        correctAnswer: vocab.meaningId,
        audioUrl: vocab.audioUrl,
        hint: vocab.romaji,
      };
    }

    case "audio_to_word": {
      // Play audio, pick the correct Japanese word
      if (!vocab.audioUrl) return null;
      const distractors = pickDistractors(pool, vocab, OPTIONS_COUNT - 1, getDisplayWord);
      if (distractors.length < OPTIONS_COUNT - 1) return null;
      return {
        number,
        type,
        mode: "multiple_choice",
        vocabularyId: vocab.id,
        questionText: "",
        questionLabel: "Dengarkan dan pilih kata yang benar",
        options: shuffle([getDisplayWord(vocab), ...distractors]),
        correctAnswer: getDisplayWord(vocab),
        audioUrl: vocab.audioUrl,
        hint: vocab.meaningId,
      };
    }

    case "audio_to_meaning": {
      // Play audio, pick the correct meaning
      if (!vocab.audioUrl) return null;
      const distractors = pickDistractors(pool, vocab, OPTIONS_COUNT - 1, (v) => v.meaningId);
      if (distractors.length < OPTIONS_COUNT - 1) return null;
      return {
        number,
        type,
        mode: "multiple_choice",
        vocabularyId: vocab.id,
        questionText: "",
        questionLabel: "Dengarkan dan pilih artinya",
        options: shuffle([vocab.meaningId, ...distractors]),
        correctAnswer: vocab.meaningId,
        audioUrl: vocab.audioUrl,
        hint: getDisplayWord(vocab),
      };
    }

    case "kanji_to_hiragana": {
      // Show kanji, pick the correct hiragana
      if (!vocab.kanji) return null;
      const kanjiPool = pool.filter((v) => v.kanji);
      const distractors = pickDistractors(kanjiPool, vocab, OPTIONS_COUNT - 1, (v) => v.hiragana);
      if (distractors.length < OPTIONS_COUNT - 1) return null;
      return {
        number,
        type,
        mode: "multiple_choice",
        vocabularyId: vocab.id,
        questionText: vocab.kanji,
        questionLabel: "Pilih cara baca (hiragana) yang benar",
        options: shuffle([vocab.hiragana, ...distractors]),
        correctAnswer: vocab.hiragana,
        audioUrl: vocab.audioUrl,
        hint: vocab.meaningId,
      };
    }

    case "hiragana_to_kanji": {
      // Show hiragana, pick the correct kanji
      if (!vocab.kanji) return null;
      const kanjiPool = pool.filter((v) => v.kanji);
      const distractors = pickDistractors(kanjiPool, vocab, OPTIONS_COUNT - 1, (v) => v.kanji!);
      if (distractors.length < OPTIONS_COUNT - 1) return null;
      return {
        number,
        type,
        mode: "multiple_choice",
        vocabularyId: vocab.id,
        questionText: vocab.hiragana,
        questionLabel: "Pilih kanji yang benar",
        options: shuffle([vocab.kanji, ...distractors]),
        correctAnswer: vocab.kanji,
        audioUrl: vocab.audioUrl,
        hint: vocab.meaningId,
      };
    }

    case "fill_in_blank": {
      // Type the hiragana for the given meaning
      return {
        number,
        type,
        mode: "typing",
        vocabularyId: vocab.id,
        questionText: vocab.meaningId,
        questionLabel: "Ketik dalam hiragana",
        options: [],
        correctAnswer: vocab.hiragana,
        audioUrl: vocab.audioUrl,
        hint: vocab.romaji,
      };
    }

    default:
      return null;
  }
}

export function generateVocabQuiz(vocabPool: VocabularyWithSrs[]): VocabQuizQuestion[] {
  if (vocabPool.length < OPTIONS_COUNT) {
    return [];
  }

  const availableTypes = getAvailableTypes(vocabPool);
  const shuffledPool = shuffle(vocabPool);
  const questions: VocabQuizQuestion[] = [];

  for (let i = 0; i < QUESTIONS_PER_SESSION && questions.length < QUESTIONS_PER_SESSION; i++) {
    const vocab = shuffledPool[i % shuffledPool.length];
    // Cycle through available types, but try to build; skip if null
    const typeIndex = i % availableTypes.length;
    const type = availableTypes[typeIndex];

    const question = buildQuestion(vocab, vocabPool, type, questions.length + 1);
    if (question) {
      questions.push(question);
    } else {
      // Fallback to meaning_to_word if the chosen type fails
      const fallback = buildQuestion(vocab, vocabPool, "meaning_to_word", questions.length + 1);
      if (fallback) {
        questions.push(fallback);
      }
    }
  }

  return questions;
}
