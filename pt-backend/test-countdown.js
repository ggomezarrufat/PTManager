const io = require('socket.io-client');

console.log('⏰ Probando cuenta regresiva pura (conectar a reloj ya activo)');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';
let startTime = Date.now();

socket.on('connect', () => {
  console.log('✅ WebSocket conectado');
  socket.emit('join-tournament', { tournamentId, userId: 'countdown-test' });
});

socket.on('clock-sync', (data) => {
  console.log(`📤 Estado inicial: Nivel ${data.current_level}, ${data.time_remaining_seconds}s, ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  if (data.is_paused) {
    console.log('⚠️ El reloj está pausado - reanúdalo primero');
  } else {
    console.log('✅ Reloj activo - esperando cuenta regresiva...');
  }
});

socket.on('clock-update', (data) => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const change = data.time_remaining_seconds < 120 ? '↓' : '=';
  console.log(`⏰ [${elapsed}s] ${change} ${data.time_remaining_seconds}s restantes`);
});

socket.on('level-changed', (data) => {
  console.log(`🎯 ¡CAMBIO DE NIVEL! Nivel ${data.new_level} - ${data.duration_minutes} minutos`);
});

// Terminar después de 10 segundos
setTimeout(() => {
  console.log('🏁 Prueba de cuenta regresiva completada');
  socket.disconnect();
}, 10000);
