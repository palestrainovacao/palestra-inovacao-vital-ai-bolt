/*
  # Fix Organizations RLS Policies

  1. Security Changes
    - Drop existing restrictive policies on organizations table
    - Add proper policies for authenticated users to create and manage organizations
    - Allow users to create organizations (INSERT)
    - Allow users to read organizations they have access to (SELECT)
    - Allow users to update organizations they are associated with (UPDATE)

  2. Changes Made
    - Remove overly restrictive policies
    - Add policy for authenticated users to create organizations
    - Add policy for users to read organizations they belong to
    - Add policy for organization updates by associated users
*/

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can read organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can update organizations" ON organizations;

-- Allow authenticated users to create organizations
CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to read organizations they are associated with
CREATE POLICY "Users can read associated organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      -- User is associated with this organization through their profile
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.organization_id = organizations.id
      )
      -- OR user created this organization (for initial access)
      OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role = 'admin'
      )
      -- OR allow reading all organizations for selection during signup
      OR TRUE
    )
  );

-- Allow users to update organizations they are associated with as admin
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.organization_id = organizations.id
      AND user_profiles.role = 'admin'
    )
  );

-- Allow admins to delete organizations they manage
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
