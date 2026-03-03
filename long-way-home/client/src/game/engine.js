/**
 * Game Engine — State Machine
 *
 * The core state machine for The Long Way Home. All game state mutations
 * must flow through this module. The engine:
 *
 * - Manages the game state lifecycle (SETUP through GAME_OVER)
 * - Tracks game date starting April 1, 1848
 * - Consumes food daily based on rations and party size
 * - Handles pace affecting distance and illness
 * - Checks for mountain pass deadline and blizzard risk
 * - Fires random events per leg via events.js
 * - Handles party health transitions
 * - Tracks all events in event_log
 * - Serializes to localStorage after every state transition
 *
 * @module engine
 */

import {
  PROFESSION_CASH,
  PROFESSION_CASH_BY_GRADE,
  K2_STARTING_SUPPLIES,
  HEALTH_ORDER,
  PACE_MULTIPLIER,
  RATIONS_CONSUMPTION,
  GAME_CONSTANTS,
  GRACE_DELTAS,
  getAgeModifiers,
} from '@shared/types';

import { getFeatureFlags } from './gradeband.js';
import { createGraceState, updateGrace, getGraceRange, getGraceEffects } from './grace.js';
import {
  rollProbability,
  calculateIllnessProbability,
  calculateDeathCheck,
  calculateBlizzardProbability,
} from './probability.js';
import { rollForEvents, resolveEvent, checkSundayRest, checkFeastDay } from './events.js';
import { checkReciprocity, processReciprocityEvent, cleanExpiredReciprocity } from './reciprocity.js';
import {
  checkReconciliation,
  processReconciliationChoice,
  cleanExpiredReconciliation,
} from './reconciliation.js';
import { getLabelForEvent, shouldShowLabel, formatLabelForDisplay } from './morallabels.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Valid game state machine states and their allowed transitions.
 */
const STATE_TRANSITIONS = {
  SETUP: ['SUPPLY_PURCHASE', 'TRAVELING'],
  SUPPLY_PURCHASE: ['TRAVELING'],
  TRAVELING: ['REST_POINT', 'EVENT_RESOLUTION', 'LANDMARK', 'GAME_OVER'],
  REST_POINT: ['TRAVELING', 'GAME_OVER'],
  EVENT_RESOLUTION: ['TRAVELING', 'REST_POINT', 'LANDMARK', 'GAME_OVER'],
  LANDMARK: ['TRAVELING', 'GAME_OVER'],
  GAME_OVER: [],
};

/** localStorage key prefix for game state */
const STORAGE_KEY_PREFIX = 'lwh_state_';

// ---------------------------------------------------------------------------
// Narrative templates
// ---------------------------------------------------------------------------

/**
 * Arrival narratives by grace range. Used for 3_5 and k2 bands.
 * 6_8 with AI Exam of Conscience uses AI-generated narratives instead.
 */
const ARRIVAL_NARRATIVES = {
  HIGH: 'Your family arrives in Oregon with spirits high and faith renewed. The hardships of the trail forged a deeper trust in God\'s providence. Fellow travelers speak of your generosity and kindness — how you fed the hungry, cared for the sick, and never turned away from those in need. The Willamette Valley stretches before you, green and full of promise. You kneel together and give thanks for safe passage.',

  MODERATE: 'After months on the trail, your family reaches Oregon weary but grateful. There were times of kindness and times of missed opportunities. You helped when you could, though the trail sometimes tested your resolve. As you look out over the valley that will become your new home, you feel a mix of relief and quiet reflection on the journey behind you.',

  LOW: 'Your family stumbles into Oregon, battered by the trail. Looking back, you realize many chances to help others were passed by, and the weight of those choices sits heavy. The land before you is beautiful, but something feels incomplete. Perhaps in this new home, there will be chances to live differently — to be the neighbor you were called to be.',

  DEPLETED: 'You arrive in Oregon, but the journey has taken a deep toll — not just on your body, but on your soul. The trail was marked by selfishness, and the consequences followed. Fellow travelers remember you not for kindness but for hardness of heart. Yet even now, God\'s mercy is not exhausted. A new beginning awaits, if you have the courage to choose differently.',
};

/**
 * "Life in Oregon" epilogue narratives by grace range.
 */
const LIFE_IN_OREGON_NARRATIVES = {
  HIGH: 'In the years that followed, your family became pillars of the new community. You helped build a church, shared your harvest with neighbors, and your children grew up knowing the value of mercy and generosity. The lessons of the trail — that true wealth is found in giving — shaped a legacy of faith that endured for generations.',

  MODERATE: 'Your family settled into a quiet life in Oregon. You farmed the land, raised your children, and found your place in the growing community. Some days you remembered the trail and the choices you made — both the good and the ones you wished you could take back. Life was honest, if imperfect, and you tried to do a little better each day.',

  LOW: 'Life in Oregon was harder than you expected. Without the bonds of trust and generosity, building a community felt lonely. Over time, some of the lessons learned the hard way on the trail began to sink in. Slowly, you started reaching out to neighbors, sharing what you had, and finding that the mercy you once refused to give was still available to you.',

  DEPLETED: 'The first years in Oregon were marked by isolation. The reputation from the trail followed you, and trust was hard to earn. But grace works in mysterious ways. A neighbor\'s unexpected kindness broke something open in your heart. Slowly, painfully, you began to change — learning at last what the trail had tried to teach you all along: that we are made for each other, and mercy is never wasted.',
};

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Creates the initial game state from a configuration object.
 * This is called when a new game session starts.
 *
 * @param {Object} config
 * @param {string} config.studentId - Unique student identifier
 * @param {string} config.studentName - Student's display name
 * @param {string} config.gradeBand - Grade band ('k2', '3_5', '6_8')
 * @param {import('../../../shared/types.js').Profession} [config.profession='farmer'] - Chosen profession
 * @param {Array<{ name: string }>} [config.partyMembers] - Additional party members (up to 4)
 * @param {string} [config.sessionCode] - Teacher session code
 * @param {import('../../../shared/types.js').MoralLabelMode} [config.moralLabelMode='full'] - Label display mode
 * @returns {Object} Complete initial game state
 */
export function createInitialState(config) {
  const {
    studentId,
    studentName,
    gradeBand = '6_8',
    profession = 'farmer',
    partyMembers = [],
    sessionCode = null,
    moralLabelMode = 'full',
  } = config;

  const featureFlags = getFeatureFlags(gradeBand);
  const gradeCash = PROFESSION_CASH_BY_GRADE[gradeBand];
  const startingCash = gradeCash?.[profession] ?? PROFESSION_CASH[profession] ?? PROFESSION_CASH.farmer;

  // Build party (leader + up to 4 members)
  const party = [
    createPartyMember(studentName, true),
    ...partyMembers.slice(0, GAME_CONSTANTS.MAX_PARTY_SIZE - 1).map(
      (m) => createPartyMember(m.name, false)
    ),
  ];

  // Fill remaining slots if fewer than MAX_PARTY_SIZE members provided
  const defaultNames = ['Sarah', 'Thomas', 'Mary', 'Joseph'];
  while (party.length < GAME_CONSTANTS.MAX_PARTY_SIZE) {
    const defaultName = defaultNames[party.length - 1] || `Traveler ${party.length}`;
    party.push(createPartyMember(defaultName, false));
  }

  return {
    // Identity
    studentId,
    studentName,
    sessionCode,
    gradeBand,
    profession,

    // State machine
    currentState: 'SETUP',
    previousState: null,
    stateTransitions: [],

    // Trail progress
    current_leg: 0,
    total_legs: featureFlags.trailStops,
    miles_traveled: 0,
    total_trail_miles: featureFlags.trailStops === 5 ? 500 : 2000,

    // Time
    game_date: GAME_CONSTANTS.START_DATE,
    game_day: 1,
    start_date: GAME_CONSTANTS.START_DATE,

    // Party
    party,

    // Settings
    pace: 'steady',
    rations: 'filling',
    moralLabelMode,

    // Supplies — K-2 starts fully provisioned, 3-5/6-8 buy at store
    supplies: featureFlags.supplySystem
      ? { food: 0, cash: startingCash, oxen: 0, clothing: 0, ammunition: 0, spareParts: 0, medicine: 0 }
      : {
          food: K2_STARTING_SUPPLIES.foodLbs,
          cash: 0,
          oxen: K2_STARTING_SUPPLIES.oxenYokes * 2,
          clothing: party.length,
          ammunition: 0,
          spareParts: K2_STARTING_SUPPLIES.wheels + K2_STARTING_SUPPLIES.axles,
          medicine: K2_STARTING_SUPPLIES.medicineDoses,
        },

    // Grace system
    grace: createGraceState(),
    morale: GAME_CONSTANTS.INITIAL_MORALE,

    // Event tracking
    event_log: [],
    cwm_events: [],
    reciprocity_pending: [],
    reciprocity_log: [],
    reconciliation_pending: [],
    reconciliation_log: [],

    // Terrain
    terrain: 'plains',
    currentLandmark: null,

    // Labels
    pendingLabels: [],
    dismissedLabels: [],

    // Scoring
    score: 0,

    // Narrative (set at game end)
    arrival_narrative: null,
    life_in_oregon_narrative: null,

    // Metadata
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

/**
 * Transitions the game to a new state, enforcing valid transitions
 * and logging the change.
 *
 * @param {Object} gameState - Current game state
 * @param {string} newState - Target state
 * @returns {Object} Updated game state
 * @throws {Error} If the transition is not valid
 */
export function transitionState(gameState, newState) {
  const currentState = gameState.currentState;
  const validTargets = STATE_TRANSITIONS[currentState];

  if (!validTargets) {
    throw new Error(`Unknown current state: "${currentState}"`);
  }

  if (!validTargets.includes(newState)) {
    throw new Error(
      `Invalid state transition: ${currentState} -> ${newState}. ` +
      `Valid transitions: [${validTargets.join(', ')}]`
    );
  }

  const transitionEntry = {
    from: currentState,
    to: newState,
    timestamp: new Date().toISOString(),
    game_day: gameState.game_day,
    leg: gameState.current_leg,
  };

  const updated = {
    ...gameState,
    previousState: currentState,
    currentState: newState,
    stateTransitions: [...(gameState.stateTransitions || []), transitionEntry],
    updated_at: new Date().toISOString(),
  };

  // Auto-save after every transition
  saveState(updated);

  return updated;
}

// ---------------------------------------------------------------------------
// Day advancement
// ---------------------------------------------------------------------------

/**
 * Advances the game by one day. This is the core game loop tick.
 * Handles food consumption, health checks, illness rolls, and
 * date advancement.
 *
 * @param {Object} gameState - Current game state
 * @param {Object} featureFlags - From getFeatureFlags()
 * @returns {{
 *   newState: Object,
 *   events: Array,
 *   labels: Array,
 *   dayReport: Object
 * }}
 */
export function advanceDay(gameState, featureFlags) {
  let state = { ...gameState };
  const events = [];
  const labels = [];
  const dayReport = {
    day: state.game_day,
    date: state.game_date,
    foodConsumed: 0,
    distanceTraveled: 0,
    healthChanges: [],
    deaths: [],
  };

  // 1. Advance date
  state = advanceDate(state);

  // 2. Consume food
  const foodResult = consumeFood(state);
  state = foodResult.state;
  dayReport.foodConsumed = foodResult.consumed;

  // 3. Check Sunday rest
  if (featureFlags.sundayRest && checkSundayRest(state.game_date)) {
    state = applySundayRest(state);
    dayReport.isSunday = true;
    events.push({
      type: 'sunday_rest',
      description: 'The party observes the Sabbath with rest and prayer.',
    });
  }

  // 4. Check feast day
  if (featureFlags.feastDays) {
    const feast = checkFeastDay(state.game_date);
    if (feast) {
      dayReport.feastDay = feast;
      events.push({
        type: feast.type,
        description: `The party celebrates ${feast.name}.`,
      });
    }
  }

  // 5. Health checks — illness roll for each living member
  if (featureFlags.illnessProgression) {
    const graceEffects = getGraceEffects(state.grace.value);
    const illnessResult = processIllnessChecks(state, graceEffects);
    state = illnessResult.state;
    dayReport.healthChanges = illnessResult.changes;
  }

  // 6. Death checks for critical members
  const deathResult = processDeathChecks(state);
  state = deathResult.state;
  dayReport.deaths = deathResult.deaths;

  // 7. Check for total party death → GAME_OVER
  const livingMembers = state.party.filter((m) => m.health !== 'dead');
  if (livingMembers.length === 0) {
    state = transitionState(state, 'GAME_OVER');
    state.arrival_narrative = 'No one survived the journey. The trail claimed your entire party.';
    state.life_in_oregon_narrative = null;
  }

  // 8. Check morale floor from grace effects
  const graceEffects = getGraceEffects(state.grace.value);
  if (state.morale < graceEffects.moralFloor) {
    state = { ...state, morale: graceEffects.moralFloor };
  }

  // 9. Generate labels for any events that occurred
  for (const event of events) {
    if (event.type === 'sunday_rest') {
      const label = getLabelForEvent('sunday_rest', 'rest', state.gradeBand);
      if (label && shouldShowLabel(state.moralLabelMode, 'immediate')) {
        labels.push(formatLabelForDisplay(label, state.gradeBand));
      }
    }
  }

  state.updated_at = new Date().toISOString();

  return { newState: state, events, labels, dayReport };
}

// ---------------------------------------------------------------------------
// Travel processing
// ---------------------------------------------------------------------------

/**
 * Processes a travel leg — the player moves along the trail.
 * This is called when the player is in the TRAVELING state.
 *
 * Handles:
 * - Distance calculation based on pace
 * - Random events
 * - Reciprocity checks
 * - Reconciliation checks
 * - Landmark arrival
 * - Mountain pass deadline check
 *
 * @param {Object} gameState - Current game state
 * @param {Object} featureFlags - From getFeatureFlags()
 * @returns {{
 *   newState: Object,
 *   events: Array,
 *   labels: Array,
 *   distanceTraveled: number,
 *   reachedLandmark: boolean,
 *   blizzardWarning: boolean
 * }}
 */
export function processTravel(gameState, featureFlags) {
  let state = { ...gameState };
  const allEvents = [];
  const allLabels = [];
  let distanceTraveled = 0;
  let reachedLandmark = false;
  let blizzardWarning = false;

  // Calculate distance for this leg
  const baseMiles = GAME_CONSTANTS.BASE_DAILY_MILES;
  const paceMult = PACE_MULTIPLIER[state.pace] || 1.0;

  // Party moves at the pace of its slowest living member
  const livingMembers = (state.party || []).filter(m => m.health !== 'dead');
  const slowestAgePace = livingMembers.length > 0
    ? Math.min(...livingMembers.map(m => getAgeModifiers(m.age).paceMultiplier))
    : 1.0;

  // Each leg represents multiple days of travel
  const daysPerLeg = 5;

  for (let day = 0; day < daysPerLeg; day++) {
    // Advance one day
    const dayResult = advanceDay(state, featureFlags);
    state = dayResult.newState;
    allEvents.push(...dayResult.events);
    allLabels.push(...dayResult.labels);

    // If game over during day advancement, stop
    if (state.currentState === 'GAME_OVER') {
      return {
        newState: state,
        events: allEvents,
        labels: allLabels,
        distanceTraveled,
        reachedLandmark: false,
        blizzardWarning: false,
      };
    }

    // Calculate daily distance (reduced on Sundays if resting)
    const isSunday = checkSundayRest(state.game_date);
    const dailyMiles = isSunday && featureFlags.sundayRest ? 0 : Math.floor(baseMiles * paceMult * slowestAgePace);
    distanceTraveled += dailyMiles;

    // Grueling pace has illness penalty
    if (state.pace === 'grueling') {
      state.grace = updateGrace(state.grace, GRACE_DELTAS.GRUELING_SICK, 'GRUELING_PACE');
    }
  }

  // Update total miles
  state.miles_traveled = (state.miles_traveled || 0) + distanceTraveled;

  // Roll for random events
  const graceEffects = getGraceEffects(state.grace.value);
  const firedEvents = rollForEvents(state, featureFlags, graceEffects);
  allEvents.push(...firedEvents);

  // Check reciprocity (Stranger Returns)
  if (featureFlags.strangerReturns) {
    const recipResult = checkReciprocity(state);
    if (recipResult.shouldFire) {
      const processed = processReciprocityEvent(state, {
        ...recipResult.event,
        pendingIndex: recipResult.pendingIndex,
      });
      state = {
        ...state,
        supplies: processed.updatedSupplies,
        party: processed.updatedParty,
        reciprocity_pending: processed.updatedReciprocityPending,
        reciprocity_log: processed.updatedReciprocityLog,
        morale: clamp(state.morale + processed.moraleChange, 0, 100),
      };
      allEvents.push({
        type: 'stranger_returns',
        description: processed.description,
      });
    }

    // Clean expired reciprocity entries
    state.reciprocity_pending = cleanExpiredReciprocity(
      state.reciprocity_pending,
      state.current_leg
    );
  }

  // Check reconciliation (Make It Right)
  if (featureFlags.reconciliationEvents) {
    const reconResult = checkReconciliation(state);
    if (reconResult.shouldFire) {
      allEvents.push({
        ...reconResult.event,
        pendingIndex: reconResult.pendingIndex,
        requires_resolution: true,
      });
    }

    // Clean expired reconciliation entries
    state.reconciliation_pending = cleanExpiredReconciliation(
      state.reconciliation_pending,
      state.current_leg
    );
  }

  // Advance trail leg
  state.current_leg = (state.current_leg || 0) + 1;

  // Check if reached next landmark
  if (state.current_leg >= state.total_legs) {
    // Reached the end — Oregon!
    reachedLandmark = true;
    state = transitionState(state, 'GAME_OVER');
    const graceRange = getGraceRange(state.grace.value);
    state.arrival_narrative = getArrivalNarrative(state);
    state.life_in_oregon_narrative = getLifeInOregonNarrative(graceRange);
    state.score = calculateScore(state).graceAdjustedScore;
  } else {
    // Check for landmark stop
    reachedLandmark = isLandmarkLeg(state.current_leg, state.total_legs);
    if (reachedLandmark) {
      state = transitionState(state, 'LANDMARK');
    }
  }

  // Blizzard warning check
  const blizzardProb = calculateBlizzardProbability(
    state.game_date,
    GAME_CONSTANTS.MOUNTAIN_PASS_DEADLINE
  );
  if (blizzardProb > 0) {
    blizzardWarning = true;
    if (rollProbability(blizzardProb)) {
      allEvents.push({
        type: 'blizzard',
        description: 'A fierce blizzard strikes! Your party is trapped in the snow.',
        is_mandatory: true,
        outcomes: {
          health: { target: 'all', change: 'decrease_two' },
          morale: -20,
          supplies: { food: -40 },
        },
      });
    }
  }

  state.updated_at = new Date().toISOString();

  return {
    newState: state,
    events: allEvents,
    labels: allLabels,
    distanceTraveled,
    reachedLandmark,
    blizzardWarning,
  };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Calculates the player's score at the end of the game.
 *
 * Factors:
 * - Surviving party members
 * - Remaining supplies
 * - Health of survivors
 * - Grace multiplier
 *
 * @param {Object} gameState
 * @returns {{ rawScore: number, graceAdjustedScore: number }}
 */
export function calculateScore(gameState) {
  let rawScore = 0;

  // Surviving party members — 200 points each
  const livingMembers = (gameState.party || []).filter((m) => m.health !== 'dead');
  rawScore += livingMembers.length * 200;

  // Health bonus — 50 points per healthy member
  for (const member of livingMembers) {
    const healthIndex = HEALTH_ORDER.indexOf(member.health);
    // good=0, fair=1, poor=2, critical=3
    // Award points inversely: good=50, fair=35, poor=15, critical=0
    const healthPoints = Math.max(0, (3 - healthIndex) * 15 + 5);
    rawScore += healthPoints;
  }

  // Remaining supplies
  const supplies = gameState.supplies || {};
  rawScore += Math.floor((supplies.food || 0) / 10); // 1 point per 10 lbs food
  rawScore += (supplies.cash || 0); // 1 point per dollar
  rawScore += (supplies.oxen || 0) * 20; // 20 points per ox
  rawScore += (supplies.spareParts || 0) * 10;

  // CWM events bonus — 50 points per help given
  const cwmHelped = (gameState.cwm_events || []).filter((e) => e.choice === 'helped');
  rawScore += cwmHelped.length * 50;

  // Reconciliation bonus — 30 points per reconciliation taken
  const reconciled = (gameState.reconciliation_log || []).filter((e) => e.taken);
  rawScore += reconciled.length * 30;

  // Grace multiplier
  const graceEffects = getGraceEffects(gameState.grace?.value || 50);
  const graceAdjustedScore = Math.round(rawScore * graceEffects.scoreMultiplier);

  return { rawScore, graceAdjustedScore };
}

// ---------------------------------------------------------------------------
// Narratives
// ---------------------------------------------------------------------------

/**
 * Returns the arrival narrative based on the player's grace range.
 * For 6_8 with AI Exam of Conscience, this should be replaced with
 * an AI-generated narrative from the server.
 *
 * @param {Object} gameState
 * @returns {string}
 */
export function getArrivalNarrative(gameState) {
  const graceRange = getGraceRange(gameState.grace?.value || 50);

  // Check for total party death
  const livingMembers = (gameState.party || []).filter((m) => m.health !== 'dead');
  if (livingMembers.length === 0) {
    return 'No one survived the journey. The trail was unforgiving, and your party could not endure its trials.';
  }

  return ARRIVAL_NARRATIVES[graceRange] || ARRIVAL_NARRATIVES.MODERATE;
}

/**
 * Returns the "Life in Oregon" epilogue narrative based on grace range.
 * For 6_8 with AI Exam of Conscience enabled, this is AI-generated.
 * For 3_5 and K_2, this is selected from templates.
 *
 * @param {'HIGH' | 'MODERATE' | 'LOW' | 'DEPLETED'} graceRange
 * @returns {string}
 */
export function getLifeInOregonNarrative(graceRange) {
  return LIFE_IN_OREGON_NARRATIVES[graceRange] || LIFE_IN_OREGON_NARRATIVES.MODERATE;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Saves the game state to localStorage.
 * Called automatically after every state transition.
 *
 * @param {Object} gameState
 * @returns {boolean} true if save succeeded
 */
export function saveState(gameState) {
  try {
    if (typeof localStorage === 'undefined') return false;

    const key = STORAGE_KEY_PREFIX + (gameState.studentId || 'anonymous');
    const serialized = JSON.stringify({
      ...gameState,
      saved_at: new Date().toISOString(),
    });
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    // localStorage may be full or unavailable
    return false;
  }
}

/**
 * Loads a game state from localStorage.
 *
 * @param {string} studentId
 * @returns {Object|null} Loaded game state, or null if not found
 */
export function loadState(studentId) {
  try {
    if (typeof localStorage === 'undefined') return null;

    const key = STORAGE_KEY_PREFIX + studentId;
    const serialized = localStorage.getItem(key);
    if (!serialized) return null;

    return JSON.parse(serialized);
  } catch (error) {
    return null;
  }
}

/**
 * Clears saved game state from localStorage.
 *
 * @param {string} studentId
 */
export function clearState(studentId) {
  try {
    if (typeof localStorage === 'undefined') return;

    const key = STORAGE_KEY_PREFIX + studentId;
    localStorage.removeItem(key);
  } catch (error) {
    // Ignore errors
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Creates a party member object with default health.
 *
 * @param {string} name
 * @param {boolean} isLeader
 * @returns {{ name: string, health: string, isLeader: boolean, illnesses: Array, daysAtCritical: number }}
 */
function createPartyMember(name, isLeader) {
  return {
    name,
    health: 'good',
    isLeader,
    illnesses: [],
    daysAtCritical: 0,
  };
}

/**
 * Advances the game date by one day.
 *
 * @param {Object} state
 * @returns {Object} Updated state with advanced date
 */
function advanceDate(state) {
  const currentDate = new Date(state.game_date);
  currentDate.setDate(currentDate.getDate() + 1);

  return {
    ...state,
    game_date: currentDate.toISOString().split('T')[0],
    game_day: (state.game_day || 1) + 1,
  };
}

/**
 * Consumes food for the day based on rations and living party size.
 *
 * @param {Object} state
 * @returns {{ state: Object, consumed: number }}
 */
function consumeFood(state) {
  const livingMembers = state.party.filter((m) => m.health !== 'dead');
  const rationsPerPerson = RATIONS_CONSUMPTION[state.rations] || 2;
  // Children eat less, elders eat less — age-based food multiplier
  let totalConsumed = 0;
  for (const m of livingMembers) {
    const ageMods = getAgeModifiers(m.age);
    totalConsumed += rationsPerPerson * ageMods.foodMultiplier;
  }

  const currentFood = state.supplies?.food || 0;
  const newFood = Math.max(0, currentFood - totalConsumed);

  return {
    state: {
      ...state,
      supplies: {
        ...state.supplies,
        food: newFood,
      },
    },
    consumed: totalConsumed,
  };
}

/**
 * Applies Sunday rest benefits: grace bonus and health recovery.
 *
 * @param {Object} state
 * @returns {Object} Updated state
 */
function applySundayRest(state) {
  // Grace bonus
  const updatedGrace = updateGrace(state.grace, GRACE_DELTAS.SUNDAY_REST, 'SUNDAY_REST');

  // Health recovery: each living member improves by one tier
  const updatedParty = state.party.map((member) => {
    if (member.health === 'dead' || member.health === 'good') return member;

    const currentIndex = HEALTH_ORDER.indexOf(member.health);
    const newIndex = Math.max(0, currentIndex - GAME_CONSTANTS.SUNDAY_REST_HEALTH_RECOVERY);

    return {
      ...member,
      health: HEALTH_ORDER[newIndex],
      daysAtCritical: HEALTH_ORDER[newIndex] !== 'critical' ? 0 : member.daysAtCritical,
    };
  });

  return {
    ...state,
    grace: updatedGrace,
    party: updatedParty,
    morale: clamp(state.morale + 5, 0, 100),
  };
}

/**
 * Processes illness checks for all living party members.
 *
 * @param {Object} state
 * @param {Object} graceEffects
 * @returns {{ state: Object, changes: Array }}
 */
function processIllnessChecks(state, graceEffects) {
  const changes = [];
  const updatedParty = state.party.map((member) => {
    if (member.health === 'dead') return member;

    const illnessChance = calculateIllnessProbability(
      state.pace,
      state.rations,
      state.terrain || 'plains',
      graceEffects,
      member.age
    );

    if (rollProbability(illnessChance)) {
      const currentIndex = HEALTH_ORDER.indexOf(member.health);
      const newIndex = Math.min(currentIndex + 1, HEALTH_ORDER.length - 2); // Cap at 'critical', not 'dead'

      changes.push({
        name: member.name,
        from: member.health,
        to: HEALTH_ORDER[newIndex],
      });

      return {
        ...member,
        health: HEALTH_ORDER[newIndex],
        daysAtCritical:
          HEALTH_ORDER[newIndex] === 'critical'
            ? (member.daysAtCritical || 0) + 1
            : 0,
      };
    }

    // Track days at critical even when no new illness rolls
    if (member.health === 'critical') {
      return {
        ...member,
        daysAtCritical: (member.daysAtCritical || 0) + 1,
      };
    }

    return member;
  });

  return { state: { ...state, party: updatedParty }, changes };
}

/**
 * Processes death checks for all critical party members.
 *
 * @param {Object} state
 * @returns {{ state: Object, deaths: Array }}
 */
function processDeathChecks(state) {
  const deaths = [];
  const updatedParty = state.party.map((member) => {
    if (member.health !== 'critical') return member;

    if (calculateDeathCheck(member, state.rations)) {
      deaths.push({ name: member.name, day: state.game_day });
      return {
        ...member,
        health: 'dead',
        daysAtCritical: 0,
      };
    }

    return member;
  });

  // Morale hit from deaths
  let morale = state.morale;
  if (deaths.length > 0) {
    morale = clamp(morale - deaths.length * 15, 0, 100);
  }

  return {
    state: { ...state, party: updatedParty, morale },
    deaths,
  };
}

/**
 * Determines if a given trail leg is a landmark stop.
 * Landmarks are evenly distributed along the trail.
 *
 * @param {number} leg
 * @param {number} totalLegs
 * @returns {boolean}
 */
function isLandmarkLeg(leg, totalLegs) {
  if (totalLegs <= 5) {
    // K-2: every leg is a stop
    return true;
  }
  // 3_5 and 6_8: landmarks at roughly every 3 legs
  return leg % 3 === 0 && leg > 0;
}

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
