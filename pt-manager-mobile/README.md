# PT Manager Mobile

Aplicación móvil nativa para Android e iOS del gestor de torneos de póker PT Manager.

## 🎯 Características

- **Autenticación completa** con Supabase
- **Reloj del torneo** en tiempo real con sincronización
- **Gestión de jugadores** y recompras
- **Interfaz optimizada** para móviles
- **Notificaciones push** (próximamente)
- **Modo offline** (próximamente)

## 🚀 Tecnologías

- **React Native** con Expo
- **TypeScript** para tipado estático
- **Supabase** para backend y autenticación
- **Zustand** para manejo de estado
- **React Navigation** para navegación
- **Expo Linear Gradient** para efectos visuales

## 📱 Instalación

### Prerrequisitos

- Node.js 16+
- npm o yarn
- Expo CLI (`npm install -g @expo/cli`)
- Cuenta en Expo (para builds)

### Configuración

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd pt-manager-mobile
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crear archivo `.env` en la raíz:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://bxzzmpxzubetxgbdakmy.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm start
   ```

## 🛠️ Desarrollo

### Comandos disponibles

```bash
# Iniciar servidor de desarrollo
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios

# Ejecutar en web
npm run web
```

### Estructura del proyecto

```
src/
├── components/          # Componentes reutilizables
│   └── TournamentClock.tsx
├── config/             # Configuración
│   ├── api.ts
│   └── supabase.ts
├── navigation/         # Navegación
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
├── pages/             # Pantallas
│   ├── auth/          # Autenticación
│   ├── DashboardScreen.tsx
│   ├── TournamentsScreen.tsx
│   ├── ClockScreen.tsx
│   ├── ReportsScreen.tsx
│   ├── ProfileScreen.tsx
│   └── ...
├── store/             # Estado global
│   ├── authStore.ts
│   └── tournamentStore.ts
├── types/             # Tipos TypeScript
│   └── index.ts
└── utils/             # Utilidades
```

## 📦 Build y Deploy

### Configuración EAS

1. **Instalar EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Configurar proyecto**
   ```bash
   eas login
   eas build:configure
   ```

### Build para Android

```bash
# Build de desarrollo
eas build --platform android --profile development

# Build de producción
eas build --platform android --profile production
```

### Build para iOS

```bash
# Build de desarrollo
eas build --platform ios --profile development

# Build de producción
eas build --platform ios --profile production
```

### Subir a las tiendas

```bash
# Subir a Google Play
eas submit --platform android

# Subir a App Store
eas submit --platform ios
```

## 🔧 Configuración adicional

### Notificaciones Push

Para habilitar notificaciones push:

1. Configurar Expo Notifications
2. Configurar certificados de push
3. Implementar lógica de notificaciones

### Modo Offline

Para funcionalidad offline:

1. Configurar AsyncStorage
2. Implementar sincronización
3. Manejar conflictos de datos

## 📱 Características de la App

### Pantallas principales

- **Dashboard**: Vista general de torneos
- **Torneos**: Lista y gestión de torneos
- **Reloj**: Control del tournament clock
- **Reportes**: Estadísticas y análisis
- **Perfil**: Configuración del usuario

### Funcionalidades

- ✅ Autenticación con email/password
- ✅ Gestión de torneos
- ✅ Reloj del torneo en tiempo real
- ✅ Gestión de jugadores
- ✅ Interfaz responsive
- 🔄 Notificaciones push
- 🔄 Modo offline
- 🔄 Autenticación social

## 🐛 Solución de problemas

### Errores comunes

1. **Error de conexión con Supabase**
   - Verificar variables de entorno
   - Comprobar configuración de Supabase

2. **Error de build**
   - Limpiar cache: `expo r -c`
   - Reinstalar dependencias: `rm -rf node_modules && npm install`

3. **Error de navegación**
   - Verificar configuración de React Navigation
   - Comprobar tipos de navegación

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico, contacta al equipo de desarrollo o crea un issue en el repositorio.
