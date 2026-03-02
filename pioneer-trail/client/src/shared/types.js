/**
 * @typedef {'k2' | '3_5' | '6_8'} GradeBand
 * @typedef {'SETUP' | 'SUPPLY_PURCHASE' | 'TRAVELING' | 'REST_POINT' | 'EVENT_RESOLUTION' | 'LANDMARK' | 'GAME_OVER'} GameState
 * @typedef {'banker' | 'carpenter' | 'farmer'} Profession
 * @typedef {'steady' | 'strenuous' | 'grueling'} Pace
 * @typedef {'filling' | 'meager' | 'bare_bones'} Rations
 * @typedef {'good' | 'fair' | 'poor' | 'critical' | 'dead'} HealthStatus
 * @typedef {'active' | 'paused' | 'completed' | 'failed'} SessionStatus
 * @typedef {'full' | 'post_choice' | 'discussion_only'} MoralLabelMode
 * @typedef {'free' | 'prompted'} HistorianAccessMode
 * @typedef {'low' | 'standard' | 'high'} ChaosLevel
 * @typedef {'positive' | 'negative'} LabelValence
 */

/** @type {Object<Profession, number>} */
export const PROFESSION_CASH = {
  banker: 1600,
  carpenter: 800,
  farmer: 400
};

export const HEALTH_ORDER = ['good', 'fair', 'poor', 'critical', 'dead'];

export const PACE_MULTIPLIER = {
  steady: 1.0,
  strenuous: 1.4,
  grueling: 1.8
};

export const RATIONS_CONSUMPTION = {
  filling: 3,
  meager: 2,
  bare_bones: 1
};

export const GRACE_RANGES = {
  HIGH: { min: 75, max: 100, label: 'High' },
  MODERATE: { min: 40, max: 74, label: 'Moderate' },
  LOW: { min: 15, max: 39, label: 'Low' },
  DEPLETED: { min: 0, max: 14, label: 'Depleted' }
};

export const GRACE_DELTAS = {
  CWM_HELP: 15,
  CWM_HELP_HARDSHIP: 20,
  CWM_DECLINE: -8,
  SUNDAY_REST: 5,
  PRAYER: 3,
  CHAPLAIN: 5,
  LAST_RITES: 8,
  FAIR_TRADE: 5,
  EXPLOIT: -10,
  GRUELING_SICK: -3,
  OVERHUNT: -5,
  RECONCILIATION_TAKEN: 5,
  FORGIVE: 10
};

export const GAME_CONSTANTS = {
  MAX_PARTY_SIZE: 5,
  MAX_OXEN: 9,
  START_DATE: '1848-04-01',
  END_DATE: '1848-12-31',
  MOUNTAIN_PASS_DEADLINE: '1848-10-15',
  BLIZZARD_PROBABILITY_LATE: 0.8,
  CWM_MAX_PER_GAME: 3,
  CWM_DECEPTIVE_PROBABILITY: 0.25,
  RECIPROCITY_FIRE_PROBABILITY: 0.5,
  RECONCILIATION_PROBABILITY: 0.4,
  SUNDAY_REST_HEALTH_RECOVERY: 1,
  MORALE_CHAPLAIN_FLOOR: 10,
  LAST_RITES_MORALE_REDUCTION: 0.6,
  PRAYER_ILLNESS_REDUCTION: 0.05,
  POLLING_INTERVAL_MS: 10000,
  AUTO_PAUSE_MINUTES: 30,
  LABEL_FADE_SECONDS: 8,
  NPC_MAX_EXCHANGES: 3,
  HISTORIAN_POST_EVENT_WINDOW_MS: 30000,
  BASE_DAILY_MILES: 15,
  FOOD_WARNING_LBS: 50,
  INITIAL_GRACE: 50,
  INITIAL_MORALE: 70
};
