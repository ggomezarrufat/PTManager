require('dotenv').config();
const { supabase } = require('./src/config/supabase');

async function testClockDirect() {
  try {
    console.log('🔍 Verificando reloj del torneo directamente...');

    // Verificar torneo activo
    const { data: tournaments, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'active')
      .limit(1);

    if (tournamentError) {
      console.error('❌ Error obteniendo torneos:', tournamentError);
      return;
    }

    if (!tournaments || tournaments.length === 0) {
      console.log('❌ No hay torneos activos');
      return;
    }

    const tournament = tournaments[0];
    console.log('✅ Torneo activo encontrado:', {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status
    });

    // Verificar reloj del torneo
    const { data: clock, error: clockError } = await supabase
      .from('tournament_clocks')
      .select('*')
      .eq('tournament_id', tournament.id);

    if (clockError) {
      console.error('❌ Error obteniendo reloj:', clockError);
      return;
    }

    if (!clock || clock.length === 0) {
      console.log('❌ No hay reloj configurado para este torneo');
      console.log('💡 Creando reloj automáticamente...');

      // Crear reloj automáticamente
      const { data: newClock, error: createError } = await supabase
        .from('tournament_clocks')
        .insert({
          tournament_id: tournament.id,
          current_level: 1,
          time_remaining_seconds: 120,
          is_paused: false,
          last_updated: new Date().toISOString()
        })
        .select();

      if (createError) {
        console.error('❌ Error creando reloj:', createError);
        return;
      }

      console.log('✅ Reloj creado exitosamente:', newClock);
    } else {
      console.log('✅ Reloj encontrado:', clock[0]);
    }

  } catch (error) {
    console.error('❌ Error en test:', error);
  }
}

testClockDirect();
