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
  Delete as DeleteIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon
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
  const [lastLevelRebuy, setLastLevelRebuy] = useState(3);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | ''>('');
  
  // Sistema de puntos (por defecto: 1er lugar = 100, 2do = 50, 3ro = 25)
  const [pointSystem, setPointSystem] = useState([
    { position: 1, points: 100 },
    { position: 2, points: 50 },
    { position: 3, points: 25 }
  ]);

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

  // Referencia para el input file oculto
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  // Función para exportar la estructura de blinds a JSON
  const handleExportBlinds = () => {
    const exportData = {
      tournament_name: name || 'Nuevo Torneo',
      export_date: new Date().toISOString(),
      blind_structure: blindStructure,
      point_system: pointSystem,
      tournament_config: {
        initial_chips: initialChips,
        rebuy_chips: rebuyChips,
        addon_chips: addonChips,
        max_rebuys: maxRebuys,
        last_level_rebuy: lastLevelRebuy
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estructura_blinds_${name || 'torneo'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccess('Estructura de blinds exportada exitosamente');
  };

  // Función para importar estructura de blinds desde JSON
  const handleImportBlinds = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        // Validar que el archivo tenga la estructura correcta
        if (!importData.blind_structure || !Array.isArray(importData.blind_structure)) {
          setError('El archivo no contiene una estructura de blinds válida');
          return;
        }

        // Validar cada nivel de blind
        for (let i = 0; i < importData.blind_structure.length; i++) {
          const level = importData.blind_structure[i];
          if (!level.level || !level.small_blind || !level.big_blind || !level.duration_minutes) {
            setError(`Nivel ${i + 1}: Estructura incompleta o inválida`);
            return;
          }
        }

        // Aplicar la estructura importada
        setBlindStructure(importData.blind_structure);

        // Aplicar sistema de puntos si está disponible
        if (importData.point_system && Array.isArray(importData.point_system)) {
          setPointSystem(importData.point_system);
        }

        // Aplicar configuración del torneo si está disponible
        if (importData.tournament_config) {
          if (importData.tournament_config.initial_chips) setInitialChips(importData.tournament_config.initial_chips);
          if (importData.tournament_config.rebuy_chips) setRebuyChips(importData.tournament_config.rebuy_chips);
          if (importData.tournament_config.addon_chips) setAddonChips(importData.tournament_config.addon_chips);
          if (importData.tournament_config.max_rebuys) setMaxRebuys(importData.tournament_config.max_rebuys);
          if (importData.tournament_config.last_level_rebuy) setLastLevelRebuy(importData.tournament_config.last_level_rebuy);
        }

        setSuccess(`Estructura de blinds importada exitosamente (${importData.blind_structure.length} niveles)`);
        
        // Limpiar el input file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

      } catch (error) {
        setError('Error al leer el archivo JSON. Verifica que el formato sea correcto.');
        console.error('Error parsing JSON:', error);
      }
    };

    reader.readAsText(file);
  };

  // Función para abrir el selector de archivos
  const handleImportClick = () => {
    fileInputRef.current?.click();
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

    if (lastLevelRebuy < 1) {
      setError('El último nivel de recompra debe ser al menos 1');
      return;
    }

    if (lastLevelRebuy > blindStructure.length) {
      setError(`El último nivel de recompra (${lastLevelRebuy}) no puede ser mayor que el número total de niveles (${blindStructure.length})`);
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

    // Validar sistema de puntos
    if (pointSystem.length === 0) {
      setError('Debe configurar al menos un nivel de puntos');
      return;
    }
    
    for (let i = 0; i < pointSystem.length; i++) {
      const point = pointSystem[i];
      if (point.points < 0) {
        setError(`Posición ${i + 1}: Los puntos no pueden ser negativos`);
        return;
      }
      if (point.position !== i + 1) {
        setError(`Posición ${i + 1}: Las posiciones deben ser consecutivas`);
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
        last_level_rebuy: lastLevelRebuy,
        blind_structure: blindStructure,
        point_system: pointSystem,
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
                  
                  <Grid size={{xs: 12, md: 6}}>
                    <TextField
                      label="Último Nivel de Recompra"
                      type="number"
                      value={lastLevelRebuy}
                      onChange={(e) => setLastLevelRebuy(parseInt(e.target.value))}
                      fullWidth
                      inputProps={{ min: 1 }}
                      helperText="Último nivel en el cual se permiten recompras (inclusive)"
                    />
                  </Grid>
                  
                  <Grid size={{xs: 12, md: 6}}>
                    <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        💡 Reglas de Rebuys y Addons:
                      </Typography>
                      <Typography variant="caption" display="block">
                        • <strong>Rebuys:</strong> Permitidos hasta el nivel {lastLevelRebuy} inclusive
                      </Typography>
                      <Typography variant="caption" display="block">
                        • <strong>Addons:</strong> Solo disponibles durante el primer nivel de pausa
                      </Typography>
                      <Typography variant="caption" display="block">
                        • Después del nivel {lastLevelRebuy}, los rebuys se deshabilitan automáticamente
                      </Typography>
                    </Box>
                  </Grid>
                            </Grid>
          </Paper>
        </Grid>

        {/* Sistema de puntos */}
        <Grid size={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sistema de Puntos
            </Typography>
            
            <Typography variant="body2" color="text.secondary" mb={2}>
              Define los puntos que recibirán los jugadores según su posición final
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={2}>
              {pointSystem.map((point, index) => (
                <Box key={index} display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" sx={{ minWidth: '60px' }}>
                    {point.position}º lugar:
                  </Typography>
                  <TextField
                    type="number"
                    value={point.points}
                    onChange={(e) => {
                      const newPoints = [...pointSystem];
                      newPoints[index].points = parseInt(e.target.value) || 0;
                      setPointSystem(newPoints);
                    }}
                    size="small"
                    sx={{ width: '80px' }}
                    inputProps={{ min: 0 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    puntos
                  </Typography>
                </Box>
              ))}
            </Box>
            
            <Box mt={2}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (pointSystem.length < 10) {
                    setPointSystem([...pointSystem, { 
                      position: pointSystem.length + 1, 
                      points: Math.max(1, Math.floor(pointSystem[pointSystem.length - 1]?.points * 0.5) || 10) 
                    }]);
                  }
                }}
                disabled={pointSystem.length >= 10}
              >
                Agregar Posición
              </Button>
              {pointSystem.length > 3 && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setPointSystem(pointSystem.slice(0, -1))}
                  sx={{ ml: 1 }}
                >
                  Quitar Última
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Estructura de blinds */}
            <Grid size={12}>
              <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Estructura de Blinds
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      startIcon={<FileDownloadIcon />}
                      onClick={handleExportBlinds}
                      variant="outlined"
                      color="success"
                      size="small"
                    >
                      Exportar
                    </Button>
                    <Button
                      startIcon={<FileUploadIcon />}
                      onClick={handleImportClick}
                      variant="outlined"
                      color="info"
                      size="small"
                    >
                      Importar
                    </Button>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddBlindLevel}
                      variant="outlined"
                    >
                      Agregar Nivel
                    </Button>
                  </Box>
                </Box>

                {/* Información sobre importar/exportar */}
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    💡 <strong>Exportar:</strong> Guarda la estructura de blinds y sistema de puntos en un archivo JSON. 
                    <strong> Importar:</strong> Carga una configuración completa desde un archivo JSON previamente exportado.
                  </Typography>
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

        {/* Input file oculto para importar */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportBlinds}
          accept=".json"
          style={{ display: 'none' }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default CreateTournament;