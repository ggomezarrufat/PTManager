# 🚀 Guía de Despliegue en Vercel - PTManager

## 📋 Requisitos Previos

- Cuenta en [Vercel](https://vercel.com)
- Proyecto conectado a GitHub/GitLab/Bitbucket
- Node.js 18+ instalado localmente

## 🔧 Configuración del Proyecto

### 1. Estructura de Archivos
```
PTManager/
├── vercel.json              # Configuración principal (functions para backend)
├── pt-backend/
│   ├── vercel.json         # Configuración específica del backend (functions)
│   └── src/
│       └── index.js        # Punto de entrada del servidor
├── pt-manager/
│   ├── vercel.json         # Configuración específica del frontend (builds)
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
- **Destino**: `pt-backend/src/index.js`
- **Tipo**: Serverless Functions (más eficiente)
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

### Límites de Función (Backend)
```json
{
  "functions": {
    "pt-backend/src/index.js": {
      "maxDuration": 30
    }
  }
}
```

### Builds (Frontend)
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
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

### Error: "The functions property cannot be used in conjunction with the builds property"
- ✅ **SOLUCIONADO**: El backend usa `functions` y el frontend usa `builds` en archivos separados
- El archivo raíz `vercel.json` solo define `functions` para el backend
- El archivo `pt-manager/vercel.json` solo define `builds` para el frontend

### Error: "Module not found"
- Verifica que `pt-backend/package.json` esté en la raíz del proyecto
- Asegúrate de que las dependencias estén instaladas

### Error: "Build failed"
- Revisa los logs de build en Vercel
- Verifica que `vercel-build.sh` tenga permisos de ejecución
- Confirma que todas las dependencias estén en `package.json`

### Error: "API routes not working"
- Verifica que las rutas en `vercel.json` estén correctas
- Confirma que el backend esté configurado para el puerto correcto
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
