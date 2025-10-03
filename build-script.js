#!/usr/bin/env node

// Script de build para Vercel - PT Manager
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando build de PTManager en Vercel...');
console.log('📍 Directorio actual:', process.cwd());

try {
  // Verificar que estamos en el directorio correcto
  if (!fs.existsSync('package.json')) {
    throw new Error('No se encontró package.json en el directorio actual');
  }

  // Verificar que existe pt-manager/api
  if (!fs.existsSync('pt-manager/api')) {
    throw new Error('No se encontró pt-manager/api');
  }

  console.log('📁 Contenido del directorio:');
  console.log(fs.readdirSync('.').join(', '));

  // Limpiar directorio api si existe
  if (fs.existsSync('api')) {
    console.log('🧹 Limpiando directorio api existente...');
    fs.rmSync('api', { recursive: true, force: true });
  }

  // Copiar funciones API
  console.log('📦 Copiando funciones API...');
  fs.cpSync('pt-manager/api', 'api', { recursive: true });

  // Verificar que se copió correctamente
  if (!fs.existsSync('api')) {
    throw new Error('No se pudo crear el directorio api');
  }

  console.log('✅ Funciones API copiadas exitosamente');
  console.log('📁 Contenido de api/:');
  console.log(fs.readdirSync('api').join(', '));

  // Instalar dependencias del frontend
  console.log('📦 Instalando dependencias del frontend...');
  execSync('cd pt-manager && npm install', { stdio: 'inherit' });

  // Construir el frontend
  console.log('🔨 Construyendo el frontend...');
  execSync('cd pt-manager && npm run build', { stdio: 'inherit' });

  // Verificar que el build se creó correctamente
  if (!fs.existsSync('pt-manager/build')) {
    throw new Error('No se creó el directorio pt-manager/build');
  }

  console.log('✅ Build completado exitosamente!');
  console.log('📁 Estructura final:');
  console.log('   - api/ (funciones serverless)');
  console.log('   - pt-manager/build/ (aplicación React)');

} catch (error) {
  console.error('❌ Error durante el build:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
