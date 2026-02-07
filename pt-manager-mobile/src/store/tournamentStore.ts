import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { playerService } from '../services/playerService';
import { tournamentService } from '../services/tournamentService';
import { Tournament, Player, TournamentClock, TournamentState } from '../types';

interface TournamentStore extends TournamentState {
  leaderboard: any[];
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  tournamentStats: {
    activePlayers: number;
    totalRebuys: number;
    totalAddons: number;
    averageChipsPerActivePlayer: number;
    lastUpdated: string;
  } | null;
  tournamentStatsLoading: boolean;
  tournamentStatsError: string | null;
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
  eliminatePlayer: (playerId: string, position: number, eliminatedBy?: string, pointsEarned?: number) => Promise<void>;
  loadClock: (tournamentId: string) => Promise<void>;
  startClock: (tournamentId: string) => Promise<void>;
  pauseClock: (tournamentId: string) => Promise<void>;
  resumeClock: (tournamentId: string) => Promise<void>;
  nextLevel: (tournamentId: string) => Promise<void>;
  prevLevel: (tournamentId: string) => Promise<void>;
  adjustTime: (tournamentId: string, adjustmentSeconds: number) => Promise<void>;
  finishTournament: (tournamentId: string) => Promise<void>;
  registerRebuy: (playerId: string, amount: number, chips: number, adminUserId: string) => Promise<void>;
  registerAddon: (playerId: string, amount: number, chips: number, adminUserId: string) => Promise<void>;
  loadLeaderboard: () => Promise<void>;
  loadTournamentStats: (tournamentId: string) => Promise<void>;
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
  tournamentStats: null,
  tournamentStatsLoading: false,
  tournamentStatsError: null,

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
        structure: tournament.blind_structure || []
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
        structure: data.blind_structure || []
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
    console.log('🚀 INICIANDO removePlayer con ID:', playerId);
    set({ loading: true, error: null });
    try {
      console.log('🗑️ Eliminando jugador:', playerId);
      const response = await playerService.removePlayer(playerId);
      console.log('✅ Respuesta del servidor:', response);

      // Recargar la lista de jugadores desde el servidor
      const { currentTournament } = get();
      console.log('🏆 Torneo actual:', currentTournament?.id);
      
      if (currentTournament?.id) {
        console.log('🔄 Recargando lista de jugadores...');
        await get().loadPlayers(currentTournament.id);
        console.log('📋 Lista recargada, jugadores actuales:', get().players.length);
      } else {
        console.log('❌ No hay torneo actual para recargar');
      }

      console.log('✅ Lista de jugadores actualizada');
    } catch (error: any) {
      console.log('❌ Error eliminando jugador:', error);
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

  eliminatePlayer: async (playerId: string, position: number, eliminatedBy?: string, pointsEarned?: number) => {
    set({ loading: true, error: null });
    try {
      console.log('🏁 Eliminando jugador:', playerId, 'con posición:', position, 'por admin:', eliminatedBy);
      
      // Verificar que el jugador existe en el estado local antes de intentar eliminarlo
      const { players } = get();
      console.log('📋 Lista de jugadores disponibles:', players.map(p => ({ id: p.id, name: p.user?.name, is_eliminated: p.is_eliminated })));
      
      const playerToEliminate = players.find(p => p.id === playerId);
      if (!playerToEliminate) {
        throw new Error(`Jugador con ID ${playerId} no encontrado en el estado local`);
      }
      console.log('✅ Jugador encontrado en estado local:', playerToEliminate.user?.name || 'Sin nombre');
      
      // Verificar si el jugador ya está eliminado
      if (playerToEliminate.is_eliminated) {
        throw new Error(`El jugador ${playerToEliminate.user?.name} ya está eliminado`);
      }
      
      // Recargar jugadores para asegurar sincronización con el backend
      const { currentTournament } = get();
      if (currentTournament?.id) {
        console.log('🔄 Recargando jugadores antes de eliminar para sincronizar...');
        await get().loadPlayers(currentTournament.id);
        
        // Verificar nuevamente que el jugador existe después de recargar
        const { players: refreshedPlayers } = get();
        const refreshedPlayer = refreshedPlayers.find(p => p.id === playerId);
        if (!refreshedPlayer) {
          throw new Error(`Jugador con ID ${playerId} no encontrado en el backend después de recargar`);
        }
        console.log('✅ Jugador confirmado en backend después de recargar:', refreshedPlayer.user?.name || 'Sin nombre');
      }
      
      // Verificar directamente en el backend si el jugador existe
      try {
        console.log('🔍 Verificando existencia del jugador en backend...');
        const checkResponse = await playerService.checkPlayerExists(playerId);
        console.log('✅ Jugador verificado en backend:', checkResponse.player);
      } catch (checkError) {
        console.log('❌ Jugador no encontrado en backend:', checkError);
        throw new Error(`El jugador no existe en el backend: ${checkError.message}`);
      }
      
      const response = await playerService.eliminatePlayer(playerId, currentTournament.id, position, eliminatedBy, pointsEarned);
      console.log('✅ Respuesta completa del servidor:', JSON.stringify(response, null, 2));
      console.log('✅ Jugador actualizado del backend:', response.player);
      console.log('✅ Valores calculados del backend:', response.calculated_values);
      
      // Actualizar estado local con los datos del backend
      if (response.player) {
        console.log('🔄 Actualizando estado local con datos del backend');
        set((state) => {
          const updatedPlayers = state.players.map(p =>
            p.id === playerId
              ? {
                  ...p,
                  ...response.player,
                  // Asegurar que los campos estén actualizados
                  is_active: false,
                  is_eliminated: true
                }
              : p
          );
          console.log('📋 Jugador actualizado en estado local:', updatedPlayers.find(p => p.id === playerId));
          return { players: updatedPlayers };
        });
      } else {
        // Fallback si el backend no devuelve el player actualizado
        set((state) => ({
          players: state.players.map(p =>
            p.id === playerId
              ? {
                  ...p,
                  is_active: false,
                  is_eliminated: true,
                  final_position: position,
                  points_earned: pointsEarned || 0,
                  eliminated_at: new Date().toISOString(),
                  eliminated_by: eliminatedBy
                }
              : p
          )
        }));
      }
      
      // Recargar la lista de jugadores desde el servidor para sincronizar
      if (currentTournament?.id) {
        console.log('🔄 Recargando lista de jugadores después de eliminar...');
        await get().loadPlayers(currentTournament.id);
        console.log('📋 Lista recargada después de eliminar');
        
        // Verificar el estado final del jugador eliminado
        const { players } = get();
        const eliminatedPlayer = players.find(p => p.id === playerId);
        console.log('🏁 Estado final del jugador eliminado:', eliminatedPlayer);
      }
      
      set({ loading: false });
    } catch (error: any) {
      console.log('❌ Error eliminando jugador:', error);
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
      const { clock } = get();
      if (!clock) return;

      const nextLevel = clock.current_level + 1;
      console.log('🔄 Avanzando al nivel:', nextLevel);
      
      const response = await tournamentService.changeLevel(tournamentId, nextLevel);
      console.log('✅ Nivel avanzado:', response);
      
      // Recargar el reloj después del cambio
      await get().loadClock(tournamentId);
      set({ loading: false });
    } catch (error: any) {
      console.log('❌ Error avanzando nivel:', error);
      set({ error: error.message, loading: false });
    }
  },

  prevLevel: async (tournamentId: string) => {
    set({ loading: true, error: null });
    try {
      const { clock } = get();
      if (!clock || clock.current_level <= 1) return;

      const prevLevel = clock.current_level - 1;
      console.log('🔄 Retrocediendo al nivel:', prevLevel);
      
      const response = await tournamentService.changeLevel(tournamentId, prevLevel);
      console.log('✅ Nivel retrocedido:', response);
      
      // Recargar el reloj después del cambio
      await get().loadClock(tournamentId);
      set({ loading: false });
    } catch (error: any) {
      console.log('❌ Error retrocediendo nivel:', error);
      set({ error: error.message, loading: false });
    }
  },

  adjustTime: async (tournamentId: string, adjustmentSeconds: number) => {
    set({ loading: true, error: null });
    try {
      console.log('🔄 Ajustando tiempo:', adjustmentSeconds, 'segundos');
      
      const response = await tournamentService.adjustTime(tournamentId, adjustmentSeconds);
      console.log('✅ Tiempo ajustado:', response);
      
      // Recargar el reloj después del ajuste
      await get().loadClock(tournamentId);
      set({ loading: false });
    } catch (error: any) {
      console.log('❌ Error ajustando tiempo:', error);
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

  loadTournamentStats: async (tournamentId: string) => {
    set({ tournamentStatsLoading: true, tournamentStatsError: null });
    try {
      console.log('🔄 Cargando estadísticas del torneo:', tournamentId);
      
      // Obtener jugadores activos desde el estado local
      const { players } = get();
      const activePlayersList = players.filter(p => p.is_active && !p.is_eliminated);
      const activePlayers = activePlayersList.length;
      
      // Calcular rebuys y addons desde los jugadores cargados
      const totalRebuys = players.reduce((sum, player) => sum + (player.rebuys_count || 0), 0);
      const totalAddons = players.reduce((sum, player) => sum + (player.addons_count || 0), 0);
      
      // Promedio de fichas por jugador activo (sin eliminados). API puede devolver chips o current_chips
      const chipValue = (p: Player) => (p as any).current_chips ?? p.chips ?? 0;
      const averageChipsPerActivePlayer = activePlayers > 0
        ? Math.round(
            activePlayersList.reduce((sum, p) => sum + chipValue(p), 0) / activePlayers
          )
        : 0;
      
      console.log('✅ Estadísticas cargadas:', { activePlayers, totalRebuys, totalAddons, averageChipsPerActivePlayer });
      
      set({ 
        tournamentStats: {
          activePlayers,
          totalRebuys,
          totalAddons,
          averageChipsPerActivePlayer,
          lastUpdated: new Date().toISOString()
        },
        tournamentStatsLoading: false 
      });
    } catch (error: any) {
      console.log('❌ Error cargando estadísticas del torneo:', error);
      set({ 
        tournamentStatsError: error.message, 
        tournamentStatsLoading: false 
      });
    }
  },

  finishTournament: async (tournamentId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('🏁 Finalizando torneo:', tournamentId);
      
      const response = await tournamentService.finishTournament(tournamentId);
      console.log('✅ Torneo finalizado:', response.tournament);
      
      // Actualizar el estado del torneo actual
      const { currentTournament } = get();
      if (currentTournament && currentTournament.id === tournamentId) {
        set({ 
          currentTournament: {
            ...currentTournament,
            status: 'finished',
            finished_at: response.tournament.finished_at
          },
          loading: false 
        });
      }
      
      // Recargar el reloj para que se pausé
      await get().loadClock(tournamentId);
      
    } catch (error: any) {
      console.log('❌ Error finalizando torneo:', error);
      set({ error: error.message, loading: false });
    }
  },

  registerRebuy: async (playerId: string, amount: number, chips: number, adminUserId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('🔄 Registrando rebuy:', { playerId, amount, chips, adminUserId });
      
      const response = await playerService.registerRebuy(playerId, {
        amount,
        chips_received: chips,
        admin_user_id: adminUserId
      });
      console.log('✅ Rebuy registrado:', response);
      
      // Recargar la lista de jugadores para actualizar las fichas
      const { currentTournament } = get();
      if (currentTournament?.id) {
        await get().loadPlayers(currentTournament.id);
      }
      
      set({ loading: false });
    } catch (error: any) {
      console.log('❌ Error registrando rebuy:', error);
      set({ error: error.message, loading: false });
    }
  },

  registerAddon: async (playerId: string, amount: number, chips: number, adminUserId: string) => {
    set({ loading: true, error: null });
    try {
      console.log('🔄 Registrando addon:', { playerId, amount, chips, adminUserId });
      
      const response = await playerService.registerAddon(playerId, {
        amount,
        chips_received: chips,
        admin_user_id: adminUserId
      });
      console.log('✅ Addon registrado:', response);
      
      // Recargar la lista de jugadores para actualizar las fichas
      const { currentTournament } = get();
      if (currentTournament?.id) {
        await get().loadPlayers(currentTournament.id);
      }
      
      set({ loading: false });
    } catch (error: any) {
      console.log('❌ Error registrando addon:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Sincronización periódica del reloj del torneo
  syncClockPeriodically: async (tournamentId: string) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await tournamentService.getTournamentClock(tournamentId);
        if (response.clock) {
          set({ clock: response.clock });
        }
      } catch (error: any) {
        console.log('❌ Error en sincronización periódica del reloj:', error);
      }
    }, 5000); // Cada 5 segundos

    return intervalId;
  },
}));
