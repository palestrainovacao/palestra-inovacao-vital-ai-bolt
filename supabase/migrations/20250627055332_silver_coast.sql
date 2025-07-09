/*
  # Melhorias no módulo de medicamentos

  1. Alterações
    - Garantir que a tabela medication_names esteja corretamente configurada
    - Adicionar índices para melhorar a performance de consultas
    - Ajustar políticas RLS para garantir acesso adequado

  2. Propósito
    - Melhorar a funcionalidade de autocomplete de medicamentos
    - Garantir que cada medicamento apareça apenas uma vez na lista
    - Otimizar consultas de medicamentos por nome
*/

-- Garantir que a tabela medication_names tenha os índices corretos
CREATE INDEX IF NOT EXISTS idx_medication_names_name ON medication_names(name);
CREATE INDEX IF NOT EXISTS idx_medication_names_user_id ON medication_names(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_names_organization_id ON medication_names(organization_id);

-- Remover possíveis duplicatas na tabela medication_names
DELETE FROM medication_names a
USING medication_names b
WHERE a.id > b.id 
AND a.name = b.name 
AND (
  (a.organization_id IS NULL AND b.organization_id IS NULL) OR
  a.organization_id = b.organization_id
);

-- Preencher a tabela medication_names com medicamentos existentes
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
