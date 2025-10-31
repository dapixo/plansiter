-- Migration: Move isOnboarded from user_preferences to user_metadata
-- Date: 2025-10-31
-- Description: This migration moves the isOnboarded flag from the user_preferences table
--              to the auth.users.user_metadata JSONB column for better architecture.

-- ============================================
-- Step 1: Migrate existing data to user_metadata
-- ============================================

-- This script copies the is_onboarded value from user_preferences to auth.users.user_metadata
-- for all existing users who have completed onboarding.

-- NOTE: This requires SUPERUSER privileges or appropriate permissions on auth.users
-- Run this in the Supabase SQL Editor as a SERVICE_ROLE query

-- Update user_metadata for users who are onboarded
UPDATE auth.users
SET raw_user_meta_data =
  CASE
    WHEN raw_user_meta_data IS NULL THEN
      jsonb_build_object('isOnboarded', true)
    ELSE
      raw_user_meta_data || jsonb_build_object('isOnboarded', true)
  END
WHERE id IN (
  SELECT user_id
  FROM user_preferences
  WHERE is_onboarded = true
);

-- Set isOnboarded to false for users who are not onboarded
UPDATE auth.users
SET raw_user_meta_data =
  CASE
    WHEN raw_user_meta_data IS NULL THEN
      jsonb_build_object('isOnboarded', false)
    ELSE
      raw_user_meta_data || jsonb_build_object('isOnboarded', false)
  END
WHERE id IN (
  SELECT user_id
  FROM user_preferences
  WHERE is_onboarded = false OR is_onboarded IS NULL
);

-- Set isOnboarded to false for users who don't have preferences yet
UPDATE auth.users
SET raw_user_meta_data =
  CASE
    WHEN raw_user_meta_data IS NULL THEN
      jsonb_build_object('isOnboarded', false)
    ELSE
      raw_user_meta_data || jsonb_build_object('isOnboarded', false)
  END
WHERE id NOT IN (
  SELECT user_id FROM user_preferences
)
AND (raw_user_meta_data IS NULL OR NOT raw_user_meta_data ? 'isOnboarded');

-- ============================================
-- Step 2: Drop is_onboarded column from user_preferences
-- ============================================

-- After verifying the data migration was successful, drop the column
ALTER TABLE user_preferences
DROP COLUMN IF EXISTS is_onboarded;

-- ============================================
-- Step 3: Update user_preferences policies (if needed)
-- ============================================

-- If you have RLS policies that reference is_onboarded, they need to be updated
-- Example: Replace references to is_onboarded with auth.jwt() -> 'user_metadata' ->> 'isOnboarded'

-- ============================================
-- Verification Queries
-- ============================================

-- Count users with isOnboarded = true in user_metadata
-- SELECT COUNT(*) as onboarded_users
-- FROM auth.users
-- WHERE raw_user_meta_data ->> 'isOnboarded' = 'true';

-- Count users with isOnboarded = false in user_metadata
-- SELECT COUNT(*) as not_onboarded_users
-- FROM auth.users
-- WHERE raw_user_meta_data ->> 'isOnboarded' = 'false';

-- View sample of migrated data
-- SELECT
--   id,
--   email,
--   raw_user_meta_data ->> 'isOnboarded' as is_onboarded,
--   raw_user_meta_data ->> 'full_name' as full_name,
--   created_at
-- FROM auth.users
-- LIMIT 10;

-- ============================================
-- Rollback (if needed)
-- ============================================

-- To rollback this migration, you would need to:
-- 1. Re-add the is_onboarded column to user_preferences
-- 2. Copy values back from user_metadata to the table
-- 3. Remove isOnboarded from user_metadata

-- Uncomment to rollback:
-- ALTER TABLE user_preferences ADD COLUMN is_onboarded BOOLEAN DEFAULT FALSE;
--
-- UPDATE user_preferences
-- SET is_onboarded = (
--   SELECT (raw_user_meta_data ->> 'isOnboarded')::boolean
--   FROM auth.users
--   WHERE auth.users.id = user_preferences.user_id
-- );
