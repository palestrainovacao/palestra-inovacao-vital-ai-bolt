/*
  # Create family_members table

  1. New Tables
    - `family_members`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `phone` (text, required)
      - `email` (text, optional)
      - `relation` (text, required)
      - `resident_id` (uuid, foreign key to residents)
      - `is_primary` (boolean, default false)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `family_members` table
    - Add policies for authenticated users to manage their own family members

  3. Performance
    - Add indexes on commonly queried columns
    - Add updated_at trigger
*/

-- Create the family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  relation text NOT NULL,
  resident_id uuid NOT NULL,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);

-- Enable Row Level Security
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Create foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_members_resident_id_fkey'
  ) THEN
    ALTER TABLE family_members 
    ADD CONSTRAINT family_members_resident_id_fkey 
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_members_user_id_fkey'
  ) THEN
    ALTER TABLE family_members 
    ADD CONSTRAINT family_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create or replace RLS policies
DROP POLICY IF EXISTS "Users can read own family members" ON family_members;
CREATE POLICY "Users can read own family members"
  ON family_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own family members" ON family_members;
CREATE POLICY "Users can insert own family members"
  ON family_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own family members" ON family_members;
CREATE POLICY "Users can update own family members"
  ON family_members
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own family members" ON family_members;
CREATE POLICY "Users can delete own family members"
  ON family_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_resident_id ON family_members(resident_id);
CREATE INDEX IF NOT EXISTS idx_family_members_is_primary ON family_members(is_primary);

-- Create or replace the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_family_members_updated_at ON family_members;
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
