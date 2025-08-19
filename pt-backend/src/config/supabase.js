const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase para el backend
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key para operaciones de admin
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Anon key para operaciones normales

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is required');
}

if (!supabaseServiceKey && !supabaseAnonKey) {
  throw new Error('Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required');
}

// Cliente con permisos de administrador (service role)
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

// Cliente normal (anon key)
const supabase = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey);

/**
 * Obtiene el cliente de Supabase apropiado según el contexto
 * @param {boolean} useAdmin - Si usar el cliente con permisos de admin
 * @returns {Object} Cliente de Supabase
 */
function getSupabaseClient(useAdmin = false) {
  if (useAdmin && supabaseAdmin) {
    return supabaseAdmin;
  }
  return supabase;
}

/**
 * Verifica la configuración de Supabase
 * @returns {Object} Estado de la configuración
 */
function checkSupabaseConfig() {
  return {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasAnonKey: !!supabaseAnonKey,
    adminAvailable: !!supabaseAdmin,
    url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : null
  };
}

module.exports = {
  supabase,
  supabaseAdmin,
  getSupabaseClient,
  checkSupabaseConfig
};

