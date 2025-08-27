require('dotenv').config();
const { supabase } = require('./src/config/supabase');

async function debugClock() {
  try {
    console.log('🔍 Investigando estado del reloj del torneo...\n');
    
    // 1. Obtener datos del reloj
    const { data: clockData, error: clockError } = await supabase
      .from('tournament_clocks')
      .select('*')
      .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a')
      .single();
    
    if (clockError) {
      console.error('❌ Error obteniendo reloj:', clockError);
      return;
    }
    
    console.log('📊 DATOS DEL RELOJ:');
    console.log(JSON.stringify(clockData, null, 2));
    console.log('');
    
    // 2. Calcular tiempo transcurrido
    const now = new Date();
    const lastUpdated = new Date(clockData.last_updated);
    const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);
    const timeRemaining = clockData.time_remaining_seconds - elapsedSeconds;
    
    console.log('⏰ ANÁLISIS DE TIEMPO:');
    console.log(`   Hora actual: ${now.toISOString()}`);
    console.log(`   Última actualización: ${lastUpdated.toISOString()}`);
    console.log(`   Tiempo transcurrido: ${elapsedSeconds} segundos (${Math.floor(elapsedSeconds/60)} min ${elapsedSeconds%60} seg)`);
    console.log(`   Tiempo restante en BD: ${clockData.time_remaining_seconds} segundos`);
    console.log(`   Tiempo restante calculado: ${timeRemaining} segundos`);
    console.log(`   ¿Se agotó el tiempo? ${timeRemaining <= 0 ? 'SÍ ❌' : 'NO ✅'}`);
    console.log('');
    
    // 3. Obtener estructura de blinds
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('blind_structure, status')
      .eq('id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a')
      .single();
    
    if (tournamentError) {
      console.error('❌ Error obteniendo torneo:', tournamentError);
      return;
    }
    
    console.log('🎯 DATOS DEL TORNEO:');
    console.log(`   Status: ${tournament.status}`);
    console.log(`   Estructura de blinds: ${JSON.stringify(tournament.blind_structure, null, 2)}`);
    console.log('');
    
    // 4. Recomendaciones
    console.log('💡 RECOMENDACIONES:');
    if (timeRemaining <= 0) {
      console.log('   ❌ El reloj está desincronizado. Necesitas:');
      console.log('       1. Reiniciar el reloj del torneo');
      console.log('       2. O actualizar last_updated a la hora actual');
      console.log('       3. O pausar el reloj hasta que se necesite');
    } else {
      console.log('   ✅ El reloj está sincronizado correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

debugClock();
