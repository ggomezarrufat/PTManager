# 🔧 Campos Corregidos para Compatibilidad con Backend - PT Manager Mobile

## ❌ **Problema Identificado:**

La versión móvil estaba enviando campos diferentes a los que espera el backend, causando fallos en la creación de torneos.

### **🔍 Análisis de Incompatibilidad:**

| Campo Móvil (❌) | Campo Backend (✅) | Estado |
|------------------|-------------------|---------|
| `buy_in` | `entry_fee` | ❌ Incorrecto |
| `start_date` | `scheduled_start_time` | ❌ Incorrecto |
| `structure` | `blind_structure` | ❌ Incorrecto |
| `rebuy_limit` | `max_rebuys` | ❌ Incorrecto |
| `addon_limit` | `max_addons` | ❌ Incorrecto |
| - | `rebuy_chips` | ❌ Faltaba |
| - | `addon_chips` | ❌ Faltaba |
| - | `max_players` | ❌ Faltaba |
| - | `point_system` | ❌ Faltaba |

## ✅ **Correcciones Implementadas:**

### **1. 📝 Campos del Formulario Actualizados:**

**Antes:**
```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  initial_chips: '10000',
  buy_in: '100',           // ❌ Incorrecto
  rebuy_limit: '1',        // ❌ Incorrecto
  addon_limit: '1',        // ❌ Incorrecto
});
```

**Después:**
```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  max_players: '100',      // ✅ Agregado
  entry_fee: '100',        // ✅ Corregido
  initial_chips: '10000',
  rebuy_chips: '10000',    // ✅ Agregado
  addon_chips: '15000',    // ✅ Agregado
  max_rebuys: '3',         // ✅ Corregido
  max_addons: '1',         // ✅ Corregido
});
```

### **2. 🎯 Sistema de Puntos Agregado:**

```typescript
// Sistema de puntos (por defecto: 1er lugar = 100, 2do = 50, 3ro = 25)
const [pointSystem, setPointSystem] = useState([
  { position: 1, points: 100 },
  { position: 2, points: 50 },
  { position: 3, points: 25 }
]);
```

### **3. 📤 Datos de Creación Corregidos:**

**Antes:**
```typescript
const tournamentData = {
  name: formData.name.trim(),
  description: formData.description.trim(),
  start_date: combinedDateTime.toISOString(),        // ❌
  initial_chips: parseInt(formData.initial_chips),
  buy_in: parseInt(formData.buy_in),                 // ❌
  rebuy_limit: parseInt(formData.rebuy_limit),       // ❌
  addon_limit: parseInt(formData.addon_limit),       // ❌
  structure,                                          // ❌
  created_by: user?.id || '',
  status: 'scheduled' as const,
};
```

**Después:**
```typescript
const tournamentData = {
  name: formData.name.trim(),
  description: formData.description.trim(),
  scheduled_start_time: combinedDateTime.toISOString(),  // ✅
  max_players: parseInt(formData.max_players),           // ✅
  entry_fee: parseInt(formData.entry_fee),               // ✅
  initial_chips: parseInt(formData.initial_chips),
  rebuy_chips: parseInt(formData.rebuy_chips),           // ✅
  addon_chips: parseInt(formData.addon_chips),           // ✅
  max_rebuys: parseInt(formData.max_rebuys),             // ✅
  max_addons: parseInt(formData.max_addons),             // ✅
  blind_structure: structure,                            // ✅
  point_system: pointSystem,                            // ✅
  created_by: user?.id || '',
  status: 'scheduled' as const,
};
```

### **4. 🎨 Interfaz de Usuario Actualizada:**

**Campos del Formulario:**
- ✅ **Máximo de Jugadores** (nuevo)
- ✅ **Entry Fee** (antes: Buy-in)
- ✅ **Fichas Iniciales** (mantenido)
- ✅ **Fichas de Rebuy** (nuevo)
- ✅ **Fichas de Addon** (nuevo)
- ✅ **Máximo Rebuys** (antes: Límite de Rebuys)
- ✅ **Máximo Addons** (antes: Límite de Add-ons)

### **5. 📥 Importador JSON Mejorado:**

**Soporte para Formatos:**
- ✅ **Formato Web:** `{ "blind_structure": [...] }`
- ✅ **Formato Directo:** `[...]`
- ✅ **Campos de Duración:** `duration` y `duration_minutes`

**Validación Mejorada:**
```typescript
// Verificar si es el formato de la web (con blind_structure)
if (data.blind_structure && Array.isArray(data.blind_structure)) {
  blindStructure = data.blind_structure;
} 
// Verificar si es un array directo
else if (Array.isArray(data)) {
  blindStructure = data;
} else {
  throw new Error('El archivo debe contener un array de niveles o un objeto con blind_structure');
}

// Usar duration_minutes si está disponible, sino duration
const durationValue = duration_minutes || duration;
```

## 🎯 **Campos Requeridos por el Backend:**

### **✅ Campos Obligatorios:**
- `name` - Nombre del torneo
- `entry_fee` - Costo de entrada
- `scheduled_start_time` - Fecha y hora de inicio
- `initial_chips` - Fichas iniciales
- `rebuy_chips` - Fichas de rebuy
- `addon_chips` - Fichas de addon
- `blind_structure` - Estructura de blinds
- `point_system` - Sistema de puntos

### **✅ Campos Opcionales:**
- `description` - Descripción del torneo
- `max_players` - Máximo de jugadores (default: 100)
- `max_rebuys` - Máximo rebuys (default: 3)
- `max_addons` - Máximo addons (default: 1)
- `season_id` - ID de la temporada

## 🚀 **Estado Actual:**

- ✅ **Campos corregidos** para coincidir con el backend
- ✅ **Sistema de puntos** implementado
- ✅ **Interfaz actualizada** con todos los campos necesarios
- ✅ **Importador JSON** compatible con formato web
- ✅ **Validación mejorada** para múltiples formatos
- ✅ **Logs de depuración** para identificar problemas

## 🎉 **Resultado:**

La aplicación móvil ahora envía exactamente los mismos campos que espera el backend de la versión web, garantizando compatibilidad total y eliminando los errores de creación de torneos.

¡La creación de torneos debería funcionar perfectamente ahora!
