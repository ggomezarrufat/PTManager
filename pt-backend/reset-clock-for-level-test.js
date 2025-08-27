require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function resetClockForLevelTest() {
  const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';

  console.log('🔄 Preparando reloj para prueba de cambio automático de nivel...');

  // Resetear a nivel 1 con 30 segundos (0.5 minutos)
  const { data, error } = await supabase
    .from('tournament_clocks')
    .update({
      current_level: 1,
      time_remaining_seconds: 30, // 30 segundos para nivel 1
      is_paused: true, // Iniciar pausado para control manual
      last_updated: new Date().toISOString()
    })
    .eq('tournament_id', tournamentId)
    .select();

  if (error) {
    console.error('❌ Error reseteando reloj:', error);
  } else {
    console.log('✅ Reloj preparado para prueba:');
    console.log('   Nivel:', data[0].current_level);
    console.log('   Tiempo restante:', data[0].time_remaining_seconds, 'segundos');
    console.log('   Pausado:', data[0].is_paused);
    console.log('   Última actualización:', data[0].last_updated);
    console.log('');
    console.log('🚀 El reloj está listo para la prueba de cambio automático.');
    console.log('   30s → 29s → ... → 0s → Cambio automático al nivel 2 (30s) → ...');
  }
}

resetClockForLevelTest();
