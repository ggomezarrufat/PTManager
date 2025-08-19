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
  Dashboard,
  Casino,
  Assessment,
  AccountCircle,
  Logout,
  Settings,
  AdminPanelSettings,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  EmojiEvents as TrophyIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getUserDisplayName, getUserFullName } from '../../utils/userUtils';

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
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Crear Torneo', icon: <AddIcon />, path: '/tournament/new' },
    { text: 'Temporadas', icon: <CalendarIcon />, path: '/seasons', adminOnly: true },
    { text: 'Usuarios', icon: <PeopleIcon />, path: '/users', adminOnly: true },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Perfil', icon: <SettingsIcon />, path: '/profile' },
  ];

  // Elementos del menú solo para administradores
  const adminMenuItems = [
    {
      text: 'Administrar Usuarios',
      icon: <AdminPanelSettings />,
      path: '/admin/users'
    }
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
        <Casino sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
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
        
        {drawerOpen && (
          <Typography variant="caption" color="text.secondary">
            Puntos: {user?.total_points || 0}
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Poker Tournament Manager
          </Typography>

          {/* Menú de usuario */}
          <Box display="flex" alignItems="center" gap={2}>
            {user?.is_admin && (
              <Chip 
                label="Admin" 
                size="small" 
                color="secondary" 
                variant="outlined"
              />
            )}
            
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
            >
              <AccountCircle />
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
          p: 3,
          width: { md: `calc(100% - ${drawerOpen ? drawerWidthOpen : drawerWidthClosed}px)` },
          mt: '64px', // Altura del AppBar
        }}
      >
        {children}
      </Box>

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