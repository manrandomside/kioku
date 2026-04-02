import {
  pgTable,
  uuid,
  real,
  integer,
  text,
  smallint,
  check,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { srsStatusEnum, srsRatingEnum } from "./enums";
import { user } from "./user";
import { vocabulary } from "./content";
import { kana } from "./content";

// SRS card table - CHECK constraint ensures either vocabulary or kana, not both
export const srsCard = pgTable(
  "srs_card",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    vocabularyId: uuid("vocabulary_id").references(() => vocabulary.id, {
      onDelete: "cascade",
    }),
    kanaId: uuid("kana_id").references(() => kana.id, {
      onDelete: "cascade",
    }),
    status: srsStatusEnum("status").notNull().default("new"),
    stability: real("stability").notNull().default(0),
    difficulty: real("difficulty").notNull().default(0),
    dueDate: text("due_date").notNull().$defaultFn(() => new Date().toISOString()),
    scheduledDays: integer("scheduled_days").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    check(
      "vocab_xor_kana",
      sql`(${table.vocabularyId} IS NOT NULL AND ${table.kanaId} IS NULL) OR (${table.vocabularyId} IS NULL AND ${table.kanaId} IS NOT NULL)`
    ),
    uniqueIndex("srs_card_user_vocabulary_unique")
      .on(table.userId, table.vocabularyId)
      .where(sql`${table.vocabularyId} IS NOT NULL`),
    uniqueIndex("srs_card_user_kana_unique")
      .on(table.userId, table.kanaId)
      .where(sql`${table.kanaId} IS NOT NULL`),
    index("idx_srs_card_user_id").on(table.userId),
    index("idx_srs_card_user_id_status").on(table.userId, table.status),
    index("idx_srs_card_user_id_due_date").on(table.userId, table.dueDate),
  ]
);

// Review log table
export const reviewLog = pgTable(
  "review_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => srsCard.id, { onDelete: "cascade" }),
    rating: srsRatingEnum("rating").notNull(),
    prevStability: real("prev_stability"),
    newStability: real("new_stability"),
    prevDifficulty: real("prev_difficulty"),
    newDifficulty: real("new_difficulty"),
    prevStatus: srsStatusEnum("prev_status"),
    newStatus: srsStatusEnum("new_status"),
    reviewDurationMs: integer("review_duration_ms"),
    reviewedAt: text("reviewed_at").notNull().default(sql`now()`),
  },
  (table) => [
    index("idx_review_log_user_id").on(table.userId),
    index("idx_review_log_card_id").on(table.cardId),
  ]
);
