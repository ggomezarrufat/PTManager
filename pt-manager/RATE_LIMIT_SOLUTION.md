# 🔒 Solución al Error de Rate Limiting (HTTP 429)

## 🚨 Problema Identificado

El error **HTTP 429 (Too Many Requests)** ocurre cuando el backend limita las solicitudes por exceso de intentos de autenticación o API calls.

## 🛠️ Soluciones Implementadas

### 1. **Rate Limiting Más Permisivo en Desarrollo**

Se ha modificado el backend para ser más permisivo en desarrollo:

- **Desarrollo**: 1000 requests por 15 minutos (en lugar de 100)
- **Producción**: 100 requests por 15 minutos
- **Autenticación**: 100 intentos por 15 minutos en desarrollo

### 2. **Rate Limiting Específico para Autenticación**

- **Endpoint**: `/api/auth/*`
- **Límite**: 100 intentos por 15 minutos en desarrollo
- **Características**: No cuenta requests exitosos

### 3. **Endpoint de Reset de Rate Limit**

- **URL**: `POST /reset-rate-limit`
- **Disponible**: Solo en desarrollo
- **Función**: Resetea el contador de rate limiting para tu IP

### 4. **🆕 Retry Automático en Frontend**

- **Reintentos automáticos**: Hasta 3 intentos para errores 429
- **Backoff exponencial**: 2s, 4s, 8s entre reintentos
- **Transparente**: El usuario no necesita hacer nada
- **Logs informativos**: Muestra el progreso de reintentos

## 🚀 Cómo Usar

### **Opción 1: Retry Automático (Recomendado)**

El frontend ahora maneja automáticamente los errores 429:

1. **No necesitas hacer nada** - El sistema reintenta automáticamente
2. **Espera unos segundos** - Los reintentos son transparentes
3. **Si persiste el error** - Aparecerá después de 3 intentos fallidos

### **Opción 2: Botón en el Frontend**

Cuando veas el error "Too Many Requests":

1. En el formulario de login, aparecerá un botón **"Resetear Rate Limit"**
2. Haz clic en el botón
3. Espera la confirmación
4. Intenta iniciar sesión nuevamente

### **Opción 3: Reset Manual via API**

```bash
# Desde la terminal
curl -X POST http://localhost:3001/reset-rate-limit

# O desde el navegador
fetch('http://localhost:3001/reset-rate-limit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
```

## 🔧 Configuración del Backend

### **Archivo**: `pt-backend/src/index.js`

```javascript
// Rate limiting - más permisivo en desarrollo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 en dev, 100 en prod
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});

// Rate limiting específico para autenticación - más permisivo
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // 100 en dev, 20 en prod
  message: 'Demasiados intentos de autenticación. Intenta de nuevo en unos minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // No contar requests exitosos
});

app.use(limiter);
app.use('/api/auth', authLimiter);
```

## 🔧 Configuración del Frontend

### **Archivo**: `pt-manager/src/services/apiService.ts`

```typescript
// Generic API request function with retry logic for rate limiting
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      let response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        // Manejar rate limiting (429) con retry automático
        if (response.status === 429 && retryCount < maxRetries) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000; // Backoff exponencial: 2s, 4s, 8s
          console.log(`🔄 Rate limit alcanzado, reintentando en ${delay/1000}s... (intento ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new ApiError(errorMessage, response.status);
      }

      return await response.json();
    } catch (error) {
      // Manejo de errores...
    }
  }

  // Si llegamos aquí, se agotaron los reintentos
  throw new ApiError('Se agotaron los reintentos debido al rate limiting. Intenta de nuevo en unos minutos.');
}
```

## 📊 Límites Configurados

| Entorno | Endpoint General | Endpoint Auth | Ventana |
|---------|------------------|---------------|---------|
| **Desarrollo** | 1000 requests | 100 requests | 15 min |
| **Producción** | 100 requests | 20 requests | 15 min |

## 🚨 Cuándo Ocurre el Error

- **Demasiados intentos de login** en un corto período
- **Múltiples requests simultáneos** a la API
- **Desarrollo intensivo** con muchas llamadas a la API

## 💡 Prevención y Solución

### **Solución Automática (Implementada)**
1. ✅ **Retry automático** con backoff exponencial
2. ✅ **Hasta 3 reintentos** para errores 429
3. ✅ **Transparente para el usuario** - no requiere acción

### **Solución Manual (Si es necesario)**
1. **Usar el botón de reset** cuando aparezca
2. **Esperar 15 minutos** para que se resetee automáticamente
3. **Reiniciar el backend** si es necesario

## 🔍 Debugging

### **Verificar Estado del Rate Limit**

```bash
# Ver logs del backend
tail -f pt-backend/server.log

# Verificar endpoint de health
curl http://localhost:3001/health
```

### **Logs del Frontend**

En la consola del navegador, busca:
- `🔄 Rate limit alcanzado, reintentando en 2s... (intento 1/3)`
- `🔄 Rate limit alcanzado, reintentando en 4s... (intento 2/3)`
- `🔄 Rate limit alcanzado, reintentando en 8s... (intento 3/3)`

### **Si se Agotan los Reintentos**

- `❌ Se agotaron los reintentos debido al rate limiting`
- Aparece después de 3 intentos fallidos
- Indica que el rate limit persiste

## ✅ Estado Actual

- ✅ **Rate limiting configurado** correctamente
- ✅ **Límites más permisivos** en desarrollo
- ✅ **Endpoint de reset** implementado
- ✅ **Botón de reset** en el frontend
- ✅ **🆕 Retry automático** implementado
- ✅ **Backoff exponencial** para reintentos
- ✅ **Manejo transparente** de errores 429

## 🆘 Si el Problema Persiste

### **1. Verificar Backend**
```bash
cd pt-backend
npm start
```

### **2. Reset Manual**
```bash
curl -X POST http://localhost:3001/reset-rate-limit
```

### **3. Limpiar Cache**
- Limpia el cache del navegador
- Cierra y abre el navegador

### **4. Verificar Puertos**
```bash
lsof -ti:3001 | xargs kill -9
```

## 🎯 **Beneficios de la Nueva Solución**

### **Para Usuarios**
- ✅ **No más interrupciones** por rate limiting
- ✅ **Reintentos automáticos** transparentes
- ✅ **Experiencia fluida** sin errores 429

### **Para Desarrolladores**
- ✅ **Debugging mejorado** con logs claros
- ✅ **Manejo robusto** de errores de API
- ✅ **Configuración flexible** por entorno

---

**Nota**: Esta configuración es específica para desarrollo. En producción, los límites son más estrictos por seguridad.

**🆕 Nueva funcionalidad**: El frontend ahora maneja automáticamente los errores 429 con reintentos inteligentes.
