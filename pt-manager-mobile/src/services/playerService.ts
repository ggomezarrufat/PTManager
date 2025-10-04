import { supabase } from '../config/supabase';

const getApiBaseUrl = (): string => {
  // Siempre usar variables de entorno si están disponibles
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL;
  if (apiUrl) {
    console.log('🔧 PlayerService - Usando URL de variables de entorno:', apiUrl);
    return apiUrl;
  }

  // Fallback para desarrollo
  if (__DEV__) {
    console.log('🔧 PlayerService - Usando fallback localhost');
    return 'http://localhost:3001';
  }

  // Fallback para producción
  console.log('🔧 PlayerService - Usando fallback producción');
  return 'https://pt-manager.vercel.app';
};

interface AddPlayerData {
  user_id: string;
  entry_fee_paid: number;
  initial_chips: number;
}

interface PlayerResponse {
  message: string;
  player: any;
  calculated_values?: {
    calculated_position: number;
    calculated_points: number;
    total_players: number;
    eliminated_count: number;
  };
}

interface PlayersResponse {
  players: any[];
}

class PlayerService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const fullUrl = `${getApiBaseUrl()}${endpoint}`;
    console.log('🔧 PlayerService - URL:', fullUrl);
    console.log('🔧 PlayerService - Token:', session.access_token ? '✅ Presente' : '❌ Faltante');

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ PlayerService - Error response:', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        errorData
      });
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getTournamentPlayers(tournamentId: string): Promise<PlayersResponse> {
    return this.makeRequest<PlayersResponse>(`/api/tournaments/${tournamentId}/players`);
  }

  async addPlayerToTournament(tournamentId: string, playerData: AddPlayerData): Promise<PlayerResponse> {
    return this.makeRequest<PlayerResponse>(`/api/tournaments/${tournamentId}/players`, {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  }

  async eliminatePlayer(playerId: string, tournamentId: string, position?: number, eliminatedBy?: string, pointsEarned?: number): Promise<PlayerResponse> {
    const body: any = {
      tournament_id: tournamentId
    };
    if (position !== undefined) body.final_position = position;
    if (eliminatedBy) body.eliminated_by = eliminatedBy;
    if (pointsEarned !== undefined) body.points_earned = pointsEarned;

    console.log('🔍 PlayerService - eliminatePlayer - Body preparado:', body);
    console.log('🔍 PlayerService - eliminatePlayer - Parámetros recibidos:', {
      playerId,
      tournamentId,
      position,
      eliminatedBy,
      pointsEarned
    });

    const url = `/api/players/${playerId}/eliminate`;
    console.log('🔍 PlayerService - eliminatePlayer - URL completa:', url);
    console.log('🔍 PlayerService - eliminatePlayer - PlayerId válido:', playerId?.length === 36 ? 'Sí (UUID)' : 'No');

    return this.makeRequest<PlayerResponse>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async checkPlayerExists(playerId: string): Promise<{ message: string; player: any }> {
    return this.makeRequest<{ message: string; player: any }>(`/api/players/${playerId}/check`, {
      method: 'GET',
    });
  }

  async updatePlayerChips(playerId: string, chips: number): Promise<PlayerResponse> {
    return this.makeRequest<PlayerResponse>(`/api/players/${playerId}/chips`, {
      method: 'PUT',
      body: JSON.stringify({ chips }),
    });
  }

  async removePlayer(playerId: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/api/players/${playerId}`, {
      method: 'DELETE',
    });
  }

  async registerRebuy(playerId: string, rebuyData: {
    amount: number;
    chips_received: number;
    admin_user_id: string;
  }): Promise<{ message: string; rebuy: any }> {
    return this.makeRequest<{ message: string; rebuy: any }>(`/api/players/${playerId}/rebuys`, {
      method: 'POST',
      body: JSON.stringify(rebuyData),
    });
  }

  async registerAddon(playerId: string, addonData: {
    amount: number;
    chips_received: number;
    admin_user_id: string;
  }): Promise<{ message: string; addon: any }> {
    return this.makeRequest<{ message: string; addon: any }>(`/api/players/${playerId}/addons`, {
      method: 'POST',
      body: JSON.stringify(addonData),
    });
  }
}

export const playerService = new PlayerService();
export default playerService;
