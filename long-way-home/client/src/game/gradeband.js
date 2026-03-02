/**
 * Grade Band Feature Flags
 *
 * Single source of truth for grade-band-dependent behavior.
 * All components and game logic check flags from getFeatureFlags()
 * before rendering or executing. Never scatter grade band conditionals
 * across components — always go through this module.
 *
 * @module gradeband
 */

/**
 * @typedef {Object} FeatureFlags
 * @property {boolean} supplySystem - Whether the full supply purchase system is available
 * @property {boolean} illnessProgression - Whether illness progresses through tiers
 * @property {boolean} huntingMinigame - Whether the hunting minigame is available
 * @property {boolean} chaplain - Whether chaplain NPC encounters are enabled
 * @property {boolean} lastRites - Whether last rites mechanic is enabled
 * @property {boolean} aiHistorian - Whether AI Historian feature is enabled
 * @property {boolean} npcEncounters - Whether NPC trail encounters are enabled
 * @property {boolean} reconciliationEvents - Whether Make It Right events fire
 * @property {boolean} knowledgePanel - Whether the knowledge panel is shown
 * @property {boolean} guardianAngel - Whether the K-2 guardian angel is active
 * @property {boolean} goldenRulePrompts - Whether golden rule prompts appear (K-2)
 * @property {boolean} simplePrayerCards - Whether simplified prayer cards are used (K-2)
 * @property {boolean} examOfConscience - Whether AI exam of conscience is generated at end
 * @property {boolean} deceptiveCharity - Whether CWM events can have deceptive recipients
 * @property {boolean} strangerReturns - Whether reciprocity stranger-returns events fire
 * @property {boolean} sundayRest - Whether Sunday rest is a mechanic
 * @property {boolean} feastDays - Whether feast day events fire
 * @property {number} trailStops - Number of stops on the trail
 * @property {number} maxCwmEvents - Maximum CWM events per game
 * @property {number} maxEventsPerLeg - Maximum random events per trail leg
 * @property {number} riverCrossingOptions - Number of river crossing method choices
 * @property {number} illnessTiers - Number of illness severity tiers
 */

/** @type {Object<string, FeatureFlags>} */
const FEATURE_FLAG_DEFINITIONS = {
  k2: {
    supplySystem: false,
    illnessProgression: false,
    huntingMinigame: false,
    chaplain: false,
    lastRites: false,
    aiHistorian: false,
    npcEncounters: false,
    reconciliationEvents: false,
    knowledgePanel: false,
    guardianAngel: true,
    goldenRulePrompts: true,
    simplePrayerCards: true,
    examOfConscience: false,
    deceptiveCharity: false,
    strangerReturns: false,
    sundayRest: false,
    feastDays: false,
    trailStops: 5,
    maxCwmEvents: 2,
    maxEventsPerLeg: 1,
    riverCrossingOptions: 2,
    illnessTiers: 1,
  },

  '3_5': {
    supplySystem: true,
    illnessProgression: true,
    huntingMinigame: true,
    chaplain: false,
    lastRites: false,
    aiHistorian: true,
    npcEncounters: false,
    reconciliationEvents: true,
    knowledgePanel: true,
    guardianAngel: false,
    goldenRulePrompts: false,
    simplePrayerCards: false,
    examOfConscience: false,
    deceptiveCharity: false,
    strangerReturns: true,
    sundayRest: true,
    feastDays: false,
    trailStops: 15,
    maxCwmEvents: 2,
    maxEventsPerLeg: 1,
    riverCrossingOptions: 3,
    illnessTiers: 2,
  },

  '6_8': {
    supplySystem: true,
    illnessProgression: true,
    huntingMinigame: true,
    chaplain: true,
    lastRites: true,
    aiHistorian: true,
    npcEncounters: true,
    reconciliationEvents: true,
    knowledgePanel: true,
    guardianAngel: false,
    goldenRulePrompts: false,
    simplePrayerCards: false,
    examOfConscience: true,
    deceptiveCharity: true,
    strangerReturns: true,
    sundayRest: true,
    feastDays: true,
    trailStops: 15,
    maxCwmEvents: 3,
    maxEventsPerLeg: 3,
    riverCrossingOptions: 4,
    illnessTiers: 4,
  },
};

/**
 * Returns the feature flag configuration for a given grade band.
 * This is the single source of truth for all grade-band-dependent behavior.
 *
 * @param {import('../../../shared/types.js').GradeBand} gradeBand - 'k2', '3_5', or '6_8'
 * @returns {FeatureFlags} Frozen feature flags object
 * @throws {Error} If gradeBand is not recognized
 *
 * @example
 * const flags = getFeatureFlags('k2');
 * if (flags.guardianAngel) {
 *   // Show guardian angel UI
 * }
 */
export function getFeatureFlags(gradeBand) {
  const flags = FEATURE_FLAG_DEFINITIONS[gradeBand];
  if (!flags) {
    throw new Error(
      `Unknown grade band: "${gradeBand}". Expected one of: k2, 3_5, 6_8`
    );
  }
  // Return a frozen copy so callers cannot mutate the config
  return Object.freeze({ ...flags });
}

/**
 * Returns all valid grade band identifiers.
 *
 * @returns {string[]}
 */
export function getValidGradeBands() {
  return Object.keys(FEATURE_FLAG_DEFINITIONS);
}

/**
 * Checks whether a given grade band string is valid.
 *
 * @param {string} gradeBand
 * @returns {boolean}
 */
export function isValidGradeBand(gradeBand) {
  return gradeBand in FEATURE_FLAG_DEFINITIONS;
}
