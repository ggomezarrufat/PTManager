import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useTournamentStore } from '../store/tournamentStore';
import { Tournament } from '../types';

interface TournamentManagementScreenProps {
  navigation: any;
  route: {
    params: {
      tournamentId: string;
    };
  };
}

const TournamentManagementScreen: React.FC<TournamentManagementScreenProps> = ({ navigation, route }) => {
  const { user } = useAuthStore();
  const { currentTournament, players, loading, loadTournament, loadPlayers, deleteTournament, startTournament } = useTournamentStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const { tournamentId } = route.params;

  useEffect(() => {
    if (tournamentId) {
      loadTournament(tournamentId);
      loadPlayers(tournamentId);
    }
  }, [tournamentId]);

  const handleDeleteTournament = () => {
    if (!currentTournament) return;

    Alert.alert(
      'Eliminar Torneo',
      `¿Estás seguro de que quieres eliminar el torneo "${currentTournament.name}"?\n\nEsta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!currentTournament) return;

    setIsDeleting(true);
    try {
      await deleteTournament(currentTournament.id);
      Alert.alert(
        'Torneo Eliminado',
        'El torneo ha sido eliminado exitosamente.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el torneo. Inténtalo nuevamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartTournament = async () => {
    if (!currentTournament) return;

    Alert.alert(
      'Iniciar Torneo',
      '¿Estás seguro de que quieres iniciar este torneo? Una vez iniciado, no se podrá modificar la configuración.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Iniciar',
          onPress: confirmStart,
        },
      ]
    );
  };

  const confirmStart = async () => {
    if (!currentTournament) return;

    setIsStarting(true);
    try {
      await startTournament(currentTournament.id);
      
      // Recargar el torneo para actualizar el estado
      await loadTournament(tournamentId);
      
      Alert.alert(
        'Torneo Iniciado',
        'El torneo ha sido iniciado exitosamente.',
        [
          {
            text: 'Ir al Reloj',
            onPress: () => {
              // Navegar automáticamente al reloj del torneo
              navigation.navigate('Clock', { tournamentId });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el torneo. Inténtalo nuevamente.');
    } finally {
      setIsStarting(false);
    }
  };

  const canDeleteTournament = () => {
    if (!currentTournament) return false;
    return currentTournament.status === 'scheduled' || currentTournament.status === 'finished';
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

  if (loading) {
    return (
      <LinearGradient colors={['#0c0c0c', '#1a1a1a']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff4757" />
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
          <Text style={styles.errorText}>No se pudo cargar el torneo</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0c0c0c', '#1a1a1a']} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Gestionar Torneo</Text>
        </View>

        {/* Información del Torneo */}
        <View style={styles.tournamentCard}>
          <View style={styles.tournamentHeader}>
            <Text style={styles.tournamentName}>{currentTournament.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentTournament.status) }]}>
              <Text style={styles.statusText}>{getStatusText(currentTournament.status)}</Text>
            </View>
          </View>

          {currentTournament.description && (
            <Text style={styles.tournamentDescription}>{currentTournament.description}</Text>
          )}

          <View style={styles.tournamentInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#b0b0b0" />
              <Text style={styles.infoText}>
                Inicio: {formatDate(currentTournament.start_date)}
              </Text>
            </View>

            {currentTournament.end_date && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#b0b0b0" />
                <Text style={styles.infoText}>
                  Fin: {formatDate(currentTournament.end_date)}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="diamond" size={20} color="#b0b0b0" />
              <Text style={styles.infoText}>
                Fichas iniciales: {(currentTournament.initial_chips || 0).toLocaleString()}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="refresh" size={20} color="#b0b0b0" />
              <Text style={styles.infoText}>
                Rebuys: {currentTournament.rebuy_limit}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="add-circle" size={20} color="#b0b0b0" />
              <Text style={styles.infoText}>
                Add-ons: {currentTournament.addon_limit}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="list" size={20} color="#b0b0b0" />
              <Text style={styles.infoText}>
                Niveles: {currentTournament.structure?.length || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Estadísticas del Torneo */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#ff4757" />
              <Text style={styles.statValue}>
                {players.filter(p => p.is_active && !p.is_eliminated).length}/{players.length}
              </Text>
              <Text style={styles.statLabel}>Jugadores Activos</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash" size={24} color="#2ed573" />
              <Text style={styles.statValue}>${(currentTournament.buy_in || 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Costo del Buy-in</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="refresh" size={24} color="#ffa502" />
              <Text style={styles.statValue}>
                {players.reduce((total, player) => total + (player.rebuys || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Cantidad de Rebuys</Text>
            </View>
          </View>
        </View>

        {/* Acciones de Administración */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Acciones de Administración</Text>

          {/* Iniciar Torneo */}
          {currentTournament.status === 'scheduled' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={handleStartTournament}
              disabled={isStarting}
            >
              {isStarting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="play" size={20} color="#ffffff" />
              )}
              <Text style={styles.actionButtonText}>
                {isStarting ? 'Iniciando...' : 'Iniciar Torneo'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Eliminar Torneo */}
          {canDeleteTournament() && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteTournament}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="trash" size={20} color="#ffffff" />
              )}
              <Text style={styles.actionButtonText}>
                {isDeleting ? 'Eliminando...' : 'Eliminar Torneo'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Gestionar Jugadores */}
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate('PlayerManagement', { tournamentId })}
          >
            <Ionicons name="people" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Gestionar Jugadores</Text>
          </TouchableOpacity>

          {/* Reloj del Torneo */}
          {currentTournament.status === 'active' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigation.navigate('Clock')}
            >
              <Ionicons name="time" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Reloj del Torneo</Text>
            </TouchableOpacity>
          )}

          {/* Información de Eliminación */}
          {!canDeleteTournament() && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#ffa502" />
              <Text style={styles.infoBoxText}>
                Solo se pueden eliminar torneos programados o finalizados.
              </Text>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tournamentCard: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tournamentDescription: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 16,
  },
  tournamentInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#b0b0b0',
    marginLeft: 12,
  },
  statsContainer: {
    margin: 20,
    marginTop: 0,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statValue: {
    fontSize: 20,
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
  actionsContainer: {
    margin: 20,
    marginTop: 0,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#ff4757',
  },
  startButton: {
    backgroundColor: '#2ed573',
  },
  deleteButton: {
    backgroundColor: '#ff4757',
    opacity: 0.8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffa502',
  },
  infoBoxText: {
    color: '#b0b0b0',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
});

export default TournamentManagementScreen;