import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { User, AuthState } from '../types';

interface AuthStore extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string, nickname?: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      console.log('🔐 Intentando login con:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('❌ Error de autenticación:', error.message);
        
        // Manejar errores específicos
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email o contraseña incorrectos');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor confirma tu email antes de iniciar sesión');
        } else if (error.message.includes('fetch failed') || error.message.includes('Network request failed')) {
          throw new Error('Error de conexión. Verifica tu internet e intenta nuevamente');
        } else {
          throw new Error(`Error de autenticación: ${error.message}`);
        }
      }

      if (data.user) {
        console.log('✅ Usuario autenticado:', data.user.email);
        
        // Obtener perfil completo del usuario
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.log('⚠️ Error obteniendo perfil:', profileError.message);
          // Usar datos básicos del usuario si no se puede obtener el perfil
          set({ 
            user: {
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || '',
              nickname: data.user.user_metadata?.nickname || '',
              avatar_url: data.user.user_metadata?.avatar_url || '',
              is_admin: false,
              created_at: data.user.created_at,
              updated_at: data.user.updated_at,
            },
            loading: false 
          });
        } else {
          set({ 
            user: {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              nickname: profile.nickname,
              avatar_url: profile.avatar_url,
              is_admin: profile.is_admin,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            },
            loading: false 
          });
        }
      }
    } catch (error: any) {
      console.log('❌ Error en signIn:', error.message);
      set({ error: error.message, loading: false });
    }
  },

  signUp: async (email: string, password: string, fullName?: string, nickname?: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            nickname: nickname,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // El perfil se crea automáticamente con el trigger de la base de datos
        set({ loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, loading: false, error: null });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  loadUser: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        set({ 
          user: {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            nickname: profile.nickname,
            avatar_url: profile.avatar_url,
            is_admin: profile.is_admin,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          },
          loading: false 
        });
      } else {
        set({ user: null, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return;

    set({ loading: true });
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      set({ 
        user: { ...user, ...updates },
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
