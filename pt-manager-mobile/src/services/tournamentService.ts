import { supabase } from '../config/supabase';

interface TournamentResponse {
  message: string;
  tournament: any;
}

interface ClockResponse {
  message: string;
  clock: any;
}

class TournamentService {
  private getApiBaseUrl(): string {
    // Siempre usar variables de entorno si están disponibles
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL;
    if (apiUrl) {
      console.log('🔧 TournamentService - Usando URL de variables de entorno:', apiUrl);
      return apiUrl;
    }

    // Fallback para desarrollo
    if (__DEV__) {
      console.log('🔧 TournamentService - Usando fallback localhost');
      return 'http://localhost:3001';
    }

    // Fallback para producción
    console.log('🔧 TournamentService - Usando fallback producción');
    return 'https://pt-manager.vercel.app';
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const fullUrl = `${this.getApiBaseUrl()}${endpoint}`;
    console.log('🔧 TournamentService - URL:', fullUrl);
    console.log('🔧 TournamentService - Token:', session.access_token ? '✅ Presente' : '❌ Faltante');

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
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async startTournament(tournamentId: string): Promise<TournamentResponse> {
    return this.makeRequest<TournamentResponse>(`/api/tournaments/${tournamentId}/start`, {
      method: 'PUT',
    });
  }

  async finishTournament(tournamentId: string): Promise<TournamentResponse> {
    return this.makeRequest<TournamentResponse>(`/api/tournaments/${tournamentId}/finish`, {
      method: 'PUT',
    });
  }

  async getTournamentClock(tournamentId: string): Promise<ClockResponse> {
    return this.makeRequest<ClockResponse>(`/api/tournaments/${tournamentId}/clock`);
  }

  async createTournamentClock(tournamentId: string, clockData: {
    level_duration_minutes: number;
    blind_schedule: any[];
  }): Promise<ClockResponse> {
    return this.makeRequest<ClockResponse>(`/api/tournaments/${tournamentId}/clock`, {
      method: 'POST',
      body: JSON.stringify(clockData),
    });
  }

  async updateTournamentClock(tournamentId: string, clockData: any): Promise<ClockResponse> {
    return this.makeRequest<ClockResponse>(`/api/tournaments/${tournamentId}/clock`, {
      method: 'PUT',
      body: JSON.stringify(clockData),
    });
  }

  async togglePause(tournamentId: string): Promise<ClockResponse> {
    return this.makeRequest<ClockResponse>(`/api/tournaments/${tournamentId}/clock/toggle-pause`, {
      method: 'PUT',
    });
  }

  async getLeaderboard(): Promise<{ leaderboard: any[] }> {
    return this.makeRequest<{ leaderboard: any[] }>('/api/reports/leaderboard');
  }

  async getTournamentClock(tournamentId: string): Promise<{ clock: any }> {
    return this.makeRequest<{ clock: any }>(`/api/tournaments/${tournamentId}/clock`);
  }

  async createTournamentClock(tournamentId: string, clockData: any): Promise<{ clock: any }> {
    return this.makeRequest<{ clock: any }>(`/api/tournaments/${tournamentId}/clock`, {
      method: 'POST',
      body: JSON.stringify(clockData)
    });
  }

  async togglePause(tournamentId: string): Promise<{ clock: any }> {
    return this.makeRequest<{ clock: any }>(`/api/tournaments/${tournamentId}/clock/toggle-pause`, {
      method: 'PUT'
    });
  }

  async changeLevel(tournamentId: string, newLevel: number): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>('/api/clock/level', {
      method: 'POST',
      body: JSON.stringify({ tournamentId, newLevel })
    });
  }

  async adjustTime(tournamentId: string, adjustmentSeconds: number): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>('/api/clock/adjust', {
      method: 'POST',
      body: JSON.stringify({ tournamentId, newSeconds: adjustmentSeconds })
    });
  }

  async getTournamentRebuys(tournamentId: string): Promise<{ rebuys: any[] }> {
    return this.makeRequest<{ rebuys: any[] }>(`/api/tournaments/${tournamentId}/rebuys`);
  }

  async getTournamentAddons(tournamentId: string): Promise<{ addons: any[] }> {
    return this.makeRequest<{ addons: any[] }>(`/api/tournaments/${tournamentId}/addons`);
  }

}

export const tournamentService = new TournamentService();
export default tournamentService;
