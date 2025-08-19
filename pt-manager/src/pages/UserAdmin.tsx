import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { userService, ApiError } from '../services/apiService';
import { User } from '../types';
import { getUserDisplayName, getUserFullName } from '../utils/userUtils';

const UserAdmin: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  useEffect(() => {
    if (!isAdmin) {
      setError('No tienes permisos para acceder a esta página');
      setLoading(false);
      return;
    }
    loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
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
      setUsers(response.users || []);
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
  };

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
      <Box p={3}>
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
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Administración de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateUser}
        >
          Crear Usuario
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Puntos</TableCell>
              <TableCell>Creado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((userData) => (
              <TableRow key={userData.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {getUserDisplayName(userData)}
                    </Typography>
                    {userData.nickname && userData.name !== userData.nickname && (
                      <Typography variant="body2" color="text.secondary">
                        {getUserFullName(userData)}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{userData.email}</TableCell>
                <TableCell>
                  {userData.is_admin ? (
                    <Chip 
                      icon={<AdminIcon />} 
                      label="Admin" 
                      color="primary" 
                      size="small" 
                    />
                  ) : (
                    <Chip 
                      icon={<PersonIcon />} 
                      label="Usuario" 
                      variant="outlined" 
                      size="small" 
                    />
                  )}
                </TableCell>
                <TableCell>{userData.total_points}</TableCell>
                <TableCell>
                  {new Date(userData.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => handleEditUser(userData)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={userData.id === user?.id ? "No puedes eliminarte a ti mismo" : "Eliminar"}>
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setUserToDelete(userData);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={userData.id === user?.id} // No permitir eliminar a sí mismo
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para crear/editar usuario */}
      <Dialog 
        open={userDialogOpen} 
        onClose={() => setUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          {userFormError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {userFormError}
            </Alert>
          )}
          
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              fullWidth
              required
              disabled={userFormLoading || !!editingUser} // No permitir cambiar email en edición
            />
            
            <TextField
              label="Nombre Completo"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              fullWidth
              required
              disabled={userFormLoading}
            />
            
            <TextField
              label="Sobrenombre"
              value={userForm.nickname}
              onChange={(e) => setUserForm({ ...userForm, nickname: e.target.value })}
              fullWidth
              disabled={userFormLoading}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setUserDialogOpen(false)}
            disabled={userFormLoading}
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
            startIcon={userFormLoading ? <CircularProgress size={20} /> : null}
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
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
          <Typography>
            ¿Estás seguro de que quieres eliminar al usuario{' '}
            <strong>{userToDelete ? getUserDisplayName(userToDelete) : ''}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Se eliminarán todos los datos asociados incluyendo participaciones en torneos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserAdmin;
