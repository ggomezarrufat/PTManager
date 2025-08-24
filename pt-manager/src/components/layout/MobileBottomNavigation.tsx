import React, { useState } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
  Box,
  Typography,
} from '@mui/material';
import {
  Home as HomeIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  CalendarToday as SeasonsIcon,
  People as UsersIcon,
  Casino as TournamentsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTournamentStore } from '../../store/tournamentStore';

const MobileBottomNavigation: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { tournaments } = useTournamentStore();
  const isAdmin = !!user?.is_admin;
  
  // Estado para mostrar menú de administración expandido
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  // Obtener el torneo activo
  const activeTournament = tournaments.find(t => t.status === 'active');

  // No mostrar en desktop
  if (!isMobile) return null;

  // Determinar el valor activo basado en la ruta
  const getActiveValue = () => {
    const path = location.pathname;
    
    // Creación de torneos
    if (path === '/tournament/new') return 0;
    
    // Reloj del torneo activo
    if (activeTournament && path === `/tournament/${activeTournament.id}`) return 1;
    
    // Inicio y rutas relacionadas
    if (path === '/' || path === '/dashboard') return 2;
    
    // Perfil y configuración
    if (path === '/profile') return 3;
    
    // Administración (solo para admins)
    if (isAdmin && (path === '/seasons' || path === '/admin/users')) return 4;
    
    // Vistas de torneos - considerar como inicio
    if (path.startsWith('/tournament/')) return 2;
    
    return 2; // Default to inicio
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/tournament/new');
        setShowAdminMenu(false);
        break;
      case 1:
        // Navegar al reloj del torneo activo si existe
        if (activeTournament) {
          navigate(`/tournament/${activeTournament.id}`);
        }
        setShowAdminMenu(false);
        break;
      case 2:
        navigate('/dashboard');
        setShowAdminMenu(false);
        break;
      case 3:
        navigate('/profile');
        setShowAdminMenu(false);
        break;
      case 4:
        // Toggle menú de administración
        if (isAdmin) {
          setShowAdminMenu(!showAdminMenu);
        }
        break;
    }
  };
  
  // Función para navegar a secciones de administración
  const handleAdminNavigation = (path: string) => {
    navigate(path);
    setShowAdminMenu(false);
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 9999, // Z-index muy alto para estar siempre visible
        pb: 'env(safe-area-inset-bottom)', // iOS safe area
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
        // Asegurar que esté siempre visible
        transform: 'translateZ(0)', // Forzar capa de hardware
        willChange: 'transform', // Optimización de rendimiento
      }} 
      elevation={0}
    >
      <BottomNavigation 
        value={getActiveValue()} 
        onChange={handleChange}
        showLabels
        sx={{
          height: 70,
          background: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '8px 12px',
            color: '#b0b0b0',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              color: '#ffffff',
            },
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: '#ff4757',
            '& .MuiBottomNavigationAction-label': {
              color: '#ff4757',
              fontWeight: 600,
            },
            '& .MuiSvgIcon-root': {
              transform: 'scale(1.1)',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            fontWeight: 400,
            marginTop: '4px',
            '&.Mui-selected': {
              fontSize: '0.75rem',
              fontWeight: 600,
            },
          },
          '& .MuiSvgIcon-root': {
            fontSize: '24px',
            transition: 'transform 0.2s ease-in-out',
          },
        }}
      >
        <BottomNavigationAction 
          label="Crear" 
          icon={<AddIcon />} 
        />
        <BottomNavigationAction 
          label={activeTournament ? "Reloj Activo" : "Reloj"} 
          icon={
            <Box sx={{ position: 'relative' }}>
              <ScheduleIcon />
              {activeTournament && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#2ed573',
                    border: '2px solid #1a1a1a',
                  }}
                />
              )}
            </Box>
          }
          disabled={!activeTournament}
          sx={{
            '&.Mui-disabled': {
              opacity: 0.5,
              color: '#666666',
            },
            '&:not(.Mui-disabled)': {
              color: activeTournament ? '#2ed573' : '#b0b0b0',
            }
          }}
        />
        <BottomNavigationAction 
          label="Inicio" 
          icon={<HomeIcon />} 
        />
        <BottomNavigationAction 
          label="Perfil" 
          icon={<PersonIcon />} 
        />
        
        {/* Icono de administración - solo visible para admins */}
        {isAdmin && (
          <BottomNavigationAction 
            label="Admin" 
            icon={<AdminIcon />} 
          />
        )}
      </BottomNavigation>
      
      {/* Menú de administración expandido */}
      {showAdminMenu && isAdmin && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 80, // Encima de la barra de navegación
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9998,
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderRadius: '20px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            gap: '12px',
            minWidth: '280px',
            justifyContent: 'center',
          }}
        >
          {/* Gestión de Temporadas */}
          <Box
            onClick={() => handleAdminNavigation('/seasons')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                background: 'rgba(255,71,87,0.1)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <SeasonsIcon sx={{ fontSize: 28, color: '#ffa502' }} />
            <Typography
              variant="caption"
              sx={{
                color: '#ffffff',
                fontWeight: 500,
                fontSize: '0.7rem',
                textAlign: 'center',
              }}
            >
              Temporadas
            </Typography>
          </Box>
          
          {/* Gestión de Usuarios */}
          <Box
            onClick={() => handleAdminNavigation('/admin/users')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                background: 'rgba(255,71,87,0.1)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <UsersIcon sx={{ fontSize: 28, color: '#ff4757' }} />
            <Typography
              variant="caption"
              sx={{
                color: '#ffffff',
                fontWeight: 500,
                fontSize: '0.7rem',
                textAlign: 'center',
              }}
            >
              Usuarios
            </Typography>
          </Box>
          
          {/* Gestión de Torneos */}
          <Box
            onClick={() => handleAdminNavigation('/tournaments')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                background: 'rgba(255,71,87,0.1)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <TournamentsIcon sx={{ fontSize: 28, color: '#2ed573' }} />
            <Typography
              variant="caption"
              sx={{
                color: '#ffffff',
                fontWeight: 500,
                fontSize: '0.7rem',
                textAlign: 'center',
              }}
            >
              Torneos
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default MobileBottomNavigation;
