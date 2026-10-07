require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Middleware & Services
const { setupWebSocket } = require('./websocket/socketHandler');
const GameController = require('./controllers/gameController');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// ═══════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
app.use(rateLimiter());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ═══════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'AI Financial Prediction Betting Game',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      game: '/api/game',
      user: '/api/user',
      wallet: '/api/wallet',
      admin: '/api/admin'
    },
    websocket: {
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}`,
      events: [
        'join-game',
        'place-bet',
        'round-started',
        'betting-closed',
        'round-result'
      ]
    }
  });
});

// ═══════════════════════════════════════════════════
// WEBSOCKET
// ═══════════════════════════════════════════════════

const { broadcast, startGameLoop } = setupWebSocket(io);

// Attach broadcast to app for controller access
app.locals.broadcast = broadcast;
app.locals.io = io;

// ═��═════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// ═══════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`
╔════════════════════════════════════════╗
║   🎮 AI BETTING GAME SERVER            ║
║   Status: ✅ RUNNING                    ║
║   Port: ${PORT}                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}       ║
│   AI Engine: ${process.env.AI_ENGINE_URL || 'http://localhost:5000'}
║   Database: ${process.env.DATABASE_URL?.split('/').pop() || 'betting_game'}
╚════════════════════════════════════════╝
  `);

  // Initialize game loop
  logger.info('🎲 Initializing game loop...');
  GameController.initializeGameLoop(broadcast);
  
  // Start WebSocket timer
  logger.info('⏱️  Starting WebSocket timer...');
  startGameLoop();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.warn('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io, broadcast };
