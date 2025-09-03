// Tipos principales de la aplicación

export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  avatar_url?: string;
  is_admin: boolean;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface BlindLevel {
  level: number;
  small_blind: number;
  big_blind: number;
  duration_minutes: number;
  antes?: number;
}

export interface PointSystem {
  positions: Record<number, number>; // 1: 100, 2: 80, etc.
  default_points: number;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  scheduled_start_time: string;
  actual_start_time?: string;
  end_time?: string;
  status: 'scheduled' | 'active' | 'paused' | 'finished';
  max_players: number;
  entry_fee: number;
  initial_chips: number;
  rebuy_chips: number;
  addon_chips: number;
  max_rebuys: number;
  max_addons: number;
  last_level_rebuy: number; // Último nivel en el cual se permiten recompras
  blind_structure: BlindLevel[];
  point_system: PointSystem;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentPlayer {
  id: string;
  tournament_id: string;
  user_id: string;
  current_chips: number;
  entry_fee_paid: number;
  registration_time: string;
  final_position?: number;
  points_earned: number;
  is_active: boolean;
  is_eliminated: boolean;
  eliminated_at?: string;
  user?: User; // Relación con el usuario
  rebuys_count: number;
  addons_count: number;
  registration_confirmed_by?: string; // Admin user ID
  eliminated_by?: string; // Admin user ID
}

export interface Rebuy {
  id: string;
  player_id: string;
  tournament_id: string;
  amount: number;
  chips_received: number;
  timestamp: string;
  admin_user_id: string; // Admin user ID que registró la recompra
}

export interface Addon {
  id: string;
  player_id: string;
  tournament_id: string;
  amount: number;
  chips_received: number;
  timestamp: string;
  admin_user_id: string; // Admin user ID que registró el addon
}

export interface TournamentClock {
  tournament_id: string;
  current_level: number;
  time_remaining_seconds: number;
  is_paused: boolean;
  paused_at?: string;
  total_pause_time_seconds: number;
  last_updated: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  role: 'admin' | 'player' | 'spectator';
  joined_at: string;
  user?: User; // Relación con el usuario
}

// Tipos para el estado de la aplicación
export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
}

export interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  players: TournamentPlayer[];
  clock: TournamentClock | null;
  loading: boolean;
  error: string | null;
}

// Tipos para formularios
export interface CreateTournamentForm {
  name: string;
  description: string;
  scheduled_start_time: string;
  max_players: number;
  entry_fee: number;
  initial_chips: number;
  rebuy_chips: number;
  addon_chips: number;
  max_rebuys: number;
  max_addons: number;
  last_level_rebuy: number; // Último nivel en el cual se permiten recompras
  blind_structure: BlindLevel[];
  point_system: PointSystem;
}

export interface AddPlayerForm {
  user_id: string;
  entry_fee_paid: number;
}

export interface RebuyForm {
  amount: number;
  chips_received: number;
}

export interface AddonForm {
  amount: number;
  chips_received: number;
}

// Tipos para estadísticas
export interface TournamentStats {
  total_players: number;
  active_players: number;
  eliminated_players: number;
  total_prize_pool: number;
  average_chips: number;
  total_rebuys: number;
  total_addons: number;
}

// Tipos para filtros y búsquedas
export interface TournamentFilters {
  status?: Tournament['status'];
  created_by?: string;
  date_from?: string;
  date_to?: string;
}

export interface PlayerFilters {
  is_active?: boolean;
  is_eliminated?: boolean;
  min_chips?: number;
  max_chips?: number;
}

// Tipos para reportes de ingresos por administrador
export interface AdminIncomeReportData {
  admin_id: string;
  admin_name: string;
  entry_fees: number; // Cuotas de inscripción cobradas por este admin
  rebuys: number; // Suma de rebuys cobrados por este admin
  addons: number; // Suma de addons cobrados por este admin
  total: number; // Total cobrado por este admin
} 