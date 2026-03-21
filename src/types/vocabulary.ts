export type WordType =
  | "noun"
  | "verb"
  | "i_adjective"
  | "na_adjective"
  | "adverb"
  | "particle"
  | "conjunction"
  | "expression"
  | "counter"
  | "prefix"
  | "suffix"
  | "pronoun"
  | "interjection";

export type VocabularyWithSrs = {
  id: string;
  kanji: string | null;
  hiragana: string;
  romaji: string;
  meaningId: string;
  meaningEn: string;
  wordType: WordType;
  jlptLevel: string;
  audioUrl: string | null;
  exampleJp: string | null;
  exampleId: string | null;
  sortOrder: number;
  srsStatus: "new" | "learning" | "review" | "relearning" | null;
};

export type ChapterWithProgress = {
  id: string;
  bookId: string;
  chapterNumber: number;
  slug: string;
  vocabCount: number;
  vocabSeen: number;
  vocabLearning: number;
  vocabReview: number;
  completionPercent: number;
  bestQuizScore: number | null;
};

export type BookWithChapters = {
  id: string;
  title: string;
  slug: string;
  jlptLevel: string;
  chapterStart: number;
  chapterEnd: number;
  chapters: ChapterWithProgress[];
};

export const WORD_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  noun: { label: "Kata Benda", className: "bg-word-noun/15 text-word-noun" },
  verb: { label: "Kata Kerja", className: "bg-word-verb/15 text-word-verb" },
  i_adjective: { label: "Adjektiva-i", className: "bg-word-i-adj/15 text-word-i-adj" },
  na_adjective: { label: "Adjektiva-na", className: "bg-word-na-adj/15 text-word-na-adj" },
  adverb: { label: "Adverbia", className: "bg-word-adverb/15 text-word-adverb" },
  particle: { label: "Partikel", className: "bg-muted-foreground/15 text-muted-foreground" },
  conjunction: { label: "Konjungsi", className: "bg-muted-foreground/15 text-muted-foreground" },
  expression: { label: "Ekspresi", className: "bg-muted-foreground/15 text-muted-foreground" },
  counter: { label: "Penghitung", className: "bg-muted-foreground/15 text-muted-foreground" },
  prefix: { label: "Awalan", className: "bg-muted-foreground/15 text-muted-foreground" },
  suffix: { label: "Akhiran", className: "bg-muted-foreground/15 text-muted-foreground" },
  pronoun: { label: "Kata Ganti", className: "bg-muted-foreground/15 text-muted-foreground" },
  interjection: { label: "Interjeksi", className: "bg-muted-foreground/15 text-muted-foreground" },
};

export const SRS_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: "Baru", className: "bg-srs-new/15 text-srs-new" },
  learning: { label: "Belajar", className: "bg-srs-learning/15 text-srs-learning" },
  review: { label: "Hafal", className: "bg-srs-review/15 text-srs-review" },
  relearning: { label: "Ulang", className: "bg-srs-relearning/15 text-srs-relearning" },
};
