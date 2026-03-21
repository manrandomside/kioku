import {
  fsrs,
  createEmptyCard,
  Rating,
  State,
  type Card as FSRSCard,
  type RecordLogItem,
} from "ts-fsrs";

const scheduler = fsrs();

// Map ts-fsrs State enum to our DB enum strings
const STATE_TO_DB: Record<number, "new" | "learning" | "review" | "relearning"> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

// Map our DB enum strings to ts-fsrs State enum
const DB_TO_STATE: Record<string, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};

// Map our DB rating strings to ts-fsrs Rating enum
const DB_TO_RATING: Record<string, Rating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export type SrsRating = "again" | "hard" | "good" | "easy";

export interface SrsCardData {
  status: "new" | "learning" | "review" | "relearning";
  stability: number;
  difficulty: number;
  dueDate: string;
  scheduledDays: number;
  reps: number;
  lapses: number;
}

export interface SchedulingPreview {
  rating: SrsRating;
  intervalLabel: string;
}

// Build a ts-fsrs Card from our DB fields
function buildFsrsCard(card: SrsCardData): FSRSCard {
  return {
    due: new Date(card.dueDate),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: 0,
    scheduled_days: card.scheduledDays,
    reps: card.reps,
    lapses: card.lapses,
    state: DB_TO_STATE[card.status] ?? State.New,
    learning_steps: 0,
  };
}

// Format interval between now and due date as a human-readable label
function formatInterval(dueDate: Date, now: Date): string {
  const diffMs = dueDate.getTime() - now.getTime();
  const diffSec = Math.max(0, Math.round(diffMs / 1000));

  if (diffSec < 60) return `${diffSec}d`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}j`;
  return `${Math.round(diffSec / 86400)}h`;
}

// Get scheduling preview for all 4 ratings (shown on buttons)
export function getSchedulingPreview(card: SrsCardData): SchedulingPreview[] {
  const fsrsCard = buildFsrsCard(card);
  const now = new Date();
  const scheduling = scheduler.repeat(fsrsCard, now);

  const ratings: SrsRating[] = ["again", "hard", "good", "easy"];

  return ratings.map((rating) => {
    const ratingValue = DB_TO_RATING[rating];
    // ts-fsrs IPreview is indexed by numeric Rating values
    const result = (scheduling as unknown as Record<number, RecordLogItem>)[ratingValue];
    return {
      rating,
      intervalLabel: formatInterval(result.card.due, now),
    };
  });
}

// Process a review and return updated card data
export function processReview(
  card: SrsCardData,
  rating: SrsRating
): {
  updatedCard: SrsCardData;
  prevStatus: string;
  newStatus: string;
  prevStability: number;
  newStability: number;
  prevDifficulty: number;
  newDifficulty: number;
} {
  const fsrsCard = buildFsrsCard(card);
  const now = new Date();
  const scheduling = scheduler.repeat(fsrsCard, now);
  const ratingVal = DB_TO_RATING[rating];
  const result = (scheduling as unknown as Record<number, RecordLogItem>)[ratingVal];

  const updatedCard: SrsCardData = {
    status: STATE_TO_DB[result.card.state] ?? "new",
    stability: result.card.stability,
    difficulty: result.card.difficulty,
    dueDate: result.card.due.toISOString(),
    scheduledDays: result.card.scheduled_days,
    reps: result.card.reps,
    lapses: result.card.lapses,
  };

  return {
    updatedCard,
    prevStatus: card.status,
    newStatus: updatedCard.status,
    prevStability: card.stability,
    newStability: updatedCard.stability,
    prevDifficulty: card.difficulty,
    newDifficulty: updatedCard.difficulty,
  };
}

// Create default SRS card data for a new card
export function createNewCardData(): SrsCardData {
  const card = createEmptyCard();
  return {
    status: "new",
    stability: card.stability,
    difficulty: card.difficulty,
    dueDate: card.due.toISOString(),
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
  };
}
