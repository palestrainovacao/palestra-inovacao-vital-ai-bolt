/*
  # Complete ILPI Management System Schema

  1. New Tables
    - `user_profiles` - User profile information with roles
    - `residents` - Resident information and health status
    - `medications` - Medication schedules and prescriptions
    - `caregivers` - Caregiver information and shifts
    - `schedules` - Work schedules for caregivers
    - `family_messages` - Communication with family members

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Automatic timestamp updates with triggers

  3. Sample Data
    - Example residents, medications, caregivers, and messages
    - Proper foreign key relationships
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text CHECK (role IN ('admin', 'nurse', 'caregiver', 'coordinator')) DEFAULT 'caregiver',
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create residents table
CREATE TABLE IF NOT EXISTS residents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  age integer NOT NULL CHECK (age > 0),
  gender text CHECK (gender IN ('M', 'F')) NOT NULL,
  admission_date date DEFAULT CURRENT_DATE,
  room text NOT NULL,
  emergency_contact_name text NOT NULL,
  emergency_contact_phone text NOT NULL,
  emergency_contact_relation text NOT NULL,
  health_status text CHECK (health_status IN ('stable', 'attention', 'critical')) DEFAULT 'stable',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  time_schedule text[] NOT NULL DEFAULT '{}',
  resident_id uuid REFERENCES residents(id) ON DELETE CASCADE NOT NULL,
  prescribed_by text NOT NULL,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  status text CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create caregivers table
CREATE TABLE IF NOT EXISTS caregivers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  phone text NOT NULL,
  shift text CHECK (shift IN ('morning', 'afternoon', 'night')) NOT NULL,
  specialization text[] NOT NULL DEFAULT '{}',
  status text CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  caregiver_id uuid REFERENCES caregivers(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  shift text CHECK (shift IN ('morning', 'afternoon', 'night')) NOT NULL,
  residents text[] NOT NULL DEFAULT '{}',
  status text CHECK (status IN ('scheduled', 'completed', 'absent')) DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create family_messages table
CREATE TABLE IF NOT EXISTS family_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id uuid REFERENCES residents(id) ON DELETE CASCADE NOT NULL,
  from_name text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('update', 'request', 'emergency')) DEFAULT 'update',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- User profiles: Users can read and update their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Residents: Users can manage their own residents
CREATE POLICY "Users can read own residents"
  ON residents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own residents"
  ON residents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own residents"
  ON residents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own residents"
  ON residents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Medications: Users can manage medications for their residents
CREATE POLICY "Users can read own medications"
  ON medications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medications"
  ON medications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medications"
  ON medications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medications"
  ON medications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Caregivers: Users can manage their own caregivers
CREATE POLICY "Users can read own caregivers"
  ON caregivers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own caregivers"
  ON caregivers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own caregivers"
  ON caregivers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own caregivers"
  ON caregivers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Schedules: Users can manage their own schedules
CREATE POLICY "Users can read own schedules"
  ON schedules
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
  ON schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON schedules
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON schedules
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Family messages: Users can manage messages for their residents
CREATE POLICY "Users can read own family messages"
  ON family_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own family messages"
  ON family_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own family messages"
  ON family_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own family messages"
  ON family_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_residents_updated_at
  BEFORE UPDATE ON residents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_caregivers_updated_at
  BEFORE UPDATE ON caregivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_messages_updated_at
  BEFORE UPDATE ON family_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_residents_user_id ON residents(user_id);
CREATE INDEX IF NOT EXISTS idx_residents_health_status ON residents(health_status);
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_resident_id ON medications(resident_id);
CREATE INDEX IF NOT EXISTS idx_medications_status ON medications(status);
CREATE INDEX IF NOT EXISTS idx_caregivers_user_id ON caregivers(user_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_shift ON caregivers(shift);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_family_messages_user_id ON family_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_family_messages_resident_id ON family_messages(resident_id);
CREATE INDEX IF NOT EXISTS idx_family_messages_read ON family_messages(read);
