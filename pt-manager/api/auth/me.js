const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de autorización requerido'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    console.log('🔍 Verificando token de usuario...');

    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Error verificando token:', error);
      return res.status(401).json({
        error: 'Token inválido o expirado'
      });
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError);
      return res.status(500).json({
        error: 'Error al obtener perfil de usuario'
      });
    }

    const response = {
      message: 'Usuario obtenido exitosamente',
      user: profile
    };

    console.log(`✅ Usuario obtenido: ${profile.email}`);

    res.status(200).json(response);

  } catch (error) {
    console.error('Error en me:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
