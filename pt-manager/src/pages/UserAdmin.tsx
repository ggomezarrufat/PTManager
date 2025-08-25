import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  useTheme,
  useMediaQuery,
  Fab,
  Stack,
  Avatar,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { userService, ApiError } from '../services/apiService';
import { User } from '../types';
import { getUserDisplayName, getUserFullName } from '../utils/userUtils';

const UserAdmin: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el diálogo de usuario
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    nickname: '',
    password: '',
    is_admin: false
  });
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // Estados para eliminar usuario
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Verificar si el usuario actual es admin
  const isAdmin = user?.is_admin || false;

  const loadUsers = useCallback(async () => {
    try {
      console.log('👥 UserAdmin: Iniciando carga de usuarios...');
      setLoading(true);
      setError(null);

      console.log('👤 UserAdmin: Usuario actual:', user?.email, 'Es admin:', user?.is_admin);

      const response = await userService.getUsers(1, 100); // Cargar hasta 100 usuarios

      console.log('📊 UserAdmin: Respuesta de API:', { 
        users: response.users?.length || 0, 
        pagination: response.pagination
      });

      console.log('✅ UserAdmin: Usuarios cargados exitosamente:', response.users?.length || 0);
      const usersList = response.users || [];
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (err: unknown) {
      console.error('❌ UserAdmin: Error inesperado:', err);
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : err instanceof Error 
        ? err.message 
        : 'Error al cargar usuarios';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.is_admin]);

  // Filtrar usuarios basado en el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(userData => {
      const searchLower = searchTerm.toLowerCase();
      return (
        getUserDisplayName(userData).toLowerCase().includes(searchLower) ||
        getUserFullName(userData).toLowerCase().includes(searchLower) ||
        userData.email.toLowerCase().includes(searchLower) ||
        (userData.nickname && userData.nickname.toLowerCase().includes(searchLower))
      );
    });
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  useEffect(() => {
    if (!isAdmin) {
      setError('No tienes permisos para acceder a esta página');
      setLoading(false);
      return;
    }
    loadUsers();
  }, [isAdmin, loadUsers]);

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      email: '',
      name: '',
      nickname: '',
      password: '',
      is_admin: false
    });
    setUserFormError(null);
    setUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      name: user.name,
      nickname: user.nickname || '',
      password: '', // No mostramos la contraseña actual
      is_admin: user.is_admin
    });
    setUserFormError(null);
    setUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    console.log('💾 UserAdmin: Iniciando guardado de usuario...', {
      editingUser: !!editingUser,
      userForm: { ...userForm, password: userForm.password ? '[HIDDEN]' : '' }
    });

    if (!userForm.email || !userForm.name) {
      setUserFormError('Email y nombre son obligatorios');
      return;
    }

    if (!editingUser && !userForm.password) {
      setUserFormError('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    setUserFormLoading(true);
    setUserFormError(null);

    try {
      if (editingUser) {
        console.log('✏️ UserAdmin: Actualizando usuario existente:', editingUser.id);
        
        // Actualizar usuario existente
        const updateData = {
          name: userForm.name,
          nickname: userForm.nickname || undefined,
          is_admin: userForm.is_admin
        };

        console.log('📝 UserAdmin: Datos a actualizar:', updateData);

        const updatedUser = await userService.updateUser(editingUser.id, updateData);

        console.log('📊 UserAdmin: Resultado de actualización:', updatedUser);

        console.log('✅ UserAdmin: Usuario actualizado exitosamente');

        // Nota: La actualización de contraseñas desde admin no está disponible
        // desde el frontend con clave anónima. Los usuarios deben usar 
        // "Olvidé mi contraseña" para cambiar su contraseña.
        if (userForm.password) {
          console.warn('⚠️ UserAdmin: Contraseña no se actualiza desde admin');
          // No mostrar error, solo advertencia en consola
        }
      } else {
        // Crear nuevo usuario
        const newUserData = {
          email: userForm.email,
          name: userForm.name,
          password: userForm.password,
          nickname: userForm.nickname || undefined,
          is_admin: userForm.is_admin
        };

        console.log('➕ UserAdmin: Creando nuevo usuario:', { ...newUserData, password: '[HIDDEN]' });

        const newUser = await userService.createUser(newUserData);

        console.log('✅ UserAdmin: Usuario creado exitosamente:', newUser.user.id);
      }

      setUserDialogOpen(false);
      await loadUsers();
    } catch (err: unknown) {
      console.error('❌ UserAdmin: Error guardando usuario:', err);
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : err instanceof Error 
        ? err.message 
        : 'Error al guardar usuario';
      setUserFormError(errorMessage);
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);

    try {
      console.log('🗑️ UserAdmin: Eliminando usuario:', userToDelete.id);

      await userService.deleteUser(userToDelete.id);

      console.log('✅ UserAdmin: Usuario eliminado exitosamente');
      console.log('Usuario eliminado del perfil. El registro de auth permanece por seguridad.');

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error">
          No tienes permisos para acceder a la administración de usuarios.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
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
          Administración de Usuarios
        </Typography>
        
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
            size="large"
          >
            Crear Usuario
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Buscador */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar usuarios por nombre, nickname o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            variant="outlined"
            size={isMobile ? "medium" : "small"}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Contenido principal */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto'
      }}>
        {filteredUsers.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 4 }}>
            <CardContent>
              {searchTerm ? (
                <>
                  <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No se encontraron usuarios
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No hay usuarios que coincidan con "{searchTerm}"
                  </Typography>
                </>
              ) : (
                <>
                  <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No hay usuarios registrados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comienza creando el primer usuario del sistema
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredUsers.map((userData) => (
              <Grid size={{xs: 12, sm: 6, md: 4}} key={userData.id}>
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
                    {/* Header del usuario */}
                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Avatar sx={{ 
                          bgcolor: userData.is_admin ? 'primary.main' : 'grey.500',
                          width: 48,
                          height: 48
                        }}>
                          {getUserDisplayName(userData).charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                            {getUserDisplayName(userData)}
                          </Typography>
                          {userData.nickname && userData.name !== userData.nickname && (
                            <Typography variant="body2" color="text.secondary">
                              {getUserDisplayName(userData)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {userData.is_admin ? (
                          <Chip 
                            icon={<AdminIcon />} 
                            label="Admin" 
                            color="primary" 
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        ) : (
                          <Chip 
                            icon={<PersonIcon />} 
                            label="Usuario" 
                            variant="outlined" 
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Acciones */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <IconButton
                        aria-label="editar usuario"
                        onClick={() => handleEditUser(userData)}
                        size="small"
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
                        aria-label="eliminar usuario"
                        onClick={() => {
                          setUserToDelete(userData);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={userData.id === user?.id}
                        size="small"
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
            ))}
          </Grid>
        )}
      </Box>

      {/* FAB para móviles */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="crear usuario"
          onClick={handleCreateUser}
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

      {/* Diálogo para crear/editar usuario */}
      <Dialog 
        open={userDialogOpen} 
        onClose={() => setUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          pb: 1,
          background: 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)',
          color: 'white'
        }}>
          {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {userFormError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {userFormError}
            </Alert>
          )}
          
          <Stack spacing={3}>
            <TextField
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              fullWidth
              required
              disabled={userFormLoading || !!editingUser}
              variant="outlined"
              size={isMobile ? "medium" : "small"}
            />
            
            <TextField
              label="Nombre Completo"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              fullWidth
              required
              disabled={userFormLoading}
              variant="outlined"
              size={isMobile ? "medium" : "small"}
            />
            
            <TextField
              label="Sobrenombre"
              value={userForm.nickname}
              onChange={(e) => setUserForm({ ...userForm, nickname: e.target.value })}
              fullWidth
              disabled={userFormLoading}
              variant="outlined"
              size={isMobile ? "small" : "small"}
              helperText="Nombre que se mostrará en la interfaz"
            />
            
            <TextField
              label={editingUser ? 'Nueva Contraseña (no disponible)' : 'Contraseña'}
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              fullWidth
              required={!editingUser}
              disabled={userFormLoading || !!editingUser}
              variant="outlined"
              size={isMobile ? "medium" : "small"}
              helperText={editingUser ? 'Para cambiar contraseñas, usar "Olvidé mi contraseña"' : 'Mínimo 6 caracteres'}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={userForm.is_admin}
                  onChange={(e) => setUserForm({ ...userForm, is_admin: e.target.checked })}
                  disabled={userFormLoading}
                />

              }
              label="Permisos de Administrador"
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
            onClick={() => setUserDialogOpen(false)}
            disabled={userFormLoading}
            variant="outlined"
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveUser} 
            variant="contained"
            disabled={
              !userForm.email || 
              !userForm.name || 
              (!editingUser && !userForm.password) ||
              userFormLoading
            }
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            startIcon={userFormLoading ? <CircularProgress size={20} /> : null}
            sx={{
              background: 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #ff3742 0%, #ff2f3a 100%)',
              }
            }}
          >
            {userFormLoading ? 'Guardando...' : (editingUser ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth={isMobile}
        fullScreen={false}
        sx={{
          '& .MuiDialog-paper': {
            margin: isMobile ? '16px' : 'auto',
            borderRadius: 2,
            maxHeight: isMobile ? 'calc(100vh - 32px)' : '90vh',
            width: isMobile ? 'calc(100vw - 32px)' : 'auto',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 1
        }}>
          Confirmar Eliminación
        </DialogTitle>
        
        <DialogContent sx={{ 
          pt: isMobile ? 2 : 3,
          pb: isMobile ? 1 : 2,
          flex: 1,
          overflow: 'visible',
          minHeight: isMobile ? 'auto' : 'unset'
        }}>
          <Alert severity="warning" sx={{ mb: isMobile ? 1 : 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
          <Typography variant="body1" sx={{ mb: isMobile ? 1 : 2 }}>
            ¿Estás seguro de que quieres eliminar al usuario{' '}
            <strong>{userToDelete ? getUserDisplayName(userToDelete) : ''}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: isMobile ? 1 : 0 }}>
            Se eliminarán todos los datos asociados incluyendo participaciones en torneos.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: isMobile ? 1.5 : 3,
          pt: isMobile ? 1 : 1,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: isMobile ? 1 : 2,
          position: 'static',
          backgroundColor: 'background.paper',
          borderTop: isMobile ? '1px solid' : 'none',
          borderColor: 'divider',
          justifyContent: 'center',
          '& .MuiButton-root': {
            minHeight: isMobile ? '44px' : '36px',
            fontSize: isMobile ? '0.9rem' : '0.875rem',
            fontWeight: 600
          }
        }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
            variant="outlined"
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
            sx={{
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                boxShadow: '0 6px 16px rgba(244, 67, 54, 0.4)',
              }
            }}
          >
            {deleteLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserAdmin;

