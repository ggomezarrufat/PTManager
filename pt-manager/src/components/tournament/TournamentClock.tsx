import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, Alert, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, Timer, RadioButtonChecked, RadioButtonUnchecked } from '@mui/icons-material';
import { useTournamentClock } from '../../hooks/useTournamentClock';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL, tournamentService } from '../../services/apiService';

interface TournamentClockProps {
  tournamentId: string;
}

const TournamentClock: React.FC<TournamentClockProps> = ({ tournamentId }) => {
  const { user } = useAuthStore();
  const isAdmin = !!user?.is_admin;

  const {
    clockState,
    isConnected,
    connectionStatus,
    error,
    formatTime,
    getClockInfo,
    pauseClock,
    resumeClock,
    adjustTime,
    reconnect
  } = useTournamentClock({
    tournamentId,
    userId: user?.id || '',
    onLevelChanged: (data) => {
      // Aquí puedes agregar notificaciones o sonidos
      // Por ejemplo: toast.success(`¡Nivel ${data.new_level} iniciado!`);
    },
    onTournamentEnded: (data) => {
      // Aquí puedes agregar notificaciones o redirecciones
      // Por ejemplo: navigate('/tournaments');
    }
  });

  // Obtener información adicional del reloj
  const clockInfo = getClockInfo();

  // Estado para la información del torneo
  const [tournamentInfo, setTournamentInfo] = useState<any>(null);

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



  // Manejar pausa/reanudación
  const handleTogglePause = async () => {
    if (clockState?.is_paused) {
      await resumeClock();
    } else {
      await pauseClock();
    }
  };

  // Manejar siguiente nivel
  const handleNextLevel = async () => {
    await adjustTime(0); // Esto activará el avance automático en el servidor
  };

  // Manejar nivel anterior
  const handlePreviousLevel = async () => {
    if (!clockState || clockState.current_level <= 1) return;

    try {
      // Llamada a la API para cambiar al nivel anterior usando el endpoint del reloj
      const response = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}/clock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          current_level: clockState.current_level - 1
        })
      });

      if (!response.ok) {
        throw new Error('Error al cambiar al nivel anterior');
      }

      // Nivel cambiado exitosamente
    } catch (error) {
      // Error al cambiar al nivel anterior
      // Aquí podrías mostrar una notificación de error al usuario
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

  // Función para obtener el color de conexión
  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  // Función para obtener el texto de conexión
  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Error de conexión';
      default: return 'Desconectado';
    }
  };

  // Función para obtener el icono de conexión
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <RadioButtonChecked color="success" />;
      case 'connecting': return <Timer color="warning" />;
      case 'error': return <RadioButtonUnchecked color="error" />;
      default: return <RadioButtonUnchecked />;
    }
  };

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

  if (!isConnected && connectionStatus === 'connecting') {
    return (
      <Card sx={{ maxWidth: 400, mx: 'auto', mt: 2 }}>
        <CardContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Timer />
              Conectando al servidor...
            </Box>
          </Alert>
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
          <Chip
            label={getConnectionText()}
            color={getConnectionColor()}
            variant="outlined"
          />
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
        overflow: 'hidden'
      }}
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
                label={getConnectionText()}
                color={getConnectionColor()}
                variant="outlined"
                size="small"
              />
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

        {/* Estado detallado de conexión */}
        <Box mt={2} textAlign="center">
          <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap" mb={1}>
            <Chip
              label={getConnectionText()}
              color={getConnectionColor()}
              size="small"
              variant="outlined"
              icon={getConnectionIcon()}
            />
            {isConnected && (
              <Chip
                label="WebSocket OK"
                color="success"
                size="small"
                variant="filled"
              />
            )}
            {connectionStatus === 'error' && (
              <Chip
                label="Error de conexión"
                color="error"
                size="small"
                variant="filled"
              />
            )}
          </Box>

          {connectionStatus !== 'connected' && (
            <Box mt={1}>
              <Button
                variant="outlined"
                color="primary"
                onClick={reconnect}
                size="small"
                disabled={connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting' ? '🔄 Conectando...' : '🔄 Reintentar conexión'}
              </Button>
            </Box>
          )}

          {error && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {error}
            </Typography>
          )}
        </Box>

        {/* Información del sistema automático */}
        <Box mt={2} p={2} sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.12)'
        }}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            🎯 <strong>Sistema Automático Activo:</strong> El reloj avanzará automáticamente
            al siguiente nivel cuando se agote el tiempo ({clockInfo?.timeRemaining || clockState.time_remaining_seconds}s)
          </Typography>
          <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ display: 'block', mt: 1 }}>
            Nivel actual: {clockState.current_level} | Próximo nivel: {clockState.current_level + 1}
          </Typography>
        </Box>

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
      </CardContent>
    </Card>
  );
};

export default TournamentClock;