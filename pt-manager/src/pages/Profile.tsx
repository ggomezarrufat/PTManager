import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Grid,
  Alert,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  EmojiEvents as TrophyIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/apiService';
import { getUserDisplayName, getUserFullName } from '../utils/userUtils';

const Profile: React.FC = () => {
  const { user, loadUser } = useAuthStore();
  
  // Estados para el formulario
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  
  // Estados para mensajes
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar datos del usuario al montar
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setNickname(user.nickname || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validaciones
      if (!name.trim()) {
        setError('El nombre es requerido');
        return;
      }

      const updateData = {
        name: name.trim(),
        nickname: nickname.trim() || undefined
      };

      await userService.updateUser(user.id, updateData);
      await loadUser(); // Recargar datos del usuario
      
      setSuccess('Perfil actualizado exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Usuario no encontrado. Por favor, inicia sesión nuevamente.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        Mi Perfil
      </Typography>

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

      <Grid container spacing={3}>
        {/* Información del perfil */}
        <Grid size={{xs: 12, md: 4}}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <Avatar
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '2rem'
                  }}
                  src={user.avatar_url}
                >
                  {getInitials(getUserDisplayName(user))}
                </Avatar>
                
                <Typography variant="h6" textAlign="center">
                  {getUserDisplayName(user)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {getUserFullName(user)}
                </Typography>
                
                {user.is_admin && (
                  <Typography variant="caption" color="primary.main" textAlign="center" mt={1}>
                    Administrador
                  </Typography>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email"
                    secondary={user.email}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <TrophyIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Puntos Totales"
                    secondary={user.total_points?.toLocaleString() || '0'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Miembro desde"
                    secondary={formatDate(user.created_at)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Formulario de edición */}
        <Grid size={{xs: 12, md: 8}}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Editar Información Personal
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid size={12}>
                  <TextField
                    label="Email"
                    value={email}
                    fullWidth
                    disabled
                    helperText="El email no se puede modificar"
                  />
                </Grid>
                
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    label="Nombre Completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    required
                    error={!name.trim()}
                    helperText={!name.trim() ? 'El nombre es requerido' : ''}
                  />
                </Grid>
                
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    label="Sobrenombre / Nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    fullWidth
                    helperText="Opcional. Este será tu nombre de display en los torneos"
                  />
                </Grid>
                
                <Grid size={12}>
                  <Box display="flex" justifyContent="flex-end" gap={2}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={loading || !name.trim()}
                    >
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>

          {/* Estadísticas de torneos */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estadísticas de Torneos
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{xs: 12, md: 3}}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Torneos Jugados
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{xs: 12, md: 3}}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Victorias
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{xs: 12, md: 3}}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Podios (Top 3)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{xs: 12, md: 3}}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {user.total_points || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Puntos Totales
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Las estadísticas de torneos se actualizarán automáticamente cuando participes en torneos.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;