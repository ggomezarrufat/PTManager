import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Container,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  VpnKey as KeyIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { authService } from '../services/apiService';
import { supabase } from '../config/supabase';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Modo recovery: se activa cuando Supabase detecta el token de recuperación en la URL
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Escuchar cambios de autenticación para detectar el evento PASSWORD_RECOVERY
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setCheckingSession(false);
        setError(null);
        setSuccess(null);
      }
    });

    // Verificar si ya hay una sesión de recovery activa (por si el evento ya se disparó)
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // Si hay sesión y la URL contiene indicadores de recovery, activar modo recovery
        const hash = window.location.hash;
        if (hash && (hash.includes('type=recovery') || hash.includes('type=magiclink'))) {
          setIsRecoveryMode(true);
        } else if (session && window.location.hash.includes('access_token')) {
          // Si hay token en la URL, esperar al evento PASSWORD_RECOVERY
          return;
        }
      } catch {
        // Ignorar errores de sesión
      } finally {
        setCheckingSession(false);
      }
    };

    // Pequeño delay para dar tiempo al Supabase client a procesar el hash
    const timeout = setTimeout(checkSession, 500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Solicitar envío de email de recuperación
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!email.trim()) {
        setError('El email es requerido');
        return;
      }

      await authService.requestPasswordReset(email);

      setEmailSent(true);
      setSuccess('Si el email existe en nuestro sistema, recibirás un enlace de recuperación en tu correo.');
    } catch (err: any) {
      setError(err.message || 'Error al solicitar la recuperación de contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Establecer nueva contraseña usando la sesión de Supabase
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
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

      // Usar Supabase directamente para actualizar la contraseña
      // La sesión fue establecida automáticamente por el redirect de Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess('Contraseña actualizada exitosamente. Redirigiendo al login...');

      // Cerrar la sesión de recovery y redirigir al login
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de carga mientras se verifica la sesión
  if (checkingSession && window.location.hash.includes('access_token')) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box textAlign="center">
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Verificando enlace de recuperación...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

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
            >
              Volver al Login
            </Button>
          </Box>

          <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
            <KeyIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h4" component="h1" textAlign="center">
              {isRecoveryMode ? 'Nueva Contraseña' : 'Recuperar Contraseña'}
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

          {isRecoveryMode ? (
            /* Formulario para establecer nueva contraseña */
            <form onSubmit={handleResetPassword}>
              <Box display="flex" flexDirection="column" gap={3}>
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  Ingresa tu nueva contraseña.
                </Typography>

                <TextField
                  label="Nueva Contraseña"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  fullWidth
                  required
                  autoFocus
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
          ) : emailSent ? (
            /* Confirmación de email enviado */
            <Box textAlign="center" py={2}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Revisa tu correo
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Si el email <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Revisa también tu carpeta de spam. El enlace expira en 1 hora.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setEmailSent(false);
                  setSuccess(null);
                  setEmail('');
                }}
              >
                Enviar de nuevo
              </Button>
            </Box>
          ) : (
            /* Formulario para solicitar reset */
            <form onSubmit={handleRequestReset}>
              <Box display="flex" flexDirection="column" gap={3}>
                <Box textAlign="center">
                  <EmailIcon color="action" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    Ingresa tu email y te enviaremos un enlace para recuperar tu contraseña.
                  </Typography>
                </Box>

                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                  autoFocus
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || !email.trim()}
                  fullWidth
                >
                  {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                </Button>
              </Box>
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;
