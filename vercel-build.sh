#!/bin/bash

# Script de build para Vercel - PTManager
echo "🚀 Iniciando build de PTManager en Vercel..."

# Verificar que estamos en el directorio correcto
if [ ! -f "pt-manager/package.json" ]; then
    echo "❌ Error: No se encontró pt-manager/package.json"
    exit 1
fi

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd pt-manager
npm install --production=false
if [ $? -ne 0 ]; then
    echo "❌ Error: Falló la instalación de dependencias del frontend"
    exit 1
fi

# Construir el frontend
echo "🔨 Construyendo el frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: Falló el build del frontend"
    exit 1
fi

# Verificar que el build se creó correctamente
if [ ! -d "build" ]; then
    echo "❌ Error: No se creó el directorio build"
    exit 1
fi

echo "✅ Build del frontend completado exitosamente!"

# Volver al directorio raíz
cd ..

# Copiar el build del frontend al directorio raíz para Vercel
echo "📁 Copiando build al directorio raíz..."
cp -r pt-manager/build ./build
if [ $? -ne 0 ]; then
    echo "❌ Error: Falló la copia del directorio build"
    exit 1
fi

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd pt-backend
npm install --production
if [ $? -ne 0 ]; then
    echo "❌ Error: Falló la instalación de dependencias del backend"
    exit 1
fi
cd ..

# Instalar dependencias de la API
echo "📦 Instalando dependencias de la API..."
cd api
npm install --production
if [ $? -ne 0 ]; then
    echo "❌ Error: Falló la instalación de dependencias de la API"
    exit 1
fi
cd ..

echo "✅ Build completado exitosamente!"
echo "📁 Directorios creados:"
echo "   - Frontend: build/ (copiado desde pt-manager/build/)"
echo "   - Backend: pt-backend/node_modules/"
echo "   - API: api/node_modules/"
