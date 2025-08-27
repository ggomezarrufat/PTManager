const io = require('socket.io-client');

console.log('🔍 PRUEBA DEL SISTEMA DE SINCRONIZACIÓN');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';

socket.on('connect', () => {
  console.log('✅ Conectado');
  socket.emit('join-tournament', { tournamentId, userId: 'sync-test' });
});

socket.on('clock-sync', (data) => {
  console.log(`📤 Estado inicial: ${data.time_remaining_seconds}s, ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  if (data.is_paused) {
    console.log('▶️ Reanudando reloj...');
    socket.emit('resume-clock', { tournamentId });
  }
});

socket.on('clock-pause-toggled', (data) => {
  if (!data.is_paused) {
    console.log('✅ Reloj activo - esperando actualizaciones de sincronización...');
    console.log('   (Deberías ver logs del servidor cada segundo)');
    console.log('   Presiona Ctrl+C para detener\n');
  }
});

socket.on('clock-update', (data) => {
  const now = new Date().toLocaleTimeString();
  console.log(`[${now}] ⏰ SYNC UPDATE: ${data.time_remaining_seconds}s`);
});

socket.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

// Mantener la conexión por 30 segundos para ver las actualizaciones de sync
setTimeout(() => {
  console.log('\n🏁 Fin de prueba de sincronización');
  socket.disconnect();
}, 30000);
