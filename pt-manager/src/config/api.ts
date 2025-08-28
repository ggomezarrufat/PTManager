// Configuración de la API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// Configuración de URLs de la API
export const API_URLS = {
  // Reloj del torneo
  CLOCK: {
    JOIN: `${API_BASE_URL}/api/clock/join`,
    STATE: `${API_BASE_URL}/api/clock/state`,
    PAUSE: `${API_BASE_URL}/api/clock/pause`,
    RESUME: `${API_BASE_URL}/api/clock/resume`,
    ADJUST: `${API_BASE_URL}/api/clock/adjust`,
    LEVEL: `${API_BASE_URL}/api/clock/level`,
  },

  // Autenticación
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  },

  // Torneos
  TOURNAMENTS: {
    LIST: `${API_BASE_URL}/api/tournaments`,
    GET: (id: string) => `${API_BASE_URL}/api/tournaments/${id}`,
    CREATE: `${API_BASE_URL}/api/tournaments`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/tournaments/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/tournaments/${id}`,
    PLAYERS: (id: string) => `${API_BASE_URL}/api/tournaments/${id}/players`,
    CLOCK: {
      GET: (id: string) => `${API_BASE_URL}/api/tournaments/${id}/clock`,
      CREATE: (id: string) => `${API_BASE_URL}/api/tournaments/${id}/clock`,
      UPDATE: (id: string) => `${API_BASE_URL}/api/tournaments/${id}/clock`,
      INITIALIZE: (id: string) => `${API_BASE_URL}/api/tournaments/${id}/clock/initialize`,
      TOGGLE_PAUSE: (id: string) => `${API_BASE_URL}/api/tournaments/${id}/clock/toggle-pause`,
    }
  },

  // Usuarios
  USERS: {
    LIST: `${API_BASE_URL}/api/users`,
    GET: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    CREATE: `${API_BASE_URL}/api/users`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/users/${id}`,
  },

  // Reportes
  REPORTS: {
    LEADERBOARD: `${API_BASE_URL}/api/reports/leaderboard`,
  }
};

export default API_URLS;
