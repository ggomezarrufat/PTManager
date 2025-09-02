-- LIMPIEZA COMPLETA Y RECREACIÓN DE POLÍTICAS RLS
-- Ejecutar en el SQL Editor de Supabase

-- ===========================================
-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ===========================================

-- Eliminar políticas de rebuys
DROP POLICY IF EXISTS "Tournament creators can manage rebuys" ON public.rebuys;
DROP POLICY IF EXISTS "Users can view rebuys" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_select_policy" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_insert_policy" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_update_policy" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_delete_policy" ON public.rebuys;

-- Eliminar políticas de addons
DROP POLICY IF EXISTS "addons_select_policy" ON public.addons;
DROP POLICY IF EXISTS "addons_insert_policy" ON public.addons;
DROP POLICY IF EXISTS "addons_update_policy" ON public.addons;
DROP POLICY IF EXISTS "addons_delete_policy" ON public.addons;

-- Eliminar políticas de tournament_players
DROP POLICY IF EXISTS "tournament_players_select_policy" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_insert_policy" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_update_policy" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_delete_policy" ON public.tournament_players;

-- ===========================================
-- PASO 2: ASEGURAR QUE RLS ESTÉ HABILITADO
-- ===========================================

ALTER TABLE public.rebuys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PASO 3: CREAR POLÍTICAS NUEVAS Y CLARAS
-- ===========================================

-- POLÍTICAS PARA REBUYS
CREATE POLICY "rebuys_select_all" ON public.rebuys
  FOR SELECT USING (true);

CREATE POLICY "rebuys_insert_admin_only" ON public.rebuys
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "rebuys_update_admin_only" ON public.rebuys
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "rebuys_delete_admin_only" ON public.rebuys
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- POLÍTICAS PARA ADDONS
CREATE POLICY "addons_select_all" ON public.addons
  FOR SELECT USING (true);

CREATE POLICY "addons_insert_admin_only" ON public.addons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "addons_update_admin_only" ON public.addons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "addons_delete_admin_only" ON public.addons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- POLÍTICAS PARA TOURNAMENT_PLAYERS
CREATE POLICY "tournament_players_select_all" ON public.tournament_players
  FOR SELECT USING (true);

CREATE POLICY "tournament_players_insert_all" ON public.tournament_players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tournament_players_update_own_or_admin" ON public.tournament_players
  FOR UPDATE USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "tournament_players_delete_admin_only" ON public.tournament_players
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ===========================================
-- PASO 4: VERIFICACIÓN
-- ===========================================

-- Verificar que las políticas se crearon correctamente
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  'POLICY_ACTIVE' as policy_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
ORDER BY tablename, policyname;

-- Verificar que RLS esté habilitado
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS HABILITADO' ELSE '❌ RLS DESHABILITADO' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
ORDER BY tablename;
