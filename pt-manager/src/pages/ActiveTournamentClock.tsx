import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { tournamentService } from '../services/apiService';
import { Tournament } from '../types/tournaments';
import TournamentClock from '../components/tournament/TournamentClock';
import ConnectionDebug from '../components/tournament/ConnectionDebug';

const ActiveTournamentClock: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    loadActiveTournament();
  }, []);

  const loadActiveTournament = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar torneos activos
      const response = await tournamentService.getTournaments(1, 100, 'active');
      const activeTournaments = response.tournaments || [];

      if (activeTournaments.length === 0) {
        setError('No hay torneos activos en este momento');
        return;
      }

      // Tomar el primer torneo activo
      const tournament = activeTournaments[0];
      setActiveTournament(tournament);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el torneo activo');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToTournaments = () => {
    navigate('/tournaments');
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
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToTournaments}
          sx={{ mb: 3 }}
        >
          Volver a Torneos
        </Button>

        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>

        <Typography variant="body1" color="text.secondary">
          No hay torneos activos en este momento.
          Ve a la sección de Torneos para ver el estado de todos los torneos.
        </Typography>
      </Box>
    );
  }

  if (!activeTournament) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToTournaments}
          sx={{ mb: 3 }}
        >
          Volver a Torneos
        </Button>

        <Alert severity="info">
          No se pudo cargar el torneo activo
        </Alert>
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
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToTournaments}
            sx={{ mb: 2 }}
          >
            Volver a Torneos
          </Button>

          <Typography
            variant={isMobile ? "h5" : "h4"}
            component="h1"
            sx={{ fontWeight: 700 }}
          >
            Reloj del Torneo Activo
          </Typography>

          <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
            {activeTournament.name}
          </Typography>
        </Box>
      </Box>

      {/* Reloj del Torneo */}
      <Box sx={{ flex: 1 }}>
        <TournamentClock
          tournamentId={activeTournament.id}
        />
      </Box>

      {/* Debug Panel */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? '🔽 Ocultar Debug' : '🔍 Mostrar Debug WebSocket'}
        </Button>

        {showDebug && (
          <Box sx={{ mt: 2 }}>
            <ConnectionDebug tournamentId={activeTournament.id} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ActiveTournamentClock;
