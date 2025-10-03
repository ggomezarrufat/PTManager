#!/bin/bash

echo "🔧 Verificando dependencias de PT Manager Mobile..."
echo ""

# Verificar dependencias críticas
echo "📦 Verificando dependencias principales:"

# React Native Gesture Handler
if [ -d "node_modules/react-native-gesture-handler" ]; then
    echo "✅ react-native-gesture-handler instalado"
else
    echo "❌ react-native-gesture-handler NO instalado"
fi

# React Navigation
if [ -d "node_modules/@react-navigation" ]; then
    echo "✅ @react-navigation instalado"
else
    echo "❌ @react-navigation NO instalado"
fi

# Expo
if [ -d "node_modules/expo" ]; then
    echo "✅ expo instalado"
else
    echo "❌ expo NO instalado"
fi

# Zustand
if [ -d "node_modules/zustand" ]; then
    echo "✅ zustand instalado"
else
    echo "❌ zustand NO instalado"
fi

# Supabase
if [ -d "node_modules/@supabase" ]; then
    echo "✅ @supabase instalado"
else
    echo "❌ @supabase NO instalado"
fi

echo ""

# Verificar package.json
echo "📋 Verificando package.json:"
if grep -q "react-native-gesture-handler" package.json; then
    echo "✅ react-native-gesture-handler en package.json"
else
    echo "❌ react-native-gesture-handler NO en package.json"
fi

if grep -q "@react-navigation/stack" package.json; then
    echo "✅ @react-navigation/stack en package.json"
else
    echo "❌ @react-navigation/stack NO en package.json"
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

# Verificar procesos de Expo
echo "🚀 Verificando procesos de Expo:"
if pgrep -f expo > /dev/null; then
    echo "✅ Proceso de Expo ejecutándose"
    echo "📊 Procesos activos:"
    pgrep -f expo
else
    echo "❌ No hay procesos de Expo ejecutándose"
    echo "💡 Ejecuta: npx expo start --ios"
fi

echo ""

# Instrucciones
echo "🔧 Si hay problemas:"
echo "1. Instalar dependencias faltantes:"
echo "   npm install --legacy-peer-deps"
echo ""
echo "2. Limpiar cache y reinstalar:"
echo "   npm cache clean --force"
echo "   rm -rf node_modules package-lock.json"
echo "   npm install --legacy-peer-deps"
echo ""
echo "3. Reiniciar aplicación:"
echo "   pkill -f expo"
echo "   npx expo start --ios --clear"

echo ""
echo "🎉 ¡Verificación completada!"
