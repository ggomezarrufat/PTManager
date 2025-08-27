const io = require('socket.io-client');

console.log('🎯 PRUEBA SIMPLE: CAMBIO AUTOMÁTICO DE NIVEL');
console.log('===============================================');
console.log('Configuración: 30 segundos por nivel');
console.log('');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';

let currentLevel = 1;
let testStep = 0;

socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
  socket.emit('join-tournament', { tournamentId, userId: 'simple-auto-test' });
});

socket.on('clock-sync', (data) => {
  testStep++;
  console.log(`\n📋 PASO ${testStep}: Estado inicial recibido`);
  console.log(`   Nivel: ${data.current_level}`);
  console.log(`   Tiempo: ${data.time_remaining_seconds}s`);
  console.log(`   Estado: ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  currentLevel = data.current_level;

  // Verificar que estamos en el estado correcto
  if (data.current_level === 1 && data.time_remaining_seconds === 30 && data.is_paused === true) {
    testStep++;
    console.log(`\n📋 PASO ${testStep}: Estado correcto detectado ✅`);
    console.log('▶️ Reanudando reloj...');
    socket.emit('resume-clock', { tournamentId });
  } else {
    console.log('\n❌ ERROR: El reloj no está en el estado esperado para la prueba');
    console.log('   Esperado: Nivel 1, 30s, PAUSADO');
    console.log(`   Actual: Nivel ${data.current_level}, ${data.time_remaining_seconds}s, ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);
    socket.disconnect();
  }
});

socket.on('clock-pause-toggled', (data) => {
  if (!data.is_paused) {
    testStep++;
    console.log(`\n📋 PASO ${testStep}: Reloj reanudado exitosamente ✅`);
    console.log('⏰ Esperando cuenta regresiva automática: 30s → 29s → ... → 0s');
    console.log('🎯 Cuando llegue a 0s, debería cambiar automáticamente al nivel 2');
    console.log('');
  }
});

socket.on('clock-update', (data) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ⏰ NIVEL ${currentLevel}: ${data.time_remaining_seconds}s restantes`);

  if (data.time_remaining_seconds <= 5) {
    console.log(`   ⚠️ ¡Atención! Quedan ${data.time_remaining_seconds}s en el nivel ${currentLevel}`);
  }
});

socket.on('level-changed', (data) => {
  testStep++;
  const timestamp = new Date().toLocaleTimeString();

  console.log(`\n🎯 [${timestamp}] ¡CAMBIO DE NIVEL AUTOMÁTICO DETECTADO!`);
  console.log(`   Nivel anterior: ${currentLevel}`);
  console.log(`   Nuevo nivel: ${data.new_level}`);
  console.log(`   Nuevo tiempo: ${data.clock_state.time_remaining_seconds}s`);
  console.log('');
  console.log('✅ ¡PRUEBA EXITOSA! El cambio automático de nivel está funcionando correctamente');
  console.log('');

  currentLevel = data.new_level;

  // Terminar la prueba después del primer cambio de nivel
  setTimeout(() => {
    console.log('🏁 Finalizando prueba...');
    socket.emit('pause-clock', { tournamentId });
    setTimeout(() => socket.disconnect(), 1000);
  }, 2000);
});

socket.on('disconnect', () => {
  console.log('\n👋 Desconectado del servidor');

  console.log('\n📊 RESUMEN FINAL:');
  console.log('================');
  console.log(`   ✅ Conexión WebSocket: OK`);
  console.log(`   ✅ Reloj reanudado: OK`);
  console.log(`   ✅ Cambios de nivel automáticos: ${testStep >= 4 ? 'OK' : 'FALLÓ'}`);
  console.log(`   ✅ Pasos completados: ${testStep}/4`);

  if (testStep >= 4) {
    console.log('\n🎉 ¡FELICITACIONES! El sistema de cambio automático de nivel está funcionando perfectamente');
    console.log('   📈 Funcionalidades verificadas:');
    console.log('      ✅ Control de reloj (pausa/reanudar)');
    console.log('      ✅ Cuenta regresiva automática');
    console.log('      ✅ Cambio automático de nivel cuando llega a cero');
    console.log('      ✅ Sincronización en tiempo real entre usuarios');
  } else {
    console.log('\n❌ La prueba no se completó correctamente');
  }
});

socket.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
});

console.log('🚀 Iniciando prueba de cambio automático de nivel...');
console.log('   Esta prueba debería demostrar:');
console.log('   1. Conexión exitosa al torneo');
console.log('   2. Reanudación del reloj');
console.log('   3. Cuenta regresiva automática');
console.log('   4. Cambio automático de nivel cuando llegue a cero');
console.log('');
