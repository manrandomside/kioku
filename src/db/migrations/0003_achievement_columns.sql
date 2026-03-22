-- Add new achievement_type enum values
ALTER TYPE "achievement_type" ADD VALUE IF NOT EXISTS 'quiz_speed';
ALTER TYPE "achievement_type" ADD VALUE IF NOT EXISTS 'chapter_complete';

-- Add new columns to achievement table
ALTER TABLE "achievement" ADD COLUMN IF NOT EXISTS "name_en" varchar(255);
ALTER TABLE "achievement" ADD COLUMN IF NOT EXISTS "badge_color" varchar(7);
ALTER TABLE "achievement" ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0;
