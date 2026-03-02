/**
 * Crash Report Route
 *
 * Receives crash reports from the client and persists them to a log file.
 * Each crash report is written as a single JSON line to crash-reports.log
 * so they can be reviewed for debugging.
 *
 * POST /api/session/crash-report
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { logger } = require('../logger');

const router = express.Router();

const CRASH_LOG_FILE = path.join(__dirname, '..', '..', 'crash-reports.log');

router.post('/crash-report', (req, res) => {
  try {
    const report = req.body;

    if (!report || !report.id) {
      return res.status(400).json({ error: 'Invalid crash report' });
    }

    // Log to server logger
    logger.error('CLIENT_CRASH_REPORT', {
      crashId: report.id,
      error: report.error?.message,
      context: report.context,
      phase: report.gameStateSnapshot?.phase,
      trailDay: report.gameStateSnapshot?.trailDay,
    });

    // Write to crash log file (append)
    const logLine = JSON.stringify({
      ...report,
      receivedAt: new Date().toISOString(),
    }) + '\n';

    fs.appendFile(CRASH_LOG_FILE, logLine, (err) => {
      if (err) {
        logger.error('CRASH_LOG_WRITE_FAILED', { error: err.message });
      }
    });

    return res.json({ received: true, crashId: report.id });
  } catch (err) {
    logger.error('CRASH_REPORT_HANDLER_ERROR', { error: err.message });
    return res.status(500).json({ error: 'Failed to process crash report' });
  }
});

/**
 * GET /api/session/crash-reports — Retrieve stored crash reports (for teacher debug panel)
 */
router.get('/crash-reports', (req, res) => {
  try {
    if (!fs.existsSync(CRASH_LOG_FILE)) {
      return res.json({ reports: [] });
    }

    const content = fs.readFileSync(CRASH_LOG_FILE, 'utf8');
    const reports = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try { return JSON.parse(line); }
        catch { return null; }
      })
      .filter(Boolean)
      .slice(-50); // Last 50 reports

    return res.json({ reports });
  } catch (err) {
    logger.error('CRASH_REPORTS_READ_ERROR', { error: err.message });
    return res.status(500).json({ error: 'Failed to read crash reports' });
  }
});

module.exports = router;
