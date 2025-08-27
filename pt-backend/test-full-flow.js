const io = require('socket.io-client');

console.log('🚀 Probando flujo completo: conectar → reanudar → observar cuenta regresiva');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';
let startTime = Date.now();
let resumed = false;

socket.on('connect', () => {
  console.log('✅ WebSocket conectado');
  socket.emit('join-tournament', { tournamentId, userId: 'full-flow-test' });
});

socket.on('clock-sync', (data) => {
  console.log(`📤 Clock sync inicial: Nivel ${data.current_level}, ${data.time_remaining_seconds}s, ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  if (data.is_paused && !resumed) {
    resumed = true;
    console.log('▶️ Enviando comando resume-clock...');
    socket.emit('resume-clock', { tournamentId });
  }
});

socket.on('clock-pause-toggled', (data) => {
  console.log(`⏸️ Estado cambió a: ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  if (!data.is_paused) {
    console.log('✅ Reloj reanudado exitosamente - esperando cuenta regresiva...');
  }
});

socket.on('clock-update', (data) => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  console.log(`⏰ [${elapsed}s] UPDATE: ${data.time_remaining_seconds}s restantes (Nivel ${data.current_level})`);

  if (data.time_remaining_seconds <= 0) {
    console.log('🎯 ¡TIEMPO AGOTADO!');
  }
});

socket.on('level-changed', (data) => {
  console.log(`🎯 ¡CAMBIO DE NIVEL! Nivel ${data.new_level} - ${data.duration_minutes} minutos`);
});

// Terminar después de 15 segundos para ver la cuenta regresiva
setTimeout(() => {
  console.log('🏁 Prueba completada');
  socket.disconnect();
}, 15000);
