/*
  # Create Health Records Tables

  1. New Tables
    - `vital_signs`
      - `id` (uuid, primary key)
      - `resident_id` (uuid, foreign key to residents)
      - `systolic_pressure` (integer, systolic blood pressure)
      - `diastolic_pressure` (integer, diastolic blood pressure)
      - `oxygen_saturation` (numeric, oxygen saturation percentage)
      - `glucose` (numeric, glucose level in mg/dL)
      - `heart_rate` (integer, heart rate in bpm)
      - `temperature` (numeric, temperature in Celsius)
      - `recorded_at` (timestamp, when the measurement was taken)
      - `observations` (text, additional notes)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `elimination_records`
      - `id` (uuid, primary key)
      - `resident_id` (uuid, foreign key to residents)
      - `type` (text, 'evacuation' or 'urine')
      - `recorded_at` (timestamp, when the elimination occurred)
      - `evacuation_count` (integer, number of evacuations - only for evacuation type)
      - `evacuation_consistency` (text, consistency of evacuation)
      - `urine_volume` (integer, volume in ml - only for urine type)
      - `urine_color` (text, color of urine)
      - `observations` (text, additional notes)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `intercurrences`
      - `id` (uuid, primary key)
      - `resident_id` (uuid, foreign key to residents)
      - `type` (text, type of intercurrence)
      - `description` (text, detailed description)
      - `severity` (text, severity level)
      - `actions_taken` (text, actions taken)
      - `outcome` (text, outcome of the intercurrence)
      - `occurred_at` (timestamp, when the intercurrence happened)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add appropriate indexes for performance
    - Add check constraints for data validation
*/

-- Create vital_signs table
CREATE TABLE IF NOT EXISTS public.vital_signs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    systolic_pressure integer CHECK (systolic_pressure > 0 AND systolic_pressure <= 300),
    diastolic_pressure integer CHECK (diastolic_pressure > 0 AND diastolic_pressure <= 200),
    oxygen_saturation numeric(5,2) CHECK (oxygen_saturation >= 0 AND oxygen_saturation <= 100),
    glucose numeric(6,2) CHECK (glucose >= 0 AND glucose <= 1000),
    heart_rate integer CHECK (heart_rate > 0 AND heart_rate <= 300),
    temperature numeric(4,2) CHECK (temperature >= 30 AND temperature <= 45),
    recorded_at timestamp with time zone NOT NULL DEFAULT now(),
    observations text,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create elimination_records table
CREATE TABLE IF NOT EXISTS public.elimination_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('evacuation', 'urine')),
    recorded_at timestamp with time zone NOT NULL DEFAULT now(),
    evacuation_count integer CHECK (evacuation_count > 0),
    evacuation_consistency text CHECK (evacuation_consistency IN ('solid', 'soft', 'liquid', 'hard', 'other')),
    urine_volume integer CHECK (urine_volume > 0),
    urine_color text CHECK (urine_color IN ('clear', 'yellow', 'dark_yellow', 'amber', 'brown', 'red', 'other')),
    observations text,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create intercurrences table
CREATE TABLE IF NOT EXISTS public.intercurrences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id uuid NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('fainting', 'vomiting', 'fall', 'seizure', 'pain', 'breathing_difficulty', 'skin_injury', 'behavioral_change', 'other')),
    description text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    actions_taken text,
    outcome text,
    occurred_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
-- Vital signs indexes
CREATE INDEX IF NOT EXISTS idx_vital_signs_resident_id ON public.vital_signs(resident_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_recorded_at ON public.vital_signs(recorded_at);
CREATE INDEX IF NOT EXISTS idx_vital_signs_user_id ON public.vital_signs(user_id);

-- Elimination records indexes
CREATE INDEX IF NOT EXISTS idx_elimination_records_resident_id ON public.elimination_records(resident_id);
CREATE INDEX IF NOT EXISTS idx_elimination_records_type ON public.elimination_records(type);
CREATE INDEX IF NOT EXISTS idx_elimination_records_recorded_at ON public.elimination_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_elimination_records_user_id ON public.elimination_records(user_id);

-- Intercurrences indexes
CREATE INDEX IF NOT EXISTS idx_intercurrences_resident_id ON public.intercurrences(resident_id);
CREATE INDEX IF NOT EXISTS idx_intercurrences_type ON public.intercurrences(type);
CREATE INDEX IF NOT EXISTS idx_intercurrences_severity ON public.intercurrences(severity);
CREATE INDEX IF NOT EXISTS idx_intercurrences_occurred_at ON public.intercurrences(occurred_at);
CREATE INDEX IF NOT EXISTS idx_intercurrences_user_id ON public.intercurrences(user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elimination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intercurrences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vital_signs table
CREATE POLICY "Users can insert own vital signs"
ON public.vital_signs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own vital signs"
ON public.vital_signs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own vital signs"
ON public.vital_signs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vital signs"
ON public.vital_signs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policies for elimination_records table
CREATE POLICY "Users can insert own elimination records"
ON public.elimination_records
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own elimination records"
ON public.elimination_records
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own elimination records"
ON public.elimination_records
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own elimination records"
ON public.elimination_records
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policies for intercurrences table
CREATE POLICY "Users can insert own intercurrences"
ON public.intercurrences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own intercurrences"
ON public.intercurrences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own intercurrences"
ON public.intercurrences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own intercurrences"
ON public.intercurrences
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create triggers to update the 'updated_at' column on each update
CREATE TRIGGER update_vital_signs_updated_at
BEFORE UPDATE ON public.vital_signs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elimination_records_updated_at
BEFORE UPDATE ON public.elimination_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intercurrences_updated_at
BEFORE UPDATE ON public.intercurrences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
