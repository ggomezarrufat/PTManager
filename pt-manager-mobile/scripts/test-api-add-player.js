const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bxzzmpxzubetxgbdakmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_BASE_URL = 'https://pt-manager-backend.vercel.app/api';

async function testApiAddPlayer() {
  console.log('🔍 Probando API de agregar jugador...');
  
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
    
    // 3. Obtener jugadores actuales del torneo
    console.log('\n3️⃣ Obteniendo jugadores actuales...');
    const response = await fetch(`${API_BASE_URL}/tournaments/${tournament.id}/players`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Error obteniendo jugadores:', errorData);
      return;
    }
    
    const playersData = await response.json();
    console.log('✅ Jugadores actuales:', playersData.players.length);
    
    // 4. Obtener un usuario que NO esté en el torneo
    console.log('\n4️⃣ Buscando usuario no registrado...');
    const currentPlayerIds = playersData.players.map(p => p.user_id);
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, nickname, email')
      .not('id', 'in', `(${currentPlayerIds.join(',')})`)
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.log('⚠️ Todos los usuarios ya están en el torneo o error:', usersError);
      return;
    }
    
    const user = users[0];
    console.log('✅ Usuario encontrado:', user.nickname || user.name, '(ID:', user.id + ')');
    
    // 5. Agregar el jugador usando la API
    console.log('\n5️⃣ Agregando jugador usando API...');
    const addPlayerResponse = await fetch(`${API_BASE_URL}/tournaments/${tournament.id}/players`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        entry_fee_paid: tournament.entry_fee,
        initial_chips: tournament.initial_chips
      }),
    });
    
    if (!addPlayerResponse.ok) {
      const errorData = await addPlayerResponse.json().catch(() => ({}));
      console.log('❌ Error agregando jugador:', errorData);
      return;
    }
    
    const addPlayerData = await addPlayerResponse.json();
    console.log('✅ Jugador agregado exitosamente:', addPlayerData);
    
    // 6. Verificar que el jugador aparece en la lista
    console.log('\n6️⃣ Verificando lista actualizada...');
    const updatedResponse = await fetch(`${API_BASE_URL}/tournaments/${tournament.id}/players`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!updatedResponse.ok) {
      console.log('❌ Error obteniendo lista actualizada');
      return;
    }
    
    const updatedPlayersData = await updatedResponse.json();
    console.log('✅ Lista actualizada de jugadores:');
    updatedPlayersData.players.forEach((player, index) => {
      const userName = player.user?.nickname || player.user?.name || 'Sin nombre';
      const isNewPlayer = player.id === addPlayerData.player.id ? ' (NUEVO)' : '';
      console.log(`  ${index + 1}. ${userName} (${player.user?.email}) - ${player.current_chips} fichas${isNewPlayer}`);
    });
    
    console.log(`\n📊 Total de jugadores en el torneo: ${updatedPlayersData.players.length}`);
    
    // 7. Verificar que el nuevo jugador está en la lista
    const newPlayerInList = updatedPlayersData.players.find(p => p.id === addPlayerData.player.id);
    if (newPlayerInList) {
      console.log('✅ El nuevo jugador SÍ aparece en la lista');
    } else {
      console.log('❌ El nuevo jugador NO aparece en la lista');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testApiAddPlayer();
