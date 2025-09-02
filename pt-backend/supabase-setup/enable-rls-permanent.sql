-- SOLUCIÓN PERMANENTE PARA RESTAURAR RLS
-- Ejecutar después de completar el testing
-- https://supabase.com/dashboard/project/[tu-proyecto]/sql

-- Paso 1: Reactivar RLS
ALTER TABLE public.rebuys ENABLE ROW LEVEL SECURITY;

-- Paso 2: Crear políticas de seguridad correctas
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

-- Paso 3: Verificar que funciona correctamente
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'rebuys'
ORDER BY policyname;
