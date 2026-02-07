/**
 * Utilidades para manejo de fechas y timestamps.
 * 
 * Supabase puede devolver timestamps sin indicador de timezone,
 * lo cual causa que new Date() los interprete como hora local
 * en lugar de UTC. Esto genera desfases en el cálculo del reloj.
 */

/**
 * Parsea un timestamp de Supabase garantizando interpretación en UTC.
 * Si el string no tiene indicador de timezone (Z, +HH:MM, -HH:MM),
 * se le agrega 'Z' para forzar parsing como UTC.
 * 
 * @param {string|Date|null|undefined} timestamp - El timestamp a parsear
 * @returns {Date} Objeto Date correctamente interpretado en UTC
 */
function parseUtcTimestamp(timestamp) {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;

  const str = String(timestamp);
  // Verificar si ya tiene indicador de timezone
  const hasTimezone = str.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(str) || /[+-]\d{2}$/.test(str);
  return hasTimezone ? new Date(str) : new Date(str + 'Z');
}

module.exports = { parseUtcTimestamp };
