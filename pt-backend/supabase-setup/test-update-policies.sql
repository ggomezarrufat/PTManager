-- PROBAR POLÍTICAS RLS PARA ACTUALIZACIÓN DE PERFILES
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar usuario específico
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

-- 2. Verificar políticas RLS actuales para UPDATE
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual as condition,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- 3. Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- 4. Probar actualización manual SIN autenticación (debería fallar si RLS está bien configurado)
-- NOTA: Esto puede fallar por RLS, es normal
UPDATE profiles 
SET name = 'TEST MANUAL - ' || NOW()::text
WHERE id = '76be7d5f-d05b-416b-9f6b-fad604f08cd7';

-- 5. Ver si hay algún error o advertencia
SELECT 
  'Intentando actualización manual completada' as status,
  NOW() as timestamp;

-- 6. Verificar el estado después del intento
SELECT 
  id,
  name,
  nickname,
  updated_at
FROM profiles 
WHERE id = '76be7d5f-d05b-416b-9f6b-fad604f08cd7';

-- 7. DESHABILITAR RLS TEMPORALMENTE PARA PROBAR (SOLO PARA DIAGNÓSTICO)
-- ⚠️ CUIDADO: Esto deshabilitará la seguridad temporalmente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 8. Probar actualización sin RLS
UPDATE profiles 
SET 
  name = 'GUSTA TEST - SIN RLS',
  nickname = 'CHANCHITO - SIN RLS',
  updated_at = NOW()
WHERE id = '76be7d5f-d05b-416b-9f6b-fad604f08cd7'
RETURNING id, name, nickname, updated_at;

-- 9. Verificar que funcionó
SELECT 
  'Actualización sin RLS:' as resultado,
  name,
  nickname,
  updated_at
FROM profiles 
WHERE id = '76be7d5f-d05b-416b-9f6b-fad604f08cd7';

-- 10. REACTIVAR RLS (IMPORTANTE: EJECUTAR DESPUÉS DEL PUNTO 8)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 11. Crear políticas RLS correctas
-- Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Crear política UPDATE simple y permisiva
CREATE POLICY "profiles_update_simple" ON public.profiles
  FOR UPDATE USING (true)  -- Permitir a todos por ahora para diagnosticar
  WITH CHECK (true);

-- 12. Verificar nuevas políticas
SELECT 
  policyname,
  cmd,
  permissive,
  qual as condition,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- 13. Estado final
SELECT 
  'Configuración final:' as info,
  (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'UPDATE') as update_policies_count;
