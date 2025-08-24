#!/bin/bash
set -e  # Exit on any error

# Script de build para Vercel - PTManager
echo "🚀 Iniciando build de PTManager en Vercel..."
echo "📍 Directorio actual: $(pwd)"
echo "📁 Contenido del directorio:"
ls -la

# Verificar que estamos en el directorio correcto
if [ ! -f "pt-manager/package.json" ]; then
    echo "❌ Error: No se encontró pt-manager/package.json"
    echo "📁 Archivos disponibles:"
    find . -name "package.json" -type f
    exit 1
fi

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd pt-manager
echo "📍 Directorio frontend: $(pwd)"

# Limpiar caché de npm
npm cache clean --force

# Instalar dependencias
npm install --production=false
echo "✅ Dependencias del frontend instaladas"

# Construir el frontend
echo "🔨 Construyendo el frontend..."
npm run build

# Verificar que el build se creó correctamente
if [ ! -d "build" ]; then
    echo "❌ Error: No se creó el directorio build"
    echo "📁 Contenido del directorio pt-manager:"
    ls -la
    exit 1
fi

echo "✅ Build del frontend completado exitosamente!"
echo "📁 Contenido del build:"
ls -la build/

# Volver al directorio raíz
cd ..
echo "📍 Volviendo al directorio raíz: $(pwd)"

# Copiar el build del frontend al directorio raíz para Vercel
echo "📁 Copiando build al directorio raíz..."
cp -r pt-manager/build ./build
echo "✅ Build copiado exitosamente"

# Verificar la copia
if [ ! -d "build" ]; then
    echo "❌ Error: No se pudo copiar el directorio build"
    exit 1
fi

echo "📁 Contenido del build en raíz:"
ls -la build/

# Instalar dependencias de la API (necesarias para las funciones serverless)
echo "📦 Instalando dependencias de la API..."
cd api
echo "📍 Directorio API: $(pwd)"

# Limpiar caché de npm
npm cache clean --force

# Instalar dependencias
npm install --production
echo "✅ Dependencias de la API instaladas"

cd ..

echo "✅ Build completado exitosamente!"
echo "📁 Estructura final:"
echo "   - Frontend: build/ (listo para servir)"
echo "   - API: api/node_modules/ (listo para serverless functions)"
echo "📍 Directorio final: $(pwd)"
echo "📁 Contenido final:"
ls -la
