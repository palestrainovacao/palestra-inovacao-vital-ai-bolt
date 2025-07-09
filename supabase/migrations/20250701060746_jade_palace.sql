-- Helper function to get user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate RLS policies for residents
DROP POLICY IF EXISTS "Users can read own residents" ON residents;
DROP POLICY IF EXISTS "Users can insert own residents" ON residents;
DROP POLICY IF EXISTS "Users can update own residents" ON residents;
DROP POLICY IF EXISTS "Users can delete own residents" ON residents;

CREATE POLICY "Users can read residents from their organization"
  ON residents FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert residents for their organization"
  ON residents FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update residents from their organization"
  ON residents FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete residents from their organization"
  ON residents FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for medications
DROP POLICY IF EXISTS "Users can read own medications" ON medications;
DROP POLICY IF EXISTS "Users can insert own medications" ON medications;
DROP POLICY IF EXISTS "Users can update own medications" ON medications;
DROP POLICY IF EXISTS "Users can delete own medications" ON medications;

CREATE POLICY "Users can read medications from their organization"
  ON medications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert medications for their organization"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update medications from their organization"
  ON medications FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete medications from their organization"
  ON medications FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for caregivers
DROP POLICY IF EXISTS "Users can read own caregivers" ON caregivers;
DROP POLICY IF EXISTS "Users can insert own caregivers" ON caregivers;
DROP POLICY IF EXISTS "Users can update own caregivers" ON caregivers;
DROP POLICY IF EXISTS "Users can delete own caregivers" ON caregivers;

CREATE POLICY "Users can read caregivers from their organization"
  ON caregivers FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert caregivers for their organization"
  ON caregivers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update caregivers from their organization"
  ON caregivers FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete caregivers from their organization"
  ON caregivers FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for family_members
DROP POLICY IF EXISTS "Users can read own family members" ON family_members;
DROP POLICY IF EXISTS "Users can insert own family members" ON family_members;
DROP POLICY IF EXISTS "Users can update own family members" ON family_members;
DROP POLICY IF EXISTS "Users can delete own family members" ON family_members;

CREATE POLICY "Users can read family members from their organization"
  ON family_members FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert family members for their organization"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update family members from their organization"
  ON family_members FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete family members from their organization"
  ON family_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for family_messages
DROP POLICY IF EXISTS "Users can read own family messages" ON family_messages;
DROP POLICY IF EXISTS "Users can insert own family messages" ON family_messages;
DROP POLICY IF EXISTS "Users can update own family messages" ON family_messages;
DROP POLICY IF EXISTS "Users can delete own family messages" ON family_messages;

CREATE POLICY "Users can read family messages from their organization"
  ON family_messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert family messages for their organization"
  ON family_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update family messages from their organization"
  ON family_messages FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete family messages from their organization"
  ON family_messages FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for diaper_usages
DROP POLICY IF EXISTS "Users can read own diaper usages" ON diaper_usages;
DROP POLICY IF EXISTS "Users can insert own diaper usages" ON diaper_usages;
DROP POLICY IF EXISTS "Users can update own diaper usages" ON diaper_usages;
DROP POLICY IF EXISTS "Users can delete own diaper usages" ON diaper_usages;

CREATE POLICY "Users can read diaper usages from their organization"
  ON diaper_usages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert diaper usages for their organization"
  ON diaper_usages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update diaper usages from their organization"
  ON diaper_usages FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete diaper usages from their organization"
  ON diaper_usages FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for diaper_types
DROP POLICY IF EXISTS "Admins can manage diaper types" ON diaper_types;

CREATE POLICY "Users can read diaper types from their organization"
  ON diaper_types FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

CREATE POLICY "Admins can manage diaper types for their organization"
  ON diaper_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND (
        organization_id IS NULL OR
        organization_id = get_user_organization_id()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND (
        organization_id IS NULL OR
        organization_id = get_user_organization_id()
      )
    )
  );

-- Drop and recreate RLS policies for vital_signs
DROP POLICY IF EXISTS "Users can read own vital signs" ON vital_signs;
DROP POLICY IF EXISTS "Users can insert own vital signs" ON vital_signs;
DROP POLICY IF EXISTS "Users can update own vital signs" ON vital_signs;
DROP POLICY IF EXISTS "Users can delete own vital signs" ON vital_signs;

CREATE POLICY "Users can read vital signs from their organization"
  ON vital_signs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert vital signs for their organization"
  ON vital_signs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update vital signs from their organization"
  ON vital_signs FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete vital signs from their organization"
  ON vital_signs FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for elimination_records
DROP POLICY IF EXISTS "Users can read own elimination records" ON elimination_records;
DROP POLICY IF EXISTS "Users can insert own elimination records" ON elimination_records;
DROP POLICY IF EXISTS "Users can update own elimination records" ON elimination_records;
DROP POLICY IF EXISTS "Users can delete own elimination records" ON elimination_records;

CREATE POLICY "Users can read elimination records from their organization"
  ON elimination_records FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert elimination records for their organization"
  ON elimination_records FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update elimination records from their organization"
  ON elimination_records FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete elimination records from their organization"
  ON elimination_records FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for intercurrences
DROP POLICY IF EXISTS "Users can read own intercurrences" ON intercurrences;
DROP POLICY IF EXISTS "Users can insert own intercurrences" ON intercurrences;
DROP POLICY IF EXISTS "Users can update own intercurrences" ON intercurrences;
DROP POLICY IF EXISTS "Users can delete own intercurrences" ON intercurrences;

CREATE POLICY "Users can read intercurrences from their organization"
  ON intercurrences FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert intercurrences for their organization"
  ON intercurrences FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update intercurrences from their organization"
  ON intercurrences FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete intercurrences from their organization"
  ON intercurrences FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can read notifications from their organization"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert notifications for their organization"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update notifications from their organization"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete notifications from their organization"
  ON notifications FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for monthly_fees
DROP POLICY IF EXISTS "Users can read own monthly fees" ON monthly_fees;
DROP POLICY IF EXISTS "Users can insert own monthly fees" ON monthly_fees;
DROP POLICY IF EXISTS "Users can update own monthly fees" ON monthly_fees;
DROP POLICY IF EXISTS "Users can delete own monthly fees" ON monthly_fees;

CREATE POLICY "Users can read monthly fees from their organization"
  ON monthly_fees FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert monthly fees for their organization"
  ON monthly_fees FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update monthly fees from their organization"
  ON monthly_fees FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete monthly fees from their organization"
  ON monthly_fees FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for accounts_payable
DROP POLICY IF EXISTS "Users can read own accounts payable" ON accounts_payable;
DROP POLICY IF EXISTS "Users can insert own accounts payable" ON accounts_payable;
DROP POLICY IF EXISTS "Users can update own accounts payable" ON accounts_payable;
DROP POLICY IF EXISTS "Users can delete own accounts payable" ON accounts_payable;

CREATE POLICY "Users can read accounts payable from their organization"
  ON accounts_payable FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert accounts payable for their organization"
  ON accounts_payable FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update accounts payable from their organization"
  ON accounts_payable FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete accounts payable from their organization"
  ON accounts_payable FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for accounts_receivable
DROP POLICY IF EXISTS "Users can read own accounts receivable" ON accounts_receivable;
DROP POLICY IF EXISTS "Users can insert own accounts receivable" ON accounts_receivable;
DROP POLICY IF EXISTS "Users can update own accounts receivable" ON accounts_receivable;
DROP POLICY IF EXISTS "Users can delete own accounts receivable" ON accounts_receivable;

CREATE POLICY "Users can read accounts receivable from their organization"
  ON accounts_receivable FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert accounts receivable for their organization"
  ON accounts_receivable FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update accounts receivable from their organization"
  ON accounts_receivable FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete accounts receivable from their organization"
  ON accounts_receivable FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for cash_flow_entries
DROP POLICY IF EXISTS "Users can read own cash flow entries" ON cash_flow_entries;
DROP POLICY IF EXISTS "Users can insert own cash flow entries" ON cash_flow_entries;
DROP POLICY IF EXISTS "Users can update own cash flow entries" ON cash_flow_entries;
DROP POLICY IF EXISTS "Users can delete own cash flow entries" ON cash_flow_entries;

CREATE POLICY "Users can read cash flow entries from their organization"
  ON cash_flow_entries FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert cash flow entries for their organization"
  ON cash_flow_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update cash flow entries from their organization"
  ON cash_flow_entries FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete cash flow entries from their organization"
  ON cash_flow_entries FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for financial_settings
DROP POLICY IF EXISTS "Users can read own financial settings" ON financial_settings;
DROP POLICY IF EXISTS "Users can insert own financial settings" ON financial_settings;
DROP POLICY IF EXISTS "Users can update own financial settings" ON financial_settings;
DROP POLICY IF EXISTS "Users can delete own financial settings" ON financial_settings;

CREATE POLICY "Users can read financial settings from their organization"
  ON financial_settings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can insert financial settings for their organization"
  ON financial_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update financial settings from their organization"
  ON financial_settings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete financial settings from their organization"
  ON financial_settings FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

-- Drop and recreate RLS policies for medication_names
DROP POLICY IF EXISTS "Users can read medication names from their organization" ON medication_names;
DROP POLICY IF EXISTS "Users can insert medication names for their organization" ON medication_names;

CREATE POLICY "Users can read medication names from their organization"
  ON medication_names FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL OR
    organization_id = get_user_organization_id()
  );

CREATE POLICY "Users can insert medication names for their organization"
  ON medication_names FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update medication names from their organization"
  ON medication_names FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete medication names from their organization"
  ON medication_names FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    (
      organization_id IS NULL OR
      organization_id = get_user_organization_id()
    )
  );
