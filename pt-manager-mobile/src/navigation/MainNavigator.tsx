import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, RootStackParamList } from '../types';
import DashboardScreen from '../pages/DashboardScreen';
import TournamentsScreen from '../pages/TournamentsScreen';
import ClockScreen from '../pages/ClockScreen';
import ReportsScreen from '../pages/ReportsScreen';
import ProfileScreen from '../pages/ProfileScreen';
import TournamentViewScreen from '../pages/TournamentViewScreen';
import TournamentManagementScreen from '../pages/TournamentManagementScreen';
import PlayerManagementScreen from '../pages/PlayerManagementScreen';
import CreateTournamentScreen from '../pages/CreateTournamentScreen';
import PlayerDetailScreen from '../pages/PlayerDetailScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tournaments') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Clock') {
            iconName = focused ? 'timer' : 'timer-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff4757',
        tabBarInactiveTintColor: '#b0b0b0',
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#0c0c0c',
          borderBottomColor: '#333',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="Tournaments" 
        component={TournamentsScreen}
        options={{ title: 'Torneos' }}
      />
      <Tab.Screen 
        name="Clock" 
        component={ClockScreen}
        options={{ title: 'Reloj' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Reportes' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0c0c0c',
          borderBottomColor: '#333',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: { backgroundColor: '#0c0c0c' }
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TournamentView" 
        component={TournamentViewScreen}
        options={{ title: 'Torneo' }}
      />
      <Stack.Screen 
        name="TournamentManagement" 
        component={TournamentManagementScreen}
        options={{ title: 'Gestionar Torneo' }}
      />
      <Stack.Screen 
        name="PlayerManagement" 
        component={PlayerManagementScreen}
        options={{ title: 'Gestionar Jugadores' }}
      />
      <Stack.Screen 
        name="CreateTournament" 
        component={CreateTournamentScreen}
        options={{ title: 'Crear Torneo' }}
      />
      <Stack.Screen 
        name="PlayerDetail" 
        component={PlayerDetailScreen}
        options={{ title: 'Detalle del Jugador' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
