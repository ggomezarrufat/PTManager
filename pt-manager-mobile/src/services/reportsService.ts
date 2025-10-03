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

interface PlayerTournament {
  tournament_id: string;
  tournament_name: string;
  final_position: number;
  points_earned: number;
  tournament_date: string;
}

interface LeaderboardPlayer {
  user_id: string;
  name: string;
  nickname: string;
  email: string;
  avatar_url?: string | null;
  total_points: number;
  tournaments_played: number;
}

class ReportsService {
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

  async getLeaderboard(): Promise<{ leaderboard: LeaderboardPlayer[] }> {
    return this.makeRequest<{ leaderboard: LeaderboardPlayer[] }>('/api/reports/leaderboard');
  }

  async getPlayerTournaments(userId: string): Promise<{ tournaments: PlayerTournament[] }> {
    return this.makeRequest<{ tournaments: PlayerTournament[] }>(`/api/reports/player-tournaments/${userId}`);
  }
}

export const reportsService = new ReportsService();
export default reportsService;

