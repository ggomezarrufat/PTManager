-- Script para agregar campo blind_schedule a tournament_clocks
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar estructura actual de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tournament_clocks' 
ORDER BY ordinal_position;

-- 2. Agregar columna blind_schedule si no existe
ALTER TABLE public.tournament_clocks 
ADD COLUMN IF NOT EXISTS blind_schedule JSONB;

-- 3. Agregar columna total_pause_time_seconds si no existe
ALTER TABLE public.tournament_clocks 
ADD COLUMN IF NOT EXISTS total_pause_time_seconds INTEGER DEFAULT 0;

-- 4. Agregar columna paused_at si no existe
ALTER TABLE public.tournament_clocks 
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE;

-- 5. Verificar que las columnas se agregaron correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tournament_clocks' 
ORDER BY ordinal_position;

-- 6. Crear índice para búsquedas por blind_schedule si no existe
CREATE INDEX IF NOT EXISTS idx_tournament_clocks_blind_schedule 
ON public.tournament_clocks USING GIN (blind_schedule);

-- 7. Comentarios de las nuevas columnas
COMMENT ON COLUMN public.tournament_clocks.blind_schedule IS 'Estructura de blinds del torneo en formato JSON';
COMMENT ON COLUMN public.tournament_clocks.total_pause_time_seconds IS 'Tiempo total pausado en segundos';
COMMENT ON COLUMN public.tournament_clocks.paused_at IS 'Timestamp cuando se pausó el reloj';

-- 8. Verificar algunos registros existentes
SELECT 
  id,
  tournament_id,
  current_level,
  time_remaining_seconds,
  is_paused,
  blind_schedule,
  total_pause_time_seconds,
  paused_at,
  last_updated
FROM public.tournament_clocks 
LIMIT 5;
