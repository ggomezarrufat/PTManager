const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bxzzmpxzubetxgbdakmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserLoadingFixed() {
  console.log('🔍 Probando carga de usuarios con columnas corregidas...');
  
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, name, nickname')
      .order('name', { ascending: true });
    
    if (error) {
      console.log('❌ Error:', error);
      return;
    }
    
    console.log('✅ Usuarios cargados exitosamente');
    console.log('📊 Total de usuarios:', users?.length || 0);
    
    if (users && users.length > 0) {
      console.log('\n📋 Primeros 5 usuarios:');
      users.slice(0, 5).forEach((user, index) => {
        console.log(`${index + 1}. ${user.nickname || user.name} (${user.email})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testUserLoadingFixed();
