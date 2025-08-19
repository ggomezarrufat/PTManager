import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { reportsService, tournamentService } from '../services/apiService';
import { useTournamentStore } from '../store/tournamentStore';
import { useAuthStore } from '../store/authStore';
import { getUserDisplayName } from '../utils/userUtils';
import { useNavigate } from 'react-router-dom';

interface PlayerTournament {
  tournament_id: string;
  tournament_name: string;
  final_position: number;
  points_earned: number;
  tournament_date: string;
}

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tournaments, loadTournaments, loading, error } = useTournamentStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  
  // Estados para el modal de detalle de torneos
  const [tournamentDetailsOpen, setTournamentDetailsOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerTournaments, setPlayerTournaments] = useState<PlayerTournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [tournamentsError, setTournamentsError] = useState<string | null>(null);

  useEffect(() => {
    loadTournaments();
    loadLeaderboard();
  }, [loadTournaments]);

  const loadLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      setLeaderboardError(null);
      const response = await reportsService.getLeaderboard();
      setLeaderboard(response.leaderboard);
    } catch (err) {
      setLeaderboardError(err instanceof Error ? err.message : 'Error al cargar la tabla de posiciones');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleEditResults = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}?edit=results`);
  };

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el torneo "${tournamentName}" y todos sus datos asociados? Esta acción es irreversible.`)) {
      try {
        // Usar fetch directamente ya que deleteTournament no está disponible
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tournaments/${tournamentId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}` }
        });
        if (response.ok) {
          loadTournaments();
        }
      } catch (err) {
        console.error('Error deleting tournament:', err);
      }
    }
  };

  const handleShowTournamentDetails = async (player: any) => {
    setSelectedPlayer(player);
    setTournamentDetailsOpen(true);
    setTournamentsLoading(true);
    setTournamentsError(null);

    try {
      const response = await reportsService.getPlayerTournaments(player.user_id);
      setPlayerTournaments(response.tournaments);
    } catch (err) {
      setTournamentsError(err instanceof Error ? err.message : 'Error al cargar los torneos del jugador');
    } finally {
      setTournamentsLoading(false);
    }
  };

  const handleCloseTournamentDetails = () => {
    setTournamentDetailsOpen(false);
    setSelectedPlayer(null);
    setPlayerTournaments([]);
    setTournamentsError(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const activeTournaments = tournaments.filter(t => t.status === 'active').length;
  const finishedTournaments = tournaments.filter(t => t.status === 'finished').length;
  const scheduledTournaments = tournaments.filter(t => t.status === 'scheduled').length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reportes y Estadísticas
      </Typography>

      {/* Resumen de Estadísticas */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Torneos Activos
            </Typography>
            <Typography variant="h4" color="primary">
              {activeTournaments}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Torneos Finalizados
            </Typography>
            <Typography variant="h4" color="success.main">
              {finishedTournaments}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Torneos Programados
            </Typography>
            <Typography variant="h4" color="warning.main">
              {scheduledTournaments}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Historial de Torneos */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Historial de Torneos
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : tournaments.length === 0 ? (
            <Alert severity="info">No hay torneos registrados.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha de Inicio</TableCell>
                    <TableCell>Jugadores</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tournaments.map((tournament) => (
                    <TableRow key={tournament.id}>
                      <TableCell>{tournament.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={tournament.status === 'finished' ? 'Finalizado' : 
                                 tournament.status === 'active' ? 'Activo' : 
                                 tournament.status === 'scheduled' ? 'Programado' : tournament.status}
                          color={tournament.status === 'finished' ? 'success' : 
                                 tournament.status === 'active' ? 'primary' : 
                                 tournament.status === 'scheduled' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {tournament.scheduled_start_time ? 
                          new Date(tournament.scheduled_start_time).toLocaleDateString('es-ES') : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>0</TableCell>
                      <TableCell align="center">
                        {user?.is_admin && (
                          <Box display="flex" justifyContent="center" gap={1}>
                            {tournament.status === 'finished' && (
                              <IconButton 
                                aria-label="editar resultados" 
                                onClick={() => handleEditResults(tournament.id)}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton 
                              aria-label="eliminar torneo" 
                              onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Posiciones */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <TrophyIcon />
            Tabla de Posiciones (Puntos Totales)
          </Typography>

          {leaderboardLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
              <CircularProgress />
            </Box>
          ) : leaderboardError ? (
            <Alert severity="error">{leaderboardError}</Alert>
          ) : leaderboard.length === 0 ? (
            <Alert severity="info">No hay datos para la tabla de posiciones aún.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Posición</TableCell>
                    <TableCell>Jugador</TableCell>
                    <TableCell align="right">Torneos Jugados</TableCell>
                    <TableCell align="right">Puntos Totales</TableCell>
                    <TableCell align="center">Detalles</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((entry, index) => (
                    <TableRow key={entry.user_id}>
                      <TableCell>#{index + 1}</TableCell>
                      <TableCell>{getUserDisplayName(entry)}</TableCell>
                      <TableCell align="right">{entry.tournaments_played}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold" color="primary.main">
                          {entry.total_points}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          aria-label="ver detalles de torneos"
                          onClick={() => handleShowTournamentDetails(entry)}
                          size="small"
                          color="info"
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalle de Torneos */}
      <Dialog
        open={tournamentDetailsOpen}
        onClose={handleCloseTournamentDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalle de Torneos - {selectedPlayer ? getUserDisplayName(selectedPlayer) : ''}
        </DialogTitle>
        <DialogContent>
          {tournamentsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : tournamentsError ? (
            <Alert severity="error">{tournamentsError}</Alert>
          ) : playerTournaments.length === 0 ? (
            <Alert severity="info">No hay torneos registrados para este jugador.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre del Torneo</TableCell>
                    <TableCell align="center">Posición Final</TableCell>
                    <TableCell align="right">Puntos Obtenidos</TableCell>
                    <TableCell>Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {playerTournaments.map((tournament) => (
                    <TableRow key={tournament.tournament_id}>
                      <TableCell>{tournament.tournament_name}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`#${tournament.final_position || 'N/A'}`}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold" color="primary.main">
                          {tournament.points_earned}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(tournament.tournament_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTournamentDetails} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Nota sobre estadísticas futuras */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="body2" color="textSecondary">
            <strong>Nota:</strong> Las estadísticas se actualizan en tiempo real. 
            Los puntos se calculan según el sistema de puntuación configurado para cada torneo.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;