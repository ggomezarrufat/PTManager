const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const http = require('http');
require('dotenv').config();

const swaggerSetup = require('./config/swagger');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tournamentRoutes = require('./routes/tournaments');
const playerRoutes = require('./routes/players');
const rebuyRoutes = require('./routes/rebuys');
const addonRoutes = require('./routes/addons');
const clockRoutes = require('./routes/clocks');
const errorHandler = require('./middleware/errorHandler');
const reportRoutes = require('./routes/reports');
const seasonRoutes = require('./routes/seasons');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Servicio de actualización automática del reloj del torneo
const tournamentClockService = require('./services/tournamentClockService');

// Inicializar servicio de actualización automática del reloj
tournamentClockService.init();

// WebSocket eliminado - usando HTTP polling para sincronización del reloj
console.log('📡 Usando HTTP polling para sincronización del reloj (sin WebSocket)');
console.log('⏰ Servicio de actualización automática del reloj inicializado');

// Configuración para Vercel y entornos serverless
// Trust proxy es necesario para que express-rate-limit funcione correctamente
// en entornos donde hay proxies (como Vercel)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  console.log('🔒 Production: Trust proxy configurado para Vercel');
} else {
  console.log('🔓 Development: Trust proxy no configurado');
}

// CORS configuration (permitir múltiples orígenes en dev) – debe ir antes que cualquier otra cosa
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:5000,http://localhost:5001,https://a907eb818f3b.ngrok-free.app').split(',');
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? allowedOrigins
    : function (origin, callback) {
        // En desarrollo, permitir cualquier origin (incluyendo archivos locales)
        callback(null, true);
      },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
// Preflight global
app.options('/*', cors(corsOptions));

// Security middleware
app.use(helmet());

// Rate limiting - más permisivo en desarrollo y Vercel
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 1000, // 1000 requests en desarrollo, 500 en producción (Vercel)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health',
  // Configuración específica para Vercel
  keyGenerator: (req) => {
    // En producción (Vercel), usar X-Forwarded-For si está disponible
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-for']) {
      return req.headers['x-forwarded-for'].split(',')[0].trim();
    }
    // En desarrollo, usar ipKeyGenerator helper para manejar IPv6 correctamente
    return ipKeyGenerator(req);
  }
});

// Rate limiting específico para autenticación - más permisivo para Vercel
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 100, // 100 intentos tanto en desarrollo como en producción (Vercel)
  message: 'Demasiados intentos de autenticación. Intenta de nuevo en unos minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
  // Configuración específica para Vercel
  keyGenerator: (req) => {
    // En producción (Vercel), usar X-Forwarded-For si está disponible
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-for']) {
      return req.headers['x-forwarded-for'].split(',')[0].trim();
    }
    // En desarrollo, usar ipKeyGenerator helper para manejar IPv6 correctamente
    return ipKeyGenerator(req);
  }
});

app.use(limiter);
app.use('/api/auth', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Logging adicional para debugging en producción
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log('🌐 Production Request:', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      xForwardedFor: req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    next();
  });

  // Log de rate limiting en producción
  app.use((req, res, next) => {
    // Log cuando se alcanza el rate limit
    res.on('finish', () => {
      if (res.statusCode === 429) {
        const clientIP = req.headers['x-forwarded-for'] ? 
          req.headers['x-forwarded-for'].split(',')[0].trim() : req.ip;
        console.log('🚫 Production Rate Limit Hit:', {
          path: req.path,
          method: req.method,
          clientIP,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        });
      }
    });
    next();
  });
}

// Swagger documentation
swaggerSetup(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Poker Tournament API is running',
    timestamp: new Date().toISOString(),
    version: require('../package.json').version
  });
});

// Rate limit reset endpoint (disponible en desarrollo y producción para debugging)
app.post('/reset-rate-limit', (req, res) => {
  // Reset rate limiters
  const clientIP = req.headers['x-forwarded-for'] ? 
    req.headers['x-forwarded-for'].split(',')[0].trim() : req.ip;
  
  limiter.resetKey(clientIP);
  authLimiter.resetKey(clientIP);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Production: Rate limits reset for IP:', clientIP);
  }
  
  res.status(200).json({
    message: 'Rate limits reset successfully',
    timestamp: new Date().toISOString(),
    clientIP,
    environment: process.env.NODE_ENV
  });
});



// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api', playerRoutes);
app.use('/api', rebuyRoutes);
app.use('/api', addonRoutes);
app.use('/api', clockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/seasons', seasonRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/health',
      '/api-docs',
      '/api/auth/*',
      '/api/users/*',
      '/api/tournaments/*',
      '/api/tournaments/:id/players',
      '/api/tournaments/:id/clock',
      '/api/tournaments/:id/clock/reset',
      '/api/players/*',
      '/api/players/:id/eliminate',
      '/api/players/:id/rebuys',
      '/api/players/:id/addons',
      '/api/clock/*',
      '/api/reports/leaderboard'
    ]
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Poker Tournament API running on port ${PORT}`);
  console.log(`🔌 WebSocket Server initialized for tournament clocks`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo de errores no capturados para evitar que el servidor se cierre
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // No salir del proceso para mantener el servidor corriendo
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // No salir del proceso para mantener el servidor corriendo
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
