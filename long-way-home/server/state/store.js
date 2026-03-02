/**
 * In-memory state store for The Long Way Home.
 *
 * Sessions, student states, and API keys live here in memory only.
 * Nothing is persisted to disk — this is intentional for MVP.
 */

const { logger } = require('../logger');

/**
 * Map<sessionCode, SessionObject>
 *
 * SessionObject shape:
 * {
 *   code: string,
 *   password: string,
 *   gradeBand: 'k2' | '3_5' | '6_8',
 *   settings: object,
 *   status: 'active' | 'paused' | 'completed' | 'failed',
 *   apiKey: string | null,          // held in memory only, never persisted / logged
 *   students: Map<studentId, StudentState>,
 *   createdAt: string,              // ISO timestamp
 *   lastActivityAt: string,         // ISO timestamp
 * }
 *
 * StudentState shape:
 * {
 *   studentId: string,
 *   studentName: string,
 *   gameState: object | null,
 *   joinedAt: string,
 *   lastUpdateAt: string,
 * }
 */
const sessions = new Map();

/* ------------------------------------------------------------------ */
/*  Session helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Create a new session.
 * @param {string} code        - Unique session code (e.g. "ABCD12")
 * @param {string} password    - Teacher password for the session
 * @param {string} gradeBand   - 'k2' | '3_5' | '6_8'
 * @param {object} settings    - Session settings (moral_label_mode, etc.)
 * @returns {object} The created session (without the apiKey field for safety)
 */
function createSession(code, password, gradeBand, settings = {}) {
  if (sessions.has(code)) {
    throw new Error(`Session "${code}" already exists`);
  }

  const now = new Date().toISOString();

  const session = {
    code,
    password,
    gradeBand,
    settings: {
      moral_label_mode: settings.moral_label_mode || 'full',
      historian_access: settings.historian_access || 'free',
      chaos_level: settings.chaos_level || 'standard',
      ai_model: settings.ai_model || 'claude-haiku-4-5',
      ai_exam_of_conscience: settings.ai_exam_of_conscience !== undefined ? settings.ai_exam_of_conscience : true,
      scripture_in_labels: settings.scripture_in_labels !== undefined ? settings.scripture_in_labels : true,
      cwm_reveal_end_screen: settings.cwm_reveal_end_screen !== undefined ? settings.cwm_reveal_end_screen : true,
      ...settings,
    },
    status: 'active',
    apiKey: settings.apiKey || process.env.ANTHROPIC_API_KEY_DEV || null,
    students: new Map(),
    createdAt: now,
    lastActivityAt: now,
  };

  // Remove apiKey from the settings copy so it only lives in session.apiKey
  delete session.settings.apiKey;

  sessions.set(code, session);

  logger.info('SESSION_CREATED', {
    sessionCode: code,
    gradeBand,
    hasApiKey: !!session.apiKey,
  });

  return sessionToPublic(session);
}

/**
 * Get a session by code.
 * @param {string} code
 * @returns {object|null} Internal session object (includes apiKey — handle carefully)
 */
function getSession(code) {
  return sessions.get(code) || null;
}

/**
 * Update session-level settings.
 * @param {string} code
 * @param {object} settings
 * @returns {object} Public session representation
 */
function updateSessionSettings(code, settings) {
  const session = sessions.get(code);
  if (!session) throw new Error(`Session "${code}" not found`);

  // If a new apiKey is provided, update it but keep it out of settings
  if (settings.apiKey !== undefined) {
    session.apiKey = settings.apiKey;
    delete settings.apiKey;
  }

  session.settings = { ...session.settings, ...settings };
  session.lastActivityAt = new Date().toISOString();

  logger.info('SESSION_SETTINGS_UPDATED', { sessionCode: code });
  return sessionToPublic(session);
}

/* ------------------------------------------------------------------ */
/*  Student helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Add a student to a session.
 * @param {string} code
 * @param {string} studentId
 * @param {string} studentName
 * @returns {object} The student state object
 */
function addStudent(code, studentId, studentName) {
  const session = sessions.get(code);
  if (!session) throw new Error(`Session "${code}" not found`);

  if (session.students.has(studentId)) {
    throw new Error(`Student "${studentId}" already in session "${code}"`);
  }

  const now = new Date().toISOString();
  const studentState = {
    studentId,
    studentName,
    gameState: null,
    joinedAt: now,
    lastUpdateAt: now,
  };

  session.students.set(studentId, studentState);
  session.lastActivityAt = now;

  logger.info('STUDENT_JOINED', {
    sessionCode: code,
    studentId,
    timestamp: now,
  });

  return studentState;
}

/**
 * Update a student's game state.
 * @param {string} code
 * @param {string} studentId
 * @param {object} gameState
 */
function updateStudentState(code, studentId, gameState) {
  const session = sessions.get(code);
  if (!session) throw new Error(`Session "${code}" not found`);

  const student = session.students.get(studentId);
  if (!student) throw new Error(`Student "${studentId}" not found in session "${code}"`);

  const now = new Date().toISOString();
  student.gameState = gameState;
  student.lastUpdateAt = now;
  session.lastActivityAt = now;

  logger.debug('GAME_STATE_UPDATE', {
    sessionCode: code,
    studentId,
    landmark: gameState.current_landmark,
    partyHealth: gameState.party_health,
    grace: gameState.grace,
  });
}

/**
 * Get all student states for a session (for teacher dashboard polling).
 * @param {string} code
 * @returns {object[]}
 */
function getStudentStates(code) {
  const session = sessions.get(code);
  if (!session) throw new Error(`Session "${code}" not found`);
  return Array.from(session.students.values());
}

/**
 * Get a single student's state.
 * @param {string} code
 * @param {string} studentId
 * @returns {object|null}
 */
function getStudentState(code, studentId) {
  const session = sessions.get(code);
  if (!session) return null;
  return session.students.get(studentId) || null;
}

/* ------------------------------------------------------------------ */
/*  Session control                                                     */
/* ------------------------------------------------------------------ */

function pauseAllGames(code) {
  const session = sessions.get(code);
  if (!session) throw new Error(`Session "${code}" not found`);
  session.status = 'paused';
  session.lastActivityAt = new Date().toISOString();
  logger.info('SESSION_PAUSED', { sessionCode: code });
}

function resumeAllGames(code) {
  const session = sessions.get(code);
  if (!session) throw new Error(`Session "${code}" not found`);
  session.status = 'active';
  session.lastActivityAt = new Date().toISOString();
  logger.info('SESSION_RESUMED', { sessionCode: code });
}

function closeSession(code) {
  const session = sessions.get(code);
  if (!session) throw new Error(`Session "${code}" not found`);
  session.status = 'completed';
  session.apiKey = null; // Clear API key from memory
  session.lastActivityAt = new Date().toISOString();
  logger.info('SESSION_CLOSED', { sessionCode: code });
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                           */
/* ------------------------------------------------------------------ */

/**
 * Strip sensitive fields from a session for public consumption.
 * Never expose password or apiKey.
 */
function sessionToPublic(session) {
  return {
    code: session.code,
    gradeBand: session.gradeBand,
    settings: session.settings,
    status: session.status,
    studentCount: session.students.size,
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
  };
}

module.exports = {
  createSession,
  getSession,
  updateSessionSettings,
  addStudent,
  updateStudentState,
  getStudentStates,
  getStudentState,
  pauseAllGames,
  resumeAllGames,
  closeSession,
};
