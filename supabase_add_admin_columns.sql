-- Script SQL para agregar columnas de auditoría de administradores
-- Ejecutar en la consola SQL de Supabase

-- Agregar columna admin_user_id a la tabla rebuys
ALTER TABLE rebuys
ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id);

-- Agregar columna admin_user_id a la tabla addons
ALTER TABLE addons
ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id);

-- Agregar columna eliminated_by a la tabla tournament_players
ALTER TABLE tournament_players
ADD COLUMN IF NOT EXISTS eliminated_by UUID REFERENCES auth.users(id);

-- Agregar columna registration_confirmed_by a la tabla tournament_players
ALTER TABLE tournament_players
ADD COLUMN IF NOT EXISTS registration_confirmed_by UUID REFERENCES auth.users(id);

-- Agregar índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_rebuys_admin_user_id ON rebuys(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_addons_admin_user_id ON addons(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_eliminated_by ON tournament_players(eliminated_by);
CREATE INDEX IF NOT EXISTS idx_tournament_players_registration_confirmed_by ON tournament_players(registration_confirmed_by);

-- Comentarios sobre las columnas agregadas
COMMENT ON COLUMN rebuys.admin_user_id IS 'ID del administrador que registró la recompra';
COMMENT ON COLUMN addons.admin_user_id IS 'ID del administrador que registró el addon';
COMMENT ON COLUMN tournament_players.eliminated_by IS 'ID del administrador que eliminó al jugador del torneo';
COMMENT ON COLUMN tournament_players.registration_confirmed_by IS 'ID del administrador que confirmó la inscripción del jugador';
