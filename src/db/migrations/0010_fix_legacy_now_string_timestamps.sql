-- Fix legacy "now()" literal string in created_at/updated_at columns
-- Original migration 0000 used `DEFAULT 'now()'` which inserted the literal string
-- instead of evaluating now() as a SQL function. Existing rows have "now()" as text.
--
-- This migration replaces the literal "now()" with the current timestamp (ISO string)
-- across all affected tables.

UPDATE "user" SET created_at = NOW()::text WHERE created_at = 'now()';
UPDATE "user" SET updated_at = NOW()::text WHERE updated_at = 'now()';

UPDATE "book" SET created_at = NOW()::text WHERE created_at = 'now()';
UPDATE "chapter" SET created_at = NOW()::text WHERE created_at = 'now()';
UPDATE "vocabulary" SET created_at = NOW()::text WHERE created_at = 'now()';
UPDATE "kana" SET created_at = NOW()::text WHERE created_at = 'now()';

UPDATE "srs_card" SET created_at = NOW()::text WHERE created_at = 'now()';
UPDATE "review_log" SET created_at = NOW()::text WHERE created_at = 'now()';

UPDATE "quiz_session" SET created_at = NOW()::text WHERE created_at = 'now()';
UPDATE "quiz_answer" SET created_at = NOW()::text WHERE created_at = 'now()';

UPDATE "user_gamification" SET created_at = NOW()::text WHERE created_at = 'now()';
UPDATE "user_gamification" SET updated_at = NOW()::text WHERE updated_at = 'now()';
UPDATE "xp_transaction" SET created_at = NOW()::text WHERE created_at = 'now()';
UPDATE "achievement" SET created_at = NOW()::text WHERE created_at = 'now()';
UPDATE "achievement_unlock" SET unlocked_at = NOW()::text WHERE unlocked_at = 'now()';
UPDATE "user_chapter_progress" SET updated_at = NOW()::text WHERE updated_at = 'now()';
UPDATE "daily_activity" SET created_at = NOW()::text WHERE created_at = 'now()';

UPDATE "ai_chat_session" SET created_at = NOW()::text WHERE created_at = 'now()';
UPDATE "ai_chat_session" SET updated_at = NOW()::text WHERE updated_at = 'now()';
UPDATE "ai_chat_message" SET created_at = NOW()::text WHERE created_at = 'now()';
UPDATE "ai_response_cache" SET created_at = NOW()::text WHERE created_at = 'now()';

UPDATE "pronunciation_attempt" SET created_at = NOW()::text WHERE created_at = 'now()';
UPDATE "ai_question_template" SET created_at = NOW()::text WHERE created_at = 'now()';
