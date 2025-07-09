/*
  # Add organization_id for multi-tenant support

  1. New Table
    - `organizations` - Organization information for multi-tenant support

  2. Table Updates
    - Add `organization_id` column to all existing tables
    - Create foreign key constraints to organizations table
    - Add indexes for better query performance

  3. Security
    - Enable RLS on organizations table
    - Add basic read policy for authenticated users
*/

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS to organizations table (optional, but good practice for multi-tenant)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users"
ON public.organizations
FOR SELECT
TO authenticated
USING (true);

-- Add organization_id to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.user_profiles
ADD CONSTRAINT fk_user_profiles_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id ON public.user_profiles(organization_id);

-- Add organization_id to residents
ALTER TABLE public.residents
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.residents
ADD CONSTRAINT fk_residents_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_residents_organization_id ON public.residents(organization_id);

-- Add organization_id to monthly_fees
ALTER TABLE public.monthly_fees
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.monthly_fees
ADD CONSTRAINT fk_monthly_fees_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_monthly_fees_organization_id ON public.monthly_fees(organization_id);

-- Add organization_id to accounts_payable
ALTER TABLE public.accounts_payable
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.accounts_payable
ADD CONSTRAINT fk_accounts_payable_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_accounts_payable_organization_id ON public.accounts_payable(organization_id);

-- Add organization_id to accounts_receivable
ALTER TABLE public.accounts_receivable
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.accounts_receivable
ADD CONSTRAINT fk_accounts_receivable_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_organization_id ON public.accounts_receivable(organization_id);

-- Add organization_id to cash_flow_entries
ALTER TABLE public.cash_flow_entries
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.cash_flow_entries
ADD CONSTRAINT fk_cash_flow_entries_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_organization_id ON public.cash_flow_entries(organization_id);

-- Add organization_id to financial_settings
ALTER TABLE public.financial_settings
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.financial_settings
ADD CONSTRAINT fk_financial_settings_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_financial_settings_organization_id ON public.financial_settings(organization_id);

-- Add organization_id to medications
ALTER TABLE public.medications
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.medications
ADD CONSTRAINT fk_medications_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_medications_organization_id ON public.medications(organization_id);

-- Add organization_id to caregivers
ALTER TABLE public.caregivers
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.caregivers
ADD CONSTRAINT fk_caregivers_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_caregivers_organization_id ON public.caregivers(organization_id);

-- Add organization_id to schedules
ALTER TABLE public.schedules
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.schedules
ADD CONSTRAINT fk_schedules_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_schedules_organization_id ON public.schedules(organization_id);

-- Add organization_id to family_members
ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.family_members
ADD CONSTRAINT fk_family_members_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_family_members_organization_id ON public.family_members(organization_id);

-- Add organization_id to family_messages
ALTER TABLE public.family_messages
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.family_messages
ADD CONSTRAINT fk_family_messages_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_family_messages_organization_id ON public.family_messages(organization_id);

-- Add organization_id to diaper_usages
ALTER TABLE public.diaper_usages
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.diaper_usages
ADD CONSTRAINT fk_diaper_usages_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_diaper_usages_organization_id ON public.diaper_usages(organization_id);

-- Add organization_id to diaper_types
ALTER TABLE public.diaper_types
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.diaper_types
ADD CONSTRAINT fk_diaper_types_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_diaper_types_organization_id ON public.diaper_types(organization_id);

-- Add organization_id to vital_signs
ALTER TABLE public.vital_signs
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.vital_signs
ADD CONSTRAINT fk_vital_signs_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_vital_signs_organization_id ON public.vital_signs(organization_id);

-- Add organization_id to elimination_records
ALTER TABLE public.elimination_records
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.elimination_records
ADD CONSTRAINT fk_elimination_records_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_elimination_records_organization_id ON public.elimination_records(organization_id);

-- Add organization_id to intercurrences
ALTER TABLE public.intercurrences
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.intercurrences
ADD CONSTRAINT fk_intercurrences_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_intercurrences_organization_id ON public.intercurrences(organization_id);

-- Add organization_id to notifications
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.notifications
ADD CONSTRAINT fk_notifications_organization_id
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON public.notifications(organization_id);

-- Create trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
