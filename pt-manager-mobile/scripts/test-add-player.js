const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bxzzmpxzubetxgbdakmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAddPlayer() {
  console.log('🔍 Probando agregar jugador a torneo...');
  
  try {
    // 1. Obtener un torneo existente
    console.log('\n1️⃣ Obteniendo torneos...');
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id, name, status')
      .limit(1);
    
    if (tournamentsError) {
      console.log('❌ Error obteniendo torneos:', tournamentsError);
      return;
    }
    
    if (!tournaments || tournaments.length === 0) {
      console.log('⚠️ No hay torneos disponibles');
      return;
    }
    
    const tournament = tournaments[0];
    console.log('✅ Torneo encontrado:', tournament.name, '(ID:', tournament.id + ')');
    
    // 2. Obtener un usuario existente
    console.log('\n2️⃣ Obteniendo usuarios...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, nickname, email')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Error obteniendo usuarios:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️ No hay usuarios disponibles');
      return;
    }
    
    const user = users[0];
    console.log('✅ Usuario encontrado:', user.nickname || user.name, '(ID:', user.id + ')');
    
    // 3. Verificar si el jugador ya está en el torneo
    console.log('\n3️⃣ Verificando si el jugador ya está en el torneo...');
    const { data: existingPlayer, error: checkError } = await supabase
      .from('tournament_players')
      .select('id')
      .eq('tournament_id', tournament.id)
      .eq('user_id', user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.log('❌ Error verificando jugador existente:', checkError);
      return;
    }
    
    if (existingPlayer) {
      console.log('⚠️ El jugador ya está en el torneo');
      return;
    }
    
    console.log('✅ El jugador no está en el torneo, procediendo a agregarlo...');
    
    // 4. Agregar el jugador al torneo
    console.log('\n4️⃣ Agregando jugador al torneo...');
    const { data: newPlayer, error: addError } = await supabase
      .from('tournament_players')
      .insert([{
        tournament_id: tournament.id,
        user_id: user.id,
        chips: 10000, // Fichas iniciales por defecto
        rebuys: 0,
        addons: 0,
        is_eliminated: false
      }])
      .select(`
        *,
        user:profiles(*)
      `)
      .single();
    
    if (addError) {
      console.log('❌ Error agregando jugador:', addError);
      return;
    }
    
    console.log('✅ Jugador agregado exitosamente:', newPlayer);
    
    // 5. Verificar que el jugador aparece en la lista
    console.log('\n5️⃣ Verificando lista de jugadores del torneo...');
    const { data: players, error: playersError } = await supabase
      .from('tournament_players')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('tournament_id', tournament.id)
      .order('created_at', { ascending: true });
    
    if (playersError) {
      console.log('❌ Error obteniendo jugadores:', playersError);
      return;
    }
    
    console.log('✅ Lista de jugadores del torneo:');
    players.forEach((player, index) => {
      const userName = player.user?.nickname || player.user?.name || 'Sin nombre';
      console.log(`  ${index + 1}. ${userName} (${player.user?.email}) - ${player.chips} fichas`);
    });
    
    console.log(`\n📊 Total de jugadores en el torneo: ${players.length}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testAddPlayer();
