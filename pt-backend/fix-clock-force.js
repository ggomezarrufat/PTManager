require('dotenv').config();
const { supabase } = require('./src/config/supabase');

async function fixClockForce() {
  try {
    console.log('🔧 Forzando pausa del reloj del torneo...\n');
    
    // Forzar la pausa del reloj
    const { error: updateError } = await supabase
      .from('tournament_clocks')
      .update({ 
        is_paused: true,
        last_updated: new Date().toISOString(),
        time_remaining_seconds: 120 // Resetear a 2 minutos
      })
      .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a');
    
    if (updateError) {
      console.error('❌ Error forzando pausa:', updateError);
      return;
    }
    
    console.log('✅ Reloj pausado y reseteado exitosamente');
    
    // Verificar el cambio
    const { data: updatedClock, error: selectError } = await supabase
      .from('tournament_clocks')
      .select('*')
      .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a')
      .single();
    
    if (selectError) {
      console.error('❌ Error verificando cambio:', selectError);
      return;
    }
    
    console.log('📊 Estado actual del reloj:');
    console.log(JSON.stringify(updatedClock, null, 2));
    
  } catch (error) {
    console.error('❌ Error forzando pausa:', error);
  }
}

fixClockForce();
