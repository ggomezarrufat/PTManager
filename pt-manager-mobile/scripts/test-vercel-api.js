const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bxzzmpxzubetxgbdakmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_BASE_URL = 'https://copadesafio.vercel.app/api';

async function testVercelApi() {
  console.log('🔍 Probando API de Vercel...');
  
  try {
    // 1. Obtener un token de autenticación
    console.log('\n1️⃣ Obteniendo token de autenticación...');
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ggomezarrufat@gmail.com',
      password: '123456'
    });
    
    if (authError || !session) {
      console.log('❌ Error de autenticación:', authError);
      return;
    }
    
    console.log('✅ Autenticado exitosamente');
    
    // 2. Obtener un torneo existente
    console.log('\n2️⃣ Obteniendo torneos...');
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id, name, status, initial_chips, entry_fee')
      .limit(1);
    
    if (tournamentsError || !tournaments || tournaments.length === 0) {
      console.log('❌ Error obteniendo torneos:', tournamentsError);
      return;
    }
    
    const tournament = tournaments[0];
    console.log('✅ Torneo encontrado:', tournament.name, '(ID:', tournament.id + ')');
    console.log('📊 Datos del torneo:', { 
      initial_chips: tournament.initial_chips, 
      entry_fee: tournament.entry_fee 
    });
    
    // 3. Probar endpoint de jugadores
    console.log('\n3️⃣ Probando endpoint de jugadores...');
    const playersResponse = await fetch(`${API_BASE_URL}/tournaments/${tournament.id}/players`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!playersResponse.ok) {
      const errorData = await playersResponse.json().catch(() => ({}));
      console.log('❌ Error obteniendo jugadores:', errorData);
      return;
    }
    
    const playersData = await playersResponse.json();
    console.log('✅ Jugadores obtenidos:', playersData.players.length);
    
    // 4. Mostrar algunos jugadores
    if (playersData.players.length > 0) {
      console.log('\n📋 Primeros 3 jugadores:');
      playersData.players.slice(0, 3).forEach((player, index) => {
        const userName = player.user?.nickname || player.user?.name || 'Sin nombre';
        console.log(`  ${index + 1}. ${userName} - ${player.current_chips} fichas`);
      });
    }
    
    console.log('\n✅ API de Vercel funcionando correctamente');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testVercelApi();
