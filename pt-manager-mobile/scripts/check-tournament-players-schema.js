const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bxzzmpxzubetxgbdakmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTournamentPlayersSchema() {
  console.log('🔍 Verificando esquema de la tabla tournament_players...');
  
  try {
    // Obtener un registro de tournament_players
    const { data: players, error } = await supabase
      .from('tournament_players')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error);
      return;
    }
    
    if (players && players.length > 0) {
      console.log('✅ Registro encontrado. Columnas disponibles:');
      const player = players[0];
      Object.keys(player).forEach(key => {
        console.log(`  - ${key}: ${typeof player[key]} = ${player[key]}`);
      });
    } else {
      console.log('⚠️ No se encontraron registros en tournament_players');
    }
    
    // Probar la consulta con join
    console.log('\n🔍 Probando consulta con join...');
    const { data: playersWithUsers, error: joinError } = await supabase
      .from('tournament_players')
      .select(`
        *,
        profiles(*)
      `)
      .limit(1);
    
    if (joinError) {
      console.log('❌ Error en join:', joinError);
    } else {
      console.log('✅ Join exitoso');
      if (playersWithUsers && playersWithUsers.length > 0) {
        console.log('📋 Datos del join:', JSON.stringify(playersWithUsers[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkTournamentPlayersSchema();
