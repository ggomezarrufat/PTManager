# PRD - Gestor de Torneos de Póker
## Product Requirements Document

### 1. Resumen Ejecutivo

**Nombre del Producto:** Poker Tournament Manager  
**Versión:** 1.0  
**Plataforma:** Web Responsive (PWA)  
**Arquitectura:** Frontend-Backend (SPA)  
**Fecha de Creación:** Diciembre 2024  

### 2. Objetivo del Producto

Desarrollar una aplicación web responsive que permita gestionar torneos de póker de manera eficiente y en tiempo real, optimizada para uso en smartphones, facilitando el registro de jugadores, control de recompras, cálculo de puntos y generación de reportes.

### 3. Funcionalidades Principales

#### 3.1 Gestión de Usuarios y Autenticación
- **Sistema de autenticación** con Supabase Auth:
  - Registro con email/password
  - Login con Google/GitHub
  - Recuperación de contraseña
- **Perfiles de usuario** con:
  - Nombre completo y apodo
  - Avatar opcional
  - Historial de torneos
  - Puntos acumulados totales
- **Roles de usuario:**
  - **Administrador:** Acceso completo a todas las funciones
  - **Jugador:** Acceso limitado a torneos específicos
  - **Espectador:** Solo visualización

#### 3.2 Gestión de Torneos
- **Creación de torneos** programados con:
  - Fecha y hora de inicio
  - Estructura de ciegas configurable
  - Cantidad de fichas iniciales
  - Límites de recompras y addons
  - Sistema de puntos personalizable
- **Inscripciones** de jugadores registrados
- **Estados del torneo:** Programado, Activo, Pausado, Finalizado
- **Configuración de niveles** de ciegas con duración

#### 3.3 Reloj del Torneo (Tournament Clock)
- **Cuenta regresiva** por nivel de ciegas
- **Información en tiempo real:**
  - Nivel actual (SB/BB)
  - Tiempo restante del nivel
  - Próximo nivel
  - Cantidad de jugadores restantes
  - Promedio de fichas por jugador
- **Controles del administrador:**
  - Pausar/Reanudar
  - Avanzar nivel manualmente
  - Ajustar tiempo restante
- **Visualización pública** para todos los participantes

#### 3.4 Sistema de Fichas y Compras
- **Fichas iniciales** configurables por torneo
- **Recompras:**
  - Cantidad de fichas por recompra
  - Límite máximo configurable
  - Registro automático de tiempo
- **Addons:**
  - Cantidad de fichas por addon
  - Límite máximo configurable
  - Disponible en break específico
- **Seguimiento en tiempo real** de fichas por jugador

#### 3.5 Gestión de Jugadores en Torneo
- **Registro de jugadores** con fichas iniciales
- **Eliminación** con timestamp automático
- **Recompras y addons** con validación de límites
- **Seguimiento de posiciones** finales
- **Cálculo automático** de puntos según posición

#### 3.6 Tabla de Resultados y Estadísticas
- **Vista para administradores:**
  - Todos los jugadores con información completa
  - Total pagado (entrada + recompras + addons)
  - Fichas actuales
  - Posición actual/final
- **Vista para jugadores:**
  - Solo jugadores restantes
  - Posiciones y puntos acumulados
  - Tabla de puntos históricos
- **Ordenamiento** por fichas, posición o puntos
- **Filtros** por estado del jugador

#### 3.7 Sistema de Puntos Acumulados
- **Puntos por torneo** según posición final
- **Tabla de puntos acumulados** histórica
- **Ranking** de jugadores por puntos totales
- **Estadísticas** de rendimiento por jugador

#### 3.8 Gestión de Datos y Reportes
- **Almacenamiento** en Supabase PostgreSQL
- **Sincronización** en tiempo real
- **Exportación** a JSON/CSV
- **Backup automático** de Supabase
- **Reportes financieros** detallados

### 4. Arquitectura Técnica

#### 4.1 Arquitectura Frontend-Backend
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (SPA)         │◄──►│   (API REST)    │◄──►│   (Local/Cloud) │
│   React/Vue     │    │   Node.js/Python│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 4.2 Estructura del Proyecto
```
poker-tournament-manager/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   └── layout/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   └── styles/
│   ├── public/
│   └── package.json
├── backend/ (opcional)
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
└── docs/
```

#### 4.3 Tecnologías y Librerías

**Frontend:**
- **Framework:** React.js con TypeScript
- **Estado:** Zustand o Redux Toolkit
- **UI:** Material-UI o Tailwind CSS
- **PWA:** Service Workers para funcionalidad offline
- **Responsive:** CSS Grid, Flexbox, Media Queries
- **Validación:** React Hook Form con Yup
- **Tiempo Real:** Supabase Realtime

**Backend (Supabase):**
- **Base de Datos:** PostgreSQL (Supabase)
- **Autenticación:** Supabase Auth (Google, GitHub, email)
- **APIs:** Supabase REST y GraphQL automáticas
- **Tiempo Real:** WebSockets integrados
- **Storage:** Supabase Storage para archivos
- **Edge Functions:** Para lógica de servidor

**Herramientas:**
- **Build:** Vite
- **Testing:** Jest, Cypress
- **Deployment:** Vercel, Netlify
- **Monitoreo:** Supabase Analytics

### 5. Modelos de Datos

#### 5.1 User (Usuario)
```typescript
{
  id: string,
  email: string,
  name: string,
  nickname: string,
  avatar_url?: string,
  created_at: Date,
  last_login: Date,
  is_admin: boolean
}
```

#### 5.2 Tournament (Torneo)
```typescript
{
  id: string,
  name: string,
  description?: string,
  scheduled_start_time: Date,
  actual_start_time?: Date,
  end_time?: Date,
  status: 'scheduled' | 'active' | 'paused' | 'finished',
  max_players: number,
  entry_fee: number,
  initial_chips: number,
  rebuy_chips: number,
  addon_chips: number,
  max_rebuys: number,
  max_addons: number,
  blind_structure: BlindLevel[],
  point_system: PointSystem,
  created_by: string, // user_id
  created_at: Date,
  updated_at: Date
}
```

#### 5.3 BlindLevel (Nivel de Ciegas)
```typescript
{
  level: number,
  small_blind: number,
  big_blind: number,
  duration_minutes: number,
  antes?: number
}
```

#### 5.4 PointSystem (Sistema de Puntos)
```typescript
{
  positions: {
    [position: number]: number // 1: 100, 2: 80, etc.
  },
  default_points: number // para posiciones no especificadas
}
```

#### 5.5 Player (Jugador en Torneo)
```typescript
{
  id: string,
  tournament_id: string,
  user_id: string,
  current_chips: number,
  entry_fee_paid: number,
  registration_time: Date,
  final_position?: number,
  points_earned: number,
  is_active: boolean,
  is_eliminated: boolean,
  eliminated_at?: Date
}
```

#### 5.6 Rebuy (Recompra)
```typescript
{
  id: string,
  player_id: string,
  tournament_id: string,
  amount: number,
  chips_received: number,
  timestamp: Date
}
```

#### 5.7 Addon (Addon)
```typescript
{
  id: string,
  player_id: string,
  tournament_id: string,
  amount: number,
  chips_received: number,
  timestamp: Date
}
```

#### 5.8 TournamentParticipant (Participante)
```typescript
{
  id: string,
  tournament_id: string,
  user_id: string,
  role: 'admin' | 'player' | 'spectator',
  joined_at: Date
}
```

#### 5.9 TournamentClock (Reloj del Torneo)
```typescript
{
  tournament_id: string,
  current_level: number,
  time_remaining_seconds: number,
  is_paused: boolean,
  paused_at?: Date,
  total_pause_time_seconds: number,
  last_updated: Date
}
```

### 6. Pantallas y Navegación

#### 6.1 Estructura de Pantallas
```
App
├── Auth (Autenticación)
│   ├── Login
│   ├── Register
│   └── Forgot Password
├── Dashboard (Panel principal)
│   ├── Admin Dashboard
│   └── Player Dashboard
├── Tournament Management (Solo Admin)
│   ├── Tournament List
│   ├── Create Tournament
│   ├── Tournament Settings
│   ├── Player Registration
│   ├── Tournament Clock Control
│   ├── Rebuy/Addon Management
│   └── Tournament Results
├── Tournament View (Público)
│   ├── Tournament Clock Display
│   ├── Player List
│   ├── Current Standings
│   └── Tournament Info
├── Player Management (Solo Admin)
│   ├── Player List
│   ├── Add Player
│   ├── Edit Player
│   ├── Eliminate Player
│   └── Player Statistics
├── Reports & Analytics
│   ├── Financial Reports
│   ├── Tournament History
│   ├── Player Rankings
│   └── Export Data
├── User Profile
│   ├── Personal Info
│   ├── Tournament History
│   ├── Points History
│   └── Settings
└── Admin Panel (Solo Admin)
    ├── User Management
    ├── System Settings
    └── Analytics
```

#### 6.2 Flujo de Navegación

**Para Administradores:**
1. **Login/Registro:** Autenticación con Supabase
2. **Admin Dashboard:** Vista general de torneos activos
3. **Crear Torneo:** Configuración completa del torneo
4. **Gestionar Jugadores:** Registro y control de participantes
5. **Control del Reloj:** Manejo del tournament clock
6. **Gestión de Compras:** Recompras y addons
7. **Resultados:** Asignación de posiciones finales
8. **Reportes:** Análisis y exportación de datos

**Para Jugadores:**
1. **Login:** Acceso con credenciales
2. **Player Dashboard:** Torneos disponibles y participación
3. **Tournament View:** Reloj público y estado del torneo
4. **Perfil:** Historial personal y puntos acumulados
5. **Rankings:** Tabla de puntos históricos

**Para Espectadores:**
1. **Tournament View:** Solo visualización del reloj y jugadores
2. **Current Standings:** Posiciones actuales
3. **Tournament Info:** Información básica del torneo

### 7. Interfaz de Usuario

#### 7.1 Principios de Diseño Mobile-First
- **Mobile-First Design:** Optimizado para smartphones
- **Touch-Friendly:** Botones y elementos táctiles grandes
- **Responsive Design:** Adaptable a tablets y desktop
- **Progressive Web App (PWA):** Funcionalidad offline
- **Accesibilidad:** WCAG 2.1 AA compliance

#### 7.2 Componentes UI Principales
- **Tournament Clock:** Componente principal con cuenta regresiva
- **Player Cards:** Para mostrar información de jugadores
- **Modal/Dialog:** Para formularios y confirmaciones
- **Bottom Sheet:** Para recompras/addons rápidas
- **Data Tables:** Para listas de jugadores con ordenamiento
- **Charts:** Para visualización de estadísticas
- **Real-time Updates:** Indicadores de cambios en tiempo real
- **Role-based Navigation:** Menús adaptados por rol de usuario

#### 7.3 Características Mobile-Specific
- **Swipe Gestures:** Para navegación rápida
- **Pull-to-Refresh:** Para actualizar datos
- **Offline Mode:** Funcionalidad sin conexión
- **Add to Home Screen:** Instalación como app nativa
- **Push Notifications:** Alertas importantes (opcional)

### 8. Casos de Uso

#### 8.1 UC001 - Crear Torneo
**Actor:** Administrador  
**Precondición:** Usuario autenticado con rol admin  
**Flujo Principal:**
1. Usuario accede a "Crear Torneo"
2. Sistema muestra formulario de configuración
3. Usuario configura estructura de ciegas, fichas, límites
4. Sistema valida configuración
5. Sistema crea torneo programado
6. Sistema notifica a usuarios registrados

#### 8.2 UC002 - Iniciar Tournament Clock
**Actor:** Administrador del torneo  
**Precondición:** Torneo activo con jugadores  
**Flujo Principal:**
1. Usuario inicia el reloj del torneo
2. Sistema comienza cuenta regresiva del primer nivel
3. Sistema actualiza información en tiempo real
4. Sistema notifica cambio de nivel automáticamente
5. Sistema pausa en breaks configurados
6. Sistema permite control manual del administrador

#### 8.3 UC003 - Registrar Recompra/Addon
**Actor:** Administrador del torneo  
**Precondición:** Jugador activo, límites no excedidos  
**Flujo Principal:**
1. Usuario selecciona jugador de la lista
2. Sistema muestra opciones de recompra/addon
3. Usuario confirma tipo y monto
4. Sistema valida límites y actualiza fichas
5. Sistema registra transacción
6. Sistema actualiza estadísticas en tiempo real

#### 8.4 UC004 - Eliminar Jugador
**Actor:** Administrador del torneo  
**Precondición:** Jugador activo en torneo  
**Flujo Principal:**
1. Usuario selecciona jugador a eliminar
2. Sistema solicita confirmación
3. Usuario confirma eliminación
4. Sistema registra posición final
5. Sistema actualiza jugadores restantes
6. Sistema recalcula promedio de fichas

#### 8.5 UC005 - Finalizar Torneo
**Actor:** Administrador del torneo  
**Precondición:** Torneo activo con jugadores  
**Flujo Principal:**
1. Usuario selecciona "Finalizar Torneo"
2. Sistema solicita posiciones finales en orden
3. Usuario asigna posiciones manualmente
4. Sistema calcula puntos automáticamente
5. Sistema actualiza puntos acumulados
6. Sistema genera reporte final y permite exportación

### 9. Requisitos No Funcionales

#### 9.1 Rendimiento
- **Tiempo de carga inicial:** < 3 segundos
- **Tiempo de respuesta:** < 1 segundo para operaciones
- **Tamaño de bundle:** < 2MB inicial
- **Lazy Loading:** Para componentes pesados

#### 9.2 Compatibilidad
- **Navegadores:** Chrome, Safari, Firefox, Edge (últimas 2 versiones)
- **Dispositivos:** iOS 12+, Android 8+
- **Resoluciones:** 320px - 1920px+
- **Orientación:** Portrait y landscape

#### 9.3 Usabilidad
- **Interfaz intuitiva** para usuarios no técnicos
- **Accesibilidad** para usuarios con discapacidades
- **Documentación** integrada en la aplicación
- **Tutorial interactivo** para nuevos usuarios

#### 9.4 Seguridad
- **Autenticación** con Supabase Auth
- **Autorización** basada en roles (RLS)
- **Validación de datos** en cliente y servidor
- **Sanitización** de inputs
- **HTTPS** obligatorio
- **Protección** contra XSS y CSRF
- **Row Level Security** para aislamiento de datos

### 10. Plan de Desarrollo

#### 10.1 Fase 1 - Configuración Base (Semana 1-2)
- Configuración del proyecto React con TypeScript
- Integración con Supabase
- Configuración de autenticación
- Estructura de base de datos
- Configuración de PWA

#### 10.2 Fase 2 - Sistema de Usuarios (Semana 3-4)
- Autenticación con Supabase Auth
- Perfiles de usuario
- Sistema de roles y permisos
- Dashboard diferenciado por rol

#### 10.3 Fase 3 - Gestión de Torneos (Semana 5-6)
- Creación y configuración de torneos
- Estructura de ciegas configurable
- Sistema de inscripciones
- Estados del torneo

#### 10.4 Fase 4 - Tournament Clock (Semana 7-8)
- Reloj del torneo con cuenta regresiva
- Control de niveles de ciegas
- Actualizaciones en tiempo real
- Controles del administrador

#### 10.5 Fase 5 - Sistema de Fichas y Compras (Semana 9-10)
- Gestión de fichas por jugador
- Sistema de recompras y addons
- Validación de límites
- Cálculo de estadísticas

#### 10.6 Fase 6 - Resultados y Puntos (Semana 11-12)
- Sistema de eliminación de jugadores
- Asignación de posiciones finales
- Cálculo de puntos acumulados
- Tabla de rankings históricos

#### 10.7 Fase 7 - Reportes y Analytics (Semana 13-14)
- Reportes financieros detallados
- Estadísticas de rendimiento
- Exportación de datos
- Dashboard de analytics

#### 10.8 Fase 8 - Testing y Pulido (Semana 15-16)
- Testing unitario y de integración
- Testing responsive en diferentes dispositivos
- Optimización de rendimiento
- Testing de funcionalidad offline

### 11. Criterios de Aceptación

#### 11.1 Funcionales
- [ ] Sistema de autenticación completo con Supabase
- [ ] Creación y configuración de torneos con estructura de ciegas
- [ ] Tournament clock funcional con cuenta regresiva
- [ ] Sistema de fichas con recompras y addons
- [ ] Gestión de jugadores con eliminación y posiciones
- [ ] Cálculo correcto de puntos acumulados
- [ ] Roles diferenciados (admin/jugador/espectador)
- [ ] Actualizaciones en tiempo real
- [ ] Reportes financieros y estadísticas
- [ ] Exportación exitosa de datos

#### 11.2 No Funcionales
- [ ] Aplicación carga en menos de 3 segundos
- [ ] Funciona en todos los navegadores modernos
- [ ] Interfaz perfectamente responsive en smartphones
- [ ] Tournament clock sincronizado en tiempo real
- [ ] Autenticación segura con Supabase
- [ ] PWA instalable en dispositivos móviles
- [ ] Funcionalidad offline para datos críticos

### 12. Riesgos y Mitigaciones

#### 12.1 Riesgos Técnicos
- **Riesgo:** Desincronización del tournament clock
- **Mitigación:** WebSockets en tiempo real y fallback a polling

- **Riesgo:** Pérdida de datos durante el torneo
- **Mitigación:** Backup automático de Supabase y sincronización

- **Riesgo:** Problemas de rendimiento con muchos jugadores
- **Mitigación:** Paginación y optimización de consultas

#### 12.2 Riesgos de Usuario
- **Riesgo:** Errores en la gestión de fichas
- **Mitigación:** Validaciones estrictas y confirmaciones

- **Riesgo:** Acceso no autorizado a funciones administrativas
- **Mitigación:** Row Level Security y validación de roles

- **Riesgo:** Dificultad de uso en pantallas pequeñas
- **Mitigación:** Testing exhaustivo en dispositivos reales

### 13. Métricas de Éxito

- **Adopción:** 90% de torneos completados sin errores
- **Usabilidad:** Tiempo promedio de registro de jugador < 30 segundos
- **Rendimiento:** 0 crashes durante torneos de 4+ horas
- **Satisfacción:** Rating de 4.5+ en feedback de usuarios
- **Mobile Usage:** 80% de uso en dispositivos móviles
- **Tiempo Real:** Latencia < 500ms para actualizaciones del tournament clock
- **Confiabilidad:** 99.9% uptime para torneos activos

### 14. Configuración de Supabase

#### 14.1 Estructura de Base de Datos
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
```

#### 14.2 Row Level Security (RLS)
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rebuys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_clocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

-- Políticas para perfiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para torneos
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

#### 14.3 Funciones y Triggers
```sql
-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_tournaments_updated_at 
  BEFORE UPDATE ON public.tournaments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular puntos acumulados
CREATE OR REPLACE FUNCTION update_total_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET total_points = (
    SELECT COALESCE(SUM(points_earned), 0)
    FROM public.tournament_players 
    WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar puntos totales
CREATE TRIGGER update_total_points_trigger
  AFTER UPDATE OF points_earned ON public.tournament_players
  FOR EACH ROW EXECUTE FUNCTION update_total_points();
```

### 15. Consideraciones PWA

#### 15.1 Service Workers
- **Caching:** Estrategia cache-first para recursos estáticos
- **Offline:** Funcionalidad completa sin conexión
- **Background Sync:** Sincronización cuando hay conexión

#### 15.2 Manifest
- **App Name:** "Poker Tournament Manager"
- **Icons:** Múltiples tamaños para diferentes dispositivos
- **Theme:** Colores consistentes con la marca
- **Display:** Standalone para experiencia nativa

#### 15.3 Performance
- **Lighthouse Score:** > 90 en todas las métricas
- **Core Web Vitals:** Cumplimiento de estándares
- **Bundle Analysis:** Optimización continua

---

**Documento creado por:** Equipo de Desarrollo  
**Última actualización:** Diciembre 2024  
**Versión del documento:** 3.0 