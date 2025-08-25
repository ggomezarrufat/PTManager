-- Configuración del Storage para Avatares de Usuarios
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear bucket para avatares (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars', 
  'user-avatars', 
  true, 
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Política para acceso público a avatares (lectura)
CREATE POLICY "Avatares públicos para lectura" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

-- 3. Política para que usuarios suban sus propios avatares
CREATE POLICY "Usuarios suben sus avatares" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Política para que usuarios actualicen sus propios avatares
CREATE POLICY "Usuarios actualizan sus avatares" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Política para que usuarios eliminen sus propios avatares
CREATE POLICY "Usuarios eliminan sus avatares" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. Agregar campo avatar_url a la tabla profiles si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. Crear índice para búsquedas por avatar_url
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url);

-- 8. Función para limpiar avatares antiguos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_avatars()
RETURNS void AS $$
BEGIN
  -- Eliminar avatares de usuarios que ya no existen
  DELETE FROM storage.objects 
  WHERE bucket_id = 'user-avatars' 
    AND name NOT IN (
      SELECT CONCAT(id, '-', EXTRACT(EPOCH FROM avatar_updated_at), '.webp')::text
      FROM profiles 
      WHERE avatar_url IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para actualizar avatar_updated_at
CREATE OR REPLACE FUNCTION update_avatar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.avatar_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_avatar_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_avatar_timestamp();
