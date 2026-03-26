-- Add is_published column to vocabulary table
-- Used to hide vocabulary entries that are not in the official MNN PDF
ALTER TABLE "vocabulary" ADD COLUMN "is_published" boolean NOT NULL DEFAULT true;
