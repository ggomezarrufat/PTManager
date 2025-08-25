import { supabase } from '../config/supabase';

export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const avatarService = {
  async uploadAvatar(file: File): Promise<AvatarUploadResult> {
    try {
      // Validar archivo
      const validation = await this.validateImageFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExtension}`;

      // Subir archivo a Supabase Storage
      const { error } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error subiendo avatar:', error);
        return { success: false, error: error.message };
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error en uploadAvatar:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  },

  async updateProfileAvatar(userId: string, avatarUrl: string | null): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: avatarUrl,
          avatar_updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error actualizando avatar en perfil:', error);
      throw error;
    }
  },

  async deleteAvatar(userId: string): Promise<AvatarUploadResult> {
    try {
      // Obtener URL actual del avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (profile?.avatar_url) {
        // Extraer nombre del archivo de la URL
        const fileName = profile.avatar_url.split('/').pop();
        if (fileName) {
          // Eliminar archivo del storage
          const { error } = await supabase.storage
            .from('user-avatars')
            .remove([fileName]);

          if (error) {
            console.error('Error eliminando archivo:', error);
          }
        }
      }

      // Actualizar perfil para eliminar referencia
      await this.updateProfileAvatar(userId, null);

      return { success: true };
    } catch (error) {
      console.error('Error eliminando avatar:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  },

  async validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Solo se permiten archivos JPEG, PNG y WebP' 
      };
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: 'El archivo es demasiado grande. Máximo 5MB' 
      };
    }

    // Validar dimensiones mínimas
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        if (img.width < 100 || img.height < 100) {
          resolve({ 
            valid: false, 
            error: 'La imagen debe tener al menos 100x100 píxeles' 
          });
        } else {
          resolve({ valid: true });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ 
          valid: false, 
          error: 'No se pudo cargar la imagen para validar' 
        });
      };
      
      img.src = url;
    });
  },

  async getUserAvatarUrl(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error obteniendo avatar URL:', error);
        return null;
      }

      return data?.avatar_url || null;
    } catch (error) {
      console.error('Error en getUserAvatarUrl:', error);
      return null;
    }
  }
};
