-- Script de corrección RLS - Ejecutar SI el diagnóstico muestra problemas
-- Ejecutar en el SQL Editor de Supabase

-- PRIMERO: Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "rebuys_select_policy" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_insert_policy" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_update_policy" ON public.rebuys;
DROP POLICY IF EXISTS "rebuys_delete_policy" ON public.rebuys;

DROP POLICY IF EXISTS "addons_select_policy" ON public.addons;
DROP POLICY IF EXISTS "addons_insert_policy" ON public.addons;
DROP POLICY IF EXISTS "addons_update_policy" ON public.addons;
DROP POLICY IF EXISTS "addons_delete_policy" ON public.addons;

DROP POLICY IF EXISTS "tournament_players_select_policy" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_insert_policy" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_update_policy" ON public.tournament_players;
DROP POLICY IF EXISTS "tournament_players_delete_policy" ON public.tournament_players;

-- SEGUNDO: Asegurar que RLS esté habilitado
ALTER TABLE public.rebuys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;

-- TERCERO: Crear políticas CORRECTAS
-- Políticas para REBUYS
CREATE POLICY "rebuys_select_policy" ON public.rebuys
  FOR SELECT USING (true);

CREATE POLICY "rebuys_insert_policy" ON public.rebuys
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "rebuys_update_policy" ON public.rebuys
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "rebuys_delete_policy" ON public.rebuys
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Políticas para ADDONS
CREATE POLICY "addons_select_policy" ON public.addons
  FOR SELECT USING (true);

CREATE POLICY "addons_insert_policy" ON public.addons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "addons_update_policy" ON public.addons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "addons_delete_policy" ON public.addons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Políticas para TOURNAMENT_PLAYERS
CREATE POLICY "tournament_players_select_policy" ON public.tournament_players
  FOR SELECT USING (true);

CREATE POLICY "tournament_players_insert_policy" ON public.tournament_players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tournament_players_update_policy" ON public.tournament_players
  FOR UPDATE USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "tournament_players_delete_policy" ON public.tournament_players
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Verificar que se crearon correctamente
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
ORDER BY tablename, policyname;

-- Función para verificar estado de RLS
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(table_name text, rls_enabled boolean, policy_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.table_name::text,
    t.rowsecurity,
    COUNT(p.policyname)::bigint as policy_count
  FROM information_schema.tables t
  LEFT JOIN pg_policies p ON p.tablename = t.table_name
  WHERE t.table_schema = 'public'
    AND t.table_name IN ('rebuys', 'addons', 'tournament_players')
    AND t.table_type = 'BASE TABLE'
  GROUP BY t.table_name, t.rowsecurity;
END;
$$ LANGUAGE plpgsql;

-- Función RPC temporal para insertar rebuys (para desarrollo)
CREATE OR REPLACE FUNCTION insert_rebuy_admin(
  p_player_id UUID,
  p_tournament_id UUID,
  p_amount DECIMAL,
  p_chips_received INTEGER,
  p_admin_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  result_record RECORD;
BEGIN
  -- Insertar directamente sin restricciones RLS (temporal para desarrollo)
  INSERT INTO public.rebuys (
    player_id,
    tournament_id,
    amount,
    chips_received,
    admin_user_id,
    timestamp
  ) VALUES (
    p_player_id,
    p_tournament_id,
    p_amount,
    p_chips_received,
    p_admin_user_id,
    NOW()
  )
  RETURNING * INTO result_record;

  -- Retornar el registro insertado como JSON
  RETURN row_to_json(result_record);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION insert_rebuy_admin(UUID, UUID, DECIMAL, INTEGER, UUID) TO authenticated;

-- SOLUCIÓN PERMANENTE: Reactivar RLS con políticas correctas (después de testing)
-- ALTER TABLE public.rebuys ENABLE ROW LEVEL SECURITY;

-- Verificar estado final
SELECT * FROM check_rls_status();
