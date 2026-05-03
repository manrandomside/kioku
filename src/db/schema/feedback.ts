import {
  pgTable,
  uuid,
  varchar,
  text,
  smallint,
  boolean,
  jsonb,
  serial,
  check,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { feedbackStatusEnum, feedbackTypeEnum } from "./enums";
import { user } from "./user";

// User feedback (bug reports, feature requests, ratings, opinions)
export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    type: feedbackTypeEnum("type").notNull(),
    title: varchar("title", { length: 200 }),
    content: text("content").notNull(),
    rating: smallint("rating"),
    pageUrl: text("page_url"),
    screenshotUrl: text("screenshot_url"),
    showPublicly: boolean("show_publicly").notNull().default(false),
    publicApproved: boolean("public_approved").notNull().default(false),
    status: feedbackStatusEnum("status").notNull().default("new"),
    adminNotes: text("admin_notes"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    check(
      "feedback_rating_range",
      sql`${table.rating} IS NULL OR (${table.rating} BETWEEN 1 AND 5)`
    ),
    index("idx_feedback_user").on(table.userId),
    index("idx_feedback_type_status").on(table.type, table.status),
    index("idx_feedback_public")
      .on(table.showPublicly, table.publicApproved)
      .where(sql`${table.showPublicly} = true`),
    index("idx_feedback_created").on(sql`${table.createdAt} DESC`),
  ]
);

// Denormalized cache for public stats page (refreshed via cron)
export const publicStatsCache = pgTable(
  "public_stats_cache",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    value: jsonb("value").notNull(),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [index("idx_stats_cache_updated").on(table.updatedAt)]
);
