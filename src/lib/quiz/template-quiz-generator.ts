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

// Convert AI-generated templates into VocabQuizQuestion format
export function generateVocabQuizFromTemplates(
  templates: QuizTemplate[],
  vocabPool: VocabularyWithSrs[]
): VocabQuizQuestion[] {
  const vocabMap = new Map(vocabPool.map((v) => [v.id, v]));
  const shuffled = shuffle(templates);

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
