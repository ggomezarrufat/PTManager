import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Settings,
  AdminPanelSettings,
  Home as HomeIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  Diamond as DiamondIcon,
  EmojiEvents as TournamentIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getUserDisplayName, getUserFullName } from '../../utils/userUtils';
import MobileBottomNavigation from './MobileBottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuthStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerWidthOpen = 250;
  const drawerWidthClosed = 64;
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, path: '/' },
    { text: 'Torneos', icon: <TournamentIcon />, path: '/tournaments' },
    { text: 'Temporadas', icon: <CalendarIcon />, path: '/seasons', adminOnly: true },
    { text: 'Usuarios', icon: <PeopleIcon />, path: '/admin/users', adminOnly: true },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Perfil', icon: <SettingsIcon />, path: '/profile' },
  ];

  // Elementos del menú solo para administradores
  const adminMenuItems: any[] = [
    // Los elementos de admin ya están en menuItems con adminOnly: true
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box sx={{ width: drawerOpen ? drawerWidthOpen : drawerWidthClosed }}>
      {/* Logo y título */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <DiamondIcon sx={{ 
          fontSize: 40, 
          color: '#ffd700', 
          mb: 1,
          filter: 'drop-shadow(0 2px 4px rgba(255,215,0,0.4))',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)',
            filter: 'drop-shadow(0 4px 8px rgba(255,215,0,0.6))',
          }
        }} />
        <Typography variant="h6" component="div">
          Poker Manager
        </Typography>
      </Box>

      <Divider />

      {/* Menú principal */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={isActiveRoute(item.path)}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: isActiveRoute(item.path) ? 'primary.main' : 'inherit', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              {drawerOpen && <ListItemText primary={item.text} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Menú de administración (solo para admins) */}
      {user?.is_admin && (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 1 }}>
            {drawerOpen && (
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                ADMINISTRACIÓN
              </Typography>
            )}
          </Box>
          <List>
            {adminMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={isActiveRoute(item.path)}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActiveRoute(item.path) ? 'primary.main' : 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  {drawerOpen && <ListItemText primary={item.text} />}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* PKT Manager Version */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          PKT Manager 1.0
        </Typography>
      </Box>

      <Divider />

      {/* Información del usuario */}
      <Box sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            {drawerOpen && (
              <>
                <Typography variant="body2" fontWeight="bold">
                  {getUserDisplayName(user)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getUserFullName(user)}
                </Typography>
              </>
            )}
          </Box>
        </Box>
        
        {drawerOpen && user?.is_admin && (
          <Chip
            label="Administrador"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mb: 1 }}
          />
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar con estilo de póker */}
      <AppBar position="fixed" sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2,
              '&:hover': {
                background: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <DiamondIcon sx={{ 
              fontSize: 32, 
              color: '#ffd700', 
              mr: 1,
              filter: 'drop-shadow(0 2px 4px rgba(255,215,0,0.6)) drop-shadow(0 4px 8px rgba(255,215,0,0.3))',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1) rotate(5deg)',
                filter: 'drop-shadow(0 4px 8px rgba(255,215,0,0.8)) drop-shadow(0 8px 16px rgba(255,215,0,0.4))',
              }
            }} />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ffffff 0%, #ffa502 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Tournament Manager
            </Typography>
          </Box>

          {/* Menú de usuario */}
          <Box display="flex" alignItems="center" gap={2}>
            {user?.is_admin && (
              <Chip 
                label="Admin" 
                size="small" 
                color="secondary" 
                variant="outlined"
                sx={{
                  borderColor: '#ffa502',
                  color: '#ffffff',
                  backgroundColor: '#ffa502',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  '&:hover': {
                    background: '#ff8c00',
                    borderColor: '#ff8c00',
                  },
                }}
              />
            )}
            
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              sx={{
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              {user?.avatar_url ? (
                <Avatar 
                  src={user.avatar_url} 
                  alt={getUserDisplayName(user)}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    border: '2px solid rgba(255,255,255,0.2)',
                    '&:hover': {
                      border: '2px solid rgba(255,255,255,0.4)',
                    }
                  }}
                />
              ) : (
                <AccountCircle />
              )}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: 250 }, flexShrink: { md: 0 } }}
      >
        {/* Drawer móvil */}
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Mejor rendimiento en móviles
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
          }}
        >
          {drawer}
        </Drawer>

        {/* Drawer desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerOpen ? drawerWidthOpen : drawerWidthClosed, overflowX: 'hidden' },
          }}
          open={drawerOpen}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isMobile ? 2 : 3,
          width: { md: `calc(100% - ${drawerOpen ? drawerWidthOpen : drawerWidthClosed}px)` },
          mt: '64px', // Altura del AppBar
          mb: isMobile ? '80px' : 0, // Espacio para bottom navigation siempre visible en móvil
        }}
      >
        {children}
      </Box>

      {/* Navegación inferior móvil */}
      <MobileBottomNavigation />

      {/* Menú de usuario */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => {
          handleUserMenuClose();
          navigate('/profile');
        }}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Mi Perfil
        </MenuItem>
        <MenuItem onClick={handleUserMenuClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Configuración
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Cerrar Sesión
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout; 