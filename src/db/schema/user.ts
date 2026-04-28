import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";

import { jlptLevelEnum, themeEnum, dailyGoalXpEnum } from "./enums";

// User profile table (linked to Supabase Auth)
export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  supabaseAuthId: uuid("supabase_auth_id").notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 100 }),
  preferredName: varchar("preferred_name", { length: 50 }),
  avatarUrl: text("avatar_url"),
  jlptTarget: jlptLevelEnum("jlpt_target").default("N5"),
  dailyGoalXp: dailyGoalXpEnum("daily_goal_xp").default("100"),
  autoPlayAudio: boolean("auto_play_audio").notNull().default(true),
  showRomaji: boolean("show_romaji").notNull().default(true),
  displayMode: varchar("display_mode", { length: 10 }).notNull().default("kanji"),
  theme: themeEnum("theme").notNull().default("system"),
  onboardingDone: boolean("onboarding_done").notNull().default(false),
  hirakataKnown: boolean("hirakata_known").notNull().default(false),
  tourCompleted: boolean("tour_completed").notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});
