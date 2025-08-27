const io = require('socket.io-client');

console.log('⏰ PRUEBA DE CUENTA REGRESIVA PURA');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';

socket.on('connect', () => {
  console.log('✅ Conectado');
  socket.emit('join-tournament', { tournamentId, userId: 'countdown-test' });
});

socket.on('clock-sync', (data) => {
  console.log(`📤 Estado inicial: ${data.time_remaining_seconds}s, ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  if (data.is_paused) {
    console.log('▶️ Reanudando reloj...');
    socket.emit('resume-clock', { tournamentId });
  } else {
    console.log('✅ Reloj ya activo - esperando cuenta regresiva...');
    startCountdown();
  }
});

socket.on('clock-pause-toggled', (data) => {
  if (!data.is_paused) {
    console.log('✅ Reloj reanudado - esperando cuenta regresiva...');
    startCountdown();
  }
});

function startCountdown() {
  console.log('\n⏰ CUENTA REGRESIVA (esperando actualizaciones cada segundo):');
  console.log('   Si no ves actualizaciones, el sistema de sync no está funcionando\n');

  let count = 0;
  const interval = setInterval(() => {
    count++;
    if (count >= 15) {
      console.log('\n⏸️ Deteniendo prueba...');
      socket.emit('pause-clock', { tournamentId });
      clearInterval(interval);
    }
  }, 1000);
}

socket.on('clock-update', (data) => {
  const now = new Date().toLocaleTimeString();
  console.log(`[${now}] ⏰ ${data.time_remaining_seconds}s restantes`);
});

socket.on('level-changed', (data) => {
  console.log(`🎯 ¡CAMBIO DE NIVEL! Nivel ${data.new_level} - ${data.duration_minutes} minutos`);
});

socket.on('disconnect', () => {
  console.log('👋 Desconectado');
});

socket.on('error', (error) => {
  console.error('❌ Error:', error.message);
});
