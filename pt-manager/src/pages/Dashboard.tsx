import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert
} from '@mui/material';
import {
  Add,
  Casino,
  TrendingUp,
  Schedule
} from '@mui/icons-material';
import { useTournamentStore } from '../store/tournamentStore';
import { useAuthStore } from '../store/authStore';
import { Tournament } from '../types';
import { getUserDisplayName } from '../utils/userUtils';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { 
    tournaments, 
    loading, 
    error, 
    loadTournaments 
  } = useTournamentStore();

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const activeTournaments = tournaments.filter((t: Tournament) => t.status === 'active');
  const scheduledTournaments = tournaments.filter((t: Tournament) => t.status === 'scheduled');
  const finishedTournaments = tournaments.filter((t: Tournament) => t.status === 'finished');

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando torneos...</Typography>
      </Box>
    );
  }

  return (
    <Box>
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
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
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

      {/* Estadísticas rápidas */}
      <Box display="flex" flexWrap="wrap" gap={3} mb={4}>
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Casino color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {tournaments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Torneos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div" color="success.main">
                    {activeTournaments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Torneos Activos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Schedule color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div" color="warning.main">
                    {scheduledTournaments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Programados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Casino color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div" color="error.main">
                    {finishedTournaments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Finalizados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

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

      {/* Torneos programados */}
      {scheduledTournaments.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Torneos Programados
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {scheduledTournaments.map((tournament: Tournament) => (
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
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">
                        Inicio: {format(new Date(tournament.scheduled_start_time), 'dd/MM/yyyy HH:mm')}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => navigate(`/tournament/${tournament.id}/manage`)}
                      >
                        Gestionar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Acciones rápidas */}
      {user?.is_admin && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Acciones Rápidas
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/tournament/new')}
            >
              Crear Nuevo Torneo
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/reports')}
            >
              Ver Reportes
            </Button>
          </Box>
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
    </Box>
  );
};

export default Dashboard; 