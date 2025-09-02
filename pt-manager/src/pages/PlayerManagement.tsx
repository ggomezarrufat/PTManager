import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  PersonOff as PersonOffIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useTournamentStore } from '../store/tournamentStore';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/apiService';
import { getUserDisplayName, getUserFullName } from '../utils/userUtils';
import { isValidUUID } from '../utils/validation';
import { User, TournamentPlayer } from '../types';

const PlayerManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentTournament,
    players,
    loading,
    error,
    loadTournament,
    addPlayer,
    eliminatePlayer
  } = useTournamentStore();

  const { user } = useAuthStore();

  // Estados locales
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [eliminationDialogOpen, setEliminationDialogOpen] = useState(false);
  const [selectedPlayerForElimination, setSelectedPlayerForElimination] = useState<TournamentPlayer | null>(null);
  const [eliminationPosition, setEliminationPosition] = useState(1);
  const [eliminationPoints, setEliminationPoints] = useState(1);

  // Cargar torneo al montar el componente
  useEffect(() => {
    if (id && isValidUUID(id)) {
      loadTournament(id);
    } else {
      navigate('/dashboard');
    }
  }, [id, loadTournament, navigate]);

  // Cargar usuarios disponibles
  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userService.getUsers(1, 100);
      setAvailableUsers(response.users);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadAvailableUsers();
  }, []);

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

  const handleAddPlayer = async () => {
    if (!selectedUserId || !currentTournament) {
      return;
    }

    try {
      await addPlayer(currentTournament.id, {
        user_id: selectedUserId,
        entry_fee_paid: currentTournament.entry_fee
      });
      
      setAddPlayerDialogOpen(false);
      setSelectedUserId('');
    } catch (error) {
      console.error('Error agregando jugador:', error);
    }
  };

  const handleEliminatePlayer = async () => {
    if (!selectedPlayerForElimination) return;

    try {
      console.log('🔄 Intentando eliminar jugador desde PlayerManagement:', {
        playerId: selectedPlayerForElimination.id,
        eliminationPosition,
        eliminationPoints,
        userId: user?.id,
        userName: user?.name,
        isAuthenticated: !!user
      });

      if (!user?.id) {
        throw new Error('Usuario no autenticado - no se puede eliminar el jugador');
      }

      // Usar el servicio actualizado con parámetros opcionales
      await eliminatePlayer(selectedPlayerForElimination.id, eliminationPosition, user.id, eliminationPoints);
      setEliminationDialogOpen(false);
      setSelectedPlayerForElimination(null);

      // Recargar torneo para actualizar datos
      if (currentTournament) {
        loadTournament(currentTournament.id);
      }
    } catch (error) {
      console.error('Error eliminando jugador:', error);
    }
  };

  // Filtrar usuarios que ya están en el torneo
  const availableUsersForTournament = availableUsers.filter(
    user => !players.some(player => player.user_id === user.id)
  );

  const activePlayers = players.filter(p => p.is_active && !p.is_eliminated);
  const eliminatedPlayers = players.filter(p => p.is_eliminated);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatChips = (chips: number) => {
    return chips.toLocaleString();
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
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Gestión de Jugadores
        </Typography>
      </Box>

      <Typography variant="h6" color="text.secondary" mb={3}>
        {currentTournament.name}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas del torneo */}
      <Box display="flex" gap={3} mb={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <PersonIcon color="primary" />
              <Box>
                <Typography variant="h4" component="div" color="primary.main">
                  {activePlayers.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Jugadores Activos
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <PersonOffIcon color="error" />
              <Box>
                <Typography variant="h4" component="div" color="error.main">
                  {eliminatedPlayers.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Eliminados
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box>
              <Typography variant="h4" component="div" color="warning.main">
                {formatCurrency(players.reduce((sum, p) => sum + p.entry_fee_paid, 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Prize Pool
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Botones de acción */}
      <Box display="flex" gap={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddPlayerDialogOpen(true)}
          disabled={currentTournament.status === 'finished'}
        >
          Agregar Jugador
        </Button>
        
        <Button
          variant="outlined"
          color="error"
          startIcon={<PersonOffIcon />}
          onClick={() => setEliminationDialogOpen(true)}
          disabled={activePlayers.length === 0 || currentTournament.status !== 'active'}
        >
          Eliminar Jugador
        </Button>
      </Box>

      {/* Lista de jugadores */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Jugador</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="right">Fichas</TableCell>
              <TableCell align="right">Entry Fee</TableCell>
              <TableCell align="center">Posición Final</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body1">
                      {getUserDisplayName(player.user || null)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getUserFullName(player.user || null)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {player.is_eliminated ? (
                    <Chip label="Eliminado" color="error" size="small" />
                  ) : player.is_active ? (
                    <Chip label="Activo" color="success" size="small" />
                  ) : (
                    <Chip label="Inactivo" color="default" size="small" />
                  )}
                </TableCell>
                <TableCell align="right">
                  {formatChips(player.current_chips)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(player.entry_fee_paid)}
                </TableCell>
                <TableCell align="center">
                  {player.final_position || '-'}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar jugador">
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para agregar jugador */}
      <Dialog open={addPlayerDialogOpen} onClose={() => setAddPlayerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Jugador al Torneo</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              select
              label="Seleccionar Usuario"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              fullWidth
              disabled={loadingUsers}
            >
              {availableUsersForTournament.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {getUserDisplayName(user)} - {user.email}
                </MenuItem>
              ))}
            </TextField>

            {/* Entry fee fijo del torneo, no editable */}
            <TextField
              label="Entry Fee"
              type="number"
              value={currentTournament.entry_fee}
              fullWidth
              InputProps={{ readOnly: true }}
              helperText="Se usa el valor configurado en el torneo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPlayerDialogOpen(false)}>
            Cancelar
          </Button>
            <Button 
              onClick={handleAddPlayer}
              variant="contained"
              disabled={!selectedUserId}
            >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para eliminar jugador */}
      <Dialog open={eliminationDialogOpen} onClose={() => setEliminationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Eliminar Jugador</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              select
              label="Seleccionar Jugador a Eliminar"
              value={selectedPlayerForElimination?.id || ''}
              onChange={(e) => {
                const player = activePlayers.find(p => p.id === e.target.value);
                setSelectedPlayerForElimination(player || null);
              }}
              fullWidth
            >
              {activePlayers.map((player) => (
                <MenuItem key={player.id} value={player.id}>
                  {getUserDisplayName(player.user || null)} - {formatChips(player.current_chips)} fichas
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Valores Calculados Automáticamente:
              </Typography>
              <Typography variant="body2">
                • Posición sugerida: #{eliminationPosition}
              </Typography>
              <Typography variant="body2">
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
              inputProps={{ min: 1 }}
              helperText="Modifica si necesitas cambiar la posición calculada"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Puntos Obtenidos"
              type="number"
              value={eliminationPoints}
              onChange={(e) => setEliminationPoints(parseInt(e.target.value) || 0)}
              fullWidth
              inputProps={{ min: 0 }}
              helperText="Modifica si necesitas cambiar los puntos calculados"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEliminationDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleEliminatePlayer}
            variant="contained"
            color="error"
            disabled={!selectedPlayerForElimination || eliminationPosition < 1}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayerManagement;