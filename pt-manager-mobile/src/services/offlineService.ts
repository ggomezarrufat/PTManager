import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { Tournament, Player, TournamentClock } from '../types';

const STORAGE_KEYS = {
  TOURNAMENTS: 'offline_tournaments',
  PLAYERS: 'offline_players',
  CLOCKS: 'offline_clocks',
  LAST_SYNC: 'last_sync',
};

export class OfflineService {
  // Guardar datos para uso offline
  static async saveTournaments(tournaments: Tournament[]) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.TOURNAMENTS,
        JSON.stringify(tournaments)
      );
    } catch (error) {
      console.error('Error guardando torneos offline:', error);
    }
  }

  static async savePlayers(players: Player[]) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PLAYERS,
        JSON.stringify(players)
      );
    } catch (error) {
      console.error('Error guardando jugadores offline:', error);
    }
  }

  static async saveClocks(clocks: TournamentClock[]) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CLOCKS,
        JSON.stringify(clocks)
      );
    } catch (error) {
      console.error('Error guardando relojes offline:', error);
    }
  }

  // Cargar datos offline
  static async loadTournaments(): Promise<Tournament[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error cargando torneos offline:', error);
      return [];
    }
  }

  static async loadPlayers(): Promise<Player[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PLAYERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error cargando jugadores offline:', error);
      return [];
    }
  }

  static async loadClocks(): Promise<TournamentClock[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CLOCKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error cargando relojes offline:', error);
      return [];
    }
  }

  // Verificar conectividad
  static async isOnline(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  }

  // Sincronizar datos cuando se recupere la conexión
  static async syncData() {
    const isConnected = await this.isOnline();
    if (!isConnected) return false;

    try {
      // Cargar datos offline
      const offlineTournaments = await this.loadTournaments();
      const offlinePlayers = await this.loadPlayers();
      const offlineClocks = await this.loadClocks();

      // Aquí implementarías la lógica de sincronización
      // Por ejemplo, enviar cambios pendientes al servidor
      
      // Marcar última sincronización
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_SYNC,
        new Date().toISOString()
      );

      return true;
    } catch (error) {
      console.error('Error sincronizando datos:', error);
      return false;
    }
  }

  // Obtener última sincronización
  static async getLastSync(): Promise<Date | null> {
    try {
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('Error obteniendo última sincronización:', error);
      return null;
    }
  }

  // Limpiar datos offline
  static async clearOfflineData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOURNAMENTS,
        STORAGE_KEYS.PLAYERS,
        STORAGE_KEYS.CLOCKS,
        STORAGE_KEYS.LAST_SYNC,
      ]);
    } catch (error) {
      console.error('Error limpiando datos offline:', error);
    }
  }

  // Guardar cambios pendientes
  static async savePendingChanges(changes: any[]) {
    try {
      const existingChanges = await AsyncStorage.getItem('pending_changes');
      const allChanges = existingChanges ? JSON.parse(existingChanges) : [];
      allChanges.push(...changes);
      
      await AsyncStorage.setItem(
        'pending_changes',
        JSON.stringify(allChanges)
      );
    } catch (error) {
      console.error('Error guardando cambios pendientes:', error);
    }
  }

  // Obtener cambios pendientes
  static async getPendingChanges(): Promise<any[]> {
    try {
      const changes = await AsyncStorage.getItem('pending_changes');
      return changes ? JSON.parse(changes) : [];
    } catch (error) {
      console.error('Error obteniendo cambios pendientes:', error);
      return [];
    }
  }

  // Limpiar cambios pendientes
  static async clearPendingChanges() {
    try {
      await AsyncStorage.removeItem('pending_changes');
    } catch (error) {
      console.error('Error limpiando cambios pendientes:', error);
    }
  }
}

export default OfflineService;

