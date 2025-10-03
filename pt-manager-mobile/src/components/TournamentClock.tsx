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

interface TournamentClockProps {
  tournamentId: string;
  clock?: TournamentClockType | null;
  onStartClock?: () => void;
  onPauseClock?: () => void;
  onResumeClock?: () => void;
  isAdmin?: boolean;
  onLevelChange?: () => void;
}

const TournamentClock: React.FC<TournamentClockProps> = ({
  tournamentId,
  clock,
  onStartClock,
  onPauseClock,
  onResumeClock,
  isAdmin = false,
  onLevelChange,
}) => {
  const { nextLevel, adjustTime } = useTournamentStore();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (clock) {
      setTimeRemaining(clock.time_remaining);
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

  const handleAdjustTime = () => {
    Alert.prompt(
      'Ajustar Tiempo',
      'Ingresa el tiempo restante en minutos:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ajustar',
          onPress: (text) => {
            const minutes = parseInt(text || '0');
            if (minutes >= 0) {
              adjustTime(tournamentId, minutes * 60);
            }
          },
        },
      ],
      'plain-text',
      Math.ceil(timeRemaining / 60).toString()
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentLevel = () => {
    if (!clock || !tournament.structure) return null;
    return tournament.structure.find(level => level.level === clock.current_level);
  };

  const getNextLevel = () => {
    if (!clock || !tournament.structure) return null;
    return tournament.structure.find(level => level.level === clock.current_level + 1);
  };

  const currentLevel = getCurrentLevel();
  const nextLevelData = getNextLevel();

  if (!clock || !currentLevel) {
    return (
      <View style={styles.container}>
        <Text style={styles.noClockText}>No hay reloj activo</Text>
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
          <Text style={[
            styles.timeText,
            timeRemaining <= 60 && styles.timeWarning
          ]}>
            {formatTime(timeRemaining)}
          </Text>
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
              onPress={handleNextLevel}
            >
              <Ionicons name="skip-forward" size={24} color="#ffffff" />
              <Text style={styles.controlButtonText}>Siguiente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleAdjustTime}
            >
              <Ionicons name="time" size={24} color="#ffffff" />
              <Text style={styles.controlButtonText}>Ajustar</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
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
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2ed573',
  },
  timeWarning: {
    color: '#ff4757',
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
});

export default TournamentClock;
