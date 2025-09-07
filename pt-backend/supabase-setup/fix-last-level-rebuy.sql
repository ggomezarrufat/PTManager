-- Script para verificar y corregir torneos sin last_level_rebuy
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar si hay torneos sin last_level_rebuy definido
SELECT 
  id,
  name,
  status,
  last_level_rebuy,
  created_at
FROM tournaments 
WHERE last_level_rebuy IS NULL 
   OR last_level_rebuy = 0;

-- 2. Contar cuántos torneos necesitan actualización
SELECT 
  COUNT(*) as torneos_sin_last_level_rebuy
FROM tournaments 
WHERE last_level_rebuy IS NULL 
   OR last_level_rebuy = 0;

-- 3. Establecer un valor por defecto de 5 para torneos sin last_level_rebuy
-- NOTA: Solo ejecutar si la consulta anterior devuelve registros
/*
UPDATE tournaments 
SET last_level_rebuy = 5 
WHERE last_level_rebuy IS NULL 
   OR last_level_rebuy = 0;
*/

-- 4. Verificar que la actualización fue exitosa
SELECT 
  id,
  name,
  status,
  last_level_rebuy,
  created_at
FROM tournaments 
WHERE last_level_rebuy IS NULL 
   OR last_level_rebuy = 0;

-- 5. Ver estadísticas generales de last_level_rebuy
SELECT 
  last_level_rebuy,
  COUNT(*) as cantidad_torneos
FROM tournaments 
GROUP BY last_level_rebuy 
ORDER BY last_level_rebuy;

-- 6. Verificar tourneos activos específicamente
SELECT 
  id,
  name,
  status,
  last_level_rebuy,
  max_rebuys,
  created_at
FROM tournaments 
WHERE status IN ('active', 'paused')
ORDER BY created_at DESC;

