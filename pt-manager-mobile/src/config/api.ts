// Configuración de la API para móvil
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001' 
  : 'https://pt-manager.vercel.app';

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
    UPDATE: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/users/${id}`,
  },

  // Jugadores
  PLAYERS: {
    LIST: `${API_BASE_URL}/api/players`,
    GET: (id: string) => `${API_BASE_URL}/api/players/${id}`,
    CREATE: `${API_BASE_URL}/api/players`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/players/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/players/${id}`,
  },

  // Recompras
  REBUYS: {
    LIST: `${API_BASE_URL}/api/rebuys`,
    CREATE: `${API_BASE_URL}/api/rebuys`,
    DELETE: (id: string) => `${API_BASE_URL}/api/rebuys/${id}`,
  },

  // Addons
  ADDONS: {
    LIST: `${API_BASE_URL}/api/addons`,
    CREATE: `${API_BASE_URL}/api/addons`,
    DELETE: (id: string) => `${API_BASE_URL}/api/addons/${id}`,
  },

  // Reportes
  REPORTS: {
    FINANCIAL: `${API_BASE_URL}/api/reports/financial`,
    TOURNAMENT: (id: string) => `${API_BASE_URL}/api/reports/tournament/${id}`,
    PLAYER: (id: string) => `${API_BASE_URL}/api/reports/player/${id}`,
  }
};

export default API_URLS;
