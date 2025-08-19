#!/bin/bash

# Script de build para Vercel - PTManager
echo "🚀 Iniciando build de PTManager en Vercel..."

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd pt-backend
npm install --production
cd ..

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd pt-manager
npm install
npm run build
cd ..

echo "✅ Build completado exitosamente!"
