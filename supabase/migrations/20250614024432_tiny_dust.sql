/*
  # Create family members table and update family messages

  1. New Tables
    - `family_members`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `phone` (text, not null)
      - `email` (text, optional)
      - `relation` (text, not null)
      - `resident_id` (uuid, foreign key to residents)
      - `is_primary` (boolean, default false)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, references auth users)

  2. Table Updates
    - `family_messages`
      - Add `family_member_id` column (optional reference to family_members)
      - Add `parent_message_id` column (for message threading)
      - Update type constraint to include 'response'

  3. Security
    - Enable RLS on `family_members` table
    - Add policies for authenticated users to manage their own family members
    - Add indexes for performance

  4. Triggers
    - Add updated_at trigger for family_members
*/

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  relation text NOT NULL,
  resident_id uuid NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);

-- Enable RLS
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Create policies for family_members
CREATE POLICY "Users can read own family members"
  ON family_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own family members"
  ON family_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own family members"
  ON family_members
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own family members"
  ON family_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_family_members_resident_id ON family_members(resident_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_is_primary ON family_members(is_primary);

-- Add trigger for updated_at
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add new columns to family_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_messages' AND column_name = 'family_member_id'
  ) THEN
    ALTER TABLE family_messages ADD COLUMN family_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_messages' AND column_name = 'parent_message_id'
  ) THEN
    ALTER TABLE family_messages ADD COLUMN parent_message_id uuid REFERENCES family_messages(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update the type constraint to include 'response'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'family_messages_type_check'
  ) THEN
    ALTER TABLE family_messages DROP CONSTRAINT family_messages_type_check;
  END IF;
  
  ALTER TABLE family_messages ADD CONSTRAINT family_messages_type_check 
    CHECK (type = ANY (ARRAY['update'::text, 'request'::text, 'emergency'::text, 'response'::text]));
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_family_messages_family_member_id ON family_messages(family_member_id);
CREATE INDEX IF NOT EXISTS idx_family_messages_parent_message_id ON family_messages(parent_message_id);
