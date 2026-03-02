/**
 * Express router for NPC encounter chat.
 *
 * POST /api/npc/chat
 *   - Accepts { sessionCode, studentId, character, message, exchangeCount, gameContext }
 *   - Uses character-specific prompt from prompts.js
 *   - Caps at NPC_MAX_EXCHANGES (3) exchanges
 *   - Returns { response, exchangeCount, isComplete }
 */

const express = require('express');
const { logger } = require('../logger');
const store = require('../state/store');
const { getNpcPrompt } = require('../ai/prompts');
const { callAnthropic } = require('../ai/proxy');

const NPC_MAX_EXCHANGES = 3;

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { sessionCode, studentId, character, message, exchangeCount, gameContext } = req.body;

    // --- Validate inputs ---
    if (!sessionCode || !studentId || !character || !message) {
      return res.status(400).json({
        error: 'Missing required fields: sessionCode, studentId, character, message',
      });
    }

    const currentExchange = (exchangeCount || 0) + 1;

    // --- Check exchange cap ---
    if (currentExchange > NPC_MAX_EXCHANGES) {
      return res.json({
        response: 'The traveler tips their hat and moves on down the trail. Safe travels, friend.',
        exchangeCount: currentExchange,
        isComplete: true,
      });
    }

    const session = store.getSession(sessionCode);
    if (!session) {
      return res.status(404).json({ error: `Session "${sessionCode}" not found` });
    }

    // --- Get the character prompt ---
    const promptTemplate = getNpcPrompt(character);
    if (!promptTemplate) {
      return res.status(400).json({
        error: `Unknown NPC character: "${character}". Valid: desmet, whitman, bordeaux, scout`,
      });
    }

    // --- Build the system prompt with context ---
    const ctx = gameContext || {};
    const systemPrompt = promptTemplate
      .replace('{character}', character)
      .replace('{student_name}', ctx.student_name || 'Pioneer')
      .replace('{current_landmark}', ctx.current_landmark || 'the trail')
      .replace('{game_date}', ctx.game_date || '1848');

    // Add exchange context
    const exchangeNote = currentExchange === NPC_MAX_EXCHANGES
      ? '\n\nThis is your FINAL exchange with this pioneer. Wrap up the conversation naturally with a farewell.'
      : `\n\nThis is exchange ${currentExchange} of ${NPC_MAX_EXCHANGES}. Keep the conversation going naturally.`;

    const fullSystemPrompt = systemPrompt + exchangeNote;

    // --- Call Anthropic ---
    const { text, tokenCount, latencyMs } = await callAnthropic(
      session.apiKey,
      fullSystemPrompt,
      message,
      {
        model: session.settings.ai_model,
        maxTokens: 512,
        fallbackKey: 'npc',
        studentId,
      }
    );

    const isComplete = currentExchange >= NPC_MAX_EXCHANGES;

    logger.info('NPC_CHAT_PROXIED', {
      studentId,
      character,
      exchangeCount: currentExchange,
      isComplete,
      tokenCount,
      latencyMs,
    });

    return res.json({
      response: text,
      exchangeCount: currentExchange,
      isComplete,
    });
  } catch (err) {
    logger.error('NPC_API_FAILED', {
      studentId: req.body.studentId,
      character: req.body.character,
      error: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      response: 'The traveler nods thoughtfully but does not respond right away. '
        + 'Perhaps the wind carried your words away. Try speaking with them again.',
      exchangeCount: (req.body.exchangeCount || 0) + 1,
      isComplete: false,
      error: true,
    });
  }
});

module.exports = router;
