const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
  socket.emit('join-tournament', { tournamentId: 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a', userId: 'test-pause-resume' });
});

socket.on('clock-sync', (data) => {
  console.log('📤 Estado actual:', data.is_paused ? 'PAUSADO' : 'ACTIVO');

  if (!data.is_paused) {
    console.log('⏸️ Pausando reloj primero...');
    socket.emit('pause-clock', { tournamentId: 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a' });

    setTimeout(() => {
      console.log('▶️ Ahora reanudando reloj...');
      socket.emit('resume-clock', { tournamentId: 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a' });

      setTimeout(() => socket.disconnect(), 1000);
    }, 1000);
  } else {
    console.log('▶️ Reanudando reloj...');
    socket.emit('resume-clock', { tournamentId: 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a' });

    setTimeout(() => socket.disconnect(), 1000);
  }
});

socket.on('clock-pause-toggled', (data) => {
  console.log('⏸️ Estado cambió a:', data.is_paused ? 'PAUSADO' : 'ACTIVO');
});

socket.on('disconnect', () => {
  console.log('🔌 Desconectado');
});
