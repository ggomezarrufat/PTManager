const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Refresh token es requerido'
      });
    }

    console.log('🔄 Intentando refrescar token...');

    // Refrescar sesión con Supabase
    const { data, error } = await supabase.auth.refreshSession({ 
      refresh_token 
    });

    if (error || !data?.session) {
      console.error('Error refrescando token:', error);
      return res.status(401).json({
        error: 'Refresh Failed',
        message: 'Refresh token inválido o expirado'
      });
    }

    // Obtener perfil para devolver al cliente de forma consistente
    const userId = data.session.user.id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const response = {
      message: 'Token refrescado',
      user: profile,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at
      }
    };

    console.log('✅ Token refrescado exitosamente');

    res.status(200).json(response);

  } catch (error) {
    console.error('Error en refresh:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
