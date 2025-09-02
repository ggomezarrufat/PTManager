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
    console.log('🚪 Procesando logout...');

    // Con Supabase, el logout se maneja principalmente en el cliente
    // pero podemos limpiar cualquier sesión del servidor si es necesario
    
    const response = {
      message: 'Logout exitoso'
    };

    console.log('✅ Logout procesado exitosamente');

    res.status(200).json(response);

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
