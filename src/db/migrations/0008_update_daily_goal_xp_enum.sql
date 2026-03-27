-- Add new daily_goal_xp enum values: 300, 500, 750, 1000
-- Remove old values: 30, 50, 200
-- Keep: 100 (shared between old and new)

-- Rename old enum
ALTER TYPE daily_goal_xp RENAME TO daily_goal_xp_old;

-- Create new enum with updated values
CREATE TYPE daily_goal_xp AS ENUM ('100', '300', '500', '750', '1000');

-- Drop default first (old default '30' can't auto-cast to new enum)
ALTER TABLE "user" ALTER COLUMN daily_goal_xp DROP DEFAULT;

-- Migrate column: map old values to new defaults
ALTER TABLE "user" ALTER COLUMN daily_goal_xp TYPE daily_goal_xp
  USING CASE
    WHEN daily_goal_xp::text IN ('30', '50') THEN '100'::daily_goal_xp
    WHEN daily_goal_xp::text = '100' THEN '100'::daily_goal_xp
    WHEN daily_goal_xp::text = '200' THEN '300'::daily_goal_xp
    ELSE '100'::daily_goal_xp
  END;

-- Set new default
ALTER TABLE "user" ALTER COLUMN daily_goal_xp SET DEFAULT '100'::daily_goal_xp;

-- Drop old enum
DROP TYPE daily_goal_xp_old;
