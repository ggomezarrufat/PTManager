require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function forceResume() {
  console.log('🔧 Forzando reanudación del reloj...');

  // Primero obtener el registro actual
  const { data: current, error: getError } = await supabase
    .from('tournament_clocks')
    .select('*')
    .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a')
    .single();

  if (getError) {
    console.error('❌ Error obteniendo reloj:', getError);
    return;
  }

  console.log('Estado actual:', {
    pausado: current.is_paused,
    tiempo: current.time_remaining_seconds
  });

  // Actualizar a activo
  const { error: updateError } = await supabase
    .from('tournament_clocks')
    .update({
      is_paused: false,
      time_remaining_seconds: 120, // Reiniciar a 2 minutos
      last_updated: new Date().toISOString()
    })
    .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a');

  if (updateError) {
    console.error('❌ Error actualizando:', updateError);
  } else {
    console.log('✅ Reloj actualizado exitosamente');
  }

  // Verificar el cambio
  const { data: updated, error: verifyError } = await supabase
    .from('tournament_clocks')
    .select('*')
    .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a')
    .single();

  if (!verifyError) {
    console.log('✅ Verificación final:', {
      pausado: updated.is_paused,
      tiempo: updated.time_remaining_seconds,
      ultima_actualizacion: updated.last_updated
    });
  }
}

forceResume();
