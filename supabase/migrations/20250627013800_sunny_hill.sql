/*
  # Fix RLS Policies for Organizations Table

  1. Changes
    - Drop all existing policies on the organizations table
    - Create new policies that allow:
      - Anyone (public) to create organizations
      - Anyone (public) to read organizations
      - Admins to update their organizations
      - Admins to delete their organizations
    
  2. Purpose
    - Fix the "new row violates row-level security policy for table organizations" error
    - Enable proper organization creation during signup and demo account creation
    - Maintain proper access control for organization management
*/

-- Drop all existing policies on organizations table to start fresh
DROP POLICY IF EXISTS "Anyone can create organizations" ON organizations;
DROP POLICY IF EXISTS "Anyone can read organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can delete their organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can read organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can read associated organizations" ON organizations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON organizations;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON organizations;

-- Create new policies with public access for INSERT and SELECT
CREATE POLICY "Anyone can create organizations"
  ON organizations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read organizations"
  ON organizations
  FOR SELECT
  TO public
  USING (true);

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
