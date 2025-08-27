import React, { useState, useEffect } from 'react';
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

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');

  // Debug: Monitorear cambios en el estado
  useEffect(() => {
    console.log('🔍 AuthForm: Estado actualizado - error:', error, 'success:', success);
  }, [error, success]);

  // Debug: Monitorear cambios en loading
  useEffect(() => {
    console.log('🔍 AuthForm: Loading actualizado:', loading);
  }, [loading]);

  // Los mensajes se limpian solo al cambiar de pestaña o al intentar nuevo login/registro

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    console.log('🔍 AuthForm: Estado inicial - error:', error, 'success:', success);

    if (!email || !password) {
      setError('❌ Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('❌ Por favor ingresa un email válido');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Intentando iniciar sesión con:', email);
      await login(email, password);
      console.log('✅ AuthForm: Login exitoso, redirigiendo...');
      
    } catch (err: unknown) {
      console.error('❌ Error en login:', err);
      console.log('🔍 AuthForm: Tipo de error:', typeof err, 'Instancia de ApiError:', err instanceof ApiError);
      
      if (err instanceof ApiError) {
        console.log('🔍 AuthForm: ApiError detectado, status:', err.status, 'message:', err.message);
        // Mensajes específicos según el tipo de error
        switch (err.status) {
          case 400:
            setError('❌ Credenciales incorrectas. Verifica tu email y contraseña.');
            break;
          case 401:
            setError('❌ Usuario no autorizado. Verifica tus credenciales.');
            break;
          case 403:
            setError('❌ Acceso denegado. Tu cuenta puede estar suspendida.');
            break;
          case 404:
            setError('❌ Usuario no encontrado. Verifica tu email o regístrate.');
            break;
          case 429:
            setError('⚠️ Demasiados intentos. Espera un momento antes de volver a intentar.');
            break;
          case 500:
            setError('🔧 Error del servidor. Intenta más tarde o contacta soporte.');
            break;
          default:
            setError(`❌ ${err.message || 'Error inesperado al iniciar sesión'}`);
        }
        console.log('🔍 AuthForm: Error establecido:', error);
      } else {
        setError('❌ Error inesperado al iniciar sesión. Intenta nuevamente.');
        console.log('🔍 AuthForm: Error genérico establecido');
      }
      
    } finally {
      setLoading(false);
      console.log('🔍 AuthForm: Estado final - error:', error, 'success:', success);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validaciones
    if (!email || !password || !confirmPassword || !name) {
      setError('❌ Por favor completa todos los campos obligatorios');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('❌ Por favor ingresa un email válido');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError('❌ La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('❌ Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Intentando registrar usuario:', { email, name, nickname });
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
              setError('❌ Este email ya está registrado. Usa otro email o inicia sesión.');
            } else {
              setError('❌ Datos inválidos. Verifica la información ingresada.');
            }
            break;
          case 409:
            setError('❌ Este email ya está registrado. Usa otro email o inicia sesión.');
            break;
          case 422:
            setError('❌ Datos de entrada inválidos. Verifica el formato de los datos.');
            break;
          case 500:
            setError('🔧 Error del servidor. Intenta más tarde o contacta soporte.');
            break;
          default:
            setError(`❌ ${err.message || 'Error inesperado al registrar'}`);
        }
      } else {
        setError('❌ Error inesperado al registrar. Intenta nuevamente.');
      }
      
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'github') => {
    setError('Autenticación social no disponible en modo API. Use email y contraseña.');
  };

  const handleForgotPassword = async () => {
    setError('Recuperación de contraseña no implementada en modo API. Contacte al administrador.');
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
        setError(null);
      } else {
        setError('No se pudo resetear el rate limit');
      }
    } catch (err) {
      setError('Error al resetear el rate limit');
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
                p: 2, 
                bgcolor: 'info.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'info.200'
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="info.main">
                  {tabValue === 0 ? 'Procesando inicio de sesión...' : 'Procesando registro...'}
                </Typography>
              </Box>
            </Box>
          )}

          <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
            <Tab label="Iniciar Sesión" />
            <Tab label="Registrarse" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleSignIn}>
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
              
              {/* Mensaje de error destacado */}
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
                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 500, mb: 2 }}>
                    {error}
                  </Typography>
                  
                  {/* Botón de reset rate limit cuando sea necesario */}
                  {(error.includes('Too Many Requests') || error.includes('429')) && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleResetRateLimit}
                      disabled={loading}
                      startIcon={<span>🔄</span>}
                      sx={{ mt: 1 }}
                    >
                      Resetear Rate Limit
                    </Button>
                  )}
                </Box>
              )}
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <span>🔐</span>}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
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