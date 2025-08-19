import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider
} from '@mui/material';
import {
  People,
  Casino,
  TrendingUp,
  AttachMoney,
  EmojiEvents
} from '@mui/icons-material';
import { TournamentStats as Stats, TournamentPlayer } from '../../types';
import { getUserDisplayName } from '../../utils/userUtils';

interface TournamentStatsProps {
  stats: Stats | null;
  players: TournamentPlayer[];
  tournamentName: string;
}

const TournamentStats: React.FC<TournamentStatsProps> = ({
  stats,
  players,
  tournamentName
}) => {
  if (!stats) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" textAlign="center" color="text.secondary">
            Estadísticas no disponibles
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatChips = (chips: number): string => {
    if (chips >= 1000000) {
      return `${(chips / 1000000).toFixed(1)}M`;
    } else if (chips >= 1000) {
      return `${(chips / 1000).toFixed(1)}k`;
    }
    return chips.toString();
  };

  // Calcular jugadores con más fichas
  const topPlayers = [...players]
    .filter(p => p.is_active && !p.is_eliminated)
    .sort((a, b) => b.current_chips - a.current_chips)
    .slice(0, 3);

  // Calcular jugadores con menos fichas
  const shortStackPlayers = [...players]
    .filter(p => p.is_active && !p.is_eliminated)
    .sort((a, b) => a.current_chips - b.current_chips)
    .slice(0, 3);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Estadísticas del Torneo
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {tournamentName}
        </Typography>

        {/* Estadísticas principales */}
        <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
          <Box flex="1" minWidth="120px" textAlign="center">
            <People color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div">
              {stats.total_players}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Jugadores
            </Typography>
          </Box>

          <Box flex="1" minWidth="120px" textAlign="center">
            <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div" color="success.main">
              {stats.active_players}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Jugadores Activos
            </Typography>
          </Box>

          <Box flex="1" minWidth="120px" textAlign="center">
            <AttachMoney color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div" color="warning.main">
              {formatCurrency(stats.total_prize_pool)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Premio Total
            </Typography>
          </Box>

          <Box flex="1" minWidth="120px" textAlign="center">
            <Casino color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div" color="info.main">
              {formatChips(stats.average_chips)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Promedio Fichas
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Estadísticas adicionales */}
        <Box display="flex" gap={2} mb={3}>
          <Box flex="1" display="flex" alignItems="center" gap={1}>
            <EmojiEvents color="error" />
            <Box>
              <Typography variant="h6">
                {stats.eliminated_players}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Eliminados
              </Typography>
            </Box>
          </Box>

          <Box flex="1" display="flex" alignItems="center" gap={1}>
            <Casino color="secondary" />
            <Box>
              <Typography variant="h6">
                {stats.total_rebuys}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recompras
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Top 3 jugadores con más fichas */}
        {topPlayers.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Top 3 - Más Fichas
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {topPlayers.map((player, index) => (
                <Box 
                  key={player.id} 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  p={1}
                  bgcolor="grey.50"
                  borderRadius={1}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip 
                      label={`#${index + 1}`} 
                      size="small" 
                      color={index === 0 ? 'warning' : index === 1 ? 'default' : 'primary'}
                    />
                    <Typography variant="body2">
                      {getUserDisplayName(player.user || null)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {formatChips(player.current_chips)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Jugadores con menos fichas */}
        {shortStackPlayers.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Short Stack
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {shortStackPlayers.map((player, index) => (
                <Box 
                  key={player.id} 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  p={1}
                  bgcolor="grey.50"
                  borderRadius={1}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip 
                      label={`#${index + 1}`} 
                      size="small" 
                      color="error"
                      variant="outlined"
                    />
                    <Typography variant="body2">
                      {getUserDisplayName(player.user || null)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    {formatChips(player.current_chips)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TournamentStats; 