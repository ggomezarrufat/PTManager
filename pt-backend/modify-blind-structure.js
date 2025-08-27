require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function modifyBlindStructure() {
  const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';

  console.log('🔄 Modificando estructura de blinds para pruebas...');
  console.log('   Cambiando duración de niveles a 30 segundos');

  // Nueva estructura con 30 segundos por nivel
  const newBlindStructure = [
    {
      "level": 1,
      "big_blind": 20,
      "small_blind": 10,
      "duration_minutes": 0.5  // 30 segundos
    },
    {
      "level": 2,
      "big_blind": 30,
      "small_blind": 15,
      "duration_minutes": 0.5  // 30 segundos
    },
    {
      "level": 3,
      "big_blind": 50,
      "small_blind": 25,
      "duration_minutes": 0.5  // 30 segundos
    },
    {
      "level": 4,
      "big_blind": 100,
      "small_blind": 50,
      "duration_minutes": 0.5  // 30 segundos
    },
    {
      "level": 5,
      "big_blind": 158,
      "small_blind": 75,
      "duration_minutes": 0.5  // 30 segundos
    }
  ];

  const { data, error } = await supabase
    .from('tournaments')
    .update({
      blind_structure: newBlindStructure
    })
    .eq('id', tournamentId)
    .select();

  if (error) {
    console.error('❌ Error modificando estructura de blinds:', error);
  } else {
    console.log('✅ Estructura de blinds modificada exitosamente:');
    console.log(JSON.stringify(data[0].blind_structure, null, 2));
  }
}

modifyBlindStructure();
