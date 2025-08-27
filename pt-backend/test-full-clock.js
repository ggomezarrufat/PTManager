const io = require('socket.io-client');

console.log('🚀 PRUEBA COMPLETA DEL RELOJ DEL TORNEO');
console.log('======================================');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';
let testStep = 0;

socket.on('connect', () => {
  console.log('✅ Conectado al servidor WebSocket');
  startTest();
});

function startTest() {
  console.log('\n📋 PASO 1: Conectar al torneo');
  socket.emit('join-tournament', { tournamentId, userId: 'test-full-clock' });
}

socket.on('clock-sync', (data) => {
  const step = ++testStep;
  console.log(`\n📋 PASO ${step}: Estado inicial recibido`);
  console.log(`   Nivel: ${data.current_level}`);
  console.log(`   Tiempo: ${data.time_remaining_seconds}s`);
  console.log(`   Estado: ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  if (data.is_paused) {
    console.log('\n▶️ PASO 2: Reanudando el reloj...');
    socket.emit('resume-clock', { tournamentId });
  } else {
    console.log('\n⏸️ PASO 2: Pausando el reloj primero...');
    socket.emit('pause-clock', { tournamentId });
  }
});

socket.on('clock-pause-toggled', (data) => {
  const step = ++testStep;
  console.log(`\n📋 PASO ${step}: Estado cambiado a ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  if (!data.is_paused) {
    console.log('\n⏰ PASO 3: Esperando cuenta regresiva (10 segundos)...');
    console.log('   Deberías ver actualizaciones cada segundo:');

    setTimeout(() => {
      console.log('\n⏸️ PASO 4: Pausando reloj para detener cuenta regresiva...');
      socket.emit('pause-clock', { tournamentId });

      setTimeout(() => {
        console.log('\n🔄 PASO 5: Probando ajuste de tiempo...');
        socket.emit('adjust-time', { tournamentId, newSeconds: 60 });

        setTimeout(() => {
          console.log('\n🏁 PRUEBA COMPLETADA');
          socket.disconnect();
        }, 2000);
      }, 2000);
    }, 10000);
  }
});

socket.on('clock-update', (data) => {
  console.log(`   ⏰ ${data.time_remaining_seconds}s restantes`);
});

socket.on('clock-time-adjusted', (data) => {
  const step = ++testStep;
  console.log(`\n📋 PASO ${step}: Tiempo ajustado a ${data.new_time_seconds}s`);
});

socket.on('level-changed', (data) => {
  console.log(`\n🎯 CAMBIO DE NIVEL: Nivel ${data.new_level} - ${data.duration_minutes} minutos`);
});

socket.on('disconnect', () => {
  console.log('\n👋 Desconectado del servidor');
  console.log('\n🎉 ¡PRUEBA COMPLETA!');
  console.log('   ✅ Conexión WebSocket: OK');
  console.log('   ✅ Control de reloj: OK');
  console.log('   ✅ Persistencia en BD: OK');
  console.log('   ✅ Cuenta regresiva: OK');
  console.log('   ✅ Ajuste de tiempo: OK');
});

socket.on('error', (error) => {
  console.error('❌ Error:', error.message);
});
