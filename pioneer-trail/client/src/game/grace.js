/**
 * Grace Meter Logic
 *
 * The Grace meter is the moral/spiritual health tracker for the player.
 * It ranges from 0 (DEPLETED) to 100 (HIGH) and affects gameplay through
 * illness modifiers, event probabilities, score multipliers, and narrative
 * outcomes at journey's end.
 *
 * All Grace mutations must go through updateGrace() which enforces clamping,
 * history tracking, and logging.
 *
 * @module grace
 */

import { GRACE_RANGES, GRACE_DELTAS, GAME_CONSTANTS } from '@shared/types';

/**
 * Creates a fresh Grace state object with the initial value.
 *
 * @returns {{ value: number, history: Array<{ delta: number, trigger: string, timestamp: string, resultValue: number }> }}
 */
export function createGraceState() {
  return {
    value: GAME_CONSTANTS.INITIAL_GRACE,
    history: [],
  };
}

/**
 * Applies a Grace change, clamping between 0 and 100, and records it in history.
 * Returns a new state object (does not mutate the input).
 *
 * @param {{ value: number, history: Array }} graceState - Current grace state
 * @param {number} delta - Amount to change (positive or negative)
 * @param {string} trigger - Identifier for what caused this change (e.g. 'CWM_HELP', 'SUNDAY_REST')
 * @returns {{ value: number, history: Array<{ delta: number, trigger: string, timestamp: string, resultValue: number }> }}
 *
 * @example
 * const state = createGraceState(); // { value: 50, history: [] }
 * const next = updateGrace(state, GRACE_DELTAS.CWM_HELP, 'CWM_HELP');
 * // next.value === 65, next.history has one entry
 */
export function updateGrace(graceState, delta, trigger) {
  if (typeof delta !== 'number' || Number.isNaN(delta)) {
    throw new Error(`Grace delta must be a number, received: ${delta}`);
  }
  if (!trigger || typeof trigger !== 'string') {
    throw new Error('Grace update requires a trigger string');
  }

  const newValue = clamp(graceState.value + delta, 0, 100);
  const entry = {
    delta,
    trigger,
    timestamp: new Date().toISOString(),
    resultValue: newValue,
  };

  return {
    value: newValue,
    history: [...graceState.history, entry],
  };
}

/**
 * Determines the named range for a given Grace value.
 *
 * @param {number} value - Grace value (0-100)
 * @returns {'HIGH' | 'MODERATE' | 'LOW' | 'DEPLETED'}
 */
export function getGraceRange(value) {
  if (value >= GRACE_RANGES.HIGH.min) return 'HIGH';
  if (value >= GRACE_RANGES.MODERATE.min) return 'MODERATE';
  if (value >= GRACE_RANGES.LOW.min) return 'LOW';
  return 'DEPLETED';
}

/**
 * Returns gameplay effect modifiers based on current Grace value.
 * These modifiers are consumed by probability.js, engine.js, and events.js
 * to adjust game difficulty and outcomes.
 *
 * @param {number} value - Grace value (0-100)
 * @returns {{
 *   illnessModifier: number,
 *   goodEventModifier: number,
 *   scoreMultiplier: number,
 *   moralFloor: number,
 *   guaranteedHardship: boolean,
 *   guaranteedStrangerHelp: boolean
 * }}
 *
 * @example
 * const effects = getGraceEffects(80);
 * // effects.illnessModifier === -0.1 (reduces illness chance)
 * // effects.goodEventModifier === 0.15 (more good events)
 * // effects.scoreMultiplier === 1.5
 */
export function getGraceEffects(value) {
  const range = getGraceRange(value);

  switch (range) {
    case 'HIGH':
      return {
        /** Reduces illness probability */
        illnessModifier: -0.1,
        /** Increases good event probability */
        goodEventModifier: 0.15,
        /** Score multiplier at end of game */
        scoreMultiplier: 1.5,
        /** Morale cannot drop below this value */
        moralFloor: 30,
        /** Whether hardship events are guaranteed (narrative consequence) */
        guaranteedHardship: false,
        /** Whether stranger help is guaranteed when available */
        guaranteedStrangerHelp: false,
      };

    case 'MODERATE':
      return {
        illnessModifier: 0,
        goodEventModifier: 0,
        scoreMultiplier: 1.0,
        moralFloor: 15,
        guaranteedHardship: false,
        guaranteedStrangerHelp: false,
      };

    case 'LOW':
      return {
        illnessModifier: 0.1,
        goodEventModifier: -0.1,
        scoreMultiplier: 0.75,
        moralFloor: 5,
        guaranteedHardship: false,
        guaranteedStrangerHelp: false,
      };

    case 'DEPLETED':
      return {
        illnessModifier: 0.25,
        goodEventModifier: -0.2,
        scoreMultiplier: 0.5,
        moralFloor: 0,
        guaranteedHardship: true,
        guaranteedStrangerHelp: false,
      };

    default:
      // Should never reach here, but return neutral effects as safety
      return {
        illnessModifier: 0,
        goodEventModifier: 0,
        scoreMultiplier: 1.0,
        moralFloor: 0,
        guaranteedHardship: false,
        guaranteedStrangerHelp: false,
      };
  }
}

/**
 * Convenience: returns the GRACE_DELTAS constant object for use outside this module.
 *
 * @returns {typeof GRACE_DELTAS}
 */
export function getGraceDeltas() {
  return { ...GRACE_DELTAS };
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
