import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, Alert, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControlLabel, Switch, Stack } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, People, Assessment, Stop, PersonAdd, ShoppingCart } from '@mui/icons-material';
import { useTournamentClock } from '../../hooks/useTournamentClock';
import { useAuthStore } from '../../store/authStore';
import { tournamentService, playerService, rebuyService, addonService, API_BASE_URL } from '../../services/apiService';
import { API_URLS } from '../../config/api';
import { TournamentPlayer } from '../../types';
import PlayerListItem from './PlayerListItem';
import { useNavigate } from 'react-router-dom';

interface TournamentClockProps {
  tournamentId: string;
}

const TournamentClock: React.FC<TournamentClockProps> = ({ tournamentId }) => {
  const { user } = useAuthStore();
  const isAdmin = !!user?.is_admin;
  const navigate = useNavigate();

  // Memoizar los callbacks para evitar re-inicializaciones del hook
  const handleLevelChanged = useCallback((data: any) => {
    console.log('Nivel cambiado en componente:', data);
    // Aquí podrías mostrar una notificación o actualizar la UI
  }, []);

  const handleTournamentEnded = useCallback((data: any) => {
    console.log('Torneo terminado en componente:', data);
    // Aquí podrías redirigir o mostrar un mensaje de fin de torneo
  }, []);

  const {
    clockState,
    setClockState,
    isConnected,
    error,
    formatTime,
    getClockInfo,
    pauseClock,
    resumeClock,
    reconnect
  } = useTournamentClock({
    tournamentId,
    userId: user?.id || '',
    onLevelChanged: handleLevelChanged,
    onTournamentEnded: handleTournamentEnded
  });

  // Obtener información adicional del reloj
  const clockInfo = getClockInfo();

  // Estado para la información del torneo
  const [tournamentInfo, setTournamentInfo] = useState<any>(null);

  // Estado para los jugadores del torneo
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  
  // Estado para el filtro de jugadores
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // Estado para el diálogo de confirmación de finalización
  const [finishTournamentDialogOpen, setFinishTournamentDialogOpen] = useState(false);
  const [finishingTournament, setFinishingTournament] = useState(false);

  // Estado para el diálogo de agregar jugador
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingPlayer, setAddingPlayer] = useState(false);
  
  // Filtrar jugadores según el switch
  const activePlayers = players.filter(p => p.is_active && !p.is_eliminated);
  const filteredPlayers = showOnlyActive ? activePlayers : players;

  // Cargar información del torneo
  useEffect(() => {
    const loadTournamentInfo = async () => {
      try {
        const response = await tournamentService.getTournament(tournamentId);
        setTournamentInfo(response.tournament);
      } catch (error) {
        console.error('Error cargando información del torneo:', error);
      }
    };

    if (tournamentId) {
      loadTournamentInfo();
    }
  }, [tournamentId]);

  // Cargar jugadores del torneo - versión optimizada
  useEffect(() => {
    const loadPlayersData = async () => {
      if (!tournamentId || !isAdmin) return;

      setLoadingPlayers(true);
      try {
        const response = await playerService.getTournamentPlayers(tournamentId);
        setPlayers(response.players || []);
      } catch (error) {
        console.error('Error cargando jugadores:', error);
        setPlayers([]);
      } finally {
        setLoadingPlayers(false);
      }
    };

    loadPlayersData();
  }, [tournamentId, isAdmin]); // Solo estas dependencias

  // Mantener loadPlayers para uso manual
  const loadPlayers = useCallback(async () => {
    if (!tournamentId || !isAdmin) return;

    setLoadingPlayers(true);
    try {
      const response = await playerService.getTournamentPlayers(tournamentId);
      setPlayers(response.players || []);
    } catch (error) {
      console.error('Error cargando jugadores:', error);
      setPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  }, [tournamentId, isAdmin]);



  // Manejar pausa/reanudación
  const handleTogglePause = async () => {
    if (clockState?.is_paused) {
      await resumeClock();
    } else {
      await pauseClock();
    }
  };

  // Manejar siguiente nivel
  const handleNextLevel = useCallback(async () => {
    if (!clockState) return;

    const newLevel = clockState.current_level + 1;
    console.log(`➡️ Cambiando al siguiente nivel: ${clockState.current_level} → ${newLevel}`);

    if (isAdmin) {
      // Administrador: cambiar nivel en el servidor
      try {
        const response = await fetch(API_URLS.CLOCK.LEVEL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tournamentId,
            newLevel: newLevel
          })
        });

        if (!response.ok) {
          throw new Error('Error al cambiar al siguiente nivel');
        }

        const data = await response.json();
        console.log('✅ Siguiente nivel establecido por admin:', data);

        // Mostrar mensaje específico si el reloj se mantiene pausado
        if (data.is_paused) {
          console.log('⏸️ Reloj mantenido pausado después del cambio de nivel');
        }

        // Sincronizar inmediatamente el estado del reloj con el servidor
        if (data.success && data.new_level && data.new_time_seconds) {
          console.log('✅ Estado del servidor actualizado correctamente');
          console.log(`   Nuevo nivel: ${data.new_level}, Nuevo tiempo: ${data.new_time_seconds}s`);

          // Forzar sincronización inmediata del reloj
          if (reconnect) {
            console.log('🔄 Sincronizando estado del reloj inmediatamente...');
            await reconnect();
          }
        }

      } catch (error) {
        console.error('❌ Error cambiando al siguiente nivel:', error);
        // Aquí podrías mostrar una notificación de error al usuario
      }
    } else {
      // Usuario normal: solo actualizar estado local
      console.log('👤 Usuario normal cambiando nivel localmente (no afecta servidor)');

      // Actualizar estado local para mostrar el cambio visual
      const newTime = 1200; // 20 minutos por defecto
      setClockState(prev => {
        if (!prev) return null;
        const newState = {
          ...prev,
          current_level: newLevel,
          time_remaining_seconds: newTime,
          last_updated: new Date().toISOString()
        };
        console.log(`🔄 Estado local actualizado: Nivel ${newLevel}, ${newTime}s`);
        return newState;
      });

      // Notificar el cambio de nivel
      if (handleLevelChanged) {
        handleLevelChanged({
          new_level: newLevel,
          new_time_seconds: newTime,
          local_change: true // Indicar que es un cambio local
        });
      }
    }
  }, [clockState, isAdmin, tournamentId, reconnect, handleLevelChanged, setClockState]);

  // Manejar finalización del torneo
  const handleFinishTournament = async () => {
    if (!tournamentId || !isAdmin) return;

    setFinishingTournament(true);
    try {
      console.log('🔄 Intentando finalizar torneo:', tournamentId);
      
      await tournamentService.finishTournament(tournamentId);
      
      console.log('✅ Torneo finalizado exitosamente');
      
      // Mostrar mensaje de éxito y redirigir
      alert('🎉 Torneo finalizado exitosamente');
      
      // Redirigir a la lista de torneos
      navigate('/tournaments');
    } catch (error) {
      console.error('❌ Error finalizando torneo:', error);
      alert(`❌ Error al finalizar el torneo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setFinishingTournament(false);
      setFinishTournamentDialogOpen(false);
    }
  };

  // Manejar nivel anterior
  const handlePreviousLevel = async () => {
    if (!clockState || clockState.current_level <= 1) return;

    const newLevel = clockState.current_level - 1;
    console.log(`⬅️ Cambiando al nivel anterior: ${clockState.current_level} → ${newLevel}`);

    if (isAdmin) {
      // Administrador: cambiar nivel en el servidor
      try {
        const response = await fetch(API_URLS.CLOCK.LEVEL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tournamentId,
            newLevel: newLevel
          })
        });

        if (!response.ok) {
          throw new Error('Error al cambiar al nivel anterior');
        }

        const data = await response.json();
        console.log('✅ Nivel anterior establecido por admin:', data);

        // Mostrar mensaje específico si el reloj se mantiene pausado
        if (data.is_paused) {
          console.log('⏸️ Reloj mantenido pausado después del cambio de nivel');
        }

        // Sincronizar inmediatamente el estado del reloj con el servidor
        if (data.success && data.new_level && data.new_time_seconds) {
          console.log('✅ Estado del servidor actualizado correctamente');
          console.log(`   Nuevo nivel: ${data.new_level}, Nuevo tiempo: ${data.new_time_seconds}s`);

          // Forzar sincronización inmediata del reloj
          if (reconnect) {
            console.log('🔄 Sincronizando estado del reloj inmediatamente...');
            await reconnect();
          }
        }

      } catch (error) {
        console.error('❌ Error cambiando al nivel anterior:', error);
        // Aquí podrías mostrar una notificación de error al usuario
      }
    } else {
      // Usuario normal: solo actualizar estado local
      console.log('👤 Usuario normal cambiando nivel localmente (no afecta servidor)');

      // Actualizar estado local para mostrar el cambio visual
      const newTime = 1200; // 20 minutos por defecto
      setClockState(prev => {
        if (!prev) return null;
        const newState = {
          ...prev,
          current_level: newLevel,
          time_remaining_seconds: newTime,
          last_updated: new Date().toISOString(),
          is_paused: true // Mantener pausado cuando se va al nivel anterior
        };
        console.log(`🔄 Estado local actualizado: Nivel ${newLevel}, ${newTime}s (pausado)`);
        return newState;
      });

      // Notificar el cambio de nivel
      if (handleLevelChanged) {
        handleLevelChanged({
          new_level: newLevel,
          new_time_seconds: newTime,
          is_paused: true,
          local_change: true // Indicar que es un cambio local
        });
      }
    }
  };

  // Funciones para manejar acciones de jugadores
  const handleConfirmRegistration = async (playerId: string) => {
    try {
      // Confirmar inscripción con registro del admin
      console.log('🔄 Intentando confirmar inscripción:', {
        playerId,
        initial_chips: tournamentInfo?.initial_chips || 0,
        userId: user?.id,
        userName: user?.name,
        isAuthenticated: !!user
      });

      if (!user?.id) {
        throw new Error('Usuario no autenticado - no se puede confirmar la inscripción');
      }

      await fetch(`${API_BASE_URL}/api/players/${playerId}/confirm-registration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          initial_chips: tournamentInfo?.initial_chips || 0,
          admin_user_id: user.id
        })
      });

      // Recargar la lista de jugadores
      await loadPlayers();
      console.log('✅ Inscripción confirmada para jugador:', playerId, 'por admin:', user?.name);
    } catch (error) {
      console.error('❌ Error confirmando inscripción:', error);
      // Aquí podrías mostrar una notificación de error
    }
  };

  const handleRebuy = async (playerId: string, amount: number, chips: number) => {
    try {
      console.log('🔄 Intentando registrar rebuy:', {
        playerId,
        amount,
        chips,
        userId: user?.id,
        userName: user?.name,
        isAuthenticated: !!user
      });

      if (!user?.id) {
        throw new Error('Usuario no autenticado - no se puede registrar el rebuy');
      }

      await rebuyService.registerRebuy(playerId, {
        amount,
        chips_received: chips,
        admin_user_id: user.id
      });
      // Recargar la lista de jugadores para actualizar las fichas
      await loadPlayers();
      console.log('✅ Recompra registrada para jugador:', playerId, 'por admin:', user?.name);
    } catch (error) {
      console.error('❌ Error registrando recompra:', error);
      // Aquí podrías mostrar una notificación de error
    }
  };

  const handleAddon = async (playerId: string, amount: number, chips: number) => {
    try {
      console.log('🔄 Intentando registrar addon:', {
        playerId,
        amount,
        chips,
        userId: user?.id,
        userName: user?.name,
        isAuthenticated: !!user
      });

      if (!user?.id) {
        throw new Error('Usuario no autenticado - no se puede registrar el addon');
      }

      await addonService.registerAddon(playerId, {
        amount,
        chips_received: chips,
        admin_user_id: user.id
      });
      // Recargar la lista de jugadores para actualizar las fichas
      await loadPlayers();
      console.log('✅ Addon registrado para jugador:', playerId, 'por admin:', user?.name);
    } catch (error) {
      console.error('❌ Error registrando addon:', error);
      // Aquí podrías mostrar una notificación de error
    }
  };

  const handleEliminate = async (playerId: string, position: number, points: number) => {
    try {
      console.log('🔄 Intentando eliminar jugador:', {
        playerId,
        position,
        points,
        userId: user?.id,
        userName: user?.name,
        isAuthenticated: !!user
      });

      if (!user?.id) {
        throw new Error('Usuario no autenticado - no se puede eliminar el jugador');
      }

      console.log('📤 Llamando a playerService.eliminatePlayer con:', {
        playerId,
        position,
        eliminatedBy: user.id,
        pointsEarned: points
      });

      const result = await playerService.eliminatePlayer(playerId, position, user.id, points);
      
      console.log('📥 Respuesta del servicio:', result);
      
      // Recargar la lista de jugadores
      await loadPlayers();
      console.log('✅ Jugador eliminado:', playerId, 'Posición:', position, 'Puntos:', points, 'por admin:', user?.name);
    } catch (error) {
      console.error('❌ Error eliminando jugador:', error);
      // Aquí podrías mostrar una notificación de error
    }
  };

  const handleCancelRegistration = async (playerId: string) => {
    try {
      await playerService.removePlayer(playerId);
      // Recargar la lista de jugadores
      await loadPlayers();
      console.log('✅ Inscripción anulada para jugador:', playerId, 'por admin:', user?.name);
    } catch (error) {
      console.error('❌ Error anulando inscripción:', error);
      // Aquí podrías mostrar una notificación de error
    }
  };

  const handleUpdateChips = async (playerId: string, chips: number) => {
    try {
      await playerService.updatePlayerChips(playerId, chips);
      // Recargar la lista de jugadores
      await loadPlayers();
      console.log('✅ Fichas actualizadas para jugador:', playerId, 'Fichas:', chips, 'por admin:', user?.name);
    } catch (error) {
      console.error('❌ Error actualizando fichas:', error);
      // Aquí podrías mostrar una notificación de error
    }
  };

  // Función para navegar al reporte de ingresos por administrador
  const handleGoToIncomeReport = () => {
    navigate(`/reports/admin-income/${tournamentId}`);
  };

  // Cargar usuarios disponibles para agregar al torneo
  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error cargando usuarios');
      }

      const data = await response.json();
      
      // Filtrar usuarios que no están ya en el torneo
      const playerUserIds = players.map(p => p.user_id);
      const availableUsers = data.users.filter((user: any) => !playerUserIds.includes(user.id));
      
      setAvailableUsers(availableUsers);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Manejar agregar jugador al torneo
  const handleAddPlayer = async () => {
    if (!selectedUserId || !tournamentInfo) return;

    setAddingPlayer(true);
    try {
      console.log('🔄 Agregando jugador al torneo:', {
        selectedUserId,
        tournamentId,
        entryFee: tournamentInfo.entry_fee,
        initialChips: tournamentInfo.initial_chips,
        userId: user?.id,
        userName: user?.name
      });

      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      await playerService.addPlayerToTournament(tournamentId, {
        user_id: selectedUserId,
        entry_fee_paid: tournamentInfo.entry_fee,
        initial_chips: tournamentInfo.initial_chips
      });

      // Recargar la lista de jugadores
      await loadPlayers();
      
      // Cerrar diálogo y limpiar estado
      setAddPlayerDialogOpen(false);
      setSelectedUserId('');
      
      console.log('✅ Jugador agregado exitosamente al torneo');
    } catch (error) {
      console.error('❌ Error agregando jugador:', error);
      alert(`Error agregando jugador: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setAddingPlayer(false);
    }
  };

  // Calcular progreso del tiempo (simplificado)
  const getTimeProgress = (): number => {
    if (!clockInfo) return 0;
    // Asumiendo que cada nivel dura 30 segundos para mejor visualización
    const totalTime = 30;
    const elapsed = totalTime - clockInfo.timeRemaining;
    return Math.max(0, Math.min(100, (elapsed / totalTime) * 100));
  };

  // Sistema de sonidos
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedSecondRef = useRef<number>(-1);
  const lastLevelEndedRef = useRef<boolean>(false);

  // Inicializar y activar AudioContext
  const initAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Activar el AudioContext si está suspendido (requerido por navegadores modernos)
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        console.log('🎵 AudioContext activado');
      } catch (error) {
        console.warn('Error activando AudioContext:', error);
      }
    }

    return audioContextRef.current;
  }, []);

  // Función para reproducir bip normal (últimos 10 segundos)
  const playTickSound = useCallback(async (frequency: number = 800, duration: number = 100) => {
    try {
      const audioContext = await initAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Error reproduciendo sonido:', error);
    }
  }, [initAudioContext]);

  // Función para reproducir secuencia de fin de nivel (4 bips cortos + 1 largo)
  const playLevelEndSequence = useCallback(async () => {
    try {
      const audioContext = await initAudioContext();

      // Función para crear un bip individual
      const createBeep = (frequency: number, duration: number, delay: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);

        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + duration);
      };

      // 4 bips cortos cada medio segundo (500ms)
      for (let i = 0; i < 4; i++) {
        createBeep(800, 0.1, i * 0.5); // Frecuencia 800Hz, duración 100ms
      }

      // 5to bip más largo y agudo después de 2 segundos
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.8);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
      }, 2000);

    } catch (error) {
      console.warn('Error reproduciendo secuencia de fin de nivel:', error);
    }
  }, [initAudioContext]);

  // Función para activar sonidos (llamada por interacción del usuario)
  const enableSounds = useCallback(async () => {
    try {
      await initAudioContext();
      console.log('🎵 Sonidos activados por interacción del usuario');
    } catch (error) {
      console.warn('Error activando sonidos:', error);
    }
  }, [initAudioContext]);

  // Efecto para manejar sonidos del reloj
  useEffect(() => {
    if (!clockState || clockState.is_paused) return;

    const currentSecond = clockState.time_remaining_seconds;

    // Detectar cuando el reloj llegue a cero (fin del nivel)
    if (currentSecond === 2 && !lastLevelEndedRef.current) {
      console.log('🎵 Nivel terminado - reproduciendo secuencia de fin de nivel');
      playLevelEndSequence();
      lastLevelEndedRef.current = true;

      // Avanzar automáticamente al siguiente nivel sin esperar sincronización
      console.log('🔄 Avanzando automáticamente al siguiente nivel...');
      setTimeout(() => {
        handleNextLevel();
      }, 1000); // Pequeño delay para que se complete la secuencia de sonidos
    }

    // Reset del flag cuando el tiempo se reinicia (nuevo nivel)
    if (currentSecond > 0) {
      lastLevelEndedRef.current = false;
    }

    // Reproducir bip en los últimos 10 segundos (excepto el segundo 0)
    if (currentSecond <= 10 && currentSecond !== lastPlayedSecondRef.current && currentSecond > 0) {
      console.log(`🎵 Bip en ${currentSecond} segundos`);
      playTickSound();
      lastPlayedSecondRef.current = currentSecond;
    }

    // Reset cuando el tiempo se reinicia
    if (currentSecond > 10) {
      lastPlayedSecondRef.current = -1;
    }

  }, [clockState, playTickSound, playLevelEndSequence, handleNextLevel]);



  if (error) {
    return (
      <Card sx={{ maxWidth: 400, mx: 'auto', mt: 2 }}>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Error de conexión: {error}
          </Alert>
          {isAdmin && (
            <Button
              variant="outlined"
              color="primary"
              onClick={reconnect}
              fullWidth
            >
              Reintentar conexión
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }



  if (!clockState) {
    return (
      <Card sx={{ maxWidth: 400, mx: 'auto', mt: 2 }}>
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            No hay reloj activo para este torneo
          </Alert>

        </CardContent>
      </Card>
    );
  }

    return (
    <Card
      className="tournament-clock-card"
      sx={{
        mb: 3,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
      onClick={enableSounds}
    >
      <CardContent>
        {/* Header con información de conexión y nivel */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" component="h2">
              Reloj del Torneo
            </Typography>
            <Box display="flex" gap={1} mt={1}>
              <Chip
                label={`Nivel ${clockState.current_level}`}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
          <Chip
            label={clockState.is_paused ? 'Pausado' : 'Activo'}
            color={clockState.is_paused ? 'warning' : 'success'}
            icon={clockState.is_paused ? <Pause /> : <PlayArrow />}
          />
        </Box>



        {/* Tiempo restante */}
        <Box textAlign="center" mb={3}>
          <Typography
            variant="h2"
            component="div"
            className={`clock-time-display ${clockInfo?.timeRemaining && clockInfo.timeRemaining <= 10 ? 'countdown-animation' : ''}`}
            sx={{
              fontWeight: 'bold',
              fontFamily: 'monospace',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              color: 'primary.main'
            }}
          >
            {clockInfo ? clockInfo.formattedTime : formatTime(clockState.time_remaining_seconds)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nivel {clockState.current_level} • {clockInfo?.timeRemaining || clockState.time_remaining_seconds}s restantes
            {clockInfo?.timeRemaining && clockInfo.timeRemaining <= 10 && (
              <span style={{ color: '#ff5722', fontWeight: 'bold' }}> ⚠️ ¡TIEMPO!</span>
            )}
          </Typography>

          {/* Barra de progreso simple */}
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={getTimeProgress()}
              className="clock-progress-bar"
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  backgroundColor: '#2196f3',
                  transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {Math.round(getTimeProgress())}% completado
            </Typography>
          </Box>
        </Box>

        {/* Controles mejorados (solo para admins) */}
        {isAdmin && (
          <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap" mb={2}>
            <Button
              variant="contained"
              startIcon={clockState.is_paused ? <PlayArrow /> : <Pause />}
              onClick={handleTogglePause}
              color={clockState.is_paused ? 'success' : 'warning'}
              size="large"
              disabled={!isConnected}
            >
              {clockState.is_paused ? 'Reanudar' : 'Pausar'}
            </Button>

            <Button
              variant="outlined"
              startIcon={<SkipPrevious />}
              onClick={handlePreviousLevel}
              color="secondary"
              disabled={!isConnected || !clockState.is_paused || clockState.current_level <= 1}
            >
              Nivel Anterior
            </Button>

            <Button
              variant="outlined"
              startIcon={<SkipNext />}
              onClick={handleNextLevel}
              color="secondary"
              disabled={!isConnected || !clockState.is_paused}
            >
              Siguiente Nivel
            </Button>

            <Button
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={() => navigate(`/tournament/${tournamentId}/rebuys`)}
              color="info"
              disabled={!isConnected}
              size="large"
              sx={{
                border: '2px solid',
                borderColor: 'info.main',
                '&:hover': {
                  backgroundColor: 'info.dark',
                  borderColor: 'info.dark'
                },
                position: 'relative'
              }}
            >
              Gestionar Recompras
              {players.filter(p => p.is_active).length > 0 && (
                <Chip
                  size="small"
                  label={players.filter(p => p.is_active).length}
                  color="secondary"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    minWidth: 24,
                    height: 24,
                    fontSize: '0.75rem'
                  }}
                />
              )}
            </Button>

            <Button
              variant="contained"
              startIcon={<Stop />}
              onClick={() => setFinishTournamentDialogOpen(true)}
              color="error"
              disabled={!isConnected}
              sx={{
                border: '2px solid',
                borderColor: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.dark',
                  borderColor: 'error.dark'
                }
              }}
            >
              Terminar Torneo
            </Button>
          </Box>
        )}

        {/* Información adicional para usuarios no admin */}
        {!isAdmin && (
          <Box textAlign="center" mb={2}>
            <Typography variant="body2" color="text.secondary">
              {clockState.is_paused
                ? '⏸️ El torneo está pausado'
                : '▶️ El torneo está activo - cambio automático de nivel activado'
              }
            </Typography>
          </Box>
        )}





        {/* Niveles Configurados */}
        {tournamentInfo?.blind_structure && tournamentInfo.blind_structure.length > 0 && (
          <Box mt={2}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', color: 'primary.main' }}>
              Niveles de Ciegas
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 300, mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nivel</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Small Blind</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Big Blind</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Duración</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tournamentInfo.blind_structure.map((level: any, index: number) => {
                    const levelNumber = index + 1;
                    const isCurrentLevel = clockState?.current_level === levelNumber;
                    const isPastLevel = clockState?.current_level > levelNumber;

                    // Formatear duración en minutos y segundos
                    const formatDuration = (minutes: number) => {
                      const totalSeconds = minutes * 60;
                      const mins = Math.floor(totalSeconds / 60);
                      const secs = totalSeconds % 60;
                      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
                    };

                    return (
                      <TableRow
                        key={levelNumber}
                        sx={{
                          backgroundColor: isCurrentLevel
                            ? 'rgba(76, 175, 80, 0.1)'
                            : isPastLevel
                            ? 'rgba(158, 158, 158, 0.1)'
                            : 'transparent',
                          '&:hover': {
                            backgroundColor: isCurrentLevel
                              ? 'rgba(76, 175, 80, 0.2)'
                              : 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={isCurrentLevel ? 'bold' : 'normal'}>
                              {levelNumber}
                            </Typography>
                            {isCurrentLevel && <Chip label="ACTUAL" color="success" size="small" />}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={isCurrentLevel ? 'bold' : 'normal'}>
                            {level.small_blind || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={isCurrentLevel ? 'bold' : 'normal'}>
                            {level.big_blind || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={isCurrentLevel ? 'bold' : 'normal'}>
                            {formatDuration(level.duration_minutes || 20)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {level.is_pause ? (
                            <Box display="flex" flexDirection="column" gap={0.5}>
                              <Chip
                                label="PAUSA"
                                color="warning"
                                size="small"
                                variant="filled"
                              />
                              {level.addons_allowed && (
                                <Chip
                                  label="ADDONS"
                                  color="info"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          ) : (
                            <Chip
                              label="JUEGO"
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              isCurrentLevel ? 'En Progreso' :
                              isPastLevel ? 'Completado' : 'Pendiente'
                            }
                            color={
                              isCurrentLevel ? 'success' :
                              isPastLevel ? 'default' : 'warning'
                            }
                            size="small"
                            variant={isCurrentLevel ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
              Total de niveles: {tournamentInfo.blind_structure.length}
            </Typography>
          </Box>
        )}

        {/* Lista de Jugadores - Solo para Administradores */}
        {isAdmin && (
          <Box mt={3}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <People />
                Jugadores del Torneo ({filteredPlayers.length})
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAdd />}
                  onClick={() => {
                    loadAvailableUsers();
                    setAddPlayerDialogOpen(true);
                  }}
                  color="success"
                >
                  Agregar Jugador
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={loadPlayers}
                  disabled={loadingPlayers}
                >
                  {loadingPlayers ? 'Cargando...' : 'Actualizar'}
                </Button>
              </Box>
            </Box>

            {/* Filtro de jugadores */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="body2" color="text.secondary">
                Mostrando {filteredPlayers.length} de {players.length} jugadores
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyActive}
                    onChange={(e) => setShowOnlyActive(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2">
                      {showOnlyActive ? 'Solo activos' : 'Todos los jugadores'}
                    </Typography>
                    <Chip 
                      label={showOnlyActive ? `${activePlayers.length} activos` : `${players.length} total`}
                      size="small"
                      color={showOnlyActive ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Stack>
                }
              />
            </Box>

            {loadingPlayers ? (
              <Box textAlign="center" py={3}>
                <Typography variant="body2" color="text.secondary">
                  Cargando jugadores...
                </Typography>
              </Box>
            ) : players.length === 0 ? (
              <Box textAlign="center" py={3}>
                <Typography variant="body2" color="text.secondary">
                  No hay jugadores registrados en este torneo
                </Typography>
              </Box>
            ) : filteredPlayers.length === 0 ? (
              <Box textAlign="center" py={3}>
                <Typography variant="body2" color="text.secondary">
                  {showOnlyActive ? 'No hay jugadores activos en este momento' : 'No hay jugadores para mostrar'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                {filteredPlayers.map((player) => (
                  <PlayerListItem
                    key={player.id}
                    player={player}
                    tournament={tournamentInfo}
                    tournamentConfig={{
                      entry_fee: tournamentInfo?.entry_fee || 0,
                      rebuy_chips: tournamentInfo?.rebuy_chips || 0,
                      addon_chips: tournamentInfo?.addon_chips || 0,
                    }}
                    clock={clockState ? { ...clockState, total_pause_time_seconds: clockState.total_pause_time_seconds || 0 } : null}
                    onConfirmRegistration={handleConfirmRegistration}
                    onRebuy={handleRebuy}
                    onAddon={handleAddon}
                    onEliminate={handleEliminate}
                    onCancelRegistration={handleCancelRegistration}
                    onUpdateChips={handleUpdateChips}
                    totalPlayers={players.length}
                    eliminatedPlayers={players.filter(p => p.is_eliminated).length}
                  />
                ))}
              </Box>
            )}

            {/* Estadísticas rápidas */}
            {players.length > 0 && (
              <Box mt={2} p={2} sx={{ backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Estadísticas del Torneo
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Chip
                    label={`Total: ${players.length}`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Activos: ${players.filter(p => p.is_active).length}`}
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Eliminados: ${players.filter(p => p.is_eliminated).length}`}
                    color="error"
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Inactivos: ${players.filter(p => !p.is_active && !p.is_eliminated).length}`}
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
            )}

            {/* Botón de reporte de ingresos por administrador */}
            <Box mt={2} p={2} sx={{ backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                📊 Reporte de Ingresos por Administrador
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ver resumen detallado de dinero cobrado por cada administrador en este torneo
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Assessment />}
                onClick={handleGoToIncomeReport}
                fullWidth
                size="large"
                sx={{ fontSize: '1rem', py: 1.5 }}
              >
                Ver Reporte de Ingresos
              </Button>
            </Box>
          </Box>
        )}

        {/* Diálogo para agregar jugador al torneo */}
        <Dialog
          open={addPlayerDialogOpen}
          onClose={() => setAddPlayerDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: 'success.main', fontWeight: 'bold' }}>
            👥 Agregar Jugador al Torneo
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={3} pt={1}>
              <TextField
                select
                label="Seleccionar Usuario"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                fullWidth
                disabled={loadingUsers}
                helperText={loadingUsers ? 'Cargando usuarios...' : 'Selecciona un usuario para agregar al torneo'}
              >
                {availableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} {user.nickname && `(@${user.nickname})`} - {user.email}
                  </MenuItem>
                ))}
              </TextField>

              {tournamentInfo && (
                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    Configuración del Torneo:
                  </Typography>
                  <Typography variant="body2">
                    • Cuota de entrada: €{tournamentInfo.entry_fee}
                  </Typography>
                  <Typography variant="body2">
                    • Fichas iniciales: {tournamentInfo.initial_chips?.toLocaleString()}
                  </Typography>
                </Box>
              )}

              {availableUsers.length === 0 && !loadingUsers && (
                <Alert severity="info">
                  No hay usuarios disponibles para agregar al torneo. Todos los usuarios ya están registrados.
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setAddPlayerDialogOpen(false)}
              variant="outlined"
              color="primary"
              disabled={addingPlayer}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddPlayer}
              variant="contained"
              color="success"
              disabled={!selectedUserId || addingPlayer}
              startIcon={<PersonAdd />}
            >
              {addingPlayer ? 'Agregando...' : 'Agregar Jugador'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de confirmación para terminar torneo */}
        <Dialog
          open={finishTournamentDialogOpen}
          onClose={() => setFinishTournamentDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
            ⚠️ Confirmar Finalización del Torneo
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              ¿Estás seguro de que quieres <strong>TERMINAR</strong> este torneo?
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                ⚠️ ATENCIÓN: Esta acción NO se puede revertir
              </Typography>
              <Typography variant="body2">
                • El torneo se marcará como finalizado permanentemente
              </Typography>
              <Typography variant="body2">
                • No se podrán realizar más operaciones en este torneo
              </Typography>
              <Typography variant="body2">
                • Se generará el reporte final de resultados
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Si estás seguro, haz clic en "SÍ, TERMINAR TORNEO". De lo contrario, cancela esta operación.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setFinishTournamentDialogOpen(false)}
              variant="outlined"
              color="primary"
              disabled={finishingTournament}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFinishTournament}
              variant="contained"
              color="error"
              disabled={finishingTournament}
              startIcon={<Stop />}
              sx={{
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'error.dark'
                }
              }}
            >
              {finishingTournament ? 'Finalizando...' : 'SÍ, TERMINAR TORNEO'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TournamentClock;