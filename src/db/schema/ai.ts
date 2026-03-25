import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  real,
  jsonb,
  smallint,
} from "drizzle-orm/pg-core";

import { chatRoleEnum, questionTypeEnum } from "./enums";
import { user } from "./user";
import { vocabulary, kana } from "./content";

// AI chat session
export const aiChatSession = pgTable("ai_chat_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  messageCount: integer("message_count").notNull().default(0),
  createdAt: text("created_at").notNull().default("now()"),
  updatedAt: text("updated_at").notNull().default("now()"),
});

// AI chat message
export const aiChatMessage = pgTable("ai_chat_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => aiChatSession.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  providerUsed: varchar("provider_used", { length: 50 }),
  createdAt: text("created_at").notNull().default("now()"),
});

// AI response cache (keyed by prompt hash)
export const aiResponseCache = pgTable("ai_response_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  promptHash: varchar("prompt_hash", { length: 64 }).notNull().unique(),
  responseText: text("response_text").notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  hitCount: integer("hit_count").notNull().default(1),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default("now()"),
});

// Pronunciation attempt
export const pronunciationAttempt = pgTable("pronunciation_attempt", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  vocabularyId: uuid("vocabulary_id").references(() => vocabulary.id, {
    onDelete: "set null",
  }),
  kanaId: uuid("kana_id").references(() => kana.id, {
    onDelete: "set null",
  }),
  expectedText: varchar("expected_text", { length: 255 }).notNull(),
  recognizedText: varchar("recognized_text", { length: 255 }),
  accuracyScore: real("accuracy_score"),
  createdAt: text("created_at").notNull().default("now()"),
});

// AI question template (pre-generated quiz questions)
export const aiQuestionTemplate = pgTable("ai_question_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  vocabularyId: uuid("vocabulary_id")
    .notNull()
    .references(() => vocabulary.id, { onDelete: "cascade" }),
  questionType: questionTypeEnum("question_type").notNull(),
  questionText: text("question_text").notNull(),
  correctAnswer: varchar("correct_answer", { length: 255 }).notNull(),
  wrongAnswers: jsonb("wrong_answers").notNull(),
  createdAt: text("created_at").notNull().default("now()"),
});
