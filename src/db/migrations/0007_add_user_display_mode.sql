-- Add display_mode column to user table
-- Values: 'kanji' (default) or 'kana'
ALTER TABLE "user" ADD COLUMN "display_mode" VARCHAR(10) NOT NULL DEFAULT 'kanji';
