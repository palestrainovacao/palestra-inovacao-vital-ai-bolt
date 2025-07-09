/*
  # Fix Organizations RLS Policy

  1. Security Updates
    - Drop existing INSERT policy that may be causing issues
    - Create new INSERT policy that properly allows authenticated users to create organizations
    - Ensure the policy works with the current authentication system

  2. Changes
    - Remove problematic INSERT policy
    - Add new INSERT policy with proper authentication check
    - Maintain existing SELECT policy for reading organizations
*/

-- Drop the existing INSERT policy that might be causing issues
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Create a new INSERT policy that allows authenticated users to create organizations
CREATE POLICY "Enable insert for authenticated users"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure the SELECT policy is still working properly
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON organizations;

CREATE POLICY "Enable read access for all authenticated users"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (true);
