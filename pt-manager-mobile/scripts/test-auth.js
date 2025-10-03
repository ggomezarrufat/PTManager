const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bxzzmpxzubetxgbdakmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔐 Probando autenticación con Supabase...');
  console.log('📧 Email: ggomezarrufat@gmail.com');
  console.log('🔑 Contraseña: Galata2017');
  console.log('');

  try {
    // Probar conexión básica
    console.log('1️⃣ Probando conexión con Supabase...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Error de conexión:', healthError.message);
      return;
    }
    console.log('✅ Conexión con Supabase exitosa');

    // Probar login
    console.log('');
    console.log('2️⃣ Probando login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ggomezarrufat@gmail.com',
      password: 'Galata2017'
    });

    if (authError) {
      console.log('❌ Error de autenticación:', authError.message);
      
      // Verificar si el usuario existe
      console.log('');
      console.log('3️⃣ Verificando si el usuario existe...');
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'ggomezarrufat@gmail.com')
        .single();

      if (userError) {
        console.log('❌ Usuario no encontrado en la base de datos');
        console.log('💡 El usuario necesita registrarse primero');
      } else {
        console.log('✅ Usuario encontrado en la base de datos');
        console.log('📋 Datos del usuario:', userData);
      }
    } else {
      console.log('✅ Login exitoso');
      console.log('👤 Usuario autenticado:', authData.user.email);
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

testAuth();
