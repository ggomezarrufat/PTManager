import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useTournamentStore } from '../store/tournamentStore';

const ReportsScreen: React.FC = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const { 
    tournaments, 
    leaderboard, 
    leaderboardLoading, 
    leaderboardError,
    loading, 
    loadTournaments,
    loadLeaderboard 
  } = useTournamentStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTournaments();
    loadLeaderboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadTournaments(),
      loadLeaderboard()
    ]);
    setRefreshing(false);
  };

  const handlePlayerPress = (player: any) => {
    navigation.navigate('PlayerDetail', { player });
  };

  const finishedTournaments = tournaments.filter(t => t.status === 'finished');
  const activeTournaments = tournaments.filter(t => t.status === 'active');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleFinancialReport = () => {
    Alert.alert('Próximamente', 'Los reportes financieros estarán disponibles');
  };

  const handlePlayerRankings = () => {
    Alert.alert('Próximamente', 'Los rankings de jugadores estarán disponibles');
  };

  const handleTournamentHistory = () => {
    Alert.alert('Próximamente', 'El historial de torneos estará disponible');
  };

  const handleExportData = () => {
    Alert.alert('Próximamente', 'La exportación de datos estará disponible');
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
          <Text style={styles.title}>Reportes</Text>
          <Text style={styles.subtitle}>
            Análisis y estadísticas de tus torneos
          </Text>
        </View>

        {/* Estadísticas generales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color="#ffa502" />
              <Text style={styles.statNumber}>{finishedTournaments.length}</Text>
              <Text style={styles.statLabel}>Torneos Finalizados</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="timer" size={24} color="#2ed573" />
              <Text style={styles.statNumber}>{activeTournaments.length}</Text>
              <Text style={styles.statLabel}>Torneos Activos</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#ff4757" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Jugadores Totales</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash" size={24} color="#2ed573" />
              <Text style={styles.statNumber}>$0</Text>
              <Text style={styles.statLabel}>Recaudación Total</Text>
            </View>
          </View>
        </View>

        {/* Tabla de Posiciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tabla de Posiciones</Text>
          
          {leaderboardLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ff4757" />
              <Text style={styles.loadingText}>Cargando tabla de posiciones...</Text>
            </View>
          ) : leaderboardError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ff4757" />
              <Text style={styles.errorText}>{leaderboardError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadLeaderboard}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : leaderboard.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No hay datos de posiciones disponibles</Text>
            </View>
          ) : (
            <View style={styles.leaderboardContainer}>
              {leaderboard.slice(0, 10).map((player, index) => (
                <TouchableOpacity
                  key={player.user_id}
                  style={[
                    styles.leaderboardItem,
                    index < 3 && styles.topThreeItem
                  ]}
                  onPress={() => handlePlayerPress(player)}
                >
                  <View style={styles.rankContainer}>
                    <Text style={[
                      styles.rankText,
                      index === 0 && styles.firstPlace,
                      index === 1 && styles.secondPlace,
                      index === 2 && styles.thirdPlace
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  
                  <View style={styles.playerInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {player.name?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.playerDetails}>
                      <Text style={styles.playerName}>
                        {player.nickname || player.name || 'Sin nombre'}
                      </Text>
                      <Text style={styles.playerEmail}>
                        {player.email || 'Sin email'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.pointsContainer}>
                    <Text style={styles.pointsText}>{player.total_points}</Text>
                    <Text style={styles.pointsLabel}>puntos</Text>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Reportes disponibles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reportes Disponibles</Text>
          
          <TouchableOpacity
            style={styles.reportCard}
            onPress={handleFinancialReport}
          >
            <View style={styles.reportIcon}>
              <Ionicons name="cash" size={24} color="#2ed573" />
            </View>
            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>Reporte Financiero</Text>
              <Text style={styles.reportDescription}>
                Ingresos, gastos y ganancias por torneo
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#b0b0b0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportCard}
            onPress={handlePlayerRankings}
          >
            <View style={styles.reportIcon}>
              <Ionicons name="trophy" size={24} color="#ffa502" />
            </View>
            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>Rankings de Jugadores</Text>
              <Text style={styles.reportDescription}>
                Clasificación por puntos y rendimiento
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#b0b0b0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportCard}
            onPress={handleTournamentHistory}
          >
            <View style={styles.reportIcon}>
              <Ionicons name="time" size={24} color="#ff4757" />
            </View>
            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>Historial de Torneos</Text>
              <Text style={styles.reportDescription}>
                Detalles de todos los torneos realizados
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#b0b0b0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportCard}
            onPress={handleExportData}
          >
            <View style={styles.reportIcon}>
              <Ionicons name="download" size={24} color="#3742fa" />
            </View>
            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>Exportar Datos</Text>
              <Text style={styles.reportDescription}>
                Descargar datos en Excel o PDF
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#b0b0b0" />
          </TouchableOpacity>
        </View>

        {/* Torneos recientes */}
        {finishedTournaments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Torneos Recientes</Text>
            {finishedTournaments.slice(0, 5).map((tournament) => (
              <View key={tournament.id} style={styles.tournamentCard}>
                <View style={styles.tournamentHeader}>
                  <Text style={styles.tournamentName}>{tournament.name}</Text>
                  <Text style={styles.tournamentDate}>
                    {formatDate(tournament.end_date || tournament.start_date)}
                  </Text>
                </View>
                <View style={styles.tournamentStats}>
                  <View style={styles.tournamentStat}>
                    <Ionicons name="cash" size={16} color="#b0b0b0" />
                    <Text style={styles.tournamentStatText}>${tournament.buy_in}</Text>
                  </View>
                  <View style={styles.tournamentStat}>
                    <Ionicons name="diamond" size={16} color="#b0b0b0" />
                    <Text style={styles.tournamentStatText}>{tournament.initial_chips} fichas</Text>
                  </View>
                  <View style={styles.tournamentStat}>
                    <Ionicons name="people" size={16} color="#b0b0b0" />
                    <Text style={styles.tournamentStatText}>0 jugadores</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Información adicional */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Información de Reportes</Text>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={16} color="#ff4757" />
            <Text style={styles.infoText}>
              Los reportes se actualizan en tiempo real
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={16} color="#ff4757" />
            <Text style={styles.infoText}>
              Solo los administradores pueden ver reportes financieros
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="download" size={16} color="#ff4757" />
            <Text style={styles.infoText}>
              Puedes exportar los datos en diferentes formatos
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#b0b0b0',
    textAlign: 'center',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0c0c0c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#b0b0b0',
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
  tournamentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  tournamentDate: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  tournamentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tournamentStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tournamentStatText: {
    fontSize: 12,
    color: '#b0b0b0',
    marginLeft: 4,
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
  // Estilos para tabla de posiciones
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#b0b0b0',
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#ff4757',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    marginTop: 16,
  },
  leaderboardContainer: {
    gap: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  topThreeItem: {
    borderColor: '#ffd700',
    borderWidth: 2,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  firstPlace: {
    color: '#ffd700',
  },
  secondPlace: {
    color: '#c0c0c0',
  },
  thirdPlace: {
    color: '#cd7f32',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  playerEmail: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  pointsContainer: {
    alignItems: 'center',
    marginRight: 8,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#b0b0b0',
  },
});

export default ReportsScreen;
