-- VERIFICAR SI EL USUARIO ESPECÍFICO EXISTE EN LA BASE DE DATOS
-- Ejecutar en el SQL Editor de Supabase

-- 1. Buscar usuario específico por ID (REEMPLAZA con el ID del usuario: 76be7d5f-d05b-416b-9f6b-fad604f08cd7)
SELECT 
  id,
  name,
  nickname,
  email,
  is_admin,
  created_at,
  updated_at
FROM profiles 
WHERE id = '76be7d5f-d05b-416b-9f6b-fad604f08cd7';

-- 2. Verificar si existe en auth.users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users 
WHERE id = '76be7d5f-d05b-416b-9f6b-fad604f08cd7';

-- 3. Buscar usuario por email o nombre similar
SELECT 
  id,
  name,
  nickname,
  email,
  is_admin,
  created_at
FROM profiles 
WHERE name ILIKE '%Gusta%' OR nickname ILIKE '%Chanchito%' OR email ILIKE '%gusta%'
ORDER BY created_at DESC;

-- 4. Listar todos los usuarios para verificar
SELECT 
  id,
  name,
  nickname,
  email,
  created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 20;

-- 5. Verificar tipos de datos de ID
SELECT 
  pg_typeof(id) as id_type,
  length(id::text) as id_length,
  id
FROM profiles 
LIMIT 5;

-- 6. Intentar actualización manual (CUIDADO: Solo para testing)
-- NOTA: Descomenta SOLO si quieres probar la actualización manual
/*
UPDATE profiles 
SET 
  name = 'Gusta test 2 - MANUAL UPDATE',
  nickname = 'Chanchito Renguito - MANUAL',
  updated_at = NOW()
WHERE id = '76be7d5f-d05b-416b-9f6b-fad604f08cd7'
RETURNING id, name, nickname, updated_at;
*/

-- 7. Verificar políticas RLS que puedan estar bloqueando
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual as condition
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- 8. Verificar usuario autenticado actual (esto solo funciona si estás autenticado)
SELECT 
  auth.uid() as current_auth_user_id,
  CASE 
    WHEN auth.uid() = '76be7d5f-d05b-416b-9f6b-fad604f08cd7'::uuid THEN '✅ USUARIO COINCIDE'
    ELSE '❌ USUARIO NO COINCIDE - AUTH: ' || COALESCE(auth.uid()::text, 'NULL') || ' vs ESPERADO: 76be7d5f-d05b-416b-9f6b-fad604f08cd7'
  END as auth_check;
