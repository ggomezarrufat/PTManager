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
  MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Add as AddIcon,
  MonetizationOn as MoneyIcon,
  PersonOff as PersonOffIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useTournamentStore } from '../store/tournamentStore';
import { useAuthStore } from '../store/authStore';
import { playerService, rebuyService, addonService } from '../services/apiService';
import { getUserDisplayName } from '../utils/userUtils';
import { isValidUUID } from '../utils/validation';
import TournamentClock from '../components/tournament/TournamentClock';
import { BlindLevel, TournamentPlayer } from '../types';

const TournamentManagement: React.FC = () => {
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
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              Gestión del Torneo
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {currentTournament.name}
            </Typography>
          </Box>
        </Box>
        
        <Chip 
          label={getStatusLabel(currentTournament.status)} 
          color={getStatusColor(currentTournament.status) as any}
          size="medium"
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
          <Typography variant="h6" gutterBottom>
            Controles del Torneo
          </Typography>
          
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartTournament}
              disabled={!canStart}
            >
              Iniciar Torneo
            </Button>

            <Button
              variant="contained"
              color="warning"
              startIcon={currentTournament.status === 'paused' ? <PlayArrowIcon /> : <PauseIcon />}
              onClick={handleTogglePause}
              disabled={!canPause && currentTournament.status !== 'paused'}
            >
              {currentTournament.status === 'paused' ? 'Reanudar' : 'Pausar'}
            </Button>

            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleFinishTournament}
              disabled={!canFinish}
            >
              Finalizar Torneo
            </Button>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Typography variant="body2" color="text.secondary">
              Jugadores activos: {activePlayersForActions.length} | Eliminados: {players.filter(p => p.is_eliminated).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Próxima posición de eliminación: #{eliminationPosition}
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
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{xs: 12, md: 3}}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Jugadores
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {players.length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Activos
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {activePlayers.length}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs: 12, md: 3}}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Prize Pool
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(players.reduce((sum, p) => sum + p.entry_fee_paid, 0))}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Entry Fee
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(currentTournament.entry_fee)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Inscribir jugador */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Inscribir jugador</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/tournament/${id}/players`)}
            >
              Inscribir jugador
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Listado de jugadores con acciones por fila */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Jugadores inscriptos
          </Typography>
          {players.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No hay jugadores inscriptos</Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={1}>
              {players.map((p) => (
                <Box key={p.id} display="flex" alignItems="center" justifyContent="space-between" py={1} borderBottom="1px solid" borderColor="divider">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body1">{getUserDisplayName(p.user || null)}</Typography>
                    {p.is_eliminated && (
                      <Chip label="Eliminado" color="default" size="small" />
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    {/* Recompra */}
                    <IconButton
                      size="small"
                      onClick={() => { setSelectedPlayerForRebuy(p.id); setRebuyDialogOpen(true); }}
                      disabled={p.is_eliminated || currentTournament.status !== 'active'}
                    >
                      <MoneyIcon fontSize="small" />
                    </IconButton>
                    {/* Addon */}
                    <IconButton
                      size="small"
                      onClick={() => { setSelectedPlayerForAddon(p.id); setAddonDialogOpen(true); }}
                      disabled={p.is_eliminated || currentTournament.status !== 'active'}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                    {/* Eliminar (eliminación del torneo) */}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => { setSelectedPlayerForElimination(p.id); setEliminationDialogOpen(true); }}
                      disabled={p.is_eliminated || currentTournament.status !== 'active'}
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
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog para recompra */}
      <Dialog open={rebuyDialogOpen} onClose={() => setRebuyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Recompra</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <TextField
              select
              label="Seleccionar Jugador"
              value={selectedPlayerForRebuy}
              onChange={(e) => setSelectedPlayerForRebuy(e.target.value)}
              fullWidth
            >
              {activePlayersForActions.map((player) => (
                <MenuItem key={player.id} value={player.id}>
                  {getUserDisplayName(player.user || null)} - {formatChips(player.current_chips)} fichas
                </MenuItem>
              ))}
            </TextField>
            
            <Typography variant="body2" sx={{ mt: 2 }}>
              Monto: {formatCurrency(currentTournament.entry_fee)}
            </Typography>
            <Typography variant="body2">
              Fichas a recibir: {formatChips(currentTournament.rebuy_chips)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRebuyDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRebuy}
            variant="contained"
            disabled={!selectedPlayerForRebuy}
          >
            Registrar Recompra
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para addon */}
      <Dialog open={addonDialogOpen} onClose={() => setAddonDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Addon</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <TextField
              select
              label="Seleccionar Jugador"
              value={selectedPlayerForAddon}
              onChange={(e) => setSelectedPlayerForAddon(e.target.value)}
              fullWidth
            >
              {activePlayersForActions.map((player) => (
                <MenuItem key={player.id} value={player.id}>
                  {getUserDisplayName(player.user || null)} - {formatChips(player.current_chips)} fichas
                </MenuItem>
              ))}
            </TextField>
            
            <Typography variant="body2" sx={{ mt: 2 }}>
              Monto: {formatCurrency(currentTournament.entry_fee)}
            </Typography>
            <Typography variant="body2">
              Fichas a recibir: {formatChips(currentTournament.addon_chips)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddonDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAddon}
            variant="contained"
            disabled={!selectedPlayerForAddon}
          >
            Registrar Addon
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para eliminación */}
      <Dialog open={eliminationDialogOpen} onClose={() => setEliminationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Eliminar Jugador</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              select
              label="Seleccionar Jugador a Eliminar"
              value={selectedPlayerForElimination}
              onChange={(e) => setSelectedPlayerForElimination(e.target.value)}
              fullWidth
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
              inputProps={{ min: 1 }}
              helperText={`Próxima posición disponible: ${eliminationPosition}`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEliminationDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleElimination}
            variant="contained"
            color="error"
            disabled={!selectedPlayerForElimination}
          >
            Eliminar Jugador
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentManagement;