#!/bin/bash

echo "🍎 Configurando simulador de iOS para PT Manager Mobile..."

# Verificar si Xcode está instalado
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode no está instalado. Por favor instala Xcode desde el App Store."
    exit 1
fi

# Verificar si el simulador está disponible
if ! xcrun simctl list devices | grep -q "iPhone"; then
    echo "❌ No se encontraron simuladores de iPhone. Creando uno..."
    xcrun simctl create "iPhone 15" "iPhone 15" "iOS 17.0"
fi

# Listar simuladores disponibles
echo "📱 Simuladores de iPhone disponibles:"
xcrun simctl list devices | grep "iPhone" | grep -v "unavailable"

# Abrir simulador
echo "🚀 Abriendo simulador de iOS..."
open -a Simulator

# Esperar un momento para que el simulador se abra
sleep 3

# Instalar Expo Go en el simulador
echo "📦 Instalando Expo Go en el simulador..."
npx expo install --ios

echo "✅ Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. El simulador de iOS debería estar abierto"
echo "2. Expo Go se instalará automáticamente"
echo "3. Ejecuta 'npm start' para iniciar la aplicación"
echo "4. La app se abrirá automáticamente en el simulador"
echo ""
echo "🔗 Si necesitas ayuda:"
echo "- Ver documentación: https://docs.expo.dev/workflow/ios-simulator/"
echo "- Comandos útiles:"
echo "  - npm run ios (abrir en simulador)"
echo "  - npm start (iniciar servidor)"
echo "  - r (recargar app en simulador)"

