/**
 * Probability Calculations
 *
 * Central module for all random-outcome calculations in the game.
 * Every probability check in the game should route through this module
 * so that balance tuning happens in one place.
 *
 * All functions are pure (no side effects) except for the random number
 * generation in rollProbability(). For testing, you can replace
 * Math.random by injecting a custom random function.
 *
 * @module probability
 */

import {
  PACE_MULTIPLIER,
  RATIONS_CONSUMPTION,
  GAME_CONSTANTS,
  HEALTH_ORDER,
} from '@shared/types';

// ---------------------------------------------------------------------------
// Core roll
// ---------------------------------------------------------------------------

/**
 * Rolls against a probability threshold.
 *
 * @param {number} chance - Probability between 0 and 1
 * @returns {boolean} true if the roll succeeds (event fires)
 *
 * @example
 * rollProbability(0.25) // true ~25% of the time
 */
export function rollProbability(chance) {
  if (chance <= 0) return false;
  if (chance >= 1) return true;
  return Math.random() < chance;
}

// ---------------------------------------------------------------------------
// Illness
// ---------------------------------------------------------------------------

/** Base illness probability per day (before modifiers) */
const BASE_ILLNESS_PROBABILITY = 0.06;

/** Terrain type modifiers for illness chance */
const TERRAIN_ILLNESS_MODIFIER = {
  plains: 0,
  desert: 0.08,
  mountain: 0.05,
  river_crossing: 0.03,
  swamp: 0.1,
  forest: 0.02,
};

/**
 * Calculates the probability that a party member contracts an illness on a given day.
 *
 * Factors:
 * - Pace: grueling increases risk, steady decreases it
 * - Rations: bare_bones increases risk, filling decreases it
 * - Terrain: desert/swamp are dangerous
 * - Grace effects: high grace reduces illness, depleted grace increases it
 *
 * @param {import('../../../shared/types.js').Pace} pace
 * @param {import('../../../shared/types.js').Rations} rations
 * @param {string} terrain - Terrain type from landmarks data
 * @param {{ illnessModifier: number }} graceEffects - From grace.getGraceEffects()
 * @returns {number} Probability between 0 and 1
 */
export function calculateIllnessProbability(pace, rations, terrain, graceEffects) {
  let probability = BASE_ILLNESS_PROBABILITY;

  // Pace modifier — grueling wears people down
  const paceMultiplier = PACE_MULTIPLIER[pace] || 1.0;
  probability *= paceMultiplier;

  // Rations modifier — less food means weaker immune system
  const rationsPerPerson = RATIONS_CONSUMPTION[rations] || 2;
  if (rationsPerPerson <= 1) {
    probability += 0.08; // bare_bones
  } else if (rationsPerPerson >= 3) {
    probability -= 0.02; // filling
  }

  // Terrain modifier
  const terrainMod = TERRAIN_ILLNESS_MODIFIER[terrain] || 0;
  probability += terrainMod;

  // Grace effects modifier
  probability += (graceEffects.illnessModifier || 0);

  // Prayer reduction (applied globally via grace effects)
  // Additional reduction from PRAYER_ILLNESS_REDUCTION is already in graceEffects

  return clamp(probability, 0, 0.9);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Base probabilities for different event categories */
const BASE_EVENT_PROBABILITIES = {
  illness: 0.06,
  weather: 0.08,
  breakdown: 0.05,
  theft: 0.04,
  windfall: 0.06,
  encounter: 0.07,
  cwm: 0.1,
  river_crossing: 0.15,
  hunting: 0.08,
  feast_day: 0.03,
};

/**
 * Calculates the probability that a specific event type fires on a given day.
 *
 * @param {string} eventType - Event category key
 * @param {Object} gameState - Current game state
 * @param {number} gameState.current_leg - Current trail leg index
 * @param {number} gameState.trailStops - Total trail stops
 * @param {string} [gameState.terrain] - Current terrain type
 * @param {{ goodEventModifier: number, guaranteedHardship: boolean }} graceEffects
 * @returns {number} Probability between 0 and 1
 */
export function calculateEventProbability(eventType, gameState, graceEffects) {
  let probability = BASE_EVENT_PROBABILITIES[eventType] || 0.05;

  // Progress modifier — events intensify as the trail goes on
  const progress = (gameState.current_leg || 0) / (gameState.trailStops || 15);
  probability += progress * 0.03;

  // Grace modifiers for "good" events
  const goodEvents = ['windfall', 'encounter', 'feast_day'];
  const badEvents = ['illness', 'theft', 'breakdown'];

  if (goodEvents.includes(eventType)) {
    probability += (graceEffects.goodEventModifier || 0);
  }

  if (badEvents.includes(eventType)) {
    probability -= (graceEffects.goodEventModifier || 0);
    // Guaranteed hardship at depleted grace
    if (graceEffects.guaranteedHardship) {
      probability = Math.max(probability, 0.3);
    }
  }

  return clamp(probability, 0, 0.95);
}

// ---------------------------------------------------------------------------
// Death check
// ---------------------------------------------------------------------------

/**
 * Determines whether a party member at critical health dies on this day.
 * Only called for members already at 'critical' health status.
 *
 * @param {{ health: string, daysAtCritical: number }} member - Party member data
 * @param {import('../../../shared/types.js').Rations} rations - Current ration setting
 * @returns {boolean} true if the member dies
 */
export function calculateDeathCheck(member, rations) {
  if (member.health !== 'critical') return false;

  // Base death probability for critical members
  let probability = 0.08;

  // Starvation accelerates death
  const rationsPerPerson = RATIONS_CONSUMPTION[rations] || 2;
  if (rationsPerPerson <= 1) {
    probability += 0.1;
  }

  // Each day at critical increases the risk
  const daysAtCritical = member.daysAtCritical || 0;
  probability += daysAtCritical * 0.04;

  return rollProbability(clamp(probability, 0, 0.7));
}

// ---------------------------------------------------------------------------
// River crossing
// ---------------------------------------------------------------------------

/** Outcome modifiers by crossing method */
const RIVER_METHOD_RISK = {
  ford: 0.35,
  caulk: 0.2,
  ferry: 0.05,
  indian_guide: 0.02,
};

/**
 * Calculates the outcome of a river crossing attempt.
 *
 * @param {string} method - Crossing method: 'ford', 'caulk', 'ferry', 'indian_guide'
 * @param {number} depth - River depth in feet (1-6)
 * @param {number} wagonWeight - Total wagon weight in lbs
 * @returns {{ success: boolean, losses: { food: number, supplies: number, oxen: number, drowned: boolean } }}
 */
export function calculateRiverCrossingOutcome(method, depth, wagonWeight) {
  const baseRisk = RIVER_METHOD_RISK[method] || 0.2;

  // Depth multiplier — deeper water is more dangerous
  const depthFactor = Math.min(depth / 3, 2.0);

  // Weight factor — heavier wagons are harder to cross
  const weightFactor = wagonWeight > 2000 ? 1.3 : wagonWeight > 1000 ? 1.1 : 1.0;

  const failProbability = clamp(baseRisk * depthFactor * weightFactor, 0, 0.9);
  const success = !rollProbability(failProbability);

  if (success) {
    return {
      success: true,
      losses: { food: 0, supplies: 0, oxen: 0, drowned: false },
    };
  }

  // Calculate losses on failure — severity scales with depth
  const severityRoll = Math.random();
  const isMinor = severityRoll < 0.5;
  const isMajor = severityRoll >= 0.8;

  return {
    success: false,
    losses: {
      food: isMinor ? Math.floor(Math.random() * 30 + 10) : Math.floor(Math.random() * 80 + 40),
      supplies: isMinor ? 0 : Math.floor(Math.random() * 3 + 1),
      oxen: isMajor ? 1 : 0,
      drowned: isMajor && depth >= 5 && rollProbability(0.15),
    },
  };
}

// ---------------------------------------------------------------------------
// Specific probability rolls (named for clarity in calling code)
// ---------------------------------------------------------------------------

/**
 * Rolls whether a CWM event recipient is deceptive (25% chance).
 *
 * @returns {boolean}
 */
export function rollCwmDeceptive() {
  return rollProbability(GAME_CONSTANTS.CWM_DECEPTIVE_PROBABILITY);
}

/**
 * Rolls whether a reconciliation event fires (40% chance).
 *
 * @returns {boolean}
 */
export function rollReconciliation() {
  return rollProbability(GAME_CONSTANTS.RECONCILIATION_PROBABILITY);
}

/**
 * Rolls whether a reciprocity (Stranger Returns) event fires (50% chance).
 *
 * @returns {boolean}
 */
export function rollReciprocity() {
  return rollProbability(GAME_CONSTANTS.RECIPROCITY_FIRE_PROBABILITY);
}

/**
 * Calculates the probability of a blizzard based on how far past the
 * mountain pass deadline the player is.
 *
 * @param {string|Date} gameDate - Current in-game date
 * @param {string|Date} mountainPassDeadline - The deadline date (Oct 15, 1848)
 * @returns {number} Probability between 0 and BLIZZARD_PROBABILITY_LATE
 */
export function calculateBlizzardProbability(gameDate, mountainPassDeadline) {
  const current = new Date(gameDate);
  const deadline = new Date(mountainPassDeadline || GAME_CONSTANTS.MOUNTAIN_PASS_DEADLINE);

  if (current <= deadline) {
    return 0;
  }

  // Days past deadline
  const daysPast = Math.floor((current - deadline) / (1000 * 60 * 60 * 24));

  // Probability ramps up: 10% per week past deadline, capped at BLIZZARD_PROBABILITY_LATE
  const probability = Math.min(
    daysPast * (0.1 / 7),
    GAME_CONSTANTS.BLIZZARD_PROBABILITY_LATE
  );

  return clamp(probability, 0, GAME_CONSTANTS.BLIZZARD_PROBABILITY_LATE);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Clamps a number between min and max (inclusive).
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
