# Poker Tournament Manager

Una aplicación web responsive para gestionar torneos de póker en tiempo real, optimizada para uso en smartphones.

## 🎯 Características Principales

- **Tournament Clock**: Reloj del torneo con cuenta regresiva por niveles de ciegas
- **Gestión de Fichas**: Sistema de recompras y addons con límites configurables
- **Tiempo Real**: Actualizaciones en vivo con Supabase Realtime
- **Autenticación Avanzada**: 
  - Login/registro con validaciones completas
  - Verificación de emails duplicados
  - Mensajes de error claros y específicos
  - Recuperación de contraseña
  - Autenticación social (Google, GitHub)
  - Gestión de perfil con edición de sobrenombre
  - Sistema de nombres inteligente (sobrenombre > nombre > email)
  - Creación rápida de jugadores desde gestión de torneos
- **Multiusuario**: Roles diferenciados (Admin, Jugador, Espectador)
- **Responsive**: Optimizado para smartphones y tablets
- **PWA**: Funcionalidad offline y instalable como app nativa

## 🚀 Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **UI**: Material-UI (MUI)
- **Estado**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Routing**: React Router DOM
- **Utilidades**: date-fns

## 📋 Requisitos Previos

- Node.js 16+ 
- npm o yarn
- Cuenta en Supabase (gratuita)

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd poker-tournament-manager
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Supabase

#### Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Guarda las credenciales del proyecto

#### Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-anon-key
```

**Importante**: Reemplaza `tu-proyecto` y `tu-anon-key` con las credenciales reales de tu proyecto Supabase.

#### Configurar la base de datos
1. **Ejecuta el archivo `supabase-setup.sql`** en el editor SQL de Supabase. Este archivo contiene:
   - Todas las tablas necesarias
   - Políticas de seguridad (RLS)
   - Triggers para actualización automática
   - Función para crear perfiles automáticamente

2. **Opcional**: Después de registrar usuarios en la aplicación, puedes ejecutar `supabase-sample-data.sql` para crear datos de ejemplo.

```sql
-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios (extendida de auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name VARCHAR NOT NULL,
  nickname VARCHAR,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de torneos
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  scheduled_start_time TIMESTAMP NOT NULL,
  actual_start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'paused', 'finished')),
  max_players INTEGER DEFAULT 100,
  entry_fee DECIMAL(10,2) NOT NULL,
  initial_chips INTEGER NOT NULL,
  rebuy_chips INTEGER NOT NULL,
  addon_chips INTEGER NOT NULL,
  max_rebuys INTEGER DEFAULT 3,
  max_addons INTEGER DEFAULT 1,
  blind_structure JSONB NOT NULL,
  point_system JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de jugadores en torneo
CREATE TABLE public.tournament_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  current_chips INTEGER NOT NULL,
  entry_fee_paid DECIMAL(10,2) NOT NULL,
  registration_time TIMESTAMP DEFAULT NOW(),
  final_position INTEGER,
  points_earned INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_eliminated BOOLEAN DEFAULT false,
  eliminated_at TIMESTAMP,
  UNIQUE(tournament_id, user_id)
);

-- Tabla de recompras
CREATE TABLE public.rebuys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES public.tournament_players(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  chips_received INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Tabla de addons
CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES public.tournament_players(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  chips_received INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Tabla del reloj del torneo
CREATE TABLE public.tournament_clocks (
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE PRIMARY KEY,
  current_level INTEGER DEFAULT 1,
  time_remaining_seconds INTEGER NOT NULL,
  is_paused BOOLEAN DEFAULT false,
  paused_at TIMESTAMP,
  total_pause_time_seconds INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Tabla de participantes del torneo (roles)
CREATE TABLE public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role VARCHAR DEFAULT 'player' CHECK (role IN ('admin', 'player', 'spectator')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rebuys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_clocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view tournaments they participate in" ON public.tournaments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tournament_participants 
      WHERE tournament_id = tournaments.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage tournaments" ON public.tournaments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tournament_participants 
      WHERE tournament_id = tournaments.id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### 4. Ejecutar la aplicación
```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Uso de la Aplicación

### Para Administradores

1. **Crear Torneo**:
   - Configurar estructura de ciegas
   - Definir fichas iniciales y límites
   - Programar fecha y hora de inicio

2. **Gestionar Jugadores**:
   - Registrar jugadores
   - Controlar recompras y addons
   - Eliminar jugadores con posiciones

3. **Control del Reloj**:
   - Pausar/reanudar torneo
   - Avanzar niveles manualmente
   - Ajustar tiempo restante

### Para Jugadores

1. **Ver Torneo**:
   - Reloj en tiempo real
   - Jugadores restantes
   - Promedio de fichas

2. **Historial**:
   - Puntos acumulados
   - Posiciones en torneos anteriores

## 🔧 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── auth/           # Componentes de autenticación
│   ├── layout/         # Componentes de layout
│   ├── tournament/     # Componentes específicos del torneo
│   └── ui/             # Componentes UI genéricos
├── pages/              # Páginas de la aplicación
├── services/           # Servicios de Supabase
├── store/              # Estado global con Zustand
├── types/              # Tipos TypeScript
├── utils/              # Utilidades
└── hooks/              # Custom hooks
```

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Subir la carpeta build a Netlify
```

## 📊 Funcionalidades Futuras

- [ ] Gestión completa de jugadores
- [ ] Sistema de recompras/addons
- [ ] Reportes financieros
- [ ] Exportación de datos
- [ ] Notificaciones push
- [ ] Modo offline completo
- [ ] Integración con APIs de póker

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación de Supabase
2. Abre un issue en GitHub
3. Contacta al equipo de desarrollo

## 🔧 Troubleshooting

### Error 406 al intentar loguearse
Si recibes un error 406 al intentar loguearte, asegúrate de:

1. **Ejecutar el script SQL completo**: El archivo `supabase-setup.sql` debe ejecutarse completamente en Supabase
2. **Verificar las políticas RLS**: Las políticas de Row Level Security deben estar configuradas correctamente
3. **Revisar las credenciales**: Las variables de entorno deben ser correctas
4. **Verificar la tabla profiles**: La tabla debe existir y tener el trigger para crear perfiles automáticamente

### Error de foreign key constraint
Si recibes un error de foreign key constraint al ejecutar el SQL:

1. **No ejecutar datos de ejemplo**: El script `supabase-setup.sql` ya no incluye datos de ejemplo con UUIDs ficticios
2. **Registrar usuarios reales**: Primero registra usuarios en la aplicación para que se creen perfiles automáticamente
3. **Usar script opcional**: Después puedes ejecutar `supabase-sample-data.sql` para crear datos de ejemplo

### Perfiles no se crean automáticamente
Si registras un usuario pero no se crea el perfil automáticamente:

1. **Ejecutar script de diagnóstico**: Ejecuta `fix-profiles-trigger.sql` en Supabase SQL Editor
2. **Verificar trigger**: El script verificará y corregirá el trigger `handle_new_user()`
3. **Crear perfiles faltantes**: El script creará perfiles para usuarios existentes
4. **Verificar políticas RLS**: Se agregará una política temporal para permitir inserciones

### Error de recursión infinita en políticas RLS
Si recibes un error "infinite recursion detected in policy":

1. **Ejecutar script final**: Ejecuta `fix-recursion-final.sql` en Supabase SQL Editor
2. **Solución definitiva**: Este script elimina completamente la recursión usando:
   - Políticas simplificadas sin referencias circulares
   - Función personalizada para verificar acceso
   - Consultas separadas en el código (sin JOIN problemático)
3. **Verificar funcionamiento**: Las consultas deberían funcionar sin errores

### Error "invalid input syntax for type uuid"
Si recibes un error con UUID inválido:

1. **Problema solucionado**: Se agregó validación de UUID en todas las páginas
2. **Página para crear torneos**: Se creó `/tournament/new` con formulario completo
3. **Redirección automática**: URLs inválidas redirigen al dashboard automáticamente

### Error de React useState
Si recibes un error relacionado con `useState`, asegúrate de:

1. **Usar React 18**: La aplicación está configurada para React 18
2. **Reinstalar dependencias**: Ejecuta `rm -rf node_modules package-lock.json && npm install`
3. **Limpiar cache**: Ejecuta `npm start -- --reset-cache`

---

**Desarrollado con ❤️ para la comunidad de póker** 