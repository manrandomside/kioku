import {
  pgTable,
  uuid,
  integer,
  text,
  boolean,
  jsonb,
  varchar,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { xpSourceEnum, achievementTypeEnum } from "./enums";
import { user } from "./user";
import { chapter } from "./content";

// User gamification stats
export const userGamification = pgTable("user_gamification", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  totalXp: integer("total_xp").notNull().default(0),
  currentLevel: integer("current_level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  streakFreezes: integer("streak_freezes").notNull().default(0),
  lastActivityDate: date("last_activity_date"),
  totalReviews: integer("total_reviews").notNull().default(0),
  totalWordsLearned: integer("total_words_learned").notNull().default(0),
  dailyXpEarned: integer("daily_xp_earned").notNull().default(0),
  dailyGoalMet: boolean("daily_goal_met").notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// XP transaction log
export const xpTransaction = pgTable(
  "xp_transaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    source: xpSourceEnum("source").notNull(),
    amount: integer("amount").notNull(),
    description: text("description"),
    referenceId: uuid("reference_id"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_xp_transaction_user_id").on(table.userId),
  ]
);

// Achievement definitions
export const achievement = pgTable("achievement", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 100 }).notNull(),
  badgeColor: varchar("badge_color", { length: 7 }),
  type: achievementTypeEnum("type").notNull(),
  condition: jsonb("condition").notNull(),
  xpReward: integer("xp_reward").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Achievement unlocks per user
export const achievementUnlock = pgTable(
  "achievement_unlock",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievement.id, { onDelete: "cascade" }),
    unlockedAt: text("unlocked_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex("achievement_unlock_user_achievement_unique").on(
      table.userId,
      table.achievementId
    ),
    index("idx_achievement_unlock_user_id").on(table.userId),
  ]
);

// User chapter progress
export const userChapterProgress = pgTable(
  "user_chapter_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapter.id, { onDelete: "cascade" }),
    vocabSeen: integer("vocab_seen").notNull().default(0),
    vocabLearning: integer("vocab_learning").notNull().default(0),
    vocabReview: integer("vocab_review").notNull().default(0),
    completionPercent: integer("completion_percent").notNull().default(0),
    bestQuizScore: integer("best_quiz_score"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_user_chapter_progress_user_id").on(table.userId),
  ]
);

// Daily activity log
export const dailyActivity = pgTable(
  "daily_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activityDate: date("activity_date").notNull(),
    reviewsCount: integer("reviews_count").notNull().default(0),
    quizCount: integer("quiz_count").notNull().default(0),
    xpEarned: integer("xp_earned").notNull().default(0),
    goalMet: boolean("goal_met").notNull().default(false),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_daily_activity_user_id").on(table.userId),
    index("idx_daily_activity_user_id_date").on(table.userId, table.activityDate),
  ]
);
