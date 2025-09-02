-- SOLUCIÓN RÁPIDA: Deshabilitar temporalmente RLS para probar
-- Ejecutar SOLO si el diagnóstico confirma que las políticas están mal configuradas

-- ⚠️  ATENCIÓN: Esto es temporal para probar. RLS debe estar habilitado en producción.

-- Deshabilitar RLS temporalmente para las tablas problemáticas
ALTER TABLE public.rebuys DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '❌ RLS AÚN HABILITADO' ELSE '✅ RLS DESHABILITADO' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players');

-- ===========================================
-- PARA HABILITAR NUEVAMENTE RLS (después de probar):
-- ===========================================

-- ALTER TABLE public.rebuys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;

-- Luego ejecutar el script fix-rls-policies.sql
