import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { CheckCircle, ShoppingCart, AddBox, DeleteForever, Cancel } from '@mui/icons-material';
import { TournamentPlayer } from '../../types';

interface TournamentConfig {
  entry_fee: number;
  rebuy_chips: number;
  addon_chips: number;
}

interface PlayerActionButtonsProps {
  player: TournamentPlayer;
  tournamentConfig: TournamentConfig;
  onConfirmRegistration: (playerId: string) => Promise<void>;
  onRebuy: (playerId: string, amount: number, chips: number) => Promise<void>;
  onAddon: (playerId: string, amount: number, chips: number) => Promise<void>;
  onEliminate: (playerId: string, position: number, points: number) => Promise<void>;
  onCancelRegistration: (playerId: string) => Promise<void>;
  onUpdateChips: (playerId: string, chips: number) => Promise<void>;
  totalPlayers: number;
  eliminatedPlayers: number;
}

const PlayerActionButtons: React.FC<PlayerActionButtonsProps> = ({
  player,
  tournamentConfig,
  onConfirmRegistration,
  onRebuy,
  onAddon,
  onEliminate,
  onCancelRegistration,
  onUpdateChips,
  totalPlayers,
  eliminatedPlayers
}) => {
  const [eliminateDialog, setEliminateDialog] = useState(false);
  const [chipsDialog, setChipsDialog] = useState(false);

  const [eliminatePosition, setEliminatePosition] = useState('');
  const [eliminatePoints, setEliminatePoints] = useState('');
  const [chipsAmount, setChipsAmount] = useState(player.current_chips.toString());

  // Calcular valores automáticamente cuando se abre el modal
  const calculateEliminationValues = () => {
    const calculatedPosition = totalPlayers - eliminatedPlayers;
    const calculatedPoints = eliminatedPlayers + 1;
    setEliminatePosition(calculatedPosition.toString());
    setEliminatePoints(calculatedPoints.toString());
  };

  const handleRebuyConfirm = async () => {
    await onRebuy(player.id, tournamentConfig.entry_fee, tournamentConfig.rebuy_chips);
  };

  const handleAddonConfirm = async () => {
    await onAddon(player.id, tournamentConfig.entry_fee, tournamentConfig.addon_chips);
  };

  const handleEliminateSubmit = async () => {
    if (eliminatePosition && eliminatePoints) {
      await onEliminate(player.id, parseInt(eliminatePosition), parseInt(eliminatePoints));
      setEliminateDialog(false);
      setEliminatePosition('');
      setEliminatePoints('');
    }
  };

  const handleChipsSubmit = async () => {
    if (chipsAmount) {
      await onUpdateChips(player.id, parseInt(chipsAmount));
      setChipsDialog(false);
    }
  };

  const getStatusColor = () => {
    if (player.is_eliminated) return 'error';
    if (player.is_active) return 'success';
    return 'warning';
  };

  const getStatusText = () => {
    if (player.is_eliminated) return 'Eliminado';
    if (player.is_active) return 'Activo';
    return 'Inactivo';
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Status del jugador */}
      <Chip
        label={getStatusText()}
        color={getStatusColor()}
        size="small"
        variant="outlined"
      />

      {/* Confirmar inscripción - solo si no está activo */}
      {!player.is_active && !player.is_eliminated && (
        <Tooltip title="Confirmar inscripción">
          <IconButton
            size="large"
            color="success"
            onClick={() => onConfirmRegistration(player.id)}
            sx={{
              width: 56,
              height: 56,
              border: '2px solid',
              borderColor: 'success.main',
              '&:hover': {
                backgroundColor: 'success.main',
                color: 'white'
              }
            }}
          >
            <CheckCircle sx={{ fontSize: 28 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Actualizar fichas - solo si está activo */}
      {player.is_active && (
        <Tooltip title="Actualizar fichas">
          <IconButton
            size="large"
            color="primary"
            onClick={() => setChipsDialog(true)}
            sx={{
              width: 56,
              height: 56,
              border: '2px solid',
              borderColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white'
              }
            }}
          >
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {player.current_chips.toLocaleString()}
            </Typography>
          </IconButton>
        </Tooltip>
      )}

      {/* Recompra - solo si está activo */}
      {player.is_active && (
        <Tooltip title={`Recompra (€${tournamentConfig.entry_fee} → ${tournamentConfig.rebuy_chips} fichas)`}>
          <IconButton
            size="large"
            color="info"
            onClick={handleRebuyConfirm}
            sx={{
              width: 56,
              height: 56,
              border: '2px solid',
              borderColor: 'info.main',
              '&:hover': {
                backgroundColor: 'info.main',
                color: 'white'
              }
            }}
          >
            <ShoppingCart sx={{ fontSize: 28 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Addon - solo si está activo */}
      {player.is_active && (
        <Tooltip title={`Addon (€${tournamentConfig.entry_fee} → ${tournamentConfig.addon_chips} fichas)`}>
          <IconButton
            size="large"
            color="secondary"
            onClick={handleAddonConfirm}
            sx={{
              width: 56,
              height: 56,
              border: '2px solid',
              borderColor: 'secondary.main',
              '&:hover': {
                backgroundColor: 'secondary.main',
                color: 'white'
              }
            }}
          >
            <AddBox sx={{ fontSize: 28 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Eliminar - solo si está activo */}
      {player.is_active && (
        <Tooltip title="Eliminar jugador">
          <IconButton
            size="large"
            color="error"
            onClick={() => {
              calculateEliminationValues();
              setEliminateDialog(true);
            }}
            sx={{
              width: 56,
              height: 56,
              border: '2px solid',
              borderColor: 'error.main',
              '&:hover': {
                backgroundColor: 'error.main',
                color: 'white'
              }
            }}
          >
            <DeleteForever sx={{ fontSize: 28 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Anular inscripción */}
      <Tooltip title="Anular inscripción">
        <IconButton
          size="large"
          color="warning"
          onClick={() => onCancelRegistration(player.id)}
          sx={{
            width: 56,
            height: 56,
            border: '2px solid',
            borderColor: 'warning.main',
            '&:hover': {
              backgroundColor: 'warning.main',
              color: 'white'
            }
          }}
        >
          <Cancel sx={{ fontSize: 28 }} />
        </IconButton>
      </Tooltip>



      {/* Diálogo de Eliminación */}
      <Dialog open={eliminateDialog} onClose={() => setEliminateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Eliminar Jugador</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Jugador: {player.user?.name || 'N/A'}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Posición final"
            type="number"
            fullWidth
            variant="outlined"
            value={eliminatePosition}
            onChange={(e) => setEliminatePosition(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Puntos obtenidos"
            type="number"
            fullWidth
            variant="outlined"
            value={eliminatePoints}
            onChange={(e) => setEliminatePoints(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEliminateDialog(false)}>Cancelar</Button>
          <Button onClick={handleEliminateSubmit} variant="contained" color="error">
            Eliminar Jugador
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Actualizar Fichas */}
      <Dialog open={chipsDialog} onClose={() => setChipsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Actualizar Fichas</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Jugador: {player.user?.name || 'N/A'}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Fichas actuales"
            type="number"
            fullWidth
            variant="outlined"
            value={chipsAmount}
            onChange={(e) => setChipsAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChipsDialog(false)}>Cancelar</Button>
          <Button onClick={handleChipsSubmit} variant="contained" color="primary">
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayerActionButtons;
