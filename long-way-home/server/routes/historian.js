/**
 * Express router for the AI Historian feature.
 *
 * POST /api/historian/query
 *   - Accepts { sessionCode, studentId, question, gameContext }
 *   - Retrieves the API key from the session store
 *   - Builds the historian prompt with game context
 *   - Calls the Anthropic API (or returns a fallback on failure)
 *   - Logs studentId, tokenCount, latencyMs (never the key)
 *   - Returns { response, timestamp }
 */

const express = require('express');
const { logger } = require('../logger');
const store = require('../state/store');
const { HISTORIAN_SYSTEM } = require('../ai/prompts');
const { callAnthropic } = require('../ai/proxy');

const router = express.Router();

router.post('/query', async (req, res) => {
  try {
    const { sessionCode, studentId, question, gameContext } = req.body;

    // --- Validate inputs ---
    if (!sessionCode || !studentId || !question) {
      return res.status(400).json({
        error: 'Missing required fields: sessionCode, studentId, question',
      });
    }

    const session = store.getSession(sessionCode);
    if (!session) {
      return res.status(404).json({ error: `Session "${sessionCode}" not found` });
    }

    // --- Build the system prompt with context ---
    const ctx = gameContext || {};
    const systemPrompt = HISTORIAN_SYSTEM
      .replace('{student_name}', ctx.student_name || 'Pioneer')
      .replace('{party_names}', ctx.party_names || 'your fellow travelers')
      .replace('{current_landmark}', ctx.current_landmark || 'the trail')
      .replace('{game_date}', ctx.game_date || '1848')
      .replace('{last_event_description}', ctx.last_event_description || 'none');

    // --- Call Anthropic ---
    const { text, tokenCount, latencyMs } = await callAnthropic(
      session.apiKey,
      systemPrompt,
      question,
      {
        model: session.settings.ai_model,
        fallbackKey: 'historian',
        studentId,
      }
    );

    logger.info('HISTORIAN_PROXIED', {
      studentId,
      tokenCount,
      model: session.settings.ai_model,
      latencyMs,
    });

    return res.json({
      response: text,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('HISTORIAN_API_FAILED', {
      studentId: req.body.studentId,
      error: err.message,
      stack: err.stack,
      fallbackShown: true,
    });

    return res.status(500).json({
      response: 'I seem to have lost my train of thought there on the dusty trail. '
        + 'Could you ask me again?',
      timestamp: new Date().toISOString(),
      error: true,
    });
  }
});

module.exports = router;
