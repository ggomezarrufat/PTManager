const io = require('socket.io-client');

console.log('🧪 Probando cuenta regresiva simple...');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';

socket.on('connect', () => {
  console.log('✅ WebSocket conectado');
  socket.emit('join-tournament', { tournamentId, userId: 'test-simple' });
});

socket.on('clock-sync', (data) => {
  console.log(`📤 Clock sync: Nivel ${data.current_level}, ${data.time_remaining_seconds}s, ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  if (data.is_paused) {
    console.log('▶️ Reanudando reloj automáticamente...');
    socket.emit('resume-clock', { tournamentId });
  }
});

socket.on('clock-pause-toggled', (data) => {
  console.log(`⏸️ Estado cambió a: ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);
});

socket.on('clock-update', (data) => {
  console.log(`⏰ UPDATE: ${data.time_remaining_seconds}s restantes (Nivel ${data.current_level})`);
});

socket.on('level-changed', (data) => {
  console.log(`🎯 ¡CAMBIO DE NIVEL! Nivel ${data.new_level} - ${data.duration_minutes} minutos`);
});

socket.on('disconnect', () => {
  console.log('🔌 WebSocket desconectado');
});

// Terminar después de 10 segundos
setTimeout(() => {
  console.log('🏁 Prueba completada');
  socket.disconnect();
}, 10000);
