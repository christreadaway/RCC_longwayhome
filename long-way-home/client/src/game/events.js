/**
 * Event System
 *
 * Manages the firing, resolution, and tracking of game events.
 * Events are the primary source of narrative and gameplay variety
 * on the trail. This module handles:
 *
 * - Rolling for random events per trail leg
 * - Resolving player choices and computing outcomes
 * - Calendar-based events (Sunday rest, feast days)
 * - Filtering available events by game state and feature flags
 *
 * Event definitions come from events.json (loaded externally).
 * This module provides the logic layer only.
 *
 * @module events
 */

import { GRACE_DELTAS, GAME_CONSTANTS, HEALTH_ORDER } from '@shared/types';
import { rollProbability, calculateEventProbability } from './probability.js';
import { shouldFireCwmEvent, selectCwmEvent } from './cwm.js';
import { getLabelForEvent } from './morallabels.js';

// ---------------------------------------------------------------------------
// Event data (loaded from JSON)
// ---------------------------------------------------------------------------

/**
 * @type {Array|null}
 * Loaded event data from events.json. Set via setEventData().
 */
let eventData = null;

/**
 * Sets the event data from the loaded JSON file.
 * Call this once at app initialization with the contents of events.json.
 *
 * @param {Array} data - Parsed events.json contents (array of event objects)
 */
export function setEventData(data) {
  eventData = data;
}

// ---------------------------------------------------------------------------
// Calendar events
// ---------------------------------------------------------------------------

/**
 * Historical Catholic feast days that fall within the game's date range
 * (April 1 - December 31, 1848). These trigger special events.
 */
const FEAST_DAYS = [
  { month: 4, day: 16, name: 'Easter Sunday', type: 'feast_easter' },
  { month: 5, day: 25, name: 'Ascension Thursday', type: 'feast_ascension' },
  { month: 6, day: 4, name: 'Pentecost', type: 'feast_pentecost' },
  { month: 6, day: 15, name: 'Corpus Christi', type: 'feast_corpus_christi' },
  { month: 8, day: 15, name: 'Assumption of Mary', type: 'feast_assumption' },
  { month: 11, day: 1, name: 'All Saints Day', type: 'feast_all_saints' },
  { month: 12, day: 8, name: 'Immaculate Conception', type: 'feast_immaculate_conception' },
  { month: 12, day: 25, name: 'Christmas', type: 'feast_christmas' },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Rolls for events on the current trail leg. Returns an array of events
 * that fire, up to the maxEventsPerLeg limit from feature flags.
 *
 * @param {Object} gameState - Current game state
 * @param {Object} featureFlags - From getFeatureFlags()
 * @param {Object} graceEffects - From getGraceEffects()
 * @returns {Array<Object>} Array of fired event objects
 */
export function rollForEvents(gameState, featureFlags, graceEffects) {
  const firedEvents = [];
  const maxEvents = featureFlags.maxEventsPerLeg || 1;
  const availableEvents = getAvailableEvents(gameState, featureFlags);

  // Check for calendar events first (these don't count against the cap)
  const calendarEvent = checkCalendarEvents(gameState, featureFlags);
  if (calendarEvent) {
    firedEvents.push(calendarEvent);
  }

  // Check for CWM event
  if (shouldFireCwmEvent(gameState, featureFlags.maxCwmEvents)) {
    const cwmEvents = availableEvents.filter((e) => e.is_cwm);
    if (cwmEvents.length > 0) {
      const cwmChance = calculateEventProbability('cwm', gameState, graceEffects);
      if (rollProbability(cwmChance)) {
        const cwmEvent = selectCwmEvent(gameState, cwmEvents);
        if (cwmEvent) {
          firedEvents.push({ ...cwmEvent, fired_as: 'cwm' });
        }
      }
    }
  }

  // Roll for random events until we hit the cap
  const nonCwmEvents = availableEvents.filter((e) => !e.is_cwm);
  const eventCategories = groupByCategory(nonCwmEvents);

  for (const [category, events] of Object.entries(eventCategories)) {
    if (firedEvents.length >= maxEvents) break;

    const chance = calculateEventProbability(category, gameState, graceEffects);
    if (rollProbability(chance)) {
      const selected = events[Math.floor(Math.random() * events.length)];
      if (selected) {
        firedEvents.push({ ...selected, fired_as: 'random' });
      }
    }
  }

  return firedEvents.slice(0, maxEvents + (calendarEvent ? 1 : 0));
}

/**
 * Resolves a player's choice on an event and returns the resulting
 * state changes and outcomes.
 *
 * @param {Object} gameState - Current game state
 * @param {Object} event - The event being resolved
 * @param {string} choiceId - The ID of the player's chosen option
 * @returns {{
 *   updatedState: Object,
 *   outcomes: Array<{ type: string, description: string, value: any }>,
 *   graceChange: number,
 *   graceTrigger: string,
 *   moraleChange: number,
 *   healthChanges: Array,
 *   supplyChanges: Object,
 *   labelId: string|null
 * }}
 */
export function resolveEvent(gameState, event, choiceId) {
  const choice = (event.choices || []).find((c) => c.id === choiceId);
  if (!choice) {
    return {
      updatedState: { ...gameState },
      outcomes: [{ type: 'error', description: 'Invalid choice', value: null }],
      graceChange: 0,
      graceTrigger: null,
      moraleChange: 0,
      healthChanges: [],
      supplyChanges: {},
      labelId: null,
    };
  }

  const outcomes = [];
  let graceChange = 0;
  let graceTrigger = null;
  let moraleChange = 0;
  const healthChanges = [];
  const supplyChanges = {};

  // Process choice outcomes
  const choiceOutcomes = choice.outcomes || choice.outcome || {};

  // Grace effects
  if (choiceOutcomes.grace) {
    graceChange = choiceOutcomes.grace;
    graceTrigger = `EVENT_${event.type}_${choiceId}`.toUpperCase();
    outcomes.push({
      type: 'grace',
      description: `Grace ${graceChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(graceChange)}`,
      value: graceChange,
    });
  }

  // Predefined grace deltas for known event types
  if (!choiceOutcomes.grace && event.type) {
    const deltaMapping = getGraceDeltaForEvent(event.type, choiceId);
    if (deltaMapping) {
      graceChange = deltaMapping.delta;
      graceTrigger = deltaMapping.trigger;
      outcomes.push({
        type: 'grace',
        description: `Grace ${graceChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(graceChange)}`,
        value: graceChange,
      });
    }
  }

  // Morale effects
  if (choiceOutcomes.morale) {
    moraleChange = choiceOutcomes.morale;
    outcomes.push({
      type: 'morale',
      description: `Morale ${moraleChange > 0 ? 'improved' : 'decreased'}`,
      value: moraleChange,
    });
  }

  // Health effects
  if (choiceOutcomes.health) {
    for (const healthChange of Array.isArray(choiceOutcomes.health) ? choiceOutcomes.health : [choiceOutcomes.health]) {
      healthChanges.push(healthChange);
      outcomes.push({
        type: 'health',
        description: `Health change: ${healthChange.target || 'party'} ${healthChange.change || healthChange}`,
        value: healthChange,
      });
    }
  }

  // Supply effects
  if (choiceOutcomes.supplies) {
    Object.assign(supplyChanges, choiceOutcomes.supplies);
    for (const [item, amount] of Object.entries(choiceOutcomes.supplies)) {
      outcomes.push({
        type: 'supplies',
        description: `${item}: ${amount > 0 ? '+' : ''}${amount}`,
        value: { [item]: amount },
      });
    }
  }

  // Food effects
  if (choiceOutcomes.food) {
    supplyChanges.food = (supplyChanges.food || 0) + choiceOutcomes.food;
    outcomes.push({
      type: 'supplies',
      description: `Food: ${choiceOutcomes.food > 0 ? '+' : ''}${choiceOutcomes.food} lbs`,
      value: { food: choiceOutcomes.food },
    });
  }

  // Build label ID
  const labelId = `${event.type}_${choice.outcome || choiceId}`;

  // Log the event resolution
  const eventLogEntry = {
    type: event.type,
    choiceId,
    choiceOutcome: choice.outcome || choiceId,
    leg: gameState.current_leg,
    day: gameState.game_day,
    timestamp: new Date().toISOString(),
    outcomes: outcomes.map((o) => ({ type: o.type, value: o.value })),
  };

  const updatedState = {
    ...gameState,
    event_log: [...(gameState.event_log || []), eventLogEntry],
  };

  return {
    updatedState,
    outcomes,
    graceChange,
    graceTrigger,
    moraleChange,
    healthChanges,
    supplyChanges,
    labelId,
  };
}

/**
 * Checks whether the current game date falls on a Sunday.
 * Sunday rest provides health recovery and grace bonus.
 *
 * @param {string|Date} gameDate - Current in-game date
 * @returns {boolean}
 */
export function checkSundayRest(gameDate) {
  const date = new Date(gameDate);
  return date.getDay() === 0; // 0 = Sunday
}

/**
 * Checks whether the current game date falls on a Catholic feast day.
 *
 * @param {string|Date} gameDate - Current in-game date
 * @returns {{ name: string, type: string }|null}
 */
export function checkFeastDay(gameDate) {
  const date = new Date(gameDate);
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  const day = date.getDate();

  const feast = FEAST_DAYS.find((f) => f.month === month && f.day === day);
  return feast ? { name: feast.name, type: feast.type } : null;
}

/**
 * Returns the list of events available for the current game state,
 * filtered by grade band feature flags, trail progress, and
 * previously fired events.
 *
 * @param {Object} gameState - Current game state
 * @param {Object} featureFlags - From getFeatureFlags()
 * @returns {Array<Object>} Filtered events array
 */
export function getAvailableEvents(gameState, featureFlags) {
  if (!eventData || !Array.isArray(eventData)) {
    return [];
  }

  return eventData.filter((event) => {
    // Filter by grade band if the event specifies grade_bands
    if (event.grade_bands && !event.grade_bands.includes(gameState.gradeBand)) {
      return false;
    }

    // Feature flag filters
    if (event.is_cwm && !featureFlags.supplySystem) {
      return false; // K-2 doesn't have supply-based CWM events
    }
    if (event.requires_hunting && !featureFlags.huntingMinigame) {
      return false;
    }
    if (event.requires_chaplain && !featureFlags.chaplain) {
      return false;
    }
    if (event.requires_npc && !featureFlags.npcEncounters) {
      return false;
    }

    // Trail progress filters
    if (event.min_leg && gameState.current_leg < event.min_leg) {
      return false;
    }
    if (event.max_leg && gameState.current_leg > event.max_leg) {
      return false;
    }

    // Terrain filters
    if (event.terrain && event.terrain !== gameState.terrain) {
      return false;
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Groups events by their category field.
 *
 * @param {Array} events
 * @returns {Object<string, Array>}
 */
function groupByCategory(events) {
  const groups = {};
  for (const event of events) {
    const cat = event.category || 'general';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(event);
  }
  return groups;
}

/**
 * Checks for calendar-based events (Sunday rest, feast days).
 *
 * @param {Object} gameState
 * @param {Object} featureFlags
 * @returns {Object|null} Calendar event object, or null
 */
function checkCalendarEvents(gameState, featureFlags) {
  const gameDate = gameState.game_date;
  if (!gameDate) return null;

  // Sunday rest check
  if (featureFlags.sundayRest && checkSundayRest(gameDate)) {
    return {
      type: 'sunday_rest',
      category: 'calendar',
      title: 'The Lord\'s Day',
      description: 'It is Sunday. Your party rests, prays, and recovers their strength.',
      is_mandatory: true,
      choices: [
        {
          id: 'rest',
          text: 'Rest and pray',
          outcome: 'rest',
          outcomes: {
            grace: GRACE_DELTAS.SUNDAY_REST,
            morale: 5,
            health: { target: 'all', change: 'improve_one' },
          },
        },
      ],
      fired_as: 'calendar',
    };
  }

  // Feast day check
  if (featureFlags.feastDays) {
    const feast = checkFeastDay(gameDate);
    if (feast) {
      return {
        type: feast.type,
        category: 'calendar',
        title: feast.name,
        description: `Today the Church celebrates ${feast.name}. Your party pauses to observe this holy day.`,
        is_mandatory: true,
        choices: [
          {
            id: 'celebrate',
            text: `Celebrate ${feast.name}`,
            outcome: 'celebrate',
            outcomes: {
              grace: GRACE_DELTAS.PRAYER,
              morale: 8,
            },
          },
        ],
        fired_as: 'calendar',
      };
    }
  }

  return null;
}

/**
 * Maps known event types to their grace delta values.
 *
 * @param {string} eventType
 * @param {string} choiceId
 * @returns {{ delta: number, trigger: string }|null}
 */
function getGraceDeltaForEvent(eventType, choiceId) {
  const mappings = {
    // Sunday/Prayer
    'sunday_rest:rest': { delta: GRACE_DELTAS.SUNDAY_REST, trigger: 'SUNDAY_REST' },
    'prayer:pray': { delta: GRACE_DELTAS.PRAYER, trigger: 'PRAYER' },

    // Chaplain
    'chaplain_encounter:confess': { delta: GRACE_DELTAS.CHAPLAIN, trigger: 'CHAPLAIN' },

    // Last rites
    'last_rites:administer': { delta: GRACE_DELTAS.LAST_RITES, trigger: 'LAST_RITES' },

    // Trading
    'trade:fair': { delta: GRACE_DELTAS.FAIR_TRADE, trigger: 'FAIR_TRADE' },
    'trade:exploit': { delta: GRACE_DELTAS.EXPLOIT, trigger: 'EXPLOIT' },

    // Hunting
    'hunting:overhunt': { delta: GRACE_DELTAS.OVERHUNT, trigger: 'OVERHUNT' },

    // Forgiveness
    'conflict:forgive': { delta: GRACE_DELTAS.FORGIVE, trigger: 'FORGIVE' },

    // Reconciliation
    'reconciliation:taken': { delta: GRACE_DELTAS.RECONCILIATION_TAKEN, trigger: 'RECONCILIATION_TAKEN' },
  };

  const key = `${eventType}:${choiceId}`;
  return mappings[key] || null;
}
