import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Google, GitHub } from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { ApiError, API_BASE_URL } from '../../services/apiService';

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

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido');
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
      setSuccess('Inicio de sesión exitoso');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error inesperado al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones
    if (!email || !password || !confirmPassword || !name) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      await register(email, password, name, nickname || undefined);
      setSuccess('Registro exitoso');
      
      // Limpiar formulario
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setNickname('');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error inesperado al registrar');
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

  const handleClearSession = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setError(null);
      setSuccess('Sesión borrada. Vuelve a iniciar sesión.');
    } catch (e) {
      setError('No se pudo borrar la sesión');
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

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
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
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
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
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Registrarse'}
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

          <Button
            fullWidth
            variant="text"
            color="warning"
            onClick={handleClearSession}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            Borrar sesión (limpiar token)
          </Button>
          
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
            🔗 Conectado a API Backend ({API_BASE_URL})
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthForm;