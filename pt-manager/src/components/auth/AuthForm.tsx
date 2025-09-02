import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Google, GitHub } from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { ApiError } from '../../services/apiService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AuthForm: React.FC = () => {
  const { login, register } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Debounce adicional

  // Ref para mantener el estado del error de manera síncrona
  const errorRef = useRef<string | null>(null);

  // Variable global para almacenar errores temporalmente
  const errorKey = 'authForm_lastError';

  // Función simplificada para manejar errores
  const handleAuthError = React.useCallback((message: string | null) => {
    if (message) {
      // Guardar en localStorage para persistencia
      localStorage.setItem(errorKey, message);
      errorRef.current = message;

      // Actualizar estado de React
      setError(message);
    } else {
      // Limpiar error
      localStorage.removeItem(errorKey);
      errorRef.current = null;
      setError(null);
    }
  }, []);

  // Cargar error del localStorage al montar el componente
  React.useEffect(() => {
    const savedError = localStorage.getItem(errorKey);
    if (savedError) {
      errorRef.current = savedError;
      setError(savedError);
    }
  }, []);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');



  // Limpiar errores automáticamente después de 10 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        handleAuthError(null);
      }, 10000); // 10 segundos

      return () => clearTimeout(timer);
    }
  }, [error, handleAuthError]);



  // Limpiar mensajes de éxito después de 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000); // 5 segundos

      return () => clearTimeout(timer);
    }
  }, [success]);

  // Los mensajes se limpian solo al cambiar de pestaña o al intentar nuevo login/registro

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    handleAuthError(null);
    setSuccess(null);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleSignIn = async (e?: React.FormEvent | React.MouseEvent) => {
    // Si es un evento, prevenir comportamiento por defecto
    if (e) {
      if ('preventDefault' in e) {
        e.preventDefault();
      }
      if ('stopPropagation' in e) {
        e.stopPropagation();
      }
    }



    // Verificar que no se haya enviado ya (doble verificación)
    if (loading || isSubmitting) {
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    handleAuthError(null);
    setSuccess(null);

    // Validaciones del lado cliente
    if (!email || !password) {
      handleAuthError('⚠️ Por favor completa todos los campos (email y contraseña)');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      handleAuthError('⚠️ Por favor ingresa un email válido (ejemplo: usuario@dominio.com)');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      handleAuthError('⚠️ La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      await login(email, password);

      // Mostrar mensaje de éxito
      setSuccess('🎉 ¡Sesión iniciada exitosamente! Redirigiendo...');

      // No hacer navegación automática aquí, dejar que el componente padre maneje la redirección
      // El reload podría estar siendo causado por algún listener o redirección externa

    } catch (err: unknown) {
      if (err instanceof ApiError) {
        switch (err.status) {
          case 400:

            const lowerMessage = err.message.toLowerCase();
            const hasEmail = lowerMessage.includes('email');
            const hasPassword = lowerMessage.includes('password') || lowerMessage.includes('contraseña');

            if (hasEmail || hasPassword) {
              handleAuthError('⚠️ Email o contraseña incorrectos. Verifica tus credenciales.');
            } else {
              handleAuthError('⚠️ Datos de acceso inválidos. Revisa tu email y contraseña.');
            }
            break;
          case 401:
            handleAuthError('⚠️ Usuario no autorizado. Verifica que tu email y contraseña sean correctos.');
            break;
          case 403:
            handleAuthError('⚠️ Acceso denegado. Tu cuenta puede estar suspendida o no tener permisos.');
            break;
          case 404:
            handleAuthError('⚠️ Usuario no encontrado. Verifica tu email o regístrate si eres nuevo.');
            break;
          case 429:
            handleAuthError('⚠️ Demasiados intentos fallidos. Espera 1-2 minutos antes de intentar nuevamente.');
            break;
          case 422:
            handleAuthError('⚠️ Datos inválidos. Revisa el formato de tu email.');
            break;
          case 500:
            handleAuthError('⚠️ Error interno del servidor. Inténtalo en unos momentos.');
            break;
          case 503:
            handleAuthError('⚠️ Servicio no disponible. El servidor está temporalmente fuera de servicio.');
            break;
          default:
            // Si el mensaje del servidor es específico, lo usamos
            if (err.message && err.message !== 'Network Error' && err.message !== 'Request failed') {
              handleAuthError(`⚠️ ${err.message}`);

            } else {
              handleAuthError('⚠️ Error al iniciar sesión. Revisa tu conexión e intenta nuevamente.');
            }
        }
      } else {
        handleAuthError('⚠️ Error inesperado al iniciar sesión. Intenta nuevamente.');
      }

    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    handleAuthError(null);
    setSuccess(null);

    // Validaciones
    if (!email || !password || !confirmPassword || !name) {
      handleAuthError('❌ Por favor completa todos los campos obligatorios');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      handleAuthError('❌ Por favor ingresa un email válido');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      handleAuthError('❌ La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      handleAuthError('❌ Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      await register(email, password, name, nickname || undefined);
      setSuccess('✅ ¡Registro exitoso! Ya puedes iniciar sesión.');
      
      // Limpiar formulario
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setNickname('');
      
      // Cambiar a la pestaña de login
      setTabValue(0);
      
    } catch (err: unknown) {
      console.error('❌ Error en registro:', err);
      
      if (err instanceof ApiError) {
        // Mensajes específicos según el tipo de error
        switch (err.status) {
          case 400:
            if (err.message.includes('email')) {
              handleAuthError('❌ Este email ya está registrado. Usa otro email o inicia sesión.');
            } else {
              handleAuthError('❌ Datos inválidos. Verifica la información ingresada.');
            }
            break;
          case 409:
            handleAuthError('❌ Este email ya está registrado. Usa otro email o inicia sesión.');
            break;
          case 422:
            handleAuthError('❌ Datos de entrada inválidos. Verifica el formato de los datos.');
            break;
          case 500:
            handleAuthError('🔧 Error del servidor. Intenta más tarde o contacta soporte.');
            break;
          default:
            handleAuthError(`❌ ${err.message || 'Error inesperado al registrar'}`);
        }
      } else {
        handleAuthError('❌ Error inesperado al registrar. Intenta nuevamente.');
      }
      
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'github') => {
    handleAuthError('Autenticación social no disponible en modo API. Use email y contraseña.');
  };

  const handleForgotPassword = async () => {
    handleAuthError('Recuperación de contraseña no implementada en modo API. Contacte al administrador.');
  };

  const handleResetRateLimit = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/reset-rate-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess('Rate limit reseteado. Puedes intentar iniciar sesión nuevamente.');
        handleAuthError(null);
      } else {
        handleAuthError('No se pudo resetear el rate limit');
      }
    } catch (err) {
      handleAuthError('Error al resetear el rate limit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="grey.100"
    >
      <Card sx={{ maxWidth: 450, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
            Poker Tournament Manager
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" mb={3}>
            Gestiona tus torneos de poker
          </Typography>

          {/* Indicador de estado general */}
          {loading && (
            <Box
              sx={{
                mb: 2,
                p: 3,
                bgcolor: 'info.50',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'info.main',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Indicador visual de progreso */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  bgcolor: 'info.main',
                  animation: 'pulse 2s infinite'
                }}
              />

              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress size={20} />
                <Box>
                  <Typography variant="body1" color="info.main" sx={{ fontWeight: 600 }}>
                    {tabValue === 0 ? '🔐 Verificando credenciales...' : '📝 Creando cuenta...'}
                  </Typography>
                  <Typography variant="body2" color="info.dark">
                    {tabValue === 0 ? 'Validando email y contraseña' : 'Procesando tu registro'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <Box
              sx={{
                mb: 2,
                p: 3,
                bgcolor: 'success.50',
                border: '2px solid',
                borderColor: 'success.main',
                borderRadius: 2,
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.15)'
              }}
            >
              <Typography
                variant="body1"
                color="success.main"
                sx={{
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 1
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>✅</span>
                ¡Operación Exitosa!
              </Typography>
              <Typography variant="body2" color="success.dark">
                {success}
              </Typography>
            </Box>
          )}

          <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
            <Tab label="Iniciar Sesión" />
            <Tab label="Registrarse" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box
              component="form"
              onSubmit={handleSignIn}
              onKeyDown={(e: React.KeyboardEvent) => {
                // Permitir submit con Enter solo si no está cargando y tiene datos
                if (e.key === 'Enter' && loading) {
                  e.preventDefault();
                } else if (e.key === 'Enter' && (!email || !password)) {
                  e.preventDefault();
                }
              }}
              noValidate
            >
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                error={!!(error && (error.includes('email') || error.includes('Email')))}
                helperText={
                  error && error.includes('email')
                    ? error
                    : email && !validateEmail(email)
                      ? 'Formato de email inválido'
                      : ''
                }
              />
              <TextField
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                error={!!(error && (error.includes('contraseña') || error.includes('password') || error.includes('credenciales')))}
                helperText={
                  error && (error.includes('contraseña') || error.includes('password'))
                    ? error
                    : password && !validatePassword(password)
                      ? 'La contraseña debe tener al menos 6 caracteres'
                      : ''
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />



              {/* Mensaje de error destacado */}
              {localStorage.getItem(errorKey) && (
                <>

                <Box
                  sx={{
                    mt: 2,
                    mb: 2,
                    p: 3,
                    bgcolor: 'error.50',
                    border: '2px solid',
                    borderColor: 'error.main',
                    borderRadius: 2,
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(211, 47, 47, 0.15)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Indicador visual de error */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      bgcolor: 'error.main'
                    }}
                  />

                  <Typography
                    variant="body1"
                    color="error.main"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    Error de Inicio de Sesión
                  </Typography>

                  <Typography
                    variant="body2"
                    color="error.dark"
                    sx={{
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      lineHeight: 1.4
                    }}
                  >
                    {localStorage.getItem(errorKey)}
                  </Typography>

                  {/* Información adicional para errores específicos */}
                  {(localStorage.getItem(errorKey)?.includes('Too Many Requests') || localStorage.getItem(errorKey)?.includes('429') || localStorage.getItem(errorKey)?.includes('Demasiados intentos')) && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                      <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500, mb: 1 }}>
                        💡 ¿Qué hacer si tienes muchos intentos fallidos?
                      </Typography>
                      <Typography variant="caption" color="warning.dark">
                        • Espera 1-2 minutos antes de intentar nuevamente<br/>
                        • Verifica que tu email y contraseña sean correctos<br/>
                        • Si olvidaste tu contraseña, contacta al administrador
                      </Typography>
                    </Box>
                  )}

                  {(localStorage.getItem(errorKey)?.includes('Email o contraseña incorrectos') || localStorage.getItem(errorKey)?.includes('credenciales')) && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                      <Typography variant="body2" color="info.main" sx={{ fontWeight: 500, mb: 1 }}>
                        💡 Consejos para acceder:
                      </Typography>
                      <Typography variant="caption" color="info.dark">
                        • Asegúrate de que el email esté escrito correctamente<br/>
                        • Las contraseñas distinguen mayúsculas y minúsculas<br/>
                        • Si eres nuevo, usa la pestaña "Registrarse"
                      </Typography>
                    </Box>
                  )}

                  {/* Botón de reset rate limit cuando sea necesario */}
                  {(localStorage.getItem(errorKey)?.includes('Too Many Requests') || localStorage.getItem(errorKey)?.includes('429') || localStorage.getItem(errorKey)?.includes('Demasiados intentos')) && (
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={handleResetRateLimit}
                      disabled={loading}
                      startIcon={<span>🔄</span>}
                      sx={{
                        mt: 2,
                        fontWeight: 600,
                        textTransform: 'none'
                      }}
                    >
                      Resetear Rate Limit
                    </Button>
                  )}
                </Box>
                </>
              )}
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                onClick={(e) => {
                  // No necesitamos preventDefault aquí porque el formulario ya lo maneja
                }}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    boxShadow: loading ? 'none' : '0 6px 16px rgba(25, 118, 210, 0.4)',
                    transform: loading ? 'none' : 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
                disabled={loading || isSubmitting || !email || !password}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <span style={{ fontSize: '1.2rem' }}>🔐</span>
                  )
                }
              >
                {loading ? (
                  <Box>
                    <Typography variant="button" sx={{ fontWeight: 600 }}>
                      Verificando credenciales...
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                      Esto puede tomar unos segundos
                    </Typography>
                  </Box>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={handleForgotPassword}
                disabled={loading || !email}
                sx={{ mb: 2 }}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handleSignUp}>
              <TextField
                fullWidth
                label="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Sobrenombre (opcional)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                margin="normal"
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                helperText="Mínimo 6 caracteres"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {/* Mensaje de error destacado para registro */}
              {error && (
                <Box 
                  sx={{ 
                    mt: 2, 
                    mb: 2,
                    p: 2,
                    bgcolor: 'error.50',
                    border: '1px solid',
                    borderColor: 'error.200',
                    borderRadius: 1,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                    {error}
                  </Typography>
                </Box>
              )}
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <span>📝</span>}
              >
                {loading ? 'Creando cuenta...' : 'Registrarse'}
              </Button>
            </Box>
          </TabPanel>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              O continúa con
            </Typography>
          </Divider>

          <Box display="flex" gap={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              onClick={() => handleSocialAuth('google')}
              disabled={true}
            >
              Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GitHub />}
              onClick={() => handleSocialAuth('github')}
              disabled={true}
            >
              GitHub
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
            Powered by Gigitus
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1}>
            <a 
              href="mailto:ggomezarrufat@gmail.com" 
              style={{ 
                color: 'inherit', 
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Contacta con el desarrollador
            </a>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthForm;