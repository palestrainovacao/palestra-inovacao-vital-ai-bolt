/*
  # Add settings column to user_profiles table

  1. Changes
    - Add `settings` column to `user_profiles` table
    - Column type: jsonb (allows storing JSON data)
    - Default value: empty JSON object
    - Nullable: true

  2. Security
    - No changes to RLS policies needed as existing policies cover all columns
*/

-- Add settings column to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'settings'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
