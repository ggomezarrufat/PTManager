const io = require('socket.io-client');

console.log('🧪 Probando conexión WebSocket al servidor de reloj...');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Conexión WebSocket exitosa');

  // Intentar unirse al torneo
  socket.emit('join-tournament', {
    tournamentId: 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a',
    userId: 'test-user-id'
  });

  console.log('📤 Enviando solicitud de unión al torneo...');
});

socket.on('connect_error', (error) => {
  console.error('❌ Error de conexión WebSocket:', error.message);
});

socket.on('clock-sync', (state) => {
  console.log('🔄 Estado del reloj recibido:', state);
});

socket.on('error', (error) => {
  console.error('❌ Error del servidor:', error);
});

socket.on('disconnect', () => {
  console.log('🔌 Desconectado del servidor');
});

// Cerrar después de 5 segundos
setTimeout(() => {
  socket.disconnect();
  console.log('🛑 Cerrando conexión de prueba');
}, 5000);
