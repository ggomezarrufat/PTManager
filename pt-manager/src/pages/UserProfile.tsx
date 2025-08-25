import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Chip
} from '@mui/material';
import {
  Save,
  Edit,
  Cancel,
  Person,
  Email,
  CalendarToday,
  Casino,
  EmojiEvents
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import AvatarUpload from '../components/ui/AvatarUpload';
import { supabase } from '../config/supabase';

interface Profile {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  avatar_url?: string | null;
  avatar_updated_at?: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  total_points: number;
}

const UserProfile: React.FC = () => {
  const { user } = useAuthStore();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado para edición
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    nickname: ''
  });

  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      setEditForm({
        name: data.name || '',
        nickname: data.nickname || ''
      });
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setError('Error al cargar el perfil del usuario');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar perfil del usuario
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user, loadUserProfile]);

  // Manejar cambio de avatar
  const handleAvatarChange = async (newAvatarUrl: string | null) => {
    if (profile) {
      setProfile(prev => prev ? { ...prev, avatar_url: newAvatarUrl } : null);
      setSuccess('Avatar actualizado correctamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Guardar cambios del perfil
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          nickname: editForm.nickname
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      // Actualizar estado local
      setProfile(prev => prev ? {
        ...prev,
        name: editForm.name,
        nickname: editForm.nickname
      } : null);

      setIsEditing(false);
      setSuccess('Perfil actualizado correctamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error guardando perfil:', err);
      setError('Error al guardar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setEditForm({
        name: profile.name || '',
        nickname: profile.nickname || ''
      });
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Cargando perfil...</Typography>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="error">No se pudo cargar el perfil del usuario</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Mi Perfil
      </Typography>

      {/* Mensajes de estado */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Columna izquierda - Avatar */}
        <Grid size={{xs: 12, md: 4}}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Foto de Perfil
              </Typography>
              
              <AvatarUpload
                currentAvatarUrl={profile?.avatar_url}
                onAvatarChange={handleAvatarChange}
                size="xlarge"
                showDeleteButton={true}
                showPreview={true}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Columna derecha - Información del perfil */}
        <Grid size={{xs: 12, md: 8}}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Información Personal
                </Typography>
                
                {!isEditing ? (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setIsEditing(true)}
                    variant="outlined"
                    size="small"
                  >
                    Editar
                  </Button>
                ) : (
                  <Box display="flex" gap={1}>
                    <Button
                      startIcon={<Save />}
                      onClick={handleSaveProfile}
                      variant="contained"
                      size="small"
                      disabled={loading}
                    >
                      Guardar
                    </Button>
                    <Button
                      startIcon={<Cancel />}
                      onClick={handleCancelEdit}
                      variant="outlined"
                      size="small"
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={2}>
                {/* Nombre completo */}
                <Grid size={{xs: 12, sm: 6}}>
                  <TextField
                    label="Nombre Completo"
                    value={isEditing ? editForm.name : (profile?.name || '')}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    fullWidth
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                {/* Nickname */}
                <Grid size={{xs: 12, sm: 6}}>
                  <TextField
                    label="Nickname"
                    value={isEditing ? editForm.nickname : (profile?.nickname || '')}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                    fullWidth
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <Casino sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                {/* Email (solo lectura) */}
                <Grid size={{xs: 12}}>
                  <TextField
                    label="Email"
                    value={profile?.email || ''}
                    fullWidth
                    disabled
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                {/* Fecha de registro */}
                <Grid size={{xs: 12}}>
                  <TextField
                    label="Miembro desde"
                    value={profile?.created_at ? formatDate(profile.created_at) : ''}
                    fullWidth
                    disabled
                    InputProps={{
                      startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                {/* Rol del usuario */}
                <Grid size={{xs: 12}}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      Rol:
                    </Typography>
                    <Chip
                      label={profile?.is_admin ? 'Administrador' : 'Jugador'}
                      color={profile?.is_admin ? 'primary' : 'default'}
                      size="small"
                      icon={profile?.is_admin ? <EmojiEvents /> : <Casino />}
                    />
                  </Box>
                </Grid>

                {/* Puntos totales */}
                <Grid size={{xs: 12}}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      Puntos Totales:
                    </Typography>
                    <Chip
                      label={`${profile?.total_points || 0} pts`}
                      color="secondary"
                      size="small"
                      icon={<EmojiEvents />}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información Adicional
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Tu avatar se mostrará en todas las páginas de la aplicación y será visible para otros usuarios.
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                • Formatos soportados: JPEG, PNG, WebP
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Tamaño máximo: 5MB
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Resolución mínima: 100x100 píxeles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile;
