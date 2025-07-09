/*
  # Financial Module Database Schema

  1. New Tables
    - `monthly_fees` - Monthly fees for residents
    - `accounts_payable` - Bills and expenses to pay
    - `accounts_receivable` - Money to be received
    - `cash_flow_entries` - Cash flow tracking
    - `financial_settings` - Financial configuration

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add performance indexes for common queries
*/

-- Create monthly_fees table
CREATE TABLE IF NOT EXISTS monthly_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  due_date date NOT NULL,
  paid_date date,
  discount decimal(10,2) DEFAULT 0 CHECK (discount >= 0),
  late_fee decimal(10,2) DEFAULT 0 CHECK (late_fee >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  observations text,
  payment_method text CHECK (payment_method IN ('cash', 'pix', 'bank_transfer', 'boleto', 'credit_card', 'debit_card', 'check')),
  month text NOT NULL, -- YYYY-MM format
  year integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create accounts_payable table
CREATE TABLE IF NOT EXISTS accounts_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('payroll', 'medications', 'food', 'maintenance', 'utilities', 'taxes', 'insurance', 'supplies', 'professional_services', 'others')),
  supplier text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  due_date date NOT NULL,
  paid_date date,
  payment_method text CHECK (payment_method IN ('cash', 'pix', 'bank_transfer', 'boleto', 'credit_card', 'debit_card', 'check')),
  cost_center text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  observations text,
  attachments text[] DEFAULT '{}',
  is_recurring boolean DEFAULT false,
  recurring_frequency text CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create accounts_receivable table
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  source text NOT NULL CHECK (source IN ('monthly_fee', 'health_insurance', 'donation', 'other_services', 'government_subsidy', 'others')),
  client text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  due_date date NOT NULL,
  received_date date,
  payment_method text CHECK (payment_method IN ('cash', 'pix', 'bank_transfer', 'boleto', 'credit_card', 'debit_card', 'check')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'overdue', 'cancelled')),
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create cash_flow_entries table
CREATE TABLE IF NOT EXISTS cash_flow_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  balance decimal(10,2) NOT NULL,
  reference_id uuid, -- Reference to monthly_fees, accounts_payable, etc.
  reference_type text, -- 'monthly_fee', 'account_payable', 'account_receivable'
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create financial_settings table
CREATE TABLE IF NOT EXISTS financial_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_due_day integer DEFAULT 5 CHECK (default_due_day BETWEEN 1 AND 28),
  late_fee_percentage decimal(5,2) DEFAULT 2.0 CHECK (late_fee_percentage >= 0),
  monthly_interest_rate decimal(5,2) DEFAULT 1.0 CHECK (monthly_interest_rate >= 0),
  early_payment_discount decimal(5,2) DEFAULT 0.0 CHECK (early_payment_discount >= 0),
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE monthly_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monthly_fees
CREATE POLICY "Users can read own monthly fees"
  ON monthly_fees FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly fees"
  ON monthly_fees FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly fees"
  ON monthly_fees FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly fees"
  ON monthly_fees FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for accounts_payable
CREATE POLICY "Users can read own accounts payable"
  ON accounts_payable FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts payable"
  ON accounts_payable FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts payable"
  ON accounts_payable FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts payable"
  ON accounts_payable FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for accounts_receivable
CREATE POLICY "Users can read own accounts receivable"
  ON accounts_receivable FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts receivable"
  ON accounts_receivable FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts receivable"
  ON accounts_receivable FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts receivable"
  ON accounts_receivable FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for cash_flow_entries
CREATE POLICY "Users can read own cash flow entries"
  ON cash_flow_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cash flow entries"
  ON cash_flow_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cash flow entries"
  ON cash_flow_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cash flow entries"
  ON cash_flow_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for financial_settings
CREATE POLICY "Users can read own financial settings"
  ON financial_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial settings"
  ON financial_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial settings"
  ON financial_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial settings"
  ON financial_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_fees_user_id ON monthly_fees(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_resident_id ON monthly_fees(resident_id);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_due_date ON monthly_fees(due_date);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_status ON monthly_fees(status);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_month_year ON monthly_fees(month, year);

CREATE INDEX IF NOT EXISTS idx_accounts_payable_user_id ON accounts_payable(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_category ON accounts_payable(category);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_supplier ON accounts_payable(supplier);

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_user_id ON accounts_receivable(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_source ON accounts_receivable(source);

CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_user_id ON cash_flow_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_date ON cash_flow_entries(date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_type ON cash_flow_entries(type);

-- Create triggers for updated_at
CREATE TRIGGER update_monthly_fees_updated_at
  BEFORE UPDATE ON monthly_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_payable_updated_at
  BEFORE UPDATE ON accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_receivable_updated_at
  BEFORE UPDATE ON accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_settings_updated_at
  BEFORE UPDATE ON financial_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
