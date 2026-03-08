import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  useTheme,
  useMediaQuery,
  Fab,
  Divider,
  Stack,
  Avatar,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Add as AddIcon,
  MonetizationOn as MoneyIcon,
  PersonOff as PersonOffIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Casino as CasinoIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  Edit as EditIcon,
  SortByAlpha as SortByNameIcon,
  EmojiEvents as SortByPositionIcon,
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { useTournamentStore } from '../store/tournamentStore';
import { useAuthStore } from '../store/authStore';
import { playerService, rebuyService, addonService, tournamentService } from '../services/apiService';
import { getUserDisplayName, getUserFullName } from '../utils/userUtils';
import { isValidUUID } from '../utils/validation';
import TournamentClock from '../components/tournament/TournamentClock';

const TournamentManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentTournament,
    players,
    loading,
    error,
    loadTournament,
    loadPlayers,
    startTournament,
    finishTournament,
    togglePause
  } = useTournamentStore();

  const isAdmin = !!user?.is_admin;
  // Estados para diálogos
  const [rebuyDialogOpen, setRebuyDialogOpen] = useState(false);
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [eliminationDialogOpen, setEliminationDialogOpen] = useState(false);
  const [editPlayerDialogOpen, setEditPlayerDialogOpen] = useState(false);
  const [selectedPlayerForRebuy, setSelectedPlayerForRebuy] = useState('');
  const [selectedPlayerForAddon, setSelectedPlayerForAddon] = useState('');
  const [selectedPlayerForElimination, setSelectedPlayerForElimination] = useState('');
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState('');
  const [eliminationPosition, setEliminationPosition] = useState(1);
  const [eliminationPoints, setEliminationPoints] = useState(1);
  const [editPosition, setEditPosition] = useState(0);
  const [editPoints, setEditPoints] = useState(0);
  
  // Estado para ordenamiento de jugadores
  const [sortBy, setSortBy] = useState<'name' | 'position'>('name');

  // Estado para resultados finales (torneo finalizado): drag and drop y guardado
  const [draggedResultId, setDraggedResultId] = useState<string | null>(null);
  const [dragOverResultIndex, setDragOverResultIndex] = useState<number | null>(null);
  const [savingResults, setSavingResults] = useState(false);

  // Cargar torneo al montar
  useEffect(() => {
    if (id && isValidUUID(id)) {
      loadTournament(id);
    } else {
      navigate('/dashboard');
    }
  }, [id, loadTournament, navigate]);

  // Calcular próxima posición y puntos de eliminación
  useEffect(() => {
    const eliminatedCount = players.filter(p => p.is_eliminated).length;
    const totalPlayers = players.length;

    // Posición = Total de jugadores - Jugadores eliminados
    const nextPosition = totalPlayers - eliminatedCount;
    // Puntos = Jugadores eliminados + 1
    const nextPoints = eliminatedCount + 1;

    setEliminationPosition(nextPosition);
    setEliminationPoints(nextPoints);
  }, [players]);

  const handleStartTournament = async () => {
    if (!currentTournament) return;
    try {
      await startTournament(currentTournament.id);
    } catch (error) {
      console.error('Error iniciando torneo:', error);
    }
  };

  const handleFinishTournament = async () => {
    if (!currentTournament) return;
    try {
      await finishTournament(currentTournament.id);
    } catch (error) {
      console.error('Error finalizando torneo:', error);
    }
  };

  const handleTogglePause = async () => {
    if (!currentTournament) return;
    try {
      await togglePause(currentTournament.id);
    } catch (error) {
      console.error('Error pausando/reanudando torneo:', error);
    }
  };

  const handleRebuy = async () => {
    if (!selectedPlayerForRebuy || !currentTournament) return;

    try {
      if (!user?.id) {
        throw new Error('Usuario no autenticado - no se puede registrar el rebuy');
      }

      const player = players.find(p => p.id === selectedPlayerForRebuy);
      if (!player) return;

      await rebuyService.registerRebuy(selectedPlayerForRebuy, {
        amount: currentTournament.entry_fee,
        chips_received: currentTournament.rebuy_chips,
        admin_user_id: user.id
      });

      // Actualizar fichas del jugador
      await playerService.updatePlayerChips(
        selectedPlayerForRebuy, 
        player.current_chips + currentTournament.rebuy_chips
      );

      setRebuyDialogOpen(false);
      setSelectedPlayerForRebuy('');
      
      // Recargar torneo para actualizar datos
      loadTournament(currentTournament.id);
    } catch (error) {
      console.error('Error procesando recompra:', error);
    }
  };

  const handleAddon = async () => {
    if (!selectedPlayerForAddon || !currentTournament) return;

    try {
      if (!user?.id) {
        throw new Error('Usuario no autenticado - no se puede registrar el addon');
      }

      const player = players.find(p => p.id === selectedPlayerForAddon);
      if (!player) return;

      await addonService.registerAddon(selectedPlayerForAddon, {
        amount: currentTournament.entry_fee,
        chips_received: currentTournament.addon_chips,
        admin_user_id: user.id
      });

      // Actualizar fichas del jugador
      await playerService.updatePlayerChips(
        selectedPlayerForAddon, 
        player.current_chips + currentTournament.addon_chips
      );

      setAddonDialogOpen(false);
      setSelectedPlayerForAddon('');
      
      // Recargar torneo para actualizar datos
      loadTournament(currentTournament.id);
    } catch (error) {
      console.error('Error procesando addon:', error);
    }
  };

  const handleElimination = async () => {
    if (!selectedPlayerForElimination || !currentTournament?.id) return;

    try {
      if (!user?.id) {
        throw new Error('Usuario no autenticado - no se puede eliminar el jugador');
      }

      // Llamar al servicio con los valores calculados (pueden ser modificados por el admin)
      await playerService.eliminatePlayer(
        selectedPlayerForElimination,
        currentTournament.id,
        eliminationPosition,
        user.id,
        eliminationPoints
      );

      // También actualizar el estado local del store
      useTournamentStore.getState().eliminatePlayer(currentTournament.id, selectedPlayerForElimination, eliminationPosition, user.id, eliminationPoints);

      setEliminationDialogOpen(false);
      setSelectedPlayerForElimination('');

      // Recargar torneo para actualizar datos
      if (currentTournament) {
        loadTournament(currentTournament.id);
      }
    } catch (error) {
      console.error('Error eliminando jugador:', error);
    }
  };

  const handleEditPlayer = async () => {
    if (!selectedPlayerForEdit) return;

    try {
      if (!user?.id) {
        throw new Error('Usuario no autenticado - no se puede editar el jugador');
      }

      // Llamar al servicio para actualizar posición y puntos
      await playerService.updatePlayerPositionAndPoints(
        selectedPlayerForEdit,
        editPosition,
        editPoints,
        user.id
      );

      setEditPlayerDialogOpen(false);
      setSelectedPlayerForEdit('');

      // Recargar torneo para actualizar datos
      if (currentTournament) {
        loadTournament(currentTournament.id);
      }
    } catch (error) {
      console.error('Error editando jugador:', error);
    }
  };

  // Filtros de jugadores
  const activePlayersForActions = players.filter(p => p.is_active && !p.is_eliminated);
  const eliminatablePlayersForActions = players.filter(p => p.is_active && !p.is_eliminated);

  const activePlayers = players.filter(p => p.is_active && !p.is_eliminated);
  const canStart = currentTournament?.status === 'scheduled' && players.length > 0;
  const canPause = currentTournament?.status === 'active';
  const canFinish = isAdmin && (currentTournament?.status !== 'finished');

  // Para torneo finalizado: jugadores ordenados por posición final (una sola columna)
  const finishedOrderedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const posA = a.final_position ?? 9999;
      const posB = b.final_position ?? 9999;
      return posA - posB;
    });
  }, [players]);

  const handleFinishedOrderDrop = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || !currentTournament?.id) return;
    const reordered = [...finishedOrderedPlayers];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    const totalPlayers = reordered.length;
    const results = reordered.map((p, i) => {
      const final_position = i + 1;
      const points_earned = totalPlayers - final_position + 1;
      return { player_id: p.id, final_position, points_earned };
    });
    setSavingResults(true);
    try {
      await tournamentService.updateTournamentResults(currentTournament.id, results);
      await loadTournament(currentTournament.id);
    } catch (err) {
      console.error('Error actualizando orden de resultados', err);
    } finally {
      setSavingResults(false);
      setDraggedResultId(null);
      setDragOverResultIndex(null);
    }
  };

  const handleInactivatePlayer = async (playerId: string) => {
    if (!currentTournament?.id) return;
    try {
      await playerService.updatePlayerResults(playerId, { is_active: false });
      await loadTournament(currentTournament.id);
    } catch (err) {
      console.error('Error inactivando jugador', err);
    }
  };

  // Ordenamiento de jugadores
  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'position') {
      // Ordenar por posición final (jugadores eliminados primero, luego activos)
      if (a.is_eliminated && !b.is_eliminated) return -1;
      if (!a.is_eliminated && b.is_eliminated) return 1;
      
      // Si ambos están eliminados, ordenar por posición final
      if (a.is_eliminated && b.is_eliminated) {
        const posA = a.final_position || 999;
        const posB = b.final_position || 999;
        return posA - posB;
      }
      
      // Si ambos están activos, ordenar por nombre
      return getUserDisplayName(a.user || null).localeCompare(getUserDisplayName(b.user || null));
    } else {
      // Ordenar por nombre
      return getUserDisplayName(a.user || null).localeCompare(getUserDisplayName(b.user || null));
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatChips = (chips: number) => {
    return chips.toLocaleString();
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
      case 'active': return 'Activo';
      case 'paused': return 'Pausado';
      case 'finished': return 'Finalizado';
      default: return status;
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
    <Box sx={{ 
      p: { xs: 2, md: 3 },
      pb: { xs: 8, md: 3 } // Espacio para bottom navigation en móvil
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        justifyContent: 'space-between', 
        mb: 3,
        gap: 2
      }}>
        <Box display="flex" alignItems="center">
          <IconButton 
            onClick={() => navigate('/dashboard')} 
            sx={{ mr: 2 }}
            size={isMobile ? "large" : "medium"}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} component="h1" sx={{ fontWeight: 700 }}>
              Gestión del Torneo
            </Typography>
            <Typography variant={isMobile ? "body1" : "h6"} color="text.secondary">
              {currentTournament.name}
            </Typography>
          </Box>
        </Box>
        
        <Chip 
          label={getStatusLabel(currentTournament.status)} 
          color={getStatusColor(currentTournament.status) as any}
          size={isMobile ? "small" : "medium"}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Controles del torneo */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant={isMobile ? "h6" : "h6"} gutterBottom sx={{ fontWeight: 600 }}>
            Controles del Torneo
          </Typography>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            sx={{ mb: 2 }}
          >
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartTournament}
              disabled={!canStart}
              fullWidth={isMobile}
              size={isMobile ? "large" : "medium"}
            >
              Iniciar Torneo
            </Button>

            <Button
              variant="contained"
              color="warning"
              startIcon={currentTournament.status === 'paused' ? <PlayArrowIcon /> : <PauseIcon />}
              onClick={handleTogglePause}
              disabled={!canPause && currentTournament.status !== 'paused'}
              fullWidth={isMobile}
              size={isMobile ? "large" : "medium"}
            >
              {currentTournament.status === 'paused' ? 'Reanudar' : 'Pausar'}
            </Button>

            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleFinishTournament}
              disabled={!canFinish}
              fullWidth={isMobile}
              size={isMobile ? "large" : "medium"}
            >
              Finalizar Torneo
            </Button>
          </Stack>

          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1
          }}>
            <Typography variant="body2" color="text.secondary">
              Jugadores activos: {activePlayersForActions.length} | Eliminados: {players.filter(p => p.is_eliminated).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Próxima posición: #{eliminationPosition} | Puntos: {eliminationPoints}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Reloj del torneo */}
      {currentTournament.status === 'active' && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <TournamentClock 
              tournamentId={currentTournament.id}
            />
          </CardContent>
        </Card>
      )}

      {/* Estadísticas del torneo */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Jugadores
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {players.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CasinoIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Activos
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {activePlayers.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <TrophyIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Prize Pool
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(players.reduce((sum, p) => sum + p.entry_fee_paid, 0))}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TimerIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Entry Fee
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(currentTournament.entry_fee)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Inscribir jugador */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Inscribir jugador</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/tournament/${id}/players`)}
              fullWidth={isMobile}
              size={isMobile ? "large" : "medium"}
            >
              Inscribir jugador
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Resultados finales del torneo (solo cuando está finalizado): una columna, orden por posición, arrastrar para reordenar */}
      {currentTournament.status === 'finished' && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Resultados finales del torneo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Arrastra una tarjeta para cambiar la posición final. Los puntos se recalculan automáticamente.
            </Typography>
            {finishedOrderedPlayers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No hay jugadores</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ maxWidth: 480 }}>
                {finishedOrderedPlayers.map((p, index) => (
                  <Card
                    key={p.id}
                    draggable={!savingResults}
                    onDragStart={(e) => {
                      setDraggedResultId(p.id);
                      e.dataTransfer.setData('text/plain', index.toString());
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverResultIndex(index);
                    }}
                    onDragLeave={() => setDragOverResultIndex(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                      if (fromIndex !== index) {
                        handleFinishedOrderDrop(fromIndex, index);
                      }
                      setDragOverResultIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedResultId(null);
                      setDragOverResultIndex(null);
                    }}
                    sx={{
                      opacity: draggedResultId === p.id ? 0.6 : 1,
                      border: '2px solid',
                      borderColor: dragOverResultIndex === index ? 'primary.main' : 'transparent',
                      borderRadius: 2,
                      transition: 'border-color 0.15s, opacity 0.15s'
                    }}
                  >
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ cursor: savingResults ? 'default' : 'grab', color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                          <DragIndicatorIcon fontSize="small" />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" fontWeight={600}>
                            {p.user?.nickname?.trim() || '-'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getUserFullName(p.user || null)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          #{p.final_position ?? index + 1}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          {p.points_earned ?? 0} pts
                        </Typography>
                        {p.is_active && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            startIcon={<PersonOffIcon />}
                            onClick={() => handleInactivatePlayer(p.id)}
                            disabled={savingResults}
                          >
                            Inactivar
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {/* Listado de jugadores con cards (solo cuando el torneo NO está finalizado) */}
      {currentTournament.status !== 'finished' && (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 3,
            gap: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Jugadores inscriptos ({players.length})
            </Typography>
            
            <ToggleButtonGroup
              value={sortBy}
              exclusive
              onChange={(_, newSortBy) => {
                if (newSortBy !== null) {
                  setSortBy(newSortBy);
                }
              }}
              size={isMobile ? "medium" : "small"}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 2,
                  py: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  }
                }
              }}
            >
              <ToggleButton value="name" aria-label="ordenar por nombre">
                <SortByNameIcon sx={{ mr: 1, fontSize: 18 }} />
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  Nombre
                </Typography>
              </ToggleButton>
              <ToggleButton value="position" aria-label="ordenar por posición">
                <SortByPositionIcon sx={{ mr: 1, fontSize: 18 }} />
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  Posición
                </Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          {players.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay jugadores inscriptos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comienza inscribiendo jugadores para el torneo
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {sortedPlayers.map((p) => (
                <Grid size={{xs: 12, sm: 6, md: 4}} key={p.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                          <Avatar sx={{ bgcolor: p.is_eliminated ? 'error.main' : 'primary.main' }}>
                            {getUserDisplayName(p.user || null).charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                              {getUserDisplayName(p.user || null)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatChips(p.current_chips)} fichas
                            </Typography>
                          </Box>
                        </Box>
                        
                        {p.is_eliminated && (
                          <Chip 
                            label="Eliminado" 
                            color="error" 
                            size="small" 
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Stack spacing={2} sx={{ mb: 3 }}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Entry Fee:
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {formatCurrency(p.entry_fee_paid)}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Estado:
                          </Typography>
                          <Chip 
                            label={p.is_active ? 'Activo' : 'Inactivo'} 
                            color={p.is_active ? 'success' : 'default'} 
                            size="small" 
                          />
                        </Box>
                      </Stack>

                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                      }}>
                        {currentTournament.status === 'active' && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedPlayerForRebuy(p.id); setRebuyDialogOpen(true); }}
                              disabled={p.is_eliminated || currentTournament.status !== 'active'}
                              sx={{ 
                                backgroundColor: 'success.light',
                                color: 'success.contrastText',
                                '&:hover': { backgroundColor: 'success.main' }
                              }}
                            >
                              <MoneyIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedPlayerForAddon(p.id); setAddonDialogOpen(true); }}
                              disabled={p.is_eliminated || currentTournament.status !== 'active'}
                              sx={{ 
                                backgroundColor: 'warning.light',
                                color: 'warning.contrastText',
                                '&:hover': { backgroundColor: 'warning.main' }
                              }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedPlayerForElimination(p.id);
                                const eliminatedCount = players.filter(player => player.is_eliminated).length;
                                const totalPlayers = players.length;
                                setEliminationPosition(totalPlayers - eliminatedCount);
                                setEliminationPoints(eliminatedCount + 1);
                                setEliminationDialogOpen(true);
                              }}
                              disabled={p.is_eliminated || !p.is_active}
                              sx={{
                                backgroundColor: 'error.light',
                                color: 'error.contrastText',
                                '&:hover': { backgroundColor: 'error.main' }
                              }}
                            >
                              <PersonOffIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                        {currentTournament.status !== 'finished' && (
                          <IconButton
                            size="small"
                            onClick={async () => {
                              try {
                                await playerService.removePlayer(p.id);
                                if (currentTournament) loadTournament(currentTournament.id);
                              } catch (e) {
                                console.error('Error desregistrando jugador', e);
                              }
                            }}
                            sx={{ backgroundColor: 'grey.300', color: 'grey.700', '&:hover': { backgroundColor: 'grey.400' } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
      )}

      {/* FAB para inscribir jugador en móviles */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="inscribir jugador"
          onClick={() => navigate(`/tournament/${id}/players`)}
          sx={{
            position: 'fixed',
            bottom: 90, // Encima de la bottom navigation
            right: 16,
            zIndex: 1000,
            background: 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #ff3742 0%, #ff2f3a 100%)',
            }
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialog para recompra */}
      <Dialog 
        open={rebuyDialogOpen} 
        onClose={() => setRebuyDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          pb: 1,
          background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
          color: 'white'
        }}>
          Registrar Recompra
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              select
              label="Seleccionar Jugador"
              value={selectedPlayerForRebuy}
              onChange={(e) => setSelectedPlayerForRebuy(e.target.value)}
              fullWidth
              variant="outlined"
              size={isMobile ? "medium" : "small"}
            >
              {activePlayersForActions.map((player) => (
                <MenuItem key={player.id} value={player.id}>
                  {getUserDisplayName(player.user || null)} - {formatChips(player.current_chips)} fichas
                </MenuItem>
              ))}
            </TextField>
            
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Detalles de la Recompra:
              </Typography>
              <Typography variant="body2">
                Monto: {formatCurrency(currentTournament.entry_fee)}
              </Typography>
              <Typography variant="body2">
                Fichas a recibir: {formatChips(currentTournament.rebuy_chips)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          pt: 1,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1
        }}>
          <Button 
            onClick={() => setRebuyDialogOpen(false)}
            variant="outlined"
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleRebuy}
            variant="contained"
            disabled={!selectedPlayerForRebuy}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{
              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)',
              }
            }}
          >
            Registrar Recompra
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para addon */}
      <Dialog 
        open={addonDialogOpen} 
        onClose={() => setAddonDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          pb: 1,
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          color: 'white'
        }}>
          Registrar Addon
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              select
              label="Seleccionar Jugador"
              value={selectedPlayerForAddon}
              onChange={(e) => setSelectedPlayerForAddon(e.target.value)}
              fullWidth
              variant="outlined"
              size={isMobile ? "medium" : "small"}
            >
              {activePlayersForActions.map((player) => (
                <MenuItem key={player.id} value={player.id}>
                  {getUserDisplayName(player.user || null)} - {formatChips(player.current_chips)} fichas
                </MenuItem>
              ))}
            </TextField>
            
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Detalles del Addon:
              </Typography>
              <Typography variant="body2">
                Monto: {formatCurrency(currentTournament.entry_fee)}
              </Typography>
              <Typography variant="body2">
                Fichas a recibir: {formatChips(currentTournament.addon_chips)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          pt: 1,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1
        }}>
          <Button 
            onClick={() => setAddonDialogOpen(false)}
            variant="outlined"
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddon}
            variant="contained"
            disabled={!selectedPlayerForAddon}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
              }
            }}
          >
            Registrar Addon
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para eliminación */}
      <Dialog 
        open={eliminationDialogOpen} 
        onClose={() => setEliminationDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          pb: 1,
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white'
        }}>
          Eliminar Jugador
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              select
              label="Seleccionar Jugador a Eliminar"
              value={selectedPlayerForElimination}
              onChange={(e) => setSelectedPlayerForElimination(e.target.value)}
              fullWidth
              variant="outlined"
              size={isMobile ? "medium" : "small"}
            >
              {eliminatablePlayersForActions.map((player) => (
                <MenuItem key={player.id} value={player.id}>
                  {getUserDisplayName(player.user || null)} - {formatChips(player.current_chips)} fichas
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
                Valores Calculados Automáticamente:
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Posición sugerida: #{eliminationPosition}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Puntos sugeridos: {eliminationPoints}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Puedes modificar estos valores si es necesario
              </Typography>
            </Box>

            <TextField
              label="Posición Final"
              type="number"
              value={eliminationPosition}
              onChange={(e) => setEliminationPosition(parseInt(e.target.value) || 1)}
              fullWidth
              variant="outlined"
              size={isMobile ? "medium" : "small"}
              inputProps={{ min: 1 }}
              helperText="Modifica si necesitas cambiar la posición calculada"
            />

            <TextField
              label="Puntos Obtenidos"
              type="number"
              value={eliminationPoints}
              onChange={(e) => setEliminationPoints(parseInt(e.target.value) || 0)}
              fullWidth
              variant="outlined"
              size={isMobile ? "medium" : "small"}
              inputProps={{ min: 0 }}
              helperText="Modifica si necesitas cambiar los puntos calculados"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          pt: 1,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1
        }}>
          <Button 
            onClick={() => setEliminationDialogOpen(false)}
            variant="outlined"
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleElimination}
            variant="contained"
            color="error"
            disabled={!selectedPlayerForElimination || eliminationPosition < 1}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
              }
            }}
          >
            Eliminar Jugador
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar jugador (torneos finalizados) */}
      <Dialog 
        open={editPlayerDialogOpen} 
        onClose={() => setEditPlayerDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          pb: 1,
          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
          color: 'white'
        }}>
          Editar Posición y Puntos
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              select
              label="Seleccionar Jugador a Editar"
              value={selectedPlayerForEdit}
              onChange={(e) => setSelectedPlayerForEdit(e.target.value)}
              fullWidth
              variant="outlined"
              size={isMobile ? "medium" : "small"}
            >
              {players.filter(p => p.is_eliminated).map((player) => (
                <MenuItem key={player.id} value={player.id}>
                  {getUserDisplayName(player.user || null)} - Posición: #{player.final_position || '-'} - Puntos: {player.points_earned || 0}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
                Editar Posición y Puntos del Jugador:
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Posición actual: #{editPosition}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Puntos actuales: {editPoints}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Modifica estos valores para corregir errores
              </Typography>
            </Box>

            <TextField
              label="Posición Final"
              type="number"
              value={editPosition}
              onChange={(e) => setEditPosition(parseInt(e.target.value) || 0)}
              fullWidth
              variant="outlined"
              size={isMobile ? "medium" : "small"}
              inputProps={{ min: 1 }}
              helperText="Posición final del jugador en el torneo"
            />

            <TextField
              label="Puntos Obtenidos"
              type="number"
              value={editPoints}
              onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
              fullWidth
              variant="outlined"
              size={isMobile ? "medium" : "small"}
              inputProps={{ min: 0 }}
              helperText="Puntos obtenidos por el jugador"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          pt: 1,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1
        }}>
          <Button 
            onClick={() => setEditPlayerDialogOpen(false)}
            variant="outlined"
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEditPlayer}
            variant="contained"
            color="primary"
            disabled={!selectedPlayerForEdit || editPosition < 1}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{
              background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              }
            }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentManagement;