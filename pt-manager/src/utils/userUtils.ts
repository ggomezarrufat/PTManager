import { User } from '../types';

/**
 * Obtiene el nombre de visualización del usuario
 * Prioriza el sobrenombre, si no existe usa el nombre
 */
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Usuario';
  
  // Si tiene sobrenombre, usarlo
  if (user.nickname && user.nickname.trim()) {
    return user.nickname.trim();
  }
  
  // Si no tiene sobrenombre pero tiene nombre, usarlo
  if (user.name && user.name.trim()) {
    return user.name.trim();
  }
  
  // Si no tiene ni sobrenombre ni nombre, usar email
  if (user.email) {
    return user.email.split('@')[0]; // Primera parte del email
  }
  
  return 'Usuario';
};

/**
 * Obtiene el nombre completo del usuario
 */
export const getUserFullName = (user: User | null): string => {
  if (!user) return 'Usuario';
  
  if (user.name && user.name.trim()) {
    return user.name.trim();
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Usuario';
};

/**
 * Verifica si el usuario tiene un sobrenombre configurado
 */
export const hasNickname = (user: User | null): boolean => {
  return !!(user?.nickname && user.nickname.trim());
};
