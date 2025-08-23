import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useTournamentStore } from '../store/tournamentStore';
import { tournamentService } from '../services/apiService';
import { BlindLevel } from '../types';
import { seasonService } from '../services/apiService';
import { Season } from '../types/seasons';

const CreateTournament: React.FC = () => {
  const navigate = useNavigate();
  const { loading } = useTournamentStore();

  // Estados del formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState<Date | null>(new Date());
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [entryFee, setEntryFee] = useState(1000);
  const [initialChips, setInitialChips] = useState(1500);
  const [rebuyChips, setRebuyChips] = useState(1500);
  const [addonChips, setAddonChips] = useState(2000);
  const [maxRebuys, setMaxRebuys] = useState(3);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | ''>('');

  // Estructura de blinds
  const [blindStructure, setBlindStructure] = useState<BlindLevel[]>([
    { level: 1, small_blind: 10, big_blind: 20, duration_minutes: 15 },
    { level: 2, small_blind: 15, big_blind: 30, duration_minutes: 15 },
    { level: 3, small_blind: 25, big_blind: 50, duration_minutes: 15 },
    { level: 4, small_blind: 50, big_blind: 100, duration_minutes: 15 },
    { level: 5, small_blind: 75, big_blind: 150, duration_minutes: 15 }
  ]);

  // Estados para errores
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    try {
      const response = await seasonService.getSeasons();
      setSeasons(response.seasons);
    } catch (err) {
      console.error('Error loading seasons:', err);
    }
  };

  const handleAddBlindLevel = () => {
    const newLevel: BlindLevel = {
      level: blindStructure.length + 1,
      small_blind: 0,
      big_blind: 0,
      duration_minutes: 15
    };
    setBlindStructure([...blindStructure, newLevel]);
  };

  const handleRemoveBlindLevel = (index: number) => {
    if (blindStructure.length > 1) {
      const newStructure = blindStructure.filter((_, i) => i !== index);
      // Renumerar niveles
      const renumbered = newStructure.map((level, index) => ({
        ...level,
        level: index + 1
      }));
      setBlindStructure(renumbered);
    }
  };

  const handleBlindLevelChange = (index: number, field: keyof BlindLevel, value: number) => {
    const newStructure = [...blindStructure];
    newStructure[index] = { ...newStructure[index], [field]: value };
    setBlindStructure(newStructure);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones
    if (!name.trim()) {
      setError('El nombre del torneo es requerido');
      return;
    }

    if (maxPlayers < 2) {
      setError('El torneo debe permitir al menos 2 jugadores');
      return;
    }

    if (entryFee < 0) {
      setError('El entry fee no puede ser negativo');
      return;
    }

    if (initialChips < 1) {
      setError('Las fichas iniciales deben ser al menos 1');
      return;
    }

    if (!scheduledStartTime) {
      setError('Debe seleccionar una fecha y hora de inicio');
      return;
    }

    // Validar estructura de blinds
    for (let i = 0; i < blindStructure.length; i++) {
      const level = blindStructure[i];
      if (level.small_blind <= 0 || level.big_blind <= 0) {
        setError(`Nivel ${i + 1}: Las blinds deben ser mayores a 0`);
        return;
      }
      if (level.big_blind <= level.small_blind) {
        setError(`Nivel ${i + 1}: Big blind debe ser mayor que small blind`);
        return;
      }
      if (level.duration_minutes <= 0) {
        setError(`Nivel ${i + 1}: La duración debe ser mayor a 0 minutos`);
        return;
      }
    }

    try {
      const tournamentData = {
        name: name.trim(),
        description: description.trim(),
        scheduled_start_time: scheduledStartTime?.toISOString(),
        max_players: maxPlayers,
        entry_fee: entryFee,
        initial_chips: initialChips,
        rebuy_chips: rebuyChips,
        addon_chips: addonChips,
        max_rebuys: maxRebuys,
        blind_structure: blindStructure,
        season_id: selectedSeasonId || undefined
      };

      await tournamentService.createTournament(tournamentData);
      
      setSuccess('Torneo creado exitosamente');
      
      // Redirigir al dashboard después de un momento
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Error al crear el torneo');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box p={3}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Crear Nuevo Torneo
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Información básica */}
            <Grid size={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Información Básica
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid size={{xs: 12, md: 6}}>
                    <TextField
                      label="Nombre del Torneo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  
                  <Grid size={{xs: 12, md: 6}}>
                    <FormControl fullWidth>
                      <InputLabel>Temporada</InputLabel>
                      <Select
                        value={selectedSeasonId}
                        onChange={(e) => setSelectedSeasonId(e.target.value as number | '')}
                        label="Temporada"
                      >
                        <MenuItem value="">
                          <em>Sin temporada</em>
                        </MenuItem>
                        {seasons.map((season) => (
                          <MenuItem key={season.id} value={season.id}>
                            {season.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={{xs: 12, md: 6}}>
                    <DateTimePicker
                      label="Fecha y Hora de Inicio"
                      value={scheduledStartTime}
                      onChange={setScheduledStartTime}
                      slots={{
                        textField: TextField
                      }}
                      slotProps={{
                        textField: { fullWidth: true }
                      }}
                      enableAccessibleFieldDOMStructure={false}
                    />
                  </Grid>
                  
                  <Grid size={12}>
                    <TextField
                      label="Descripción"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Grid>
                  
                  <Grid size={{xs: 12, md: 6}}>
                    <TextField
                      label="Máximo de Jugadores"
                      type="number"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                      fullWidth
                      inputProps={{ min: 2, max: 100 }}
                    />
                  </Grid>
                  

                </Grid>
              </Paper>
            </Grid>

            {/* Configuración de fichas y entry */}
            <Grid size={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Configuración de Fichas
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid size={{xs: 12, md: 6}}>
                    <TextField
                      label="Entry Fee"
                      type="number"
                      value={entryFee}
                      onChange={(e) => setEntryFee(parseFloat(e.target.value))}
                      fullWidth
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  
                  <Grid size={{xs: 12, md: 6}}>
                    <TextField
                      label="Fichas Iniciales"
                      type="number"
                      value={initialChips}
                      onChange={(e) => setInitialChips(parseInt(e.target.value))}
                      fullWidth
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  
                  <Grid size={{xs: 12, md: 4}}>
                    <TextField
                      label="Fichas por Recompra"
                      type="number"
                      value={rebuyChips}
                      onChange={(e) => setRebuyChips(parseInt(e.target.value))}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  
                  <Grid size={{xs: 12, md: 4}}>
                    <TextField
                      label="Máximo de Recompras"
                      type="number"
                      value={maxRebuys}
                      onChange={(e) => setMaxRebuys(parseInt(e.target.value))}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  
                  <Grid size={{xs: 12, md: 4}}>
                    <TextField
                      label="Fichas por Addon"
                      type="number"
                      value={addonChips}
                      onChange={(e) => setAddonChips(parseInt(e.target.value))}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Estructura de blinds */}
            <Grid size={12}>
              <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Estructura de Blinds
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddBlindLevel}
                    variant="outlined"
                  >
                    Agregar Nivel
                  </Button>
                </Box>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nivel</TableCell>
                        <TableCell>Small Blind</TableCell>
                        <TableCell>Big Blind</TableCell>
                        <TableCell>Duración (min)</TableCell>
                        <TableCell>Antes</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {blindStructure.map((level, index) => (
                        <TableRow key={index}>
                          <TableCell>{level.level}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={level.small_blind}
                              onChange={(e) => handleBlindLevelChange(index, 'small_blind', parseInt(e.target.value))}
                              size="small"
                              inputProps={{ min: 0 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={level.big_blind}
                              onChange={(e) => handleBlindLevelChange(index, 'big_blind', parseInt(e.target.value))}
                              size="small"
                              inputProps={{ min: 0 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={level.duration_minutes}
                              onChange={(e) => handleBlindLevelChange(index, 'duration_minutes', parseInt(e.target.value))}
                              size="small"
                              inputProps={{ min: 1 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={level.antes || ''}
                              onChange={(e) => handleBlindLevelChange(index, 'antes', parseInt(e.target.value) || 0)}
                              size="small"
                              inputProps={{ min: 0 }}
                              placeholder="Opcional"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              onClick={() => handleRemoveBlindLevel(index)}
                              disabled={blindStructure.length <= 1}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Botones de acción */}
            <Grid size={12}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Creando...' : 'Crear Torneo'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default CreateTournament;