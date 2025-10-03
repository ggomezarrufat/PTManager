import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  nickname?: string;
  email: string;
  total_points: number;
  tournaments_played: number;
}

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  leaderboard,
  loading,
  error,
}) => {
  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return '#FFD700'; // Oro
      case 2:
        return '#C0C0C0'; // Plata
      case 3:
        return '#CD7F32'; // Bronce
      default:
        return '#b0b0b0';
    }
  };

  const getPositionIcon = (position: number) => {
    if (position <= 3) {
      return 'trophy';
    }
    return 'person';
  };

  const getUserDisplayName = (entry: LeaderboardEntry) => {
    return entry.nickname || entry.name || entry.email || 'Usuario';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4757" />
        <Text style={styles.loadingText}>Cargando tabla de posiciones...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={24} color="#ff4757" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={48} color="#b0b0b0" />
        <Text style={styles.emptyText}>No hay datos para la tabla de posiciones aún</Text>
        <Text style={styles.emptySubtext}>Los puntos se mostrarán después de jugar torneos</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trophy" size={20} color="#ff4757" />
        <Text style={styles.title}>Tabla de Posiciones</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {leaderboard.map((entry, index) => {
          const position = index + 1;
          const isTopThree = position <= 3;
          
          return (
            <View
              key={entry.user_id}
              style={[
                styles.entryContainer,
                isTopThree && styles.topThreeEntry,
              ]}
            >
              <View style={styles.positionContainer}>
                <Ionicons
                  name={getPositionIcon(position)}
                  size={20}
                  color={getPositionColor(position)}
                />
                <Text style={[styles.positionText, { color: getPositionColor(position) }]}>
                  #{position}
                </Text>
              </View>
              
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {getUserDisplayName(entry)}
                </Text>
                <Text style={styles.playerEmail}>
                  {entry.email}
                </Text>
              </View>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{entry.tournaments_played}</Text>
                  <Text style={styles.statLabel}>Torneos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{entry.total_points}</Text>
                  <Text style={styles.statLabel}>Puntos</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  scrollView: {
    maxHeight: 300,
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  topThreeEntry: {
    backgroundColor: 'rgba(255, 71, 87, 0.05)',
    borderRadius: 8,
    marginBottom: 4,
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  positionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  playerEmail: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginLeft: 16,
    minWidth: 50,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 10,
    color: '#b0b0b0',
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#b0b0b0',
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4757',
  },
  errorText: {
    color: '#ff4757',
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#b0b0b0',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default LeaderboardTable;
