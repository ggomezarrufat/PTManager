-- PRUEBA RÁPIDA: Verificar que las políticas funcionen
-- Ejecutar en el SQL Editor de Supabase DESPUÉS del script de limpieza

-- Verificar estado de políticas
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'rebuys'
ORDER BY policyname;

-- Verificar que el usuario es admin
SELECT
  id,
  email,
  is_admin,
  CASE WHEN is_admin THEN '✅ USUARIO ES ADMIN - POLÍTICAS DEBERÍAN FUNCIONAR'
       ELSE '❌ USUARIO NO ES ADMIN - NECESITAS HACERLO ADMIN'
  END as status
FROM profiles
WHERE id = '32e07333-5000-4340-bd90-20c5c37d9042';

-- Si el usuario NO es admin, ejecuta esto:
-- UPDATE profiles SET is_admin = true WHERE id = '32e07333-5000-4340-bd90-20c5c37d9042';

-- Probar inserción manual (descomenta si quieres probar)
-- INSERT INTO rebuys (player_id, tournament_id, amount, chips_received, admin_user_id)
-- VALUES (
--   'd97e19e6-5e7a-44fb-a137-f3bb5c2249c9',
--   'f2c4e932-3b85-4d91-a528-4b5e278fbf9a',
--   1000,
--   1500,
--   '32e07333-5000-4340-bd90-20c5c37d9042'
-- );
