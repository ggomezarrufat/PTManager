const io = require('socket.io-client');

console.log('👀 Observando reloj durante 30 segundos...');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';
let startTime = Date.now();
let lastTime = -1;

socket.on('connect', () => {
  console.log('✅ WebSocket conectado');
  socket.emit('join-tournament', { tournamentId, userId: 'observer' });
});

socket.on('clock-sync', (data) => {
  console.log(`📤 Clock sync: Nivel ${data.current_level}, ${data.time_remaining_seconds}s, ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);
  lastTime = data.time_remaining_seconds;
});

socket.on('clock-update', (data) => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);

  if (data.time_remaining_seconds !== lastTime) {
    const diff = lastTime - data.time_remaining_seconds;
    console.log(`⏰ [${elapsed}s] ${data.time_remaining_seconds}s restantes (cambio: ${diff > 0 ? '-' + diff : '+' + Math.abs(diff)}s)`);
    lastTime = data.time_remaining_seconds;
  }

  if (data.time_remaining_seconds <= 0) {
    console.log('🎯 ¡TIEMPO AGOTADO!');
  }
});

socket.on('level-changed', (data) => {
  console.log(`🎯 ¡CAMBIO DE NIVEL! Nivel ${data.new_level} - ${data.duration_minutes} minutos`);
  lastTime = -1; // Reset para el nuevo nivel
});

socket.on('disconnect', () => {
  console.log('🔌 WebSocket desconectado');
});

// Terminar después de 20 segundos
setTimeout(() => {
  console.log('🏁 Observación completada');
  socket.disconnect();
}, 20000);
