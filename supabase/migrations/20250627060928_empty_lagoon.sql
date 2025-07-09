/*
  # Medication Names and Improvements

  1. New Tables
    - `medication_names` - Stores unique medication names for autocomplete
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `user_id` (uuid, references auth.users)
      - `organization_id` (uuid, references organizations)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Table Updates
    - `medications`
      - Add `observations` column (text)
      - Add `medical_prescription_url` column (text)
      - Make `frequency` column optional

  3. Security
    - Enable RLS on medication_names table
    - Add policies for authenticated users to read and insert medication names
    - Ensure organization-based access control

  4. Data Migration
    - Populate medication_names table with existing medication names
*/

-- Create medication_names table if it doesn't exist
CREATE TABLE IF NOT EXISTS medication_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, organization_id)
);

-- Enable RLS on medication_names table
ALTER TABLE medication_names ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for medication_names (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medication_names' AND policyname = 'Users can read medication names from their organization'
  ) THEN
    CREATE POLICY "Users can read medication names from their organization"
      ON medication_names
      FOR SELECT
      TO authenticated
      USING (
        (organization_id IS NULL) OR 
        (organization_id = (
          SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
        ))
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medication_names' AND policyname = 'Users can insert medication names for their organization'
  ) THEN
    CREATE POLICY "Users can insert medication names for their organization"
      ON medication_names
      FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = user_id AND
        (
          organization_id IS NULL OR
          organization_id = (
            SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Add new columns to medications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'observations'
  ) THEN
    ALTER TABLE medications ADD COLUMN observations text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'medical_prescription_url'
  ) THEN
    ALTER TABLE medications ADD COLUMN medical_prescription_url text;
  END IF;
END $$;

-- Make frequency column optional
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'frequency' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE medications ALTER COLUMN frequency DROP NOT NULL;
  END IF;
END $$;

-- Create indexes for medication_names
CREATE INDEX IF NOT EXISTS idx_medication_names_name ON medication_names(name);
CREATE INDEX IF NOT EXISTS idx_medication_names_user_id ON medication_names(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_names_organization_id ON medication_names(organization_id);

-- Create trigger for medication_names updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_medication_names_updated_at'
  ) THEN
    CREATE TRIGGER update_medication_names_updated_at
      BEFORE UPDATE ON medication_names
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Populate medication_names table with existing medication names
INSERT INTO medication_names (name, user_id, organization_id)
SELECT DISTINCT m.name, m.user_id, m.organization_id
FROM medications m
WHERE NOT EXISTS (
  SELECT 1 FROM medication_names mn 
  WHERE mn.name = m.name 
  AND (
    (mn.organization_id IS NULL AND m.organization_id IS NULL) OR
    mn.organization_id = m.organization_id
  )
)
ON CONFLICT (name, organization_id) DO NOTHING;
