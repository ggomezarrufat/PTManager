-- Script de diagnóstico para problema RLS
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar si RLS está habilitado en las tablas
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS HABILITADO' ELSE '❌ RLS DESHABILITADO' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
ORDER BY tablename;

-- 2. Verificar políticas existentes para rebuys
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as condition,
  with_check as insert_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'rebuys'
ORDER BY policyname;

-- 3. Verificar el perfil del usuario actual
SELECT
  id,
  email,
  is_admin,
  CASE WHEN is_admin THEN '✅ ES ADMIN' ELSE '❌ NO ES ADMIN' END as admin_status
FROM profiles
WHERE id = '32e07333-5000-4340-bd90-20c5c37d9042';

-- 4. Verificar que el usuario esté autenticado correctamente
SELECT
  CASE WHEN auth.uid() IS NOT NULL THEN '✅ USUARIO AUTENTICADO: ' || auth.uid()::text
       ELSE '❌ USUARIO NO AUTENTICADO'
  END as auth_status;

-- 5. Probar la política manualmente con el usuario actual
WITH test_user AS (
  SELECT '32e07333-5000-4340-bd90-20c5c37d9042'::uuid as user_id
)
SELECT
  tu.user_id,
  p.is_admin,
  CASE WHEN p.is_admin THEN '✅ POLÍTICA PERMITE INSERCIÓN'
       ELSE '❌ POLÍTICA BLOQUEA INSERCIÓN - USUARIO NO ES ADMIN'
  END as policy_result
FROM test_user tu
LEFT JOIN profiles p ON p.id = tu.user_id;

-- 6. Intentar insertar manualmente para ver el error exacto
-- (Comenta esta sección si no quieres ejecutar la inserción)
-- INSERT INTO rebuys (player_id, tournament_id, amount, chips_received, admin_user_id)
-- VALUES (
--   'd97e19e6-5e7a-44fb-a137-f3bb5c2249c9',
--   'f2c4e932-3b85-4d91-a528-4b5e278fbf9a',
--   1000,
--   1500,
--   '32e07333-5000-4340-bd90-20c5c37d9042'
-- );
