-- SOLUCIÓN TEMPORAL: Deshabilitar RLS para probar
-- ⚠️  ATENCIÓN: Solo para pruebas. NO usar en producción

-- Deshabilitar RLS temporalmente
ALTER TABLE public.rebuys DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
ORDER BY tablename;

-- ===========================================
-- PARA VOLVER A HABILITAR RLS (después de probar):
-- ===========================================

-- ALTER TABLE public.rebuys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;

-- Luego crear políticas simples:
-- CREATE POLICY "allow_all" ON public.rebuys FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all" ON public.addons FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all" ON public.tournament_players FOR ALL USING (true) WITH CHECK (true);
