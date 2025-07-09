/*
  # Fix Organization RLS Policies

  1. Security Updates
    - Update organization policies to allow unauthenticated users to create organizations during signup
    - Add proper policies for organization management
    - Ensure demo account creation works properly

  2. Changes
    - Modify INSERT policy to allow organization creation during signup process
    - Add proper SELECT policy for organization listing
    - Maintain security while allowing necessary operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can read organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can delete their organizations" ON organizations;

-- Create new policies that handle the signup flow properly
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
