/*
  # Restrict Organization Creation to Admins

  1. Security Changes
    - Update RLS policies for organizations table
    - Restrict organization creation to authenticated users with admin role
    - Maintain existing policies for reading, updating, and deleting organizations

  2. Purpose
    - Implement proper access control for organization creation
    - Ensure only admin users can create new organizations
    - Align database security with application business logic
*/

-- Drop existing policies that are too permissive
DROP POLICY IF EXISTS "Anyone can create organizations" ON organizations;
DROP POLICY IF EXISTS "Anyone can read organizations" ON organizations;

-- Create new policies with proper restrictions
CREATE POLICY "Only admins can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Allow anyone to read organizations (needed for organization selection)
CREATE POLICY "Anyone can read organizations"
  ON organizations
  FOR SELECT
  TO public
  USING (true);

-- Keep existing policies for update and delete
-- These should already be restricted to admins
