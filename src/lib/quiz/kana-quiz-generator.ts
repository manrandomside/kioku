import type { KanaWithSrs } from "@/types/kana";
import type { QuizQuestion, KanaQuestionType } from "@/types/quiz";

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
  pool: KanaWithSrs[],
  exclude: KanaWithSrs,
  count: number,
  getField: (k: KanaWithSrs) => string
): string[] {
  const candidates = pool.filter(
    (k) => k.id !== exclude.id && getField(k) !== getField(exclude)
  );
  const shuffled = shuffle(candidates);
  return shuffled.slice(0, count).map(getField);
}

export function generateKanaQuiz(kanaPool: KanaWithSrs[]): QuizQuestion[] {
  if (kanaPool.length < OPTIONS_COUNT) {
    return [];
  }

  // Pick up to QUESTIONS_PER_SESSION kana, repeating if pool is small
  const shuffledPool = shuffle(kanaPool);
  const selectedKana: KanaWithSrs[] = [];
  for (let i = 0; i < QUESTIONS_PER_SESSION; i++) {
    selectedKana.push(shuffledPool[i % shuffledPool.length]);
  }

  const questionTypes: KanaQuestionType[] = ["meaning_to_word", "word_to_meaning"];

  return selectedKana.map((kana, index) => {
    const type = questionTypes[index % questionTypes.length];

    if (type === "meaning_to_word") {
      // Show romaji, pick the correct kana character
      const distractors = pickDistractors(
        kanaPool,
        kana,
        OPTIONS_COUNT - 1,
        (k) => k.character
      );
      const options = shuffle([kana.character, ...distractors]);

      return {
        number: index + 1,
        type,
        kanaId: kana.id,
        questionText: kana.romaji,
        options,
        correctAnswer: kana.character,
        character: kana.character,
        romaji: kana.romaji,
        audioUrl: kana.audioUrl,
      };
    }

    // word_to_meaning: Show kana character, pick the correct romaji
    const distractors = pickDistractors(
      kanaPool,
      kana,
      OPTIONS_COUNT - 1,
      (k) => k.romaji
    );
    const options = shuffle([kana.romaji, ...distractors]);

    return {
      number: index + 1,
      type,
      kanaId: kana.id,
      questionText: kana.character,
      options,
      correctAnswer: kana.romaji,
      character: kana.character,
      romaji: kana.romaji,
      audioUrl: kana.audioUrl,
    };
  });
}
