import React, { useEffect, useState } from 'react';
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
import ActiveTournamentClock from './pages/ActiveTournamentClock';
import Reports from './pages/Reports';
import ResetPassword from './pages/ResetPassword';
import UserProfile from './pages/UserProfile';
import CreateTournament from './pages/CreateTournament';
import TournamentList from './pages/TournamentList';
import UserAdmin from './pages/UserAdmin';
import Layout from './components/layout/Layout';
import { API_BASE_URL } from './services/apiService';
import SeasonAdmin from './pages/SeasonAdmin';

// Tema personalizado inspirado en aplicaciones de póker modernas
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff4757', // Rojo vibrante como en las imágenes
      light: '#ff6b7a',
      dark: '#c44569',
    },
    secondary: {
      main: '#ffa502', // Dorado/amarillo para elementos premium
      light: '#ffb142',
      dark: '#f39c12',
    },
    background: {
      default: '#0c0c0c', // Negro profundo
      paper: '#1a1a1a', // Gris muy oscuro para cards
    },
    text: {
      primary: '#ffffff', // Blanco puro
      secondary: '#b0b0b0', // Gris claro
    },
    success: {
      main: '#2ed573', // Verde para elementos positivos
    },
    warning: {
      main: '#ffa502', // Dorado para advertencias
    },
    error: {
      main: '#ff4757', // Rojo para errores
    },
    info: {
      main: '#3742fa', // Azul para información
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    // Optimizaciones para móvil
    h1: {
      fontWeight: 700,
      '@media (max-width:900px)': {
        fontSize: '2rem',
      },
    },
    h2: {
      fontWeight: 600,
      '@media (max-width:900px)': {
        fontSize: '1.75rem',
      },
    },
    h3: {
      fontWeight: 600,
      '@media (max-width:900px)': {
        fontSize: '2.5rem',
      },
    },
    h4: {
      fontWeight: 500,
      '@media (max-width:900px)': {
        fontSize: '1.8rem',
      },
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      fontWeight: 400,
    },
    body2: {
      fontWeight: 400,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none', // Sin mayúsculas automáticas
    },
  },
  components: {
    // Prevenir zoom automático en inputs móviles
    MuiInputBase: {
      styleOverrides: {
        input: {
          fontSize: '16px', // Previene zoom automático en iOS
          '@media (max-width:900px)': {
            fontSize: '16px', // Asegurar 16px en móvil
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontSize: '16px',
            '@media (max-width:900px)': {
              fontSize: '16px',
            },
          },
        },
      },
    },
    // Optimizar botones para táctil con estilo de póker
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '44px', // Mínimo recomendado para táctil (44x44px)
          borderRadius: '12px', // Bordes más redondeados como en las imágenes
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '@media (max-width:900px)': {
            minHeight: '48px',
            fontSize: '1rem',
            padding: '12px 24px',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #ff4757 0%, #c44569 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #ff6b7a 0%, #ff4757 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            background: 'rgba(255, 71, 87, 0.1)',
          },
        },
        sizeLarge: {
          '@media (max-width:900px)': {
            minHeight: '52px',
            fontSize: '1.1rem',
            padding: '14px 28px',
          },
        },
      },
    },
    // Optimizar IconButtons para móvil
    MuiIconButton: {
      styleOverrides: {
        root: {
          '@media (max-width:900px)': {
            padding: '12px', // Más área táctil
          },
        },
      },
    },

    // Optimizar AppBar para móvil con estilo de póker
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
          '@media (max-width:900px)': {
            '& .MuiToolbar-root': {
              minHeight: '56px',
              paddingLeft: '8px',
              paddingRight: '8px',
            },
          },
        },
      },
    },
    
    // Estilo para Cards con apariencia de póker
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,71,87,0.3)',
          },
        },
      },
    },
    
    // Estilo para Chips con apariencia de póker
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          fontWeight: 500,
          '&.MuiChip-colorPrimary': {
            background: 'linear-gradient(135deg, #ff4757 0%, #c44569 100%)',
          },
          '&.MuiChip-colorSecondary': {
            background: 'linear-gradient(135deg, #ffa502 0%, #f39c12 100%)',
          },
          '@media (max-width:900px)': {
            fontSize: '0.8rem',
            height: '28px',
          },
        },
      },
    },
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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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

  // Mostrar mensaje de éxito cuando el usuario se autentica
  useEffect(() => {
    if (user) {
      console.log('🎉 App: Usuario autenticado, mostrando mensaje de bienvenida');
      setShowSuccessMessage(true);
      // Ocultar mensaje después de 2 segundos y permitir que avance
      const timer = setTimeout(() => {
        console.log('⏰ App: Ocultando mensaje de bienvenida, avanzando al dashboard');
        setShowSuccessMessage(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user]); // Solo depende de user

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
  console.log('🔍 App: Usuario autenticado, renderizando aplicación principal');
  
  // Si está mostrando el mensaje de éxito, mostrarlo
  if (showSuccessMessage) {
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
          bgcolor="success.50"
        >
          <Box
            bgcolor="white"
            p={4}
            borderRadius={2}
            boxShadow={3}
            maxWidth="400px"
            width="100%"
          >
            <Typography variant="h4" color="success.main" gutterBottom>
              ✅ ¡Bienvenido!
            </Typography>
            <Typography variant="body1" mb={3}>
              Inicio de sesión exitoso
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresando a la página de inicio...
            </Typography>
            <Box display="flex" justifyContent="center" mt={3}>
              <CircularProgress size={24} color="success" />
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              (() => {
                try {
                  console.log('🔍 App: Renderizando ruta /dashboard');
                  return <Dashboard />;
                } catch (error) {
                  console.error('🚨 App: Error renderizando Dashboard:', error);
                  return (
                    <Box p={3} textAlign="center">
                      <Typography variant="h5" color="error" gutterBottom>
                        Error al cargar el Dashboard
                      </Typography>
                      <Typography variant="body1">
                        {error instanceof Error ? error.message : 'Error desconocido'}
                      </Typography>
                    </Box>
                  );
                }
              })()
            } />
            <Route path="/tournaments" element={<TournamentList />} />
            <Route path="/tournament/new" element={<CreateTournament />} />
            <Route path="/tournament/active" element={<ActiveTournamentClock />} />
            <Route path="/tournament/:id" element={<TournamentView />} />
            <Route path="/tournament/:id/manage" element={<TournamentManagement />} />
            <Route path="/tournament/:id/players" element={<PlayerManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<UserProfile />} />
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