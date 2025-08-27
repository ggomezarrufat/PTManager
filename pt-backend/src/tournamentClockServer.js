const { Server } = require('socket.io');
const { supabase } = require('./config/supabase');
const { createClient } = require('@supabase/supabase-js');

// Cliente con permisos de administrador para operaciones de escritura
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

class TournamentClockServer {
  constructor(server) {
        this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? ['https://copadesafio.vercel.app']
          : function (origin, callback) {
              // Permitir cualquier origin en desarrollo (localhost y archivos locales)
              callback(null, true);
            },
        methods: ['GET', 'POST']
      }
    });

    this.activeTournaments = new Map(); // tournamentId -> clockState
    this.userRooms = new Map(); // userId -> tournamentId

    this.setupEventHandlers();
    this.initializeExistingClocks();
    this.startClockSync();
  }

  // Inicializar relojes existentes desde la base de datos
  async initializeExistingClocks() {
    try {
      console.log('🔄 Inicializando relojes existentes...');

      // Obtener todos los relojes de torneos activos
      const { data: clocks, error } = await supabase
        .from('tournament_clocks')
        .select(`
          *,
          tournaments!inner(id, name, status)
        `)
        .eq('tournaments.status', 'active');

      if (error) {
        console.error('❌ Error obteniendo relojes existentes:', error);
        return;
      }

      if (clocks && clocks.length > 0) {
        for (const clock of clocks) {
          const clockState = {
            tournament_id: clock.tournament_id,
            current_level: clock.current_level,
            time_remaining_seconds: clock.time_remaining_seconds,
            is_paused: clock.is_paused,
            last_updated: clock.last_updated
          };

          this.activeTournaments.set(clock.tournament_id, clockState);
          console.log(`✅ Reloj cargado para torneo: ${clock.tournaments.name} (${clock.tournament_id})`);
        }

        console.log(`🎯 Total de relojes inicializados: ${clocks.length}`);
      } else {
        console.log('ℹ️ No hay relojes activos para inicializar');
      }

    } catch (error) {
      console.error('❌ Error inicializando relojes existentes:', error);
    }
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Usuario conectado: ${socket.id}`);

      // Usuario se une a un torneo
      socket.on('join-tournament', async (data) => {
        const { tournamentId, userId } = data;
        
        if (!tournamentId || !userId) {
          socket.emit('error', { message: 'Tournament ID y User ID son requeridos' });
          return;
        }

        try {
          // Verificar que el usuario tiene acceso al torneo
          const { data: tournament, error } = await supabase
            .from('tournaments')
            .select('id, status')
            .eq('id', tournamentId)
            .single();

          if (error || !tournament) {
            socket.emit('error', { message: 'Torneo no encontrado' });
            return;
          }

          if (tournament.status !== 'active') {
            socket.emit('error', { message: 'El torneo no está activo' });
            return;
          }

          // Unir usuario a la sala del torneo
          socket.join(`tournament-${tournamentId}`);
          this.userRooms.set(socket.id, tournamentId);

          // Enviar estado actual del reloj
          // Buscar estado en memoria PRIMERO (tiene prioridad sobre BD)
          let clockState = this.activeTournaments.get(tournamentId);

          if (clockState) {
            console.log(`✅ Estado obtenido de memoria: ${tournamentId} (${clockState.is_paused ? 'PAUSADO' : 'ACTIVO'})`);
          } else {
            // Si no está en memoria, cargar desde BD como respaldo
            console.log(`📚 Estado no en memoria, cargando desde BD: ${tournamentId}`);
            const { data: clockData, error: clockError } = await supabase
              .from('tournament_clocks')
              .select('*')
              .eq('tournament_id', tournamentId)
              .single();

            if (!clockError && clockData) {
              clockState = {
                tournament_id: clockData.tournament_id,
                current_level: clockData.current_level,
                time_remaining_seconds: clockData.time_remaining_seconds,
                is_paused: clockData.is_paused,
                last_updated: clockData.last_updated
              };

              // Guardar en memoria para futuras conexiones
              this.activeTournaments.set(tournamentId, clockState);
              console.log(`✅ Reloj cargado desde BD: ${clockData.tournament_id} (${clockState.is_paused ? 'PAUSADO' : 'ACTIVO'})`);
            }
          }

          if (clockState) {
            socket.emit('clock-sync', clockState);
            console.log(`📤 Estado del reloj enviado a ${userId}:`, clockState);
          } else {
            console.log(`❌ No se pudo encontrar reloj para torneo: ${tournamentId}`);
          }

          console.log(`👥 Usuario ${userId} se unió al torneo ${tournamentId}`);
        } catch (error) {
          console.error('Error uniendo usuario al torneo:', error);
          socket.emit('error', { message: 'Error interno del servidor' });
        }
      });

      // Control del reloj
      socket.on('pause-clock', async (data) => {
        const { tournamentId } = data;
        console.log(`⏸️ Pausando reloj para torneo: ${tournamentId}`);

        try {
          const success = await this.toggleClockPause(tournamentId, true);
          if (success) {
            console.log(`✅ Reloj pausado exitosamente: ${tournamentId}`);
            // Notificar a todos los usuarios del torneo
            this.io.to(`tournament-${tournamentId}`).emit('clock-pause-toggled', {
              tournament_id: tournamentId,
              is_paused: true
            });
          } else {
            console.log(`❌ Error al pausar reloj: ${tournamentId}`);
            socket.emit('error', { message: 'Error al pausar el reloj' });
          }
        } catch (error) {
          console.error('Error en pause-clock:', error);
          socket.emit('error', { message: 'Error interno del servidor' });
        }
      });

      socket.on('resume-clock', async (data) => {
        const { tournamentId } = data;
        console.log(`▶️ Reanudando reloj para torneo: ${tournamentId}`);

        try {
          const success = await this.toggleClockPause(tournamentId, false);
          if (success) {
            console.log(`✅ Reloj reanudado exitosamente: ${tournamentId}`);
            // Notificar a todos los usuarios del torneo
            this.io.to(`tournament-${tournamentId}`).emit('clock-pause-toggled', {
              tournament_id: tournamentId,
              is_paused: false
            });
          } else {
            console.log(`❌ Error al reanudar reloj: ${tournamentId}`);
            socket.emit('error', { message: 'Error al reanudar el reloj' });
          }
        } catch (error) {
          console.error('Error en resume-clock:', error);
          socket.emit('error', { message: 'Error interno del servidor' });
        }
      });

      socket.on('adjust-time', async (data) => {
        const { tournamentId, newSeconds } = data;
        console.log(`🔄 Ajustando tiempo del reloj para torneo: ${tournamentId} a ${newSeconds} segundos`);

        try {
          const success = await this.adjustClockTime(tournamentId, newSeconds);
          if (success) {
            console.log(`✅ Tiempo del reloj ajustado exitosamente: ${tournamentId} -> ${newSeconds}s`);

            // Enviar actualización inmediata a todos los usuarios
            const updatedClockState = this.activeTournaments.get(tournamentId);
            if (updatedClockState) {
              this.io.to(`tournament-${tournamentId}`).emit('clock-update', {
                ...updatedClockState,
                time_remaining_seconds: newSeconds
              });
            }
          } else {
            console.log(`❌ Error al ajustar tiempo del reloj: ${tournamentId}`);
            socket.emit('error', { message: 'Error al ajustar el tiempo del reloj' });
          }
        } catch (error) {
          console.error('Error en adjust-time:', error);
          socket.emit('error', { message: 'Error interno del servidor' });
        }
      });

      // Usuario sale del torneo
      socket.on('leave-tournament', () => {
        const tournamentId = this.userRooms.get(socket.id);
        if (tournamentId) {
          socket.leave(`tournament-${tournamentId}`);
          this.userRooms.delete(socket.id);
          console.log(`👋 Usuario se fue del torneo ${tournamentId}`);
        }
      });

      // Desconexión
      socket.on('disconnect', () => {
        const tournamentId = this.userRooms.get(socket.id);
        if (tournamentId) {
          this.userRooms.delete(socket.id);
          console.log(`🔌 Usuario desconectado del torneo ${tournamentId}`);
        }
      });
    });
  }

  // Iniciar sincronización del reloj
  startClockSync() {
    console.log('🚀 [INIT] Iniciando sistema de sincronización de reloj...');

    // Actualizar cada segundo para cuenta regresiva en tiempo real
    const intervalId = setInterval(async () => {
      try {
        await this.syncAllTournamentClocks();
      } catch (error) {
        console.error('❌ Error en intervalo de sincronización:', error.message);
        // No relanzar el error para evitar que el intervalo se detenga
      }
    }, 1000); // Sincronizar cada 1 segundo

    console.log('⏰ Sistema de reloj iniciado - actualizaciones cada 1 segundo (ID:', intervalId, ')');

    // Guardar referencia al intervalo por si necesitamos detenerlo
    this.clockSyncInterval = intervalId;
  }

  // Sincronizar todos los relojes activos
  async syncAllTournamentClocks() {
    console.log('🔄 [SYNC] Iniciando sincronización de relojes...');
    try {
      // Obtener todos los torneos activos
      const { data: activeTournaments, error } = await supabaseAdmin
        .from('tournaments')
        .select('id, status')
        .eq('status', 'active');

      if (error) {
        console.error('❌ Error obteniendo torneos activos:', error);
        return;
      }

      if (!activeTournaments || activeTournaments.length === 0) {
        // Solo log cada 10 segundos para no spam
        if (Date.now() % 10000 < 1000) {
          console.log('ℹ️ [SYNC] No hay torneos activos para sincronizar');
        }
        return;
      }

      console.log(`🔄 [SYNC] Sincronizando ${activeTournaments.length} torneo(s) activo(s)`);

      for (const tournament of activeTournaments) {
        try {
          await this.syncTournamentClock(tournament.id);
        } catch (tournamentError) {
          console.error(`❌ Error sincronizando torneo ${tournament.id}:`, tournamentError.message || tournamentError);
          // Continuar con el siguiente torneo incluso si hay error
        }
      }
    } catch (error) {
      console.error('❌ Error en syncAllTournamentClocks:', error.message);
      console.error('Stack:', error.stack);
    }
  }

  // Sincronizar reloj de un torneo específico
  async syncTournamentClock(tournamentId) {
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
        // Solo log errores que no sean "no encontrado"
        if (error.code !== 'PGRST116') {
          console.error(`❌ Error obteniendo reloj del torneo ${tournamentId}:`, error);
        }
        return;
      }

      if (!clockData) {
        console.log(`No hay reloj configurado para el torneo ${tournamentId}`);
        return;
      }

      // Si está pausado, no hacer nada
      if (clockData.is_paused) {
        console.log(`⏸️ [SYNC-TOUR] Reloj pausado para ${tournamentId}, saltando sincronización`);
        return;
      }

      console.log(`▶️ [SYNC-TOUR] Reloj activo para ${tournamentId}, procesando actualización de tiempo`);

      // Calcular tiempo restante
      const now = new Date();

      // Manejar zona horaria correctamente
      let lastUpdated;
      try {
        // Intentar parsear la fecha como UTC primero
        lastUpdated = new Date(clockData.last_updated + (clockData.last_updated.includes('Z') ? '' : 'Z'));
      } catch (error) {
        console.log(`⚠️ [SYNC-TOUR] Error parseando fecha para ${tournamentId}, usando fecha actual`);
        lastUpdated = now;
      }

      // Validar que la fecha sea razonable
      if (isNaN(lastUpdated.getTime())) {
        console.log(`⚠️ [SYNC-TOUR] Fecha inválida para ${tournamentId}, reiniciando`);
        lastUpdated = now;
      }

      const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);
      console.log(`⏱️ [SYNC-TOUR] ${tournamentId}: tiempo original=${clockData.time_remaining_seconds}s, transcurrido=${elapsedSeconds}s`);

      // Si han pasado más de 10 minutos, reiniciar el contador (caso extremo)
      if (elapsedSeconds > 600) {
        console.warn(`⚠️ Tiempo transcurrido muy grande para ${tournamentId}: ${elapsedSeconds}s, reiniciando`);
        await supabaseAdmin
          .from('tournament_clocks')
          .update({
            last_updated: now.toISOString(),
            time_remaining_seconds: clockData.time_remaining_seconds
          })
          .eq('tournament_id', tournamentId);
        return; // Salir para evitar más procesamiento en este ciclo
      }

      // Calcular tiempo restante (no permitir valores negativos)
      let timeRemaining = Math.max(0, clockData.time_remaining_seconds - elapsedSeconds);
      console.log(`⏰ [SYNC-TOUR] ${tournamentId}: tiempo restante=${timeRemaining}s`);
      
      // Si el tiempo se agotó, pasar al siguiente nivel
      if (timeRemaining <= 0) {
        console.log(`⏰ ${tournamentId}: Tiempo agotado! Pasando al siguiente nivel...`);
        console.log(`   Nivel actual en BD: ${clockData.current_level}, tiempo restante en BD: ${clockData.time_remaining_seconds}s`);

        // Verificar nuevamente que realmente necesitamos cambiar de nivel
        if (clockData.time_remaining_seconds <= 0) {
          await this.advanceToNextLevel(tournamentId, clockData);
          return; // Importante: retornar aquí para evitar actualizar tiempo restante después del cambio de nivel
        } else {
          console.log(`⚠️ ${tournamentId}: Tiempo restante cambió durante el procesamiento (${clockData.time_remaining_seconds}s), omitiendo cambio de nivel`);
        }
      }

      // Actualizar estado del reloj
      const updatedClockState = {
        tournament_id: tournamentId,
        current_level: clockData.current_level,
        time_remaining_seconds: timeRemaining,
        is_paused: clockData.is_paused,
        last_updated: now.toISOString()
      };

      // Actualizar en base de datos usando credenciales de administrador
      const { error: updateError } = await supabaseAdmin
        .from('tournament_clocks')
        .update({
          time_remaining_seconds: timeRemaining,
          last_updated: now.toISOString()
        })
        .eq('tournament_id', tournamentId);

      if (updateError) {
        console.error('❌ Error actualizando reloj en BD:', updateError);
        console.error('Código de error:', updateError.code);
        console.error('Mensaje:', updateError.message);
        return;
      }

      // Guardar en memoria para sincronización rápida
      this.activeTournaments.set(tournamentId, updatedClockState);

      // Emitir a todos los usuarios del torneo
      console.log(`📡 [SYNC-TOUR] Enviando actualización a clientes: ${timeRemaining}s`);
      this.io.to(`tournament-${tournamentId}`).emit('clock-update', updatedClockState);

      // Log detallado cuando el tiempo es bajo
      if (timeRemaining <= 10) {
        console.log(`⏰ ${tournamentId}: ${timeRemaining}s restantes (NIVEL ${clockData.current_level})`);
      }

    } catch (error) {
      console.error(`❌ Error sincronizando reloj del torneo ${tournamentId}:`, error.message);
      // No mostrar stack completo para errores de red comunes
      if (error.message && !error.message.includes('fetch') && !error.message.includes('network')) {
        console.error('Stack:', error.stack);
      }
    }
  }

  // Avanzar al siguiente nivel de blinds
  async advanceToNextLevel(tournamentId, currentClock) {
    try {
      console.log(`🔄 Avanzando al siguiente nivel para torneo ${tournamentId}`);
      console.log(`📊 Nivel actual: ${currentClock.current_level}, Tiempo restante: ${currentClock.time_remaining_seconds}s`);

      // Verificar que realmente necesite cambiar de nivel (triple verificación)
      if (currentClock.time_remaining_seconds > 0) {
        console.log(`⚠️ No se necesita cambio de nivel - tiempo restante: ${currentClock.time_remaining_seconds}s`);
        return;
      }

      // Verificar que el reloj esté activo
      if (currentClock.is_paused) {
        console.log(`⚠️ No se puede cambiar de nivel - reloj está pausado`);
        return;
      }

      // Obtener estructura de blinds del torneo usando credenciales de administrador
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
        // Configurar siguiente nivel
        const nextLevelConfig = blindStructure[nextLevel - 1]; // Los niveles empiezan en 1
        console.log(`🔍 Configuración del nivel ${nextLevel}:`, nextLevelConfig);

        // Calcular tiempo correctamente (manejar decimales)
        const newTimeSeconds = Math.round(nextLevelConfig.duration_minutes * 60);
        console.log(`⏰ Nuevo tiempo calculado: ${newTimeSeconds}s (${nextLevelConfig.duration_minutes} minutos)`);

        const now = new Date();
        const newClockState = {
          tournament_id: tournamentId,
          current_level: nextLevel,
          time_remaining_seconds: newTimeSeconds,
          is_paused: false,
          last_updated: now.toISOString()
        };

        console.log(`⏰ Nuevo estado del reloj: Nivel ${nextLevel}, ${newTimeSeconds}s`);

        // Actualizar en base de datos usando credenciales de administrador
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
          console.error('Código de error:', updateError.code);
          console.error('Mensaje:', updateError.message);
          return;
        }

        console.log(`✅ Reloj actualizado en BD correctamente`);
        console.log(`   Datos actualizados:`, updateData[0]);

        // Guardar en memoria
        this.activeTournaments.set(tournamentId, newClockState);
        console.log(`💾 Estado guardado en memoria`);

        // Notificar a todos los usuarios
        this.io.to(`tournament-${tournamentId}`).emit('level-changed', {
          tournament_id: tournamentId,
          new_level: nextLevel,
          duration_minutes: nextLevelConfig.duration_minutes,
          blind_level: nextLevelConfig,
          clock_state: newClockState
        });

        console.log(`📡 Notificación de cambio de nivel enviada a todos los usuarios`);
        console.log(`✅ Torneo ${tournamentId} avanzó al nivel ${nextLevel} exitosamente`);

        // Delay para evitar conflictos de sincronización inmediata
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`⏰ Espera completada - listo para siguiente sincronización`);

      } else {
        // Torneo terminado
        console.log(`🏁 Torneo ${tournamentId} terminó - no hay más niveles (${nextLevel} > ${blindStructure.length})`);
        await this.endTournament(tournamentId);
      }

    } catch (error) {
      console.error(`❌ Error avanzando nivel del torneo ${tournamentId}:`, error);
      console.error('Stack trace:', error.stack);
    }
  }

  // Finalizar torneo
  async endTournament(tournamentId) {
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

      // Notificar a todos los usuarios
      this.io.to(`tournament-${tournamentId}`).emit('tournament-ended', {
        tournament_id: tournamentId,
        message: 'El torneo ha terminado'
      });

      // Limpiar estado del reloj
      this.activeTournaments.delete(tournamentId);

      console.log(`✅ Torneo ${tournamentId} finalizado exitosamente`);

    } catch (error) {
      console.error(`Error finalizando torneo ${tournamentId}:`, error);
    }
  }

  // Método público para pausar/reanudar reloj
  async toggleClockPause(tournamentId, isPaused) {
    try {
      console.log(`⏸️ Cambiando estado del reloj ${tournamentId} a: ${isPaused ? 'PAUSADO' : 'ACTIVO'}`);

      // Actualizar en base de datos usando credenciales de administrador
      const { error } = await supabaseAdmin
        .from('tournament_clocks')
        .update({
          is_paused: isPaused,
          last_updated: new Date().toISOString()
        })
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('❌ Error pausando/reanudando reloj:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje:', error.message);
        return false;
      }

      console.log(`✅ Reloj ${isPaused ? 'pausado' : 'reanudado'} exitosamente: ${tournamentId}`);

      // Actualizar en memoria
      const clockState = this.activeTournaments.get(tournamentId);
      if (clockState) {
        clockState.is_paused = isPaused;
        this.activeTournaments.set(tournamentId, clockState);
      }

      // Notificar a todos los usuarios conectados
      this.io.to(`tournament-${tournamentId}`).emit('clock-pause-toggled', {
        tournament_id: tournamentId,
        is_paused: isPaused
      });

      console.log(`📡 Notificación enviada a todos los usuarios del torneo ${tournamentId}`);
      return true;
    } catch (error) {
      console.error('❌ Error en toggleClockPause:', error.message);
      return false;
    }
  }

  // Método público para ajustar tiempo
  async adjustClockTime(tournamentId, newTimeSeconds) {
    try {
      console.log(`🔄 Ajustando tiempo del reloj ${tournamentId} a ${newTimeSeconds} segundos`);

      // Actualizar en base de datos usando credenciales de administrador
      const { error } = await supabaseAdmin
        .from('tournament_clocks')
        .update({
          time_remaining_seconds: newTimeSeconds,
          last_updated: new Date().toISOString()
        })
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('❌ Error ajustando tiempo del reloj:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje:', error.message);
        return false;
      }

      console.log(`✅ Tiempo del reloj ajustado exitosamente a ${newTimeSeconds} segundos`);

      // Actualizar en memoria
      const clockState = this.activeTournaments.get(tournamentId);
      if (clockState) {
        clockState.time_remaining_seconds = newTimeSeconds;
        this.activeTournaments.set(tournamentId, clockState);
      }

      // Notificar a todos los usuarios
      this.io.to(`tournament-${tournamentId}`).emit('clock-time-adjusted', {
        tournament_id: tournamentId,
        new_time_seconds: newTimeSeconds
      });

      console.log(`📡 Notificación de ajuste de tiempo enviada`);
      return true;
    } catch (error) {
      console.error('❌ Error en adjustClockTime:', error.message);
      return false;
    }
  }
}

module.exports = TournamentClockServer;
