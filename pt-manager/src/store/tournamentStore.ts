import { create } from 'zustand';
import { 
  Tournament, 
  TournamentPlayer, 
  TournamentClock, 
  TournamentStats 
} from '../types';
import { 
  tournamentService, 
  playerService, 
  clockService, 
  rebuyService, 
  addonService 
} from '../services/apiService';

interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  players: TournamentPlayer[];
  clock: TournamentClock | null;
  stats: TournamentStats | null;
  loading: boolean;
  error: string | null;
}

interface TournamentActions {
  setTournaments: (tournaments: Tournament[]) => void;
  setCurrentTournament: (tournament: Tournament | null) => void;
  setPlayers: (players: TournamentPlayer[]) => void;
  setClock: (clock: TournamentClock | null) => void;
  setStats: (stats: TournamentStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  loadTournaments: () => Promise<void>;
  loadTournament: (id: string) => Promise<void>;
  createTournament: (tournament: any) => Promise<void>;
  startTournament: (id: string) => Promise<void>;
  finishTournament: (id: string) => Promise<void>;
  
  loadPlayers: (tournamentId: string) => Promise<void>;
  addPlayer: (tournamentId: string, playerData: any) => Promise<void>;
  eliminatePlayer: (playerId: string, position: number) => Promise<void>;
  
  loadClock: (tournamentId: string) => Promise<void>;
  togglePause: (tournamentId: string) => Promise<void>;
  
  subscribeToTournament: (tournamentId: string) => void;
  unsubscribeFromTournament: (tournamentId: string) => void;
  
  calculateStats: () => void;
}

export const useTournamentStore = create<TournamentState & TournamentActions>((set, get) => ({
  tournaments: [],
  currentTournament: null,
  players: [],
  clock: null,
  stats: null,
  loading: false,
  error: null,

  setTournaments: (tournaments) => set({ tournaments }),
  setCurrentTournament: (tournament) => set({ currentTournament: tournament }),
  setPlayers: (players) => set({ players }),
  setClock: (clock) => set({ clock }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  loadTournaments: async () => {
    try {
      set({ loading: true, error: null });
      const response = await tournamentService.getTournaments(1, 50);
      set({ tournaments: response.tournaments });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error loading tournaments' });
    } finally {
      set({ loading: false });
    }
  },

  loadTournament: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const response = await tournamentService.getTournament(id); const tournament = response.tournament;
      set({ currentTournament: tournament });
      
      if (tournament) {
        // Cargar jugadores y reloj del torneo
        await get().loadPlayers(id);
        await get().loadClock(id);
        get().calculateStats();
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error loading tournament' });
    } finally {
      set({ loading: false });
    }
  },

  createTournament: async (tournamentData: any) => {
    try {
      set({ loading: true, error: null });
      const response = await tournamentService.createTournament(tournamentData); const newTournament = response.tournament;
      set((state) => ({ 
        tournaments: [...state.tournaments, newTournament] 
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error creating tournament' });
    } finally {
      set({ loading: false });
    }
  },

  startTournament: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const response = await tournamentService.startTournament(id); const updatedTournament = response.tournament;
      
      set((state) => ({
        tournaments: state.tournaments.map(t => 
          t.id === id ? updatedTournament : t
        ),
        currentTournament: state.currentTournament?.id === id 
          ? updatedTournament
          : state.currentTournament
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error starting tournament' });
    } finally {
      set({ loading: false });
    }
  },

  finishTournament: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const response = await tournamentService.finishTournament(id); const updatedTournament = response.tournament;
      
      set((state) => ({
        tournaments: state.tournaments.map(t => 
          t.id === id ? updatedTournament : t
        ),
        currentTournament: state.currentTournament?.id === id 
          ? updatedTournament
          : state.currentTournament
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error finishing tournament' });
    } finally {
      set({ loading: false });
    }
  },

  loadPlayers: async (tournamentId: string) => {
    try {
      const response = await playerService.getTournamentPlayers(tournamentId); const players = response.players;
      set({ players });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error loading players' });
    }
  },

  addPlayer: async (tournamentId: string, playerData: any) => {
    try {
      const response = await playerService.addPlayerToTournament(tournamentId, playerData); const newPlayer = response.player;
      set((state) => ({ 
        players: [...state.players, newPlayer] 
      }));
      get().calculateStats();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error adding player' });
    }
  },

  eliminatePlayer: async (playerId: string, position: number) => {
    try {
      await playerService.eliminatePlayer(playerId, position);
      
      // Actualizar estado local
      set((state) => ({
        players: state.players.map(p => 
          p.id === playerId 
            ? { ...p, is_active: false, is_eliminated: true, final_position: position }
            : p
        )
      }));
      get().calculateStats();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error eliminating player' });
    }
  },

  loadClock: async (tournamentId: string) => {
    try {
      const response = await clockService.getTournamentClock(tournamentId); const clock = response.clock;
      set({ clock });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error loading clock' });
    }
  },

  togglePause: async (tournamentId: string) => {
    try {
      const response = await clockService.togglePause(tournamentId); const updatedClock = response.clock;
      set({ clock: updatedClock });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error toggling pause' });
    }
  },

  subscribeToTournament: (tournamentId: string) => {
    console.warn('subscribeToTournament no implementado aún');
  },

  unsubscribeFromTournament: (tournamentId: string) => {
    console.warn('unsubscribeFromTournament no implementado aún');
  },

  calculateStats: () => {
    const { players, currentTournament } = get();
    
    if (!currentTournament || !players.length) {
      set({ stats: null });
      return;
    }

    const totalPlayers = players.length;
    const activePlayers = players.filter(p => p.is_active && !p.is_eliminated).length;
    const eliminatedPlayers = players.filter(p => p.is_eliminated).length;
    
    const totalPrizePool = players.reduce((sum, p) => sum + p.entry_fee_paid, 0);
    const totalChips = players.reduce((sum, p) => sum + p.current_chips, 0);
    const averageChips = totalChips / totalPlayers;

    const stats: TournamentStats = {
      total_players: totalPlayers,
      active_players: activePlayers,
      eliminated_players: eliminatedPlayers,
      total_prize_pool: totalPrizePool,
      average_chips: averageChips,
      total_rebuys: 0,
      total_addons: 0
    };

    set({ stats });
  }
}));
