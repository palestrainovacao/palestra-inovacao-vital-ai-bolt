/*
  # Adicionar valor da mensalidade ao cadastro de residentes

  1. Alterações na tabela
    - Adicionar coluna `monthly_fee_amount` do tipo numeric(10,2) à tabela `residents`
    - Definir valor padrão de 3000.00 (R$ 3.000,00)
    - Adicionar constraint para garantir que o valor seja positivo

  2. Segurança
    - A coluna herda as mesmas políticas RLS da tabela residents
*/

-- Adicionar coluna monthly_fee_amount à tabela residents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'residents' AND column_name = 'monthly_fee_amount'
  ) THEN
    ALTER TABLE residents ADD COLUMN monthly_fee_amount numeric(10,2) DEFAULT 3000.00 NOT NULL;
  END IF;
END $$;

-- Adicionar constraint para garantir que o valor seja positivo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'residents_monthly_fee_amount_check'
  ) THEN
    ALTER TABLE residents ADD CONSTRAINT residents_monthly_fee_amount_check CHECK (monthly_fee_amount > 0);
  END IF;
END $$;
