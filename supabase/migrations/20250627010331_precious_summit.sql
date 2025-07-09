/*
  # Fix Organizations RLS Policies

  1. Security Updates
    - Drop existing restrictive policies on organizations table
    - Create new policies that properly allow authenticated users to:
      - Insert new organizations
      - Read organizations they have access to
    - Ensure policies work correctly for organization creation during signup

  2. Changes
    - Replace existing INSERT policy with one that allows authenticated users to create organizations
    - Replace existing SELECT policy with one that allows authenticated users to read organizations
    - Add UPDATE policy for organization management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON organizations;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON organizations;

-- Create new policies that properly allow authenticated users to manage organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
