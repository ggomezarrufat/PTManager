import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URLS } from '../config/api';

interface ClockState {
  tournament_id: string;
  current_level: number;
  time_remaining_seconds: number;
  is_paused: boolean;
  last_updated: string;
}

interface LevelChangedData {
  tournament_id: string;
  new_level: number;
  duration_minutes: number;
  blind_level: {
    level: number;
    big_blind: number;
    small_blind: number;
    duration_minutes: number;
  };
  clock_state: ClockState;
}

interface UseTournamentClockProps {
  tournamentId: string;
  userId: string;
  onLevelChanged?: (data: LevelChangedData) => void;
  onTournamentEnded?: (data: any) => void;
  onClockAction?: (action: string, message: string) => void;
}

export const useTournamentClock = ({
  tournamentId,
  userId,
  onLevelChanged,
  onTournamentEnded,
  onClockAction
}: UseTournamentClockProps) => {
  const [clockState, setClockState] = useState<ClockState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownStateRef = useRef<ClockState | null>(null);
  const clockStateRef = useRef<ClockState | null>(null);
  const isCleaningUpRef = useRef(false);

  // Función para detener el timer local
  const stopLocalTimer = useCallback(() => {
    if (localTimerRef.current) {
      clearInterval(localTimerRef.current);
      localTimerRef.current = null;
    }
  }, []);

  // Timer local mejorado con sincronización del servidor
  const startLocalTimer = useCallback((initialSeconds: number) => {
    stopLocalTimer();

    console.log(`⏰ Iniciando timer local con ${initialSeconds}s`);

    localTimerRef.current = setInterval(() => {
      setClockState(prev => {
        if (!prev || prev.is_paused) return prev;

        const newTime = Math.max(0, prev.time_remaining_seconds - 1);

        // Si llega a cero, detener el timer local y esperar actualización del servidor
        if (newTime === 0) {
          console.log('⏰ Timer local llegó a cero - esperando cambio automático de nivel');
          stopLocalTimer();
        }

        return { ...prev, time_remaining_seconds: newTime };
      });
    }, 1000);
  }, [stopLocalTimer]);

  const updateLocalTimer = useCallback((newSeconds: number) => {
    console.log(`🔄 Actualizando timer local a ${newSeconds}s`);
    setClockState(prev => prev ? { ...prev, time_remaining_seconds: newSeconds } : null);
  }, []);

  // Función para detener el polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    stopLocalTimer();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [stopLocalTimer]);

  // Función para hacer polling del estado del reloj
  const pollClockState = useCallback(async () => {
    if (!tournamentId) return;

    try {
      const response = await fetch(`${API_URLS.CLOCK.STATE}?tournamentId=${tournamentId}`);
      const data = await response.json();

      if (data.success && data.clockState) {
        const newClockState = data.clockState;

        // Verificar si el estado cambió
        const stateChanged = JSON.stringify(lastKnownStateRef.current) !== JSON.stringify(newClockState);

        if (stateChanged) {
          console.log('🔄 Estado del reloj actualizado desde servidor:', newClockState);
          console.log('   Estado anterior:', lastKnownStateRef.current);
          console.log('   Estado nuevo:', newClockState);
          console.log('   ¿Cambio de nivel?', lastKnownStateRef.current?.current_level !== newClockState.current_level);
          setClockState(newClockState);
          clockStateRef.current = newClockState;
          lastKnownStateRef.current = newClockState;

          // Verificar si cambió el nivel
          if (lastKnownStateRef.current && lastKnownStateRef.current.current_level !== newClockState.current_level) {
            console.log(`🎯 ¡NIVEL CAMBIADO! ${lastKnownStateRef.current.current_level} → ${newClockState.current_level}`);
            onLevelChanged?.({
              tournament_id: newClockState.tournament_id,
              new_level: newClockState.current_level,
              duration_minutes: 0, // No tenemos esta info en el estado simple
              blind_level: { level: newClockState.current_level, big_blind: 0, small_blind: 0, duration_minutes: 0 },
              clock_state: newClockState
            });
          }

          // Gestionar timer local según el estado del servidor
          if (!newClockState.is_paused && newClockState.time_remaining_seconds > 0) {
            updateLocalTimer(newClockState.time_remaining_seconds);
            if (!localTimerRef.current) {
              startLocalTimer(newClockState.time_remaining_seconds);
            }
          } else {
            stopLocalTimer();
          }
        }

        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);

      } else if (data.error) {
        console.error('Error obteniendo estado del reloj:', data.error);
        setError(data.error);
        setConnectionStatus('error');
      }

    } catch (error) {
      console.error('Error en polling del reloj:', error);
      setError('Error de conexión con el servidor');
      setConnectionStatus('error');
    }
  }, [tournamentId, startLocalTimer, stopLocalTimer, updateLocalTimer]);

  // Función para unirse al torneo
  const joinTournament = useCallback(async () => {
    if (!tournamentId || !userId) return;

    try {
      console.log(`👥 Uniéndose al torneo ${tournamentId} como usuario ${userId}`);

      const response = await fetch(API_URLS.CLOCK.JOIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tournamentId, userId })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Unido al torneo exitosamente');

        if (data.clockState) {
          console.log('🎯 Estado inicial del reloj:', data.clockState);
          setClockState(data.clockState);
          clockStateRef.current = data.clockState;
          lastKnownStateRef.current = data.clockState;

          // Iniciar timer local si es necesario
          if (!data.clockState.is_paused && data.clockState.time_remaining_seconds > 0) {
            startLocalTimer(data.clockState.time_remaining_seconds);
          }
        }

        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);

        // Iniciar polling cada 60 segundos para reducir carga del servidor
        pollingIntervalRef.current = setInterval(pollClockState, 60000);

      } else {
        console.error('Error uniéndose al torneo:', data.error);
        setError(data.error);
        setConnectionStatus('error');
      }

    } catch (error) {
      console.error('Error uniéndose al torneo:', error);
      setError('Error de conexión con el servidor');
      setConnectionStatus('error');
    }
  }, [tournamentId, userId, startLocalTimer, pollClockState, stopPolling]);

  useEffect(() => {
    console.log('🐛 useEffect principal: Ejecutando...');
    console.log('   Dependencies:', { tournamentId, userId, joinTournament, stopPolling });

    if (!tournamentId || !userId) {
      console.log('⏸️ useEffect principal: Esperando tournamentId y userId para inicializar reloj');
      stopPolling(); // Ensure polling is stopped if dependencies are not ready
      return;
    }

    console.log('🚀 Inicializando hook de reloj para torneo:', tournamentId);
    console.log('📊 Variables de entorno:', {
      REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
      REACT_APP_API_URL: process.env.REACT_APP_API_URL,
      NODE_ENV: process.env.NODE_ENV
    });

    setConnectionStatus('connecting');
    joinTournament();

    // Cleanup
    return () => {
      console.log('🧹 Limpiando hook de reloj para tournamentId:', tournamentId);
      stopPolling();
      setClockState(null); // Clear clock state on cleanup
      clockStateRef.current = null;
      lastKnownStateRef.current = null;
    };
  }, [tournamentId, userId, joinTournament, stopPolling]);

  // Mantener sincronizada la referencia con el estado del reloj
  useEffect(() => {
    clockStateRef.current = clockState;
  }, [clockState]);

  // Formatear tiempo para display
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Información adicional del reloj
  const getClockInfo = useCallback(() => {
    if (!clockState) return null;

    const minutes = Math.floor(clockState.time_remaining_seconds / 60);
    const seconds = clockState.time_remaining_seconds % 60;
    const progress = clockState.current_level > 1 ? 100 : 0; // Simplificado

    return {
      level: clockState.current_level,
      timeRemaining: clockState.time_remaining_seconds,
      minutes,
      seconds,
      isPaused: clockState.is_paused,
      progress,
      formattedTime: formatTime(clockState.time_remaining_seconds)
    };
  }, [clockState, formatTime]);

  // Métodos para control del reloj (solo para admins)
  const pauseClock = useCallback(async () => {
    if (!tournamentId) {
      console.error('❌ TournamentId no disponible');
      return;
    }

    try {
      console.log(`⏸️ Pausando reloj para torneo: ${tournamentId}`);

      const response = await fetch(API_URLS.CLOCK.PAUSE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId,
          currentTimeSeconds: clockState?.time_remaining_seconds
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Reloj pausado exitosamente');

        // Actualizar estado local inmediatamente
        setClockState(prev => {
          if (!prev) return null;
          const newState = { ...prev, is_paused: true };
          clockStateRef.current = newState;
          stopLocalTimer();
          return newState;
        });

        // Notificar éxito al usuario
        if (onClockAction) {
          onClockAction('paused', 'Reloj pausado exitosamente');
        }

    } else {
        console.error('❌ Error al pausar reloj:', data.error);
        setError(data.error);
        if (onClockAction) {
          onClockAction('error', data.error);
        }
      }

    } catch (error) {
      console.error('Error al pausar reloj:', error);
      setError('Error de conexión al pausar reloj');
    }
  }, [tournamentId, stopLocalTimer]);

  const resumeClock = useCallback(async () => {
    if (!tournamentId) {
      console.error('❌ TournamentId no disponible');
      return;
    }

    try {
      console.log(`▶️ Reanudando reloj para torneo: ${tournamentId}`);

      const response = await fetch(API_URLS.CLOCK.RESUME, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId,
          currentTimeSeconds: clockState?.time_remaining_seconds
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Reloj reanudado exitosamente');

        // Actualizar estado local inmediatamente
        setClockState(prev => {
          if (!prev) return null;
          const newState = { ...prev, is_paused: false };
          clockStateRef.current = newState;

          // Reiniciar timer si hay tiempo restante
          if (newState.time_remaining_seconds > 0) {
            startLocalTimer(newState.time_remaining_seconds);
          }

          return newState;
        });

        // Notificar éxito al usuario
        if (onClockAction) {
          onClockAction('resumed', 'Reloj reanudado exitosamente');
        }

    } else {
        console.error('❌ Error al reanudar reloj:', data.error);
        setError(data.error);
        if (onClockAction) {
          onClockAction('error', data.error);
        }
      }

    } catch (error) {
      console.error('Error al reanudar reloj:', error);
      setError('Error de conexión al reanudar reloj');
    }
  }, [tournamentId, startLocalTimer]);

  const adjustTime = useCallback(async (newSeconds: number) => {
    if (!tournamentId) {
      console.error('❌ TournamentId no disponible');
      return;
    }

    try {
      console.log(`🔄 Ajustando tiempo del reloj para torneo: ${tournamentId} a ${newSeconds} segundos`);

      const response = await fetch(API_URLS.CLOCK.ADJUST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tournamentId, newSeconds })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Tiempo del reloj ajustado exitosamente');

        // Actualizar estado local inmediatamente
        setClockState(prev => {
          if (!prev) return null;
          const newState = { ...prev, time_remaining_seconds: newSeconds };
          clockStateRef.current = newState;

          // Reiniciar timer local
          stopLocalTimer();
          if (!newState.is_paused && newSeconds > 0) {
            startLocalTimer(newSeconds);
          }

          return newState;
        });

    } else {
        console.error('❌ Error al ajustar tiempo del reloj:', data.error);
        setError(data.error);
      }

    } catch (error) {
      console.error('Error al ajustar tiempo del reloj:', error);
      setError('Error de conexión al ajustar tiempo del reloj');
    }
  }, [tournamentId, startLocalTimer, stopLocalTimer]);

  // Función para forzar reconexión (reiniciar polling)
  const reconnect = useCallback(() => {
    console.log('🔄 Forzando reconexión manual...');
    stopPolling();

    // Reiniciar la conexión después de un breve delay
    setTimeout(() => {
      if (tournamentId && userId) {
        joinTournament();
      }
    }, 1000);
  }, [tournamentId, userId, stopPolling, joinTournament]);

  return {
    // Estados principales
    clockState,
    setClockState, // Agregado para permitir actualizaciones locales
    isConnected,
    connectionStatus,
    error,

    // Utilidades
    formatTime,
    getClockInfo,

    // Control del reloj
    pauseClock,
    resumeClock,
    adjustTime,
    reconnect
  };
};
