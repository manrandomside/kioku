import { create } from "zustand";

import type { SmartStudySession, SmartStudyReviewCard, SmartStudyNewWord } from "@/lib/services/smart-study-service";
import type { DueCard } from "@/lib/queries/review";
import type { VocabularyWithSrs } from "@/types/vocabulary";
import type { VocabQuizAnswer } from "@/types/vocab-quiz";

export type StudyPhase = "loading" | "review" | "new-words" | "transition" | "quiz" | "summary";

interface ReviewResult {
  cardId: string;
  rating: string;
  prevStatus: string;
}

interface NewWordResult {
  vocabularyId: string;
  understood: boolean;
}

interface QuizXpData {
  awarded: number;
  baseXp: number;
  bonusXp: number;
  bonusLabel: string;
  leveledUp: boolean;
  currentLevel: number;
}

interface SmartStudyState {
  // Session data
  sessionData: SmartStudySession | null;
  isLoading: boolean;
  error: string | null;

  // Phase tracking
  currentPhase: StudyPhase;
  transitionMessage: string;
  nextPhaseAfterTransition: StudyPhase;

  // Phase 1: Review
  reviewQueue: DueCard[];
  currentReviewIndex: number;
  reviewResults: ReviewResult[];
  reviewRetryCount: Map<string, number>;

  // Phase 2: New Words
  newWordQueue: Array<{ word: VocabularyWithSrs; retryNumber: number }>;
  newWordCompletedCount: number;
  newWordResults: NewWordResult[];
  newWordRetryCount: Map<string, number>;
  newWordUnderstoodIds: Set<string>;
  newWordRetriedIds: Set<string>;

  // Phase 3: Quiz
  quizSessionId: string | null;
  quizCurrentIndex: number;
  quizAnswers: VocabQuizAnswer[];
  quizXpData: QuizXpData | null;

  // Timing
  sessionStartTime: number;
  phaseStartTime: number;
  cardStartTime: number;

  // Actions
  initSession: (data: SmartStudySession) => void;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;

  // Review actions
  addReviewResult: (result: ReviewResult) => void;
  requeueReviewCard: (card: DueCard) => void;
  incrementReviewRetry: (cardId: string) => number;
  advanceReview: () => void;

  // New word actions
  markNewWordUnderstood: (vocabId: string) => void;
  markNewWordNotUnderstood: (vocabId: string) => void;
  advanceNewWord: () => void;
  requeueNewWord: (word: VocabularyWithSrs, retryNumber: number) => void;
  incrementNewWordCompleted: () => void;

  // Quiz actions
  setQuizSessionId: (id: string) => void;
  addQuizAnswer: (answer: VocabQuizAnswer) => void;
  advanceQuiz: () => void;
  setQuizXpData: (data: QuizXpData) => void;

  // Phase transitions
  startTransition: (message: string, nextPhase: StudyPhase) => void;
  completeTransition: () => void;
  skipToPhase: (phase: StudyPhase) => void;

  // Computed
  isReviewComplete: () => boolean;
  isNewWordsComplete: () => boolean;
  totalReviewCards: () => number;
  reviewProgress: () => number;
}

export const useSmartStudyStore = create<SmartStudyState>((set, get) => ({
  sessionData: null,
  isLoading: true,
  error: null,
  currentPhase: "loading",
  transitionMessage: "",
  nextPhaseAfterTransition: "review",

  reviewQueue: [],
  currentReviewIndex: 0,
  reviewResults: [],
  reviewRetryCount: new Map(),

  newWordQueue: [],
  newWordCompletedCount: 0,
  newWordResults: [],
  newWordRetryCount: new Map(),
  newWordUnderstoodIds: new Set(),
  newWordRetriedIds: new Set(),

  quizSessionId: null,
  quizCurrentIndex: 0,
  quizAnswers: [],
  quizXpData: null,

  sessionStartTime: Date.now(),
  phaseStartTime: Date.now(),
  cardStartTime: Date.now(),

  initSession: (data) => {
    // Map review cards to DueCard format for reuse with ReviewCard component
    const reviewQueue: DueCard[] = data.reviewCards.map((card) => ({
      cardId: card.cardId,
      type: card.kanaId ? "kana" as const : "vocabulary" as const,
      status: card.status as DueCard["status"],
      stability: card.stability,
      difficulty: card.difficulty,
      dueDate: card.dueDate,
      scheduledDays: card.scheduledDays,
      reps: card.reps,
      lapses: card.lapses,
      kanaId: card.kanaId,
      character: card.kana?.character ?? null,
      kanaRomaji: card.kana?.romaji ?? null,
      kanaCategory: card.kana?.category ?? null,
      kanaAudioUrl: card.kana?.audioUrl ?? null,
      vocabularyId: card.vocabularyId,
      kanji: card.vocabulary?.kanji ?? null,
      hiragana: card.vocabulary?.hiragana ?? null,
      romaji: card.vocabulary?.romaji ?? null,
      meaningId: card.vocabulary?.meaningId ?? null,
      meaningEn: card.vocabulary?.meaningEn ?? null,
      wordType: card.vocabulary?.wordType ?? null,
      jlptLevel: null,
      vocabAudioUrl: card.vocabulary?.audioUrl ?? null,
      exampleJp: card.vocabulary?.exampleJp ?? null,
      exampleId: card.vocabulary?.exampleId ?? null,
    }));

    // Map new words to VocabularyWithSrs format for reuse with VocabFlashcardCard
    const newWordQueue = data.newWords.map((nw) => ({
      word: {
        id: nw.vocabulary.id,
        kanji: nw.vocabulary.kanji,
        hiragana: nw.vocabulary.hiragana,
        romaji: nw.vocabulary.romaji,
        meaningId: nw.vocabulary.meaningId,
        meaningEn: nw.vocabulary.meaningEn,
        wordType: nw.vocabulary.wordType as VocabularyWithSrs["wordType"],
        jlptLevel: nw.vocabulary.jlptLevel,
        audioUrl: nw.vocabulary.audioUrl,
        exampleJp: nw.vocabulary.exampleJp,
        exampleId: nw.vocabulary.exampleId,
        sortOrder: nw.vocabulary.sortOrder,
        srsStatus: null as VocabularyWithSrs["srsStatus"],
      },
      retryNumber: 0,
    }));

    // Determine starting phase
    let startPhase: StudyPhase = "review";
    if (reviewQueue.length === 0 && newWordQueue.length > 0) {
      startPhase = "new-words";
    } else if (reviewQueue.length === 0 && newWordQueue.length === 0) {
      startPhase = "quiz";
    }

    const now = Date.now();
    set({
      sessionData: data,
      isLoading: false,
      error: null,
      currentPhase: startPhase,
      reviewQueue,
      currentReviewIndex: 0,
      reviewResults: [],
      reviewRetryCount: new Map(),
      newWordQueue,
      newWordCompletedCount: 0,
      newWordResults: [],
      newWordRetryCount: new Map(),
      newWordUnderstoodIds: new Set(),
      newWordRetriedIds: new Set(),
      quizSessionId: null,
      quizCurrentIndex: 0,
      quizAnswers: [],
      quizXpData: null,
      sessionStartTime: now,
      phaseStartTime: now,
      cardStartTime: now,
    });
  },

  setError: (error) => set({ error, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),

  // Review actions
  addReviewResult: (result) =>
    set((state) => ({
      reviewResults: [...state.reviewResults, result],
    })),

  requeueReviewCard: (card) =>
    set((state) => ({
      reviewQueue: [...state.reviewQueue, card],
    })),

  incrementReviewRetry: (cardId) => {
    const state = get();
    const current = state.reviewRetryCount.get(cardId) ?? 0;
    const next = current + 1;
    const newMap = new Map(state.reviewRetryCount);
    newMap.set(cardId, next);
    set({ reviewRetryCount: newMap });
    return next;
  },

  advanceReview: () =>
    set((state) => ({
      currentReviewIndex: state.currentReviewIndex + 1,
      cardStartTime: Date.now(),
    })),

  // New word actions
  markNewWordUnderstood: (vocabId) => {
    const state = get();
    const newSet = new Set(state.newWordUnderstoodIds);
    newSet.add(vocabId);
    set({
      newWordUnderstoodIds: newSet,
      newWordResults: [...state.newWordResults, { vocabularyId: vocabId, understood: true }],
    });
  },

  markNewWordNotUnderstood: (vocabId) => {
    const state = get();
    const retriedSet = new Set(state.newWordRetriedIds);
    retriedSet.add(vocabId);
    set({
      newWordRetriedIds: retriedSet,
      newWordResults: [...state.newWordResults, { vocabularyId: vocabId, understood: false }],
    });
  },

  advanceNewWord: () =>
    set((state) => ({
      newWordQueue: state.newWordQueue.slice(1),
      cardStartTime: Date.now(),
    })),

  requeueNewWord: (word, retryNumber) =>
    set((state) => ({
      newWordQueue: [...state.newWordQueue.slice(1), { word, retryNumber }],
    })),

  incrementNewWordCompleted: () =>
    set((state) => ({
      newWordCompletedCount: state.newWordCompletedCount + 1,
    })),

  // Quiz actions
  setQuizSessionId: (id) => set({ quizSessionId: id }),

  addQuizAnswer: (answer) =>
    set((state) => ({
      quizAnswers: [...state.quizAnswers, answer],
    })),

  advanceQuiz: () =>
    set((state) => ({
      quizCurrentIndex: state.quizCurrentIndex + 1,
      cardStartTime: Date.now(),
    })),

  setQuizXpData: (data) => set({ quizXpData: data }),

  // Phase transitions
  startTransition: (message, nextPhase) =>
    set({
      currentPhase: "transition",
      transitionMessage: message,
      nextPhaseAfterTransition: nextPhase,
    }),

  completeTransition: () => {
    const state = get();
    set({
      currentPhase: state.nextPhaseAfterTransition,
      phaseStartTime: Date.now(),
      cardStartTime: Date.now(),
    });
  },

  skipToPhase: (phase) =>
    set({
      currentPhase: phase,
      phaseStartTime: Date.now(),
      cardStartTime: Date.now(),
    }),

  // Computed
  isReviewComplete: () => {
    const state = get();
    return state.currentReviewIndex >= state.reviewQueue.length;
  },

  isNewWordsComplete: () => {
    const state = get();
    return state.newWordQueue.length === 0 && state.newWordCompletedCount > 0;
  },

  totalReviewCards: () => {
    const state = get();
    return state.sessionData?.summary.reviewCount ?? 0;
  },

  reviewProgress: () => {
    const state = get();
    const total = state.reviewQueue.length;
    if (total === 0) return 100;
    return Math.round((state.currentReviewIndex / total) * 100);
  },
}));
