import type { VocabularyWithSrs } from "@/types/vocabulary";
import type { VocabQuizQuestion, VocabQuestionType } from "@/types/vocab-quiz";
import type { QuizTemplate } from "@/lib/queries/quiz-templates";

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getQuestionLabel(type: VocabQuestionType): string {
  switch (type) {
    case "word_to_meaning":
      return "Pilih arti yang benar";
    case "meaning_to_word":
      return "Pilih kata Jepang yang benar";
    case "fill_in_blank":
      return "Lengkapi kalimat";
    default:
      return "Pilih jawaban yang benar";
  }
}

const KANJI_TYPES: VocabQuestionType[] = ["kanji_to_hiragana", "hiragana_to_kanji"];

// Convert AI-generated templates into VocabQuizQuestion format
export function generateVocabQuizFromTemplates(
  templates: QuizTemplate[],
  vocabPool: VocabularyWithSrs[],
  displayMode: "kanji" | "kana" = "kanji"
): VocabQuizQuestion[] {
  const vocabMap = new Map(vocabPool.map((v) => [v.id, v]));

  // Filter out kanji-specific types in kana mode
  const filtered = displayMode === "kana"
    ? templates.filter((t) => !KANJI_TYPES.includes(t.questionType as VocabQuestionType))
    : templates;

  const shuffled = shuffle(filtered);

  return shuffled.map((template, index) => {
    const vocab = vocabMap.get(template.vocabularyId);
    const type = template.questionType as VocabQuestionType;
    const isFillBlank = type === "fill_in_blank";

    const options = isFillBlank
      ? []
      : shuffle([template.correctAnswer, ...template.wrongAnswers]);

    return {
      number: index + 1,
      type,
      mode: isFillBlank ? "typing" : "multiple_choice",
      vocabularyId: template.vocabularyId,
      questionText: template.questionText,
      questionLabel: getQuestionLabel(type),
      options,
      correctAnswer: template.correctAnswer,
      audioUrl: vocab?.audioUrl ?? null,
      hint: vocab?.romaji ?? "",
    } satisfies VocabQuizQuestion;
  });
}
