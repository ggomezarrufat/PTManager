require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkStructure() {
  const tournamentId = 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a';

  const { data, error } = await supabase
    .from('tournaments')
    .select('blind_structure')
    .eq('id', tournamentId)
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Estructura de blinds:');
    console.log(JSON.stringify(data.blind_structure, null, 2));
    console.log('Número de niveles:', data.blind_structure.length);

    // Mostrar primeros 5 niveles como ejemplo
    for (let i = 0; i < Math.min(5, data.blind_structure.length); i++) {
      console.log(`Nivel ${i + 1}:`, data.blind_structure[i]);
    }
  }
}

checkStructure();
