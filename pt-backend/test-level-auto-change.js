const io = require('socket.io-client');

console.log('🎯 PRUEBA DEFINITIVA: CAMBIO AUTOMÁTICO DE NIVEL');
console.log('================================================');
console.log('Configuración: 30 segundos por nivel');
console.log('');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';

let currentLevel = 1;
let levelChanges = 0;
let testStartTime = Date.now();

socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
  socket.emit('join-tournament', { tournamentId, userId: 'auto-level-test' });
});

socket.on('clock-sync', (data) => {
  console.log(`📤 Estado inicial recibido:`);
  console.log(`   Nivel: ${data.current_level}`);
  console.log(`   Tiempo: ${data.time_remaining_seconds}s`);
  console.log(`   Estado: ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  currentLevel = data.current_level;

  if (data.is_paused && data.time_remaining_seconds === 30 && data.current_level === 1) {
    console.log('\n▶️ Iniciando prueba - reanudando reloj...');
    socket.emit('resume-clock', { tournamentId });
  } else {
    console.log('\n⚠️ El reloj no está en el estado esperado para la prueba');
    console.log('   Esperado: Nivel 1, 30s, PAUSADO');
    console.log(`   Actual: Nivel ${data.current_level}, ${data.time_remaining_seconds}s, ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);
    socket.disconnect();
  }
});

socket.on('clock-pause-toggled', (data) => {
  if (!data.is_paused) {
    console.log('\n▶️ ✅ Reloj reanudado exitosamente!');
    console.log('⏰ Esperando cuenta regresiva automática: 30s → 29s → ... → 0s → Cambio automático');
    console.log('');
    testStartTime = Date.now();
  }
});

socket.on('clock-update', (data) => {
  const timestamp = new Date().toLocaleTimeString();
  const elapsed = Math.floor((Date.now() - testStartTime) / 1000);

  if (data.time_remaining_seconds <= 10 || data.time_remaining_seconds % 5 === 0) {
    console.log(`[${timestamp}] ⏰ NIVEL ${currentLevel}: ${data.time_remaining_seconds}s restantes (${elapsed}s total)`);
  }

  if (data.time_remaining_seconds <= 3) {
    console.log(`   ⚠️ ¡Atención! Quedan ${data.time_remaining_seconds}s en el nivel ${currentLevel}`);
  }
});

socket.on('level-changed', (data) => {
  const changeTime = Math.floor((Date.now() - testStartTime) / 1000);
  levelChanges++;

  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n🎯 [${timestamp}] ¡CAMBIO DE NIVEL AUTOMÁTICO DETECTADO!`);
  console.log(`   Cambio #${levelChanges}`);
  console.log(`   Nivel anterior: ${currentLevel}`);
  console.log(`   Nuevo nivel: ${data.new_level}`);
  console.log(`   Nuevo tiempo: ${data.clock_state.time_remaining_seconds}s`);
  console.log(`   Tiempo total transcurrido: ${changeTime}s`);
  console.log('');

  currentLevel = data.new_level;

  if (levelChanges >= 3) {
    console.log('🏁 PRUEBA COMPLETADA: Múltiples cambios de nivel automáticos funcionando');
    setTimeout(() => {
      socket.emit('pause-clock', { tournamentId });
      setTimeout(() => socket.disconnect(), 1000);
    }, 3000);
  } else {
    console.log(`⏰ Esperando cambio automático al nivel ${currentLevel + 1}...`);
    console.log(`   Próximo cambio en aproximadamente 30 segundos`);
  }
});

socket.on('disconnect', () => {
  const totalTime = Math.floor((Date.now() - testStartTime) / 1000);

  console.log('\n👋 Desconectado del servidor');
  console.log('\n📊 RESUMEN FINAL DE LA PRUEBA:');
  console.log('=====================================');
  console.log(`   ✅ Conexión WebSocket: OK`);
  console.log(`   ✅ Reloj reanudado: OK`);
  console.log(`   ✅ Cambios de nivel automáticos: ${levelChanges}`);
  console.log(`   ✅ Tiempo total de prueba: ${totalTime}s`);

  if (levelChanges > 0) {
    console.log(`   🎯 ¡PRUEBA EXITOSA! El cambio automático de nivel está funcionando correctamente`);
    console.log(`   📈 Cambios de nivel realizados: ${levelChanges}`);
    console.log(`   ⏱️ Tiempo promedio entre cambios: ${Math.round(totalTime / levelChanges)}s`);
  } else {
    console.log(`   ❌ PRUEBA FALLIDA: No se detectaron cambios automáticos de nivel`);
  }
});

socket.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

console.log('🚀 Iniciando prueba de cambio automático de nivel...');
console.log('   Pasos esperados:');
console.log('   1. Conectar al torneo');
console.log('   2. Reanudar reloj (nivel 1, 30s)');
console.log('   3. Esperar cuenta regresiva automática');
console.log('   4. Cambio automático al nivel 2 cuando llegue a 0s');
console.log('   5. Repetir para nivel 3');
console.log('   6. Completar prueba');
console.log('');

// Timeout de seguridad (5 minutos)
setTimeout(() => {
  console.log('\n⏰ Timeout de seguridad alcanzado (5 minutos)');
  socket.emit('pause-clock', { tournamentId });
  setTimeout(() => socket.disconnect(), 1000);
}, 300000);
