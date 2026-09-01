export type KanaQuestionType = "meaning_to_word" | "word_to_meaning";

export interface QuizQuestion {
  number: number;
  type: KanaQuestionType;
  kanaId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  character: string;
  romaji: string;
  audioUrl: string | null;
}

export interface QuizAnswer {
  questionNumber: number;
  questionType: KanaQuestionType;
  kanaId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

// Delivery state of the XP payload returned by the quiz submit action.
// The summary screen renders a skeleton, a value, or a retry prompt from this.
export type XpStatus = "loading" | "done" | "error";

export interface QuizSessionResult {
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  xpEarned: number;
  xpBaseXp?: number;
  xpBonusXp?: number;
  xpBonusLabel?: string;
  isPerfect: boolean;
  timeSpentMs: number;
  answers: QuizAnswer[];
}
