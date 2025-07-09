/*
  # Melhorias no módulo de fraldas

  1. Adicionar campo de observações na tabela diaper_usages
  2. Criar tabela diaper_types para tipos de fraldas com valores
  3. Adicionar referência ao tipo de fralda nos registros de uso
*/

-- Adicionar campo de observações na tabela diaper_usages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diaper_usages' AND column_name = 'observations'
  ) THEN
    ALTER TABLE diaper_usages ADD COLUMN observations text;
  END IF;
END $$;

-- Criar tabela para tipos de fraldas
CREATE TABLE IF NOT EXISTS diaper_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  size text NOT NULL,
  brand text NOT NULL,
  unit_cost numeric(10,2) NOT NULL CHECK (unit_cost > 0),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_diaper_types_user_id ON diaper_types(user_id);
CREATE INDEX IF NOT EXISTS idx_diaper_types_is_active ON diaper_types(is_active);

-- Habilitar RLS na tabela diaper_types
ALTER TABLE diaper_types ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para diaper_types (apenas administradores)
CREATE POLICY "Admins can manage diaper types"
ON diaper_types
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Adicionar campo diaper_type_id na tabela diaper_usages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diaper_usages' AND column_name = 'diaper_type_id'
  ) THEN
    ALTER TABLE diaper_usages ADD COLUMN diaper_type_id uuid REFERENCES diaper_types(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Criar índice para o novo campo
CREATE INDEX IF NOT EXISTS idx_diaper_usages_diaper_type_id ON diaper_usages(diaper_type_id);

-- Criar trigger para atualizar updated_at na tabela diaper_types
CREATE TRIGGER update_diaper_types_updated_at
BEFORE UPDATE ON diaper_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
