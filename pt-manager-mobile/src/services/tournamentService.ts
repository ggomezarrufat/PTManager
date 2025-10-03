import { supabase } from '../config/supabase';

const API_BASE_URL = 'https://copadesafio.vercel.app';

interface TournamentResponse {
  message: string;
  tournament: any;
}

interface ClockResponse {
  message: string;
  clock: any;
}

class TournamentService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
}

export const tournamentService = new TournamentService();
export default tournamentService;
