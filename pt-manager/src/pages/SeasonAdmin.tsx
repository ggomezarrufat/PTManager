import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { seasonService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';
import { Season, SeasonFormData } from '../types/seasons';

const SeasonAdmin: React.FC = () => {
  const { user } = useAuthStore();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [formData, setFormData] = useState<SeasonFormData>({
    name: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    if (user?.is_admin) {
      loadSeasons();
    }
  }, [user]);

  const loadSeasons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await seasonService.getSeasons();
      setSeasons(response.seasons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las temporadas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (season?: Season) => {
    if (season) {
      setEditingSeason(season);
      setFormData({
        name: season.name,
        start_date: season.start_date,
        end_date: season.end_date
      });
    } else {
      setEditingSeason(null);
      setFormData({
        name: '',
        start_date: '',
        end_date: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSeason(null);
    setFormData({
      name: '',
      start_date: '',
      end_date: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingSeason) {
        await seasonService.updateSeason(editingSeason.id, formData);
      } else {
        await seasonService.createSeason(formData);
      }
      handleCloseDialog();
      loadSeasons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la temporada');
    }
  };

  const handleDelete = async (season: Season) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la temporada "${season.name}"?`)) {
      return;
    }

    try {
      await seasonService.deleteSeason(season.id);
      loadSeasons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la temporada');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (!user?.is_admin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Acceso denegado. Solo los administradores pueden acceder a esta página.</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Administración de Temporadas
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Temporada
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : seasons.length === 0 ? (
              <Alert severity="info">No hay temporadas registradas.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Fecha de Inicio</TableCell>
                      <TableCell>Fecha de Fin</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {seasons.map((season) => {
                      const today = new Date();
                      const startDate = new Date(season.start_date);
                      const endDate = new Date(season.end_date);
                      let status = 'Programada';
                      let color: 'default' | 'primary' | 'success' | 'warning' | 'error' = 'default';

                      if (today >= startDate && today <= endDate) {
                        status = 'Activa';
                        color = 'success';
                      } else if (today > endDate) {
                        status = 'Finalizada';
                        color = 'error';
                      } else if (today < startDate) {
                        status = 'Programada';
                        color = 'warning';
                      }

                      return (
                        <TableRow key={season.id}>
                          <TableCell>{season.id}</TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {season.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CalendarIcon fontSize="small" color="action" />
                              {formatDate(season.start_date)}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CalendarIcon fontSize="small" color="action" />
                              {formatDate(season.end_date)}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={status}
                              color={color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" justifyContent="center" gap={1}>
                              <IconButton
                                aria-label="editar temporada"
                                onClick={() => handleOpenDialog(season)}
                                size="small"
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                aria-label="eliminar temporada"
                                onClick={() => handleDelete(season)}
                                size="small"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Dialog para crear/editar temporada */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingSeason ? 'Editar Temporada' : 'Nueva Temporada'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Nombre de la Temporada"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              
              <DatePicker
                label="Fecha de Inicio"
                value={formData.start_date ? new Date(formData.start_date) : null}
                onChange={(date) => setFormData({
                  ...formData,
                  start_date: date ? date.toISOString().split('T')[0] : ''
                })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />

              <DatePicker
                label="Fecha de Fin"
                value={formData.end_date ? new Date(formData.end_date) : null}
                onChange={(date) => setFormData({
                  ...formData,
                  end_date: date ? date.toISOString().split('T')[0] : ''
                })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.name || !formData.start_date || !formData.end_date}
            >
              {editingSeason ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default SeasonAdmin;

