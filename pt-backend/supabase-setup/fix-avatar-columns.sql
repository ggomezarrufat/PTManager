-- Script para verificar y crear columnas de avatar en la tabla profiles
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar si las columnas existen
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name IN ('avatar_url', 'avatar_updated_at')
ORDER BY column_name;

-- 2. Crear columna avatar_url si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Crear columna avatar_updated_at si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Verificar que las columnas se crearon correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name IN ('avatar_url', 'avatar_updated_at')
ORDER BY column_name;

-- 5. Verificar algunos perfiles existentes
SELECT 
  id,
  name,
  email,
  avatar_url,
  avatar_updated_at,
  created_at
FROM profiles 
LIMIT 5;

-- 6. Crear índice para búsquedas por avatar_url si no existe
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url);

-- 7. Función para actualizar timestamp de avatar (si no existe)
CREATE OR REPLACE FUNCTION update_avatar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar si avatar_url cambió
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN
    NEW.avatar_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear trigger para actualizar timestamp automáticamente (si no existe)
DROP TRIGGER IF EXISTS trigger_update_avatar_timestamp ON profiles;
CREATE TRIGGER trigger_update_avatar_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_avatar_timestamp();

-- 9. Verificar que el trigger se creó correctamente
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles' 
  AND trigger_name = 'trigger_update_avatar_timestamp';
