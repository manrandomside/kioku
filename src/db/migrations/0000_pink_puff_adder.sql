CREATE TYPE "public"."achievement_type" AS ENUM('streak', 'review_count', 'quiz_score', 'words_learned', 'level', 'special');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."daily_goal_xp" AS ENUM('30', '50', '100', '200');--> statement-breakpoint
CREATE TYPE "public"."jlpt_level" AS ENUM('N5', 'N4', 'N3', 'N2', 'N1');--> statement-breakpoint
CREATE TYPE "public"."kana_category" AS ENUM('hiragana_basic', 'hiragana_dakuten', 'hiragana_combo', 'katakana_basic', 'katakana_dakuten', 'katakana_combo');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('meaning_to_word', 'word_to_meaning', 'audio_to_word', 'audio_to_meaning', 'kanji_to_hiragana', 'hiragana_to_kanji', 'fill_in_blank');--> statement-breakpoint
CREATE TYPE "public"."srs_rating" AS ENUM('again', 'hard', 'good', 'easy');--> statement-breakpoint
CREATE TYPE "public"."srs_status" AS ENUM('new', 'learning', 'review', 'relearning');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TYPE "public"."word_type" AS ENUM('noun', 'verb', 'i_adjective', 'na_adjective', 'adverb', 'particle', 'conjunction', 'expression', 'counter', 'prefix', 'suffix', 'pronoun', 'interjection');--> statement-breakpoint
CREATE TYPE "public"."xp_source" AS ENUM('review', 'quiz', 'perfect_quiz', 'streak_bonus', 'achievement', 'daily_bonus');--> statement-breakpoint
CREATE TABLE "book" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"jlpt_level" "jlpt_level" NOT NULL,
	"chapter_start" integer NOT NULL,
	"chapter_end" integer NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL,
	CONSTRAINT "book_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chapter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"chapter_number" integer NOT NULL,
	"slug" varchar(255) NOT NULL,
	"vocab_count" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL,
	CONSTRAINT "chapter_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "kana" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character" varchar(10) NOT NULL,
	"romaji" varchar(10) NOT NULL,
	"category" "kana_category" NOT NULL,
	"row_group" varchar(20) NOT NULL,
	"column_position" smallint NOT NULL,
	"audio_url" text,
	"created_at" text DEFAULT 'now()' NOT NULL,
	CONSTRAINT "kana_character_unique" UNIQUE("character")
);
--> statement-breakpoint
CREATE TABLE "vocabulary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"kanji" varchar(100),
	"hiragana" varchar(100) NOT NULL,
	"romaji" varchar(100) NOT NULL,
	"meaning_id" varchar(255) NOT NULL,
	"meaning_en" varchar(255) NOT NULL,
	"word_type" "word_type" NOT NULL,
	"jlpt_level" "jlpt_level" NOT NULL,
	"audio_url" text,
	"example_jp" text,
	"example_id" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supabase_auth_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_name" varchar(100),
	"avatar_url" text,
	"jlpt_target" "jlpt_level" DEFAULT 'N5',
	"daily_goal_xp" "daily_goal_xp" DEFAULT '30',
	"auto_play_audio" boolean DEFAULT true NOT NULL,
	"show_romaji" boolean DEFAULT true NOT NULL,
	"theme" "theme" DEFAULT 'system' NOT NULL,
	"onboarding_done" boolean DEFAULT false NOT NULL,
	"hirakata_known" boolean DEFAULT false NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL,
	CONSTRAINT "user_supabase_auth_id_unique" UNIQUE("supabase_auth_id")
);
--> statement-breakpoint
CREATE TABLE "review_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"rating" "srs_rating" NOT NULL,
	"prev_stability" real,
	"new_stability" real,
	"prev_difficulty" real,
	"new_difficulty" real,
	"prev_status" "srs_status",
	"new_status" "srs_status",
	"review_duration_ms" integer,
	"reviewed_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srs_card" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"vocabulary_id" uuid,
	"kana_id" uuid,
	"status" "srs_status" DEFAULT 'new' NOT NULL,
	"stability" real DEFAULT 0 NOT NULL,
	"difficulty" real DEFAULT 0 NOT NULL,
	"due_date" text DEFAULT 'now()' NOT NULL,
	"scheduled_days" integer DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL,
	CONSTRAINT "vocab_xor_kana" CHECK (("srs_card"."vocabulary_id" IS NOT NULL AND "srs_card"."kana_id" IS NULL) OR ("srs_card"."vocabulary_id" IS NULL AND "srs_card"."kana_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "quiz_answer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_number" smallint NOT NULL,
	"question_type" "question_type" NOT NULL,
	"vocabulary_id" uuid,
	"kana_id" uuid,
	"question_text" text NOT NULL,
	"correct_answer" varchar(255) NOT NULL,
	"options" jsonb,
	"user_answer" varchar(255),
	"is_correct" boolean,
	"answered_at" text
);
--> statement-breakpoint
CREATE TABLE "quiz_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"chapter_id" uuid,
	"kana_category" "kana_category",
	"total_questions" integer NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"score_percent" real,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"time_spent_ms" integer,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_perfect" boolean DEFAULT false NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"completed_at" text
);
--> statement-breakpoint
CREATE TABLE "achievement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(100) NOT NULL,
	"type" "achievement_type" NOT NULL,
	"condition" jsonb NOT NULL,
	"xp_reward" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievement_unlock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"unlocked_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_date" date NOT NULL,
	"reviews_count" integer DEFAULT 0 NOT NULL,
	"quiz_count" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"goal_met" boolean DEFAULT false NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_chapter_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"chapter_id" uuid NOT NULL,
	"vocab_seen" integer DEFAULT 0 NOT NULL,
	"vocab_learning" integer DEFAULT 0 NOT NULL,
	"vocab_review" integer DEFAULT 0 NOT NULL,
	"completion_percent" integer DEFAULT 0 NOT NULL,
	"best_quiz_score" integer,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_gamification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"current_level" integer DEFAULT 1 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"streak_freezes" integer DEFAULT 0 NOT NULL,
	"last_activity_date" date,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"total_words_learned" integer DEFAULT 0 NOT NULL,
	"daily_xp_earned" integer DEFAULT 0 NOT NULL,
	"daily_goal_met" boolean DEFAULT false NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL,
	CONSTRAINT "user_gamification_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "xp_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" "xp_source" NOT NULL,
	"amount" integer NOT NULL,
	"description" text,
	"reference_id" uuid,
	"created_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"provider_used" varchar(50),
	"created_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255),
	"message_count" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL,
	"updated_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_question_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vocabulary_id" uuid NOT NULL,
	"question_type" "question_type" NOT NULL,
	"question_text" text NOT NULL,
	"correct_answer" varchar(255) NOT NULL,
	"wrong_answers" jsonb NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_response_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_hash" varchar(64) NOT NULL,
	"response_text" text NOT NULL,
	"provider" varchar(50) NOT NULL,
	"hit_count" integer DEFAULT 1 NOT NULL,
	"created_at" text DEFAULT 'now()' NOT NULL,
	CONSTRAINT "ai_response_cache_prompt_hash_unique" UNIQUE("prompt_hash")
);
--> statement-breakpoint
CREATE TABLE "pronunciation_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"vocabulary_id" uuid,
	"kana_id" uuid,
	"expected_text" varchar(255) NOT NULL,
	"recognized_text" varchar(255),
	"accuracy_score" real,
	"created_at" text DEFAULT 'now()' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chapter" ADD CONSTRAINT "chapter_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary" ADD CONSTRAINT "vocabulary_chapter_id_chapter_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_log" ADD CONSTRAINT "review_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_log" ADD CONSTRAINT "review_log_card_id_srs_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."srs_card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_card" ADD CONSTRAINT "srs_card_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_card" ADD CONSTRAINT "srs_card_vocabulary_id_vocabulary_id_fk" FOREIGN KEY ("vocabulary_id") REFERENCES "public"."vocabulary"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_card" ADD CONSTRAINT "srs_card_kana_id_kana_id_fk" FOREIGN KEY ("kana_id") REFERENCES "public"."kana"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answer" ADD CONSTRAINT "quiz_answer_session_id_quiz_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answer" ADD CONSTRAINT "quiz_answer_vocabulary_id_vocabulary_id_fk" FOREIGN KEY ("vocabulary_id") REFERENCES "public"."vocabulary"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answer" ADD CONSTRAINT "quiz_answer_kana_id_kana_id_fk" FOREIGN KEY ("kana_id") REFERENCES "public"."kana"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_chapter_id_chapter_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapter"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_unlock" ADD CONSTRAINT "achievement_unlock_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_unlock" ADD CONSTRAINT "achievement_unlock_achievement_id_achievement_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_chapter_progress" ADD CONSTRAINT "user_chapter_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_chapter_progress" ADD CONSTRAINT "user_chapter_progress_chapter_id_chapter_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gamification" ADD CONSTRAINT "user_gamification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_transaction" ADD CONSTRAINT "xp_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_message" ADD CONSTRAINT "ai_chat_message_session_id_ai_chat_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_chat_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_session" ADD CONSTRAINT "ai_chat_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_question_template" ADD CONSTRAINT "ai_question_template_vocabulary_id_vocabulary_id_fk" FOREIGN KEY ("vocabulary_id") REFERENCES "public"."vocabulary"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pronunciation_attempt" ADD CONSTRAINT "pronunciation_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pronunciation_attempt" ADD CONSTRAINT "pronunciation_attempt_vocabulary_id_vocabulary_id_fk" FOREIGN KEY ("vocabulary_id") REFERENCES "public"."vocabulary"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pronunciation_attempt" ADD CONSTRAINT "pronunciation_attempt_kana_id_kana_id_fk" FOREIGN KEY ("kana_id") REFERENCES "public"."kana"("id") ON DELETE set null ON UPDATE no action;