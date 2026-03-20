import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  smallint,
} from "drizzle-orm/pg-core";

import { jlptLevelEnum, wordTypeEnum, kanaCategoryEnum } from "./enums";

// Book table (e.g., Minna no Nihongo)
export const book = pgTable("book", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  jlptLevel: jlptLevelEnum("jlpt_level").notNull(),
  chapterStart: integer("chapter_start").notNull(),
  chapterEnd: integer("chapter_end").notNull(),
  createdAt: text("created_at").notNull().default("now()"),
});

// Chapter table
export const chapter = pgTable("chapter", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => book.id, { onDelete: "cascade" }),
  chapterNumber: integer("chapter_number").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  vocabCount: integer("vocab_count").notNull().default(0),
  createdAt: text("created_at").notNull().default("now()"),
});

// Vocabulary table
export const vocabulary = pgTable("vocabulary", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id")
    .notNull()
    .references(() => chapter.id, { onDelete: "cascade" }),
  kanji: varchar("kanji", { length: 100 }),
  hiragana: varchar("hiragana", { length: 100 }).notNull(),
  romaji: varchar("romaji", { length: 100 }).notNull(),
  meaningId: varchar("meaning_id", { length: 255 }).notNull(),
  meaningEn: varchar("meaning_en", { length: 255 }).notNull(),
  wordType: wordTypeEnum("word_type").notNull(),
  jlptLevel: jlptLevelEnum("jlpt_level").notNull(),
  audioUrl: text("audio_url"),
  exampleJp: text("example_jp"),
  exampleId: text("example_id"),
  sortOrder: smallint("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("now()"),
});

// Kana table (hiragana + katakana characters)
export const kana = pgTable("kana", {
  id: uuid("id").primaryKey().defaultRandom(),
  character: varchar("character", { length: 10 }).notNull().unique(),
  romaji: varchar("romaji", { length: 10 }).notNull(),
  category: kanaCategoryEnum("category").notNull(),
  rowGroup: varchar("row_group", { length: 20 }).notNull(),
  columnPosition: smallint("column_position").notNull(),
  audioUrl: text("audio_url"),
  createdAt: text("created_at").notNull().default("now()"),
});
