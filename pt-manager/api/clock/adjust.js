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
    const { tournamentId, newSeconds } = req.body;

    if (!tournamentId || typeof newSeconds !== 'number') {
      return res.status(400).json({
        error: 'Tournament ID y newSeconds son requeridos'
      });
    }

    console.log(`🔄 Ajustando tiempo del reloj para torneo: ${tournamentId} a ${newSeconds} segundos`);

    // Actualizar tiempo del reloj
    const { error } = await supabase
      .from('tournament_clocks')
      .update({
        time_remaining_seconds: newSeconds,
        last_updated: new Date().toISOString()
      })
      .eq('tournament_id', tournamentId);

    if (error) {
      console.error('❌ Error ajustando tiempo del reloj:', error);
      return res.status(500).json({
        error: 'Error al ajustar el tiempo del reloj',
        details: error.message
      });
    }

    console.log(`✅ Tiempo del reloj ajustado exitosamente a ${newSeconds} segundos`);

    res.status(200).json({
      success: true,
      message: 'Tiempo del reloj ajustado exitosamente',
      tournament_id: tournamentId,
      new_time_seconds: newSeconds
    });

  } catch (error) {
    console.error('Error en adjust-time:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
