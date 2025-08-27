const io = require('socket.io-client');

console.log('🧪 PRUEBA DE CONEXIÓN WEBSOCKET DESDE NODE.JS');
console.log('===============================================');
console.log('Conectando a: http://localhost:3001');
console.log('');

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  forceNew: true
});

let connected = false;

socket.on('connect', () => {
  console.log('✅ ¡CONEXIÓN EXITOSA!');
  console.log('   Socket ID:', socket.id);
  console.log('   Connected:', socket.connected);
  connected = true;

  // Unirse a un torneo
  const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';
  const userId = 'test-node-client';

  console.log('');
  console.log('🎯 Uniéndose al torneo...');
  console.log(`   Tournament ID: ${tournamentId}`);
  console.log(`   User ID: ${userId}`);

  socket.emit('join-tournament', { tournamentId, userId });
});

socket.on('disconnect', (reason) => {
  console.log('');
  console.log('🔌 DESCONECTADO:', reason);
  connected = false;
});

socket.on('connect_error', (error) => {
  console.log('');
  console.error('❌ ERROR DE CONEXIÓN:', error.message);
  console.error('   Stack:', error.stack);
});

socket.on('clock-sync', (data) => {
  console.log('');
  console.log('🔄 SINCRONIZACIÓN RECIBIDA:');
  console.log(`   Nivel: ${data.current_level}`);
  console.log(`   Tiempo restante: ${data.time_remaining_seconds}s`);
  console.log(`   Estado: ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);
  console.log(`   Última actualización: ${data.last_updated}`);
});

socket.on('clock-update', (data) => {
  console.log('');
  console.log('⏰ ACTUALIZACIÓN DE RELOJ:');
  console.log(`   Tiempo restante: ${data.time_remaining_seconds}s`);
  console.log(`   Estado: ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);
});

socket.on('level-changed', (data) => {
  console.log('');
  console.log('🎯 ¡CAMBIO DE NIVEL!');
  console.log(`   Nuevo nivel: ${data.new_level}`);
  console.log(`   Duración: ${data.duration_minutes} minutos`);
  console.log(`   Tiempo restante: ${data.clock_state.time_remaining_seconds}s`);
});

// Timeout para cerrar la conexión después de 10 segundos
setTimeout(() => {
  console.log('');
  console.log('⏰ Timeout alcanzado, cerrando conexión...');

  if (connected) {
    socket.disconnect();
  }

  setTimeout(() => {
    console.log('');
    console.log('🏁 PRUEBA FINALIZADA');
    process.exit(0);
  }, 1000);
}, 10000);

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

console.log('🚀 Iniciando conexión...');
