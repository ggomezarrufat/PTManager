import React, { useState, useEffect } from 'react';
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
  Avatar
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
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { useTournamentStore } from '../store/tournamentStore';
import { useAuthStore } from '../store/authStore';
import { playerService, rebuyService, addonService } from '../services/apiService';
import { getUserDisplayName } from '../utils/userUtils';
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
    clock,
    loading,
    error,
    loadTournament,
    startTournament,
    finishTournament,
    togglePause
  } = useTournamentStore();

  const isAdmin = !!user?.is_admin;
  // Estados para diálogos
  const [rebuyDialogOpen, setRebuyDialogOpen] = useState(false);
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [eliminationDialogOpen, setEliminationDialogOpen] = useState(false);
  const [selectedPlayerForRebuy, setSelectedPlayerForRebuy] = useState('');
  const [selectedPlayerForAddon, setSelectedPlayerForAddon] = useState('');
  const [selectedPlayerForElimination, setSelectedPlayerForElimination] = useState('');
  const [eliminationPosition, setEliminationPosition] = useState(1);

  // Cargar torneo al montar
  useEffect(() => {
    if (id && isValidUUID(id)) {
      loadTournament(id);
    } else {
      navigate('/dashboard');
    }
  }, [id, loadTournament, navigate]);

  // Calcular próxima posición de eliminación
  useEffect(() => {
    const eliminatedCount = players.filter(p => p.is_eliminated).length;
    setEliminationPosition(eliminatedCount + 1);
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
      const player = players.find(p => p.id === selectedPlayerForRebuy);
      if (!player) return;

      await rebuyService.registerRebuy(selectedPlayerForRebuy, {
        amount: currentTournament.entry_fee,
        chips_received: currentTournament.rebuy_chips
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
      const player = players.find(p => p.id === selectedPlayerForAddon);
      if (!player) return;

      await addonService.registerAddon(selectedPlayerForAddon, {
        amount: currentTournament.entry_fee,
        chips_received: currentTournament.addon_chips
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
    if (!selectedPlayerForElimination) return;

    try {
      await playerService.eliminatePlayer(selectedPlayerForElimination, eliminationPosition);
      
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

  // Filtros de jugadores
  const activePlayersForActions = players.filter(p => p.is_active && !p.is_eliminated);
  const eliminatablePlayersForActions = players.filter(p => p.is_active && !p.is_eliminated);

  const activePlayers = players.filter(p => p.is_active && !p.is_eliminated);
  const canStart = currentTournament?.status === 'scheduled' && players.length > 0;
  const canPause = currentTournament?.status === 'active';
  const canFinish = isAdmin && (currentTournament?.status !== 'finished');

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
              Próxima posición: #{eliminationPosition}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Reloj del torneo */}
      {currentTournament.status === 'active' && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <TournamentClock 
              tournament={currentTournament}
              clock={clock}
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

      {/* Listado de jugadores con cards */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Jugadores inscriptos ({players.length})
          </Typography>
          
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
              {players.map((p) => (
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
                      {/* Header del jugador */}
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

                      {/* Información del jugador */}
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

                      {/* Acciones */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                      }}>
                        {/* Recompra */}
                        <IconButton
                          size="small"
                          onClick={() => { setSelectedPlayerForRebuy(p.id); setRebuyDialogOpen(true); }}
                          disabled={p.is_eliminated || currentTournament.status !== 'active'}
                          sx={{ 
                            backgroundColor: 'success.light',
                            color: 'success.contrastText',
                            '&:hover': {
                              backgroundColor: 'success.main'
                            }
                          }}
                        >
                          <MoneyIcon fontSize="small" />
                        </IconButton>
                        
                        {/* Addon */}
                        <IconButton
                          size="small"
                          onClick={() => { setSelectedPlayerForAddon(p.id); setAddonDialogOpen(true); }}
                          disabled={p.is_eliminated || currentTournament.status !== 'active'}
                          sx={{ 
                            backgroundColor: 'warning.light',
                            color: 'warning.contrastText',
                            '&:hover': {
                              backgroundColor: 'warning.main'
                            }
                          }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                        
                        {/* Eliminar (eliminación del torneo) */}
                        <IconButton
                          size="small"
                          onClick={() => { setSelectedPlayerForElimination(p.id); setEliminationDialogOpen(true); }}
                          disabled={p.is_eliminated || currentTournament.status !== 'active'}
                          sx={{ 
                            backgroundColor: 'error.light',
                            color: 'error.contrastText',
                            '&:hover': {
                              backgroundColor: 'error.main'
                            }
                          }}
                        >
                          <PersonOffIcon fontSize="small" />
                        </IconButton>
                        
                        {/* Desregistrar */}
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
                          sx={{ 
                            backgroundColor: 'grey.300',
                            color: 'grey.700',
                            '&:hover': {
                              backgroundColor: 'grey.400'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

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

            <TextField
              label="Posición Final"
              type="number"
              value={eliminationPosition}
              onChange={(e) => setEliminationPosition(parseInt(e.target.value))}
              fullWidth
              variant="outlined"
              size={isMobile ? "medium" : "small"}
              inputProps={{ min: 1 }}
              helperText={`Próxima posición disponible: ${eliminationPosition}`}
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
            disabled={!selectedPlayerForElimination}
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
    </Box>
  );
};

export default TournamentManagement;