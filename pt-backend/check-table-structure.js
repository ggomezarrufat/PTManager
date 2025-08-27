require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estructura de la tabla tournament_clocks...\n');
    
    // Obtener información de la tabla
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'tournament_clocks')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (tableError) {
      console.error('❌ Error obteniendo estructura:', tableError);
      return;
    }
    
    console.log('📊 ESTRUCTURA DE LA TABLA tournament_clocks:');
    tableInfo.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`);
    });
    
    console.log('\n🔍 Verificando triggers...');
    
    // Verificar triggers
    const { data: triggers, error: triggerError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_statement')
      .eq('event_object_table', 'tournament_clocks')
      .eq('trigger_schema', 'public');
    
    if (triggerError) {
      console.error('❌ Error obteniendo triggers:', triggerError);
      return;
    }
    
    if (triggers && triggers.length > 0) {
      console.log('📋 TRIGGERS ACTIVOS:');
      triggers.forEach(trigger => {
        console.log(`   ${trigger.trigger_name}: ${trigger.event_manipulation} -> ${trigger.action_statement}`);
      });
    } else {
      console.log('   No hay triggers activos');
    }
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
  }
}

checkTableStructure();
