require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🧪 Probando conexión a Supabase...');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada');
console.log('SUPABASE_ANON_KEY:', supabaseKey ? '✅ Configurada' : '❌ No configurada');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔌 Intentando conectar a Supabase...');

    // Probar una consulta simple
    const { data, error } = await supabase
      .from('tournaments')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Error de conexión:', error);
      return;
    }

    console.log('✅ Conexión exitosa a Supabase');
    console.log('📊 Respuesta:', data);

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

testConnection();
