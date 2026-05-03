-- Phase 7: Community & Feedback System
-- Adds feedback table (bug/feature/general/rating) + public_stats_cache for public stats page.

-- 1. Enums
CREATE TYPE "public"."feedback_type" AS ENUM ('bug', 'feature', 'general', 'rating');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM ('new', 'reviewing', 'in_progress', 'resolved', 'wontfix');--> statement-breakpoint

-- 2. Tables
CREATE TABLE "feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "type" "feedback_type" NOT NULL,
  "title" varchar(200),
  "content" text NOT NULL,
  "rating" smallint,
  "page_url" text,
  "screenshot_url" text,
  "show_publicly" boolean NOT NULL DEFAULT false,
  "public_approved" boolean NOT NULL DEFAULT false,
  "status" "feedback_status" NOT NULL DEFAULT 'new',
  "admin_notes" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  CONSTRAINT "feedback_rating_range" CHECK ("rating" IS NULL OR ("rating" BETWEEN 1 AND 5))
);--> statement-breakpoint

CREATE TABLE "public_stats_cache" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" varchar(100) NOT NULL,
  "value" jsonb NOT NULL,
  "updated_at" text NOT NULL,
  CONSTRAINT "public_stats_cache_key_unique" UNIQUE("key")
);--> statement-breakpoint

-- 3. Foreign keys
ALTER TABLE "feedback"
  ADD CONSTRAINT "feedback_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;--> statement-breakpoint

-- 4. Indexes
CREATE INDEX "idx_feedback_user" ON "feedback" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_type_status" ON "feedback" ("type", "status");--> statement-breakpoint
CREATE INDEX "idx_feedback_public" ON "feedback" ("show_publicly", "public_approved")
  WHERE "show_publicly" = true;--> statement-breakpoint
CREATE INDEX "idx_feedback_created" ON "feedback" ("created_at" DESC);--> statement-breakpoint
CREATE INDEX "idx_stats_cache_updated" ON "public_stats_cache" ("updated_at");--> statement-breakpoint

-- 5. Row Level Security: feedback
ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Authenticated users insert their own feedback; anonymous insert allowed when user_id IS NULL.
CREATE POLICY "feedback_insert_policy" ON "feedback"
  FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = public.get_user_id());--> statement-breakpoint

-- Users can read their own feedback history.
CREATE POLICY "feedback_select_own" ON "feedback"
  FOR SELECT
  USING (user_id = public.get_user_id());--> statement-breakpoint

-- Public testimonial wall: anyone can read entries opted-in + admin-approved.
CREATE POLICY "feedback_select_public" ON "feedback"
  FOR SELECT
  USING (show_publicly = true AND public_approved = true);--> statement-breakpoint

-- 6. Row Level Security: public_stats_cache
ALTER TABLE "public_stats_cache" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Public stats are readable by anyone (anon + authenticated).
CREATE POLICY "public_stats_cache_public_read" ON "public_stats_cache"
  FOR SELECT
  USING (true);
