# 📱 PT Manager Mobile - Instrucciones de Instalación

## 🚀 Inicio Rápido

### 1. Prerrequisitos
- Node.js 16+ instalado
- npm o yarn
- Expo Go app en tu móvil (Android/iOS)
- Cuenta en Supabase (opcional para desarrollo)

### 2. Instalación
```bash
# Navegar al directorio del proyecto
cd pt-manager-mobile

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

### 3. Probar en Dispositivo
1. **Instalar Expo Go:**
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Conectar dispositivo:**
   - Escanear el QR que aparece en la terminal
   - O usar emulador: `npm run android` / `npm run ios`

## 🔧 Configuración Avanzada

### Variables de Entorno
1. Copiar archivo de ejemplo:
   ```bash
   cp env.example .env
   ```

2. Editar `.env` con tus credenciales:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=tu-url-supabase
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
   ```

### Configuración de Supabase
1. Crear proyecto en [Supabase](https://supabase.com)
2. Obtener URL y clave anónima
3. Configurar autenticación y base de datos
4. Actualizar variables de entorno

## 📱 Funcionalidades Disponibles

### ✅ Implementadas
- **Autenticación:** Login, registro, recuperación de contraseña
- **Dashboard:** Vista general de torneos
- **Torneos:** Lista, filtros, búsqueda
- **Reloj:** Tournament clock en tiempo real
- **Jugadores:** Gestión completa de participantes
- **Reportes:** Estadísticas y análisis
- **Perfil:** Configuración de usuario

### 🔄 En Desarrollo
- Notificaciones push
- Modo offline completo
- Autenticación social (Google/GitHub)
- Sincronización en tiempo real

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm start                 # Iniciar servidor
npm run android          # Ejecutar en Android
npm run ios              # Ejecutar en iOS
npm run web              # Ejecutar en web

# Build
npm run build:android    # Build para Android
npm run build:ios        # Build para iOS

# Utilidades
node scripts/test-app.js # Verificar configuración
```

## 🐛 Solución de Problemas

### Error de dependencias
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error de conexión
- Verificar variables de entorno
- Comprobar conexión a internet
- Verificar configuración de Supabase

### Error de build
```bash
expo r -c  # Limpiar cache
npm install
```

## 📞 Soporte

- **Documentación:** [Expo Docs](https://docs.expo.dev/)
- **Supabase:** [Supabase Docs](https://supabase.com/docs)
- **Issues:** Crear issue en el repositorio

## 🎯 Próximos Pasos

1. **Probar la aplicación** en tu dispositivo
2. **Configurar Supabase** para datos reales
3. **Personalizar** colores y temas
4. **Agregar funcionalidades** específicas
5. **Preparar para producción** con EAS Build

¡Disfruta desarrollando con PT Manager Mobile! 🎉
