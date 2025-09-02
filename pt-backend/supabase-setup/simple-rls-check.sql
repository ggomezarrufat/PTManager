-- VERIFICACIÓN COMPLETA DE POLÍTICAS RLS
-- Ejecutar después del script de limpieza

-- 1. Ver estado de RLS en tablas
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players');

-- 2. Ver políticas existentes con detalles
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
ORDER BY tablename, policyname;

-- 3. Verificar tabla profiles
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
) as profiles_table_exists;

-- 4. Verificar perfil de admin específico
SELECT
  id,
  email,
  is_admin,
  created_at
FROM profiles
WHERE id = '32e07333-5000-4340-bd90-20c5c37d9042';

-- 5. Contar administradores
SELECT COUNT(*) as admin_users_count
FROM profiles
WHERE is_admin = true;

-- 6. Probar consulta de política RLS manualmente
SELECT
    '32e07333-5000-4340-bd90-20c5c37d9042' as test_user_id,
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = '32e07333-5000-4340-bd90-20c5c37d9042'
        AND is_admin = true
    ) as should_allow_admin_operations;

-- 7. Prueba de inserción simulada (comentar si no quieres probar)
-- Esta línea está comentada para evitar errores
-- INSERT INTO rebuys (player_id, tournament_id, amount, chips_received, admin_user_id)
-- VALUES ('test-player-id', 'test-tournament-id', 1000, 1500, '32e07333-5000-4340-bd90-20c5c37d9042');
