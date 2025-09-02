-- LIMPIEZA MANUAL DE POLÍTICAS
-- Ejecutar una por una en Supabase SQL Editor

-- Paso 1: Eliminar TODAS las políticas existentes manualmente
DROP POLICY IF EXISTS "Tournament creators can manage rebuys" ON public.rebuys;
DROP POLICY IF EXISTS "Users can view rebuys" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_select_policy" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_insert_policy" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_update_policy" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_delete_policy" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_select_public" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_insert_admin" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_update_admin" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_delete_admin" ON public.rebuys;

DROP POLICY IF EXISTS "Tournament creators can manage addons" ON public.addons;
DROP POLICY IF EXISTS "Users can view addons" ON public.addons;
DROP POLICY IF EXISTS "addons_select_policy" ON public.addons;
DROP POLICY IF EXISTS "addons_insert_policy" ON public.addons;
DROP POLICY IF EXISTS "addons_update_policy" ON public.addons;
DROP POLICY IF EXISTS "addons_delete_policy" ON public.addons;
DROP POLICY IF EXISTS "addons_select_public" ON public.addons;
DROP POLICY IF EXISTS "addons_insert_admin" ON public.addons;
DROP POLICY IF EXISTS "addons_update_admin" ON public.addons;
DROP POLICY IF EXISTS "addons_delete_admin" ON public.addons;

DROP POLICY IF EXISTS "Tournament creators can manage players" ON public.tournament_players;
DROP POLICY IF EXISTS "Users can view tournament players" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_select_policy" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_insert_policy" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_update_policy" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_delete_policy" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_select_public" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_insert_public" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_update_own_admin" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_delete_admin" ON public.tournament_players;

-- Paso 2: Asegurar que RLS esté habilitado
ALTER TABLE public.rebuys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;

-- Paso 3: Crear política simple temporal
CREATE POLICY "temp_allow_all" ON public.rebuys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "temp_allow_all" ON public.addons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "temp_allow_all" ON public.tournament_players FOR ALL USING (true) WITH CHECK (true);

-- Paso 4: Verificar
SELECT
  tablename,
  COUNT(*) as policies_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
GROUP BY tablename
ORDER BY tablename;
