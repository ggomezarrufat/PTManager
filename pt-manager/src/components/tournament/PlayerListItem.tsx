import React from 'react';
import { Card, CardContent, Typography, Box, Avatar, Divider } from '@mui/material';
import { TournamentPlayer, Tournament, TournamentClock } from '../../types';
import PlayerActionButtons from './PlayerActionButtons';

interface TournamentConfig {
  entry_fee: number;
  rebuy_chips: number;
  addon_chips: number;
}

interface PlayerListItemProps {
  player: TournamentPlayer;
  tournament: Tournament;
  tournamentConfig: TournamentConfig;
  clock: TournamentClock | null;
  onConfirmRegistration: (playerId: string) => Promise<void>;
  onRebuy: (playerId: string, amount: number, chips: number) => Promise<void>;
  onAddon: (playerId: string, amount: number, chips: number) => Promise<void>;
  onEliminate: (playerId: string, position: number, points: number) => Promise<void>;
  onCancelRegistration: (playerId: string) => Promise<void>;
  onUpdateChips: (playerId: string, chips: number) => Promise<void>;
  totalPlayers: number;
  eliminatedPlayers: number;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  player,
  tournament,
  tournamentConfig,
  clock,
  onConfirmRegistration,
  onRebuy,
  onAddon,
  onEliminate,
  onCancelRegistration,
  onUpdateChips,
  totalPlayers,
  eliminatedPlayers
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card
      sx={{
        mb: 1,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header con avatar y información básica */}
        <Box display="flex" alignItems="center" mb={1.5}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              bgcolor: player.is_eliminated ? 'error.main' : player.is_active ? 'success.main' : 'warning.main'
            }}
            src={player.user?.avatar_url}
          >
            {player.user?.name ? getInitials(player.user.name) : '?'}
          </Avatar>

          <Box flexGrow={1}>
            <Typography variant="h6" component="div" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {player.user?.name || 'Jugador desconocido'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {player.user?.nickname && `@${player.user.nickname}`}
            </Typography>
          </Box>
        </Box>

        {/* Información del jugador */}
        <Box display="flex" flexWrap="wrap" gap={1} mb={1.5}>
          <Box flex={1} minWidth="120px">
            <Typography variant="caption" color="text.secondary" display="block">
              Fichas actuales
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="primary.main">
              {player.current_chips.toLocaleString()}
            </Typography>
          </Box>

          <Box flex={1} minWidth="120px">
            <Typography variant="caption" color="text.secondary" display="block">
              Cuota pagada
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              €{player.entry_fee_paid}
            </Typography>
          </Box>

          {player.final_position && (
            <Box flex={1} minWidth="100px">
              <Typography variant="caption" color="text.secondary" display="block">
                Posición final
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="error.main">
                #{player.final_position}
              </Typography>
            </Box>
          )}

          {player.points_earned > 0 && (
            <Box flex={1} minWidth="100px">
              <Typography variant="caption" color="text.secondary" display="block">
                Puntos
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="success.main">
                {player.points_earned}
              </Typography>
            </Box>
          )}

          <Box flex={1} minWidth="120px">
            <Typography variant="caption" color="text.secondary" display="block">
              Recompras
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="info.main">
              {player.rebuys_count}
            </Typography>
          </Box>

          <Box flex={1} minWidth="100px">
            <Typography variant="caption" color="text.secondary" display="block">
              Addons
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="secondary.main">
              {player.addons_count}
            </Typography>
          </Box>
        </Box>

        {/* Fecha de registro */}
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Registrado: {formatDate(player.registration_time)}
        </Typography>

        {player.is_eliminated && player.eliminated_at && (
          <Typography variant="caption" color="error.main" sx={{ mb: 1, display: 'block' }}>
            Eliminado: {formatDate(player.eliminated_at)}
          </Typography>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Botones de acción */}
        <PlayerActionButtons
          player={player}
          tournament={tournament}
          tournamentConfig={tournamentConfig}
          clock={clock}
          onConfirmRegistration={onConfirmRegistration}
          onRebuy={onRebuy}
          onAddon={onAddon}
          onEliminate={onEliminate}
          onCancelRegistration={onCancelRegistration}
          onUpdateChips={onUpdateChips}
          totalPlayers={totalPlayers}
          eliminatedPlayers={eliminatedPlayers}
        />
      </CardContent>
    </Card>
  );
};

export default PlayerListItem;
