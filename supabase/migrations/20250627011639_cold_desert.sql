/*
  # Fix Organizations RLS Policy

  1. Security Changes
    - Update RLS policy for organizations table to allow authenticated users to create organizations
    - Ensure proper policies are in place for organization management

  The current policy is too restrictive and prevents users from creating organizations during signup.
  This migration fixes the INSERT policy to allow any authenticated user to create an organization.
*/

-- Drop the existing restrictive INSERT policy if it exists
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Create a new INSERT policy that allows any authenticated user to create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure the SELECT policy allows users to read organizations (needed for the dropdown)
DROP POLICY IF EXISTS "Users can read organizations" ON organizations;
CREATE POLICY "Users can read organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep the existing UPDATE and DELETE policies for admins only
-- These should already exist but let's make sure they're correct
DROP POLICY IF EXISTS "Admins can update their organizations" ON organizations;
CREATE POLICY "Admins can update their organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.organization_id = organizations.id
      AND user_profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete their organizations" ON organizations;
CREATE POLICY "Admins can delete their organizations"
  ON organizations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.organization_id = organizations.id
      AND user_profiles.role = 'admin'
    )
  );
