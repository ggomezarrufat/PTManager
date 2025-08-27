require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function cleanTournamentState() {
  const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';

  console.log('🧹 Limpiando estado completo del torneo para pruebas...');

  try {
    // 1. Eliminar el reloj actual si existe
    console.log('   Eliminando reloj existente...');
    const { error: deleteError } = await supabase
      .from('tournament_clocks')
      .delete()
      .eq('tournament_id', tournamentId);

    if (deleteError) {
      console.log('   ⚠️ No había reloj para eliminar o error:', deleteError.message);
    } else {
      console.log('   ✅ Reloj eliminado');
    }

    // 2. Crear un nuevo reloj limpio
    console.log('   Creando nuevo reloj...');
    const { data: newClock, error: insertError } = await supabase
      .from('tournament_clocks')
      .insert({
        tournament_id: tournamentId,
        current_level: 1,
        time_remaining_seconds: 30, // 30 segundos para pruebas rápidas
        is_paused: true,
        last_updated: new Date().toISOString()
      })
      .select();

    if (insertError) {
      console.error('❌ Error creando nuevo reloj:', insertError);
      return;
    }

    console.log('✅ Estado del torneo limpiado completamente');
    console.log('   Nuevo reloj creado:');
    console.log('   - Nivel:', newClock[0].current_level);
    console.log('   - Tiempo restante:', newClock[0].time_remaining_seconds, 'segundos');
    console.log('   - Pausado:', newClock[0].is_paused);
    console.log('   - Última actualización:', newClock[0].last_updated);
    console.log('');
    console.log('🚀 El torneo está listo para pruebas de cambio automático de nivel');

  } catch (error) {
    console.error('❌ Error limpiando estado del torneo:', error);
  }
}

cleanTournamentState();
