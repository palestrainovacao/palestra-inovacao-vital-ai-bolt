/*
  # Melhorias no Módulo de Medicamentos

  1. Alterações na tabela `medications`
    - Remover a coluna `frequency` (será inferida a partir dos horários)
    - Adicionar coluna `observations` para instruções especiais
    - Adicionar coluna `medical_prescription_url` para armazenar URL da receita médica

  2. Nova Tabela
    - `medication_names` - Lista de nomes de medicamentos para autocomplete
      - `id` (uuid, primary key)
      - `name` (text, not null, unique)
      - `user_id` (uuid, foreign key para auth.users)
      - `organization_id` (uuid, foreign key para organizations)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  3. Segurança
    - Habilitar RLS na nova tabela
    - Adicionar políticas para usuários autenticados gerenciarem seus próprios dados
    - Adicionar índices para melhor performance
*/

-- Criar tabela medication_names para autocomplete
CREATE TABLE IF NOT EXISTS medication_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, organization_id)
);

-- Habilitar RLS na tabela medication_names
ALTER TABLE medication_names ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para medication_names
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

-- Adicionar índices para medication_names
CREATE INDEX IF NOT EXISTS idx_medication_names_name ON medication_names(name);
CREATE INDEX IF NOT EXISTS idx_medication_names_user_id ON medication_names(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_names_organization_id ON medication_names(organization_id);

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER update_medication_names_updated_at
  BEFORE UPDATE ON medication_names
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Adicionar novas colunas à tabela medications
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

-- Não vamos remover a coluna frequency para manter compatibilidade com dados existentes,
-- mas podemos torná-la opcional para novos registros
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'frequency' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE medications ALTER COLUMN frequency DROP NOT NULL;
  END IF;
END $$;

-- Preencher a tabela medication_names com os nomes de medicamentos existentes
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
