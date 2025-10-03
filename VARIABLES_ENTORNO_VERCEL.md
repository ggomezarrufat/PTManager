# Variables de Entorno para Vercel - PT Manager

## Variables Requeridas en Vercel

Basándome en la configuración que me mostraste, estas son las variables de entorno que debes tener configuradas en Vercel:

### ✅ Variables ya configuradas:
1. `SUPABASE_SITE_URL`
2. `SUPABASE_REDIRECT_URL`
3. `NODE_ENV`
4. `SUPABASE_ANON_KEY`
5. `SUPABASE_SERVICE_ROLE_KEY`
6. `CORS_ORIGINS`
7. `API_BASE_URL`
8. `PORT`
9. `SUPABASE_URL`

### 🔧 Variables adicionales necesarias para el frontend:

Para que la aplicación web funcione correctamente, también necesitas configurar estas variables en Vercel:

```bash
# Para la aplicación web (frontend)
REACT_APP_SUPABASE_URL=https://bxzzmpxzubetxgbdakmy.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw
REACT_APP_API_BASE_URL=
```

### 📱 Variables para la aplicación móvil:

Si planeas usar EAS Build para la aplicación móvil, configura estas variables en el dashboard de EAS:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://bxzzmpxzubetxgbdakmy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw
```

## 🔄 Mapeo de Variables

### Backend (Serverless Functions):
- `SUPABASE_URL` → Usado en `/api/clock/join.js` y otros endpoints
- `SUPABASE_SERVICE_ROLE_KEY` → Usado para operaciones de administrador
- `SUPABASE_ANON_KEY` → Usado como fallback

### Frontend (React App):
- `REACT_APP_SUPABASE_URL` → Usado en `src/config/supabase.ts`
- `REACT_APP_SUPABASE_ANON_KEY` → Usado en `src/config/supabase.ts`
- `REACT_APP_API_BASE_URL` → Usado en `src/config/api.ts` (puede estar vacío para usar Serverless Functions)

### Mobile (Expo):
- `EXPO_PUBLIC_SUPABASE_URL` → Usado en `src/config/supabase.ts`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` → Usado en `src/config/supabase.ts`

## 🚀 Pasos para Configurar

1. **En Vercel Dashboard:**
   - Ve a tu proyecto
   - Settings → Environment Variables
   - Agrega las variables `REACT_APP_*` si no están

2. **Verifica que coincidan:**
   - `SUPABASE_URL` = `REACT_APP_SUPABASE_URL` = `EXPO_PUBLIC_SUPABASE_URL`
   - `SUPABASE_ANON_KEY` = `REACT_APP_SUPABASE_ANON_KEY` = `EXPO_PUBLIC_SUPABASE_ANON_KEY`

3. **Redeploy:**
   - Después de agregar las variables, haz un redeploy en Vercel

## ✅ Verificación

Una vez configuradas las variables, el error 500 en `/api/clock/join` debería estar resuelto porque:

1. ✅ Backend usa `SUPABASE_SERVICE_ROLE_KEY` (ya configurada)
2. ✅ Frontend puede usar variables de entorno (agregadas)
3. ✅ Mobile puede usar variables de entorno (agregadas)
4. ✅ Todas las variables coinciden entre backend y frontend

## 🔍 Debug

Si sigues teniendo problemas, revisa los logs de Vercel para ver:
- Si las variables de entorno se están cargando correctamente
- Si hay errores de conexión con Supabase
- Si hay problemas de permisos en la base de datos
