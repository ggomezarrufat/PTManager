import { Tournament, TournamentClock } from '../types';

/**
 * Determina si se pueden hacer rebuys en el nivel actual del torneo
 * @param tournament - Configuración del torneo
 * @param clock - Estado actual del reloj del torneo
 * @param player - Datos del jugador (opcional, para validar límite individual)
 * @returns true si se permiten rebuys, false en caso contrario
 */
export const canMakeRebuy = (tournament: Tournament, clock: TournamentClock | null, player?: any): boolean => {
  if (!clock) {
    return false;
  }
  
  // Verificar si last_level_rebuy está definido
  if (tournament.last_level_rebuy === undefined || tournament.last_level_rebuy === null) {
    console.log('⚠️ canMakeRebuy: last_level_rebuy no está definido, usando valor por defecto de 5');
    tournament.last_level_rebuy = 5; // Valor por defecto
  }
  
  // Verificar límite de rebuys por jugador si se proporciona información del jugador
  if (player) {
    const currentRebuys = player.rebuys_count || 0;
    const maxRebuys = tournament.max_rebuys || 3; // Valor por defecto
    
    if (currentRebuys >= maxRebuys) {
      return false;
    }
  }
  
  
  // Los rebuys se permiten hasta el nivel last_level_rebuy inclusive
  return clock.current_level <= tournament.last_level_rebuy;
};

/**
 * Determina si se pueden hacer addons en el nivel actual del torneo
 * @param tournament - Configuración del torneo
 * @param clock - Estado actual del reloj del torneo
 * @returns true si se permiten addons, false en caso contrario
 */
export const canMakeAddon = (tournament: Tournament, clock: TournamentClock | null): boolean => {
  if (!clock) {
    return false;
  }
  
  // Obtener el nivel actual de la estructura de blinds
  const currentLevelData = tournament.blind_structure?.[clock.current_level - 1];
  
  // Los addons se permiten si:
  // 1. El torneo está pausado Y
  // 2. El nivel actual está marcado como pausa Y
  // 3. En ese nivel se permiten addons
  if (clock.is_paused && currentLevelData?.is_pause && currentLevelData?.addons_allowed) {
    return true;
  }
  
  // Mantener compatibilidad con la lógica anterior (primer nivel de pausa)
  if (clock.is_paused && clock.current_level === 1) {
    return true;
  }
  
  return false;
};

/**
 * Obtiene el mensaje explicativo para el estado de rebuys
 * @param tournament - Configuración del torneo
 * @param clock - Estado actual del reloj del torneo
 * @param player - Datos del jugador (opcional, para mostrar límite individual)
 * @returns mensaje explicativo
 */
export const getRebuyStatusMessage = (tournament: Tournament, clock: TournamentClock | null, player?: any): string => {
  if (!clock) return 'Reloj no disponible';
  
  // Asegurar que last_level_rebuy esté definido
  const lastLevelRebuy = tournament.last_level_rebuy ?? 5;
  const maxRebuys = tournament.max_rebuys ?? 3;
  
  // Verificar límite de rebuys por jugador
  if (player) {
    const currentRebuys = player.rebuys_count || 0;
    if (currentRebuys >= maxRebuys) {
      return `Límite de rebuys alcanzado (${currentRebuys}/${maxRebuys})`;
    }
  }
  
  if (canMakeRebuy(tournament, clock, player)) {
    const remainingLevels = lastLevelRebuy - clock.current_level + 1;
    const playerInfo = player ? ` (${player.rebuys_count || 0}/${maxRebuys})` : '';
    return `Rebuys permitidos (${remainingLevels} nivel${remainingLevels > 1 ? 'es' : ''} restante${remainingLevels > 1 ? 's' : ''}${playerInfo})`;
  } else {
    return `Rebuys no disponibles (máximo nivel ${lastLevelRebuy})`;
  }
};

/**
 * Obtiene el mensaje explicativo para el estado de addons
 * @param tournament - Configuración del torneo
 * @param clock - Estado actual del reloj del torneo
 * @returns mensaje explicativo
 */
export const getAddonStatusMessage = (tournament: Tournament, clock: TournamentClock | null): string => {
  if (!clock) return 'Reloj no disponible';
  
  const currentLevelData = tournament.blind_structure?.[clock.current_level - 1];
  
  if (canMakeAddon(tournament, clock)) {
    if (currentLevelData?.is_pause && currentLevelData?.addons_allowed) {
      return `Addons permitidos (nivel ${clock.current_level} - pausa con addons)`;
    } else {
      return 'Addons permitidos (nivel de pausa)';
    }
  } else {
    if (!clock.is_paused) {
      return 'Addons solo disponibles durante pausas';
    } else if (currentLevelData?.is_pause && !currentLevelData?.addons_allowed) {
      return `Pausa sin addons (nivel ${clock.current_level})`;
    } else if (!currentLevelData?.is_pause) {
      return `Nivel ${clock.current_level} no es pausa`;
    } else {
      return 'Addons no disponibles en este momento';
    }
  }
};
