/**
 * AI API proxy for The Long Way Home.
 *
 * All AI calls go through callAnthropic().
 * - Uses fetch to call the Anthropic Messages API
 * - Handles errors gracefully with FALLBACK_RESPONSES
 * - Logs token usage and latency (NEVER the API key)
 * - Default model: claude-haiku-4-5 (configurable per session)
 */

const { logger } = require('../logger');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5';
const DEFAULT_MAX_TOKENS = 1024;

/* ------------------------------------------------------------------ */
/*  Fallback responses                                                  */
/* ------------------------------------------------------------------ */

const FALLBACK_RESPONSES = {
  historian: 'I seem to have lost my train of thought there on the dusty trail. '
    + 'Could you ask me again? The wind out here plays tricks on an old professor\'s memory.',

  npc: 'The traveler nods thoughtfully but does not respond right away. '
    + 'Perhaps the wind carried your words away. Try speaking with them again.',

  exam_conscience: 'Your journey along the trail was filled with choices — some easy, some hard. '
    + 'Take a moment to reflect on the decisions you made and the people you helped along the way. '
    + 'Every choice mattered, and every act of kindness left its mark.',

  insights: 'Unable to generate AI insights at this time. '
    + 'Review the student data manually for patterns in moral decision-making, '
    + 'grace scores, and Works of Mercy engagement.',
};

/* ------------------------------------------------------------------ */
/*  Core API call                                                       */
/* ------------------------------------------------------------------ */

/**
 * Call the Anthropic Messages API.
 *
 * @param {string} apiKey       - The teacher's Anthropic API key (held in memory only)
 * @param {string} systemPrompt - The system prompt (from prompts.js)
 * @param {string} userMessage  - The user/student message
 * @param {object} [options]    - Optional overrides
 * @param {string} [options.model]       - Model override (default: claude-haiku-4-5)
 * @param {number} [options.maxTokens]   - Max tokens override (default: 1024)
 * @param {string} [options.fallbackKey] - Key into FALLBACK_RESPONSES if call fails
 * @param {string} [options.studentId]   - For logging
 * @returns {Promise<{text: string, tokenCount: number, latencyMs: number}>}
 */
async function callAnthropic(apiKey, systemPrompt, userMessage, options = {}) {
  const model = options.model || DEFAULT_MODEL;
  const maxTokens = options.maxTokens || DEFAULT_MAX_TOKENS;
  const fallbackKey = options.fallbackKey || 'historian';
  const studentId = options.studentId || 'unknown';

  // If no API key, return fallback immediately
  if (!apiKey) {
    logger.warn('AI_CALL_NO_KEY', { studentId, fallbackKey });
    return {
      text: FALLBACK_RESPONSES[fallbackKey] || FALLBACK_RESPONSES.historian,
      tokenCount: 0,
      latencyMs: 0,
    };
  }

  const startTime = Date.now();

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read error body');
      logger.error('AI_API_HTTP_ERROR', {
        studentId,
        statusCode: response.status,
        error: errorBody.substring(0, 500), // Truncate to avoid logging huge bodies
        latencyMs,
      });
      return {
        text: FALLBACK_RESPONSES[fallbackKey] || FALLBACK_RESPONSES.historian,
        tokenCount: 0,
        latencyMs,
      };
    }

    const data = await response.json();
    const text = data.content && data.content[0] && data.content[0].text
      ? data.content[0].text
      : FALLBACK_RESPONSES[fallbackKey];

    const inputTokens = (data.usage && data.usage.input_tokens) || 0;
    const outputTokens = (data.usage && data.usage.output_tokens) || 0;
    const tokenCount = inputTokens + outputTokens;

    logger.info('AI_CALL_SUCCESS', {
      studentId,
      model,
      inputTokens,
      outputTokens,
      tokenCount,
      latencyMs,
    });

    return { text, tokenCount, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - startTime;

    logger.error('AI_CALL_EXCEPTION', {
      studentId,
      error: err.message,
      stack: err.stack,
      latencyMs,
    });

    return {
      text: FALLBACK_RESPONSES[fallbackKey] || FALLBACK_RESPONSES.historian,
      tokenCount: 0,
      latencyMs,
    };
  }
}

module.exports = {
  callAnthropic,
  FALLBACK_RESPONSES,
};
