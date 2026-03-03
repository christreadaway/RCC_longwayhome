/**
 * @typedef {'k2' | '3_5' | '6_8'} GradeBand
 * @typedef {'SETUP' | 'SUPPLY_PURCHASE' | 'TRAVELING' | 'REST_POINT' | 'EVENT_RESOLUTION' | 'LANDMARK' | 'GAME_OVER'} GameState
 * @typedef {'banker' | 'farmer' | 'tradesman' | 'settler'} Profession
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
 *
 * Grade-band-specific cash amounts:
 * - 3_5: Lower cash because supplies are partially pre-loaded
 * - 6_8: Tight cash to force meaningful trade-offs
 *
 * @type {Object<Profession, number>}
 */
export const PROFESSION_CASH = {
  tradesman: 800,
  farmer: 600,
  banker: 400
};

/**
 * Grade-band-specific starting cash overrides.
 * 3-5 gets less because some supplies come pre-loaded.
 * 6-8 is the default (uses PROFESSION_CASH directly) — tight budgets, tough choices.
 */
export const PROFESSION_CASH_BY_GRADE = {
  '3_5': { tradesman: 500, farmer: 400, banker: 300 },
  '6_8': { tradesman: 800, farmer: 600, banker: 400 },
};

/**
 * K-2 default profession — a "somewhat handy" settler.
 * No profession choice for young kids; they get a capable head of household.
 * Moderate repair skill sits between tradesman and farmer.
 */
export const K2_DEFAULT_PROFESSION = {
  id: 'settler',
  name: 'Settler',
  repairWithoutParts: 0.45,
  repairTimePenalty: 0.25,
  description: 'A capable frontier settler — handy with tools, good with animals.',
};

/**
 * K-2 starting supplies — everything they need for the 5-stop journey.
 * Young kids don't make economic decisions; they start fully provisioned.
 */
export const K2_STARTING_SUPPLIES = {
  cash: 0,
  foodLbs: 400,
  waterGallons: 200,
  oxenYokes: 2,
  ammoBoxes: 0,
  wheels: 1,
  axles: 1,
  tongues: 0,
  medicineDoses: 3,
};

/**
 * 3-5 pre-loaded supplies — a "care package" of basics already in the wagon.
 * Kids still visit the store to buy more, but they start with a foundation.
 * These items are free — only purchases above these amounts cost cash.
 */
export const GRADE_35_PRELOADED_SUPPLIES = {
  oxenYokes: 1,
  foodLbs: 200,
  waterGallons: 100,
  clothingSets: 0,
  ammoBoxes: 0,
  wheels: 0,
  axles: 0,
  tongues: 0,
  medicineDoses: 0,
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

/**
 * Clergy skill definitions — random skill assigned to chaplain at game start.
 * Skills range from practical (Tradesman) to intellectual (Banker).
 */
export const CLERGY_SKILLS = {
  banker:     { name: 'Banker',     description: 'Experienced with money and trade. Haggling at forts costs 15% less.', tradeBonus: 0.15 },
  carpenter:  { name: 'Carpenter',  description: 'Skilled at repairs. Wagon breakdowns fixed faster with fewer parts.', repairBonus: 0.3 },
  blacksmith: { name: 'Blacksmith', description: 'Knows metalwork. Reduces wagon breakdown chance by 20%.', breakdownReduction: 0.2 },
  doctor:     { name: 'Doctor',     description: 'Has medical knowledge. Illness recovery faster for the party.', illnessReduction: 0.15 },
  scout:      { name: 'Scout',      description: 'Wilderness experience. Better at finding water and avoiding dangers.', dangerReduction: 0.1, waterFindBonus: 0.15 },
  teacher:    { name: 'Teacher',    description: 'Well-read and educated. Morale stays higher under hardship.', moraleFloor: 15 },
  tradesman:  { name: 'Tradesman',  description: 'Practical trail skills. Repairs cost less time and fewer parts.', repairTimeReduction: 0.25 },
};

/** Pick a random clergy skill key */
export function randomClergySkill() {
  const keys = Object.keys(CLERGY_SKILLS);
  return keys[Math.floor(Math.random() * keys.length)];
}

/** Generate a random clergy age (28–55) */
export function randomClergyAge() {
  return 28 + Math.floor(Math.random() * 28); // 28-55
}

/** Medicine supply constants */
export const MEDICINE_CONFIG = {
  price: 5,
  maxDoses: 20,
  healChance: 0.6,
  illnessCureChance: 0.4,
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
