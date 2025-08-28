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
    const { tournamentId } = req.query;

    if (!tournamentId) {
      return res.status(400).json({
        error: 'Tournament ID es requerido'
      });
    }

    console.log(`🔍 Consultando estado del reloj para torneo: ${tournamentId}`);

    // Obtener estado actual del reloj
    const { data: clockData, error: clockError } = await supabase
      .from('tournament_clocks')
      .select('*')
      .eq('tournament_id', tournamentId)
      .single();

    if (clockError) {
      if (clockError.code === 'PGRST116') {
        // No encontrado
        return res.status(404).json({
          error: 'Reloj no encontrado para este torneo'
        });
      }
      console.error('Error obteniendo reloj:', clockError);
      return res.status(500).json({
        error: 'Error obteniendo estado del reloj',
        details: clockError.message
      });
    }

    if (!clockData) {
      return res.status(404).json({
        error: 'No hay reloj configurado para este torneo'
      });
    }

    const clockState = {
      tournament_id: clockData.tournament_id,
      current_level: clockData.current_level,
      time_remaining_seconds: clockData.time_remaining_seconds,
      is_paused: clockData.is_paused,
      last_updated: clockData.last_updated
    };

    console.log(`📤 Estado del reloj enviado: ${clockState.time_remaining_seconds}s (nivel ${clockState.current_level})`);

    res.status(200).json({
      success: true,
      clockState: clockState
    });

  } catch (error) {
    console.error('Error obteniendo estado del reloj:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
