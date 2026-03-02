/**
 * Express router for session management.
 *
 * Routes:
 *   POST   /api/session/create         - Create new session
 *   POST   /api/session/:code/join     - Student joins a session
 *   GET    /api/session/:code/students - Get all student states (dashboard polling)
 *   PUT    /api/session/:code/state    - Update student game state
 *   POST   /api/session/:code/pause    - Pause all games
 *   POST   /api/session/:code/resume   - Resume all games
 *   PUT    /api/session/:code/settings - Update session settings
 *   GET    /api/session/:code/info     - Get session info
 *   POST   /api/session/:code/verify   - Verify teacher password
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../logger');
const store = require('../state/store');

const router = express.Router();

/* ------------------------------------------------------------------ */
/*  POST /create — Create a new session                                 */
/* ------------------------------------------------------------------ */
router.post('/create', (req, res) => {
  try {
    const { code, password, gradeBand, settings } = req.body;

    if (!code || !password || !gradeBand) {
      return res.status(400).json({
        error: 'Missing required fields: code, password, gradeBand',
      });
    }

    const validBands = ['k2', '3_5', '6_8'];
    if (!validBands.includes(gradeBand)) {
      return res.status(400).json({
        error: `Invalid gradeBand. Must be one of: ${validBands.join(', ')}`,
      });
    }

    const session = store.createSession(code, password, gradeBand, settings || {});
    return res.status(201).json({ session });
  } catch (err) {
    logger.error('SESSION_CREATE_ERROR', { error: err.message });
    if (err.message.includes('already exists')) {
      return res.status(409).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to create session' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /:code/join — Student joins a session                          */
/* ------------------------------------------------------------------ */
router.post('/:code/join', (req, res) => {
  try {
    const { code } = req.params;
    const { studentName } = req.body;

    if (!studentName) {
      return res.status(400).json({ error: 'Missing required field: studentName' });
    }

    const session = store.getSession(code);
    if (!session) {
      return res.status(404).json({ error: `Session "${code}" not found` });
    }

    if (session.status !== 'active') {
      return res.status(403).json({ error: `Session is ${session.status}. Cannot join.` });
    }

    const studentId = uuidv4();
    const studentState = store.addStudent(code, studentId, studentName);

    return res.status(201).json({
      studentId: studentState.studentId,
      studentName: studentState.studentName,
      gradeBand: session.gradeBand,
      settings: session.settings,
    });
  } catch (err) {
    logger.error('STUDENT_JOIN_ERROR', { code: req.params.code, error: err.message });
    return res.status(500).json({ error: 'Failed to join session' });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /:code/students — All student states (teacher dashboard)        */
/* ------------------------------------------------------------------ */
router.get('/:code/students', (req, res) => {
  try {
    const { code } = req.params;

    const session = store.getSession(code);
    if (!session) {
      return res.status(404).json({ error: `Session "${code}" not found` });
    }

    const students = store.getStudentStates(code);
    return res.json({
      sessionCode: code,
      status: session.status,
      students,
    });
  } catch (err) {
    logger.error('STUDENTS_FETCH_ERROR', { code: req.params.code, error: err.message });
    return res.status(500).json({ error: 'Failed to fetch student states' });
  }
});

/* ------------------------------------------------------------------ */
/*  PUT /:code/state — Update student game state                        */
/* ------------------------------------------------------------------ */
router.put('/:code/state', (req, res) => {
  try {
    const { code } = req.params;
    const { studentId, gameState } = req.body;

    if (!studentId || !gameState) {
      return res.status(400).json({ error: 'Missing required fields: studentId, gameState' });
    }

    const session = store.getSession(code);
    if (!session) {
      return res.status(404).json({ error: `Session "${code}" not found` });
    }

    store.updateStudentState(code, studentId, gameState);
    return res.json({ success: true });
  } catch (err) {
    logger.error('STATE_UPDATE_ERROR', {
      code: req.params.code,
      studentId: req.body.studentId,
      error: err.message,
    });
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to update game state' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /:code/pause — Pause all games                                 */
/* ------------------------------------------------------------------ */
router.post('/:code/pause', (req, res) => {
  try {
    const { code } = req.params;

    const session = store.getSession(code);
    if (!session) {
      return res.status(404).json({ error: `Session "${code}" not found` });
    }

    store.pauseAllGames(code);
    return res.json({ success: true, status: 'paused' });
  } catch (err) {
    logger.error('SESSION_PAUSE_ERROR', { code: req.params.code, error: err.message });
    return res.status(500).json({ error: 'Failed to pause session' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /:code/resume — Resume all games                               */
/* ------------------------------------------------------------------ */
router.post('/:code/resume', (req, res) => {
  try {
    const { code } = req.params;

    const session = store.getSession(code);
    if (!session) {
      return res.status(404).json({ error: `Session "${code}" not found` });
    }

    store.resumeAllGames(code);
    return res.json({ success: true, status: 'active' });
  } catch (err) {
    logger.error('SESSION_RESUME_ERROR', { code: req.params.code, error: err.message });
    return res.status(500).json({ error: 'Failed to resume session' });
  }
});

/* ------------------------------------------------------------------ */
/*  PUT /:code/settings — Update session settings                       */
/* ------------------------------------------------------------------ */
router.put('/:code/settings', (req, res) => {
  try {
    const { code } = req.params;
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Request body must be a settings object' });
    }

    const session = store.getSession(code);
    if (!session) {
      return res.status(404).json({ error: `Session "${code}" not found` });
    }

    const updated = store.updateSessionSettings(code, settings);
    return res.json({ session: updated });
  } catch (err) {
    logger.error('SETTINGS_UPDATE_ERROR', { code: req.params.code, error: err.message });
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /:code/info — Get session info (public)                         */
/* ------------------------------------------------------------------ */
router.get('/:code/info', (req, res) => {
  try {
    const { code } = req.params;

    const session = store.getSession(code);
    if (!session) {
      return res.status(404).json({ error: `Session "${code}" not found` });
    }

    return res.json({
      code: session.code,
      gradeBand: session.gradeBand,
      settings: session.settings,
      status: session.status,
      studentCount: session.students.size,
      createdAt: session.createdAt,
    });
  } catch (err) {
    logger.error('SESSION_INFO_ERROR', { code: req.params.code, error: err.message });
    return res.status(500).json({ error: 'Failed to get session info' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /:code/verify — Verify teacher password                        */
/* ------------------------------------------------------------------ */
router.post('/:code/verify', (req, res) => {
  try {
    const { code } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Missing required field: password' });
    }

    const session = store.getSession(code);
    if (!session) {
      return res.status(404).json({ error: `Session "${code}" not found` });
    }

    const valid = session.password === password;

    logger.info('SESSION_VERIFY', {
      sessionCode: code,
      valid,
    });

    return res.json({ valid });
  } catch (err) {
    logger.error('SESSION_VERIFY_ERROR', { code: req.params.code, error: err.message });
    return res.status(500).json({ error: 'Failed to verify password' });
  }
});

module.exports = router;
