export type VocabQuestionType =
  | "meaning_to_word"
  | "word_to_meaning"
  | "audio_to_word"
  | "audio_to_meaning"
  | "kanji_to_hiragana"
  | "hiragana_to_kanji"
  | "fill_in_blank";

export type VocabQuizMode = "multiple_choice" | "typing";

export interface VocabQuizQuestion {
  number: number;
  type: VocabQuestionType;
  mode: VocabQuizMode;
  vocabularyId: string;
  questionText: string;
  questionLabel: string;
  options: string[];
  correctAnswer: string;
  audioUrl: string | null;
  hint: string;
}

export interface VocabQuizAnswer {
  questionNumber: number;
  questionType: VocabQuestionType;
  vocabularyId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface VocabQuizResult {
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  xpEarned: number;
  isPerfect: boolean;
  timeSpentMs: number;
  answers: VocabQuizAnswer[];
}
