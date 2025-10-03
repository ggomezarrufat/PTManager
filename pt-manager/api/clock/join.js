const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey
  });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Configurar CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('🔧 Configuración de Supabase:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'N/A'
    });

    const { tournamentId, userId } = req.body;

    if (!tournamentId || !userId) {
      return res.status(400).json({
        error: 'Tournament ID y User ID son requeridos'
      });
    }

    console.log(`👥 Usuario ${userId} intentando unirse al torneo ${tournamentId}`);

    // Verificar que el usuario tiene acceso al torneo
    console.log('🔍 Consultando torneo en la base de datos...');
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, status, name')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) {
      console.error('❌ Error obteniendo torneo:', tournamentError);
      return res.status(404).json({ 
        error: 'Torneo no encontrado',
        details: tournamentError.message 
      });
    }

    if (!tournament) {
      console.error('❌ Torneo no encontrado en la base de datos');
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    console.log('✅ Torneo encontrado:', tournament.name);

    if (tournament.status !== 'active') {
      return res.status(400).json({ error: 'El torneo no está activo' });
    }

    // Obtener estado actual del reloj
    console.log('🔍 Consultando reloj del torneo...');
    const { data: clockData, error: clockError } = await supabase
      .from('tournament_clocks')
      .select('*')
      .eq('tournament_id', tournamentId)
      .single();

    let clockState = null;
    if (clockError) {
      console.error('❌ Error obteniendo reloj:', clockError);
      // No devolver error aquí, simplemente continuar sin reloj
    } else if (clockData) {
      clockState = {
        tournament_id: clockData.tournament_id,
        current_level: clockData.current_level,
        time_remaining_seconds: clockData.time_remaining_seconds,
        is_paused: clockData.is_paused,
        last_updated: clockData.last_updated
      };
      console.log(`✅ Estado del reloj obtenido: ${tournamentId} (${clockState.is_paused ? 'PAUSADO' : 'ACTIVO'})`);
    } else {
      console.log(`⚠️ No se encontró reloj para torneo: ${tournamentId} - continuando sin reloj`);
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
    console.error('❌ Error en join-tournament:', error);
    console.error('Stack trace:', error.stack);
    
    // Determinar el tipo de error
    let errorMessage = 'Error interno del servidor';
    let statusCode = 500;
    
    if (error.message?.includes('fetch')) {
      errorMessage = 'Error de conexión con la base de datos';
      statusCode = 503;
    } else if (error.message?.includes('permission')) {
      errorMessage = 'Error de permisos en la base de datos';
      statusCode = 403;
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
