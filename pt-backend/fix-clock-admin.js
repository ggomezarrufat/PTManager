require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function fixClockAdmin() {
  try {
    console.log('🔧 Forzando pausa del reloj usando cliente admin...\n');
    
    // Usar solo los campos que existen en la tabla
    const { error: updateError } = await supabaseAdmin
      .from('tournament_clocks')
      .update({ 
        is_paused: true,
        last_updated: new Date().toISOString()
      })
      .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a');
    
    if (updateError) {
      console.error('❌ Error forzando pausa con admin:', updateError);
      return;
    }
    
    console.log('✅ Reloj pausado exitosamente con admin');
    
    // Verificar el cambio
    const { data: updatedClock, error: selectError } = await supabaseAdmin
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
    console.error('❌ Error forzando pausa con admin:', error);
  }
}

fixClockAdmin();
