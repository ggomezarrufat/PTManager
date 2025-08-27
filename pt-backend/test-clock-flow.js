const io = require('socket.io-client');

console.log('🧪 Probando flujo completo del reloj...');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';
let startTime = Date.now();

socket.on('connect', () => {
  console.log('✅ WebSocket conectado');
  socket.emit('join-tournament', { tournamentId, userId: 'test-flow' });
});

socket.on('clock-sync', (data) => {
  console.log(`📤 Clock sync recibido: Nivel ${data.current_level}, ${data.time_remaining_seconds}s, ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  if (data.is_paused) {
    // Reanudar el reloj después de 2 segundos
    setTimeout(() => {
      console.log('▶️ Enviando comando resume-clock...');
      socket.emit('resume-clock', { tournamentId });
    }, 2000);
  }
});

socket.on('clock-pause-toggled', (data) => {
  console.log(`⏸️ Estado cambió a: ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);
});

socket.on('clock-update', (data) => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  console.log(`⏰ [${elapsed}s] Reloj: ${data.time_remaining_seconds}s restantes (Nivel ${data.current_level})`);

  // Si quedan menos de 5 segundos, pausar para evitar cambio de nivel
  if (data.time_remaining_seconds <= 5 && data.time_remaining_seconds > 0) {
    console.log('⏸️ Pausando reloj para evitar cambio de nivel...');
    socket.emit('pause-clock', { tournamentId });
  }
});

socket.on('level-changed', (data) => {
  console.log(`🎯 ¡CAMBIO DE NIVEL! Nivel ${data.new_level} - ${data.duration_minutes} minutos`);
});

socket.on('disconnect', () => {
  console.log('🔌 WebSocket desconectado');
});

// Terminar después de 30 segundos
setTimeout(() => {
  console.log('🏁 Prueba completada');
  socket.disconnect();
}, 30000);
