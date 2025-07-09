/*
  # Fix Organizations RLS Policy

  1. Security Changes
    - Drop existing problematic INSERT policy for organizations
    - Create a new, simpler INSERT policy that allows authenticated users to create organizations
    - Ensure the policy works correctly for organization creation during signup

  The issue is that the current INSERT policy may have conflicting conditions or be too restrictive.
  We'll create a straightforward policy that allows any authenticated user to create an organization.
*/

-- Drop the existing INSERT policy that's causing issues
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;

-- Create a new, simpler INSERT policy for organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure the SELECT policy allows users to see organizations they can join
DROP POLICY IF EXISTS "Users can read associated organizations" ON organizations;

CREATE POLICY "Users can read organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (true);
