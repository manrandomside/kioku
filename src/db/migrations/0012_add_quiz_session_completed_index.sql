-- Add composite index for getLastQuizScore dashboard query.
-- Covers: WHERE user_id = ? AND is_completed = true ORDER BY completed_at DESC LIMIT 1
CREATE INDEX IF NOT EXISTS "idx_quiz_session_user_completed"
  ON "quiz_session" USING btree ("user_id", "is_completed", "completed_at");
