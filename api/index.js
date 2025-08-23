const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
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

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:5000,http://localhost:5001,https://a907eb818f3b.ngrok-free.app').split(',');
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Swagger documentation
swaggerSetup(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Poker Tournament API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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
app.use('*', (req, res) => {
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
      '/api/players/*',
      '/api/tournaments/:id/clock',
      '/api/players/:id/rebuys',
      '/api/players/:id/addons',
      '/api/reports/*',
      '/api/seasons/*'
    ]
  });
});

// Error handling middleware
app.use(errorHandler);

// Export for Vercel
module.exports = app;
