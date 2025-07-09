/*
  # Create diaper_usages table

  1. New Tables
    - `diaper_usages`
      - `id` (uuid, primary key)
      - `resident_id` (uuid, foreign key to residents)
      - `date` (date, when the diapers were used)
      - `quantity` (integer, number of diapers used)
      - `shift` (text, shift when diapers were used: morning, afternoon, night)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `diaper_usages` table
    - Add policies for authenticated users to manage their own data

  3. Constraints
    - Check constraint for positive quantity
    - Check constraint for valid shift values
    - Foreign key constraints for data integrity

  4. Triggers
    - Auto-update `updated_at` timestamp on record changes
*/

-- Create the diaper_usages table
CREATE TABLE IF NOT EXISTS public.diaper_usages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    date date NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    shift text NOT NULL DEFAULT 'morning',
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add a CHECK constraint for the shift column
ALTER TABLE public.diaper_usages
ADD CONSTRAINT diaper_usages_shift_check
CHECK (shift IN ('morning', 'afternoon', 'night'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diaper_usages_resident_id ON public.diaper_usages(resident_id);
CREATE INDEX IF NOT EXISTS idx_diaper_usages_date ON public.diaper_usages(date);
CREATE INDEX IF NOT EXISTS idx_diaper_usages_user_id ON public.diaper_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_diaper_usages_shift ON public.diaper_usages(shift);

-- Enable Row Level Security (RLS)
ALTER TABLE public.diaper_usages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for diaper_usages table
-- Users can insert their own diaper usages
CREATE POLICY "Users can insert own diaper usages"
ON public.diaper_usages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can read their own diaper usages
CREATE POLICY "Users can read own diaper usages"
ON public.diaper_usages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own diaper usages
CREATE POLICY "Users can update own diaper usages"
ON public.diaper_usages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own diaper usages
CREATE POLICY "Users can delete own diaper usages"
ON public.diaper_usages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create a trigger to update the 'updated_at' column on each update
CREATE TRIGGER update_diaper_usages_updated_at
BEFORE UPDATE ON public.diaper_usages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
