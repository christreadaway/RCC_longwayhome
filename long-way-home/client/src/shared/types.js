/**
 * @typedef {'k2' | '3_5' | '6_8'} GradeBand
 * @typedef {'SETUP' | 'SUPPLY_PURCHASE' | 'TRAVELING' | 'REST_POINT' | 'EVENT_RESOLUTION' | 'LANDMARK' | 'GAME_OVER'} GameState
 * @typedef {'banker' | 'farmer' | 'tradesman'} Profession
 * @typedef {'steady' | 'strenuous' | 'grueling'} Pace
 * @typedef {'filling' | 'meager' | 'bare_bones'} Rations
 * @typedef {'good' | 'fair' | 'poor' | 'critical' | 'dead'} HealthStatus
 * @typedef {'active' | 'paused' | 'completed' | 'failed'} SessionStatus
 * @typedef {'full' | 'post_choice' | 'discussion_only'} MoralLabelMode
 * @typedef {'free' | 'prompted'} HistorianAccessMode
 * @typedef {'low' | 'standard' | 'high'} ChaosLevel
 * @typedef {'positive' | 'negative'} LabelValence
 */

/**
 * Profession starting cash — inversely correlated with skill.
 * Difficulty tiers: Tradesman (Easy) > Farmer (Medium) > Banker (Hard)
 * @type {Object<Profession, number>}
 */
export const PROFESSION_CASH = {
  tradesman: 1200,
  farmer: 900,
  banker: 650
};

/**
 * Profession repair abilities.
 * - repairChance: probability of fixing without consuming a spare part
 * - timeCostDays: days lost per repair (0 = no delay, 1 = lose a full day)
 * - description: player-facing text
 */
export const PROFESSION_REPAIR = {
  banker: { repairChance: 0, timeCostDays: 1, description: 'No trail skills — repairs always cost a spare part and a full day.' },
  farmer: { repairChance: 0.3, timeCostDays: 0.5, description: 'Handy enough — sometimes fixes things without a spare part.' },
  tradesman: { repairChance: 0.7, timeCostDays: 0, description: 'Master craftsman — often repairs without spare parts, never loses time.' }
};

/**
 * Extra daily costs incurred by having a chaplain in the party.
 * Spiritual benefits come at material cost.
 */
export const CHAPLAIN_COSTS = {
  extraFoodPerDay: 1,             // Extra lb of food consumed daily (a non-working mouth)
  clothingWearIntervalDays: 14,   // Every N days, chaplain's presence wears through 1 clothing set
  oxenStrainChance: 0.03,         // Daily chance of oxen strain (extra weight in wagon)
  wagonFragilityBonus: 0.05       // Added to mechanical breakdown probability
};

/**
 * Purchasable reference books and their gameplay bonuses.
 * Only available for 6-8 (and optionally 3-5) grade bands.
 * Expensive enough to force a real budget trade-off at the store.
 */
export const STORE_BOOKS = {
  farmers_almanac: {
    name: "Farmer's Almanac (1848)",
    price: 75,
    description: "Weather patterns, planting calendars, folk remedies, and practical wisdom for life on the frontier.",
    effects: {
      illnessReduction: 0.03,       // Reduces daily illness probability (herbal remedies)
      weatherForecast: true,         // Shows tomorrow's weather forecast
      foodSpoilageReduction: 0.02,  // Better food preservation knowledge
      healingBonus: true             // Rest days heal one extra health tier
    }
  },
  trail_guide: {
    name: "Lansford Hastings' Emigrants' Guide",
    price: 90,
    description: "Maps, river ford depths, tribal territories, shortcuts, and practical advice from those who traveled before you.",
    effects: {
      riverCrossingBonus: 0.20,     // Reduced danger at river crossings
      shortcutChance: 0.10,         // Chance to find shortcut, saving miles
      nativeEncounterBonus: 0.15,   // Better outcomes with native encounters
      tradeBonus: 0.10,             // Better prices at forts in native territory
      dangerAvoidance: 0.05,        // Chance to avoid trail dangers entirely
      travelBonus: 0.03             // Slight daily miles bonus from better route knowledge
    }
  }
};

/**
 * Purchasable tool set and its gameplay bonuses.
 */
export const STORE_TOOLS = {
  tool_set: {
    name: "Complete Tool Set",
    price: 50,
    description: "Hammer, saw, auger, drawknife, files, and tongs. Greatly improves repair ability for all professions.",
    effects: {
      repairBonus: 0.25,          // Added to profession's base repair chance
      repairTimeReduction: 0.5,   // Halves repair time cost
      wagonMaintenanceBonus: true  // Mend wagon activity is more effective
    }
  }
};

/**
 * Bible — purchasable at the store OR can be received as a gift
 * during the journey (e.g., from a mission, chaplain, or kind stranger).
 * Provides grace and morale benefits when used through prayer activities.
 */
export const STORE_BIBLE = {
  name: "Holy Bible (Douay-Rheims)",
  price: 25,
  description: "The Word of God. Reading Scripture strengthens the spirit and brings comfort in hardship.",
  effects: {
    prayerGraceBonus: 2,          // Extra grace per prayer activity
    moraleFloor: 5,               // Morale can't drop below 5 if you have a Bible
    restMoraleBonus: 3,           // Extra morale when resting
    deathMoraleMitigation: 0.3,   // Reduces morale loss from party deaths by 30%
    sundayRestGraceBonus: 3       // Extra grace on Sunday rest (reading Scripture)
  }
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

export const SLEEP_SCHEDULE = {
  short:  { label: 'Short (5 hrs)',  healthRecovery: -0.02, moraleModifier: -2, travelBonus: 1.10 },
  normal: { label: 'Normal (7 hrs)', healthRecovery: 0,     moraleModifier: 0,  travelBonus: 1.0 },
  long:   { label: 'Long (9 hrs)',   healthRecovery: 0.05,  moraleModifier: 1,  travelBonus: 0.90 }
};

/** Water consumption: ~0.5 gal per person per day, ~2 gal per yoke of oxen */
export const WATER_CONSUMPTION = {
  perPersonPerDay: 0.5,
  perOxenYokePerDay: 2
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
