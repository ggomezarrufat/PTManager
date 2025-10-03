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
import PlayerSelectionModal from '../components/PlayerSelectionModal';

const PlayerManagementScreen: React.FC = ({ route, navigation }: any) => {
  const { tournamentId } = route.params;
  const { user } = useAuthStore();
  const { 
    currentTournament, 
    players, 
    loading, 
    loadTournament, 
    loadPlayers,
    addPlayer,
    removePlayer,
    updatePlayerChips,
    eliminatePlayer
  } = useTournamentStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlayerSelectionModal, setShowPlayerSelectionModal] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      loadTournament(tournamentId);
      loadPlayers(tournamentId);
    }
  }, [tournamentId]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (tournamentId) {
      await Promise.all([
        loadTournament(tournamentId),
        loadPlayers(tournamentId),
      ]);
    }
    setRefreshing(false);
  };

  const handleAddPlayer = () => {
    setShowPlayerSelectionModal(true);
  };

  const handleSelectPlayer = async (selectedUser: any) => {
    try {
      console.log('🎯 Seleccionando jugador:', selectedUser);
      console.log('🏆 Torneo ID:', tournamentId);
      
      await addPlayer(tournamentId, selectedUser.id);
      
      console.log('✅ Jugador agregado, recargando lista...');
      // Recargar la lista de jugadores después de agregar
      await loadPlayers(tournamentId);
      
      // No mostrar mensaje de éxito, solo cerrar el modal
    } catch (error) {
      console.log('❌ Error agregando jugador:', error);
      Alert.alert('Error', 'No se pudo agregar el jugador');
    }
  };

  const handleRemovePlayer = (playerId: string, playerName: string) => {
    Alert.alert(
      'Eliminar Jugador',
      `¿Estás seguro de que quieres eliminar a ${playerName} del torneo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removePlayer(playerId);
              Alert.alert('Éxito', 'Jugador eliminado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el jugador');
            }
          }
        },
      ]
    );
  };

  const handleEliminatePlayer = (playerId: string, playerName: string) => {
    Alert.prompt(
      'Eliminar Jugador',
      `Ingresa la posición final de ${playerName}:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: (position) => {
            const pos = parseInt(position || '0');
            if (pos > 0) {
              eliminatePlayer(playerId, pos);
            } else {
              Alert.alert('Error', 'Por favor ingresa una posición válida');
            }
          },
        },
      ],
      'plain-text',
      '1'
    );
  };

  const handleAdjustChips = (playerId: string, playerName: string, currentChips: number) => {
    Alert.prompt(
      'Ajustar Fichas',
      `Ingresa las nuevas fichas para ${playerName}:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ajustar',
          onPress: (chips) => {
            const newChips = parseInt(chips || '0');
            if (newChips >= 0) {
              updatePlayerChips(playerId, newChips);
            } else {
              Alert.alert('Error', 'Por favor ingresa un número válido de fichas');
            }
          },
        },
      ],
      'plain-text',
      currentChips.toString()
    );
  };

  const filteredPlayers = players.filter(player => {
    const playerName = player.user?.nickname || player.user?.full_name || player.user?.email || 'Jugador';
    return playerName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activePlayers = filteredPlayers.filter(p => !p.is_eliminated);
  const eliminatedPlayers = filteredPlayers.filter(p => p.is_eliminated);

  if (loading && !currentTournament) {
    return (
      <LinearGradient colors={['#0c0c0c', '#1a1a1a']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando jugadores...</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gestionar Jugadores</Text>
          <Text style={styles.subtitle}>{currentTournament.name}</Text>
        </View>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#b0b0b0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar jugadores..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Botón agregar jugador */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPlayer}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Agregar Jugador</Text>
        </TouchableOpacity>

        {/* Jugadores activos */}
        {activePlayers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Jugadores Activos ({activePlayers.length})
            </Text>
            {activePlayers.map((player) => {
              const playerName = player.user?.nickname || player.user?.full_name || player.user?.email || 'Jugador';
              return (
                <View key={player.id} style={styles.playerCard}>
                  <View style={styles.playerInfo}>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerInitial}>
                        {playerName[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.playerDetails}>
                      <Text style={styles.playerName}>{playerName}</Text>
                        <Text style={styles.playerChips}>{player.current_chips} fichas</Text>
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
                  <View style={styles.playerActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleAdjustChips(player.id, playerName, player.current_chips)}
                    >
                      <Ionicons name="create" size={16} color="#ffa502" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEliminatePlayer(player.id, playerName)}
                    >
                      <Ionicons name="person-remove" size={16} color="#ff4757" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleRemovePlayer(player.id, playerName)}
                    >
                      <Ionicons name="trash" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Jugadores eliminados */}
        {eliminatedPlayers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Jugadores Eliminados ({eliminatedPlayers.length})
            </Text>
            {eliminatedPlayers
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map((player) => {
                const playerName = player.user?.nickname || player.user?.full_name || player.user?.email || 'Jugador';
                return (
                  <View key={player.id} style={[styles.playerCard, styles.eliminatedPlayerCard]}>
                    <View style={styles.playerInfo}>
                      <View style={[styles.playerAvatar, styles.eliminatedAvatar]}>
                        <Text style={styles.playerInitial}>
                          {playerName[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.playerDetails}>
                        <Text style={[styles.playerName, styles.eliminatedPlayerName]}>
                          {playerName}
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
                    <View style={styles.playerActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleRemovePlayer(player.id, playerName)}
                      >
                        <Ionicons name="trash" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {/* Estado vacío */}
        {filteredPlayers.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No se encontraron jugadores' : 'No hay jugadores registrados'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'Intenta con otro término de búsqueda'
                : 'Agrega jugadores para comenzar el torneo'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de selección de jugadores */}
      <PlayerSelectionModal
        visible={showPlayerSelectionModal}
        onClose={() => setShowPlayerSelectionModal(false)}
        onSelectPlayer={handleSelectPlayer}
        tournamentId={tournamentId}
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 16,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2ed573',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addPlayerForm: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0c0c0c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelButtonText: {
    color: '#b0b0b0',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#2ed573',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
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
    marginBottom: 8,
  },
  playerStat: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  playerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: '#0c0c0c',
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
  },
});

export default PlayerManagementScreen;
