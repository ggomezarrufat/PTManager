# Instrucciones de Deploy para Vercel

## 🚀 Configuración de Deploy

### Opción 1: Deploy desde el directorio pt-manager (Recomendado)

Si quieres hacer deploy solo de la aplicación web desde el directorio `pt-manager`:

1. **En Vercel Dashboard:**
   - Importa el proyecto desde GitHub
   - Selecciona el directorio `pt-manager` como Root Directory
   - Vercel detectará automáticamente que es un proyecto React

2. **Variables de entorno a configurar:**
   ```
   REACT_APP_SUPABASE_URL=https://bxzzmpxzubetxgbdakmy.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw
   REACT_APP_API_BASE_URL=
   ```

3. **Configuración automática:**
   - Vercel detectará el `package.json` y configurará automáticamente:
     - Build Command: `npm run build`
     - Output Directory: `build`
     - Install Command: `npm install`

### Opción 2: Deploy desde el directorio raíz (Si necesitas el script personalizado)

Si quieres usar el script `vercel-build.sh` desde el directorio raíz:

1. **En Vercel Dashboard:**
   - Importa el proyecto desde GitHub
   - Deja el Root Directory como raíz del proyecto
   - Configura manualmente:
     - Build Command: `bash vercel-build.sh`
     - Output Directory: `build`
     - Install Command: `echo 'Skipping root install, using custom build script'`

2. **Variables de entorno a configurar:**
   ```
   REACT_APP_SUPABASE_URL=https://bxzzmpxzubetxgbdakmy.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw
   REACT_APP_API_BASE_URL=
   ```

## 🔧 Solución al Error "Command bash vercel-build.sh exited with 127"

Este error ocurre cuando:
1. El archivo `vercel-build.sh` no existe en el directorio de trabajo
2. El archivo no tiene permisos de ejecución
3. Bash no está disponible en el entorno de Vercel

### Soluciones aplicadas:

1. **✅ Configuración simplificada:** Actualizado `vercel.json` para usar comandos npm estándar
2. **✅ Build Command:** Cambiado a `npm install && npm run build`
3. **✅ Output Directory:** Configurado como `build`
4. **✅ Funciones API:** Configuradas todas las funciones serverless

## 📋 Checklist para el Deploy

- [ ] Variables de entorno configuradas en Vercel
- [ ] Root Directory configurado correctamente
- [ ] Build Command configurado
- [ ] Output Directory configurado
- [ ] API Functions configuradas
- [ ] Headers CORS configurados

## 🐛 Debugging

Si sigues teniendo problemas:

1. **Revisa los logs de build en Vercel**
2. **Verifica que las variables de entorno estén configuradas**
3. **Asegúrate de que el Root Directory sea correcto**
4. **Verifica que el package.json tenga el script "build"**

## 🎯 Recomendación

**Usa la Opción 1** (deploy desde `pt-manager`): Es más simple, más rápido y más confiable. Vercel maneja automáticamente la configuración de React.
