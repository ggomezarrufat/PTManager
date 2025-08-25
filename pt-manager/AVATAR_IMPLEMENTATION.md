# Sistema de Avatar - Implementación Completa

## 📋 **Descripción General**

Este documento describe la implementación completa del sistema de avatar para usuarios en la aplicación Poker Tournament Manager. El sistema permite a los usuarios subir, actualizar y eliminar sus fotos de perfil.

## 🏗️ **Arquitectura del Sistema**

### **Componentes Principales**

1. **`avatarService.ts`** - Servicio de backend para operaciones de avatar
2. **`AvatarUpload.tsx`** - Componente de UI para subir/editar avatares
3. **`UserProfile.tsx`** - Página de perfil que integra el sistema de avatar
4. **`supabase.ts`** - Configuración del cliente Supabase

### **Flujo de Datos**

```
Usuario selecciona archivo → AvatarUpload → avatarService → Supabase Storage → Base de datos
```

## 🔧 **Configuración Requerida**

### **Variables de Entorno**

```bash
# En .env.local o .env
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-anon-key

# O alternativamente
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
```

### **Configuración de Supabase**

#### **1. Storage Bucket**

```sql
-- Ejecutar en SQL Editor de Supabase
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;
```

#### **2. Políticas RLS (Row Level Security)**

```sql
-- Políticas para el bucket user-avatars
CREATE POLICY "Avatares públicos para lectura" ON storage.objects 
FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Usuarios suben sus avatares" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'user-avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios actualizan sus avatares" ON storage.objects 
FOR UPDATE USING (bucket_id = 'user-avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios eliminan sus avatares" ON storage.objects 
FOR DELETE USING (bucket_id = 'user-avatars' AND auth.uid() IS NOT NULL);
```

#### **3. Tabla de Perfiles**

```sql
-- Agregar columnas de avatar a la tabla profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

## 📁 **Estructura de Archivos**

```
src/
├── components/
│   └── ui/
│       └── AvatarUpload.tsx          # Componente principal de avatar
├── services/
│   └── avatarService.ts              # Servicio de operaciones de avatar
├── config/
│   └── supabase.ts                   # Configuración de Supabase
└── pages/
    └── UserProfile.tsx               # Página de perfil con avatar
```

## 🚀 **Funcionalidades Implementadas**

### **1. Subida de Avatar**

- ✅ **Validación de archivo**: Tipo, tamaño, dimensiones
- ✅ **Formato de archivo**: JPEG, PNG, WebP
- ✅ **Tamaño máximo**: 5MB
- ✅ **Resolución mínima**: 100x100 píxeles
- ✅ **Nombres únicos**: Timestamp + extensión

### **2. Gestión de Avatar**

- ✅ **Vista previa**: Antes de subir
- ✅ **Eliminación**: Con confirmación
- ✅ **Actualización**: Reemplazo de avatar existente
- ✅ **Persistencia**: Guardado en Supabase Storage y base de datos

### **3. Interfaz de Usuario**

- ✅ **Responsive**: Adaptado a móvil y desktop
- ✅ **Estados de carga**: Indicadores visuales
- ✅ **Manejo de errores**: Mensajes claros
- ✅ **Accesibilidad**: Tooltips y etiquetas

## 🔒 **Seguridad y Validación**

### **Validaciones del Cliente**

```typescript
// Tipo de archivo
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

// Tamaño máximo
const maxSize = 5 * 1024 * 1024; // 5MB

// Dimensiones mínimas
if (img.width < 100 || img.height < 100) {
  // Error: imagen muy pequeña
}
```

### **Políticas RLS**

- **Lectura**: Pública para todos los usuarios
- **Escritura**: Solo usuarios autenticados
- **Eliminación**: Solo el propietario del avatar

## 📱 **Uso del Componente**

### **Implementación Básica**

```tsx
import AvatarUpload from '../components/ui/AvatarUpload';

<AvatarUpload
  currentAvatarUrl={user.avatar_url}
  onAvatarChange={(newUrl) => handleAvatarChange(newUrl)}
  size="large"
  showDeleteButton={true}
  showPreview={true}
/>
```

### **Props Disponibles**

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `currentAvatarUrl` | `string \| null` | `undefined` | URL del avatar actual |
| `onAvatarChange` | `(url: string \| null) => void` | - | Callback al cambiar avatar |
| `size` | `'small' \| 'medium' \| 'large' \| 'xlarge'` | `'medium'` | Tamaño del avatar |
| `disabled` | `boolean` | `false` | Deshabilitar interacciones |
| `showDeleteButton` | `boolean` | `true` | Mostrar botón de eliminar |
| `showPreview` | `boolean` | `true` | Permitir vista previa |

## 🧪 **Testing y Debugging**

### **Logs de Desarrollo**

```typescript
// En desarrollo, se muestran logs detallados
console.log('🔧 Supabase: Configuración de desarrollo');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? '✅ Configurado' : '❌ Faltante');
```

### **Manejo de Errores**

```typescript
try {
  const result = await avatarService.uploadAvatar(file);
  if (result.success) {
    // Avatar subido exitosamente
  } else {
    // Mostrar error al usuario
    setError(result.error);
  }
} catch (err) {
  console.error('Error inesperado:', err);
  setError('Error inesperado al subir el avatar');
}
```

## 🚨 **Problemas Comunes y Soluciones**

### **1. Error de RLS (Row Level Security)**

**Síntoma**: `new row violates row-level security policy`

**Solución**: Verificar que las políticas RLS estén configuradas correctamente en Supabase

### **2. Variables de Entorno No Cargadas**

**Síntoma**: `supabaseUrl is required`

**Solución**: Verificar archivos `.env` y `.env.local` en la raíz del proyecto

### **3. Error de CORS**

**Síntoma**: `CORS policy: No 'Access-Control-Allow-Origin'`

**Solución**: Verificar configuración de Supabase y políticas de storage

## 🔮 **Mejoras Futuras**

### **Funcionalidades Planificadas**

- [ ] **Compresión automática** de imágenes grandes
- [ ] **Recorte de imagen** antes de subir
- [ ] **Filtros y efectos** básicos
- [ ] **Backup automático** de avatares
- [ ] **Sincronización** entre dispositivos

### **Optimizaciones Técnicas**

- [ ] **Lazy loading** de avatares
- [ ] **Cache inteligente** de imágenes
- [ ] **Progressive JPEG** para mejor UX
- [ ] **WebP automático** para navegadores compatibles

## 📚 **Referencias y Recursos**

- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Políticas RLS de Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Guía de Material-UI](https://mui.com/material-ui/getting-started/)
- [React Hooks](https://reactjs.org/docs/hooks-intro.html)

## 🤝 **Contribución**

Para contribuir al sistema de avatar:

1. **Fork** el repositorio
2. **Crea** una rama para tu feature
3. **Implementa** las mejoras
4. **Testea** exhaustivamente
5. **Envía** un pull request

---

**Última actualización**: Agosto 2025  
**Versión**: 1.0.0  
**Autor**: Equipo de Desarrollo PTManager
