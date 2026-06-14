/**
 * Aarna Solars - Modular Server Entry Point
 * Refactored from monolithic to MVC architecture
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const cookieParser = require('cookie-parser');

// Security middleware
const { helmetMiddleware, publicLimiter } = require('./config/security');

// Middleware
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

// Routes
const publicRoutes = require('./src/routes/public');
const apiRoutes = require('./src/routes/api');
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');

// Auth middleware
const { authLocalsMiddleware } = require('./src/middleware/auth');

// Database & Config
const { testPostgresConnection } = require('./config/postgres');
const runMigrations = require('./migrations/postgres-init');
const mailer = require('./config/mailer');

// Constants
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'aarna-solars-secret-key-2024';

// Express App
const app = express();

// Trust proxy (required for Railway/reverse proxy deployments)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ─── Security & Middleware ─────────────────────────────────────────
app.use(helmetMiddleware);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(publicLimiter);
app.use(cookieParser());

// ─── Session Configuration ─────────────────────────────────────────
const sessionConfig = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
};

// Use PostgreSQL session store when available, otherwise memory store
if (process.env.DATABASE_URL) {
  sessionConfig.store = new pgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: 'session'
  });
}

app.use(session(sessionConfig));
app.use(authLocalsMiddleware);

// ─── Custom Middleware ───────────────────────────────────────────────

// ─── View Engine ───────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Routes ────────────────────────────────────────────────────────
app.use('/', publicRoutes);
app.use('/api', apiRoutes);

// Admin routes
app.use('/admin', authRoutes);
app.use('/admin', adminRoutes);

// ─── Health Check ──────────────────────────────────────────────────
const startTime = Date.now();
let lastError = null;
let lastErrorTime = null;

// Error tracking middleware
app.use((err, _req, _res, next) => {
  lastError = {
    message: err.message,
    stack: err.stack?.split('\n')[0],
    timestamp: new Date().toISOString()
  };
  lastErrorTime = Date.now();
  next(err);
});

app.get('/health', async (_req, res) => {
  const startCheck = Date.now();

  let pgStatus = 'unknown';
  let dbStats = null;
  try {
    const ok = await testPostgresConnection();
    pgStatus = ok ? 'connected' : 'disconnected';

    // Get database stats if connected
    if (ok) {
      const { query } = require('./config/postgres');
      const statsResult = await query(`
        SELECT
          (SELECT COUNT(*) FROM leads) as total_leads,
          (SELECT COUNT(*) FROM quotations) as total_quotations
      `);
      dbStats = statsResult.rows[0];
    }
  } catch (_) {
    pgStatus = 'error';
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const response = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptime,
      formatted: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`
    },
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    },
    database: {
      status: pgStatus,
      stats: dbStats
    },
    smtp: !!process.env.SMTP_PASSWORD,
    responseTime: `${Date.now() - startCheck}ms`,
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version
  };

  // Include last error if recent (within last hour)
  if (lastError && lastErrorTime && (Date.now() - lastErrorTime) < 3600000) {
    response.lastError = lastError;
  }

  res.status(200).json(response);
});

// ─── Error Handling ───────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Server Startup ───────────────────────────────────────────────
async function startServer() {
  console.log('🚀 Starting Aarna Solars server...\n');

  // Test PostgreSQL connection
  console.log('🔌 Testing PostgreSQL connection...');
  const postgresConnected = await testPostgresConnection();

  if (postgresConnected) {
    console.log('✅ PostgreSQL connected');

    // Run migrations
    console.log('📦 Running PostgreSQL migrations...');
    await runMigrations();
    console.log('✅ Migrations completed');

    // Migrate data from JSON files
    console.log('📋 Migrating data from JSON to PostgreSQL...');
    const { migrateDataFromJSON } = require('./migrations/migrate-json-to-postgres');
    await migrateDataFromJSON();
    console.log('✅ Data migration completed');

    // Migrate quotations from JSON to PostgreSQL
    console.log('📋 Migrating quotations to PostgreSQL...');
    const { migrateQuotations } = require('./migrations/migrate-quotations-to-postgres');
    await migrateQuotations();
    console.log('✅ Quotations migration completed');

    // Initialize default admin user
    console.log('🔐 Initializing default admin user...');
    const { initializeDefaultAdmin } = require('./config/auth-simple');
    await initializeDefaultAdmin();
    console.log('✅ Admin user initialization completed');

    // Admin panel enabled
  } else {
    console.log('⚠️  PostgreSQL not available - using JSON file storage for local development');
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`� Website: http://localhost:${PORT}/`);

    // Verify SMTP (non-blocking)
    mailer.verifyConnection().catch(() => {});
  });
}

// ─── Graceful Shutdown ────────────────────────────────────────────
async function gracefulShutdown(signal) {
  console.log(`\n🔄 Received ${signal}. Shutting down gracefully...`);

  // Close PostgreSQL pool
  try {
    const { pool } = require('./config/postgres');
    await pool.end();
    console.log('✅ PostgreSQL pool closed');
  } catch (err) {
    console.error('⚠️  Error closing PostgreSQL pool:', err.message);
  }

  console.log('👋 Goodbye!');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ─── Unhandled Error Handlers ─────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately, let graceful shutdown handle it if needed
});

process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  gracefulShutdown('uncaughtException').catch(() => process.exit(1));
});

// Start
startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
