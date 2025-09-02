-- Verificación de políticas RLS después de ejecutar el script
-- Ejecutar en el SQL Editor de Supabase

-- Verificar que RLS está habilitado en las tablas
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
ORDER BY tablename;

-- Verificar políticas existentes
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
ORDER BY tablename, policyname;

-- Ejecutar función de verificación si existe
SELECT * FROM check_admin_policies();

-- Verificar permisos del usuario admin actual
SELECT
  p.id,
  p.email,
  p.is_admin,
  CASE WHEN p.is_admin THEN '✅ Puede realizar operaciones administrativas'
       ELSE '❌ No tiene permisos administrativos'
  END as admin_status
FROM profiles p
WHERE p.id = auth.uid();
