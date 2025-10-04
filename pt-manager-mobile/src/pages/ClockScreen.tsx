import React, { useEffect, useState, useRef } from 'react';
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
import TournamentClock from '../components/TournamentClock';
import { Tournament } from '../types';

const ClockScreen: React.FC = ({ route, navigation }: any) => {
  const { tournamentId } = route.params || {};
  const { user } = useAuthStore();
  const { 
    tournaments,
    currentTournament, 
    clock, 
    loading, 
    tournamentStats,
    tournamentStatsLoading,
    loadTournaments,
    loadTournament, 
    loadPlayers,
    loadClock,
    loadTournamentStats,
    startClock,
    pauseClock,
    resumeClock
  } = useTournamentStore();
  const [refreshing, setRefreshing] = useState(false);
  const statsRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Función para refrescar solo las estadísticas
  const refreshStats = async () => {
    if (tournamentId) {
      try {
        await loadPlayers(tournamentId);
        await loadTournamentStats(tournamentId);
        console.log('📊 Estadísticas del torneo actualizadas automáticamente');
      } catch (error) {
        console.log('❌ Error actualizando estadísticas automáticamente:', error);
      }
    }
  };

  useEffect(() => {
    if (tournamentId) {
      const loadData = async () => {
        await loadTournament(tournamentId);
        await loadPlayers(tournamentId); // Cargar jugadores primero
        await loadClock(tournamentId);
        await loadTournamentStats(tournamentId); // Luego las estadísticas
      };
      loadData();
    } else {
      // Si no hay tournamentId, cargar todos los torneos
      loadTournaments();
    }
  }, [tournamentId]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (tournamentId) {
      await loadTournament(tournamentId);
      await loadPlayers(tournamentId); // Cargar jugadores primero
      await loadClock(tournamentId);
      await loadTournamentStats(tournamentId); // Luego las estadísticas
    } else {
      await loadTournaments();
    }
    setRefreshing(false);
  };

  // useEffect para manejar el refresco automático de estadísticas cada 2 minutos
  useEffect(() => {
    if (tournamentId) {
      // Configurar el intervalo de refresco cada 2 minutos (120,000 ms)
      statsRefreshInterval.current = setInterval(() => {
        refreshStats();
      }, 120000); // 2 minutos

      // Limpiar el intervalo cuando el componente se desmonte o cambie el tournamentId
      return () => {
        if (statsRefreshInterval.current) {
          clearInterval(statsRefreshInterval.current);
          statsRefreshInterval.current = null;
        }
      };
    }
  }, [tournamentId]);

  // Si hay un torneo específico, mostrar su reloj
  if (tournamentId && currentTournament) {
    return (
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Reloj del Torneo</Text>
            <Text style={styles.tournamentName}>{currentTournament.name}</Text>
          </View>

          <TournamentClock 
            tournamentId={tournamentId}
            clock={clock}
            tournament={currentTournament}
            onStartClock={() => startClock(tournamentId)}
            onPauseClock={() => pauseClock(tournamentId)}
            onResumeClock={() => resumeClock(tournamentId)}
            isAdmin={user?.is_admin || false}
            onLevelChange={() => {
              // Recargar el reloj cuando cambie el nivel o se ajuste el tiempo
              loadClock(tournamentId);
            }}
            tournamentStats={tournamentStats}
            tournamentStatsLoading={tournamentStatsLoading}
          />
        </ScrollView>
      </LinearGradient>
    );
  }

  // Si no hay torneo específico, mostrar lista de torneos
  const activeTournaments = tournaments.filter(t => t.status === 'active');
  const scheduledTournaments = tournaments.filter(t => t.status === 'scheduled');

  const handleTournamentPress = (tournament: Tournament) => {
    if (user?.is_admin) {
      navigation.navigate('TournamentManagement', { tournamentId: tournament.id });
    } else {
      navigation.navigate('TournamentView', { tournamentId: tournament.id });
    }
  };

  const handleStartTournament = (tournament: Tournament) => {
    if (!user?.is_admin) {
      Alert.alert('Acceso denegado', 'Solo los administradores pueden iniciar torneos');
      return;
    }
    Alert.alert('Próximamente', 'La funcionalidad de iniciar torneos estará disponible');
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
          <Text style={styles.title}>Reloj del Torneo</Text>
          <Text style={styles.subtitle}>
            Controla el tiempo de tus torneos
          </Text>
        </View>

        {/* Torneos activos con reloj */}
        {activeTournaments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Torneos Activos</Text>
            {activeTournaments.map((tournament) => (
              <View key={tournament.id} style={styles.tournamentContainer}>
                <View style={styles.tournamentHeader}>
                  <Text style={styles.tournamentName}>{tournament.name}</Text>
                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => handleTournamentPress(tournament)}
                  >
                    <Ionicons name="settings" size={20} color="#ff4757" />
                    <Text style={styles.manageButtonText}>Gestionar</Text>
                  </TouchableOpacity>
                </View>
                
                <TournamentClock
                  tournamentId={tournament.id}
                  tournament={tournament}
                  isAdmin={user?.is_admin}
                  onLevelChange={() => {
                    // Recargar datos del torneo cuando cambie el nivel
                    loadTournaments();
                    loadPlayers(tournament.id);
                    loadTournamentStats(tournament.id);
                  }}
                  tournamentStats={tournamentStats}
                  tournamentStatsLoading={tournamentStatsLoading}
                />
              </View>
            ))}
          </View>
        )}

        {/* Torneos programados */}
        {scheduledTournaments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Torneos Programados</Text>
            {scheduledTournaments.map((tournament) => (
              <TouchableOpacity
                key={tournament.id}
                style={styles.scheduledTournamentCard}
                onPress={() => handleTournamentPress(tournament)}
              >
                <View style={styles.scheduledTournamentHeader}>
                  <Text style={styles.scheduledTournamentName}>{tournament.name}</Text>
                  <View style={styles.scheduledBadge}>
                    <Text style={styles.scheduledBadgeText}>Programado</Text>
                  </View>
                </View>
                
                <Text style={styles.scheduledTournamentDate}>
                  {new Date(tournament.start_date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                
                <View style={styles.scheduledTournamentStats}>
                  <View style={styles.stat}>
                    <Ionicons name="diamond" size={16} color="#b0b0b0" />
                    <Text style={styles.statText}>{tournament.initial_chips} fichas</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="cash" size={16} color="#b0b0b0" />
                    <Text style={styles.statText}>${tournament.buy_in}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="timer" size={16} color="#b0b0b0" />
                    <Text style={styles.statText}>{tournament.structure.length} niveles</Text>
                  </View>
                </View>

                {user?.is_admin && (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartTournament(tournament)}
                  >
                    <Ionicons name="play" size={20} color="#ffffff" />
                    <Text style={styles.startButtonText}>Iniciar Torneo</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Estado vacío */}
        {activeTournaments.length === 0 && scheduledTournaments.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="timer-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>No hay torneos activos</Text>
            <Text style={styles.emptyStateText}>
              Los torneos activos aparecerán aquí con su reloj correspondiente
            </Text>
            <TouchableOpacity
              style={styles.createTournamentButton}
              onPress={() => navigation.navigate('Tournaments')}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.createTournamentButtonText}>Ver Torneos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Información adicional */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Información del Reloj</Text>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={16} color="#ff4757" />
            <Text style={styles.infoText}>
              El reloj se actualiza automáticamente cada segundo
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people" size={16} color="#ff4757" />
            <Text style={styles.infoText}>
              Todos los participantes ven el mismo reloj en tiempo real
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={16} color="#ff4757" />
            <Text style={styles.infoText}>
              Solo los administradores pueden controlar el reloj
            </Text>
          </View>
        </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b0b0',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  tournamentContainer: {
    marginBottom: 20,
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tournamentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4757',
  },
  manageButtonText: {
    color: '#ff4757',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  scheduledTournamentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  scheduledTournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduledTournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  scheduledBadge: {
    backgroundColor: '#ffa502',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scheduledBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scheduledTournamentDate: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 12,
  },
  scheduledTournamentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2ed573',
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createTournamentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4757',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createTournamentButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#b0b0b0',
    marginLeft: 8,
    flex: 1,
  },
});

export default ClockScreen;
