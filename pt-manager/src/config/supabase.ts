import { createClient } from '@supabase/supabase-js';

// Configuración estática de Supabase
const supabaseUrl = 'https://bxzzmpxzubetxgbdakmy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw';

console.log('🔧 Supabase: Configuración estática');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? '✅ Configurado' : '❌ Faltante');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Log de configuración
console.log('🔧 Supabase: Configuración estática cargada');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? '✅ Configurado' : '❌ Faltante');

export default supabase;
