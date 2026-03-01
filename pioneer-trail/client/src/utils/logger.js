const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[import.meta.env?.VITE_LOG_LEVEL || 'info'] || 1;

const buffer = [];
const MAX_BUFFER = 100;

function addToBuffer(entry) {
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();
}

function formatEntry(level, message, data) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    data: data || {}
  };
}

export const logger = {
  debug(message, data) {
    const entry = formatEntry('debug', message, data);
    addToBuffer(entry);
    if (currentLevel <= LOG_LEVELS.debug) console.debug(`[DEBUG] ${message}`, data || '');
  },
  info(message, data) {
    const entry = formatEntry('info', message, data);
    addToBuffer(entry);
    if (currentLevel <= LOG_LEVELS.info) console.info(`[INFO] ${message}`, data || '');
  },
  warn(message, data) {
    const entry = formatEntry('warn', message, data);
    addToBuffer(entry);
    if (currentLevel <= LOG_LEVELS.warn) console.warn(`[WARN] ${message}`, data || '');
  },
  error(message, data) {
    const entry = formatEntry('error', message, data);
    addToBuffer(entry);
    if (currentLevel <= LOG_LEVELS.error) console.error(`[ERROR] ${message}`, data || '');
  },
  getBuffer() {
    return [...buffer];
  },
  getErrors(count = 10) {
    return buffer.filter(e => e.level === 'error').slice(-count);
  },
  clear() {
    buffer.length = 0;
  }
};
