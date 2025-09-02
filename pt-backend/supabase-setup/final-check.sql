-- VERIFICACIÓN FINAL DE POLÍTICAS RLS
-- Ejecutar después del script de limpieza forzada

-- Ver todas las políticas restantes
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as policy_type,
  qual as condition,
  with_check as insert_condition
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
ORDER BY tablename, policyname;

-- Contar políticas por tabla
SELECT
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
GROUP BY tablename
ORDER BY tablename;

-- Verificar estado de RLS
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
ORDER BY tablename;

-- Verificar perfil de admin
SELECT
  id,
  email,
  is_admin,
  CASE WHEN is_admin THEN '✅ ES ADMIN' ELSE '❌ NO ES ADMIN - HACER ADMIN' END as status
FROM profiles
WHERE id = '32e07333-5000-4340-bd90-20c5c37d9042';

-- Si no es admin, ejecutar:
-- UPDATE profiles SET is_admin = true WHERE id = '32e07333-5000-4340-bd90-20c5c37d9042';

-- Probar inserción directa (descomenta si quieres probar)
-- INSERT INTO rebuys (player_id, tournament_id, amount, chips_received, admin_user_id)
-- VALUES ('693dd439-cbe3-4fe8-9ace-53c01f1d0a0e', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a', 1000, 1500, '32e07333-5000-4340-bd90-20c5c37d9042')
-- RETURNING *;
