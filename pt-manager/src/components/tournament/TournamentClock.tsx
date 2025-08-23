import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as SkipNextIcon,
  Timer as TimerIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import { Tournament, TournamentClock as TournamentClockType, BlindLevel } from '../../types';
import { clockService } from '../../services/apiService';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';

interface TournamentClockProps {
  tournament: Tournament;
  clock: TournamentClockType | null;
}

const TournamentClock: React.FC<TournamentClockProps> = ({ tournament, clock }) => {
  const { togglePause, loadClock, finishTournament } = useTournamentStore();
  const { user } = useAuthStore();
  const isAdmin = !!user?.is_admin;

  const parseAsUtc = (isoLike: string | null | undefined): Date | null => {
    if (!isoLike) return null;
    const str = isoLike.endsWith('Z') ? isoLike : `${isoLike}Z`;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const computeDerivedTime = useCallback((c: TournamentClockType | null): number => {
    if (!c) return 0;
    if (c.is_paused || !c.last_updated) return c.time_remaining_seconds;
    const lastUpdatedDate = parseAsUtc(c.last_updated);
    const elapsed = lastUpdatedDate
      ? Math.floor((Date.now() - lastUpdatedDate.getTime()) / 1000)
      : 0;
    return Math.max(0, c.time_remaining_seconds - elapsed);
  }, []);

  const [localTime, setLocalTime] = useState<number>(computeDerivedTime(clock));
  const [isRunning, setIsRunning] = useState<boolean>(!!clock && !clock.is_paused);
  const autoAdvanceTriggeredRef = useRef<boolean>(false);

  // Efecto para sincronizar el reloj local con el backend
  useEffect(() => {
    if (clock) {
      setLocalTime(clock.time_remaining_seconds);
      setIsRunning(!clock.is_paused);
      // Resetear trigger de auto-avance al cambiar el reloj/nivel
      autoAdvanceTriggeredRef.current = false;
    }
  }, [clock, computeDerivedTime]);

  // Contador local para mostrar el tiempo en tiempo real
  useEffect(() => {
    if (!isRunning || localTime <= 0) return;

    const interval = setInterval(() => {
      setLocalTime(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, localTime]);

  const handleTogglePause = async () => {
    try {
      // Log sólo cuando vamos a reanudar
      if (!isRunning) {
        const nowIso = new Date().toISOString();
        // eslint-disable-next-line no-console
        console.log('▶️ Reanudar reloj (frontend)', {
          now: nowIso,
          last_updated: clock?.last_updated,
          time_remaining_seconds: clock?.time_remaining_seconds
        });
      }
      await togglePause(tournament.id);
    } catch (error) {
      console.error('Error toggle pause:', error);
    }
  };

  const handleNextLevel = useCallback(async () => {
    if (!clock || !tournament.blind_structure) return;

    const nextLevel = clock.current_level + 1;
    const nextBlindLevel = tournament.blind_structure[nextLevel - 1];

    if (nextBlindLevel) {
      try {
        await clockService.updateTournamentClock(tournament.id, {
          current_level: nextLevel,
          time_remaining_seconds: nextBlindLevel.duration_minutes * 60,
          is_paused: false
        });
        // Recargar reloj desde el backend para sincronizar
        await loadClock(tournament.id);
      } catch (error) {
        console.error('Error next level:', error);
      }
    }
  }, [clock, tournament.blind_structure, tournament.id, loadClock]);

  const handlePrevLevel = async () => {
    if (!clock || !tournament.blind_structure) return;

    const prevLevel = Math.max(1, clock.current_level - 1);
    const prevBlindLevel = tournament.blind_structure[prevLevel - 1];

    if (prevBlindLevel) {
      try {
        await clockService.updateTournamentClock(tournament.id, {
          current_level: prevLevel,
          time_remaining_seconds: prevBlindLevel.duration_minutes * 60,
          is_paused: false
        });
        await loadClock(tournament.id);
      } catch (error) {
        console.error('Error prev level:', error);
      }
    }
  };

  const handleFinishTournament = async () => {
    try {
      await finishTournament(tournament.id);
      await loadClock(tournament.id);
    } catch (error) {
      console.error('Error finish tournament:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const getCurrentBlindLevel = (): BlindLevel | null => {
    if (!tournament.blind_structure || !clock) return null;
    return tournament.blind_structure[clock.current_level - 1] || null;
  };

  const getNextBlindLevel = (): BlindLevel | null => {
    if (!tournament.blind_structure || !clock) return null;
    return tournament.blind_structure[clock.current_level] || null;
  };

  const getTimeProgress = (): number => {
    const currentLevel = getCurrentBlindLevel();
    if (!currentLevel) return 0;
    
    const totalTime = currentLevel.duration_minutes * 60;
    const elapsed = totalTime - localTime;
    return (elapsed / totalTime) * 100;
  };

  const currentLevel = getCurrentBlindLevel();
  const nextLevel = getNextBlindLevel();

  // Sonidos de cuenta regresiva y cambio de nivel
  useEffect(() => {
    if (!isRunning || localTime <= 0) return;
    // últimos 10s: beep por segundo
    if (localTime <= 10) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.stop(ctx.currentTime + 0.22);
    }
    if (localTime === 0 && !autoAdvanceTriggeredRef.current) {
      // Sonido más agudo y de 2 segundos al finalizar el nivel
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        const start = ctx.currentTime;
        // tono agudo sostenido
        osc.frequency.setValueAtTime(1200, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.6, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 2.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(start + 2.0);
      } catch (_) {}

      // Auto-avanzar al siguiente nivel una vez
      autoAdvanceTriggeredRef.current = true;
      (async () => {
        try {
          await handleNextLevel();
        } catch (e) {
          // noop
        }
      })();
    }
  }, [localTime, isRunning, handleNextLevel]);

  if (!clock || !currentLevel) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Reloj del Torneo
          </Typography>
          <Typography color="text.secondary">
            Reloj no inicializado
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <TimerIcon />
        Reloj del Torneo
      </Typography>

      <Grid container spacing={3}>
        {/* Tiempo restante */}
        <Grid size={{xs: 12, md: 6}}>
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Typography variant="h3" component="div" color="primary.main">
                  {formatTime(localTime)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Tiempo restante
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={getTimeProgress()} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box display="flex" justifyContent="center" gap={1} mt={2}>
                  {isAdmin && (
                    <Button
                      variant="contained"
                      startIcon={isRunning ? <PauseIcon /> : <PlayIcon />}
                      onClick={handleTogglePause}
                      color={isRunning ? "warning" : "success"}
                    >
                      {isRunning ? 'Pausar' : 'Reanudar'}
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      variant="outlined"
                      onClick={handlePrevLevel}
                    >
                      Nivel Anterior
                    </Button>
                  )}
                  {isAdmin && nextLevel && (
                    <Button
                      variant="outlined"
                      startIcon={<SkipNextIcon />}
                      onClick={handleNextLevel}
                    >
                      Siguiente Nivel
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<StopIcon />}
                      onClick={handleFinishTournament}
                      disabled={tournament.status === 'finished'}
                    >
                      Finalizar Torneo
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Nivel actual */}
        <Grid size={{xs: 12, md: 6}}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Nivel {clock.current_level}
                </Typography>
                <Chip 
                  label={isRunning ? "En curso" : "Pausado"} 
                  color={isRunning ? "success" : "warning"}
                  size="small"
                />
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Small Blind:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(currentLevel.small_blind)}
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Big Blind:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(currentLevel.big_blind)}
                </Typography>
              </Box>
              
              {currentLevel.antes && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Ante:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(currentLevel.antes)}
                  </Typography>
                </Box>
              )}

              {nextLevel && (
                <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider">
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Próximo nivel:
                  </Typography>
                  <Typography variant="body2">
                    {formatCurrency(nextLevel.small_blind)} / {formatCurrency(nextLevel.big_blind)}
                    {nextLevel.antes ? ` (${formatCurrency(nextLevel.antes)})` : ''}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TournamentClock;