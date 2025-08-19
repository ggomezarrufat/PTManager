import { create } from 'zustand';
import { User } from '../types';
import { authService, ApiError } from '../services/apiService';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => Promise<void>;
  loadUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, nickname?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // Estado inicial
  user: null,
  loading: true,
  error: null,

  // Acciones
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  signOut: async () => {
    try {
      console.log('🚪 AuthStore: Cerrando sesión...');
      set({ loading: true });
      await authService.logout();
      set({ user: null, error: null });
      console.log('✅ AuthStore: Sesión cerrada exitosamente');
    } catch (error) {
      console.error('❌ AuthStore: Error cerrando sesión:', error);
      set({ error: error instanceof Error ? error.message : 'Error signing out' });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      console.log('🔐 AuthStore: Iniciando login...');
      set({ loading: true, error: null });
      
      const response = await authService.login(email, password);
      // Guardar refresh token si viene
      if (response.session?.refresh_token) {
        localStorage.setItem('refreshToken', response.session.refresh_token);
      }
      set({ user: response.user, error: null });
      
      console.log('✅ AuthStore: Login exitoso');
    } catch (error: unknown) {
      console.error('❌ AuthStore: Error en login:', error);
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Error al iniciar sesión';
      set({ error: errorMessage });
      // Propagar para que el formulario muestre el mensaje
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  register: async (email: string, password: string, name: string, nickname?: string) => {
    try {
      console.log('📝 AuthStore: Iniciando registro...');
      set({ loading: true, error: null });
      
      const response = await authService.register({ email, password, name, nickname });
      
      // Auto-login después del registro
      set({ user: response.user, error: null });      
      console.log('✅ AuthStore: Registro completado');
    } catch (error: unknown) {
      console.error('❌ AuthStore: Error en registro:', error);
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Error al registrar usuario';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadUser: async () => {
    try {
      console.log('🔄 AuthStore: Iniciando loadUser...');
      set({ loading: true, error: null });
      
      // Verificar si hay token almacenado
      if (!authService.isAuthenticated()) {
        console.log('🚫 AuthStore: No hay token de autenticación');
        set({ user: null });
        return;
      }
      
      console.log('🔍 AuthStore: Token encontrado, obteniendo usuario...');
      const response = await authService.getCurrentUser(); const user = response.user;
      
      if (user) {
        console.log('👤 AuthStore: Usuario obtenido:', user.email);
        set({ user });
      } else {
        console.log('🚫 AuthStore: No se pudo obtener usuario');
        set({ user: null });
      }
      
      console.log('✅ AuthStore: loadUser completado exitosamente');
    } catch (error: unknown) {
      console.error('❌ AuthStore: Error en loadUser:', error);
      
      if (error instanceof ApiError && error.status === 401) {
        // Token inválido, limpiar estado
        console.log('🔒 AuthStore: Token inválido, limpiando sesión');
        set({ user: null, error: null });
      } else {
        set({ 
          error: error instanceof Error ? error.message : 'Error loading user',
          user: null
        });
      }
    } finally {
      console.log('🏁 AuthStore: Finalizando loadUser, loading = false');
      set({ loading: false });
    }
  }
}));