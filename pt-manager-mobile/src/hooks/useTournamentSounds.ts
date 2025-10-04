import { useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

interface UseTournamentSoundsProps {
  timeRemaining: number;
  isPaused: boolean;
  onLevelEnd?: () => void;
}

export const useTournamentSounds = ({ 
  timeRemaining, 
  isPaused, 
  onLevelEnd 
}: UseTournamentSoundsProps) => {
  const lastPlayedSecondRef = useRef<number>(-1);
  const lastLevelEndedRef = useRef<boolean>(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Función para reproducir un bip simple
  const playTickSound = useCallback(async () => {
    try {
      // Crear un sonido sintético usando Audio API
      const audioContext = new (global as any).AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Error reproduciendo sonido de tick:', error);
    }
  }, []);

  // Función para reproducir sonido de gong (fin de nivel)
  const playGongSound = useCallback(async () => {
    try {
      const audioContext = new (global as any).AudioContext();
      
      // Crear sonido de gong con múltiples frecuencias
      const createGongTone = (frequency: number, volume: number, delay: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
        oscillator.type = 'sine';

        // Envelope para simular el sonido de un gong
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(volume * 0.1, audioContext.currentTime + delay + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + delay + 2.0);

        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + 2.0);
      };

      // Crear múltiples tonos para simular un gong
      createGongTone(220, 0.3, 0);    // A3 (frecuencia fundamental)
      createGongTone(440, 0.2, 0.01); // A4 (octava)
      createGongTone(660, 0.15, 0.02); // E5 (quinta)
      createGongTone(880, 0.1, 0.03);  // A5 (octava superior)

      console.log('🔔 Sonido de gong reproducido - fin de nivel');

    } catch (error) {
      console.warn('Error reproduciendo sonido de gong:', error);
    }
  }, []);

  // Función para reproducir secuencia de fin de nivel (mantenida por compatibilidad)
  const playLevelEndSequence = useCallback(async () => {
    await playGongSound();
  }, [playGongSound]);

  // Efecto para manejar sonidos del reloj
  useEffect(() => {
    if (!timeRemaining || isPaused) {
      lastPlayedSecondRef.current = -1;
      return;
    }

    const currentSecond = Math.ceil(timeRemaining);

    // Detectar fin de nivel (cuando el tiempo llega a 0)
    if (currentSecond === 0 && !lastLevelEndedRef.current) {
      console.log('🎵 Fin de nivel detectado - reproduciendo secuencia');
      playLevelEndSequence();
      lastLevelEndedRef.current = true;
      onLevelEnd?.();
      return;
    }

    // Resetear flag de fin de nivel cuando el tiempo cambia
    if (currentSecond > 0) {
      lastLevelEndedRef.current = false;
    }

    // Reproducir bip en los últimos 10 segundos (excepto el segundo 0)
    if (currentSecond <= 10 && currentSecond !== lastPlayedSecondRef.current && currentSecond > 0) {
      console.log(`🎵 Bip en ${currentSecond} segundos`);
      playTickSound();
      lastPlayedSecondRef.current = currentSecond;
    }

    // Resetear contador cuando el tiempo cambia significativamente
    if (currentSecond > 10) {
      lastPlayedSecondRef.current = -1;
    }

  }, [timeRemaining, isPaused, playTickSound, playLevelEndSequence, onLevelEnd]);

  // Función para activar sonidos (llamada por interacción del usuario)
  const enableSounds = useCallback(async () => {
    try {
      console.log('🎵 Sonidos activados por interacción del usuario');
    } catch (error) {
      console.warn('Error activando sonidos:', error);
    }
  }, []);

  return {
    playTickSound,
    playLevelEndSequence,
    playGongSound,
    enableSounds
  };
};
