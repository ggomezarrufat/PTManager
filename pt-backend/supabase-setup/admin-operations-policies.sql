-- Políticas RLS para operaciones administrativas
-- Ejecutar en el SQL Editor de Supabase

-- ===========================================
-- POLÍTICAS PARA TABLA REBUYS
-- ===========================================

-- Habilitar RLS en tabla rebuys
ALTER TABLE public.rebuys ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública de rebuys
CREATE POLICY "rebuys_select_policy" ON public.rebuys
  FOR SELECT USING (true);

-- Política para inserción de rebuys (solo admins)
CREATE POLICY "rebuys_insert_policy" ON public.rebuys
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Política para actualización de rebuys (solo admins)
CREATE POLICY "rebuys_update_policy" ON public.rebuys
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Política para eliminación de rebuys (solo admins)
CREATE POLICY "rebuys_delete_policy" ON public.rebuys
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ===========================================
-- POLÍTICAS PARA TABLA ADDONS
-- ===========================================

-- Habilitar RLS en tabla addons
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública de addons
CREATE POLICY "addons_select_policy" ON public.addons
  FOR SELECT USING (true);

-- Política para inserción de addons (solo admins)
CREATE POLICY "addons_insert_policy" ON public.addons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Política para actualización de addons (solo admins)
CREATE POLICY "addons_update_policy" ON public.addons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Política para eliminación de addons (solo admins)
CREATE POLICY "addons_delete_policy" ON public.addons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ===========================================
-- POLÍTICAS PARA TABLA TOURNAMENT_PLAYERS
-- ===========================================

-- Habilitar RLS en tabla tournament_players
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública de tournament_players
CREATE POLICY "tournament_players_select_policy" ON public.tournament_players
  FOR SELECT USING (true);

-- Política para inserción de tournament_players (todos pueden registrarse)
CREATE POLICY "tournament_players_insert_policy" ON public.tournament_players
  FOR INSERT WITH CHECK (true);

-- Política para actualización de tournament_players (admins pueden actualizar todo, usuarios solo sus propios datos)
CREATE POLICY "tournament_players_update_policy" ON public.tournament_players
  FOR UPDATE USING (
    -- Usuario puede actualizar sus propios datos
    auth.uid() = user_id
    OR
    -- Admin puede actualizar cualquier registro
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Política para eliminación de tournament_players (solo admins)
CREATE POLICY "tournament_players_delete_policy" ON public.tournament_players
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ===========================================
-- POLÍTICAS PARA TABLA REPORTS
-- ===========================================

-- Si existe tabla reports, habilitar RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
    -- Habilitar RLS
    EXECUTE 'ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY';

    -- Política para lectura (solo admins pueden ver reportes)
    EXECUTE 'CREATE POLICY "reports_select_policy" ON public.reports FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
      )
    )';

    -- Política para inserción (solo admins pueden crear reportes)
    EXECUTE 'CREATE POLICY "reports_insert_policy" ON public.reports FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
      )
    )';
  END IF;
END $$;

-- ===========================================
-- VERIFICACIÓN DE POLÍTICAS
-- ===========================================

-- Función para verificar políticas RLS
CREATE OR REPLACE FUNCTION check_admin_policies()
RETURNS TABLE(table_name text, policy_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.table_name::text,
    COUNT(p.policyname)::bigint as policy_count
  FROM information_schema.tables t
  LEFT JOIN pg_policies p ON p.tablename = t.table_name
  WHERE t.table_schema = 'public'
    AND t.table_name IN ('rebuys', 'addons', 'tournament_players')
    AND t.table_type = 'BASE TABLE'
  GROUP BY t.table_name;
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON FUNCTION check_admin_policies() IS 'Función para verificar que las políticas RLS están correctamente configuradas en las tablas administrativas';
