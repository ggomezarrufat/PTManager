const io = require('socket.io-client');

console.log('🎯 PRUEBA DE CAMBIO AUTOMÁTICO DE NIVEL');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';

let currentLevel = 1;
let startTime = Date.now();

socket.on('connect', () => {
  console.log('✅ WebSocket conectado');
  socket.emit('join-tournament', { tournamentId, userId: 'level-test' });
});

socket.on('clock-sync', (data) => {
  console.log(`📤 Estado inicial: Nivel ${data.current_level}, ${data.time_remaining_seconds}s, ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);
  currentLevel = data.current_level;

  if (data.is_paused) {
    console.log('▶️ Reanudando reloj...');
    socket.emit('resume-clock', { tournamentId });
  } else {
    console.log('✅ Reloj ya activo - esperando cambio de nivel automático...');
  }
});

socket.on('clock-pause-toggled', (data) => {
  if (!data.is_paused) {
    console.log('✅ Reloj reanudado - esperando cuenta regresiva y cambio de nivel...');
    startTime = Date.now();
  }
});

socket.on('clock-update', (data) => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  console.log(`⏰ Nivel ${currentLevel}: ${data.time_remaining_seconds}s restantes (tiempo transcurrido: ${elapsed}s)`);

  if (data.time_remaining_seconds <= 10) {
    console.log(`⚠️ ¡Atención! Quedan ${data.time_remaining_seconds}s en el nivel ${currentLevel}`);
  }
});

socket.on('level-changed', (data) => {
  const changeTime = Math.floor((Date.now() - startTime) / 1000);
  console.log(`\n🎯 ¡CAMBIO DE NIVEL AUTOMÁTICO DETECTADO!`);
  console.log(`   Nivel anterior: ${currentLevel}`);
  console.log(`   Nuevo nivel: ${data.new_level}`);
  console.log(`   Duración: ${data.duration_minutes} minutos`);
  console.log(`   Tiempo de cambio: ${changeTime}s desde el inicio`);
  console.log(`   Estado del reloj: ${data.clock_state.time_remaining_seconds}s restantes`);

  currentLevel = data.new_level;

  if (data.new_level >= 3) {
    console.log('\n🏁 PRUEBA COMPLETADA: Múltiples cambios de nivel exitosos');
    setTimeout(() => {
      socket.emit('pause-clock', { tournamentId });
      setTimeout(() => socket.disconnect(), 1000);
    }, 5000);
  } else {
    console.log(`\n⏰ Esperando cambio automático al nivel ${data.new_level + 1}...`);
  }
});

socket.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

console.log('\n🚀 Iniciando prueba...');
console.log('   El reloj debería:');
console.log('   1. Contar desde 120s hasta 0s (nivel 1)');
console.log('   2. Cambiar automáticamente al nivel 2');
console.log('   3. Continuar contando desde 120s hasta 0s (nivel 2)');
console.log('   4. Cambiar automáticamente al nivel 3');
console.log('   5. Detener la prueba\n');

// Timeout de seguridad (10 minutos)
setTimeout(() => {
  console.log('\n⏰ Timeout de seguridad alcanzado');
  socket.emit('pause-clock', { tournamentId });
  setTimeout(() => socket.disconnect(), 1000);
}, 600000);
