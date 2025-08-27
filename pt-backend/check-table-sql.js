require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function checkTableStructureSQL() {
  try {
    console.log('🔍 Verificando estructura de la tabla tournament_clocks con SQL...\n');
    
    // Obtener estructura de la tabla usando SQL
    const { data: columns, error: columnsError } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'tournament_clocks' });
    
    if (columnsError) {
      console.log('⚠️ No se pudo usar RPC, intentando consulta directa...');
      
      // Intentar consulta directa
      const { data: sampleData, error: sampleError } = await supabaseAdmin
        .from('tournament_clocks')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('❌ Error obteniendo datos de muestra:', sampleError);
        return;
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log('📊 CAMPOS DISPONIBLES (basado en datos de muestra):');
        const fields = Object.keys(sampleData[0]);
        fields.forEach(field => {
          console.log(`   ${field}: ${typeof sampleData[0][field]}`);
        });
      }
    } else {
      console.log('📊 ESTRUCTURA DE LA TABLA:', columns);
    }
    
    console.log('\n🔍 Intentando actualización simple...');
    
    // Intentar una actualización simple
    const { error: simpleUpdateError } = await supabaseAdmin
      .from('tournament_clocks')
      .update({ is_paused: true })
      .eq('tournament_id', 'f2c4e932-3b85-4d91-a528-4b5e278fbf9a');
    
    if (simpleUpdateError) {
      console.error('❌ Error en actualización simple:', simpleUpdateError);
    } else {
      console.log('✅ Actualización simple exitosa');
    }
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
  }
}

checkTableStructureSQL();
