const io = require('socket.io-client');

console.log('🔍 PRUEBA: WebSocket → BD Update');

const socket = io('http://localhost:3001');
const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';

socket.on('connect', () => {
  console.log('✅ WebSocket conectado');
  socket.emit('join-tournament', { tournamentId, userId: 'db-test' });
});

socket.on('clock-sync', (data) => {
  console.log(`📤 Estado inicial: ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  if (data.is_paused) {
    console.log('▶️ Enviando resume-clock...');
    socket.emit('resume-clock', { tournamentId });
  } else {
    console.log('✅ Reloj ya activo');
    socket.disconnect();
  }
});

socket.on('clock-pause-toggled', (data) => {
  console.log(`⏸️ WebSocket reporta: ${data.is_paused ? 'PAUSADO' : 'ACTIVO'}`);

  // Verificar BD inmediatamente
  setTimeout(() => {
    console.log('\n🔍 Verificando BD...');
    const { exec } = require('child_process');
    exec('node -e "require(\'dotenv\').config(); const { createClient } = require(\'@supabase/supabase-js\'); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY); supabase.from(\'tournament_clocks\').select(\'is_paused\').eq(\'tournament_id\', \'f2c4e932-3b85-4d91-a528-4b5e278fbf9a\').single().then(({data, error}) => { if(error) console.error(\'❌ BD Error:\', error.message); else console.log(\'📊 BD Estado:\', data.is_paused ? \'PAUSADO\' : \'ACTIVO\'); process.exit(0); });"', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error ejecutando verificación:', error);
      } else {
        console.log(stdout);
      }
      socket.disconnect();
    });
  }, 500);
});

socket.on('error', (error) => {
  console.error('❌ WebSocket Error:', error.message);
});
