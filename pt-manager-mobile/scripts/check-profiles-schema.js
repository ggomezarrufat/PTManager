const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bxzzmpxzubetxgbdakmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfilesSchema() {
  console.log('🔍 Verificando esquema de la tabla profiles...');
  
  try {
    // Intentar cargar un usuario con todas las columnas posibles
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error);
      return;
    }
    
    if (users && users.length > 0) {
      console.log('✅ Usuario encontrado. Columnas disponibles:');
      const user = users[0];
      Object.keys(user).forEach(key => {
        console.log(`  - ${key}: ${typeof user[key]} = ${user[key]}`);
      });
    } else {
      console.log('⚠️ No se encontraron usuarios en la tabla');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkProfilesSchema();
