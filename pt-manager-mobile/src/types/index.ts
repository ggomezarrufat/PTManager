// Tipos principales para la aplicación móvil PTManager

export interface User {
  id: string;
  email: string;
  full_name?: string;
  nickname?: string;
  avatar_url?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: 'scheduled' | 'active' | 'paused' | 'finished';
  initial_chips: number;
  buy_in: number;
  rebuy_limit: number;
  addon_limit: number;
  structure: BlindLevel[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BlindLevel {
  level: number;
  small_blind: number;
  big_blind: number;
  duration: number; // en minutos
  is_break: boolean;
}

export interface Player {
  id: string;
  tournament_id: string;
  user_id: string;
  position?: number;
  chips: number;
  rebuys: number;
  addons: number;
  is_eliminated: boolean;
  eliminated_at?: string;
  points?: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Rebuy {
  id: string;
  tournament_id: string;
  player_id: string;
  amount: number;
  chips: number;
  created_at: string;
  player?: Player;
}

export interface Addon {
  id: string;
  tournament_id: string;
  player_id: string;
  amount: number;
  chips: number;
  created_at: string;
  player?: Player;
}

export interface TournamentClock {
  id: string;
  tournament_id: string;
  current_level: number;
  time_remaining: number; // en segundos
  is_paused: boolean;
  is_break: boolean;
  started_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  players: Player[];
  clock: TournamentClock | null;
  loading: boolean;
  error: string | null;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

// Tipos para navegación
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  TournamentView: { tournamentId: string };
  TournamentManagement: { tournamentId: string };
  PlayerManagement: { tournamentId: string };
  CreateTournament: undefined;
  PlayerDetail: { 
    player: {
      user_id: string;
      name: string;
      nickname: string;
      email: string;
      avatar_url?: string | null;
      total_points: number;
      tournaments_played: number;
    };
  };
  Reports: undefined;
  Profile: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tournaments: undefined;
  Clock: undefined;
  Reports: undefined;
  Profile: undefined;
};
