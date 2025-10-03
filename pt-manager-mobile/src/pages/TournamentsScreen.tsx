import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useTournamentStore } from '../store/tournamentStore';
import { Tournament } from '../types';

const TournamentsScreen: React.FC = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const { tournaments, loading, loadTournaments } = useTournamentStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'scheduled' | 'finished'>('all');

  useEffect(() => {
    loadTournaments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || tournament.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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

  const handleTournamentPress = (tournament: Tournament) => {
    if (user?.is_admin) {
      navigation.navigate('TournamentManagement', { tournamentId: tournament.id });
    } else {
      navigation.navigate('TournamentView', { tournamentId: tournament.id });
    }
  };

  const handleCreateTournament = () => {
    if (!user?.is_admin) {
      Alert.alert('Acceso denegado', 'Solo los administradores pueden crear torneos');
      return;
    }
    navigation.navigate('CreateTournament');
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
        {/* Header con búsqueda */}
        <View style={styles.header}>
          <Text style={styles.title}>Torneos</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#b0b0b0" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar torneos..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'Todos' },
              { key: 'active', label: 'Activos' },
              { key: 'scheduled', label: 'Programados' },
              { key: 'finished', label: 'Finalizados' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  filterStatus === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setFilterStatus(filter.key as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterStatus === filter.key && styles.filterButtonTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Botón crear torneo para admins */}
        {user?.is_admin && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateTournament}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
            <Text style={styles.createButtonText}>Crear Torneo</Text>
          </TouchableOpacity>
        )}

        {/* Lista de torneos */}
        <View style={styles.tournamentsList}>
          {filteredTournaments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color="#666" />
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No se encontraron torneos' : 'No hay torneos disponibles'}
              </Text>
            </View>
          ) : (
            filteredTournaments.map((tournament) => (
              <TouchableOpacity
                key={tournament.id}
                style={styles.tournamentCard}
                onPress={() => handleTournamentPress(tournament)}
              >
                <View style={styles.tournamentHeader}>
                  <Text style={styles.tournamentName}>{tournament.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(tournament.status)}</Text>
                  </View>
                </View>
                
                {tournament.description && (
                  <Text style={styles.tournamentDescription}>{tournament.description}</Text>
                )}
                
                <Text style={styles.tournamentDate}>
                  {formatDate(tournament.start_date)}
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
                  <View style={styles.stat}>
                    <Ionicons name="refresh" size={16} color="#b0b0b0" />
                    <Text style={styles.statText}>{tournament.rebuy_limit} rebuys</Text>
                  </View>
                </View>

                <View style={styles.tournamentFooter}>
                  <Text style={styles.tournamentFooterText}>
                    {tournament.structure?.length || 0} niveles
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#b0b0b0" />
                </View>
              </TouchableOpacity>
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
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#ffffff',
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#ff4757',
    borderColor: '#ff4757',
  },
  filterButtonText: {
    color: '#b0b0b0',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4757',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tournamentsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  tournamentDescription: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  tournamentDate: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 12,
  },
  tournamentStats: {
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
  tournamentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  tournamentFooterText: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default TournamentsScreen;
