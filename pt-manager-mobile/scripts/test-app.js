#!/usr/bin/env node

/**
 * Script de prueba para la aplicación PT Manager Mobile
 * Verifica que todas las dependencias estén instaladas y la configuración sea correcta
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de PT Manager Mobile...\n');

// Verificar archivos esenciales
const essentialFiles = [
  'package.json',
  'app.json',
  'eas.json',
  'App.tsx',
  'src/config/supabase.ts',
  'src/config/api.ts',
  'src/navigation/AppNavigator.tsx',
  'src/store/authStore.ts',
  'src/store/tournamentStore.ts',
];

console.log('📁 Verificando archivos esenciales:');
essentialFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - FALTANTE`);
  }
});

// Verificar dependencias en package.json
console.log('\n📦 Verificando dependencias:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const requiredDeps = [
    '@supabase/supabase-js',
    '@react-navigation/native',
    '@react-navigation/stack',
    '@react-navigation/bottom-tabs',
    'expo',
    'react',
    'react-native',
    'zustand',
    'expo-linear-gradient',
    'expo-notifications',
  ];

  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep} - ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`  ❌ ${dep} - FALTANTE`);
    }
  });
} catch (error) {
  console.log('  ❌ Error leyendo package.json');
}

// Verificar configuración de Supabase
console.log('\n🔧 Verificando configuración de Supabase:');
try {
  const supabaseConfig = fs.readFileSync(path.join(__dirname, '..', 'src/config/supabase.ts'), 'utf8');
  if (supabaseConfig.includes('supabaseUrl') && supabaseConfig.includes('supabaseAnonKey')) {
    console.log('  ✅ Configuración de Supabase encontrada');
  } else {
    console.log('  ❌ Configuración de Supabase incompleta');
  }
} catch (error) {
  console.log('  ❌ Error leyendo configuración de Supabase');
}

// Verificar estructura de directorios
console.log('\n📂 Verificando estructura de directorios:');
const requiredDirs = [
  'src',
  'src/components',
  'src/pages',
  'src/pages/auth',
  'src/services',
  'src/store',
  'src/types',
  'src/utils',
  'src/config',
  'src/navigation',
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    console.log(`  ✅ ${dir}/`);
  } else {
    console.log(`  ❌ ${dir}/ - FALTANTE`);
  }
});

// Verificar archivos de pantallas
console.log('\n📱 Verificando pantallas principales:');
const screens = [
  'src/pages/DashboardScreen.tsx',
  'src/pages/TournamentsScreen.tsx',
  'src/pages/ClockScreen.tsx',
  'src/pages/ReportsScreen.tsx',
  'src/pages/ProfileScreen.tsx',
  'src/pages/auth/LoginScreen.tsx',
  'src/pages/auth/RegisterScreen.tsx',
  'src/pages/auth/ForgotPasswordScreen.tsx',
];

screens.forEach(screen => {
  const screenPath = path.join(__dirname, '..', screen);
  if (fs.existsSync(screenPath)) {
    console.log(`  ✅ ${screen}`);
  } else {
    console.log(`  ❌ ${screen} - FALTANTE`);
  }
});

// Verificar componentes
console.log('\n🧩 Verificando componentes:');
const components = [
  'src/components/TournamentClock.tsx',
];

components.forEach(component => {
  const componentPath = path.join(__dirname, '..', component);
  if (fs.existsSync(componentPath)) {
    console.log(`  ✅ ${component}`);
  } else {
    console.log(`  ❌ ${component} - FALTANTE`);
  }
});

console.log('\n🎉 Verificación completada!');
console.log('\n📋 Próximos pasos:');
console.log('  1. Ejecutar: npm install');
console.log('  2. Ejecutar: npm start');
console.log('  3. Escanear QR con Expo Go en tu móvil');
console.log('  4. O ejecutar: npm run android/ios para emulador');

console.log('\n🔗 Enlaces útiles:');
console.log('  - Expo Go: https://expo.dev/client');
console.log('  - Documentación: https://docs.expo.dev/');
console.log('  - Supabase: https://supabase.com/docs');
