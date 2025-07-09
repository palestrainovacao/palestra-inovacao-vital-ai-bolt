/*
  # Add INSERT policy for organizations table

  1. Security Changes
    - Add policy to allow authenticated users to create new organizations
    - This enables organization creation during user signup process
    
  2. Policy Details
    - Allow any authenticated user to insert new organizations
    - This is needed for the signup flow where users can create new organizations
*/

-- Add policy to allow authenticated users to create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
