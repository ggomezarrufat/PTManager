// API Service - Centralized API calls for the frontend

// Declarar variables de entorno de forma explícita para TypeScript
declare const process: {
  env: {
    NODE_ENV: string;
    REACT_APP_API_URL?: string;
    REACT_APP_API_BASE_URL?: string;
  };
};

const getApiBaseUrl = () => {
  // Siempre usar las variables de entorno REACT_APP_*
  const apiUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL;
  
  if (apiUrl) {
    console.log('🔧 API URL from environment variables:', apiUrl);
    return apiUrl;
  }

  // Fallback solo si no hay variables de entorno configuradas
  console.log('⚠️ No REACT_APP_API_URL or REACT_APP_API_BASE_URL configured, falling back to window.location.origin');
  return window.location.origin;
};

export const API_BASE_URL = getApiBaseUrl();

// Debug: Log detallado de la URL de la API
console.log('🔍 API Service Debug:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
  API_BASE_URL: API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  window_origin: typeof window !== 'undefined' ? window.location.origin : 'N/A'
});

// Log adicional para confirmar configuración
console.log('🔧 API_BASE_URL configurado:', API_BASE_URL);

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API request function with retry logic for rate limiting
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken');
  const maxRetries = 1; // Reducir de 3 a 1 para evitar rate limiting agresivo
  let retryCount = 0;

  // Debug de autenticación en producción
  if (process.env.NODE_ENV === 'production') {
    console.log('🔐 Production Auth Debug:', {
      endpoint,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'none',
      API_BASE_URL,
      window_origin: typeof window !== 'undefined' ? window.location.origin : 'N/A'
    });
  }

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  while (retryCount <= maxRetries) {
    try {
      // Debug: log de la llamada cuando se crea un torneo
      const method = (config.method || 'GET').toString().toUpperCase();
      if (endpoint === '/api/tournaments' && method === 'POST') {
        const maskedHeaders: Record<string, unknown> = { ...(config.headers as Record<string, unknown>) };
        if (maskedHeaders && typeof maskedHeaders.Authorization === 'string') {
          const auth = maskedHeaders.Authorization as string;
          maskedHeaders.Authorization = auth.replace(/Bearer\s+(.{3}).+/, 'Bearer $1***');
        }
        let bodyPreview: unknown = undefined;
        try {
          bodyPreview = config.body ? JSON.parse(config.body as string) : undefined;
        } catch {
          bodyPreview = config.body;
        }
        // Log compacto y claro
        // eslint-disable-next-line no-console
        console.log('🛰️ API Request (Create Tournament):', {
          url: `${API_BASE_URL}${endpoint}`,
          method,
          headers: maskedHeaders,
          body: bodyPreview,
        });
      }

      let response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        // Intentar refresh en 401 y reintentar una vez
        if (response.status === 401 && !(options as any)._retried) {
          if (process.env.NODE_ENV === 'production') {
            console.log('🔒 Production 401 Error:', {
              endpoint,
              currentToken: localStorage.getItem('authToken') ? 'exists' : 'missing',
              attemptingRefresh: true
            });
          }
          
          const refreshed = await tryRefreshToken();
          if (refreshed) {
            const token = localStorage.getItem('authToken');
            if (process.env.NODE_ENV === 'production') {
              console.log('🔄 Token refreshed successfully:', {
                newToken: token ? 'exists' : 'missing'
              });
            }
            
            const retryConfig: RequestInit = {
              ...config,
              headers: {
                ...(config.headers || {}),
                ...(token && { Authorization: `Bearer ${token}` })
              }
            };
            response = await fetch(`${API_BASE_URL}${endpoint}`, { ...retryConfig, _retried: true } as any);
          } else {
            if (process.env.NODE_ENV === 'production') {
              console.log('❌ Token refresh failed, clearing auth state');
            }
            // Limpiar tokens inválidos
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
          }
        }

        // Manejar rate limiting (429) con retry automático
        if (response.status === 429 && retryCount < maxRetries) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 3000; // Backoff exponencial: 3s, 6s (más tiempo entre reintentos)
          console.log(`🔄 Rate limit alcanzado, reintentando en ${delay/1000}s... (intento ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Si no puede parsear JSON, usar el mensaje por defecto
        }
        if (response.status === 404) {
          errorMessage = `No se encontró la ruta en el backend (${API_BASE_URL}${endpoint}). Verifica REACT_APP_API_URL y que la API esté corriendo.`;
        }
        // eslint-disable-next-line no-console
        if (endpoint === '/api/tournaments' && method === 'POST') {
          console.error('🛑 API Error (Create Tournament):', {
            url: `${API_BASE_URL}${endpoint}`,
            status: response.status,
            statusText: response.statusText,
          });
        }
        throw new ApiError(errorMessage, response.status);
      }

      // Handle empty responses (like 204 No Content)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Error de conexión con el servidor'
      );
    }
  }

  // Si llegamos aquí, se agotaron los reintentos
  throw new ApiError('Se agotaron los reintentos debido al rate limiting. Intenta de nuevo en unos minutos.');
}

// Authentication Service
const authService = {
  async login(email: string, password: string) {
    const response = await apiRequest<{
      message: string;
      user: any;
      session: {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        expires_at?: number;
      };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.session?.access_token) {
      localStorage.setItem('authToken', response.session.access_token);
      if (process.env.NODE_ENV === 'production') {
        console.log('🔐 Production Login Success:', {
          hasAccessToken: !!response.session.access_token,
          hasRefreshToken: !!response.session.refresh_token,
          tokenPreview: response.session.access_token ? `${response.session.access_token.substring(0, 10)}...` : 'none'
        });
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Production Login Error: No access token in response');
      }
    }

    return response;
  },

  async register(userData: {
    email: string;
    password: string;
    name: string;
    nickname?: string;
  }) {
    const response = await apiRequest<{
      message: string;
      user: any;
      token: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.token) {
      localStorage.setItem('authToken', response.token);
      if (process.env.NODE_ENV === 'production') {
        console.log('🔐 Production Register Success:', {
          hasToken: !!response.token,
          tokenPreview: response.token ? `${response.token.substring(0, 10)}...` : 'none'
        });
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Production Register Error: No token in response');
      }
    }

    return response;
  },

  async getCurrentUser() {
    return await apiRequest<{
      user: any;
    }>('/api/auth/me');
  },

  logout() {
    localStorage.removeItem('authToken');
  },

  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    if (process.env.NODE_ENV === 'production') {
      console.log('🔍 Production Auth Check:', {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'none'
      });
    }
    return !!token;
  },
};

// Refresh token helper
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.session?.access_token) {
      localStorage.setItem('authToken', data.session.access_token);
      if (data.session.refresh_token) {
        localStorage.setItem('refreshToken', data.session.refresh_token);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// User Service (Admin)
const userService = {
  async getUsers(page = 1, limit = 10, search = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    return await apiRequest<{
      message: string;
      users: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/users?${params}`);
  },

  async getAvailableUsersForTournament(search?: string, limit?: number) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const url = `/api/users/available-for-tournament${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest<{
      users: any[];
    }>(url);
  },

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    nickname?: string;
    is_admin?: boolean;
  }) {
    return await apiRequest<{
      message: string;
      user: any;
    }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(userId: string, userData: {
    name?: string;
    nickname?: string;
    is_admin?: boolean;
  }) {
    return await apiRequest<{
      message: string;
      user: any;
    }>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(userId: string) {
    return await apiRequest<{
      message: string;
    }>(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Tournament Service
const tournamentService = {
  async getTournaments(page = 1, limit = 10, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });

    return await apiRequest<{
      message: string;
      tournaments: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/tournaments?${params}`);
  },

  async getTournament(id: string) {
    return await apiRequest<{
      message: string;
      tournament: any;
    }>(`/api/tournaments/${id}`);
  },

  async createTournament(tournamentData: any) {
    return await apiRequest<{
      message: string;
      tournament: any;
    }>('/api/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    });
  },

  async startTournament(id: string) {
    return await apiRequest<{
      message: string;
      tournament: any;
    }>(`/api/tournaments/${id}/start`, {
      method: 'PUT',
    });
  },

  async finishTournament(id: string) {
    return await apiRequest<{
      message: string;
      tournament: any;
    }>(`/api/tournaments/${id}/finish`, {
      method: 'PUT',
    });
  },

  async pauseTournament(id: string) {
    return await apiRequest<{
      message: string;
      tournament: any;
    }>(`/api/tournaments/${id}/pause`, {
      method: 'PUT',
    });
  },

  async resumeTournament(id: string) {
    return await apiRequest<{
      message: string;
      tournament: any;
    }>(`/api/tournaments/${id}/resume`, {
      method: 'PUT',
    });
  },

  async updateTournamentResults(tournamentId: string, results: Array<{
    player_id: string;
    final_position?: number;
    points_earned?: number;
  }>) {
    return await apiRequest<{
      message: string;
      players: any[];
    }>(`/api/tournaments/${tournamentId}/results`, {
      method: 'PUT',
      body: JSON.stringify({ results }),
    });
  },

  async updateTournament(id: string, tournamentData: any) {
    return await apiRequest<{
      message: string;
      tournament: any;
    }>(`/api/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tournamentData),
    });
  },

  async deleteTournament(id: string) {
    return await apiRequest<{
      message: string;
    }>(`/api/tournaments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Player Service
const playerService = {
  async getTournamentPlayers(tournamentId: string) {
    return await apiRequest<{
      message: string;
      players: any[];
    }>(`/api/tournaments/${tournamentId}/players`);
  },

  async addPlayerToTournament(tournamentId: string, playerData: {
    user_id: string;
    entry_fee_paid: number;
    initial_chips: number;
  }) {
    return await apiRequest<{
      message: string;
      player: any;
    }>(`/api/tournaments/${tournamentId}/players`, {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  },

  async eliminatePlayer(playerId: string, position?: number, eliminatedBy?: string, pointsEarned?: number) {
    const body: any = {};

    if (position !== undefined) body.final_position = position;
    if (eliminatedBy) body.eliminated_by = eliminatedBy;
    if (pointsEarned !== undefined) body.points_earned = pointsEarned;

    console.log('🔍 API Service - eliminatePlayer - Body preparado:', body);
    console.log('🔍 API Service - eliminatePlayer - Parámetros recibidos:', {
      playerId,
      position,
      eliminatedBy,
      pointsEarned
    });

    return await apiRequest<{
      message: string;
      player: any;
      calculated_values?: {
        calculated_position: number;
        calculated_points: number;
        total_players: number;
        eliminated_count: number;
      };
    }>(`/api/players/${playerId}/eliminate`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async updatePlayerChips(playerId: string, chips: number) {
    return await apiRequest<{
      message: string;
      player: any;
    }>(`/api/players/${playerId}/chips`, {
      method: 'PUT',
      body: JSON.stringify({ current_chips: chips }),
    });
  },
  async removePlayer(playerId: string) {
    return await apiRequest<{
      message: string;
    }>(`/api/players/${playerId}`, {
      method: 'DELETE',
    });
  },

  async updatePlayerResults(playerId: string, data: {
    final_position?: number;
    points_earned?: number;
    eliminated_by?: string;
  }) {
    return await apiRequest<{
      message: string;
      player: any;
    }>(`/api/players/${playerId}/results`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updatePlayerPositionAndPoints(playerId: string, position: number, points: number, adminId: string) {
    return await apiRequest<{
      message: string;
      player: any;
    }>(`/api/players/${playerId}/position-points`, {
      method: 'PUT',
      body: JSON.stringify({
        final_position: position,
        points_earned: points,
        updated_by: adminId
      }),
    });
  },
};

// Rebuy Service
const rebuyService = {
  async registerRebuy(playerId: string, rebuyData: {
    amount: number;
    chips_received: number;
    admin_user_id: string;
  }) {
    return await apiRequest<{
      message: string;
      rebuy: any;
    }>(`/api/players/${playerId}/rebuys`, {
      method: 'POST',
      body: JSON.stringify(rebuyData),
    });
  },

  async getPlayerRebuys(playerId: string) {
    return await apiRequest<{
      message: string;
      rebuys: any[];
    }>(`/api/players/${playerId}/rebuys`);
  },

  async getTournamentRebuys(tournamentId: string) {
    return await apiRequest<{
      message: string;
      tournament: {
        id: string;
        name: string;
      };
      rebuys: any[];
    }>(`/api/tournaments/${tournamentId}/rebuys`);
  },
};

// Addon Service
const addonService = {
  async registerAddon(playerId: string, addonData: {
    amount: number;
    chips_received: number;
    admin_user_id: string;
  }) {
    return await apiRequest<{
      message: string;
      addon: any;
    }>(`/api/players/${playerId}/addons`, {
      method: 'POST',
      body: JSON.stringify(addonData),
    });
  },

  async getPlayerAddons(playerId: string) {
    return await apiRequest<{
      message: string;
      addons: any[];
    }>(`/api/players/${playerId}/addons`);
  },
};

// Clock Service
const clockService = {
  async getTournamentClock(tournamentId: string) {
    return await apiRequest<{
      message: string;
      clock: any;
    }>(`/api/tournaments/${tournamentId}/clock`);
  },

  async createTournamentClock(tournamentId: string, clockData: {
    level_duration_minutes: number;
    blind_schedule: any[];
  }) {
    return await apiRequest<{
      message: string;
      clock: any;
    }>(`/api/tournaments/${tournamentId}/clock`, {
        method: 'POST',
      body: JSON.stringify(clockData),
    });
  },

  async updateTournamentClock(tournamentId: string, clockData: any) {
    return await apiRequest<{
      message: string;
      clock: any;
    }>(`/api/tournaments/${tournamentId}/clock`, {
      method: 'PUT',
      body: JSON.stringify(clockData),
    });
  },

  async togglePause(tournamentId: string) {
    return await apiRequest<{
      message: string;
      clock: any;
    }>(`/api/tournaments/${tournamentId}/clock/toggle-pause`, {
      method: 'PUT',
    });
  },
};

// Health Service
const healthService = {
  async check() {
    return await apiRequest<{
      status: string;
      message: string;
      timestamp: string;
      version: string;
    }>('/health');
  }
};

// Reports Service
const reportsService = {
  async getLeaderboard() {
    return await apiRequest<{
      leaderboard: {
        user_id: string;
        name: string;
        nickname: string;
        email: string;
        avatar_url?: string | null;
        total_points: number;
        tournaments_played: number;
      }[];
    }>('/api/reports/leaderboard');
  },
  async getPlayerTournaments(userId: string) {
    return await apiRequest<{
      tournaments: {
        tournament_id: string;
        tournament_name: string;
        final_position: number;
        points_earned: number;
        tournament_date: string;
      }[];
    }>(`/api/reports/player-tournaments/${userId}`);
  },

  async getAdminIncomeReport(tournamentId: string) {
    return await apiRequest<{
      tournament_id: string;
      tournament_name: string;
      summary: {
        total_entry_fees: number;
        total_rebuys: number;
        total_addons: number;
        grand_total: number;
      };
      admin_breakdown: Array<{
        admin_id: string;
        admin_name: string;
        entry_fees: number;
        rebuys: number;
        addons: number;
        total: number;
      }>;
    }>(`/api/reports/admin-income/${tournamentId}`);
  },
};

const seasonService = {
  async getSeasons(page: number = 1, limit: number = 50) {
    return await apiRequest<{
      seasons: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/seasons?page=${page}&limit=${limit}`);
  },

  async getSeason(id: number) {
    return await apiRequest<any>(`/api/seasons/${id}`);
  },

  async createSeason(data: { name: string; start_date: string; end_date: string }) {
    return await apiRequest<{
      message: string;
      season: any;
    }>('/api/seasons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSeason(id: number, data: { name?: string; start_date?: string; end_date?: string }) {
    return await apiRequest<{
      message: string;
      season: any;
    }>(`/api/seasons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSeason(id: number) {
    return await apiRequest<{
      message: string;
    }>(`/api/seasons/${id}`, {
      method: 'DELETE',
    });
  },
};

// Exportaciones individuales
export {
  authService,
  userService,
  tournamentService,
  playerService,
  rebuyService,
  addonService,
  clockService,
  healthService,
  reportsService,
  seasonService
};

// Export por defecto
const apiService = {
  auth: authService,
  users: userService,
  tournaments: tournamentService,
  players: playerService,
  rebuys: rebuyService,
  addons: addonService,
  clock: clockService,
  health: healthService,
  reports: reportsService,
  seasons: seasonService,
};

export default apiService;
