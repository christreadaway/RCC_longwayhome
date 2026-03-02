/**
 * Main Express server entry point for The Long Way Home.
 *
 * - Loads environment variables via dotenv
 * - Sets up Express with CORS + JSON body parser
 * - Mounts all API route modules
 * - Serves static client files in production
 * - Listens on PORT (default 3000)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { logger } = require('./logger');

// --- Route modules ---
const sessionRoutes = require('./routes/session');
const historianRoutes = require('./routes/historian');
const npcRoutes = require('./routes/npc');
const insightsRoutes = require('./routes/insights');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3000;

/* ------------------------------------------------------------------ */
/*  Middleware                                                          */
/* ------------------------------------------------------------------ */

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Request logging (debug level so it does not flood production)
app.use((req, _res, next) => {
  logger.debug('HTTP_REQUEST', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  next();
});

/* ------------------------------------------------------------------ */
/*  API Routes                                                          */
/* ------------------------------------------------------------------ */

app.use('/api/session', sessionRoutes);
app.use('/api/historian', historianRoutes);
app.use('/api/npc', npcRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/export', exportRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/* ------------------------------------------------------------------ */
/*  Static file serving (production)                                    */
/* ------------------------------------------------------------------ */

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');

app.use(express.static(clientDistPath));

// SPA fallback — serve index.html for any non-API route
app.get('*', (req, res, next) => {
  // Do not catch API routes that fell through (404s)
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // client/dist may not exist during development — that is fine
      logger.debug('STATIC_FALLBACK_SKIP', { path: req.path, error: err.message });
      res.status(404).json({ error: 'Not found' });
    }
  });
});

// Catch-all 404 for unmatched API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

/* ------------------------------------------------------------------ */
/*  Global error handler                                                */
/* ------------------------------------------------------------------ */

app.use((err, _req, res, _next) => {
  logger.error('UNHANDLED_ERROR', {
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: 'Internal server error' });
});

/* ------------------------------------------------------------------ */
/*  Start server (only when run directly, not when imported)            */
/* ------------------------------------------------------------------ */

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info('SERVER_STARTED', {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
    });
  });
}

module.exports = app;
