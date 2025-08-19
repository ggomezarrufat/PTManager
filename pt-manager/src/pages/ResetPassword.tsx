import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Container
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Verificar si tenemos un token de reset en la URL
  const resetToken = searchParams.get('token');
  const isResetMode = !!resetToken;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validaciones
      if (!email.trim()) {
        setError('El email es requerido');
        return;
      }

      // TODO: Implementar solicitud de reset de contraseña
      // await authService.requestPasswordReset(email);
      
      setSuccess('Se ha enviado un enlace de recuperación a tu email');
      
    } catch (err: any) {
      setError(err.message || 'Error al solicitar el reset de contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validaciones
      if (!newPassword.trim()) {
        setError('La nueva contraseña es requerida');
        return;
      }

      if (newPassword.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }

      // TODO: Implementar reset de contraseña con token
      // await authService.resetPassword(resetToken, newPassword);
      
      setSuccess('Contraseña actualizada exitosamente');
      
      // Redirigir al login después de un momento
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2
          }}
        >
          <Box display="flex" alignItems="center" mb={3}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/auth')}
              sx={{ mb: 2 }}
            >
              Volver al Login
            </Button>
          </Box>

          <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
            <KeyIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h4" component="h1" textAlign="center">
              {isResetMode ? 'Nueva Contraseña' : 'Recuperar Contraseña'}
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

          {isResetMode ? (
            /* Formulario para establecer nueva contraseña */
            <form onSubmit={handleResetPassword}>
              <Box display="flex" flexDirection="column" gap={3}>
                <TextField
                  label="Nueva Contraseña"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  fullWidth
                  required
                />

                <TextField
                  label="Confirmar Nueva Contraseña"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Button>
              </Box>
            </form>
          ) : (
            /* Formulario para solicitar reset */
            <form onSubmit={handleRequestReset}>
              <Box display="flex" flexDirection="column" gap={3}>
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  Ingresa tu email y te enviaremos un enlace para recuperar tu contraseña.
                </Typography>

                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                </Button>
              </Box>
            </form>
          )}

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Nota:</strong> La funcionalidad de reset de contraseña será implementada en una versión futura. 
              Por ahora, contacta al administrador para cambiar tu contraseña.
            </Typography>
          </Alert>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;