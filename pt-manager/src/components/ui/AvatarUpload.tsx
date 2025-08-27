import React, { useState, useRef } from 'react';
import {
  Box,
  Avatar,
  Button,
  CircularProgress,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Delete,
  ZoomIn,
  CloudUpload
} from '@mui/icons-material';
import { avatarService, AvatarUploadResult } from '../../services/avatarService';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarChange: (url: string | null) => void;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  disabled?: boolean;
  showDeleteButton?: boolean;
  showPreview?: boolean;
  userId: string; // Agregar userId como prop requerida
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  size = 'medium',
  disabled = false,
  showDeleteButton = true,
  showPreview = true,
  userId
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tamaños del avatar
  const avatarSizes = {
    small: 40,
    medium: 80,
    large: 120,
    xlarge: 160
  };

  const currentSize = avatarSizes[size];

  // Manejar selección de archivo
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Subir avatar con userId
      const result: AvatarUploadResult = await avatarService.uploadAvatar(file, userId);

      if (result.success && result.url) {
        // Actualizar la base de datos con la nueva URL del avatar
        await avatarService.updateProfileAvatar(userId, result.url);
        console.log('✅ Avatar actualizado en base de datos:', result.url);
        
        // Notificar al componente padre del cambio
        onAvatarChange(result.url);
      } else {
        setError(result.error || 'Error al subir el avatar');
      }
    } catch (err) {
      console.error('Error en handleFileSelect:', err);
      setError('Error inesperado al subir el avatar');
    } finally {
      setUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Manejar cambio de archivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(event);
    }
  };

  // Eliminar avatar
  const handleDeleteAvatar = async () => {
    try {
      setUploading(true);
      setError(null);

      // Usar el userId real
      const result = await avatarService.deleteAvatar(userId);

      if (result.success) {
        // Notificar al componente padre del cambio
        onAvatarChange(null);
        setShowDeleteDialog(false);
        console.log('✅ Avatar eliminado de base de datos');
      } else {
        setError(result.error || 'Error al eliminar el avatar');
      }
    } catch (err) {
      console.error('Error eliminando avatar:', err);
      setError('Error inesperado al eliminar el avatar');
    } finally {
      setUploading(false);
    }
  };

  // Abrir selector de archivos
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Mostrar preview en diálogo
  const handlePreviewClick = () => {
    setShowPreviewDialog(true);
  };

  return (
    <>
      <Box sx={{ textAlign: 'center' }}>
        {/* Avatar actual */}
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
          <Avatar
            src={currentAvatarUrl || undefined}
            sx={{
              width: currentSize,
              height: currentSize,
              fontSize: currentSize * 0.4,
              cursor: showPreview && currentAvatarUrl ? 'pointer' : 'default'
            }}
            onClick={showPreview && currentAvatarUrl ? handlePreviewClick : undefined}
          />
          
          {/* Indicador de preview */}
          {showPreview && currentAvatarUrl && (
            <Tooltip title="Ver imagen completa">
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'background.paper',
                  border: 1,
                  borderColor: 'divider'
                }}
                onClick={handlePreviewClick}
              >
                <ZoomIn fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Controles */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
          {/* Botón de subir */}
          <Button
            variant="outlined"
            component="label"
            startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
            onClick={handleUploadClick}
            disabled={disabled || uploading}
            size="small"
          >
            {uploading ? 'Subiendo...' : 'Cambiar Avatar'}
          </Button>

          {/* Input de archivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Botón de eliminar */}
          {showDeleteButton && currentAvatarUrl && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setShowDeleteDialog(true)}
              disabled={disabled || uploading}
              size="small"
            >
              Eliminar
            </Button>
          )}
        </Box>

        {/* Mensajes de error */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Información de formato */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Formatos: JPEG, PNG, WebP • Máximo: 5MB • Mínimo: 100x100px
        </Typography>
      </Box>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres eliminar tu avatar? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteAvatar} 
            color="error" 
            variant="contained"
            disabled={uploading}
          >
            {uploading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de preview */}
      <Dialog 
        open={showPreviewDialog} 
        onClose={() => setShowPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Vista Previa del Avatar</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <img
              src={currentAvatarUrl || ''}
              alt="Avatar preview"
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                objectFit: 'contain'
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AvatarUpload;
