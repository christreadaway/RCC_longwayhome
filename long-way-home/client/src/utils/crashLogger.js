/**
 * Crash Logger
 *
 * Captures comprehensive error context when the app crashes or
 * encounters unexpected errors. Logs are stored in localStorage
 * and sent to the server for persistence.
 *
 * Captures:
 * - Error message and stack trace
 * - What the user was doing (game state phase, last actions)
 * - Recent game state snapshot
 * - Recent event log entries
 * - Browser/environment info
 * - Timestamp
 *
 * @module crashLogger
 */

import { logger } from './logger';

const CRASH_LOG_KEY = 'lwh_crash_logs';
const MAX_STORED_CRASHES = 20;
const SERVER_ENDPOINT = '/api/session/crash-report';

// ---------------------------------------------------------------------------
// Track user actions for context
// ---------------------------------------------------------------------------

const recentActions = [];
const MAX_ACTIONS = 30;

/**
 * Records a user action for crash context.
 * Call this on significant interactions (button clicks, navigation, etc.)
 *
 * @param {string} action - Description of the action
 * @param {Object} [data] - Additional context data
 */
export function trackAction(action, data) {
  recentActions.push({
    action,
    data: data || {},
    timestamp: new Date().toISOString(),
  });
  if (recentActions.length > MAX_ACTIONS) {
    recentActions.shift();
  }
}

// ---------------------------------------------------------------------------
// Crash report creation
// ---------------------------------------------------------------------------

/**
 * Creates a comprehensive crash report from an error.
 *
 * @param {Error} error - The caught error
 * @param {Object} [gameState] - Current game state (if available)
 * @param {string} [context] - Where the error occurred (e.g., 'TravelScreen.travelOneDay')
 * @returns {CrashReport}
 */
export function createCrashReport(error, gameState, context) {
  const report = {
    id: generateCrashId(),
    timestamp: new Date().toISOString(),
    error: {
      message: error.message || String(error),
      name: error.name || 'Error',
      stack: error.stack || 'No stack trace available',
    },
    context: context || 'unknown',
    recentActions: [...recentActions],
    gameStateSnapshot: gameState ? sanitizeGameState(gameState) : null,
    recentEventLog: gameState?.eventLog ? gameState.eventLog.slice(-10) : [],
    environment: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      screenSize: typeof window !== 'undefined'
        ? `${window.innerWidth}x${window.innerHeight}`
        : 'unknown',
      timestamp: new Date().toISOString(),
    },
    logBuffer: logger.getErrors(10),
  };

  return report;
}

/**
 * Logs a crash report: stores locally and attempts to send to server.
 *
 * @param {Error} error - The error
 * @param {Object} [gameState] - Current game state
 * @param {string} [context] - Error context
 */
export function logCrash(error, gameState, context) {
  try {
    const report = createCrashReport(error, gameState, context);

    // Log to console
    logger.error('CRASH_REPORT', {
      id: report.id,
      error: report.error.message,
      context: report.context,
      stack: report.error.stack,
    });

    // Store in localStorage
    storeCrashLocally(report);

    // Attempt to send to server
    sendCrashToServer(report);

    return report;
  } catch (logError) {
    // Last resort: console.error if our logging itself fails
    console.error('CRASH_LOGGER_FAILED', logError, 'Original error:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Local storage
// ---------------------------------------------------------------------------

function storeCrashLocally(report) {
  try {
    if (typeof localStorage === 'undefined') return;

    const existing = JSON.parse(localStorage.getItem(CRASH_LOG_KEY) || '[]');
    existing.push(report);

    // Keep only the most recent crashes
    while (existing.length > MAX_STORED_CRASHES) {
      existing.shift();
    }

    localStorage.setItem(CRASH_LOG_KEY, JSON.stringify(existing));
  } catch (e) {
    // localStorage might be full — try clearing old entries
    try {
      localStorage.setItem(CRASH_LOG_KEY, JSON.stringify([report]));
    } catch (e2) {
      // Can't store locally, that's okay
    }
  }
}

/**
 * Retrieves all locally stored crash reports.
 *
 * @returns {Array<CrashReport>}
 */
export function getStoredCrashes() {
  try {
    if (typeof localStorage === 'undefined') return [];
    return JSON.parse(localStorage.getItem(CRASH_LOG_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Clears all locally stored crash reports.
 */
export function clearStoredCrashes() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CRASH_LOG_KEY);
    }
  } catch (e) {
    // Ignore
  }
}

// ---------------------------------------------------------------------------
// Server reporting
// ---------------------------------------------------------------------------

async function sendCrashToServer(report) {
  try {
    const response = await fetch(SERVER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      logger.warn('CRASH_REPORT_SEND_FAILED', { status: response.status });
    }
  } catch (e) {
    // Network error — report is already stored locally
    logger.debug('CRASH_REPORT_NETWORK_ERROR', { error: e.message });
  }
}

// ---------------------------------------------------------------------------
// Global error handlers
// ---------------------------------------------------------------------------

/**
 * Installs global error handlers for uncaught exceptions and
 * unhandled promise rejections. Call once at app startup.
 *
 * @param {Function} getGameState - Function that returns current game state
 */
export function installGlobalErrorHandlers(getGameState) {
  if (typeof window === 'undefined') return;

  // Uncaught exceptions
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message || 'Unknown error');
    const gameState = typeof getGameState === 'function' ? getGameState() : null;
    logCrash(error, gameState, `window.onerror: ${event.filename}:${event.lineno}`);
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason || 'Unhandled promise rejection'));
    const gameState = typeof getGameState === 'function' ? getGameState() : null;
    logCrash(error, gameState, 'unhandledrejection');
  });
}

// ---------------------------------------------------------------------------
// React Error Boundary helper
// ---------------------------------------------------------------------------

/**
 * For use in React Error Boundary componentDidCatch.
 *
 * @param {Error} error
 * @param {{ componentStack: string }} errorInfo
 * @param {Object} [gameState]
 */
export function logReactError(error, errorInfo, gameState) {
  const context = `React ErrorBoundary: ${errorInfo?.componentStack?.split('\n')[1]?.trim() || 'unknown component'}`;
  logCrash(error, gameState, context);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function generateCrashId() {
  return 'crash_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

/**
 * Sanitizes game state for crash reports — removes large arrays,
 * truncates long strings, keeps essential debugging info.
 */
function sanitizeGameState(state) {
  return {
    phase: state.phase,
    gradeBand: state.gradeBand,
    trailDay: state.trailDay,
    gameDate: state.gameDate,
    currentLandmarkIndex: state.currentLandmarkIndex,
    distanceTraveled: state.distanceTraveled,
    pace: state.pace,
    rations: state.rations,
    morale: state.morale,
    grace: state.grace,
    foodLbs: state.foodLbs,
    cash: state.cash,
    oxenYokes: state.oxenYokes,
    partyHealth: (state.partyMembers || []).map(m => ({
      name: m.name,
      health: m.health,
      alive: m.alive,
    })),
    currentEvent: state.currentEvent ? {
      type: state.currentEvent.type || state.currentEvent.id,
      title: state.currentEvent.title,
    } : null,
    eventLogLength: (state.eventLog || []).length,
    status: state.status,
    isPaused: state.isPaused,
  };
}

/**
 * @typedef {Object} CrashReport
 * @property {string} id - Unique crash ID
 * @property {string} timestamp - ISO timestamp
 * @property {{ message: string, name: string, stack: string }} error
 * @property {string} context - Where the error occurred
 * @property {Array} recentActions - Last 30 user actions
 * @property {Object|null} gameStateSnapshot - Sanitized game state
 * @property {Array} recentEventLog - Last 10 event log entries
 * @property {Object} environment - Browser/device info
 * @property {Array} logBuffer - Recent error log entries
 */
