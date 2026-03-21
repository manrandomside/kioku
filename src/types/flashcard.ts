import type { KanaWithSrs } from "@/types/kana";
import type { SrsRating, SchedulingPreview } from "@/lib/srs/fsrs-engine";

export interface FlashcardSessionState {
  cards: KanaWithSrs[];
  currentIndex: number;
  isFlipped: boolean;
  isCompleted: boolean;
  reviewStartTime: number;
  results: FlashcardResult[];
}

export interface FlashcardResult {
  kanaId: string;
  rating: SrsRating;
  prevStatus: string;
  newStatus: string;
}

export interface SessionSummary {
  totalReviewed: number;
  newLearned: number;
  lapses: number;
}

export type { SrsRating, SchedulingPreview };
