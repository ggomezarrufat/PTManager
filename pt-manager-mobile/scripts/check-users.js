const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bxzzmpxzubetxgbdakmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  console.log('🔍 Verificando usuarios en la base de datos...');
  
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, name, nickname, email, is_admin')
      .limit(10);
    
    if (error) {
      console.log('❌ Error:', error);
      return;
    }
    
    console.log('✅ Usuarios encontrados:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.nickname || user.name} (${user.email}) - Admin: ${user.is_admin}`);
    });
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkUsers();
