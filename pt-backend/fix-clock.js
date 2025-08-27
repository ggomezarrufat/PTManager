require('dotenv').config();
const { supabase } = require('./src/config/supabase');

async function fixClock() {
  try {
    console.log('🔧 Arreglando reloj del torneo...\n');
    
    // Primero verificar que el reloj existe
    const { data: existingClock, error: selectError } = await supabase
      .from('tournament_clocks')
      .select('*')
      .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a');
    
    if (selectError) {
      console.error('❌ Error verificando reloj:', selectError);
      return;
    }
    
    if (!existingClock || existingClock.length === 0) {
      console.log('❌ No se encontró reloj para este torneo');
      return;
    }
    
    console.log('📊 Reloj encontrado:', existingClock[0]);
    console.log('');
    
    // Pausar el reloj para evitar el bucle infinito
    const { data: updatedClock, error: updateError } = await supabase
      .from('tournament_clocks')
      .update({ 
        is_paused: true,
        last_updated: new Date().toISOString()
      })
      .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a');
    
    if (updateError) {
      console.error('❌ Error pausando reloj:', updateError);
      return;
    }
    
    console.log('✅ Reloj pausado exitosamente');
    console.log('💡 El reloj ahora está pausado y no causará más bucles infinitos.');
    console.log('   Para reactivarlo, usa la API de pausar/reanudar desde el frontend.');
    
  } catch (error) {
    console.error('❌ Error arreglando reloj:', error);
  }
}

fixClock();
