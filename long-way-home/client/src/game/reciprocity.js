/**
 * Stranger Returns (Reciprocity) System
 *
 * After a player helps someone in a CWM event, there is a chance
 * (50%) that the stranger returns 2-4 trail legs later with a reward.
 * This mechanic reinforces the Catholic teaching that charity, while
 * not transactional, often bears unexpected fruit.
 *
 * Reciprocity is not guaranteed — the game does not promise rewards
 * for good deeds. The fire rate is deliberately set at 50% to model
 * real-world unpredictability.
 *
 * @module reciprocity
 */

import { rollReciprocity } from './probability.js';
import { getStrangerReturnsEvent } from './cwm.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Checks whether a reciprocity (Stranger Returns) event should fire
 * on the current trail leg.
 *
 * Conditions:
 * 1. There is at least one pending reciprocity entry
 * 2. Enough legs have passed since the original CWM event (2-4 legs)
 * 3. 50% probability roll succeeds
 *
 * @param {Object} gameState
 * @param {Array} gameState.reciprocity_pending - Array of pending reciprocity entries
 * @param {number} gameState.current_leg - Current trail leg index
 * @returns {{ shouldFire: boolean, event: Object|null, pendingIndex: number|null }}
 */
export function checkReciprocity(gameState) {
  const pending = gameState.reciprocity_pending || [];

  if (pending.length === 0) {
    return { shouldFire: false, event: null, pendingIndex: null };
  }

  // Check each pending reciprocity entry
  for (let i = 0; i < pending.length; i++) {
    const entry = pending[i];
    const legsSince = gameState.current_leg - entry.leg_set;
    const legsRequired = entry.legs_until_eligible || 2;

    // Not yet eligible
    if (legsSince < legsRequired) {
      continue;
    }

    // Roll the 50% probability
    if (!rollReciprocity()) {
      // Failed the roll — mark as attempted so we don't re-check forever
      // The entry stays but we increment attempt count
      // After 3 failed attempts past eligibility, the reciprocity expires
      if (legsSince >= legsRequired + 3) {
        // Mark for removal (expired)
        continue;
      }
      continue;
    }

    // Success — get the Stranger Returns event details
    const strangerEvent = getStrangerReturnsEvent(entry.original_cwm_type);

    if (!strangerEvent) {
      continue;
    }

    return {
      shouldFire: true,
      event: {
        ...strangerEvent,
        original_cwm_type: entry.original_cwm_type,
        leg_set: entry.leg_set,
        leg_fired: gameState.current_leg,
      },
      pendingIndex: i,
    };
  }

  return { shouldFire: false, event: null, pendingIndex: null };
}

/**
 * Processes a reciprocity event, applying rewards to the game state
 * and removing the pending entry.
 *
 * @param {Object} gameState - Current game state
 * @param {Object} event - The reciprocity event from checkReciprocity()
 * @param {Object} event.reward - Reward details
 * @param {number} event.pendingIndex - Index in reciprocity_pending to remove
 * @returns {{
 *   updatedSupplies: Object,
 *   updatedParty: Array,
 *   updatedReciprocityPending: Array,
 *   updatedReciprocityLog: Array,
 *   moraleChange: number,
 *   description: string
 * }}
 */
export function processReciprocityEvent(gameState, event) {
  const reward = event.reward || {};
  const pendingIndex = event.pendingIndex;

  // Clone supplies
  const updatedSupplies = { ...(gameState.supplies || {}) };

  // Apply food reward
  if (reward.food) {
    updatedSupplies.food = (updatedSupplies.food || 0) + reward.food;
  }

  // Apply supply reward
  if (reward.supplies) {
    updatedSupplies.spareParts = (updatedSupplies.spareParts || 0) + reward.supplies;
  }

  // Apply cash reward
  if (reward.cash) {
    updatedSupplies.cash = (updatedSupplies.cash || 0) + reward.cash;
  }

  // Apply health boost to weakest living member
  let updatedParty = [...(gameState.party || [])];
  if (reward.healthBoost) {
    updatedParty = applyHealthBoost(updatedParty, reward.healthBoost);
  }

  // Morale change
  const moraleChange = reward.morale || 10;

  // Remove the fired entry from pending
  const updatedReciprocityPending = [...(gameState.reciprocity_pending || [])];
  if (pendingIndex !== null && pendingIndex !== undefined) {
    updatedReciprocityPending.splice(pendingIndex, 1);
  }

  // Add to reciprocity log
  const logEntry = {
    type: event.type,
    original_cwm_type: event.original_cwm_type,
    leg_fired: gameState.current_leg,
    reward: { ...reward },
    timestamp: new Date().toISOString(),
  };

  const updatedReciprocityLog = [
    ...(gameState.reciprocity_log || []),
    logEntry,
  ];

  return {
    updatedSupplies,
    updatedParty,
    updatedReciprocityPending,
    updatedReciprocityLog,
    moraleChange,
    description: event.description || 'A stranger you helped has returned with a gift.',
  };
}

/**
 * Removes expired reciprocity entries that have gone too long without firing.
 * Called during leg advancement cleanup.
 *
 * @param {Array} reciprocityPending - Current pending entries
 * @param {number} currentLeg - Current trail leg
 * @returns {Array} Cleaned pending entries
 */
export function cleanExpiredReciprocity(reciprocityPending, currentLeg) {
  if (!reciprocityPending || reciprocityPending.length === 0) {
    return [];
  }

  const MAX_LEGS_PAST_ELIGIBLE = 3;

  return reciprocityPending.filter((entry) => {
    const legsSince = currentLeg - entry.leg_set;
    const legsRequired = entry.legs_until_eligible || 2;
    const legsPastEligible = legsSince - legsRequired;
    return legsPastEligible < MAX_LEGS_PAST_ELIGIBLE;
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Applies a health boost to the weakest living party member.
 * Moves them one step up the health ladder (e.g., poor -> fair).
 *
 * @param {Array} party - Party members array
 * @param {number} tiers - Number of health tiers to improve
 * @returns {Array} Updated party array
 */
function applyHealthBoost(party, tiers) {
  const HEALTH_LADDER = ['dead', 'critical', 'poor', 'fair', 'good'];

  // Find the weakest living member
  let weakestIndex = -1;
  let weakestLevel = HEALTH_LADDER.length;

  for (let i = 0; i < party.length; i++) {
    const member = party[i];
    if (member.health === 'dead') continue;

    const level = HEALTH_LADDER.indexOf(member.health);
    if (level < weakestLevel) {
      weakestLevel = level;
      weakestIndex = i;
    }
  }

  if (weakestIndex === -1) return party;

  // Improve health by the specified number of tiers
  const newLevel = Math.min(weakestLevel + tiers, HEALTH_LADDER.length - 1);
  const updatedParty = [...party];
  updatedParty[weakestIndex] = {
    ...updatedParty[weakestIndex],
    health: HEALTH_LADDER[newLevel],
  };

  return updatedParty;
}
