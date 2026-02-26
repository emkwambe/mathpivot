-- ============================================================================
-- ADD USER PREFERENCES (TIME FORMAT)
-- Migration 00015: Add time format preference to users_profile
-- ============================================================================

-- Add time_format column (12h or 24h)
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS time_format TEXT NOT NULL DEFAULT '12h'
CHECK (time_format IN ('12h', '24h'));

-- Add comment
COMMENT ON COLUMN users_profile.time_format IS 'User preferred time format: 12h (AM/PM) or 24h';
