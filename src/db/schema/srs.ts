import {
  pgTable,
  uuid,
  real,
  integer,
  text,
  smallint,
  check,
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
    dueDate: text("due_date").notNull().default("now()"),
    scheduledDays: integer("scheduled_days").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    createdAt: text("created_at").notNull().default("now()"),
    updatedAt: text("updated_at").notNull().default("now()"),
  },
  (table) => [
    check(
      "vocab_xor_kana",
      sql`(${table.vocabularyId} IS NOT NULL AND ${table.kanaId} IS NULL) OR (${table.vocabularyId} IS NULL AND ${table.kanaId} IS NOT NULL)`
    ),
  ]
);

// Review log table
export const reviewLog = pgTable("review_log", {
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
  reviewedAt: text("reviewed_at").notNull().default("now()"),
});
