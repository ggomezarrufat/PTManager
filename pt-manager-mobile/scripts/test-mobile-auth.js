const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bxzzmpxzubetxgbdakmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMobileAuth() {
  console.log('📱 Probando autenticación para aplicación móvil...');
  console.log('📧 Email: ggomezarrufat@gmail.com');
  console.log('🔑 Contraseña: Galata2017');
  console.log('');

  try {
    // Probar login con manejo de errores mejorado
    console.log('🔐 Intentando login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ggomezarrufat@gmail.com',
      password: 'Galata2017'
    });

    if (authError) {
      console.log('❌ Error de autenticación:', authError.message);
      
      // Analizar el tipo de error
      if (authError.message.includes('Invalid login credentials')) {
        console.log('💡 Solución: Email o contraseña incorrectos');
        console.log('   - Verifica que el email esté correcto');
        console.log('   - Verifica que la contraseña sea exactamente: Galata2017');
      } else if (authError.message.includes('Email not confirmed')) {
        console.log('💡 Solución: El email no ha sido confirmado');
        console.log('   - Revisa tu bandeja de entrada');
        console.log('   - Haz clic en el enlace de confirmación');
      } else if (authError.message.includes('fetch failed') || authError.message.includes('Network request failed')) {
        console.log('💡 Solución: Error de conexión');
        console.log('   - Verifica tu conexión a internet');
        console.log('   - Intenta nuevamente en unos minutos');
      } else {
        console.log('💡 Error desconocido:', authError.message);
      }
      
      return;
    }

    console.log('✅ Login exitoso!');
    console.log('👤 Usuario autenticado:', authData.user.email);
    console.log('🆔 ID del usuario:', authData.user.id);
    
    // Probar obtener perfil
    console.log('');
    console.log('📋 Obteniendo perfil del usuario...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.log('⚠️ Error obteniendo perfil:', profileError.message);
      console.log('💡 El usuario existe pero no tiene perfil completo');
    } else {
      console.log('✅ Perfil obtenido exitosamente');
      console.log('📋 Datos del perfil:', {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        nickname: profile.nickname,
        is_admin: profile.is_admin
      });
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
    console.log('💡 Verifica tu conexión a internet e intenta nuevamente');
  }
}

testMobileAuth();
