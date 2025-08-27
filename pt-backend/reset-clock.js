require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function resetClock() {
  try {
    console.log('🔄 Reseteando reloj del torneo...\n');
    
    // 1. Eliminar el reloj problemático
    console.log('🗑️ Eliminando reloj existente...');
    const { error: deleteError } = await supabaseAdmin
      .from('tournament_clocks')
      .delete()
      .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a');
    
    if (deleteError) {
      console.error('❌ Error eliminando reloj:', deleteError);
      return;
    }
    
    console.log('✅ Reloj eliminado exitosamente');
    
    // 2. Crear un nuevo reloj pausado
    console.log('\n🆕 Creando nuevo reloj pausado...');
    const { data: newClock, error: insertError } = await supabaseAdmin
      .from('tournament_clocks')
      .insert({
        tournament_id: 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a',
        current_level: 1,
        time_remaining_seconds: 120, // 2 minutos
        is_paused: true,
        last_updated: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error creando nuevo reloj:', insertError);
      return;
    }
    
    console.log('✅ Nuevo reloj creado exitosamente:');
    console.log(JSON.stringify(newClock, null, 2));
    
    console.log('\n💡 El reloj ahora está:');
    console.log('   ✅ Pausado (no causará bucles infinitos)');
    console.log('   ✅ En el nivel 1');
    console.log('   ✅ Con 2 minutos de tiempo');
    console.log('   ✅ Listo para ser activado cuando se necesite');
    
  } catch (error) {
    console.error('❌ Error reseteando reloj:', error);
  }
}

resetClock();
