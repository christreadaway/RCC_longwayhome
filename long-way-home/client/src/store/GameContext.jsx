import { createContext, useContext, useReducer, useCallback } from 'react';
import { logger } from '../utils/logger';
import { GAME_CONSTANTS, GRACE_DELTAS, CHAPLAIN_COSTS, STORE_BIBLE } from '@shared/types';

const GameContext = createContext(null);
const GameDispatchContext = createContext(null);

const initialState = {
  // Session
  sessionCode: null,
  studentId: null,
  gradeBand: '6_8',
  sessionSettings: {},

  // Game state machine
  phase: 'TITLE',  // TITLE | SETUP | SUPPLY_PURCHASE | TRAVELING | REST_POINT | EVENT_RESOLUTION | LANDMARK | GAME_OVER

  // Player
  studentName: '',
  profession: null,
  partyMembers: [],
  chaplainInParty: false,

  // Supplies
  cash: 0,
  foodLbs: 0,
  clothingSets: 0,
  ammoBoxes: 0,
  spareParts: { wheels: 0, axles: 0, tongues: 0 },
  oxenYokes: 0,
  waterGallons: 0,

  // Purchasable items (books & tools)
  hasFarmersAlmanac: false,
  hasTrailGuide: false,
  hasToolSet: false,
  hasBible: false,

  // Trail
  currentLandmarkIndex: 0,
  distanceTraveled: 0,
  distanceToNextLandmark: 0,
  pace: 'steady',
  rations: 'filling',
  gameDate: GAME_CONSTANTS.START_DATE,
  trailDay: 1,

  // Health & Status
  morale: GAME_CONSTANTS.INITIAL_MORALE,
  grace: GAME_CONSTANTS.INITIAL_GRACE,
  graceHistory: [],

  // Events & Catholic
  eventLog: [],
  cwmEvents: [],
  cwmFired: 0,
  reconciliationPending: null,
  reciprocityPending: [],
  sundayRestsTaken: 0,
  sundayRestsSkipped: 0,
  lastRitesFired: false,
  feastDaysEncountered: [],
  moralLabelsDismissed: [],
  knowledgeCardsRead: [],
  historianTranscript: [],
  npcTranscripts: [],

  // Prayer tracking
  prayersOffered: 0,
  prayerCooldownDay: 0,

  // Bison population (starts at 100%, depleted by overhunting)
  bisonPopulation: 100,

  // Weather & Ground
  currentWeather: null,
  weatherLog: [],
  recentWeather: [],  // Last 5 days for ground condition calculation

  // Camp Activities & Trip Management
  activityCooldowns: {},
  activityLog: [],
  daysStationary: 0,       // Consecutive days without travel (lingering danger)
  totalDaysStationary: 0,  // Total across journey
  daysRested: 0,
  oxenChecked: false,      // Resets each day; reduces breakdown chance
  wagonMaintained: false,  // Resets each day; reduces breakdown chance
  illnessPreventionBonus: 0,  // From wash_up activity
  spoilagePreventionBonus: 0, // From check_provisions activity

  // Trail Dangers & Difficulty
  dangerLog: [],
  tripDifficultyPoints: 0,

  // Scoring
  score: 0,
  graceAdjustedScore: 0,
  lifeInOregonNarrative: '',

  // Status
  status: 'active',
  isPaused: false,

  // UI state
  currentEvent: null,
  currentLabel: null,
  showHistorian: false,
  showKnowledgePanel: false,
  availableKnowledgeCards: [],
  pendingReconciliation: null,
  pendingReciprocity: null
};

function gameReducer(state, action) {
  logger.debug('DISPATCH', { type: action.type });

  switch (action.type) {
    case 'SET_SESSION': {
      return {
        ...state,
        sessionCode: action.sessionCode,
        studentId: action.studentId,
        gradeBand: action.gradeBand,
        sessionSettings: action.settings || {}
      };
    }

    case 'SET_PHASE': {
      logger.info('PHASE_TRANSITION', { from: state.phase, to: action.phase });
      return { ...state, phase: action.phase };
    }

    case 'SET_PLAYER_INFO': {
      return {
        ...state,
        studentName: action.studentName,
        profession: action.profession,
        partyMembers: action.partyMembers,
        chaplainInParty: action.chaplainInParty,
        cash: action.startingCash
      };
    }

    case 'SET_SUPPLIES': {
      return {
        ...state,
        cash: action.cash,
        foodLbs: action.foodLbs,
        clothingSets: action.clothingSets,
        ammoBoxes: action.ammoBoxes,
        spareParts: action.spareParts,
        oxenYokes: action.oxenYokes,
        waterGallons: action.waterGallons !== undefined ? action.waterGallons : state.waterGallons,
        hasFarmersAlmanac: action.hasFarmersAlmanac !== undefined ? action.hasFarmersAlmanac : state.hasFarmersAlmanac,
        hasTrailGuide: action.hasTrailGuide !== undefined ? action.hasTrailGuide : state.hasTrailGuide,
        hasToolSet: action.hasToolSet !== undefined ? action.hasToolSet : state.hasToolSet,
        hasBible: action.hasBible !== undefined ? action.hasBible : state.hasBible
      };
    }

    case 'SET_PACE': {
      return { ...state, pace: action.pace };
    }

    case 'SET_RATIONS': {
      return { ...state, rations: action.rations };
    }

    case 'ADVANCE_DAY': {
      const newDate = addDaysToDate(state.gameDate, 1);
      let foodConsumed = getFoodConsumption(state.rations, state.partyMembers);

      // Chaplain costs extra food (a non-working mouth to feed)
      if (state.chaplainInParty) {
        foodConsumed += CHAPLAIN_COSTS.extraFoodPerDay;
      }

      const newFood = Math.max(0, state.foodLbs - foodConsumed);

      // Water consumption: ~2 gal per person + ~4 gal per yoke of oxen
      const aliveCount = state.partyMembers.filter(m => m.alive).length;
      const waterConsumed = (aliveCount * 2) + (state.oxenYokes * 4);
      const newWater = Math.max(0, state.waterGallons - waterConsumed);

      // Chaplain clothing wear: every N days, uses 1 extra clothing set
      let newClothing = state.clothingSets;
      const newTrailDay = state.trailDay + 1;
      if (state.chaplainInParty && newTrailDay % CHAPLAIN_COSTS.clothingWearIntervalDays === 0 && newClothing > 0) {
        newClothing -= 1;
      }

      return {
        ...state,
        gameDate: newDate,
        trailDay: newTrailDay,
        foodLbs: newFood,
        waterGallons: newWater,
        clothingSets: newClothing,
        distanceTraveled: state.distanceTraveled + (action.distanceTraveled || 0),
        distanceToNextLandmark: Math.max(0, state.distanceToNextLandmark - (action.distanceTraveled || 0))
      };
    }

    case 'SET_DISTANCE': {
      return {
        ...state,
        distanceToNextLandmark: action.distance
      };
    }

    case 'ARRIVE_LANDMARK': {
      const isFinal = action.landmarkIndex >= action.totalLandmarks - 1;
      return {
        ...state,
        currentLandmarkIndex: action.landmarkIndex,
        distanceToNextLandmark: action.distanceToNext || 0,
        phase: isFinal ? 'GAME_OVER' : 'LANDMARK',
        status: isFinal ? 'completed' : state.status
      };
    }

    case 'UPDATE_PARTY_HEALTH': {
      return {
        ...state,
        partyMembers: state.partyMembers.map(m => {
          const update = action.updates.find(u => u.name === m.name);
          return update ? { ...m, ...update } : m;
        })
      };
    }

    case 'PARTY_MEMBER_DIES': {
      logger.warn('PARTY_MEMBER_DIED', { name: action.name, cause: action.cause, day: state.trailDay });
      return {
        ...state,
        partyMembers: state.partyMembers.map(m =>
          m.name === action.name ? { ...m, health: 'dead', alive: false, causeOfDeath: action.cause } : m
        ),
        eventLog: [...state.eventLog, {
          date: state.gameDate,
          type: 'death',
          description: `${action.name} died of ${action.cause}.`,
          moralLabelId: null
        }]
      };
    }

    case 'UPDATE_GRACE': {
      const newGrace = Math.max(0, Math.min(100, state.grace + action.delta));
      logger.info('GRACE_CHANGED', { delta: action.delta, newValue: newGrace, trigger: action.trigger });
      return {
        ...state,
        grace: newGrace,
        graceHistory: [...state.graceHistory, { delta: action.delta, trigger: action.trigger, date: state.gameDate, newValue: newGrace }]
      };
    }

    case 'UPDATE_MORALE': {
      // Bible provides a small morale floor (Scripture brings comfort)
      const bibleFloor = state.hasBible ? STORE_BIBLE.effects.moraleFloor : 0;
      const chaplainFloor = state.chaplainInParty ? GAME_CONSTANTS.MORALE_CHAPLAIN_FLOOR : 0;
      const effectiveFloor = Math.max(chaplainFloor, bibleFloor);

      // Bible mitigates morale loss from deaths
      let adjustedDelta = action.delta;
      if (action.delta < 0 && state.hasBible && action.trigger === 'death') {
        adjustedDelta = Math.round(action.delta * (1 - STORE_BIBLE.effects.deathMoraleMitigation));
      }

      let newMorale = Math.max(effectiveFloor, Math.min(100, state.morale + adjustedDelta));

      // DEPLETED grace enforces a morale ceiling
      if (state.grace < 15) {
        const depletedCeiling = Math.max(chaplainFloor, bibleFloor);
        newMorale = Math.min(newMorale, depletedCeiling);
      }

      return { ...state, morale: newMorale };
    }

    case 'UPDATE_SUPPLIES': {
      return {
        ...state,
        cash: action.cash !== undefined ? action.cash : state.cash,
        foodLbs: action.foodLbs !== undefined ? action.foodLbs : state.foodLbs,
        clothingSets: action.clothingSets !== undefined ? action.clothingSets : state.clothingSets,
        ammoBoxes: action.ammoBoxes !== undefined ? action.ammoBoxes : state.ammoBoxes,
        spareParts: action.spareParts || state.spareParts,
        oxenYokes: action.oxenYokes !== undefined ? action.oxenYokes : state.oxenYokes,
        waterGallons: action.waterGallons !== undefined ? action.waterGallons : state.waterGallons
      };
    }

    case 'REFILL_WATER': {
      // Refill water at rivers, forts, or missions
      const capacity = action.capacity || 200;
      return {
        ...state,
        waterGallons: Math.min(capacity, state.waterGallons + (action.amount || capacity))
      };
    }

    case 'LOSE_ITEM': {
      // Items (books, tools, Bible) can be lost, destroyed, or stolen
      const updates = {};
      if (action.item === 'bible' && state.hasBible) updates.hasBible = false;
      if (action.item === 'farmers_almanac' && state.hasFarmersAlmanac) updates.hasFarmersAlmanac = false;
      if (action.item === 'trail_guide' && state.hasTrailGuide) updates.hasTrailGuide = false;
      if (action.item === 'tool_set' && state.hasToolSet) updates.hasToolSet = false;
      if (Object.keys(updates).length === 0) return state;
      logger.warn('ITEM_LOST', { item: action.item, cause: action.cause, day: state.trailDay });
      return { ...state, ...updates };
    }

    case 'SET_EVENT': {
      return { ...state, currentEvent: action.event, phase: 'EVENT_RESOLUTION' };
    }

    case 'RESOLVE_EVENT': {
      return {
        ...state,
        currentEvent: null,
        eventLog: [...state.eventLog, {
          date: state.gameDate,
          type: action.eventType,
          outcome: action.outcome,
          description: action.description,
          moralLabelId: action.moralLabelId || null
        }]
      };
    }

    case 'CWM_EVENT_RESOLVED': {
      return {
        ...state,
        cwmEvents: [...state.cwmEvents, {
          eventType: action.eventType,
          date: state.gameDate,
          choice: action.choice,
          recipientGenuine: action.recipientGenuine,
          reciprocityFired: false
        }],
        cwmFired: state.cwmFired + 1
      };
    }

    case 'SET_RECONCILIATION_PENDING': {
      return {
        ...state,
        reconciliationPending: action.data
      };
    }

    case 'CLEAR_RECONCILIATION': {
      return { ...state, reconciliationPending: null, pendingReconciliation: null };
    }

    case 'ADD_RECIPROCITY_PENDING': {
      return {
        ...state,
        reciprocityPending: [...state.reciprocityPending, {
          cwmType: action.cwmType,
          setAtLeg: state.currentLandmarkIndex,
          probability: 0.5
        }]
      };
    }

    case 'RECIPROCITY_FIRED': {
      return {
        ...state,
        reciprocityPending: state.reciprocityPending.filter(r => r.cwmType !== action.cwmType),
        cwmEvents: state.cwmEvents.map(e =>
          e.eventType === action.cwmType && !e.reciprocityFired ? { ...e, reciprocityFired: true } : e
        )
      };
    }

    case 'SUNDAY_REST': {
      if (action.rested) {
        return {
          ...state,
          sundayRestsTaken: state.sundayRestsTaken + 1,
          partyMembers: state.partyMembers.map(m =>
            m.alive && m.health !== 'good'
              ? { ...m, health: improveHealth(m.health) }
              : m
          )
        };
      }
      return { ...state, sundayRestsSkipped: state.sundayRestsSkipped + 1 };
    }

    case 'LAST_RITES': {
      return { ...state, lastRitesFired: true };
    }

    case 'SHOW_LABEL': {
      return { ...state, currentLabel: action.label };
    }

    case 'DISMISS_LABEL': {
      return {
        ...state,
        currentLabel: null,
        moralLabelsDismissed: state.currentLabel
          ? [...state.moralLabelsDismissed, state.currentLabel.id]
          : state.moralLabelsDismissed
      };
    }

    case 'ADD_HISTORIAN_ENTRY': {
      return {
        ...state,
        historianTranscript: [...state.historianTranscript, action.entry]
      };
    }

    case 'ADD_NPC_TRANSCRIPT': {
      const { character, location, question, response } = action.transcript;
      const existingIdx = state.npcTranscripts.findIndex(
        t => t.character === character && t.location === (location || '')
      );
      if (existingIdx >= 0) {
        const updated = [...state.npcTranscripts];
        updated[existingIdx] = {
          ...updated[existingIdx],
          exchanges: [...updated[existingIdx].exchanges, { question, response }]
        };
        return { ...state, npcTranscripts: updated };
      }
      return {
        ...state,
        npcTranscripts: [...state.npcTranscripts, {
          character,
          location: location || '',
          exchanges: [{ question, response }]
        }]
      };
    }

    case 'READ_KNOWLEDGE_CARD': {
      if (state.knowledgeCardsRead.includes(action.cardId)) return state;
      return {
        ...state,
        knowledgeCardsRead: [...state.knowledgeCardsRead, action.cardId]
      };
    }

    case 'SET_AVAILABLE_KNOWLEDGE': {
      return { ...state, availableKnowledgeCards: action.cards };
    }

    case 'FEAST_DAY': {
      return {
        ...state,
        feastDaysEncountered: [...state.feastDaysEncountered, action.feastDay]
      };
    }

    case 'PRAY': {
      logger.info('PRAYER_OFFERED', { day: state.trailDay, target: action.memberName });
      return {
        ...state,
        prayersOffered: state.prayersOffered + 1,
        prayerCooldownDay: state.trailDay
      };
    }

    case 'DEPLETE_BISON': {
      const newPop = Math.max(0, state.bisonPopulation - (action.amount || 15));
      return { ...state, bisonPopulation: newPop };
    }

    case 'SET_SCORE': {
      return {
        ...state,
        score: action.score,
        graceAdjustedScore: action.graceAdjustedScore,
        lifeInOregonNarrative: action.narrative || ''
      };
    }

    case 'PAUSE_GAME': {
      return { ...state, isPaused: true };
    }

    case 'RESUME_GAME': {
      return { ...state, isPaused: false };
    }

    case 'SET_STATUS': {
      return { ...state, status: action.status };
    }

    case 'TOGGLE_HISTORIAN': {
      return { ...state, showHistorian: !state.showHistorian };
    }

    case 'TOGGLE_KNOWLEDGE_PANEL': {
      return { ...state, showKnowledgePanel: !state.showKnowledgePanel };
    }

    case 'SET_WEATHER': {
      const newRecentWeather = [...state.recentWeather, action.weather].slice(-5);
      return {
        ...state,
        currentWeather: action.weather,
        weatherLog: [...state.weatherLog, action.weather],
        recentWeather: newRecentWeather
      };
    }

    case 'CAMP_ACTIVITY_PERFORMED': {
      logger.info('CAMP_ACTIVITY', { id: action.activityId, timeCost: action.timeCost, day: state.trailDay });
      return {
        ...state,
        activityCooldowns: {
          ...state.activityCooldowns,
          [action.activityId]: state.trailDay
        },
        activityLog: [...state.activityLog, {
          id: action.activityId,
          day: state.trailDay,
          date: state.gameDate,
          timeCost: action.timeCost
        }],
        // Apply specific flags from activity effects
        oxenChecked: action.effects?.oxenChecked || state.oxenChecked,
        wagonMaintained: action.effects?.breakdownPrevention ? true : state.wagonMaintained,
        illnessPreventionBonus: action.effects?.illnessPrevention || state.illnessPreventionBonus,
        spoilagePreventionBonus: action.effects?.spoilagePrevention || state.spoilagePreventionBonus
      };
    }

    case 'INCREMENT_STATIONARY': {
      return {
        ...state,
        daysStationary: state.daysStationary + 1,
        totalDaysStationary: state.totalDaysStationary + 1,
        daysRested: state.daysRested + 1
      };
    }

    case 'RESET_STATIONARY': {
      return { ...state, daysStationary: 0 };
    }

    case 'RESET_DAILY_BONUSES': {
      return {
        ...state,
        oxenChecked: false,
        wagonMaintained: false,
        illnessPreventionBonus: 0,
        spoilagePreventionBonus: 0
      };
    }

    case 'LOG_DANGER': {
      logger.info('DANGER_ENCOUNTERED', { id: action.danger.id, day: state.trailDay });
      return {
        ...state,
        dangerLog: [...state.dangerLog, {
          ...action.danger,
          day: state.trailDay,
          date: state.gameDate
        }],
        tripDifficultyPoints: state.tripDifficultyPoints + (action.danger.difficulty_score || 0)
      };
    }

    case 'LOAD_STATE': {
      return { ...state, ...action.savedState };
    }

    case 'RESET': {
      return { ...initialState };
    }

    default:
      return state;
  }
}

// Helper functions
function addDaysToDate(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getFoodConsumption(rations, partyMembers) {
  const alive = partyMembers.filter(m => m.alive).length;
  const rates = { filling: 3, meager: 2, bare_bones: 1 };
  return alive * (rates[rations] || 2);
}

function improveHealth(health) {
  const order = ['dead', 'critical', 'poor', 'fair', 'good'];
  const idx = order.indexOf(health);
  return idx < order.length - 1 ? order[idx + 1] : health;
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameContext);
  if (context === null) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}

export function useGameDispatch() {
  const context = useContext(GameDispatchContext);
  if (!context) {
    throw new Error('useGameDispatch must be used within a GameProvider');
  }
  return context;
}
