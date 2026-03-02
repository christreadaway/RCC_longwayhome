/**
 * Reconciliation (Make It Right) System
 *
 * After a player makes a sinful choice (declining CWM help, exploiting
 * a trade, etc.), the game may offer a reconciliation event 1-2 legs
 * later. This gives the player a chance to make amends and recover grace.
 *
 * Reconciliation events:
 * - Fire at 40% probability per eligible leg
 * - Only available for 3_5 and 6_8 grade bands
 * - Fire at most once per original sinful choice
 * - Clear the reconciliation_pending flag when resolved
 *
 * @module reconciliation
 */

import { GRACE_DELTAS, GAME_CONSTANTS } from '@shared/types';
import { rollReconciliation } from './probability.js';

// ---------------------------------------------------------------------------
// Reconciliation event templates by sin type
// ---------------------------------------------------------------------------

/**
 * Maps sinful choice event types to their reconciliation event details.
 * Each entry provides the narrative and choices for making amends.
 */
const RECONCILIATION_EVENTS = {
  cwm_feed_hungry_declined: {
    type: 'reconciliation_feed_hungry',
    title: 'A Second Chance to Help',
    description: 'You come across the same hungry traveler, now weaker than before. Your party has a little more food now.',
    choices: [
      { id: 'help', text: 'Share your food this time', outcome: 'taken' },
      { id: 'decline', text: 'Keep walking', outcome: 'declined' },
    ],
  },
  cwm_shelter_homeless_declined: {
    type: 'reconciliation_shelter',
    title: 'Make It Right',
    description: 'A family with small children sits by the trail in the rain. You have room in your wagon to offer shelter for the night.',
    choices: [
      { id: 'help', text: 'Offer them shelter', outcome: 'taken' },
      { id: 'decline', text: 'Pass by', outcome: 'declined' },
    ],
  },
  cwm_clothe_naked_declined: {
    type: 'reconciliation_clothe',
    title: 'Another Opportunity',
    description: 'A shivering traveler needs warm clothing. You notice you have spare garments.',
    choices: [
      { id: 'help', text: 'Give them your spare clothes', outcome: 'taken' },
      { id: 'decline', text: 'Hold onto your supplies', outcome: 'declined' },
    ],
  },
  cwm_visit_sick_declined: {
    type: 'reconciliation_visit_sick',
    title: 'A Chance to Care',
    description: 'Another sick traveler lies by the trail. This time the illness looks serious, and you have herbs that might help.',
    choices: [
      { id: 'help', text: 'Stop and tend to them', outcome: 'taken' },
      { id: 'decline', text: 'Move on quickly', outcome: 'declined' },
    ],
  },
  cwm_give_drink_declined: {
    type: 'reconciliation_give_drink',
    title: 'Thirst on the Trail',
    description: 'You find a traveler collapsed from dehydration near the trail. Your water supply is holding.',
    choices: [
      { id: 'help', text: 'Share your water', outcome: 'taken' },
      { id: 'decline', text: 'Conserve your water', outcome: 'declined' },
    ],
  },
  exploit_trade: {
    type: 'reconciliation_fair_trade',
    title: 'An Honest Deal',
    description: 'You meet another trader who trusts you completely. You could deal fairly this time.',
    choices: [
      { id: 'fair', text: 'Make a fair trade', outcome: 'taken' },
      { id: 'exploit', text: 'Take advantage again', outcome: 'declined' },
    ],
  },
  overhunt: {
    type: 'reconciliation_stewardship',
    title: 'Caring for Creation',
    description: 'Your party comes across a rich hunting ground. You could take only what you need.',
    choices: [
      { id: 'moderate', text: 'Hunt only what you need', outcome: 'taken' },
      { id: 'excess', text: 'Hunt as much as possible', outcome: 'declined' },
    ],
  },
};

/**
 * Generic reconciliation event used when no specific template matches.
 */
const GENERIC_RECONCILIATION = {
  type: 'reconciliation_generic',
  title: 'A Moment of Reflection',
  description: 'As you walk the trail, you feel a pull to do better. An opportunity to help someone presents itself.',
  choices: [
    { id: 'help', text: 'Help this time', outcome: 'taken' },
    { id: 'decline', text: 'Keep going', outcome: 'declined' },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Checks whether a reconciliation event should fire on the current trail leg.
 *
 * Conditions:
 * 1. There is at least one pending reconciliation
 * 2. Grade band is 3_5 or 6_8 (not k2)
 * 3. Enough legs have passed (1-2 legs since sin)
 * 4. 40% probability roll succeeds
 *
 * @param {Object} gameState
 * @param {Array} gameState.reconciliation_pending - Array of pending reconciliation entries
 * @param {number} gameState.current_leg - Current trail leg index
 * @param {string} gameState.gradeBand - Current grade band
 * @returns {{ shouldFire: boolean, event: Object|null, pendingIndex: number|null }}
 */
export function checkReconciliation(gameState) {
  // Only available for 3_5 and 6_8
  if (gameState.gradeBand === 'k2') {
    return { shouldFire: false, event: null, pendingIndex: null };
  }

  const pending = gameState.reconciliation_pending || [];

  if (pending.length === 0) {
    return { shouldFire: false, event: null, pendingIndex: null };
  }

  for (let i = 0; i < pending.length; i++) {
    const entry = pending[i];

    // Must be 1-2 legs after the sin
    const legsSince = gameState.current_leg - entry.leg_of_sin;
    if (legsSince < 1) {
      continue;
    }

    // After 2 legs past sin without firing, the opportunity expires
    if (legsSince > 3) {
      continue;
    }

    // Roll the 40% probability
    if (!rollReconciliation()) {
      continue;
    }

    // Find the matching reconciliation event template
    const template = RECONCILIATION_EVENTS[entry.sin_type] || GENERIC_RECONCILIATION;

    return {
      shouldFire: true,
      event: {
        ...template,
        original_sin_type: entry.sin_type,
        leg_of_sin: entry.leg_of_sin,
        leg_fired: gameState.current_leg,
      },
      pendingIndex: i,
    };
  }

  return { shouldFire: false, event: null, pendingIndex: null };
}

/**
 * Processes the player's choice on a reconciliation event.
 *
 * @param {Object} gameState - Current game state
 * @param {boolean} taken - Whether the player chose to make amends (true) or declined again (false)
 * @param {Object} event - The reconciliation event from checkReconciliation()
 * @returns {{
 *   updatedReconciliationPending: Array,
 *   updatedReconciliationLog: Array,
 *   graceChange: number,
 *   graceTrigger: string,
 *   moraleChange: number,
 *   labelId: string
 * }}
 */
export function processReconciliationChoice(gameState, taken, event) {
  const pendingIndex = event.pendingIndex;

  // Grace and morale changes
  let graceChange;
  let graceTrigger;
  let moraleChange;
  let labelId;

  if (taken) {
    graceChange = GRACE_DELTAS.RECONCILIATION_TAKEN;
    graceTrigger = 'RECONCILIATION_TAKEN';
    moraleChange = 8;
    labelId = 'reconciliation_taken';
  } else {
    // Declining reconciliation a second time has harsher consequences
    graceChange = GRACE_DELTAS.CWM_DECLINE; // Same as original decline
    graceTrigger = 'RECONCILIATION_DECLINED';
    moraleChange = -8;
    labelId = 'reconciliation_declined_second_time';
  }

  // Remove from pending
  const updatedReconciliationPending = [
    ...(gameState.reconciliation_pending || []),
  ];
  if (pendingIndex !== null && pendingIndex !== undefined) {
    updatedReconciliationPending.splice(pendingIndex, 1);
  }

  // Add to reconciliation log
  const logEntry = {
    type: event.type,
    original_sin_type: event.original_sin_type,
    taken,
    leg_fired: gameState.current_leg,
    timestamp: new Date().toISOString(),
  };

  const updatedReconciliationLog = [
    ...(gameState.reconciliation_log || []),
    logEntry,
  ];

  return {
    updatedReconciliationPending,
    updatedReconciliationLog,
    graceChange,
    graceTrigger,
    moraleChange,
    labelId,
  };
}

/**
 * Adds a sinful choice to the reconciliation pending queue.
 * Called when the player makes a sinful choice (declining CWM, exploiting, etc.)
 *
 * @param {Array} currentPending - Current reconciliation_pending array
 * @param {string} sinType - The event type key for the sin
 * @param {number} currentLeg - Current trail leg
 * @returns {Array} Updated pending array
 */
export function addReconciliationPending(currentPending, sinType, currentLeg) {
  return [
    ...(currentPending || []),
    {
      sin_type: sinType,
      leg_of_sin: currentLeg,
      timestamp: new Date().toISOString(),
    },
  ];
}

/**
 * Removes expired reconciliation entries that can no longer fire.
 * Called during leg advancement cleanup.
 *
 * @param {Array} reconciliationPending - Current pending entries
 * @param {number} currentLeg - Current trail leg
 * @returns {Array} Cleaned pending entries
 */
export function cleanExpiredReconciliation(reconciliationPending, currentLeg) {
  if (!reconciliationPending || reconciliationPending.length === 0) {
    return [];
  }

  const MAX_LEGS_PAST_SIN = 3;

  return reconciliationPending.filter((entry) => {
    const legsSince = currentLeg - entry.leg_of_sin;
    return legsSince <= MAX_LEGS_PAST_SIN;
  });
}
