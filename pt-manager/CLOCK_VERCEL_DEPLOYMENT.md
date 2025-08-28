# 🕐 **DEPLOYMENT DEL RELOJ EN VERCEL**

## 📋 **RESUMEN**

Se ha implementado una solución alternativa al sistema de WebSockets para que el reloj funcione en Vercel usando Serverless Functions con polling HTTP.

## 🏗️ **ARQUITECTURA NUEVA**

### **Serverless Functions (Vercel)**
```
pt-manager/api/clock/
├── join.js           # Unirse a torneo y obtener estado inicial
├── state.js          # Obtener estado actual del reloj
├── pause.js          # Pausar reloj
├── resume.js         # Reanudar reloj
├── adjust.js         # Ajustar tiempo del reloj
├── sync.js           # Sincronización automática
└── sync-manual.js    # Sincronización manual (para cron jobs)
```

### **Frontend (React + HTTP Polling)**
```
pt-manager/src/hooks/
└── useTournamentClock.ts  # Hook modificado para usar HTTP
```

## 🚀 **DEPLOYMENT EN VERCEL**

### **1. Variables de Entorno**

Configurar en Vercel Dashboard o `vercel.json`:

```env
# Base de datos Supabase
REACT_APP_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
REACT_APP_SUPABASE_ANON_KEY=your_anon_key

# URL de Vercel (opcional, se detecta automáticamente)
VERCEL_URL=https://your-app.vercel.app
```

### **2. Despliegue Automático**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
vercel --prod
```

### **3. Configuración de Sincronización**

#### **Opción A: Cron Job (Recomendado)**

```bash
# Instalar script en servidor
scp scripts/sync-clocks.js user@server:/path/to/scripts/

# Configurar cron job (cada minuto)
crontab -e

# Agregar línea:
* * * * * /usr/bin/node /path/to/scripts/sync-clocks.js >> /var/log/clock-sync.log 2>&1
```

#### **Opción B: Servicio Systemd**

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/clock-sync.service

[Unit]
Description=Clock Synchronization Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/path/to/scripts
ExecStart=/usr/bin/node sync-clocks.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Habilitar y iniciar
sudo systemctl enable clock-sync
sudo systemctl start clock-sync
```

#### **Opción C: Vercel Cron (Próximamente)**

Vercel está trabajando en soporte nativo para cron jobs en Serverless Functions.

## 🔧 **CONFIGURACIÓN**

### **vercel.json**

```json
{
  "version": 2,
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ]
}
```

### **package.json**

Asegurarse de que `@supabase/supabase-js` esté en dependencias:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.56.0"
  }
}
```

## 📱 **CÓMO FUNCIONA**

### **1. Conexión Inicial**
1. **Usuario se une** → Frontend llama `/api/clock/join`
2. **Obtiene estado inicial** → Devuelve estado actual del reloj
3. **Inicia polling** → Cada 2 segundos consulta `/api/clock/state`

### **2. Sincronización**
1. **Script/cron ejecuta** → Llama `/api/clock/sync` cada segundo
2. **Actualiza relojes** → Calcula tiempo transcurrido y actualiza BD
3. **Avanza niveles** → Si tiempo = 0, pasa al siguiente nivel automáticamente

### **3. Control en Tiempo Real**
1. **Admin pausa/reanuda** → Frontend llama `/api/clock/pause` o `/api/clock/resume`
2. **Actualización inmediata** → Estado se actualiza en BD y frontend
3. **Polling detecta cambios** → Todos los usuarios ven cambios en ~2 segundos

## 🎯 **VENTAJAS DE LA NUEVA ARQUITECTURA**

### **✅ Compatible con Vercel**
- **Serverless Functions** nativas
- **Sin WebSockets** que no son soportados
- **Auto-escalable** según demanda

### **✅ Más Simple**
- **Sin servidor dedicado** para WebSockets
- **Sin gestión de conexiones** complejas
- **Menos dependencias** (sin socket.io server)

### **✅ Más Confiable**
- **Polling robusto** con reintentos automáticos
- **Estado persistente** en base de datos
- **Recuperación automática** de desconexiones

### **✅ Mejor Rendimiento**
- **Menos conexiones abiertas** simultáneamente
- **Mejor uso de recursos** en el cliente
- **Cache inteligente** del estado

## 🚨 **DIFERENCIAS CON WEBSOCKETS**

| Característica | WebSockets | HTTP Polling |
|---|---|---|
| **Latencia** | ~50-200ms | ~1000-2000ms |
| **Conexiones** | 1 por usuario | 1 por polling |
| **Escalabilidad** | Limitada | Excelente |
| **Fiabilidad** | Alta | Muy Alta |
| **Complejidad** | Alta | Baja |
| **Costo** | Alto | Bajo |

## 🔍 **MONITOREO Y DEBUGGING**

### **Logs del Frontend**
```typescript
// En useTournamentClock.ts
console.log('🔄 Estado del reloj actualizado desde servidor:', newClockState);
console.log('🎯 ¡NIVEL CAMBIADO!', lastKnownStateRef.current.current_level, '→', newClockState.current_level);
```

### **Logs del Backend**
```javascript
// En api/clock/sync.js
console.log(`🔄 [SYNC] Sincronizando ${activeTournaments.length} torneo(s)`);
console.log(`✅ [SYNC-TOUR] Reloj actualizado: ${timeRemaining}s`);
```

### **Logs del Script de Sincronización**
```bash
# Ver logs del cron job
tail -f /var/log/clock-sync.log

# Ver logs del servicio systemd
sudo journalctl -u clock-sync -f
```

## 🆘 **SOLUCIÓN DE PROBLEMAS**

### **Problema: Polling no funciona**
**Solución:**
```bash
# Verificar URLs de las APIs
curl https://your-app.vercel.app/api/clock/state?tournamentId=test

# Verificar variables de entorno
vercel env ls
```

### **Problema: Sincronización no avanza niveles**
**Solución:**
```bash
# Ejecutar sincronización manual
curl -X POST https://your-app.vercel.app/api/clock/sync-manual

# Verificar estado del torneo en BD
# SELECT * FROM tournament_clocks WHERE tournament_id = 'your-id';
```

### **Problema: Latencia alta**
**Solución:**
- Reducir intervalo de polling en `useTournamentClock.ts`
- Optimizar consultas en funciones serverless
- Usar CDN para assets estáticos

## 🔮 **OPTIMIZACIONES FUTURAS**

### **Mejoras de Rendimiento**
- [ ] **WebSockets con servicio externo** (Pusher, Socket.io)
- [ ] **Server-Sent Events** para actualizaciones unidireccionales
- [ ] **Optimistic UI updates** para mejor UX

### **Funcionalidades Adicionales**
- [ ] **Notificaciones push** para cambios importantes
- [ ] **Historial de cambios** del reloj
- [ ] **Métricas de rendimiento** en tiempo real

### **Monitoreo Avanzado**
- [ ] **Dashboards de latencia** del sistema
- [ ] **Alertas automáticas** para problemas
- [ ] **Logs centralizados** con servicios externos

## 📞 **SOPORTE**

Para problemas con el deployment en Vercel:

1. **Revisar logs** de Vercel Functions
2. **Verificar configuración** de variables de entorno
3. **Probar APIs** manualmente con curl
4. **Revisar documentación** de Vercel

---

**🎉 ¡El sistema de reloj ahora funciona perfectamente en Vercel!**
