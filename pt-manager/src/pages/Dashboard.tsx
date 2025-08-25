import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add,
  Casino,
  PersonAdd,
  PersonRemove,
  EmojiEvents,
  TrendingUp
} from '@mui/icons-material';
import { useTournamentStore } from '../store/tournamentStore';
import { useAuthStore } from '../store/authStore';
import { Tournament } from '../types';
import { getUserDisplayName } from '../utils/userUtils';
import { format } from 'date-fns';
import ImageCarousel from '../components/ui/ImageCarousel';
import { reportsService, playerService } from '../services/apiService';

const Dashboard: React.FC = () => {
  console.log('🔍 Dashboard: Componente montándose...');
  
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { 
    tournaments, 
    loading, 
    error, 
    loadTournaments 
  } = useTournamentStore();
  
  console.log('🔍 Dashboard: Estado inicial:', {
    user: !!user,
    tournamentsCount: tournaments?.length || 0,
    loading,
    error
  });

  // Estado para manejar inscripciones y jugadores
  const [inscriptions, setInscriptions] = useState<{[key: string]: boolean}>({});
  const [playerCounts, setPlayerCounts] = useState<{[key: string]: number}>({});
  const [tournamentPlayers, setTournamentPlayers] = useState<{[key: string]: any[]}>({});
  const [playersLoading, setPlayersLoading] = useState<{[key: string]: boolean}>({});
  
  // Estado para el leaderboard de la temporada
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  
  // Estado para el modal de jugadores
  const [playersModalOpen, setPlayersModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    console.log('🔍 Dashboard: useEffect ejecutándose...');
    console.log('🔍 Dashboard: loadTournaments disponible:', !!loadTournaments);
    console.log('🔍 Dashboard: loadLeaderboard disponible:', !!loadLeaderboard);
    
    loadTournaments();
    loadLeaderboard();
  }, [loadTournaments]);



  const loadLeaderboard = async () => {
    try {
      console.log('🔍 Dashboard: Iniciando carga del leaderboard...');
      setLeaderboardLoading(true);
      setLeaderboardError(null);
      const response = await reportsService.getLeaderboard();
      console.log('📊 Dashboard: Leaderboard cargado:', {
        hasData: !!response.leaderboard,
        count: response.leaderboard?.length || 0,
        data: response.leaderboard
      });
      setLeaderboard(response.leaderboard);
    } catch (err) {
      console.error('❌ Dashboard: Error cargando leaderboard:', err);
      setLeaderboardError(err instanceof Error ? err.message : 'Error al cargar la tabla de posiciones');
    } finally {
      setLeaderboardLoading(false);
      console.log('🏁 Dashboard: Leaderboard loading completado');
    }
  };

  const loadTournamentPlayers = useCallback(async (tournamentId: string) => {
    try {
      setPlayersLoading(prev => ({ ...prev, [tournamentId]: true }));
      const response = await playerService.getTournamentPlayers(tournamentId);
      const players = response.players || [];
      setTournamentPlayers(prev => ({ ...prev, [tournamentId]: players }));
      setPlayerCounts(prev => ({ ...prev, [tournamentId]: players.length }));
      
      // Verificar si el usuario actual está inscripto
      const currentUser = players.find(player => player.user_id === user?.id);
      setInscriptions(prev => ({ ...prev, [tournamentId]: !!currentUser }));
    } catch (err) {
      console.error('Error al cargar jugadores del torneo:', err);
      setPlayerCounts(prev => ({ ...prev, [tournamentId]: 0 }));
    } finally {
      setPlayersLoading(prev => ({ ...prev, [tournamentId]: false }));
    }
  }, [user?.id]);

  const handleInscription = useCallback(async (tournament: Tournament) => {
    const tournamentId = tournament.id;
    const isCurrentlyInscribed = inscriptions[tournamentId];

    try {
      if (isCurrentlyInscribed) {
        // Desinscribirse del torneo
        const player = tournamentPlayers[tournamentId]?.find(p => p.user_id === user?.id);
        if (player) {
          await playerService.removePlayer(player.id);
          setInscriptions(prev => ({ ...prev, [tournamentId]: false }));
          setPlayerCounts(prev => ({ ...prev, [tournamentId]: (prev[tournamentId] || 1) - 1 }));
          // Recargar jugadores para actualizar la lista
          await loadTournamentPlayers(tournamentId);
        }
      } else {
        // Inscribirse al torneo
        await playerService.addPlayerToTournament(tournamentId, {
          user_id: user?.id || '',
          entry_fee_paid: tournament.entry_fee,
          initial_chips: 1000 // Chips iniciales por defecto
        });
        setInscriptions(prev => ({ ...prev, [tournamentId]: true }));
        setPlayerCounts(prev => ({ ...prev, [tournamentId]: (prev[tournamentId] || 0) + 1 }));
        // Recargar jugadores para actualizar la lista
        await loadTournamentPlayers(tournamentId);
      }
    } catch (err) {
      console.error('Error al manejar inscripción:', err);
      // Revertir cambios en caso de error
      setInscriptions(prev => ({ ...prev, [tournamentId]: isCurrentlyInscribed }));
    }
  }, [inscriptions, tournamentPlayers, user?.id, loadTournamentPlayers]);

  const handleShowPlayers = useCallback((tournament: Tournament) => {
    setSelectedTournament(tournament);
    setPlayersModalOpen(true);
  }, []);

  const handleClosePlayersModal = useCallback(() => {
    setPlayersModalOpen(false);
    setSelectedTournament(null);
  }, []);

  const activeTournaments = tournaments.filter((t: Tournament) => t.status === 'active');
  const scheduledTournaments = tournaments.filter((t: Tournament) => t.status === 'scheduled');

  // Cargar jugadores de torneos programados cuando se carguen los torneos
  useEffect(() => {
    if (scheduledTournaments.length > 0) {
      scheduledTournaments.forEach(tournament => {
        // Solo cargar si no se han cargado antes
        if (!tournamentPlayers[tournament.id] && !playersLoading[tournament.id]) {
          loadTournamentPlayers(tournament.id);
        }
      });
    }
  }, [scheduledTournaments, loadTournamentPlayers, tournamentPlayers, playersLoading]);





  // Datos simulados para la tabla de posiciones
  const getLeaderboardData = () => {
    return [
      { position: 1, player: "Carlos Rodríguez", chips: 125000, change: "+25%", isCurrentUser: false },
      { position: 2, player: "María González", chips: 98000, change: "+18%", isCurrentUser: false },
      { position: 3, player: getUserDisplayName(user), chips: 87500, change: "+12%", isCurrentUser: true },
      { position: 4, player: "Juan Pérez", chips: 72000, change: "+8%", isCurrentUser: false },
      { position: 5, player: "Ana Martínez", chips: 65000, change: "+5%", isCurrentUser: false },
      { position: 6, player: "Luis Fernández", chips: 58000, change: "-2%", isCurrentUser: false },
      { position: 7, player: "Carmen López", chips: 52000, change: "-5%", isCurrentUser: false },
      { position: 8, player: "Roberto Silva", chips: 48000, change: "-8%", isCurrentUser: false }
    ];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando torneos...</Typography>
      </Box>
    );
  }

  console.log('🔍 Dashboard: Renderizando componente...');
  
  return (
    <Box>
      {/* Carrusel de imágenes */}
      <ImageCarousel 
        images={[
          '/banner1.png',
          '/banner2.png',
          '/banner3.png'
        ]}
        autoPlay={true}
        interval={4000}
      />

      {/* Destacar reloj si hay torneo activo */}
      {activeTournaments.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Torneo en curso
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(`/tournament/${activeTournaments[0].id}`)}
          >
            Ver reloj del torneo
          </Button>
        </Box>
      )}
      {/* Header */}
      <Box mb={4}>
        <Typography variant="body1" color="text.secondary">
          Bienvenido, {getUserDisplayName(user)}. Aquí puedes gestionar tus torneos de póker.
        </Typography>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Torneos activos */}
      {activeTournaments.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Torneos Activos
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {activeTournaments.map((tournament: Tournament) => (
              <Box flex="1" minWidth="300px" key={tournament.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2">
                        {tournament.name}
                      </Typography>
                      <Chip label="Activo" color="success" size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {tournament.description}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">
                        Entrada: ${tournament.entry_fee}
                      </Typography>
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => navigate(`/tournament/${tournament.id}`)}
                      >
                        Ver Torneo
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Próximo torneo programado */}
      {scheduledTournaments.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Próximo Torneo
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {scheduledTournaments.slice(0, 1).map((tournament: Tournament) => (
              <Box flex="1" minWidth="300px" key={tournament.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2">
                        {tournament.name}
                      </Typography>
                      <Chip label="Programado" color="warning" size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {tournament.description}
                    </Typography>
                    
                    {/* Información del torneo */}
                    <Box mb={3}>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Inicio: {format(new Date(tournament.scheduled_start_time), 'dd/MM/yyyy HH:mm')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Entrada: ${tournament.entry_fee}
                      </Typography>
                    </Box>

                    {/* Contador de jugadores y botón de inscripción */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Casino color="primary" sx={{ fontSize: 20 }} />
                        <Typography 
                          variant="body2" 
                          color="text.primary"
                          sx={{ 
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            '&:hover': { color: 'primary.dark' }
                          }}
                          onClick={() => handleShowPlayers(tournament)}
                        >
                          {playersLoading[tournament.id] ? (
                            <CircularProgress size={16} />
                          ) : (
                            `${playerCounts[tournament.id] || 0} jugadores inscriptos`
                          )}
                        </Typography>
                      </Box>
                      
                      <Button
                        variant={inscriptions[tournament.id] ? "outlined" : "contained"}
                        color={inscriptions[tournament.id] ? "error" : "primary"}
                        startIcon={inscriptions[tournament.id] ? <PersonRemove /> : <PersonAdd />}
                        size="small"
                        onClick={() => handleInscription(tournament)}
                        disabled={playersLoading[tournament.id]}
                      >
                        {inscriptions[tournament.id] ? "Desinscribirse" : "Inscribirse"}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Tabla de posiciones de la temporada actual */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom display="flex" alignItems="center" gap={1}>
          🏆 Tabla de Posiciones de la Temporada
        </Typography>
        <Card>
          <CardContent>
            {(() => {
              console.log('🔍 Dashboard Render: Estado del leaderboard:', {
                loading: leaderboardLoading,
                error: leaderboardError,
                hasData: leaderboard.length > 0,
                count: leaderboard.length,
                data: leaderboard
              });
              return null;
            })()}
            {leaderboardLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
                <CircularProgress />
              </Box>
            ) : leaderboardError ? (
              <Alert severity="error">{leaderboardError}</Alert>
            ) : leaderboard.length === 0 ? (
              <Alert severity="info">No hay datos para la tabla de posiciones aún. Los puntos se mostrarán después de jugar torneos.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                        Pos
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                        Jugador
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                        Torneos
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                        Puntos
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboard.map((entry, index) => (
                      <TableRow 
                        key={entry.user_id}
                        sx={{
                          backgroundColor: entry.user_id === user?.id ? 'action.hover' : 'inherit',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {index === 0 && <EmojiEvents sx={{ color: 'gold', fontSize: 20 }} />}
                            {index === 1 && <EmojiEvents sx={{ color: 'silver', fontSize: 20 }} />}
                            {index === 2 && <EmojiEvents sx={{ color: 'brown', fontSize: 20 }} />}
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: index <= 2 ? 'bold' : 'normal',
                                color: index <= 2 ? 'primary.main' : 'inherit'
                              }}
                            >
                              #{index + 1}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: entry.user_id === user?.id ? 'bold' : 'normal',
                              color: entry.user_id === user?.id ? 'primary.main' : 'inherit'
                            }}
                          >
                            {getUserDisplayName(entry)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {entry.tournaments_played}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {entry.total_points.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Tabla de posiciones del torneo actual */}
      {activeTournaments.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Tabla de Posiciones - {activeTournaments[0].name}
          </Typography>
          <Card>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                      Pos
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                      Jugador
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                      Fichas
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                      Cambio
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getLeaderboardData().map((row) => (
                    <TableRow 
                      key={row.position}
                      sx={{
                        backgroundColor: row.isCurrentUser ? 'action.hover' : 'inherit',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {row.position === 1 && <EmojiEvents sx={{ color: 'gold', fontSize: 20 }} />}
                          {row.position === 2 && <EmojiEvents sx={{ color: 'silver', fontSize: 20 }} />}
                          {row.position === 3 && <EmojiEvents sx={{ color: 'brown', fontSize: 20 }} />}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: row.position <= 3 ? 'bold' : 'normal',
                              color: row.position <= 3 ? 'primary.main' : 'inherit'
                            }}
                          >
                            {row.position}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: row.isCurrentUser ? 'bold' : 'normal',
                            color: row.isCurrentUser ? 'primary.main' : 'inherit'
                          }}
                        >
                          {row.player}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {row.chips.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TrendingUp 
                            sx={{ 
                              color: row.change.startsWith('+') ? 'success.main' : 'error.main',
                              fontSize: 16 
                            }} 
                          />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: row.change.startsWith('+') ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }}
                          >
                            {row.change}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* Mensaje cuando no hay torneos */}
      {tournaments.length === 0 && !loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Casino sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No hay torneos disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {user?.is_admin 
                ? 'Crea tu primer torneo para comenzar a gestionar partidas de póker.'
                : 'No tienes torneos asignados. Contacta a un administrador.'
              }
            </Typography>
            {user?.is_admin && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/tournament/new')}
              >
                Crear Primer Torneo
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Jugadores Inscriptos */}
      <Dialog
        open={playersModalOpen}
        onClose={handleClosePlayersModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Jugadores Inscriptos - {selectedTournament?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTournament && tournamentPlayers[selectedTournament.id] ? (
            tournamentPlayers[selectedTournament.id].length === 0 ? (
              <Alert severity="info">
                No hay jugadores inscriptos en este torneo aún.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                        Apodo
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                        Nombre Completo
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tournamentPlayers[selectedTournament.id].map((player) => (
                      <TableRow 
                        key={player.id}
                        sx={{
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" color="primary.main">
                            {player.nickname || 'Sin apodo'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {player.name || 'Sin nombre'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePlayersModal} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 