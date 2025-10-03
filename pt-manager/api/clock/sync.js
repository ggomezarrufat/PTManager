const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Crear cliente con permisos de administrador
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('🔄 [SYNC] Iniciando sincronización de relojes...');

    // Obtener todos los torneos activos
    const { data: activeTournaments, error } = await supabaseAdmin
      .from('tournaments')
      .select('id, status')
      .eq('status', 'active');

    if (error) {
      console.error('❌ Error obteniendo torneos activos:', error);
      return res.status(500).json({
        error: 'Error obteniendo torneos activos',
        details: error.message
      });
    }

    if (!activeTournaments || activeTournaments.length === 0) {
      console.log('ℹ️ [SYNC] No hay torneos activos para sincronizar');
      return res.status(200).json({
        success: true,
        message: 'No hay torneos activos',
        synced_tournaments: 0
      });
    }

    console.log(`🔄 [SYNC] Sincronizando ${activeTournaments.length} torneo(s) activo(s)`);

    const results = [];

    for (const tournament of activeTournaments) {
      try {
        const syncResult = await syncTournamentClock(tournament.id);
        results.push(syncResult);
      } catch (tournamentError) {
        console.error(`❌ Error sincronizando torneo ${tournament.id}:`, tournamentError.message || tournamentError);
        results.push({
          tournament_id: tournament.id,
          success: false,
          error: tournamentError.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;

    console.log(`✅ [SYNC] Sincronización completada: ${successful}/${results.length} exitosas`);

    res.status(200).json({
      success: true,
      message: `Sincronización completada: ${successful}/${results.length} exitosas`,
      synced_tournaments: successful,
      total_tournaments: results.length,
      results: results
    });

  } catch (error) {
    console.error('❌ Error en sync:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}

async function syncTournamentClock(tournamentId) {
  console.log(`🔄 [SYNC-TOUR] Sincronizando reloj de torneo: ${tournamentId}`);

  try {
    // Obtener estado actual del reloj
    console.log(`🔍 [SYNC-TOUR] Consultando BD para torneo: ${tournamentId}`);
    const { data: clockData, error } = await supabaseAdmin
      .from('tournament_clocks')
      .select('*')
      .eq('tournament_id', tournamentId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error(`❌ Error obteniendo reloj del torneo ${tournamentId}:`, error);
      }
      return { tournament_id: tournamentId, success: false, error: error.message };
    }

    if (!clockData) {
      console.log(`No hay reloj configurado para el torneo ${tournamentId}`);
      return { tournament_id: tournamentId, success: false, message: 'No hay reloj configurado' };
    }

    // Si está pausado, no hacer nada
    if (clockData.is_paused) {
      console.log(`⏸️ [SYNC-TOUR] Reloj pausado para ${tournamentId}, saltando sincronización`);
      return {
        tournament_id: tournamentId,
        success: true,
        message: 'Reloj pausado',
        is_paused: true
      };
    }

    console.log(`▶️ [SYNC-TOUR] Reloj activo para ${tournamentId}, procesando actualización de tiempo`);

    // Calcular tiempo restante
    const now = new Date();
    let lastUpdated;

    try {
      lastUpdated = new Date(clockData.last_updated + (clockData.last_updated.includes('Z') ? '' : 'Z'));
    } catch (error) {
      console.log(`⚠️ [SYNC-TOUR] Error parseando fecha para ${tournamentId}, usando fecha actual`);
      lastUpdated = now;
    }

    if (isNaN(lastUpdated.getTime())) {
      console.log(`⚠️ [SYNC-TOUR] Fecha inválida para ${tournamentId}, reiniciando`);
      lastUpdated = now;
    }

    const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);
    console.log(`⏱️ [SYNC-TOUR] ${tournamentId}: tiempo original=${clockData.time_remaining_seconds}s, transcurrido=${elapsedSeconds}s`);

    // Si han pasado más de 10 minutos, reiniciar el contador
    if (elapsedSeconds > 600) {
      console.warn(`⚠️ Tiempo transcurrido muy grande para ${tournamentId}: ${elapsedSeconds}s, reiniciando`);
      await supabaseAdmin
        .from('tournament_clocks')
        .update({
          last_updated: now.toISOString(),
          time_remaining_seconds: clockData.time_remaining_seconds
        })
        .eq('tournament_id', tournamentId);

      return {
        tournament_id: tournamentId,
        success: true,
        message: 'Tiempo reiniciado por inactividad prolongada',
        reset: true
      };
    }

    // Calcular tiempo restante
    let timeRemaining = Math.max(0, clockData.time_remaining_seconds - elapsedSeconds);
    console.log(`⏰ [SYNC-TOUR] ${tournamentId}: tiempo restante=${timeRemaining}s`);

    // Si el tiempo se agotó, pasar al siguiente nivel
    if (timeRemaining <= 0) {
      console.log(`⏰ ${tournamentId}: Tiempo agotado! Pasando al siguiente nivel...`);
      console.log(`   Nivel actual en BD: ${clockData.current_level}, tiempo restante en BD: ${clockData.time_remaining_seconds}s`);

      if (clockData.time_remaining_seconds <= 0) {
        await advanceToNextLevel(tournamentId, clockData);
        return {
          tournament_id: tournamentId,
          success: true,
          message: 'Avanzado al siguiente nivel',
          level_changed: true
        };
      } else {
        console.log(`⚠️ ${tournamentId}: Tiempo restante cambió durante el procesamiento (${clockData.time_remaining_seconds}s), omitiendo cambio de nivel`);
      }
    }

    // Actualizar estado del reloj
    const { error: updateError } = await supabaseAdmin
      .from('tournament_clocks')
      .update({
        time_remaining_seconds: timeRemaining,
        last_updated: now.toISOString()
      })
      .eq('tournament_id', tournamentId);

    if (updateError) {
      console.error('❌ Error actualizando reloj en BD:', updateError);
      return { tournament_id: tournamentId, success: false, error: updateError.message };
    }

    console.log(`✅ [SYNC-TOUR] Reloj actualizado: ${timeRemaining}s (nivel ${clockData.current_level})`);

    return {
      tournament_id: tournamentId,
      success: true,
      message: 'Reloj sincronizado',
      time_remaining: timeRemaining,
      current_level: clockData.current_level
    };

  } catch (error) {
    console.error(`❌ Error sincronizando reloj del torneo ${tournamentId}:`, error.message);
    return { tournament_id: tournamentId, success: false, error: error.message };
  }
}

async function advanceToNextLevel(tournamentId, currentClock) {
  try {
    console.log(`🔄 Avanzando al siguiente nivel para torneo ${tournamentId}`);
    console.log(`📊 Nivel actual: ${currentClock.current_level}, Tiempo restante: ${currentClock.time_remaining_seconds}s`);

    // Verificar que necesite cambiar de nivel
    if (currentClock.time_remaining_seconds > 0) {
      console.log(`⚠️ No se necesita cambio de nivel - tiempo restante: ${currentClock.time_remaining_seconds}s`);
      return;
    }

    if (currentClock.is_paused) {
      console.log(`⚠️ No se puede cambiar de nivel - reloj está pausado`);
      return;
    }

    // Obtener estructura de blinds
    const { data: tournament, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .select('blind_structure')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament.blind_structure) {
      console.error('❌ Error obteniendo estructura de blinds:', tournamentError);
      return;
    }

    const blindStructure = tournament.blind_structure;
    console.log(`📋 Estructura de blinds encontrada: ${blindStructure.length} niveles`);

    const nextLevel = currentClock.current_level + 1;
    console.log(`🎯 Calculando siguiente nivel: ${nextLevel} (actual: ${currentClock.current_level})`);

    if (nextLevel <= blindStructure.length) {
      const nextLevelConfig = blindStructure[nextLevel - 1];
      console.log(`🔍 Configuración del nivel ${nextLevel}:`, nextLevelConfig);

      const newTimeSeconds = Math.round(nextLevelConfig.duration_minutes * 60);
      console.log(`⏰ Nuevo tiempo calculado: ${newTimeSeconds}s (${nextLevelConfig.duration_minutes} minutos)`);

      const now = new Date();

      // Actualizar en base de datos
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('tournament_clocks')
        .update({
          current_level: nextLevel,
          time_remaining_seconds: newTimeSeconds,
          is_paused: false,
          last_updated: now.toISOString()
        })
        .eq('tournament_id', tournamentId)
        .select();

      if (updateError) {
        console.error('❌ Error actualizando reloj en BD:', updateError);
        return;
      }

      console.log(`✅ Reloj actualizado en BD correctamente`);
      console.log(`   Datos actualizados:`, updateData[0]);
      console.log(`✅ Torneo ${tournamentId} avanzó al nivel ${nextLevel} exitosamente`);

    } else {
      // Torneo terminado
      console.log(`🏁 Torneo ${tournamentId} terminó - no hay más niveles (${nextLevel} > ${blindStructure.length})`);
      await endTournament(tournamentId);
    }

  } catch (error) {
    console.error(`❌ Error avanzando nivel del torneo ${tournamentId}:`, error);
  }
}

async function endTournament(tournamentId) {
  try {
    console.log(`🏁 Finalizando torneo ${tournamentId}`);

    // Marcar torneo como terminado
    const { error: tournamentError } = await supabase
      .from('tournaments')
      .update({ status: 'finished', end_time: new Date().toISOString() })
      .eq('id', tournamentId);

    if (tournamentError) {
      console.error('Error finalizando torneo:', tournamentError);
      return;
    }

    console.log(`✅ Torneo ${tournamentId} finalizado exitosamente`);

  } catch (error) {
    console.error(`Error finalizando torneo ${tournamentId}:`, error);
  }
}
