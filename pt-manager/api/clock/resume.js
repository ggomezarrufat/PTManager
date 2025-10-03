const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { tournamentId } = req.body;

    if (!tournamentId) {
      return res.status(400).json({
        error: 'Tournament ID es requerido'
      });
    }

    console.log(`▶️ Reanudando reloj para torneo: ${tournamentId}`);

    // Actualizar estado del reloj
    const { error } = await supabase
      .from('tournament_clocks')
      .update({
        is_paused: false,
        last_updated: new Date().toISOString()
      })
      .eq('tournament_id', tournamentId);

    if (error) {
      console.error('❌ Error reanudando reloj:', error);
      return res.status(500).json({
        error: 'Error al reanudar el reloj',
        details: error.message
      });
    }

    console.log(`✅ Reloj reanudado exitosamente: ${tournamentId}`);

    res.status(200).json({
      success: true,
      message: 'Reloj reanudado exitosamente',
      tournament_id: tournamentId,
      is_paused: false
    });

  } catch (error) {
    console.error('Error en resume-clock:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
