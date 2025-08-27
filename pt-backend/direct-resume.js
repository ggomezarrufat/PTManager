require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

async function directResume() {
  console.log('🔧 Actualización directa del reloj...');

  const now = new Date().toISOString();

  // Update directo - solo campos necesarios
  const { data: upsertData, error: upsertError } = await supabase
    .from('tournament_clocks')
    .update({
      is_paused: false
    })
    .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a')
    .select();

  if (upsertError) {
    console.error('❌ Error en upsert:', upsertError);
  } else {
    console.log('✅ Upsert exitoso');
    if (upsertData && upsertData.length > 0) {
      console.log('Datos:', {
        id: upsertData[0].id,
        pausado: upsertData[0].is_paused,
        tiempo: upsertData[0].time_remaining_seconds,
        ultima_actualizacion: upsertData[0].last_updated
      });
    }
  }

  // Verificar resultado
  const { data: final, error: finalError } = await supabase
    .from('tournament_clocks')
    .select('*')
    .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a')
    .single();

  if (finalError) {
    console.error('❌ Error verificando:', finalError);
  } else {
    console.log('✅ Estado final:', {
      pausado: final.is_paused,
      tiempo: final.time_remaining_seconds,
      ultima_actualizacion: final.last_updated
    });
  }
}

directResume();
