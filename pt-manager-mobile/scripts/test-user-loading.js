const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bxzzmpxzubetxgbdakmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserLoading() {
  console.log('🔍 Probando carga de usuarios desde Supabase...');
  console.log('📡 URL:', supabaseUrl);
  console.log('🔑 Key:', supabaseAnonKey.substring(0, 20) + '...');
  
  try {
    // Probar conexión básica
    console.log('\n1️⃣ Probando conexión básica...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Error de conexión:', testError);
      return;
    }
    
    console.log('✅ Conexión exitosa');
    
    // Probar carga de usuarios
    console.log('\n2️⃣ Cargando usuarios...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, nickname')
      .order('full_name', { ascending: true });
    
    if (usersError) {
      console.log('❌ Error cargando usuarios:', usersError);
      return;
    }
    
    console.log('✅ Usuarios cargados exitosamente');
    console.log('📊 Total de usuarios:', users?.length || 0);
    
    if (users && users.length > 0) {
      console.log('\n📋 Primeros 3 usuarios:');
      users.slice(0, 3).forEach((user, index) => {
        console.log(`${index + 1}. ${user.nickname || user.full_name} (${user.email})`);
      });
    } else {
      console.log('⚠️ No se encontraron usuarios en la tabla profiles');
    }
    
    // Probar autenticación
    console.log('\n3️⃣ Probando autenticación...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Error de autenticación:', authError);
    } else if (session) {
      console.log('✅ Usuario autenticado:', session.user.email);
    } else {
      console.log('⚠️ No hay sesión activa (esto puede ser normal)');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testUserLoading();
