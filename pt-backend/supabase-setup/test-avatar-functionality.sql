-- Script para probar la funcionalidad de avatares
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar estructura de la tabla profiles
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Verificar si hay usuarios con avatares
SELECT 
  id,
  name,
  email,
  avatar_url,
  avatar_updated_at,
  CASE 
    WHEN avatar_url IS NOT NULL THEN '✅ Tiene avatar'
    ELSE '❌ Sin avatar'
  END as avatar_status
FROM profiles 
ORDER BY avatar_updated_at DESC NULLS LAST
LIMIT 10;

-- 3. Contar usuarios con y sin avatares
SELECT 
  COUNT(*) as total_users,
  COUNT(avatar_url) as users_with_avatar,
  COUNT(*) - COUNT(avatar_url) as users_without_avatar
FROM profiles;

-- 4. Verificar políticas de RLS para la tabla profiles
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- 5. Verificar si RLS está habilitado en profiles
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- 6. Probar actualización de avatar (simular)
-- NOTA: Descomenta las siguientes líneas para probar la actualización
-- UPDATE profiles 
-- SET avatar_url = 'https://example.com/test-avatar.jpg'
-- WHERE id = (SELECT id FROM profiles LIMIT 1)
-- RETURNING id, name, avatar_url, avatar_updated_at;

-- 7. Verificar storage bucket para avatares
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'user-avatars';

-- 8. Verificar políticas del storage bucket
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- 9. Verificar archivos en el bucket de avatares
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'user-avatars'
ORDER BY created_at DESC
LIMIT 10;
