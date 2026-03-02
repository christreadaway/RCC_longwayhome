/**
 * Express router for teacher AI insights.
 *
 * POST /api/insights/generate
 *   - Accepts { sessionCode, aggregateData }
 *   - Sends anonymized aggregate data to AI for analysis
 *   - Returns { insights: string[] }
 */

const express = require('express');
const { logger } = require('../logger');
const store = require('../state/store');
const { TEACHER_INSIGHTS } = require('../ai/prompts');
const { callAnthropic } = require('../ai/proxy');

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { sessionCode, aggregateData } = req.body;

    // --- Validate inputs ---
    if (!sessionCode) {
      return res.status(400).json({
        error: 'Missing required field: sessionCode',
      });
    }

    const session = store.getSession(sessionCode);
    if (!session) {
      return res.status(404).json({ error: `Session "${sessionCode}" not found` });
    }

    // --- Build the prompt ---
    const dataStr = typeof aggregateData === 'string'
      ? aggregateData
      : JSON.stringify(aggregateData || {}, null, 2);

    const systemPrompt = TEACHER_INSIGHTS.replace('{aggregate_data}', dataStr);

    // --- Call Anthropic ---
    const { text, tokenCount, latencyMs } = await callAnthropic(
      session.apiKey,
      systemPrompt,
      'Please generate teaching insights based on the student data provided.',
      {
        model: session.settings.ai_model,
        maxTokens: 2048,
        fallbackKey: 'insights',
        studentId: 'teacher',
      }
    );

    logger.info('INSIGHTS_GENERATED', {
      sessionCode,
      tokenCount,
      latencyMs,
    });

    // Parse the AI response into separate insights (split on double newline / paragraphs)
    const insights = text
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return res.json({ insights });
  } catch (err) {
    logger.error('INSIGHTS_FAILED', {
      sessionCode: req.body.sessionCode,
      error: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      insights: [
        'Unable to generate AI insights at this time. '
        + 'Review the student data manually for patterns in moral decision-making, '
        + 'grace scores, and Works of Mercy engagement.',
      ],
      error: true,
    });
  }
});

module.exports = router;
