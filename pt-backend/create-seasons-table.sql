-- Crear tabla de temporadas
CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Agregar columna season_id a la tabla tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_season ON tournaments(season_id);

-- Habilitar RLS en la tabla seasons
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para seasons
DROP POLICY IF EXISTS "Users can view seasons" ON seasons;
CREATE POLICY "Users can view seasons" ON seasons
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage seasons" ON seasons;
CREATE POLICY "Admins can manage seasons" ON seasons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_seasons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_seasons_updated_at
    BEFORE UPDATE ON seasons
    FOR EACH ROW
    EXECUTE FUNCTION update_seasons_updated_at();

-- Insertar algunas temporadas de ejemplo
INSERT INTO seasons (name, start_date, end_date) VALUES
    ('Temporada 2024', '2024-01-01', '2024-12-31'),
    ('Temporada 2025', '2025-01-01', '2025-12-31')
ON CONFLICT DO NOTHING;
