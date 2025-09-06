-- DIAGNÓSTICO COMPLETO PARA PROBLEMA DE ACTUALIZACIÓN DE PERFILES
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar estado de RLS en la tabla profiles
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ RLS HABILITADO' ELSE '❌ RLS DESHABILITADO' END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- 2. Verificar políticas existentes para profiles
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual as condition,
  with_check as insert_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- 3. Verificar estructura de la tabla profiles
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Verificar usuarios existentes en profiles
SELECT 
  id,
  name,
  nickname,
  email,
  is_admin,
  avatar_url,
  created_at,
  updated_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 5. Probar actualización manual (REEMPLAZA USER_ID_AQUI con un ID real)
-- NOTA: Descomenta y modifica la siguiente línea con un ID real
/*
UPDATE profiles 
SET name = 'Nombre de Prueba', nickname = 'NickPrueba', updated_at = NOW()
WHERE id = 'USER_ID_AQUI'
RETURNING id, name, nickname, updated_at;
*/

-- 6. Verificar usuario autenticado actual
SELECT 
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ USUARIO AUTENTICADO: ' || auth.uid()::text
    ELSE '❌ USUARIO NO AUTENTICADO'
  END as auth_status;

-- 7. Simular política de UPDATE para un usuario específico
-- REEMPLAZA USER_ID_AQUI con el ID del usuario que tiene problemas
/*
WITH test_user AS (
  SELECT 'USER_ID_AQUI'::uuid as user_id
)
SELECT
  tu.user_id,
  p.name,
  p.email,
  p.is_admin,
  CASE 
    WHEN tu.user_id = p.id THEN '✅ USUARIO PUEDE ACTUALIZAR SU PERFIL'
    ELSE '❌ USUARIO NO PUEDE ACTUALIZAR ESTE PERFIL'
  END as update_permission
FROM test_user tu
LEFT JOIN profiles p ON p.id = tu.user_id;
*/

-- 8. Verificar si existen triggers que puedan interferir
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 9. Verificar permisos de la tabla profiles
SELECT 
  table_schema,
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY privilege_type;

-- 10. Script para crear/reparar políticas RLS correctas
-- SOLO EJECUTAR SI NO HAY POLÍTICAS O ESTÁN INCORRECTAS

/*
-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

-- Crear políticas correctas
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
*/

-- 11. Verificar políticas después de crearlas (ejecutar después del punto 10)
/*
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual as condition,
  with_check as insert_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;
*/
