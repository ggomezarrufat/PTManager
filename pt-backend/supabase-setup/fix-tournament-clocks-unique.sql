-- Script para agregar constraint de unicidad a tournament_clocks
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar si ya existe la constraint
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'tournament_clocks' 
  AND conname LIKE '%tournament_id%';

-- 2. Verificar si hay duplicados antes de agregar la constraint
SELECT 
  tournament_id,
  COUNT(*) as count,
  array_agg(id) as clock_ids
FROM tournament_clocks 
GROUP BY tournament_id 
HAVING COUNT(*) > 1;

-- 3. Si hay duplicados, eliminar los registros más antiguos manteniendo el más reciente
-- NOTA: Solo ejecutar si la consulta anterior devuelve duplicados
/*
DELETE FROM tournament_clocks 
WHERE id NOT IN (
  SELECT DISTINCT ON (tournament_id) id
  FROM tournament_clocks 
  ORDER BY tournament_id, last_updated DESC
);
*/

-- 4. Agregar constraint de unicidad para tournament_id
ALTER TABLE public.tournament_clocks 
ADD CONSTRAINT tournament_clocks_tournament_id_unique 
UNIQUE (tournament_id);

-- 5. Verificar que la constraint se agregó correctamente
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'tournament_clocks' 
  AND conname = 'tournament_clocks_tournament_id_unique';

-- 6. Verificar que no hay duplicados después de agregar la constraint
SELECT 
  tournament_id,
  COUNT(*) as count
FROM tournament_clocks 
GROUP BY tournament_id 
HAVING COUNT(*) > 1;

