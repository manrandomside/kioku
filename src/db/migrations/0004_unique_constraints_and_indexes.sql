-- Fix 1: SRS card unique constraints to prevent duplicate cards per user
-- Uses partial unique indexes since vocabulary_id and kana_id are nullable
CREATE UNIQUE INDEX IF NOT EXISTS "srs_card_user_vocabulary_unique"
  ON "srs_card" ("user_id", "vocabulary_id")
  WHERE "vocabulary_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "srs_card_user_kana_unique"
  ON "srs_card" ("user_id", "kana_id")
  WHERE "kana_id" IS NOT NULL;

-- Fix 2: Achievement unlock unique constraint to prevent duplicate unlocks
CREATE UNIQUE INDEX IF NOT EXISTS "achievement_unlock_user_achievement_unique"
  ON "achievement_unlock" ("user_id", "achievement_id");

-- Fix 5: Performance indexes on user_id columns for frequently queried tables
CREATE INDEX IF NOT EXISTS "idx_srs_card_user_id"
  ON "srs_card" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_srs_card_user_id_status"
  ON "srs_card" ("user_id", "status");

CREATE INDEX IF NOT EXISTS "idx_srs_card_user_id_due_date"
  ON "srs_card" ("user_id", "due_date");

CREATE INDEX IF NOT EXISTS "idx_review_log_user_id"
  ON "review_log" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_review_log_card_id"
  ON "review_log" ("card_id");

CREATE INDEX IF NOT EXISTS "idx_quiz_session_user_id"
  ON "quiz_session" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_achievement_unlock_user_id"
  ON "achievement_unlock" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_daily_activity_user_id"
  ON "daily_activity" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_daily_activity_user_id_date"
  ON "daily_activity" ("user_id", "activity_date");

CREATE INDEX IF NOT EXISTS "idx_xp_transaction_user_id"
  ON "xp_transaction" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_user_chapter_progress_user_id"
  ON "user_chapter_progress" ("user_id");
