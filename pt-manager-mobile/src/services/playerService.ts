import { supabase } from '../config/supabase';

const getApiBaseUrl = (): string => {
  // En desarrollo, usar localhost
  if (__DEV__) {
    return 'http://localhost:3001';
  }

  // En producción, usar variables de entorno
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL;
  if (apiUrl) {
    return apiUrl;
  }

  // Fallback a la URL hardcodeada
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

    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getTournamentPlayers(tournamentId: string): Promise<PlayersResponse> {
    return this.makeRequest<PlayersResponse>(`/tournaments/${tournamentId}/players`);
  }

  async addPlayerToTournament(tournamentId: string, playerData: AddPlayerData): Promise<PlayerResponse> {
    return this.makeRequest<PlayerResponse>(`/tournaments/${tournamentId}/players`, {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  }

  async eliminatePlayer(playerId: string, position?: number, eliminatedBy?: string, pointsEarned?: number): Promise<PlayerResponse> {
    const body: any = {};
    if (position !== undefined) body.final_position = position;
    if (eliminatedBy) body.eliminated_by = eliminatedBy;
    if (pointsEarned !== undefined) body.points_earned = pointsEarned;

    return this.makeRequest<PlayerResponse>(`/players/${playerId}/eliminate`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async updatePlayerChips(playerId: string, chips: number): Promise<PlayerResponse> {
    return this.makeRequest<PlayerResponse>(`/players/${playerId}/chips`, {
      method: 'PUT',
      body: JSON.stringify({ chips }),
    });
  }

  async removePlayer(playerId: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/players/${playerId}`, {
      method: 'DELETE',
    });
  }
}

export const playerService = new PlayerService();
export default playerService;
