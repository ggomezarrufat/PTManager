import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  AddBox as AddBoxIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useTournamentStore } from '../store/tournamentStore';
import { useAuthStore } from '../store/authStore';
import { getUserDisplayName } from '../utils/userUtils';
import { canMakeRebuy, canMakeAddon, getRebuyStatusMessage, getAddonStatusMessage } from '../utils/tournamentRules';
import { rebuyService, addonService, playerService } from '../services/apiService';
import { TournamentPlayer } from '../types';

const TournamentRebuys: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentTournament,
    players,
    clock,
    loading,
    loadTournament
  } = useTournamentStore();

  // Estados locales para filtros
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'eliminated'>('all');
  const [rebuyFilter, setRebuyFilter] = useState<'all' | 'can_rebuy' | 'cannot_rebuy'>('all');
  
  // Estados para diálogos
  const [rebuyDialogOpen, setRebuyDialogOpen] = useState(false);
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<TournamentPlayer | null>(null);
  const [processing, setProcessing] = useState(false);

  // Cargar torneo al montar
  useEffect(() => {
    if (id) {
      loadTournament(id);
    }
  }, [id, loadTournament]);

  // Filtrar jugadores
  const filteredPlayers = useMemo(() => {
    let filtered = [...players];

    // Filtro por búsqueda
    if (searchFilter) {
      filtered = filtered.filter(player => 
        getUserDisplayName(player.user || null).toLowerCase().includes(searchFilter.toLowerCase()) ||
        (player.user?.email || '').toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(player => {
        if (statusFilter === 'active') return player.is_active && !player.is_eliminated;
        if (statusFilter === 'eliminated') return player.is_eliminated;
        return true;
      });
    }

    // Filtro por posibilidad de recompra
    if (rebuyFilter !== 'all' && currentTournament) {
      filtered = filtered.filter(player => {
        const canRebuy = canMakeRebuy(currentTournament, clock);
        if (rebuyFilter === 'can_rebuy') return canRebuy && player.is_active;
        if (rebuyFilter === 'cannot_rebuy') return !canRebuy || !player.is_active;
        return true;
      });
    }

    // Ordenar por estado (activos primero) y luego por nombre
    return filtered.sort((a, b) => {
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1;
      }
      const nameA = getUserDisplayName(a.user || null);
      const nameB = getUserDisplayName(b.user || null);
      return nameA.localeCompare(nameB);
    });
  }, [players, searchFilter, statusFilter, rebuyFilter, currentTournament, clock]);

  const handleBackToClock = () => {
    navigate(`/tournament/${id}/clock`);
  };

  const handleRebuyClick = (player: TournamentPlayer) => {
    setSelectedPlayer(player);
    setRebuyDialogOpen(true);
  };

  const handleAddonClick = (player: TournamentPlayer) => {
    setSelectedPlayer(player);
    setAddonDialogOpen(true);
  };

  const handleConfirmRebuy = async () => {
    if (!selectedPlayer || !currentTournament || !user) return;

    try {
      setProcessing(true);
      
      await rebuyService.registerRebuy(selectedPlayer.id, {
        amount: currentTournament.entry_fee,
        chips_received: currentTournament.rebuy_chips,
        admin_user_id: user.id
      });

      // Actualizar fichas del jugador
      await playerService.updatePlayerChips(
        selectedPlayer.id,
        selectedPlayer.current_chips + currentTournament.rebuy_chips
      );

      setRebuyDialogOpen(false);
      setSelectedPlayer(null);
      
      // Recargar torneo
      await loadTournament(currentTournament.id);
      
    } catch (error) {
      console.error('Error procesando recompra:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmAddon = async () => {
    if (!selectedPlayer || !currentTournament || !user) return;

    try {
      setProcessing(true);
      
      await addonService.registerAddon(selectedPlayer.id, {
        amount: currentTournament.entry_fee,
        chips_received: currentTournament.addon_chips,
        admin_user_id: user.id
      });

      // Actualizar fichas del jugador
      await playerService.updatePlayerChips(
        selectedPlayer.id,
        selectedPlayer.current_chips + currentTournament.addon_chips
      );

      setAddonDialogOpen(false);
      setSelectedPlayer(null);
      
      // Recargar torneo
      await loadTournament(currentTournament.id);
      
    } catch (error) {
      console.error('Error procesando addon:', error);
    } finally {
      setProcessing(false);
    }
  };

  const clearFilters = () => {
    setSearchFilter('');
    setStatusFilter('all');
    setRebuyFilter('all');
  };

  // Estilo común para TextField en fondo oscuro
  const darkTextFieldStyle = {
    '& .MuiOutlinedInput-root': {
      bgcolor: 'background.paper',
      '& fieldset': {
        borderColor: 'grey.600',
      },
      '&:hover fieldset': {
        borderColor: 'grey.500',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'text.secondary',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: 'primary.main',
    },
    '& .MuiInputBase-input::placeholder': {
      color: 'text.secondary',
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
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

  const canDoRebuys = currentTournament && canMakeRebuy(currentTournament, clock);
  const canDoAddons = currentTournament && canMakeAddon(currentTournament, clock);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header fijo */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBackToClock}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gestión de Recompras - {currentTournament.name}
          </Typography>
          <Chip
            label={`${filteredPlayers.length} jugadores`}
            color="secondary"
            variant="outlined"
          />
        </Toolbar>
      </AppBar>

      {/* Estado del torneo */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" flexWrap="wrap" gap={2} justifyContent="space-between">
          <Box flex="1" minWidth="200px">
            <Typography variant="body2" color="text.secondary">
              Estado de Recompras:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {getRebuyStatusMessage(currentTournament, clock)}
            </Typography>
          </Box>
          <Box flex="1" minWidth="200px">
            <Typography variant="body2" color="text.secondary">
              Estado de Addons:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {getAddonStatusMessage(currentTournament, clock)}
            </Typography>
          </Box>
          <Box flex="1" minWidth="200px">
            <Typography variant="body2" color="text.secondary">
              Nivel Actual:
            </Typography>
            <Typography variant="h6" color="primary.main">
              Nivel {clock?.current_level || 1}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Filtros */}
      <Box sx={{ p: 2, bgcolor: 'grey.900', borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Box flex="2" minWidth="200px">
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar jugador..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              sx={darkTextFieldStyle}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} flex="1">
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              sx={darkTextFieldStyle}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="eliminated">Eliminados</MenuItem>
            </TextField>
            <TextField
              select
              fullWidth
              size="small"
              label="Recompras"
              value={rebuyFilter}
              onChange={(e) => setRebuyFilter(e.target.value as any)}
              sx={darkTextFieldStyle}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="can_rebuy">Pueden recomprar</MenuItem>
              <MenuItem value="cannot_rebuy">No pueden recomprar</MenuItem>
            </TextField>
          </Box>
          <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }}>
            <Button
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              size="small"
              disabled={!searchFilter && statusFilter === 'all' && rebuyFilter === 'all'}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'grey.800'
                },
                '&.Mui-disabled': {
                  color: 'grey.600'
                }
              }}
            >
              Limpiar Filtros
            </Button>
            <Button
              startIcon={<FilterListIcon />}
              variant="outlined"
              size="small"
              sx={{
                color: 'white',
                borderColor: 'grey.600',
                '&:hover': {
                  borderColor: 'grey.500',
                  bgcolor: 'grey.800'
                }
              }}
            >
              {filteredPlayers.length} de {players.length}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Lista de jugadores scrolleable */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={2}>
          {filteredPlayers.map((player) => {
            const canPlayerRebuy = canDoRebuys && player.is_active;
            const canPlayerAddon = canDoAddons && player.is_active;
            
            return (
              <Card 
                key={player.id}
                sx={{ 
                  height: '100%',
                  border: player.is_active ? '2px solid' : '1px solid',
                  borderColor: player.is_active ? 'success.main' : 'divider',
                  opacity: player.is_eliminated ? 0.7 : 1
                }}
              >
                  <CardContent>
                    {/* Header del jugador */}
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar
                        src={player.user?.avatar_url}
                        sx={{ width: 48, height: 48 }}
                      >
                        {getUserDisplayName(player.user || null).charAt(0)}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                          {getUserDisplayName(player.user || null)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {player.user?.email}
                        </Typography>
                      </Box>
                      <Chip
                        label={player.is_active ? 'Activo' : 'Eliminado'}
                        color={player.is_active ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>

                    {/* Estadísticas */}
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Fichas actuales
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {player.current_chips.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Cuota pagada
                        </Typography>
                        <Typography variant="h6">
                          €{player.entry_fee_paid}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Recompras
                        </Typography>
                        <Typography variant="h6" color="info.main">
                          {player.rebuys_count}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Addons
                        </Typography>
                        <Typography variant="h6" color="warning.main">
                          {player.addons_count}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Botones de acción */}
                    {player.is_active && (
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title={`Recompra (€${currentTournament.entry_fee} → ${currentTournament.rebuy_chips} fichas)`}>
                          <Button
                            variant={canPlayerRebuy ? "contained" : "outlined"}
                            color="info"
                            startIcon={<ShoppingCartIcon />}
                            onClick={() => handleRebuyClick(player)}
                            disabled={!canPlayerRebuy}
                            size="small"
                            sx={{ flex: 1 }}
                          >
                            Recompra
                          </Button>
                        </Tooltip>
                        <Tooltip title={`Addon (€${currentTournament.entry_fee} → ${currentTournament.addon_chips} fichas)`}>
                          <Button
                            variant={canPlayerAddon ? "contained" : "outlined"}
                            color="warning"
                            startIcon={<AddBoxIcon />}
                            onClick={() => handleAddonClick(player)}
                            disabled={!canPlayerAddon}
                            size="small"
                            sx={{ flex: 1 }}
                          >
                            Addon
                          </Button>
                        </Tooltip>
                      </Box>
                    )}
                  </CardContent>
                </Card>
            );
          })}
        </Box>

        {filteredPlayers.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No se encontraron jugadores
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ajusta los filtros para ver más resultados
            </Typography>
          </Box>
        )}
      </Box>

      {/* Diálogo de confirmación de recompra */}
      <Dialog open={rebuyDialogOpen} onClose={() => setRebuyDialogOpen(false)}>
        <DialogTitle>Confirmar Recompra</DialogTitle>
        <DialogContent>
          {selectedPlayer && (
            <Box>
              <Typography variant="body1" gutterBottom>
                ¿Confirmar recompra para <strong>{getUserDisplayName(selectedPlayer.user || null)}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                • Costo: €{currentTournament?.entry_fee}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                • Fichas recibidas: {currentTournament?.rebuy_chips.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Fichas finales: {((selectedPlayer.current_chips || 0) + (currentTournament?.rebuy_chips || 0)).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRebuyDialogOpen(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmRebuy} 
            variant="contained" 
            color="info"
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : 'Confirmar Recompra'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de addon */}
      <Dialog open={addonDialogOpen} onClose={() => setAddonDialogOpen(false)}>
        <DialogTitle>Confirmar Addon</DialogTitle>
        <DialogContent>
          {selectedPlayer && (
            <Box>
              <Typography variant="body1" gutterBottom>
                ¿Confirmar addon para <strong>{getUserDisplayName(selectedPlayer.user || null)}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                • Costo: €{currentTournament?.entry_fee}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                • Fichas recibidas: {currentTournament?.addon_chips.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Fichas finales: {((selectedPlayer.current_chips || 0) + (currentTournament?.addon_chips || 0)).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddonDialogOpen(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmAddon} 
            variant="contained" 
            color="warning"
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : 'Confirmar Addon'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentRebuys;
