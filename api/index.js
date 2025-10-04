// Vercel serverless function entry point
// Este archivo es requerido por Vercel para las funciones serverless

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
require('dotenv').config();

const swaggerSetup = require('../pt-backend/src/config/swagger');
const authRoutes = require('../pt-backend/src/routes/auth');
const userRoutes = require('../pt-backend/src/routes/users');
const tournamentRoutes = require('../pt-backend/src/routes/tournaments');
const playerRoutes = require('../pt-backend/src/routes/players');
const rebuyRoutes = require('../pt-backend/src/routes/rebuys');
const addonRoutes = require('../pt-backend/src/routes/addons');
const clockRoutes = require('../pt-backend/src/routes/clocks');
const errorHandler = require('../pt-backend/src/middleware/errorHandler');
const reportRoutes = require('../pt-backend/src/routes/reports');
const seasonRoutes = require('../pt-backend/src/routes/seasons');

const app = express();

// Configuración de CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' && allowedOrigins.length > 0
    ? allowedOrigins
    : function (origin, callback) {
        callback(null, true);
      },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('/*', cors(corsOptions));

// Security middleware
app.use(helmet());

// Rate limiting - configurado para Vercel
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests en Vercel
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  keyGenerator: (req) => {
    // En Vercel, usar X-Forwarded-For si está disponible
    if (req.headers['x-forwarded-for']) {
      return req.headers['x-forwarded-for'].split(',')[0].trim();
    }
    return req.ip;
  }
});

// Aplicar rate limiting global
app.use(limiter);

// Rate limiting específico para auth (más restrictivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 intentos de login por IP cada 15 minutos
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.headers['x-forwarded-for']) {
      return req.headers['x-forwarded-for'].split(',')[0].trim();
    }
    return req.ip;
  }
});

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Swagger documentation
swaggerSetup(app);

// Aplicar rate limiting a auth antes de las rutas
app.use('/api/auth', authLimiter);

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

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'No se encontró la ruta en el backend',
    message: `La ruta ${req.originalUrl} no existe`,
    timestamp: new Date().toISOString()
  });
});

// Exportar la app para Vercel
module.exports = app;