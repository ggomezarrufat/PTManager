# 📱 Guía para Emulador de iOS - PT Manager Mobile

## 🎯 Estado Actual

✅ **Simulador de iOS configurado** (iPhone 16 ejecutándose)  
✅ **Dependencias instaladas** correctamente  
✅ **Expo CLI funcionando**  
✅ **Aplicación iniciada** en el simulador  

## 🚀 Cómo Usar la Aplicación

### 1. **Verificar que el simulador esté abierto**
- El simulador de iPhone 16 debería estar visible en tu pantalla
- Si no está abierto, ejecuta: `open -a Simulator`

### 2. **La aplicación debería abrirse automáticamente**
- Expo Go se instalará automáticamente en el simulador
- La aplicación PT Manager se abrirá dentro de Expo Go

### 3. **Si la app no se abre automáticamente:**
```bash
# En la terminal, presiona 'i' para abrir en iOS
# O ejecuta:
npm run ios
```

## 🎮 Controles del Simulador

### **Comandos en la Terminal:**
- `r` - Recargar la aplicación
- `d` - Abrir debugger
- `j` - Abrir debugger JS
- `m` - Mostrar menú
- `i` - Abrir en simulador iOS
- `a` - Abrir en emulador Android
- `w` - Abrir en navegador web

### **Gestos en el Simulador:**
- **Tap** - Tocar pantalla
- **Swipe** - Deslizar
- **Pinch** - Pellizcar para zoom
- **Shake** - Agitar dispositivo (Cmd+Ctrl+Z)

## 📱 Funcionalidades de la App

### **Pantallas Disponibles:**
1. **🔐 Login/Registro** - Autenticación de usuarios
2. **🏠 Dashboard** - Vista principal con torneos
3. **🏆 Torneos** - Lista y gestión de torneos
4. **⏰ Reloj** - Tournament clock en tiempo real
5. **📊 Reportes** - Estadísticas y análisis
6. **👤 Perfil** - Configuración del usuario

### **Características Principales:**
- **Tema oscuro** elegante
- **Navegación por tabs** intuitiva
- **Reloj del torneo** con animaciones
- **Gestión de jugadores** completa
- **Sincronización en tiempo real**

## 🔧 Solución de Problemas

### **Si la app no se carga:**
```bash
# Detener procesos
pkill -f expo

# Limpiar cache
npx expo r -c

# Reiniciar
npm run ios
```

### **Si hay errores de dependencias:**
```bash
# Reinstalar con compatibilidad
npm install --legacy-peer-deps

# Verificar configuración
./scripts/check-ios-setup.sh
```

### **Si el simulador no responde:**
```bash
# Reiniciar simulador
xcrun simctl shutdown all
open -a Simulator

# O resetear simulador
xcrun simctl erase all
```

## 📋 Próximos Pasos

1. **Probar la aplicación** en el simulador
2. **Configurar Supabase** para datos reales
3. **Personalizar** colores y temas
4. **Agregar funcionalidades** específicas
5. **Preparar para producción**

## 🎉 ¡Disfruta Desarrollando!

La aplicación PT Manager Mobile está lista para usar en el simulador de iOS. Todas las funcionalidades principales de tu aplicación web han sido replicadas exitosamente en la versión móvil.

### **Enlaces Útiles:**
- [Documentación de Expo](https://docs.expo.dev/)
- [Guía de Simulador iOS](https://docs.expo.dev/workflow/ios-simulator/)
- [React Navigation](https://reactnavigation.org/)
- [Supabase Docs](https://supabase.com/docs)
