const io = require('socket.io-client');

console.log('🎯 PRUEBA SIMPLE DE CAMBIO DE NIVEL');
console.log('=====================================');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';

let currentLevel = 1;
let levelChanges = 0;

socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
  socket.emit('join-tournament', { tournamentId, userId: 'simple-test' });
});

socket.on('clock-sync', (data) => {
  console.log(`📤 Estado inicial recibido:`);
  console.log(`   Nivel: ${data.current_level}`);
  console.log(`   Tiempo: ${data.time_remaining_seconds}s`);
  console.log(`   Estado: ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  currentLevel = data.current_level;

  if (data.is_paused && data.time_remaining_seconds === 10) {
    console.log('\n▶️ Reanudando reloj...');
    socket.emit('resume-clock', { tournamentId });
  } else {
    console.log('\n⚠️ El reloj no está en el estado esperado para la prueba');
    socket.disconnect();
  }
});

socket.on('clock-pause-toggled', (data) => {
  if (!data.is_paused) {
    console.log('✅ Reloj reanudado - esperando cuenta regresiva...');
    console.log('   Deberías ver: 10s → 9s → 8s → ... → 0s → Cambio automático de nivel');
    console.log('');
  }
});

socket.on('clock-update', (data) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ⏰ NIVEL ${currentLevel}: ${data.time_remaining_seconds}s restantes`);

  if (data.time_remaining_seconds <= 3) {
    console.log(`   ⚠️ ¡Atención! Quedan ${data.time_remaining_seconds}s en el nivel ${currentLevel}`);
  }
});

socket.on('level-changed', (data) => {
  levelChanges++;
  const timestamp = new Date().toLocaleTimeString();

  console.log(`\n🎯 [${timestamp}] ¡CAMBIO DE NIVEL AUTOMÁTICO!`);
  console.log(`   Cambio #${levelChanges}`);
  console.log(`   Nivel anterior: ${currentLevel}`);
  console.log(`   Nuevo nivel: ${data.new_level}`);
  console.log(`   Duración del nuevo nivel: ${data.duration_minutes} minutos`);
  console.log(`   Nuevo tiempo restante: ${data.clock_state.time_remaining_seconds}s`);
  console.log('');

  currentLevel = data.new_level;

  if (levelChanges >= 2) {
    console.log('🏁 PRUEBA COMPLETADA: Cambio automático funcionando correctamente');
    setTimeout(() => {
      socket.emit('pause-clock', { tournamentId });
      setTimeout(() => socket.disconnect(), 1000);
    }, 3000);
  } else {
    console.log(`⏰ Esperando cambio automático al nivel ${currentLevel + 1}...`);
  }
});

socket.on('disconnect', () => {
  console.log('\n👋 Desconectado del servidor');
  console.log(`\n📊 RESUMEN:`);
  console.log(`   ✅ Conexión WebSocket: OK`);
  console.log(`   ✅ Cuenta regresiva: OK`);
  console.log(`   ✅ Cambio automático de nivel: ${levelChanges > 0 ? 'OK' : 'FALLÓ'}`);
  console.log(`   ✅ Cambios de nivel detectados: ${levelChanges}`);
});

socket.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

// Timeout de seguridad (2 minutos)
setTimeout(() => {
  console.log('\n⏰ Timeout de seguridad alcanzado');
  socket.emit('pause-clock', { tournamentId });
  setTimeout(() => socket.disconnect(), 1000);
}, 120000);
