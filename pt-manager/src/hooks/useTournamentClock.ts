import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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
}

export const useTournamentClock = ({
  tournamentId,
  userId,
  onLevelChanged,
  onTournamentEnded
}: UseTournamentClockProps) => {
  const [clockState, setClockState] = useState<ClockState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  const socketRef = useRef<Socket | null>(null);
  const localTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const clockStateRef = useRef<ClockState | null>(null);

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

  // Función para desconectar socket
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    stopLocalTimer();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [stopLocalTimer]);

  // Función para reconectar automáticamente
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('❌ Máximo número de intentos de reconexión alcanzado');
      setError('No se pudo conectar al servidor de reloj después de varios intentos');
      setConnectionStatus('error');
      return;
    }

    reconnectAttemptsRef.current++;
    console.log(`🔄 Intentando reconectar... (intento ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

    setTimeout(() => {
      if (!socketRef.current?.connected) {
        disconnectSocket();
        // El useEffect se ejecutará nuevamente y creará una nueva conexión
      }
    }, 2000 * reconnectAttemptsRef.current); // Backoff exponencial
  }, [disconnectSocket]);

  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (isInitializedRef.current) {
      return;
    }

    if (!tournamentId || !userId) {
      console.log('⏸️ Esperando tournamentId y userId para inicializar reloj');
      return;
    }

    console.log('🚀 Inicializando hook de reloj para torneo:', tournamentId);
    console.log('📊 Variables de entorno:', {
      REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
      REACT_APP_API_URL: process.env.REACT_APP_API_URL,
      NODE_ENV: process.env.NODE_ENV
    });
    isInitializedRef.current = true;
    reconnectAttemptsRef.current = 0;

    // Función para inicializar conexión
    const initializeConnection = () => {
      console.log('🔧 Iniciando configuración de conexión WebSocket...');
      setConnectionStatus('connecting');
      setError(null);

        // Conectar al WebSocket con configuración robusta
      const socketUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
      console.log('🔌 Intentando conectar a WebSocket:', socketUrl);
      console.log('🌐 URL completa:', window.location.href);

      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true
      });

      console.log('📡 Socket.IO configurado con opciones:', {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true
      });

      socketRef.current = socket;

      // Eventos de conexión
      socket.on('connect', () => {
        console.log('✅ ¡CONEXIÓN WEBSOCKET ESTABLECIDA!');
        console.log('   Socket ID:', socket.id);
        console.log('   Connected:', socket.connected);
        console.log('   Tournament ID:', tournamentId);
        console.log('   User ID:', userId);

        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Unirse al torneo
        console.log('🎯 Enviando solicitud de unión al torneo...');
        socket.emit('join-tournament', { tournamentId, userId });
      });

      socket.on('connect_error', (error) => {
        console.error('❌ ERROR DE CONEXIÓN WEBSOCKET:');
        console.error('   Mensaje:', error.message);
        console.error('   Stack:', error.stack);

        // Verificar si es un error de Socket.IO con propiedades adicionales
        if (error && typeof error === 'object') {
          console.error('   Tipo:', (error as any).type || 'Desconocido');
          console.error('   Descripción:', (error as any).description || 'Sin descripción');
          console.error('   Contexto:', (error as any).context || 'Sin contexto');
        }

        setError(`Error de conexión: ${error.message}`);
        setIsConnected(false);
        setConnectionStatus('error');

        // Intentar reconectar automáticamente
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log('🔄 Intentando reconexión automática...');
          attemptReconnect();
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Desconectado del servidor de reloj:', reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');

        // Intentar reconectar automáticamente si no fue intencional
        if (reason === 'io server disconnect' || reason === 'transport close') {
          attemptReconnect();
        }
      });

      // Eventos del reloj con mejor manejo
      socket.on('clock-sync', (state: ClockState) => {
        console.log('🎯 ¡SINCRONIZACIÓN DE RELOJ RECIBIDA DESDE SERVIDOR!');
        console.log('   Estado completo:', JSON.stringify(state, null, 2));
        console.log('   Nivel:', state.current_level);
        console.log('   Tiempo restante:', state.time_remaining_seconds, 'segundos');
        console.log('   Estado:', state.is_paused ? 'PAUSADO' : 'ACTIVO');
        console.log('   Última actualización:', state.last_updated);

        setClockState(state);
        clockStateRef.current = state;

        // Solo iniciar timer local si el reloj está activo
        if (!state.is_paused && state.time_remaining_seconds > 0) {
          console.log('⏰ Iniciando timer local con:', state.time_remaining_seconds, 'segundos');
          startLocalTimer(state.time_remaining_seconds);
        } else {
          console.log('⏸️ Reloj pausado o tiempo agotado, deteniendo timer local');
          stopLocalTimer();
        }
      });

      socket.on('clock-update', (state: ClockState) => {
        console.log('⏰ Actualización del reloj desde servidor:', state);
        setClockState(state);
        clockStateRef.current = state;

        // Gestionar timer local según el estado del servidor
        if (!state.is_paused && state.time_remaining_seconds > 0) {
          updateLocalTimer(state.time_remaining_seconds);
          // Reiniciar timer local si es necesario
          if (!localTimerRef.current) {
            startLocalTimer(state.time_remaining_seconds);
          }
        } else {
          stopLocalTimer();
        }
      });

      socket.on('clock-pause-toggled', (data: { tournament_id: string; is_paused: boolean }) => {
        console.log('⏸️ Estado de pausa cambiado:', data);
        setClockState(prev => {
          if (!prev) return null;

          const newState = { ...prev, is_paused: data.is_paused };
          clockStateRef.current = newState;

          // Gestionar timer local
          if (data.is_paused) {
            stopLocalTimer();
          } else if (newState.time_remaining_seconds > 0) {
            startLocalTimer(newState.time_remaining_seconds);
          }

          return newState;
        });
      });

      socket.on('level-changed', (data: LevelChangedData) => {
        console.log('🎯 ¡CAMBIO AUTOMÁTICO DE NIVEL DETECTADO!');
        console.log(`   Nivel anterior: ${clockStateRef.current?.current_level || 'desconocido'}`);
        console.log(`   Nuevo nivel: ${data.new_level}`);
        console.log(`   Duración: ${data.duration_minutes} minutos`);
        console.log(`   Nuevo tiempo: ${data.clock_state.time_remaining_seconds}s`);

        setClockState(data.clock_state);
        clockStateRef.current = data.clock_state;

        // Reiniciar timer local con el nuevo tiempo
        if (!data.clock_state.is_paused && data.clock_state.time_remaining_seconds > 0) {
          startLocalTimer(data.clock_state.time_remaining_seconds);
        }

        onLevelChanged?.(data);
      });

      socket.on('tournament-ended', (data: any) => {
        console.log('🏁 Torneo terminado:', data);
        setClockState(null);
        clockStateRef.current = null;
        stopLocalTimer();
        onTournamentEnded?.(data);
      });

      socket.on('error', (error: { message: string }) => {
        console.error('❌ Error del servidor de reloj:', error);
        setError(`Error del servidor: ${error.message}`);
      });
    };

    // Inicializar la conexión
    initializeConnection();

    // Cleanup mejorado
    return () => {
      console.log('🧹 Limpiando hook de reloj');
      disconnectSocket();
      clockStateRef.current = null;
      isInitializedRef.current = false;
      reconnectAttemptsRef.current = 0;
    };
  }, [tournamentId, userId]);

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
  const pauseClock = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('pause-clock', { tournamentId });
    } else {
      console.error('❌ No se puede pausar: conexión WebSocket no disponible');
    }
  }, [tournamentId]);

  const resumeClock = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('resume-clock', { tournamentId });
    } else {
      console.error('❌ No se puede reanudar: conexión WebSocket no disponible');
    }
  }, [tournamentId]);

  const adjustTime = useCallback((newSeconds: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('adjust-time', { tournamentId, newSeconds });
    } else {
      console.error('❌ No se puede ajustar tiempo: conexión WebSocket no disponible');
    }
  }, [tournamentId]);

  // Función para forzar reconexión
  const reconnect = useCallback(() => {
    console.log('🔄 Forzando reconexión manual...');
    disconnectSocket();
    // El useEffect se ejecutará nuevamente
  }, [disconnectSocket]);

  return {
    // Estados principales
    clockState,
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
