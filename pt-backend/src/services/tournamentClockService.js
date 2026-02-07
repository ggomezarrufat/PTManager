const { supabase, supabaseAdmin } = require('../config/supabase');
const { parseUtcTimestamp } = require('../utils/dateUtils');

class TournamentClockService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.hasActiveTournaments = false;
    this.checkIntervalId = null;
  }

  /**
   * Inicializa el servicio de actualización automática del reloj
   */
  init() {
    if (this.isRunning) {
      console.log('⚠️ Servicio de reloj ya está ejecutándose');
      return;
    }

    console.log('⏰ Iniciando servicio de actualización automática del reloj...');

    // Verificar si hay torneos activos al inicio
    this.checkForActiveTournaments();

    // Verificar cada 60 segundos si hay torneos activos
    this.checkIntervalId = setInterval(() => {
      this.checkForActiveTournaments();
    }, 60000); // 60 segundos

    this.isRunning = true;
    console.log('✅ Servicio de actualización automática del reloj iniciado - verificaciones cada 60 segundos');
  }

  /**
   * Detiene el servicio de actualización automática
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    this.isRunning = false;
    this.hasActiveTournaments = false;
    console.log('🛑 Servicio de actualización automática del reloj detenido');
  }

  /**
   * Verifica si hay torneos activos y inicia/detiene el polling según sea necesario
   */
  async checkForActiveTournaments() {
    try {
      const { data: activeTournaments, error } = await supabase
        .from('tournaments')
        .select('id')
        .eq('status', 'active')
        .limit(1);

      if (error) {
        console.error('❌ Error verificando torneos activos:', error);
        return;
      }

      const hasActive = activeTournaments && activeTournaments.length > 0;

      if (hasActive && !this.hasActiveTournaments) {
        // Hay torneos activos y no estábamos procesando - iniciar polling
        console.log('🎯 [AUTO-UPDATE] Detectados torneos activos - iniciando actualización automática');
        this.startClockPolling();
        this.hasActiveTournaments = true;
      } else if (!hasActive && this.hasActiveTournaments) {
        // No hay torneos activos y estábamos procesando - detener polling
        console.log('💤 [AUTO-UPDATE] No hay torneos activos - deteniendo actualización automática');
        this.stopClockPolling();
        this.hasActiveTournaments = false;
      }
    } catch (error) {
      console.error('❌ Error en verificación de torneos activos:', error.message);
    }
  }

  /**
   * Inicia el polling de actualización de relojes
   */
  startClockPolling() {
    if (this.intervalId) {
      return; // Ya está ejecutándose
    }

    this.intervalId = setInterval(() => {
      this.updateTournamentClocks();
    }, 5000); // 5 segundos

    console.log('🔄 [AUTO-UPDATE] Polling de relojes iniciado - actualizaciones cada 5 segundos');
  }

  /**
   * Detiene el polling de actualización de relojes
   */
  stopClockPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ [AUTO-UPDATE] Polling de relojes detenido');
    }
  }

  /**
   * Actualiza todos los relojes de torneos activos
   */
  async updateTournamentClocks() {
    try {
      // Obtener todos los torneos activos
      const { data: activeTournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          status,
          blind_structure
        `)
        .eq('status', 'active');

      if (tournamentsError) {
        console.error('❌ Error obteniendo torneos activos:', tournamentsError);
        return;
      }

      if (!activeTournaments || activeTournaments.length === 0) {
        // Si no hay torneos activos, detener el polling
        console.log('📭 [AUTO-UPDATE] No hay torneos activos - deteniendo polling');
        this.stopClockPolling();
        this.hasActiveTournaments = false;
        return;
      }

      let updatedCount = 0;

      for (const tournament of activeTournaments) {
        const clockUpdated = await this.updateSingleTournamentClock(tournament);
        if (clockUpdated) {
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        console.log(`✅ [AUTO-UPDATE] ${updatedCount} reloj(es) actualizado(s) automáticamente`);
      }

    } catch (error) {
      console.error('❌ Error en actualización automática de relojes:', error.message);
    }
  }

  /**
   * Actualiza el reloj de un torneo individual
   */
  async updateSingleTournamentClock(tournament) {
    try {
      // Obtener el reloj del torneo desde la base de datos
      const { data: clock, error: clockError } = await supabase
        .from('tournament_clocks')
        .select('*')
        .eq('tournament_id', tournament.id)
        .single();

      if (clockError || !clock) {
        // Si no hay reloj configurado, no hacer nada (se crea automáticamente cuando se necesita)
        return false;
      }

      // Si el reloj está pausado, no hacer nada
      if (clock.is_paused) {
        console.log(`⏸️ [AUTO-UPDATE] Torneo ${tournament.id} (${tournament.name}) - reloj pausado, saltando`);
        return false;
      }

      const now = new Date();
      const lastUpdated = parseUtcTimestamp(clock.last_updated);
      const secondsElapsed = Math.floor((now - lastUpdated) / 1000);

      // Si no han pasado al menos 5 segundos desde la última actualización, saltar
      if (secondsElapsed < 5) {
        return false;
      }

      let newTimeRemaining = clock.time_remaining_seconds - secondsElapsed;
      let newLevel = clock.current_level;
      let levelChanged = false;

      console.log(`🔍 [AUTO-UPDATE] Torneo ${tournament.id} (${tournament.name})`);
      console.log(`   Nivel actual: ${clock.current_level}, Tiempo restante: ${clock.time_remaining_seconds}s`);
      console.log(`   Segundos transcurridos: ${secondsElapsed}s`);

      // Verificar si el tiempo fue ajustado manualmente recientemente (en los últimos 30 segundos)
      const lastUpdatedTime = parseUtcTimestamp(clock.last_updated).getTime();
      const timeSinceLastUpdate = now.getTime() - lastUpdatedTime;
      const wasRecentlyAdjusted = timeSinceLastUpdate < 30000; // 30 segundos

      // Si el tiempo llegó a cero o menos, cambiar al siguiente nivel
      if (newTimeRemaining <= 0) {
        console.log(`⏰ [AUTO-UPDATE] Tiempo agotado para nivel ${clock.current_level}`);
        
        // Solo cambiar de nivel automáticamente si NO fue ajustado manualmente recientemente
        if (!wasRecentlyAdjusted) {
          console.log(`🔄 [AUTO-UPDATE] Cambio automático permitido - tiempo no fue ajustado recientemente`);
          
          // Calcular el siguiente nivel
          const nextLevel = clock.current_level + 1;

          if (tournament.blind_structure && tournament.blind_structure.length >= nextLevel) {
            // Obtener la duración del siguiente nivel
            const levelData = tournament.blind_structure[nextLevel - 1]; // Array index starts at 0
            const nextLevelTime = levelData.duration_minutes ? levelData.duration_minutes * 60 : 1200; // 20 minutos por defecto

            newTimeRemaining = nextLevelTime;
            newLevel = nextLevel;
            levelChanged = true;

            console.log(`🔄 [AUTO-UPDATE] Cambiando automáticamente a nivel ${newLevel} (${newTimeRemaining}s)`);
          } else {
            // No hay más niveles, mantener el último nivel con tiempo 0
            newTimeRemaining = 0;
            newLevel = clock.current_level;
            console.log(`🏁 [AUTO-UPDATE] Torneo completado - no hay más niveles disponibles`);
          }
        } else {
          // El tiempo fue ajustado manualmente, mantener en 0 pero no cambiar de nivel
          newTimeRemaining = 0;
          newLevel = clock.current_level;
          console.log(`⏸️ [AUTO-UPDATE] Tiempo ajustado manualmente recientemente - manteniendo nivel actual`);
        }
      } else {
        console.log(`✅ [AUTO-UPDATE] Tiempo restante actualizado: ${newTimeRemaining}s`);
      }

      // Actualizar el reloj en la base de datos
      const updateData = {
        time_remaining_seconds: Math.max(0, newTimeRemaining),
        current_level: newLevel,
        last_updated: now.toISOString()
      };

      const { error: updateError } = await supabaseAdmin
        .from('tournament_clocks')
        .update(updateData)
        .eq('tournament_id', tournament.id);

      if (updateError) {
        console.error(`❌ Error actualizando reloj del torneo ${tournament.id}:`, updateError);
        return false;
      }

      if (levelChanged) {
        console.log(`🎯 [AUTO-UPDATE] Nivel cambiado exitosamente: ${clock.current_level} → ${newLevel}`);
      }

      return true;

    } catch (error) {
      console.error(`❌ Error procesando torneo ${tournament.id}:`, error.message);
      return false;
    }
  }
}

module.exports = new TournamentClockService();
