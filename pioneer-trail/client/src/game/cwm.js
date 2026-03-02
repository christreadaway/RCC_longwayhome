/**
 * Corporal Works of Mercy + Deceptive Charity
 *
 * Manages CWM (Corporal Works of Mercy) events — opportunities for the player
 * to practice charity on the trail. Some recipients may be deceptive (25%),
 * but the player cannot know this. Grace accrues identically regardless.
 *
 * The deceptive flag is stored in gameState.cwm_events[] for teacher dashboard
 * visibility only. It must NEVER appear in any student-facing UI, text, or component.
 *
 * @module cwm
 */

import { GAME_CONSTANTS, GRACE_DELTAS } from '@shared/types';
import { rollCwmDeceptive } from './probability.js';

// ---------------------------------------------------------------------------
// CWM event type definitions
// ---------------------------------------------------------------------------

/**
 * All recognized CWM event type keys. These correspond to entries
 * in events.json that have `is_cwm: true`.
 */
const CWM_EVENT_TYPES = [
  'cwm_feed_hungry',
  'cwm_shelter_homeless',
  'cwm_clothe_naked',
  'cwm_visit_sick',
  'cwm_visit_imprisoned',
  'cwm_bury_dead',
  'cwm_give_drink',
];

/**
 * Mapping from CWM event types to their Stranger Returns event types.
 * When a player helps someone, the stranger may return later to repay the kindness.
 */
const STRANGER_RETURNS_MAP = {
  cwm_feed_hungry: {
    type: 'stranger_returns_food',
    description: 'A traveler you shared food with found extra provisions and brought them to your wagon.',
    reward: { food: 40 },
  },
  cwm_shelter_homeless: {
    type: 'stranger_returns_shelter',
    description: 'The family you sheltered returns with spare wagon parts and warm blankets.',
    reward: { supplies: 2, morale: 10 },
  },
  cwm_clothe_naked: {
    type: 'stranger_returns_clothing',
    description: 'The person you clothed found work at a trading post and brings you supplies.',
    reward: { supplies: 1, cash: 25 },
  },
  cwm_visit_sick: {
    type: 'stranger_returns_medicine',
    description: 'The sick traveler you cared for recovered and shares healing herbs with your party.',
    reward: { healthBoost: 1 },
  },
  cwm_visit_imprisoned: {
    type: 'stranger_returns_guidance',
    description: 'The man you visited brings word of a safer trail passage ahead.',
    reward: { trailAdvantage: true },
  },
  cwm_bury_dead: {
    type: 'stranger_returns_gratitude',
    description: 'Relatives of the deceased you buried express deep gratitude and share provisions.',
    reward: { food: 30, morale: 15 },
  },
  cwm_give_drink: {
    type: 'stranger_returns_water',
    description: 'The thirsty traveler you helped leads you to a clean spring.',
    reward: { healthBoost: 1, morale: 5 },
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Determines whether a CWM event should fire on this trail leg.
 *
 * Checks:
 * 1. Maximum CWM events for this game not yet reached
 * 2. Party is not in a crisis state (multiple critical/dead members)
 * 3. Guaranteed CWM if past Fort Laramie and none fired yet
 *
 * @param {Object} gameState
 * @param {Array} gameState.cwm_events - Array of CWM events already fired
 * @param {number} gameState.current_leg - Current trail leg index
 * @param {Array} gameState.party - Party members array
 * @param {string} gameState.gradeBand - Current grade band
 * @param {number} maxCwmEvents - From feature flags
 * @returns {boolean}
 */
export function shouldFireCwmEvent(gameState, maxCwmEvents) {
  const firedCount = (gameState.cwm_events || []).length;
  const max = maxCwmEvents || GAME_CONSTANTS.CWM_MAX_PER_GAME;

  // Already hit max
  if (firedCount >= max) {
    return false;
  }

  // Party in crisis — 2 or more members critical or dead
  const crisisMembers = (gameState.party || []).filter(
    (m) => m.health === 'critical' || m.health === 'dead'
  );
  if (crisisMembers.length >= 2) {
    return false;
  }

  // Guarantee at least one CWM event by mid-trail (roughly Fort Laramie)
  // Fort Laramie is approximately leg 5 of 15, or 1/3 of the trail
  const midTrail = Math.floor((gameState.trailStops || 15) / 3);
  if (gameState.current_leg >= midTrail && firedCount === 0) {
    return true;
  }

  // Otherwise, return true to indicate eligibility — the caller (events.js)
  // handles the actual probability roll
  return true;
}

/**
 * Selects a CWM event from the available events pool.
 * Avoids repeating event types already fired in this game.
 *
 * @param {Object} gameState
 * @param {Array} gameState.cwm_events - Previously fired CWM events
 * @param {Array} events - Available CWM events from events.json (filtered for is_cwm: true)
 * @returns {Object|null} Selected event object, or null if none available
 */
export function selectCwmEvent(gameState, events) {
  const firedTypes = (gameState.cwm_events || []).map((e) => e.type);

  // Filter to events whose type hasn't already been used
  const available = events.filter((e) => !firedTypes.includes(e.type));

  if (available.length === 0) {
    // Fallback: allow repeats if all types exhausted
    return events.length > 0
      ? events[Math.floor(Math.random() * events.length)]
      : null;
  }

  // Random selection from available
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Assigns the deceptive flag for a CWM event recipient.
 * 25% probability. The flag is for teacher dashboard only —
 * it must NEVER appear in student-facing UI.
 *
 * @returns {boolean} true if the recipient is deceptive
 */
export function assignDeceptiveFlag() {
  return rollCwmDeceptive();
}

/**
 * Processes the player's choice on a CWM event and returns the resulting
 * state changes.
 *
 * @param {Object} gameState - Current game state
 * @param {Object} event - The CWM event object
 * @param {string} event.type - CWM event type key
 * @param {'helped' | 'declined'} choice - Player's choice
 * @returns {{
 *   updatedCwmEvents: Array,
 *   graceChange: number,
 *   graceTrigger: string,
 *   moraleChange: number,
 *   reciprocitySet: boolean,
 *   reciprocityData: Object|null,
 *   labelId: string
 * }}
 */
export function processCwmChoice(gameState, event, choice) {
  const isHelped = choice === 'helped';
  const isDeceptive = assignDeceptiveFlag();

  // Determine if the player is at hardship (low food/health)
  const atHardship = isPlayerAtHardship(gameState);

  // Grace change
  let graceChange;
  let graceTrigger;
  if (isHelped) {
    graceChange = atHardship ? GRACE_DELTAS.CWM_HELP_HARDSHIP : GRACE_DELTAS.CWM_HELP;
    graceTrigger = atHardship ? 'CWM_HELP_HARDSHIP' : 'CWM_HELP';
  } else {
    graceChange = GRACE_DELTAS.CWM_DECLINE;
    graceTrigger = 'CWM_DECLINE';
  }

  // Morale change
  const moraleChange = isHelped ? 10 : -5;

  // Record the CWM event (deceptive flag stored for teacher dashboard only)
  const cwmRecord = {
    type: event.type,
    choice,
    recipient_genuine: !isDeceptive,
    leg: gameState.current_leg,
    timestamp: new Date().toISOString(),
  };

  // Set reciprocity if the player helped
  const reciprocitySet = isHelped;
  const reciprocityData = isHelped
    ? {
        original_cwm_type: event.type,
        legs_until_eligible: 2 + Math.floor(Math.random() * 3), // 2-4 legs
        leg_set: gameState.current_leg,
      }
    : null;

  // Label ID for moral labels system
  // CRITICAL: Use same label for deceptive as genuine — never reference deceptive flag
  const labelId = `${event.type}_${choice}`;

  return {
    updatedCwmEvents: [...(gameState.cwm_events || []), cwmRecord],
    graceChange,
    graceTrigger,
    moraleChange,
    reciprocitySet,
    reciprocityData,
    labelId,
  };
}

/**
 * Returns the Stranger Returns event details for a given original CWM event type.
 *
 * @param {string} originalCwmType - The CWM event type that triggered reciprocity
 * @returns {{ type: string, description: string, reward: Object }|null}
 */
export function getStrangerReturnsEvent(originalCwmType) {
  return STRANGER_RETURNS_MAP[originalCwmType] || null;
}

/**
 * Returns the list of valid CWM event type keys.
 *
 * @returns {string[]}
 */
export function getCwmEventTypes() {
  return [...CWM_EVENT_TYPES];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Determines whether the player is currently in hardship
 * (low food or multiple party members in poor/critical health).
 *
 * @param {Object} gameState
 * @returns {boolean}
 */
function isPlayerAtHardship(gameState) {
  // Low food check
  if ((gameState.supplies?.food || 0) < GAME_CONSTANTS.FOOD_WARNING_LBS) {
    return true;
  }

  // Party health check — 2+ members at poor or worse
  const unhealthyCount = (gameState.party || []).filter(
    (m) => m.health === 'poor' || m.health === 'critical'
  ).length;

  return unhealthyCount >= 2;
}
