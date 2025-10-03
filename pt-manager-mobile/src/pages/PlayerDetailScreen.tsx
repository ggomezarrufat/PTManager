import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { reportsService } from '../services/reportsService';

interface PlayerTournament {
  tournament_id: string;
  tournament_name: string;
  final_position: number;
  points_earned: number;
  tournament_date: string;
}

interface PlayerDetailScreenProps {
  route: {
    params: {
      player: {
        user_id: string;
        name: string;
        nickname: string;
        email: string;
        avatar_url?: string | null;
        total_points: number;
        tournaments_played: number;
      };
    };
  };
  navigation: any;
}

const PlayerDetailScreen: React.FC<PlayerDetailScreenProps> = ({ route, navigation }) => {
  const { player } = route.params;
  const [tournaments, setTournaments] = useState<PlayerTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlayerTournaments();
  }, [player.user_id]);

  const loadPlayerTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Cargando torneos del jugador:', player.name);
      
      const response = await reportsService.getPlayerTournaments(player.user_id);
      const sortedTournaments = response.tournaments.sort((a, b) => 
        new Date(a.tournament_date).getTime() - new Date(b.tournament_date).getTime()
      );
      
      setTournaments(sortedTournaments);
      console.log('✅ Torneos cargados:', sortedTournaments.length);
    } catch (err: any) {
      console.log('❌ Error cargando torneos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlayerTournaments();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return '#ffd700'; // Oro
    if (position === 2) return '#c0c0c0'; // Plata
    if (position === 3) return '#cd7f32'; // Bronce
    return '#ffffff';
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return 'trophy';
    if (position === 2) return 'medal';
    if (position === 3) return 'medal';
    return 'person';
  };

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Detalle del Jugador</Text>
        </View>

        {/* Player Info */}
        <View style={styles.playerInfo}>
          <View style={styles.avatarContainer}>
            {player.avatar_url ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {player.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {player.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.playerName}>
            {player.nickname || player.name || 'Sin nombre'}
          </Text>
          <Text style={styles.playerEmail}>{player.email || 'Sin email'}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={20} color="#ffd700" />
              <Text style={styles.statValue}>{player.total_points}</Text>
              <Text style={styles.statLabel}>Puntos Totales</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="game-controller" size={20} color="#ff4757" />
              <Text style={styles.statValue}>{player.tournaments_played}</Text>
              <Text style={styles.statLabel}>Torneos Jugados</Text>
            </View>
          </View>
        </View>

        {/* Tournaments List */}
        <View style={styles.tournamentsSection}>
          <Text style={styles.sectionTitle}>Historial de Torneos</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ff4757" />
              <Text style={styles.loadingText}>Cargando torneos...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ff4757" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadPlayerTournaments}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : tournaments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No hay torneos registrados</Text>
            </View>
          ) : (
            tournaments.map((tournament, index) => (
              <View key={tournament.tournament_id} style={styles.tournamentCard}>
                <View style={styles.tournamentHeader}>
                  <View style={styles.tournamentInfo}>
                    <Text style={styles.tournamentName}>{tournament.tournament_name}</Text>
                    <Text style={styles.tournamentDate}>
                      {formatDate(tournament.tournament_date)}
                    </Text>
                  </View>
                  <View style={styles.positionContainer}>
                    <Ionicons
                      name={getPositionIcon(tournament.final_position)}
                      size={24}
                      color={getPositionColor(tournament.final_position)}
                    />
                    <Text style={[
                      styles.positionText,
                      { color: getPositionColor(tournament.final_position) }
                    ]}>
                      #{tournament.final_position}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.tournamentStats}>
                  <View style={styles.pointsContainer}>
                    <Ionicons name="star" size={16} color="#ffd700" />
                    <Text style={styles.pointsText}>{tournament.points_earned} puntos</Text>
                  </View>
                </View>
              </View>
            ))
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  playerInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  playerEmail: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
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
  tournamentsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  tournamentDate: {
    fontSize: 14,
    color: '#b0b0b0',
  },
  positionContainer: {
    alignItems: 'center',
    marginLeft: 16,
  },
  positionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  tournamentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    color: '#ffd700',
    marginLeft: 4,
    fontWeight: 'bold',
  },
});

export default PlayerDetailScreen;
