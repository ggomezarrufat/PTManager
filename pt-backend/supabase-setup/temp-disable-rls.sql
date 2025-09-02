-- SCRIPT TEMPORAL PARA DESHABILITAR RLS EN DESARROLLO
-- ⚠️ ADVERTENCIA: Solo para desarrollo/testing - NO USAR EN PRODUCCIÓN
-- Ejecutar en el SQL Editor de Supabase

-- Deshabilitar RLS temporalmente para testing
ALTER TABLE public.rebuys DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons DISABLE ROW LEVEL SECURITY;

-- Verificar estado
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
ORDER BY tablename;

-- Para volver a habilitar RLS después del testing:
-- ALTER TABLE public.rebuys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
