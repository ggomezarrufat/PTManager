import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import { useAuthStore } from './store/authStore';
import { useTournamentStore } from './store/tournamentStore';
import AuthForm from './components/auth/AuthForm';
import Dashboard from './pages/Dashboard';
import TournamentView from './pages/TournamentView';
import TournamentManagement from './pages/TournamentManagement';
import PlayerManagement from './pages/PlayerManagement';
import Reports from './pages/Reports';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import CreateTournament from './pages/CreateTournament';
import UserAdmin from './pages/UserAdmin';
import Layout from './components/layout/Layout';
import { API_BASE_URL } from './services/apiService';
import SeasonAdmin from './pages/SeasonAdmin';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Componente de carga
const LoadingScreen: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress size={60} />
  </Box>
);

// Componente principal
const App: React.FC = () => {
  const { user, loading, error, loadUser } = useAuthStore();
  const { loadTournaments } = useTournamentStore();

  // Debug info
  console.log('🔍 App Debug:', {
    user,
    loading,
    error,
    apiUrl: API_BASE_URL
  });

  // Cargar usuario al iniciar la aplicación
  useEffect(() => {
    console.log('🚀 App: Iniciando carga inicial de usuario');
    loadUser();
  }, [loadUser]); // Sin dependencias para evitar bucles

  // Cargar torneos cuando el usuario esté autenticado
  useEffect(() => {
    if (user) {
      loadTournaments();
    }
  }, [user, loadTournaments]);

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (loading) {
    return <LoadingScreen />;
  }

  // Si hay error de conexión con la API, mostrar mensaje
  if (error && error.includes('Error de conexión')) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          p={3}
          textAlign="center"
        >
          <Typography variant="h4" color="error" gutterBottom>
            🔌 Error de Conexión
          </Typography>
          <Typography variant="body1" mb={3} maxWidth="600px">
            No se puede conectar con el servidor backend.
            Asegúrate de que el servidor API esté funcionando en {API_BASE_URL}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Para iniciar el servidor backend:
          </Typography>
          <Box 
            component="pre" 
            bgcolor="grey.100" 
            p={2} 
            borderRadius={1} 
            mb={3}
            textAlign="left"
            fontFamily="monospace"
          >
{`cd pt-backend
npm run dev`}
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  // Si no hay usuario autenticado, mostrar formulario de login
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<AuthForm />} />
          </Routes>
        </Router>
      </ThemeProvider>
    );
  }

  // Usuario autenticado, mostrar aplicación principal
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tournament/new" element={<CreateTournament />} />
            <Route path="/tournament/:id" element={<TournamentView />} />
            <Route path="/tournament/:id/manage" element={<TournamentManagement />} />
            <Route path="/tournament/:id/players" element={<PlayerManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/users" element={<UserAdmin />} />
            <Route path="/seasons" element={<SeasonAdmin />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

export default App; 