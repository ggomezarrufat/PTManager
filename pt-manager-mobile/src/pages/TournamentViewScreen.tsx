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
import TournamentClock from '../components/TournamentClock';
import { Tournament } from '../types';

const TournamentViewScreen: React.FC = ({ route, navigation }: any) => {
  const { tournamentId } = route.params;
  const { user } = useAuthStore();
  const { 
    currentTournament, 
    players, 
    clock, 
    loading, 
    loadTournament, 
    loadPlayers, 
    loadClock 
  } = useTournamentStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      loadTournament(tournamentId);
      loadPlayers(tournamentId);
      loadClock(tournamentId);
    }
  }, [tournamentId]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (tournamentId) {
      await Promise.all([
        loadTournament(tournamentId),
        loadPlayers(tournamentId),
        loadClock(tournamentId),
      ]);
    }
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const activePlayers = players.filter(p => !p.is_eliminated);
  const eliminatedPlayers = players.filter(p => p.is_eliminated);

  if (loading && !currentTournament) {
    return (
      <LinearGradient colors={['#0c0c0c', '#1a1a1a']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando torneo...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!currentTournament) {
    return (
      <LinearGradient colors={['#0c0c0c', '#1a1a1a']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ff4757" />
          <Text style={styles.errorTitle}>Torneo no encontrado</Text>
          <Text style={styles.errorText}>
            El torneo que buscas no existe o no tienes acceso a él
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

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
        {/* Header del torneo */}
        <View style={styles.header}>
          <View style={styles.tournamentInfo}>
            <Text style={styles.tournamentName}>{currentTournament.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentTournament.status) }]}>
              <Text style={styles.statusText}>{getStatusText(currentTournament.status)}</Text>
            </View>
          </View>
          
          {currentTournament.description && (
            <Text style={styles.tournamentDescription}>{currentTournament.description}</Text>
          )}
          
          <Text style={styles.tournamentDate}>
            {formatDate(currentTournament.start_date)}
          </Text>
        </View>

        {/* Reloj del torneo */}
        {currentTournament.status === 'active' && (
          <View style={styles.clockSection}>
            <TournamentClock
              tournamentId={tournamentId}
              clock={clock}
              tournament={currentTournament}
              isAdmin={user?.is_admin}
              onLevelChange={onRefresh}
            />
          </View>
        )}

        {/* Botón Gestionar Torneo (solo administradores) */}
        {user?.is_admin && (
          <View style={styles.manageTournamentSection}>
            <TouchableOpacity
              style={styles.manageTournamentButton}
              onPress={() => navigation.navigate('TournamentManagement', { tournamentId })}
            >
              <Ionicons name="settings" size={20} color="#ffffff" />
              <Text style={styles.manageTournamentButtonText}>Gestionar Torneo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Estadísticas del torneo */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#ff4757" />
              <Text style={styles.statNumber}>{activePlayers.length}</Text>
              <Text style={styles.statLabel}>Jugadores Activos</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="person-remove" size={24} color="#b0b0b0" />
              <Text style={styles.statNumber}>{eliminatedPlayers.length}</Text>
              <Text style={styles.statLabel}>Eliminados</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="diamond" size={24} color="#ffa502" />
              <Text style={styles.statNumber}>{currentTournament.initial_chips}</Text>
              <Text style={styles.statLabel}>Fichas Iniciales</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash" size={24} color="#2ed573" />
              <Text style={styles.statNumber}>${currentTournament.buy_in}</Text>
              <Text style={styles.statLabel}>Buy-in</Text>
            </View>
          </View>
        </View>

        {/* Lista de jugadores activos */}
        {activePlayers.length > 0 && (
          <View style={styles.playersSection}>
            <Text style={styles.sectionTitle}>Jugadores Activos</Text>
            {activePlayers.map((player, index) => (
              <View key={player.id} style={styles.playerCard}>
                <View style={styles.playerInfo}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerInitial}>
                      {(player.user?.nickname || player.user?.full_name || player.user?.email || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.playerDetails}>
                    <Text style={styles.playerName}>
                      {player.user?.nickname || player.user?.full_name || player.user?.email || 'Jugador'}
                    </Text>
                    <Text style={styles.playerChips}>{player.chips} fichas</Text>
                  </View>
                </View>
                <View style={styles.playerStats}>
                  <Text style={styles.playerStat}>
                    {player.rebuys} rebuys
                  </Text>
                  <Text style={styles.playerStat}>
                    {player.addons} addons
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Lista de jugadores eliminados */}
        {eliminatedPlayers.length > 0 && (
          <View style={styles.playersSection}>
            <Text style={styles.sectionTitle}>Jugadores Eliminados</Text>
            {eliminatedPlayers
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map((player) => (
                <View key={player.id} style={[styles.playerCard, styles.eliminatedPlayerCard]}>
                  <View style={styles.playerInfo}>
                    <View style={[styles.playerAvatar, styles.eliminatedAvatar]}>
                      <Text style={styles.playerInitial}>
                        {(player.user?.nickname || player.user?.full_name || player.user?.email || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.playerDetails}>
                      <Text style={[styles.playerName, styles.eliminatedPlayerName]}>
                        {player.user?.nickname || player.user?.full_name || player.user?.email || 'Jugador'}
                      </Text>
                      <Text style={styles.playerPosition}>
                        Posición #{player.position}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.playerStats}>
                    <Text style={styles.playerStat}>
                      {player.rebuys} rebuys
                    </Text>
                    <Text style={styles.playerStat}>
                      {player.addons} addons
                    </Text>
                  </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#b0b0b0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  tournamentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tournamentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tournamentDescription: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  tournamentDate: {
    fontSize: 14,
    color: '#b0b0b0',
  },
  clockSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsSection: {
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
  manageTournamentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  manageTournamentButton: {
    backgroundColor: '#ff4757',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  manageTournamentButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  playersSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  playerCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  eliminatedPlayerCard: {
    opacity: 0.6,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff4757',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eliminatedAvatar: {
    backgroundColor: '#666',
  },
  playerInitial: {
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
    marginBottom: 4,
  },
  eliminatedPlayerName: {
    color: '#b0b0b0',
  },
  playerChips: {
    fontSize: 14,
    color: '#b0b0b0',
  },
  playerPosition: {
    fontSize: 14,
    color: '#ff4757',
    fontWeight: 'bold',
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerStat: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4757',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TournamentViewScreen;
