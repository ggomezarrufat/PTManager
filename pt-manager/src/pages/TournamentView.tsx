import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  PlayArrow as PlayArrowIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useTournamentStore } from '../store/tournamentStore';
import { useAuthStore } from '../store/authStore';
import { getUserDisplayName } from '../utils/userUtils';
import { isValidUUID } from '../utils/validation';
import TournamentClock from '../components/tournament/TournamentClock';
import { BlindLevel } from '../types';
import { playerService, tournamentService } from '../services/apiService';
import { TextField } from '@mui/material';

const TournamentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const editResults = query.get('edit') === 'results';
  const [saving, setSaving] = useState(false);
  const {
    currentTournament,
    players,
    clock,
    loading,
    error,
    loadTournament,
    setPlayers,
    loadPlayers,
    startTournament
  } = useTournamentStore();

  // Cargar torneo al montar
  useEffect(() => {
    if (id && isValidUUID(id)) {
      loadTournament(id);
    } else {
      navigate('/dashboard');
    }
  }, [id, loadTournament, navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatChips = (chips: number) => {
    return chips.toLocaleString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'finished': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programado';
      case 'active': return 'En Curso';
      case 'paused': return 'Pausado';
      case 'finished': return 'Finalizado';
      default: return status;
    }
  };

  const activePlayers = players.filter(p => p.is_active && !p.is_eliminated);
  const eliminatedPlayers = players.filter(p => p.is_eliminated).sort((a, b) => (a.final_position || 0) - (b.final_position || 0));
  const totalPrizePool = players.reduce((sum, p) => sum + p.entry_fee_paid, 0);

  const canEdit = !!user?.is_admin;

  const handleStartTournament = async () => {
    if (!currentTournament) return;
    try {
      await startTournament(currentTournament.id);
      // Recargar el torneo para actualizar el estado
      await loadTournament(currentTournament.id);
    } catch (error) {
      console.error('Error iniciando torneo:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentTournament) {
    return (
      <Box p={3}>
        <Alert severity="error">Torneo no encontrado</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            {currentTournament.name}
          </Typography>
            {currentTournament.description && (
          <Typography variant="body1" color="text.secondary">
            {currentTournament.description}
          </Typography>
            )}
          </Box>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <Chip 
            label={getStatusLabel(currentTournament.status)} 
            color={getStatusColor(currentTournament.status) as any}
            size="medium"
          />
          
          {canEdit && (
            <>
              {currentTournament.status === 'scheduled' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStartTournament}
                >
                  Iniciar Torneo
                </Button>
              )}
              
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => navigate(`/tournaments/${id}/manage`)}
              >
                Gestionar
              </Button>
            </>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Información del torneo */}
        <Grid size={{xs: 12, md: 4}}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <PersonIcon />
                Información del Torneo
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Fecha de inicio:
                  </Typography>
                  <Typography variant="body2">
                    {formatDateTime(currentTournament.scheduled_start_time)}
                  </Typography>
                </Box>
                
                {currentTournament.actual_start_time && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Inicio real:
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(currentTournament.actual_start_time)}
                    </Typography>
                  </Box>
                )}
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Máx. jugadores:
                  </Typography>
                  <Typography variant="body2">
                    {currentTournament.max_players}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Entry fee:
                  </Typography>
                  <Typography variant="body2">
                    {formatCurrency(currentTournament.entry_fee)}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Fichas iniciales:
                  </Typography>
                  <Typography variant="body2">
                    {formatChips(currentTournament.initial_chips)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Jugadores:
                  </Typography>
                  <Typography variant="body2">
                    {players.length} / {currentTournament.max_players}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Activos:
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {activePlayers.length}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Prize Pool:
                  </Typography>
                  <Typography variant="body2" color="primary.main" fontWeight="bold">
                    {formatCurrency(totalPrizePool)}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Hora actual:
                  </Typography>
                  <Typography variant="body2">
                    {new Date().toLocaleString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reloj del torneo */}
        {currentTournament.status === 'active' && (
          <Grid size={{xs: 12, md: 8}}>
            <Card>
              <CardContent>
                <TournamentClock
                  tournamentId={currentTournament.id}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Jugadores activos */}
        <Grid size={12}>
      <Card>
        <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <PersonIcon />
                Jugadores Activos ({activePlayers.length})
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Posición</TableCell>
                      <TableCell>Jugador</TableCell>
                      <TableCell align="right">Fichas</TableCell>
                      <TableCell align="right">Entry Fee</TableCell>
                      <TableCell align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activePlayers
                      .sort((a, b) => b.current_chips - a.current_chips)
                      .map((player, index) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            #{index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1">
                            {getUserDisplayName(player.user || null)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="bold">
                            {formatChips(player.current_chips)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(player.entry_fee_paid)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label="Activo" 
                            color="success" 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Resultados (editar cuando corresponde) */}
        {(eliminatedPlayers.length > 0 || editResults) && (
          <Grid size={12}>
            <Card>
                      <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <TrophyIcon />
                  {editResults ? 'Resultados del Torneo' : `Jugadores Eliminados (${eliminatedPlayers.length})`}
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Posición Final</TableCell>
                        <TableCell>Jugador</TableCell>
                        <TableCell align="right">Fichas Finales</TableCell>
                        <TableCell align="right">Entry Fee</TableCell>
                        <TableCell align="center">Puntos</TableCell>
                        {canEdit && editResults && (
                          <TableCell align="right">Acciones</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(editResults ? players : eliminatedPlayers).map((player) => (
                        <TableRow key={player.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {player.final_position === 1 && <TrophyIcon color="warning" />}
                              {canEdit && editResults ? (
                                <TextField
                                  type="number"
                                  size="small"
                                  value={player.final_position ?? ''}
                                  onChange={(e) => {
                                    const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                    const updated = players.map(p => p.id === player.id ? { ...p, final_position: value } : p);
                                    setPlayers(updated as any);
                                  }}
                                  inputProps={{ min: 1, style: { width: 80 } }}
                                />
                              ) : (
                                <Typography variant="body2" fontWeight="bold">
                                  #{player.final_position}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1">
                              {getUserDisplayName(player.user || null)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {formatChips(player.current_chips)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(player.entry_fee_paid)}
                          </TableCell>
                          <TableCell align="center">
                            {canEdit && editResults ? (
                              <TextField
                                type="number"
                              size="small"
                                value={player.points_earned ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                  const updated = players.map(p => p.id === player.id ? { ...p, points_earned: value } : p);
                                  setPlayers(updated as any);
                                }}
                                inputProps={{ min: 0, style: { width: 100 } }}
                              />
                            ) : (
                              <Typography variant="body2" fontWeight="bold" color="primary.main">
                                {player.points_earned}
                              </Typography>
                            )}
                          </TableCell>
                          {canEdit && editResults && (
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={async () => {
                                  try {
                                    setSaving(true);
                                    await playerService.updatePlayerResults(player.id, {
                                      final_position: player.final_position,
                                      points_earned: player.points_earned,
                                    });
                                    if (currentTournament?.id) {
                                      await loadPlayers(currentTournament.id);
                                    }
                                  } catch (e) {
                                    // noop visual simple, ya hay alert general
                                  } finally {
                                    setSaving(false);
                                  }
                                }}
                              >
                                Guardar
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {canEdit && editResults && (
                  <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
                    <Button
                      disabled={saving}
                      onClick={() => navigate(`/tournament/${id}`)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      disabled={saving}
                      variant="contained"
                      onClick={async () => {
                        try {
                          setSaving(true);
                          const results = players.map(p => ({
                            player_id: p.id,
                            final_position: p.final_position,
                            points_earned: p.points_earned,
                          }));
                          await tournamentService.updateTournamentResults(currentTournament.id, results);
                          if (currentTournament?.id) {
                            await loadPlayers(currentTournament.id);
                          }
                          navigate(`/tournament/${id}`);
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      Guardar todos
                    </Button>
            </Box>
          )}
                        </CardContent>
                      </Card>
          </Grid>
        )}

        {/* Estructura de blinds */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <TimerIcon />
                Estructura de Blinds
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nivel</TableCell>
                      <TableCell align="right">Small Blind</TableCell>
                      <TableCell align="right">Big Blind</TableCell>
                      <TableCell align="right">Antes</TableCell>
                      <TableCell align="right">Duración</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTournament.blind_structure?.map((level: BlindLevel, index: number) => (
                      <TableRow 
                        key={index}
                        sx={{ 
                          backgroundColor: clock?.current_level === level.level ? 'action.selected' : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            fontWeight={clock?.current_level === level.level ? 'bold' : 'normal'}
                          >
                            {level.level}
                            {clock?.current_level === level.level && ' (Actual)'}
              </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(level.small_blind)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(level.big_blind)}
                        </TableCell>
                        <TableCell align="right">
                          {level.antes ? formatCurrency(level.antes) : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {level.duration_minutes} min
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
        </CardContent>
      </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TournamentView; 