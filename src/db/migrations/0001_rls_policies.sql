-- Enable Row Level Security on all tables

-- Content tables: public read access
ALTER TABLE "book" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "book_public_read" ON "book" FOR SELECT USING (true);

ALTER TABLE "chapter" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chapter_public_read" ON "chapter" FOR SELECT USING (true);

ALTER TABLE "vocabulary" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vocabulary_public_read" ON "vocabulary" FOR SELECT USING (true);

ALTER TABLE "kana" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kana_public_read" ON "kana" FOR SELECT USING (true);

ALTER TABLE "achievement" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievement_public_read" ON "achievement" FOR SELECT USING (true);

ALTER TABLE "ai_response_cache" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_response_cache_public_read" ON "ai_response_cache" FOR SELECT USING (true);

ALTER TABLE "ai_question_template" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_question_template_public_read" ON "ai_question_template" FOR SELECT USING (true);

-- User data tables: user_id = auth.uid() via the user table
-- Helper: get internal user ID from Supabase auth ID
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public."user" WHERE supabase_auth_id = auth.uid()
$$;

-- User table: users can only read/update their own profile
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_select_own" ON "user" FOR SELECT USING (supabase_auth_id = auth.uid());
CREATE POLICY "user_update_own" ON "user" FOR UPDATE USING (supabase_auth_id = auth.uid());
CREATE POLICY "user_insert_own" ON "user" FOR INSERT WITH CHECK (supabase_auth_id = auth.uid());

-- SRS card
ALTER TABLE "srs_card" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "srs_card_select_own" ON "srs_card" FOR SELECT USING (user_id = public.get_user_id());
CREATE POLICY "srs_card_insert_own" ON "srs_card" FOR INSERT WITH CHECK (user_id = public.get_user_id());
CREATE POLICY "srs_card_update_own" ON "srs_card" FOR UPDATE USING (user_id = public.get_user_id());
CREATE POLICY "srs_card_delete_own" ON "srs_card" FOR DELETE USING (user_id = public.get_user_id());

-- Review log
ALTER TABLE "review_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_log_select_own" ON "review_log" FOR SELECT USING (user_id = public.get_user_id());
CREATE POLICY "review_log_insert_own" ON "review_log" FOR INSERT WITH CHECK (user_id = public.get_user_id());

-- Quiz session
ALTER TABLE "quiz_session" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_session_select_own" ON "quiz_session" FOR SELECT USING (user_id = public.get_user_id());
CREATE POLICY "quiz_session_insert_own" ON "quiz_session" FOR INSERT WITH CHECK (user_id = public.get_user_id());
CREATE POLICY "quiz_session_update_own" ON "quiz_session" FOR UPDATE USING (user_id = public.get_user_id());

-- Quiz answer
ALTER TABLE "quiz_answer" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_answer_select_own" ON "quiz_answer" FOR SELECT
  USING (session_id IN (SELECT id FROM public.quiz_session WHERE user_id = public.get_user_id()));
CREATE POLICY "quiz_answer_insert_own" ON "quiz_answer" FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM public.quiz_session WHERE user_id = public.get_user_id()));

-- User gamification
ALTER TABLE "user_gamification" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_gamification_select_own" ON "user_gamification" FOR SELECT USING (user_id = public.get_user_id());
CREATE POLICY "user_gamification_insert_own" ON "user_gamification" FOR INSERT WITH CHECK (user_id = public.get_user_id());
CREATE POLICY "user_gamification_update_own" ON "user_gamification" FOR UPDATE USING (user_id = public.get_user_id());

-- XP transaction
ALTER TABLE "xp_transaction" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp_transaction_select_own" ON "xp_transaction" FOR SELECT USING (user_id = public.get_user_id());
CREATE POLICY "xp_transaction_insert_own" ON "xp_transaction" FOR INSERT WITH CHECK (user_id = public.get_user_id());

-- Achievement unlock
ALTER TABLE "achievement_unlock" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievement_unlock_select_own" ON "achievement_unlock" FOR SELECT USING (user_id = public.get_user_id());
CREATE POLICY "achievement_unlock_insert_own" ON "achievement_unlock" FOR INSERT WITH CHECK (user_id = public.get_user_id());

-- User chapter progress
ALTER TABLE "user_chapter_progress" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_chapter_progress_select_own" ON "user_chapter_progress" FOR SELECT USING (user_id = public.get_user_id());
CREATE POLICY "user_chapter_progress_insert_own" ON "user_chapter_progress" FOR INSERT WITH CHECK (user_id = public.get_user_id());
CREATE POLICY "user_chapter_progress_update_own" ON "user_chapter_progress" FOR UPDATE USING (user_id = public.get_user_id());

-- Daily activity
ALTER TABLE "daily_activity" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_activity_select_own" ON "daily_activity" FOR SELECT USING (user_id = public.get_user_id());
CREATE POLICY "daily_activity_insert_own" ON "daily_activity" FOR INSERT WITH CHECK (user_id = public.get_user_id());
CREATE POLICY "daily_activity_update_own" ON "daily_activity" FOR UPDATE USING (user_id = public.get_user_id());

-- AI chat session
ALTER TABLE "ai_chat_session" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_chat_session_select_own" ON "ai_chat_session" FOR SELECT USING (user_id = public.get_user_id());
CREATE POLICY "ai_chat_session_insert_own" ON "ai_chat_session" FOR INSERT WITH CHECK (user_id = public.get_user_id());
CREATE POLICY "ai_chat_session_update_own" ON "ai_chat_session" FOR UPDATE USING (user_id = public.get_user_id());
CREATE POLICY "ai_chat_session_delete_own" ON "ai_chat_session" FOR DELETE USING (user_id = public.get_user_id());

-- AI chat message (access via session ownership)
ALTER TABLE "ai_chat_message" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_chat_message_select_own" ON "ai_chat_message" FOR SELECT
  USING (session_id IN (SELECT id FROM public.ai_chat_session WHERE user_id = public.get_user_id()));
CREATE POLICY "ai_chat_message_insert_own" ON "ai_chat_message" FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM public.ai_chat_session WHERE user_id = public.get_user_id()));

-- Pronunciation attempt
ALTER TABLE "pronunciation_attempt" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pronunciation_attempt_select_own" ON "pronunciation_attempt" FOR SELECT USING (user_id = public.get_user_id());
CREATE POLICY "pronunciation_attempt_insert_own" ON "pronunciation_attempt" FOR INSERT WITH CHECK (user_id = public.get_user_id());
