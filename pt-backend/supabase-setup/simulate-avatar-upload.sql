-- Script para simular la subida de un avatar y verificar la actualización
-- Ejecutar en el SQL Editor de Supabase

-- 1. Obtener un usuario para probar
SELECT 
  id,
  name,
  email,
  avatar_url,
  avatar_updated_at
FROM profiles 
WHERE avatar_url IS NULL
LIMIT 1;

-- 2. Simular actualización de avatar (reemplaza 'USER_ID_AQUI' con un ID real)
-- NOTA: Descomenta y modifica la siguiente línea con un ID real de usuario
-- UPDATE profiles 
-- SET avatar_url = 'https://bxzzmpxzubetxgbdakmy.supabase.co/storage/v1/object/public/user-avatars/test-avatar.jpg'
-- WHERE id = 'USER_ID_AQUI'
-- RETURNING id, name, avatar_url, avatar_updated_at;

-- 3. Verificar que el trigger funciona correctamente
-- El campo avatar_updated_at debería actualizarse automáticamente

-- 4. Verificar la actualización
SELECT 
  id,
  name,
  email,
  avatar_url,
  avatar_updated_at,
  created_at
FROM profiles 
WHERE avatar_url IS NOT NULL
ORDER BY avatar_updated_at DESC
LIMIT 5;

-- 5. Probar consulta que usa el frontend
SELECT 
  id,
  name,
  nickname,
  email,
  avatar_url,
  is_admin,
  total_points,
  created_at,
  updated_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;
