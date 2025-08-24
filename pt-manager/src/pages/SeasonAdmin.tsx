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
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
  Grid,
  Fab,
  Divider,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { seasonService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';
import { Season, SeasonFormData } from '../types/seasons';

const SeasonAdmin: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  const getSeasonStatus = (season: Season) => {
    const today = new Date();
    const startDate = new Date(season.start_date);
    const endDate = new Date(season.end_date);
    
    if (today >= startDate && today <= endDate) {
      return {
        status: 'Activa',
        color: 'success' as const,
        icon: <CheckCircleIcon fontSize="small" />,
        bgColor: 'success.light'
      };
    } else if (today > endDate) {
      return {
        status: 'Finalizada',
        color: 'error' as const,
        icon: <ErrorIcon fontSize="small" />,
        bgColor: 'error.light'
      };
    } else {
      return {
        status: 'Programada',
        color: 'warning' as const,
        icon: <WarningIcon fontSize="small" />,
        bgColor: 'warning.light'
      };
    }
  };

  if (!user?.is_admin) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error">Acceso denegado. Solo los administradores pueden acceder a esta página.</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ 
        p: { xs: 2, md: 3 },
        pb: { xs: 8, md: 3 } // Espacio para bottom navigation en móvil
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
            Administración de Temporadas
          </Typography>
          
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              size="large"
            >
              Nueva Temporada
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Contenido principal */}
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : seasons.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 4 }}>
            <CardContent>
              <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay temporadas registradas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comienza creando tu primera temporada de torneos
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {seasons.map((season) => {
              const statusInfo = getSeasonStatus(season);
              
              return (
                <Grid size={{xs: 12, sm: 6, md: 4}} key={season.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header de la temporada */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                          {season.name}
                        </Typography>
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

                      <Divider sx={{ my: 2 }} />

                      {/* Información de fechas */}
                      <Stack spacing={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarIcon fontSize="small" color="primary" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Inicio
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatDate(season.start_date)}
                            </Typography>
                          </Box>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTimeIcon fontSize="small" color="primary" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Fin
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatDate(season.end_date)}
                            </Typography>
                          </Box>
                        </Box>
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
                          aria-label="editar temporada"
                          onClick={() => handleOpenDialog(season)}
                          size="small"
                          color="primary"
                          sx={{ 
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                            '&:hover': {
                              backgroundColor: 'primary.main'
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton
                          aria-label="eliminar temporada"
                          onClick={() => handleDelete(season)}
                          size="small"
                          color="error"
                          sx={{ 
                            backgroundColor: 'error.light',
                            color: 'error.contrastText',
                            '&:hover': {
                              backgroundColor: 'error.main'
                            }
                          }}
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

        {/* FAB para móviles */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="nueva temporada"
            onClick={() => handleOpenDialog()}
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

        {/* Dialog para crear/editar temporada */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle sx={{ 
            pb: 1,
            background: 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)',
            color: 'white'
          }}>
            {editingSeason ? 'Editar Temporada' : 'Nueva Temporada'}
          </DialogTitle>
          
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <TextField
                label="Nombre de la Temporada"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                variant="outlined"
                size={isMobile ? "medium" : "small"}
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
                    required: true,
                    variant: "outlined",
                    size: isMobile ? "medium" : "small"
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
                    required: true,
                    variant: "outlined",
                    size: isMobile ? "medium" : "small"
                  }
                }}
              />
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 3,
            pt: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1
          }}>
            <Button 
              onClick={handleCloseDialog}
              variant="outlined"
              fullWidth={isMobile}
              size={isMobile ? "large" : "medium"}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.name || !formData.start_date || !formData.end_date}
              fullWidth={isMobile}
              size={isMobile ? "large" : "medium"}
              sx={{
                background: 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ff3742 0%, #ff2f3a 100%)',
                }
              }}
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

