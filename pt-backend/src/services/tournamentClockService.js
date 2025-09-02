const { supabase, supabaseAdmin } = require('../config/supabase');

class TournamentClockService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
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

    // Ejecutar cada 10 segundos
    this.intervalId = setInterval(() => {
      this.updateTournamentClocks();
    }, 10000); // 10 segundos

    this.isRunning = true;
    console.log('✅ Servicio de actualización automática del reloj iniciado - actualizaciones cada 10 segundos');
  }

  /**
   * Detiene el servicio de actualización automática
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 Servicio de actualización automática del reloj detenido');
    }
  }

  /**
   * Actualiza todos los relojes de torneos activos
   */
  async updateTournamentClocks() {
    try {
      console.log('🔄 [AUTO-UPDATE] Iniciando actualización automática de relojes...');

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
        console.log('📭 No hay torneos activos para actualizar');
        return;
      }

      console.log(`📊 [AUTO-UPDATE] Procesando ${activeTournaments.length} torneo(s) activo(s)`);

      let updatedCount = 0;

      for (const tournament of activeTournaments) {
        const clockUpdated = await this.updateSingleTournamentClock(tournament);
        if (clockUpdated) {
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        console.log(`✅ [AUTO-UPDATE] ${updatedCount} reloj(es) actualizado(s) automáticamente`);
      } else {
        console.log('📭 [AUTO-UPDATE] No se requirieron actualizaciones automáticas');
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
      const lastUpdated = new Date(clock.last_updated);
      const secondsElapsed = Math.floor((now - lastUpdated) / 1000);

      // Si no han pasado al menos 10 segundos desde la última actualización, saltar
      if (secondsElapsed < 10) {
        return false;
      }

      let newTimeRemaining = clock.time_remaining_seconds - secondsElapsed;
      let newLevel = clock.current_level;
      let levelChanged = false;

      console.log(`🔍 [AUTO-UPDATE] Torneo ${tournament.id} (${tournament.name})`);
      console.log(`   Nivel actual: ${clock.current_level}, Tiempo restante: ${clock.time_remaining_seconds}s`);
      console.log(`   Segundos transcurridos: ${secondsElapsed}s`);

      // Si el tiempo llegó a cero o menos, cambiar al siguiente nivel
      if (newTimeRemaining <= 0) {
        console.log(`⏰ [AUTO-UPDATE] Tiempo agotado para nivel ${clock.current_level}`);

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
