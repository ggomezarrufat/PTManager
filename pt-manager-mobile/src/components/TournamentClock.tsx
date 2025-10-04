import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTournamentStore } from '../store/tournamentStore';
import { TournamentClock as TournamentClockType, Tournament } from '../types';
import { useTournamentSounds } from '../hooks/useTournamentSounds';
import TimeAdjustModal from './TimeAdjustModal';

interface TournamentClockProps {
  tournamentId: string;
  clock?: TournamentClockType | null;
  tournament?: any; // Información del torneo con blind_structure
  onStartClock?: () => void;
  onPauseClock?: () => void;
  onResumeClock?: () => void;
  isAdmin?: boolean;
  onLevelChange?: () => void;
  tournamentStats?: {
    activePlayers: number;
    totalRebuys: number;
    totalAddons: number;
    lastUpdated: string;
  } | null;
  tournamentStatsLoading?: boolean;
}

const TournamentClock: React.FC<TournamentClockProps> = ({
  tournamentId,
  clock,
  tournament,
  onStartClock,
  onPauseClock,
  onResumeClock,
  isAdmin = false,
  onLevelChange,
  tournamentStats,
  tournamentStatsLoading = false,
}) => {
  const { nextLevel, adjustTime, finishTournament } = useTournamentStore();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(false);
  const [showTimeAdjustModal, setShowTimeAdjustModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timePulseAnim = useRef(new Animated.Value(1)).current;

  // Hook para manejar sonidos del reloj
  const { enableSounds } = useTournamentSounds({
    timeRemaining: soundsEnabled ? timeRemaining : 0,
    isPaused,
    onLevelEnd: () => {
      console.log('🎵 Nivel terminado - sonido reproducido');
      onLevelChange?.();
    }
  });

  useEffect(() => {
    if (clock) {
      setTimeRemaining(clock.time_remaining_seconds || 0);
      setIsPaused(clock.is_paused);
    }
  }, [clock]);

  useEffect(() => {
    if (!isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Tiempo agotado, cambiar de nivel
            handleLevelComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, timeRemaining]);

  const handleLevelComplete = () => {
    // Animación de pulso cuando cambia el nivel
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (isAdmin) {
      Alert.alert(
        'Nivel Completado',
        '¿Deseas avanzar al siguiente nivel?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Siguiente Nivel', onPress: () => nextLevel(tournament.id) },
        ]
      );
    }
    
    onLevelChange?.();
  };

  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        if (onResumeClock) {
          onResumeClock();
          setIsPaused(false);
        }
      } else {
        if (onPauseClock) {
          onPauseClock();
          setIsPaused(true);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado del reloj');
    }
  };

  const handleNextLevel = async () => {
    try {
      await nextLevel(tournamentId);
      onLevelChange?.();
    } catch (error) {
      Alert.alert('Error', 'No se pudo avanzar al siguiente nivel');
    }
  };

  const handlePrevLevel = async () => {
    try {
      const { prevLevel } = useTournamentStore.getState();
      await prevLevel(tournamentId);
      onLevelChange?.();
    } catch (error) {
      Alert.alert('Error', 'No se pudo retroceder al nivel anterior');
    }
  };

  const handleAdjustTime = () => {
    setShowTimeAdjustModal(true);
  };

  const handleTimeAdjustConfirm = async (minutes: number, seconds: number) => {
    try {
      const totalSeconds = minutes * 60 + seconds;
      console.log('🕐 Ajustando tiempo a:', totalSeconds, 'segundos');
      
      // Ajustar el tiempo en el backend
      await adjustTime(tournamentId, totalSeconds);
      console.log('✅ Tiempo ajustado exitosamente');
      
      // Actualizar el estado local inmediatamente para reiniciar la cuenta regresiva
      setTimeRemaining(totalSeconds);
      setIsPaused(false); // Asegurar que no esté pausado
      
      // Limpiar cualquier intervalo existente
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Recargar el reloj para sincronizar con el backend
      setTimeout(() => {
        onLevelChange?.();
      }, 100);
      
      console.log('🔄 Cuenta regresiva reiniciada desde:', totalSeconds, 'segundos');
    } catch (error) {
      console.log('❌ Error ajustando tiempo:', error);
      Alert.alert('Error', 'No se pudo ajustar el tiempo');
    }
  };

  const handleToggleSounds = async () => {
    if (!soundsEnabled) {
      await enableSounds();
      setSoundsEnabled(true);
      Alert.alert('Sonidos Activados', 'Los sonidos del reloj están ahora activados');
    } else {
      setSoundsEnabled(false);
      Alert.alert('Sonidos Desactivados', 'Los sonidos del reloj están ahora desactivados');
    }
  };

  const handleFinishTournament = () => {
    Alert.alert(
      'Finalizar Torneo',
      '¿Estás seguro de que quieres finalizar este torneo? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Finalizar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await finishTournament(tournamentId);
              Alert.alert('Éxito', 'Torneo finalizado correctamente');
              onLevelChange?.();
            } catch (error) {
              Alert.alert('Error', 'No se pudo finalizar el torneo');
            }
          }
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentLevel = () => {
    if (!clock || !tournament?.structure) return null;
    return tournament.structure.find(level => level.level === clock.current_level);
  };

  const getNextLevel = () => {
    if (!clock || !tournament?.structure) return null;
    return tournament.structure.find(level => level.level === clock.current_level + 1);
  };

  const currentLevel = getCurrentLevel();
  const nextLevelData = getNextLevel();

  // Debug logs (solo cuando cambia el reloj)
  useEffect(() => {
    if (clock) {
      console.log('🕐 TournamentClock Debug:', {
        clock: 'Presente',
        currentLevel: clock.current_level,
        timeRemaining: clock.time_remaining_seconds,
        isPaused: clock.is_paused,
        tournamentStructure: tournament?.structure?.length || 0
      });
    }
  }, [clock?.current_level, clock?.time_remaining_seconds, clock?.is_paused]);

  // Animación de pulso para el tiempo cuando está en advertencia
  useEffect(() => {
    if (timeRemaining <= 60 && timeRemaining > 0 && !isPaused) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(timePulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(timePulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      timePulseAnim.setValue(1);
    }
  }, [timeRemaining, isPaused]);

  if (!clock) {
    return (
      <View style={styles.container}>
        <Text style={styles.noClockText}>No hay reloj activo</Text>
        <Text style={styles.noClockText}>Torneo ID: {tournamentId}</Text>
      </View>
    );
  }

  if (!currentLevel) {
    return (
      <View style={styles.container}>
        <Text style={styles.noClockText}>No hay nivel actual</Text>
        <Text style={styles.noClockText}>Nivel: {clock.current_level}</Text>
        <Text style={styles.noClockText}>Estructura: {tournament?.structure?.length || 0}</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2d2d2d']}
      style={styles.container}
    >
      <Animated.View style={[styles.clockContainer, { transform: [{ scale: pulseAnim }] }]}>
        {/* Nivel actual */}
        <View style={styles.levelContainer}>
          <Text style={styles.levelLabel}>Nivel Actual</Text>
          <Text style={styles.levelNumber}>{clock.current_level}</Text>
        </View>

        {/* Ciegas actuales */}
        <View style={styles.blindsContainer}>
          <Text style={styles.blindsLabel}>Ciegas</Text>
          <Text style={styles.blindsText}>
            {currentLevel.small_blind} / {currentLevel.big_blind}
          </Text>
          {currentLevel.is_break && (
            <Text style={styles.breakText}>BREAK</Text>
          )}
        </View>

        {/* Tiempo restante */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeLabel}>Tiempo Restante</Text>
          <Animated.Text 
            style={[
              styles.timeText,
              timeRemaining <= 60 && styles.timeWarning,
              { transform: [{ scale: timeRemaining <= 60 ? timePulseAnim : 1 }] }
            ]}
          >
            {formatTime(timeRemaining)}
          </Animated.Text>
        </View>

        {/* Estadísticas del torneo */}
        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsLabel}>Estadísticas del Torneo</Text>
            {tournamentStatsLoading ? (
              <View style={styles.loadingIndicator}>
                <Ionicons name="refresh" size={16} color="#ffa502" />
                <Text style={styles.loadingText}>Actualizando...</Text>
              </View>
            ) : tournamentStats?.lastUpdated ? (
              <Text style={styles.lastUpdatedText}>
                Última actualización: {new Date(tournamentStats.lastUpdated).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            ) : null}
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={20} color="#2ed573" />
              <Text style={styles.statValue}>
                {tournamentStatsLoading ? '...' : (tournamentStats?.activePlayers || 0)}
              </Text>
              <Text style={styles.statLabel}>Jugadores Activos</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="refresh" size={20} color="#ffa502" />
              <Text style={styles.statValue}>
                {tournamentStatsLoading ? '...' : (tournamentStats?.totalRebuys || 0)}
              </Text>
              <Text style={styles.statLabel}>Rebuys</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="add-circle" size={20} color="#ff4757" />
              <Text style={styles.statValue}>
                {tournamentStatsLoading ? '...' : (tournamentStats?.totalAddons || 0)}
              </Text>
              <Text style={styles.statLabel}>Addons</Text>
            </View>
          </View>
        </View>

        {/* Próximo nivel */}
        {nextLevelData && (
          <View style={styles.nextLevelContainer}>
            <Text style={styles.nextLevelLabel}>Próximo Nivel</Text>
            <Text style={styles.nextLevelText}>
              {nextLevelData.small_blind} / {nextLevelData.big_blind}
            </Text>
            <Text style={styles.nextLevelDuration}>
              {nextLevelData.duration} min
            </Text>
          </View>
        )}

        {/* Controles para administradores */}
        {isAdmin && (
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.controlButton, isPaused ? styles.resumeButton : styles.pauseButton]}
              onPress={handlePauseResume}
            >
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={24}
                color="#ffffff"
              />
              <Text style={styles.controlButtonText}>
                {isPaused ? 'Reanudar' : 'Pausar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePrevLevel}
              disabled={clock.current_level <= 1}
            >
              <Ionicons name="play-back" size={24} color={clock.current_level <= 1 ? "#666" : "#ffffff"} />
              <Text style={[styles.controlButtonText, clock.current_level <= 1 && { color: "#666" }]}>Anterior</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleNextLevel}
            >
              <Ionicons name="play-forward" size={24} color="#ffffff" />
              <Text style={styles.controlButtonText}>Siguiente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleAdjustTime}
            >
              <Ionicons name="time" size={24} color="#ffffff" />
              <Text style={styles.controlButtonText}>Ajustar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, soundsEnabled && styles.soundsEnabledButton]}
              onPress={handleToggleSounds}
            >
              <Ionicons 
                name={soundsEnabled ? "volume-high" : "volume-mute"} 
                size={24} 
                color={soundsEnabled ? "#4CAF50" : "#ffffff"} 
              />
              <Text style={[styles.controlButtonText, soundsEnabled && { color: "#4CAF50" }]}>
                {soundsEnabled ? 'Sonidos ON' : 'Sonidos OFF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.finishButton]}
              onPress={handleFinishTournament}
            >
              <Ionicons name="flag" size={24} color="#ffffff" />
              <Text style={styles.controlButtonText}>Finalizar Torneo</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Modal para ajustar tiempo */}
      <TimeAdjustModal
        visible={showTimeAdjustModal}
        onClose={() => setShowTimeAdjustModal(false)}
        onConfirm={handleTimeAdjustConfirm}
        currentTimeRemaining={timeRemaining}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    margin: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  clockContainer: {
    alignItems: 'center',
  },
  noClockText: {
    fontSize: 18,
    color: '#b0b0b0',
    textAlign: 'center',
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  levelLabel: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  levelNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff4757',
  },
  blindsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  blindsLabel: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  blindsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  breakText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffa502',
    marginTop: 8,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(46, 213, 115, 0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(46, 213, 115, 0.3)',
    minWidth: 200,
  },
  timeLabel: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#2ed573',
    textShadowColor: 'rgba(46, 213, 115, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  timeWarning: {
    color: '#ff4757',
    fontSize: 80,
    textShadowColor: 'rgba(255, 71, 87, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
    transform: [{ scale: 1.1 }],
  },
  nextLevelContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#0c0c0c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  nextLevelLabel: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 4,
  },
  nextLevelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffa502',
  },
  nextLevelDuration: {
    fontSize: 14,
    color: '#b0b0b0',
    marginTop: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4757',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  pauseButton: {
    backgroundColor: '#ffa502',
  },
  resumeButton: {
    backgroundColor: '#2ed573',
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  soundsEnabledButton: {
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  finishButton: {
    backgroundColor: '#e74c3c',
    borderWidth: 2,
    borderColor: '#c0392b',
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#0c0c0c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#ffa502',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  lastUpdatedText: {
    fontSize: 10,
    color: '#b0b0b0',
    fontStyle: 'italic',
  },
  statsRow: {
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
    marginTop: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#b0b0b0',
    textAlign: 'center',
  },
});

export default TournamentClock;
