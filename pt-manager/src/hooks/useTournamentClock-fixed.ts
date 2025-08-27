import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface ClockState {
  tournament_id: string;
  current_level: number;
  time_remaining_seconds: number;
  is_paused: boolean;
  last_updated: string;
}

interface UseTournamentClockProps {
  tournamentId: string;
  userId: string;
  onLevelChanged?: (data: any) => void;
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
  
  const socketRef = useRef<Socket | null>(null);
  const localTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Timer local para actualización suave del UI
  const startLocalTimer = useCallback((initialSeconds: number) => {
    stopLocalTimer();
    
    localTimerRef.current = setInterval(() => {
      setClockState(prev => {
        if (!prev || prev.is_paused) return prev;
        
        const newTime = Math.max(0, prev.time_remaining_seconds - 1);
        return { ...prev, time_remaining_seconds: newTime };
      });
    }, 1000);
  }, []);

  const updateLocalTimer = useCallback((newSeconds: number) => {
    setClockState(prev => prev ? { ...prev, time_remaining_seconds: newSeconds } : null);
  }, []);

  const stopLocalTimer = useCallback(() => {
    if (localTimerRef.current) {
      clearInterval(localTimerRef.current);
      localTimerRef.current = null;
    }
  }, []);

  // Función para desconectar socket
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    stopLocalTimer();
  }, [stopLocalTimer]);

  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (isInitializedRef.current) {
      return;
    }

    if (!tournamentId || !userId) return;

    console.log('🚀 Inicializando hook de reloj para torneo:', tournamentId);
    isInitializedRef.current = true;

    // Conectar al WebSocket
    const socket = io(process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001');
    socketRef.current = socket;

    // Eventos de conexión
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('🔌 Conectado al servidor de reloj');
      
      // Unirse al torneo
      socket.emit('join-tournament', { tournamentId, userId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Desconectado del servidor de reloj');
    });

    // Eventos del reloj
    socket.on('clock-sync', (state: ClockState) => {
      console.log('🔄 Sincronización inicial del reloj:', state);
      setClockState(state);
      startLocalTimer(state.time_remaining_seconds);
    });

    socket.on('clock-update', (state: ClockState) => {
      setClockState(state);
      updateLocalTimer(state.time_remaining_seconds);
    });

    socket.on('clock-pause-toggled', (data: { tournament_id: string; is_paused: boolean }) => {
      console.log('⏸️ Estado de pausa cambiado:', data);
      setClockState(prev => prev ? { ...prev, is_paused: data.is_paused } : null);
    });

    socket.on('level-changed', (data: any) => {
      console.log('🔄 Nivel cambiado:', data);
      setClockState(data.clock_state);
      startLocalTimer(data.clock_state.time_remaining_seconds);
      onLevelChanged?.(data);
    });

    socket.on('tournament-ended', (data: any) => {
      console.log('🏁 Torneo terminado:', data);
      setClockState(null);
      stopLocalTimer();
      onTournamentEnded?.(data);
    });

    socket.on('error', (error: { message: string }) => {
      setError(error.message);
      console.error('Error del servidor de reloj:', error);
    });

    // Cleanup
    return () => {
      console.log('🧹 Limpiando hook de reloj');
      disconnectSocket();
      isInitializedRef.current = false;
    };
  }, [tournamentId, userId, startLocalTimer, updateLocalTimer, stopLocalTimer, disconnectSocket, onLevelChanged, onTournamentEnded]);

  // Formatear tiempo para display
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Métodos para control del reloj (solo para admins)
  const pauseClock = useCallback(() => {
    socketRef.current?.emit('pause-clock', { tournamentId });
  }, [tournamentId]);

  const resumeClock = useCallback(() => {
    socketRef.current?.emit('resume-clock', { tournamentId });
  }, [tournamentId]);

  const adjustTime = useCallback((newSeconds: number) => {
    socketRef.current?.emit('adjust-time', { tournamentId, newSeconds });
  }, [tournamentId]);

  return {
    clockState,
    isConnected,
    error,
    formatTime,
    pauseClock,
    resumeClock,
    adjustTime
  };
};
