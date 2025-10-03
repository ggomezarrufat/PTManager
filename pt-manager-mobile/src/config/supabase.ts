import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de Supabase usando variables de entorno
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bxzzmpxzubetxgbdakmy.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enptcHh6dWJldHhnYmRha215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODc4OTYsImV4cCI6MjA2OTY2Mzg5Nn0.Wq8_RUlZ0deiIUeFsP2PAbT66ObWkkBO0PGwQpX3NAw';

console.log('🔧 Supabase Mobile: Configuración desde variables de entorno');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? '✅ Configurado' : '❌ Faltante');
console.log('Variables de entorno:', {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ Usando valor por defecto',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Usando valor por defecto'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export default supabase;
