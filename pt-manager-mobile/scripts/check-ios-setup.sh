#!/bin/bash

echo "🍎 Verificando configuración de iOS para PT Manager Mobile..."
echo ""

# Verificar si el simulador está corriendo
echo "📱 Verificando simulador de iOS..."
if xcrun simctl list devices | grep -q "Booted"; then
    echo "✅ Simulador de iOS está ejecutándose"
    xcrun simctl list devices | grep "Booted"
else
    echo "❌ No hay simuladores ejecutándose"
    echo "💡 Ejecuta: open -a Simulator"
fi

echo ""

# Verificar si Expo Go está instalado
echo "📦 Verificando Expo Go..."
if xcrun simctl listapps | grep -q "Expo Go"; then
    echo "✅ Expo Go está instalado en el simulador"
else
    echo "⚠️  Expo Go no está instalado"
    echo "💡 Se instalará automáticamente cuando ejecutes la app"
fi

echo ""

# Verificar dependencias
echo "🔧 Verificando dependencias..."
if [ -f "node_modules/.bin/expo" ]; then
    echo "✅ Expo CLI está instalado"
else
    echo "❌ Expo CLI no está instalado"
fi

if [ -f "node_modules/react-native/package.json" ]; then
    echo "✅ React Native está instalado"
else
    echo "❌ React Native no está instalado"
fi

echo ""

# Verificar configuración
echo "⚙️  Verificando configuración..."
if [ -f "app.json" ]; then
    echo "✅ app.json encontrado"
else
    echo "❌ app.json no encontrado"
fi

if [ -f "src/config/supabase.ts" ]; then
    echo "✅ Configuración de Supabase encontrada"
else
    echo "❌ Configuración de Supabase no encontrada"
fi

echo ""

# Mostrar comandos útiles
echo "🚀 Comandos útiles:"
echo "  - npm run ios     (abrir en simulador)"
echo "  - npm start       (iniciar servidor)"
echo "  - r               (recargar app en simulador)"
echo "  - d               (abrir debugger)"
echo "  - j               (abrir debugger JS)"
echo "  - m               (mostrar menú)"

echo ""
echo "📱 Si la app no se abre automáticamente:"
echo "  1. Abre Expo Go en el simulador"
echo "  2. Escanea el QR que aparece en la terminal"
echo "  3. O presiona 'i' en la terminal para abrir iOS"

echo ""
echo "🎉 ¡Configuración completada!"
