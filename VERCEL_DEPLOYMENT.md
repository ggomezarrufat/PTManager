# 🚀 Guía de Despliegue en Vercel - PTManager

## 📋 Requisitos Previos

- Cuenta en [Vercel](https://vercel.com)
- Proyecto conectado a GitHub/GitLab/Bitbucket
- Node.js 18+ instalado localmente

## 🔧 Configuración del Proyecto

### 1. Estructura de Archivos
```
PTManager/
├── vercel.json              # Configuración principal
├── api/                     # Directorio para funciones serverless
│   ├── index.js            # Punto de entrada de la API
│   └── package.json        # Dependencias de la API
├── pt-backend/             # Código fuente del backend
│   ├── src/
│   │   ├── routes/         # Rutas de la API
│   │   ├── middleware/     # Middleware
│   │   └── config/         # Configuraciones
│   └── package.json        # Dependencias del backend
├── pt-manager/             # Frontend React
│   ├── vercel.json         # Configuración del frontend
│   └── package.json        # Dependencias del frontend
└── vercel-build.sh         # Script de build personalizado
```

### 2. Variables de Entorno
Configura las siguientes variables en el dashboard de Vercel:

```bash
# Backend
NODE_ENV=production
PORT=3001
CORS_ORIGINS=https://tu-dominio.vercel.app

# Supabase
SUPABASE_URL=tu_url_supabase
SUPABASE_ANON_KEY=tu_clave_anonima

# JWT
JWT_SECRET=tu_secreto_jwt
```

## 🚀 Pasos de Despliegue

### Opción 1: Despliegue Automático (Recomendado)

1. **Conecta tu repositorio** a Vercel
2. **Configura el proyecto**:
   - Framework Preset: `Other`
   - Root Directory: `.` (raíz del proyecto)
   - Build Command: `bash vercel-build.sh`
   - Output Directory: `pt-manager/build`

3. **Variables de entorno**: Agrega todas las variables necesarias
4. **Deploy**: Vercel detectará automáticamente los cambios

### Opción 2: Despliegue Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Desplegar
vercel --prod
```

## 🔄 Configuración de Rutas

### Backend API (Serverless Functions)
- **Rutas**: `/api/*`
- **Destino**: `/api/index.js` (directorio api/)
- **Tipo**: Serverless Functions automáticas
- **Ejemplos**:
  - `/api/auth/login`
  - `/api/tournaments`
  - `/api/users`

### Frontend (Static Build)
- **Rutas**: `/*` (cualquier ruta que no sea `/api/*`)
- **Destino**: `pt-manager/build`
- **Tipo**: Static Build
- **SPA**: Todas las rutas redirigen a `index.html`

## ⚙️ Configuración Avanzada

### Estructura del Directorio API
Vercel automáticamente detecta y despliega funciones serverless desde el directorio `api/`:

```
api/
├── index.js                 # Función principal (/api/*)
├── package.json             # Dependencias
└── [otras-funciones].js    # Funciones adicionales si las necesitas
```

### Rutas en vercel.json
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "pt-manager/build/$1"
    }
  ]
}
```

### Headers Personalizados
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

## 🐛 Solución de Problemas

### Error: "The pattern doesn't match any Serverless Functions inside the api directory"
- ✅ **SOLUCIONADO**: Ahora usamos el directorio `api/` estándar de Vercel
- El archivo `api/index.js` es detectado automáticamente
- No necesitamos configurar `functions` manualmente

### Error: "Module not found"
- Verifica que `api/package.json` tenga las dependencias correctas
- Asegúrate de que el script de build instale las dependencias en `api/`

### Error: "Build failed"
- Revisa los logs de build en Vercel
- Verifica que `vercel-build.sh` tenga permisos de ejecución
- Confirma que todas las dependencias estén en `package.json`

### Error: "API routes not working"
- Verifica que las rutas en `vercel.json` estén correctas
- Confirma que el archivo `api/index.js` esté bien configurado
- Revisa los logs de función en Vercel

## 📱 URLs de Despliegue

- **Frontend**: `https://tu-proyecto.vercel.app`
- **API**: `https://tu-proyecto.vercel.app/api`
- **Health Check**: `https://tu-proyecto.vercel.app/api/health`

## 🔍 Monitoreo

- **Logs**: Dashboard de Vercel → Functions → Logs
- **Métricas**: Dashboard de Vercel → Analytics
- **Performance**: Dashboard de Vercel → Speed Insights

## 📞 Soporte

- [Documentación de Vercel](https://vercel.com/docs)
- [Comunidad de Vercel](https://github.com/vercel/vercel/discussions)
- [Soporte de Vercel](https://vercel.com/support)
