import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useTournamentStore } from '../store/tournamentStore';
import { Tournament } from '../types';
import LeaderboardTable from '../components/LeaderboardTable';

const DashboardScreen: React.FC = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const { 
    tournaments, 
    loading, 
    loadTournaments,
    leaderboard,
    leaderboardLoading,
    leaderboardError,
    loadLeaderboard
  } = useTournamentStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTournaments();
    loadLeaderboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTournaments(), loadLeaderboard()]);
    setRefreshing(false);
  };

  const activeTournaments = tournaments.filter(t => t.status === 'active');
  const scheduledTournaments = tournaments.filter(t => t.status === 'scheduled');
  const finishedTournaments = tournaments.filter(t => t.status === 'finished');

  const getUserDisplayName = (user: any) => {
    return user?.nickname || user?.full_name || user?.email || 'Usuario';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#2ed573';
      case 'scheduled': return '#ffa502';
      case 'paused': return '#ffa502';
      case 'finished': return '#b0b0b0';
      default: return '#b0b0b0';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'En curso';
      case 'scheduled': return 'Programado';
      case 'paused': return 'Pausado';
      case 'finished': return 'Finalizado';
      default: return status;
    }
  };

  return (
    <LinearGradient
      colors={['#0c0c0c', '#1a1a1a']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ff4757"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            ¡Hola, {getUserDisplayName(user)}!
          </Text>
          <Text style={styles.subtitle}>
            Gestiona tus torneos de póker
          </Text>
        </View>

        {/* Torneos activos */}
        {activeTournaments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Torneos Activos</Text>
            {activeTournaments.map((tournament) => (
              <TouchableOpacity
                key={tournament.id}
                style={styles.tournamentCard}
                onPress={() => navigation.navigate('Clock', { tournamentId: tournament.id })}
              >
                <View style={styles.tournamentHeader}>
                  <Text style={styles.tournamentName}>{tournament.name}</Text>
                  <View style={styles.headerRight}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(tournament.status)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#b0b0b0" style={styles.chevronIcon} />
                  </View>
                </View>
                <Text style={styles.tournamentDate}>
                  {formatDate(tournament.scheduled_start_time)}
                </Text>
                <View style={styles.tournamentStats}>
                  <View style={styles.stat}>
                    <Ionicons name="people" size={16} color="#b0b0b0" />
                    <Text style={styles.statText}>Jugadores</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="diamond" size={16} color="#b0b0b0" />
                    <Text style={styles.statText}>{tournament.initial_chips} fichas</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="cash" size={16} color="#b0b0b0" />
                    <Text style={styles.statText}>${tournament.buy_in}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Torneos programados */}
        {scheduledTournaments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximos Torneos</Text>
            {scheduledTournaments.map((tournament) => (
              <TouchableOpacity
                key={tournament.id}
                style={styles.tournamentCard}
                onPress={() => navigation.navigate('TournamentView', { tournamentId: tournament.id })}
              >
                <View style={styles.tournamentHeader}>
                  <Text style={styles.tournamentName}>{tournament.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(tournament.status)}</Text>
                  </View>
                </View>
                <Text style={styles.tournamentDate}>
                  {formatDate(tournament.scheduled_start_time)}
                </Text>
                <View style={styles.tournamentStats}>
                  <View style={styles.stat}>
                    <Ionicons name="diamond" size={16} color="#b0b0b0" />
                    <Text style={styles.statText}>{tournament.initial_chips} fichas</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="cash" size={16} color="#b0b0b0" />
                    <Text style={styles.statText}>${tournament.buy_in}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tabla de Posiciones */}
        <View style={styles.section}>
          <LeaderboardTable
            leaderboard={leaderboard}
            loading={leaderboardLoading}
            error={leaderboardError}
          />
        </View>

        {/* Acciones rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Tournaments')}
            >
              <Ionicons name="add-circle" size={24} color="#ff4757" />
              <Text style={styles.quickActionText}>Nuevo Torneo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Clock')}
            >
              <Ionicons name="timer" size={24} color="#ff4757" />
              <Text style={styles.quickActionText}>Reloj</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Reports')}
            >
              <Ionicons name="bar-chart" size={24} color="#ff4757" />
              <Text style={styles.quickActionText}>Reportes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estadísticas recientes */}
        {finishedTournaments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Torneos Recientes</Text>
            {finishedTournaments.slice(0, 3).map((tournament) => (
              <View key={tournament.id} style={styles.tournamentCard}>
                <View style={styles.tournamentHeader}>
                  <Text style={styles.tournamentName}>{tournament.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(tournament.status)}</Text>
                  </View>
                </View>
                <Text style={styles.tournamentDate}>
                  {formatDate(tournament.end_time || tournament.scheduled_start_time)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b0b0',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  tournamentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tournamentDate: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 12,
  },
  tournamentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#b0b0b0',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 80,
  },
  quickActionText: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DashboardScreen;
