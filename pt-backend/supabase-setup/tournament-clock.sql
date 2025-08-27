-- Crear tabla para el reloj del torneo
CREATE TABLE IF NOT EXISTS public.tournament_clocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL DEFAULT 1,
  time_remaining_seconds INTEGER NOT NULL DEFAULT 1200, -- 20 minutos por defecto
  is_paused BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_tournament_clocks_tournament_id ON public.tournament_clocks(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_clocks_status ON public.tournament_clocks(is_paused, last_updated);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_tournament_clock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tournament_clock_timestamp
  BEFORE UPDATE ON public.tournament_clocks
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_clock_timestamp();

-- Crear función para inicializar reloj de un torneo
CREATE OR REPLACE FUNCTION initialize_tournament_clock(tournament_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.tournament_clocks (
    tournament_id,
    current_level,
    time_remaining_seconds,
    is_paused,
    last_updated
  ) VALUES (
    tournament_uuid,
    1, -- Primer nivel
    1200, -- 20 minutos
    false, -- No pausado
    NOW()
  )
  ON CONFLICT (tournament_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Configurar RLS (Row Level Security)
ALTER TABLE public.tournament_clocks ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública (todos pueden ver el reloj)
CREATE POLICY "tournament_clocks_select_policy" ON public.tournament_clocks
  FOR SELECT USING (true);

-- Política para inserción (solo admins pueden crear relojes)
CREATE POLICY "tournament_clocks_insert_policy" ON public.tournament_clocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Política para actualización (solo admins pueden modificar relojes)
CREATE POLICY "tournament_clocks_update_policy" ON public.tournament_clocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Política para eliminación (solo admins pueden eliminar relojes)
CREATE POLICY "tournament_clocks_delete_policy" ON public.tournament_clocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Comentarios de la tabla
COMMENT ON TABLE public.tournament_clocks IS 'Tabla para almacenar el estado del reloj de cada torneo activo';
COMMENT ON COLUMN public.tournament_clocks.tournament_id IS 'ID del torneo al que pertenece este reloj';
COMMENT ON COLUMN public.tournament_clocks.current_level IS 'Nivel actual de blinds (empieza en 1)';
COMMENT ON COLUMN public.tournament_clocks.time_remaining_seconds IS 'Tiempo restante en segundos para el nivel actual';
COMMENT ON COLUMN public.tournament_clocks.is_paused IS 'Indica si el reloj está pausado';
COMMENT ON COLUMN public.tournament_clocks.last_updated IS 'Última vez que se actualizó el reloj';
