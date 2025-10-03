import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { playerService } from '../services/playerService';
import { tournamentService } from '../services/tournamentService';
import { Tournament, Player, TournamentClock, TournamentState } from '../types';

interface TournamentStore extends TournamentState {
  leaderboard: any[];
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  loadTournaments: () => Promise<void>;
  loadTournament: (id: string) => Promise<void>;
  createTournament: (tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTournament: (id: string, updates: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  startTournament: (id: string) => Promise<void>;
  loadPlayers: (tournamentId: string) => Promise<void>;
  addPlayer: (tournamentId: string, userId: string) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  updatePlayerChips: (playerId: string, chips: number) => Promise<void>;
  eliminatePlayer: (playerId: string, position: number) => Promise<void>;
  loadClock: (tournamentId: string) => Promise<void>;
  startClock: (tournamentId: string) => Promise<void>;
  pauseClock: (tournamentId: string) => Promise<void>;
  resumeClock: (tournamentId: string) => Promise<void>;
  nextLevel: (tournamentId: string) => Promise<void>;
  adjustTime: (tournamentId: string, timeRemaining: number) => Promise<void>;
  loadLeaderboard: () => Promise<void>;
}

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  tournaments: [],
  currentTournament: null,
  players: [],
  clock: null,
  loading: false,
  error: null,
  leaderboard: [],
  leaderboardLoading: false,
  leaderboardError: null,

  loadTournaments: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Asegurar que todos los torneos tengan una estructura por defecto
      const tournamentsWithStructure = (data || []).map(tournament => ({
        ...tournament,
        structure: tournament.structure || []
      }));
      
      set({ tournaments: tournamentsWithStructure, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  loadTournament: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Asegurar que el torneo tenga una estructura por defecto
      const tournamentWithStructure = {
        ...data,
        structure: data.structure || []
      };
      
      set({ currentTournament: tournamentWithStructure, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createTournament: async (tournament) => {
    set({ loading: true, error: null });
    try {
      console.log('📝 Store: Intentando crear torneo:', tournament);
      
      const { data, error } = await supabase
        .from('tournaments')
        .insert([tournament])
        .select()
        .single();

      if (error) {
        console.log('❌ Error de Supabase:', error);
        throw error;
      }
      
      console.log('✅ Torneo creado exitosamente:', data);
      
      const { tournaments } = get();
      set({ 
        tournaments: [data, ...tournaments],
        loading: false 
      });
    } catch (error: any) {
      console.log('❌ Error en createTournament:', error);
      set({ error: error.message, loading: false });
    }
  },

  updateTournament: async (id: string, updates: Partial<Tournament>) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const { tournaments, currentTournament } = get();
      const updatedTournaments = tournaments.map(t => t.id === id ? data : t);
      
      set({ 
        tournaments: updatedTournaments,
        currentTournament: currentTournament?.id === id ? data : currentTournament,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteTournament: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const { tournaments, currentTournament } = get();
      set({ 
        tournaments: tournaments.filter(t => t.id !== id),
        currentTournament: currentTournament?.id === id ? null : currentTournament,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  startTournament: async (id: string) => {
    set({ loading: true, error: null });
    try {
      console.log('🚀 Iniciando torneo:', id);
      const response = await tournamentService.startTournament(id);
      console.log('✅ Torneo iniciado:', response.tournament);
      
      const { tournaments, currentTournament } = get();
      const updatedTournament = response.tournament;
      
      set({
        tournaments: tournaments.map(t => t.id === id ? updatedTournament : t),
        currentTournament: currentTournament?.id === id ? updatedTournament : currentTournament,
        loading: false
      });
    } catch (error: any) {
      console.log('❌ Error iniciando torneo:', error);
      set({ error: error.message, loading: false });
    }
  },

  loadPlayers: async (tournamentId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('🔄 Cargando jugadores del torneo:', tournamentId);
      const response = await playerService.getTournamentPlayers(tournamentId);
      
      // Ordenar jugadores por orden de inscripción descendente (más recientes primero)
      const sortedPlayers = response.players.sort((a, b) => {
        const timeA = new Date(a.registration_time || a.created_at || 0).getTime();
        const timeB = new Date(b.registration_time || b.created_at || 0).getTime();
        return timeB - timeA; // Descendente
      });
      
      console.log('✅ Jugadores cargados:', sortedPlayers.length);
      set({ players: sortedPlayers, loading: false });
    } catch (error: any) {
      console.log('❌ Error cargando jugadores:', error);
      set({ error: error.message, loading: false });
    }
  },

  addPlayer: async (tournamentId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('👤 Agregando jugador:', { tournamentId, userId });
      
      // Obtener información del torneo para saber las fichas iniciales y entry fee
      const { currentTournament } = get();
      const initialChips = currentTournament?.initial_chips || 0;
      const entryFee = currentTournament?.entry_fee || 0;
      
      console.log('🎯 Datos del torneo:', { initialChips, entryFee });

      const response = await playerService.addPlayerToTournament(tournamentId, {
        user_id: userId,
        entry_fee_paid: entryFee,
        initial_chips: initialChips
      });

      console.log('✅ Jugador agregado exitosamente:', response.player);

      const { players } = get();
      console.log('📋 Lista actual antes de agregar:', players.length, 'jugadores');
      
      // Agregar el nuevo jugador al principio de la lista (más reciente primero)
      set({ 
        players: [response.player, ...players],
        loading: false 
      });
      
      console.log('📋 Lista actualizada:', players.length + 1, 'jugadores');
    } catch (error: any) {
      console.log('❌ Error en addPlayer:', error);
      set({ error: error.message, loading: false });
    }
  },

  removePlayer: async (playerId: string) => {
    set({ loading: true, error: null });
    try {
      await playerService.removePlayer(playerId);

      const { players } = get();
      set({ 
        players: players.filter(p => p.id !== playerId),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updatePlayerChips: async (playerId: string, chips: number) => {
    set({ loading: true, error: null });
    try {
      await playerService.updatePlayerChips(playerId, chips);

      const { players } = get();
      const updatedPlayers = players.map(p => 
        p.id === playerId ? { ...p, current_chips: chips } : p
      );
      set({ players: updatedPlayers, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  eliminatePlayer: async (playerId: string, position: number) => {
    set({ loading: true, error: null });
    try {
      const response = await playerService.eliminatePlayer(playerId, position);
      
      const { players } = get();
      const updatedPlayers = players.map(p => 
        p.id === playerId 
          ? { ...p, is_eliminated: true, final_position: position, eliminated_at: new Date().toISOString(), is_active: false }
          : p
      );
      set({ players: updatedPlayers, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  loadClock: async (tournamentId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('🔄 Cargando reloj del torneo:', tournamentId);
      const response = await tournamentService.getTournamentClock(tournamentId);
      console.log('✅ Reloj cargado:', response.clock);
      set({ clock: response.clock, loading: false });
    } catch (error: any) {
      console.log('❌ Error cargando reloj:', error);
      set({ error: error.message, loading: false });
    }
  },

  startClock: async (tournamentId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('🔄 Iniciando reloj del torneo:', tournamentId);
      const { currentTournament } = get();
      
      if (!currentTournament?.structure) {
        throw new Error('No hay estructura de blinds configurada');
      }

      const clockData = {
        level_duration_minutes: 20, // Duración por defecto
        blind_schedule: currentTournament.structure.map(level => ({
          level: level.level,
          small_blind: level.small_blind,
          big_blind: level.big_blind,
          duration_minutes: level.duration || 20,
          is_break: level.is_break || false
        }))
      };

      const response = await tournamentService.createTournamentClock(tournamentId, clockData);
      console.log('✅ Reloj iniciado:', response.clock);
      set({ clock: response.clock, loading: false });
    } catch (error: any) {
      console.log('❌ Error iniciando reloj:', error);
      set({ error: error.message, loading: false });
    }
  },

  pauseClock: async (tournamentId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('⏸️ Pausando reloj del torneo:', tournamentId);
      const response = await tournamentService.togglePause(tournamentId);
      console.log('✅ Reloj pausado:', response.clock);
      set({ clock: response.clock, loading: false });
    } catch (error: any) {
      console.log('❌ Error pausando reloj:', error);
      set({ error: error.message, loading: false });
    }
  },

  resumeClock: async (tournamentId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('▶️ Reanudando reloj del torneo:', tournamentId);
      const response = await tournamentService.togglePause(tournamentId);
      console.log('✅ Reloj reanudado:', response.clock);
      set({ clock: response.clock, loading: false });
    } catch (error: any) {
      console.log('❌ Error reanudando reloj:', error);
      set({ error: error.message, loading: false });
    }
  },

  nextLevel: async (tournamentId: string) => {
    set({ loading: true, error: null });
    try {
      const { clock, currentTournament } = get();
      if (!clock || !currentTournament) return;

      const nextLevel = clock.current_level + 1;
      const structure = currentTournament.structure;
      const levelData = structure.find(s => s.level === nextLevel);
      
      if (!levelData) return;

      const { error } = await supabase
        .from('tournament_clocks')
        .update({ 
          current_level: nextLevel,
          time_remaining: levelData.duration * 60, // Convertir a segundos
          is_break: levelData.is_break
        })
        .eq('tournament_id', tournamentId);

      if (error) throw error;

      set({ 
        clock: { 
          ...clock, 
          current_level: nextLevel,
          time_remaining: levelData.duration * 60,
          is_break: levelData.is_break
        },
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  adjustTime: async (tournamentId: string, timeRemaining: number) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('tournament_clocks')
        .update({ time_remaining: timeRemaining })
        .eq('tournament_id', tournamentId);

      if (error) throw error;

      const { clock } = get();
      if (clock) {
        set({ 
          clock: { ...clock, time_remaining },
          loading: false 
        });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  loadLeaderboard: async () => {
    set({ leaderboardLoading: true, leaderboardError: null });
    try {
      console.log('🔄 Cargando tabla de posiciones...');
      const response = await tournamentService.getLeaderboard();
      console.log('✅ Tabla de posiciones cargada:', response.leaderboard.length, 'jugadores');
      set({ 
        leaderboard: response.leaderboard, 
        leaderboardLoading: false 
      });
    } catch (error: any) {
      console.log('❌ Error cargando tabla de posiciones:', error);
      set({ 
        leaderboardError: error.message, 
        leaderboardLoading: false 
      });
    }
  },
}));
