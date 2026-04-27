import {
  pgTable,
  uuid,
  integer,
  real,
  text,
  boolean,
  jsonb,
  smallint,
  varchar,
  index,
} from "drizzle-orm/pg-core";

import { questionTypeEnum, kanaCategoryEnum } from "./enums";
import { user } from "./user";
import { chapter, vocabulary, kana } from "./content";

// Quiz session table
export const quizSession = pgTable(
  "quiz_session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chapterId: uuid("chapter_id").references(() => chapter.id, {
      onDelete: "set null",
    }),
    kanaCategory: kanaCategoryEnum("kana_category"),
    totalQuestions: integer("total_questions").notNull(),
    correctCount: integer("correct_count").notNull().default(0),
    scorePercent: real("score_percent"),
    xpEarned: integer("xp_earned").notNull().default(0),
    timeSpentMs: integer("time_spent_ms"),
    isCompleted: boolean("is_completed").notNull().default(false),
    isPerfect: boolean("is_perfect").notNull().default(false),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    completedAt: text("completed_at"),
  },
  (table) => [
    index("idx_quiz_session_user_id").on(table.userId),
    index("idx_quiz_session_user_completed").on(table.userId, table.isCompleted, table.completedAt),
  ]
);

// Quiz answer table
export const quizAnswer = pgTable("quiz_answer", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => quizSession.id, { onDelete: "cascade" }),
  questionNumber: smallint("question_number").notNull(),
  questionType: questionTypeEnum("question_type").notNull(),
  vocabularyId: uuid("vocabulary_id").references(() => vocabulary.id, {
    onDelete: "set null",
  }),
  kanaId: uuid("kana_id").references(() => kana.id, {
    onDelete: "set null",
  }),
  questionText: text("question_text").notNull(),
  correctAnswer: varchar("correct_answer", { length: 255 }).notNull(),
  options: jsonb("options"),
  userAnswer: varchar("user_answer", { length: 255 }),
  isCorrect: boolean("is_correct"),
  answeredAt: text("answered_at"),
});
