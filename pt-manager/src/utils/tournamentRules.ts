import { Tournament, TournamentClock } from '../types';

/**
 * Determina si se pueden hacer rebuys en el nivel actual del torneo
 * @param tournament - Configuración del torneo
 * @param clock - Estado actual del reloj del torneo
 * @returns true si se permiten rebuys, false en caso contrario
 */
export const canMakeRebuy = (tournament: Tournament, clock: TournamentClock | null): boolean => {
  if (!clock) return false;
  
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
  if (!clock) return false;
  
  // Los addons solo se permiten durante el primer nivel de pausa
  // Esto significa que el reloj debe estar pausado y en el nivel 1
  return clock.is_paused && clock.current_level === 1;
};

/**
 * Obtiene el mensaje explicativo para el estado de rebuys
 * @param tournament - Configuración del torneo
 * @param clock - Estado actual del reloj del torneo
 * @returns mensaje explicativo
 */
export const getRebuyStatusMessage = (tournament: Tournament, clock: TournamentClock | null): string => {
  if (!clock) return 'Reloj no disponible';
  
  if (canMakeRebuy(tournament, clock)) {
    const remainingLevels = tournament.last_level_rebuy - clock.current_level + 1;
    return `Rebuys permitidos (${remainingLevels} nivel${remainingLevels > 1 ? 'es' : ''} restante${remainingLevels > 1 ? 's' : ''})`;
  } else {
    return `Rebuys no permitidos (nivel ${clock.current_level} > ${tournament.last_level_rebuy})`;
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
  
  if (canMakeAddon(tournament, clock)) {
    return 'Addons permitidos (primer nivel de pausa)';
  } else {
    if (!clock.is_paused) {
      return 'Addons solo disponibles durante pausas';
    } else if (clock.current_level !== 1) {
      return `Addons solo disponibles en el primer nivel (actual: ${clock.current_level})`;
    } else {
      return 'Addons no disponibles';
    }
  }
};

/**
 * Obtiene el color del indicador de estado para rebuys
 * @param tournament - Configuración del torneo
 * @param clock - Estado actual del reloj del torneo
 * @returns color del indicador
 */
export const getRebuyStatusColor = (tournament: Tournament, clock: TournamentClock | null): 'success' | 'warning' | 'error' => {
  if (!clock) return 'error';
  
  if (canMakeRebuy(tournament, clock)) {
    const remainingLevels = tournament.last_level_rebuy - clock.current_level + 1;
    return remainingLevels <= 2 ? 'warning' : 'success';
  } else {
    return 'error';
  }
};

/**
 * Obtiene el color del indicador de estado para addons
 * @param tournament - Configuración del torneo
 * @param clock - Estado actual del reloj del torneo
 * @returns color del indicador
 */
export const getAddonStatusColor = (tournament: Tournament, clock: TournamentClock | null): 'success' | 'warning' | 'error' => {
  if (!clock) return 'error';
  
  if (canMakeAddon(tournament, clock)) {
    return 'success';
  } else {
    return 'error';
  }
};
