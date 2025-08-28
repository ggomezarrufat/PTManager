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
    const { tournamentId, userId } = req.body;

    if (!tournamentId || !userId) {
      return res.status(400).json({
        error: 'Tournament ID y User ID son requeridos'
      });
    }

    console.log(`👥 Usuario ${userId} intentando unirse al torneo ${tournamentId}`);

    // Verificar que el usuario tiene acceso al torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, status, name')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      console.error('Error obteniendo torneo:', tournamentError);
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    if (tournament.status !== 'active') {
      return res.status(400).json({ error: 'El torneo no está activo' });
    }

    // Obtener estado actual del reloj
    const { data: clockData, error: clockError } = await supabase
      .from('tournament_clocks')
      .select('*')
      .eq('tournament_id', tournamentId)
      .single();

    let clockState = null;
    if (!clockError && clockData) {
      clockState = {
        tournament_id: clockData.tournament_id,
        current_level: clockData.current_level,
        time_remaining_seconds: clockData.time_remaining_seconds,
        is_paused: clockData.is_paused,
        last_updated: clockData.last_updated
      };
      console.log(`✅ Estado del reloj obtenido: ${tournamentId} (${clockState.is_paused ? 'PAUSADO' : 'ACTIVO'})`);
    } else {
      console.log(`❌ No se pudo encontrar reloj para torneo: ${tournamentId}`);
    }

    console.log(`✅ Usuario ${userId} se unió exitosamente al torneo ${tournament.name}`);

    res.status(200).json({
      success: true,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status
      },
      clockState: clockState
    });

  } catch (error) {
    console.error('Error en join-tournament:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
