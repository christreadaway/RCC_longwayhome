/**
 * Server-side logger for Pioneer Trail / The Long Way Home.
 *
 * - Respects LOG_LEVEL env var (debug | info | warn | error). Default: info
 * - Each entry is a single JSON line: { timestamp, level, message, data }
 * - NEVER logs API keys — presence is logged as Y/N only.
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = () => {
  const env = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return LOG_LEVELS[env] !== undefined ? LOG_LEVELS[env] : LOG_LEVELS.info;
};

/**
 * Sanitise a data object so that API keys are never emitted.
 * Keys whose name contains "key", "token", or "secret" (case-insensitive)
 * are replaced with a boolean presence indicator.
 */
const SENSITIVE_PATTERNS = /key|token|secret|password|credential/i;

function sanitize(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const clean = {};
  for (const [k, v] of Object.entries(data)) {
    if (SENSITIVE_PATTERNS.test(k)) {
      clean[k] = v ? 'Y' : 'N';
    } else if (typeof v === 'object' && v !== null) {
      clean[k] = sanitize(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

function emit(level, message, data) {
  if (LOG_LEVELS[level] < currentLevel()) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data !== undefined ? { data: sanitize(data) } : {}),
  };

  const line = JSON.stringify(entry);

  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

const logger = {
  debug: (message, data) => emit('debug', message, data),
  info: (message, data) => emit('info', message, data),
  warn: (message, data) => emit('warn', message, data),
  error: (message, data) => emit('error', message, data),
};

module.exports = { logger };
