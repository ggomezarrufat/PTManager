import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
  Grid,
  Fab,
  Stack,
  Avatar,
  InputAdornment,
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Casino as CasinoIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Search as SearchIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { tournamentService } from '../services/apiService';
import { Tournament } from '../types/tournaments';

const TournamentList: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTournaments();
  }, []);

  // Filtrar torneos basado en el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTournaments(tournaments);
      return;
    }

    const filtered = tournaments.filter(tournament => {
      const searchLower = searchTerm.toLowerCase();
      return (
        tournament.name.toLowerCase().includes(searchLower) ||
        (tournament.description && tournament.description.toLowerCase().includes(searchLower)) ||
        tournament.status.toLowerCase().includes(searchLower)
      );
    });
    setFilteredTournaments(filtered);
  }, [searchTerm, tournaments]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tournamentService.getTournaments(1, 100);
      setTournaments(response.tournaments || []);
      setFilteredTournaments(response.tournaments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los torneos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = () => {
    navigate('/tournament/new');
  };

  const handleEditTournament = (tournament: Tournament) => {
    // Navegar a la página de gestión del torneo para editar
    navigate(`/tournament/${tournament.id}/manage`);
  };

  const handleViewTournament = (tournament: Tournament) => {
    navigate(`/tournament/${tournament.id}`);
  };

  const handleDeleteTournament = async (tournament: Tournament) => {
    // Validar que el torneo se pueda eliminar
    if (tournament.status === 'active' || tournament.status === 'finished') {
      setError('No se puede eliminar un torneo que está activo o finalizado');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que quieres eliminar el torneo "${tournament.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null); // Limpiar errores previos
      setSuccess(null); // Limpiar mensajes de éxito previos
      
      await tournamentService.deleteTournament(tournament.id);
      
      // Recargar la lista de torneos
      await loadTournaments();
      
      // Mostrar mensaje de éxito
      setSuccess('Torneo eliminado exitosamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el torneo');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTournamentStatus = (tournament: Tournament) => {
    switch (tournament.status) {
      case 'scheduled':
        return {
          status: 'Programado',
          color: 'warning' as const,
          icon: <TimerIcon fontSize="small" />,
          bgColor: 'warning.light'
        };
      case 'active':
        return {
          status: 'Activo',
          color: 'success' as const,
          icon: <PlayArrowIcon fontSize="small" />,
          bgColor: 'success.light'
        };
      case 'paused':
        return {
          status: 'Pausado',
          color: 'warning' as const,
          icon: <PauseIcon fontSize="small" />,
          bgColor: 'warning.light'
        };
      case 'finished':
        return {
          status: 'Finalizado',
          color: 'error' as const,
          icon: <TrophyIcon fontSize="small" />,
          bgColor: 'error.light'
        };
      default:
        return {
          status: tournament.status,
          color: 'default' as const,
          icon: <CasinoIcon fontSize="small" />,
          bgColor: 'grey.300'
        };
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 },
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        gap: 2
      }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1"
          sx={{ fontWeight: 700 }}
        >
          Gestión de Torneos
        </Typography>
        
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTournament}
            size="large"
          >
            Nuevo Torneo
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Buscador */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar torneos por nombre, descripción o estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            variant="outlined"
            size={isMobile ? "medium" : "small"}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Contenido principal */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {filteredTournaments.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 4 }}>
            <CardContent>
              {searchTerm ? (
                <>
                  <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No se encontraron torneos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No hay torneos que coincidan con "{searchTerm}"
                  </Typography>
                </>
              ) : (
                <>
                  <CasinoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No hay torneos registrados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comienza creando tu primer torneo de póker
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredTournaments.map((tournament) => {
              const statusInfo = getTournamentStatus(tournament);
              
              return (
                <Grid size={{xs: 12, sm: 6, md: 4}} key={tournament.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      transition: 'all 0.2s ease-in-out',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                    onClick={() => handleViewTournament(tournament)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header del torneo */}
                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                          <Avatar sx={{ 
                            bgcolor: 'primary.main',
                            width: 48,
                            height: 48
                          }}>
                            <CasinoIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                              {tournament.name}
                            </Typography>
                            {tournament.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {tournament.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Chip
                            label={statusInfo.status}
                            color={statusInfo.color}
                            icon={statusInfo.icon}
                            size="small"
                            sx={{ 
                              fontWeight: 600,
                              backgroundColor: statusInfo.bgColor,
                              color: 'white'
                            }}
                          />
                        </Box>
                      </Box>

                      <Stack spacing={2}>
                        {/* Información básica */}
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Entry Fee:
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {formatCurrency(tournament.entry_fee)}
                          </Typography>
                        </Box>

                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Jugadores:
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {tournament.max_players}
                          </Typography>
                        </Box>

                        {/* Fecha y hora */}
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTimeIcon fontSize="small" color="primary" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Inicio Programado
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatDate(tournament.scheduled_start_time)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(tournament.scheduled_start_time)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Fechas de inicio y fin si están disponibles */}
                        {tournament.actual_start_time && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <PlayArrowIcon fontSize="small" color="success" />
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Iniciado
                              </Typography>
                              <Typography variant="body2" fontWeight={500}>
                                {formatDate(tournament.actual_start_time)}
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {tournament.end_time && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <TrophyIcon fontSize="small" color="error" />
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Finalizado
                              </Typography>
                              <Typography variant="body2" fontWeight={500}>
                                {formatDate(tournament.end_time)}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Stack>

                      {/* Acciones */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mt: 3,
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <IconButton
                          aria-label="ver torneo"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTournament(tournament);
                          }}
                          size="small"
                          sx={{ 
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                            '&:hover': {
                              backgroundColor: 'primary.main'
                            }
                          }}
                        >
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton
                          aria-label="editar torneo"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTournament(tournament);
                          }}
                          size="small"
                          sx={{ 
                            backgroundColor: 'info.light',
                            color: 'info.contrastText',
                            '&:hover': {
                              backgroundColor: 'info.main'
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton
                          aria-label="eliminar torneo"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTournament(tournament);
                          }}
                          disabled={tournament.status === 'active' || tournament.status === 'finished'}
                          size="small"
                          sx={{ 
                            backgroundColor: 'error.light',
                            color: 'error.contrastText',
                            '&:hover': {
                              backgroundColor: 'error.main'
                            },
                            '&.Mui-disabled': {
                              backgroundColor: 'grey.300',
                              color: 'grey.500',
                            }
                          }}
                          title={
                            tournament.status === 'active' || tournament.status === 'finished'
                              ? 'No se puede eliminar un torneo activo o finalizado'
                              : 'Eliminar torneo'
                          }
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* FAB para móviles */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="nuevo torneo"
          onClick={handleCreateTournament}
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
    </Box>
  );
};

export default TournamentList;
