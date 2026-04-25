-- Clear legacy external avatar URLs (e.g. lh3.googleusercontent.com from Google OAuth).
-- After this migration, only emoji avatars (stored as plain emoji strings) remain.
-- NULL avatar_url falls back to display name initial in the UI.
UPDATE "user"
SET avatar_url = NULL
WHERE avatar_url LIKE 'http%';
