#!/bin/bash

echo "📱 Verificando icono de la aplicación PT Manager Mobile..."
echo ""

# Verificar que los assets existan
echo "🔍 Verificando assets:"
if [ -f "assets/icon.png" ]; then
    echo "✅ Icono principal encontrado (assets/icon.png)"
    ls -lh assets/icon.png
else
    echo "❌ Icono principal no encontrado"
fi

if [ -f "assets/splash.png" ]; then
    echo "✅ Splash screen encontrado (assets/splash.png)"
    ls -lh assets/splash.png
else
    echo "❌ Splash screen no encontrado"
fi

if [ -f "assets/adaptive-icon.png" ]; then
    echo "✅ Icono adaptativo encontrado (assets/adaptive-icon.png)"
    ls -lh assets/adaptive-icon.png
else
    echo "❌ Icono adaptativo no encontrado"
fi

echo ""

# Verificar configuración en app.json
echo "⚙️  Verificando configuración:"
if grep -q '"icon": "./assets/icon.png"' app.json; then
    echo "✅ Configuración de icono en app.json correcta"
else
    echo "❌ Configuración de icono en app.json incorrecta"
fi

if grep -q '"image": "./assets/splash.png"' app.json; then
    echo "✅ Configuración de splash en app.json correcta"
else
    echo "❌ Configuración de splash en app.json incorrecta"
fi

echo ""

# Verificar simulador
echo "📱 Verificando simulador:"
if xcrun simctl list devices | grep -q "Booted"; then
    echo "✅ Simulador de iOS ejecutándose"
    echo "📱 Dispositivos activos:"
    xcrun simctl list devices | grep "Booted"
else
    echo "❌ No hay simuladores ejecutándose"
    echo "💡 Ejecuta: open -a Simulator"
fi

echo ""

# Verificar Expo Go
echo "📦 Verificando Expo Go:"
if xcrun simctl listapps | grep -q "Expo Go"; then
    echo "✅ Expo Go instalado en el simulador"
else
    echo "⚠️  Expo Go no instalado (se instalará automáticamente)"
fi

echo ""

# Instrucciones
echo "🚀 Para ver el icono de la app:"
echo "1. Asegúrate de que el simulador esté abierto"
echo "2. La aplicación debería aparecer con el icono de PT Manager"
echo "3. Si no aparece, presiona 'i' en la terminal para abrir iOS"
echo "4. O escanea el QR con Expo Go en el simulador"

echo ""
echo "🔧 Si el icono no aparece:"
echo "- Reinicia el simulador: xcrun simctl shutdown all && open -a Simulator"
echo "- Limpia cache: npx expo r -c"
echo "- Reinstala: npx expo start --ios --clear"

echo ""
echo "🎉 ¡Verificación completada!"
