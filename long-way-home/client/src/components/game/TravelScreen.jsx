import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { GAME_CONSTANTS, PACE_MULTIPLIER, GRACE_DELTAS, GRACE_RANGES, PROFESSION_REPAIR, CHAPLAIN_COSTS, STORE_BOOKS, STORE_BIBLE, SLEEP_SCHEDULE, WATER_RATIONS, WATER_OXEN_MULTIPLIER, getHeatWaterMultiplier } from '@shared/types';
import { formatGameDate, isSunday, addDays, isAfter } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';
import { logCrash, trackAction } from '../../utils/crashLogger';
import OregonTrailMap from './shared/OregonTrailMap';
import TerrainScene from './shared/TerrainScene';
import PartyStatus from './shared/PartyStatus';
import HistorianPanel from './shared/HistorianPanel';
import KnowledgePanel from './shared/KnowledgePanel';
import SundayRestPrompt from './shared/SundayRestPrompt';
import HuntingMinigame from './shared/HuntingMinigame';
import WeatherBox from './shared/WeatherBox';
import CampActivitiesPanel from './shared/CampActivitiesPanel';

// Game systems
import { generateWeather, applyWeatherToTravel } from '../../game/weather';
import trailDangersData from '../../data/trail-dangers.json';

// Landmarks data (loaded dynamically based on grade band)
import landmarksData from '../../data/landmarks.json';
import landmarksK2 from '../../data/landmarks-k2.json';
import eventsData from '../../data/events.json';
import { getFlavorMessage } from '../../data/trail-flavor';

/** Return grace range label */
function getGraceRange(grace) {
  if (grace >= GRACE_RANGES.HIGH.min) return 'High';
  if (grace >= GRACE_RANGES.MODERATE.min) return 'Moderate';
  if (grace >= GRACE_RANGES.LOW.min) return 'Low';
  return 'Depleted';
}

/** Grace bar color */
function getGraceColor(grace) {
  if (grace >= 75) return 'bg-yellow-400';
  if (grace >= 40) return 'bg-yellow-600/60';
  if (grace >= 15) return 'bg-orange-500';
  return 'bg-red-600';
}

export default function TravelScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [showSundayPrompt, setShowSundayPrompt] = useState(false);
  const [showHunting, setShowHunting] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [travelMessage, setTravelMessage] = useState('');
  const [showFullMap, setShowFullMap] = useState(false);
  const travelTimerRef = useRef(null);
  const skipSundayCheckRef = useRef(false);

  const landmarks = state.gradeBand === 'k2' ? landmarksK2.landmarks : landmarksData.landmarks;
  const currentLandmark = landmarks[state.currentLandmarkIndex];
  const nextLandmark = landmarks[state.currentLandmarkIndex + 1];

  // Initialize distance to next landmark on first render
  useEffect(() => {
    if (state.distanceToNextLandmark === 0 && nextLandmark) {
      dispatch({
        type: 'SET_DISTANCE',
        distance: nextLandmark.distance_from_previous
      });
    }
  }, [state.distanceToNextLandmark, nextLandmark, dispatch]);

  const travelOneDay = useCallback(() => {
    if (state.isPaused || !nextLandmark) return;

    // Check if it's Sunday (skip if player already declined rest)
    if (isSunday(state.gameDate) && !skipSundayCheckRef.current) {
      setShowSundayPrompt(true);
      return;
    }
    skipSundayCheckRef.current = false;

    // Check end date
    if (isAfter(state.gameDate, GAME_CONSTANTS.END_DATE)) {
      dispatch({ type: 'SET_STATUS', status: 'failed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
      return;
    }

    // Check all dead before doing anything
    const aliveAtStart = state.partyMembers.filter(m => m.alive);
    if (aliveAtStart.length === 0) {
      dispatch({ type: 'SET_STATUS', status: 'failed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
      return;
    }

    // Check oxen
    if (state.oxenYokes < 1) {
      setTravelMessage('You have no oxen. You cannot move until you acquire more.');
      return;
    }

    // Track whether we set a message this tick
    let dayMessage = '';

    // Calculate food after today's consumption (mirrors ADVANCE_DAY reducer, including cold weather)
    const aliveCount = aliveAtStart.length;
    const rateMap = { filling: 3, meager: 2, bare_bones: 1 };
    const preCheckTemp = state.currentWeather?.temperature?.current ?? 65;
    let dailyConsumption = aliveCount * (rateMap[state.rations] || 2);
    // Cold weather increases food consumption (matches getFoodConsumption in reducer)
    if (preCheckTemp < 32) dailyConsumption *= 1.4;
    else if (preCheckTemp < 50) dailyConsumption *= 1.2;
    dailyConsumption = Math.round(dailyConsumption * 10) / 10;
    const foodAfterToday = Math.max(0, state.foodLbs - dailyConsumption);

    // Starvation check
    if (foodAfterToday <= 0) {
      const starvationUpdates = [];
      const deaths = [];
      aliveAtStart.forEach(m => {
        const healthOrder = ['good', 'fair', 'poor', 'critical', 'dead'];
        const idx = healthOrder.indexOf(m.health);
        const newHealth = idx < 4 ? healthOrder[idx + 1] : 'dead';
        if (newHealth === 'dead') {
          deaths.push(m.name);
        } else {
          starvationUpdates.push({ name: m.name, health: newHealth });
        }
      });
      if (starvationUpdates.length > 0) {
        dispatch({ type: 'UPDATE_PARTY_HEALTH', updates: starvationUpdates });
      }
      deaths.forEach(name => {
        dispatch({ type: 'PARTY_MEMBER_DIES', name, cause: 'starvation' });
      });
      if (deaths.length > 0) {
        dayMessage = `${deaths.join(' and ')} died of starvation.`;
      } else {
        dayMessage = 'Your party is starving! Find food soon.';
      }
    }

    // Recompute alive members after starvation deaths
    const starvationDeaths = new Set();
    if (foodAfterToday <= 0) {
      aliveAtStart.forEach(m => {
        const healthOrder = ['good', 'fair', 'poor', 'critical', 'dead'];
        const idx = healthOrder.indexOf(m.health);
        if (idx >= 3) starvationDeaths.add(m.name);
      });
    }
    const aliveAfterStarvation = aliveAtStart.filter(m => !starvationDeaths.has(m.name));

    // Check all dead after starvation
    if (aliveAfterStarvation.length === 0) {
      dispatch({ type: 'SET_STATUS', status: 'failed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
      return;
    }

    // --- Generate weather for the day ---
    const terrainType = currentLandmark?.terrain_type || 'plains';
    const todayWeather = generateWeather(state.gameDate, terrainType, state.recentWeather || []);
    dispatch({ type: 'SET_WEATHER', weather: todayWeather });

    // Weather morale effect (applied each travel day)
    if (todayWeather.moraleModifier && todayWeather.moraleModifier !== 0) {
      // Only apply negative morale from weather; positive is just "no penalty"
      if (todayWeather.moraleModifier < 0) {
        dispatch({ type: 'UPDATE_MORALE', delta: Math.round(todayWeather.moraleModifier / 2) });
      }
    }

    // --- Water dehydration check ---
    const waterRate = (WATER_RATIONS[state.waterRations] || WATER_RATIONS.full).perPerson;
    const heatMult = getHeatWaterMultiplier(todayWeather.temperature?.current ?? 65);
    const waterAfterToday = Math.max(0, state.waterGallons - ((aliveCount * waterRate + state.oxenYokes * waterRate * WATER_OXEN_MULTIPLIER) * heatMult));
    if (waterAfterToday <= 0 && state.waterGallons > 0) {
      // Just ran out of water
      dayMessage = 'Your water barrels are empty! The party and oxen suffer from thirst.';
      dispatch({ type: 'UPDATE_MORALE', delta: -8 });
    } else if (state.waterGallons <= 0) {
      // Already out of water — health degrades
      const dehydrationVictim = aliveAfterStarvation[Math.floor(Math.random() * aliveAfterStarvation.length)];
      if (dehydrationVictim && dehydrationVictim.health !== 'critical') {
        const healthOrder = ['good', 'fair', 'poor', 'critical'];
        const idx = healthOrder.indexOf(dehydrationVictim.health);
        if (idx < 3) {
          dispatch({ type: 'UPDATE_PARTY_HEALTH', updates: [{ name: dehydrationVictim.name, health: healthOrder[idx + 1] }] });
          dayMessage = `${dehydrationVictim.name} is suffering from dehydration. You must find water soon.`;
        }
      }
      dispatch({ type: 'UPDATE_MORALE', delta: -5 });
    }

    // Minimal water rations health penalty (people are getting dehydrated even with some water)
    const waterHealthMod = (WATER_RATIONS[state.waterRations] || WATER_RATIONS.full).healthModifier || 0;
    if (waterHealthMod > 0 && state.waterGallons > 0 && Math.random() < waterHealthMod) {
      const thirstyMember = aliveAfterStarvation.find(m => m.health !== 'critical' && m.health !== 'dead');
      if (thirstyMember && thirstyMember.health !== 'good') {
        const healthOrder = ['good', 'fair', 'poor', 'critical'];
        const idx = healthOrder.indexOf(thirstyMember.health);
        if (idx < 3) {
          dispatch({ type: 'UPDATE_PARTY_HEALTH', updates: [{ name: thirstyMember.name, health: healthOrder[idx + 1] }] });
          if (!dayMessage) dayMessage = `${thirstyMember.name} is weakened from insufficient water.`;
        }
      }
    }

    // Auto-refill water at river terrain (traveling along rivers was the norm)
    if (terrainType === 'river' && state.waterGallons < 200) {
      dispatch({ type: 'REFILL_WATER', capacity: 200 });
    }

    // --- Chaplain oxen strain (extra weight in the wagon) ---
    if (state.chaplainInParty && Math.random() < CHAPLAIN_COSTS.oxenStrainChance) {
      // Small chance the extra burden lames an ox
      if (state.oxenYokes > 1) {
        dispatch({ type: 'UPDATE_SUPPLIES', oxenYokes: state.oxenYokes - 1 });
        dayMessage = dayMessage || 'One of the oxen has gone lame under the heavy load. You unyoke it and leave it to graze.';
      }
    }

    // --- Calculate distance traveled (weather + ground + pace + sleep + oxen care) ---
    const baseMiles = GAME_CONSTANTS.BASE_DAILY_MILES;
    const paceMult = PACE_MULTIPLIER[state.pace] || 1.0;
    const sleepMult = (SLEEP_SCHEDULE[state.sleepSchedule] || SLEEP_SCHEDULE.normal).travelBonus;
    let rawMiles = Math.round(baseMiles * paceMult * sleepMult);

    // Apply weather/ground modifier
    rawMiles = applyWeatherToTravel(rawMiles, todayWeather);

    // Sleep schedule health/morale effects
    const sleepConfig = SLEEP_SCHEDULE[state.sleepSchedule] || SLEEP_SCHEDULE.normal;
    if (sleepConfig.moraleModifier !== 0) {
      dispatch({ type: 'UPDATE_MORALE', delta: sleepConfig.moraleModifier });
    }
    if (sleepConfig.healthRecovery < 0 && Math.random() < Math.abs(sleepConfig.healthRecovery)) {
      // Short sleep: small chance of health degradation
      const tiredMember = aliveAfterStarvation.find(m => m.health !== 'critical' && m.health !== 'dead');
      if (tiredMember && tiredMember.health !== 'good') {
        // Only affect already-weakened members
        dispatch({ type: 'UPDATE_MORALE', delta: -1 });
      }
    }

    // Oxen care bonus (well-tended oxen pull harder)
    if (state.oxenChecked) rawMiles = Math.round(rawMiles * 1.05);

    // Grace influence: high grace = slightly better fortune on the trail
    if (state.grace >= 75) rawMiles = Math.round(rawMiles * 1.05);
    else if (state.grace < 15) rawMiles = Math.round(rawMiles * 0.92);

    // Trail guide travel bonus (better route knowledge)
    if (state.hasTrailGuide) rawMiles = Math.round(rawMiles * (1 + STORE_BOOKS.trail_guide.effects.travelBonus));

    // Dehydration slows travel
    if (state.waterGallons <= 0) rawMiles = Math.round(rawMiles * 0.7);

    const dailyMiles = Math.max(0, rawMiles);

    // Reset daily bonuses at start of new travel day
    dispatch({ type: 'RESET_DAILY_BONUSES' });
    // Reset stationary counter since we're traveling
    dispatch({ type: 'RESET_STATIONARY' });

    // --- Terrain-adaptive difficulty ---
    // Prairie/plains = easier (fewer events, less danger)
    // Hills = moderate
    // Mountains = hardest (more events, more danger, more illness)
    // River = moderate-hard (crossing dangers, but also resources)
    const hazardMult = currentLandmark?.hazard_multiplier ?? 1.0;
    const terrainDifficulty = {
      plains:    { eventMod: 0.06, dangerMod: -0.03, illnessMod: 0,     encounterMod: 0.04 },
      hills:     { eventMod: 0,    dangerMod: 0,     illnessMod: 0.02,  encounterMod: 0 },
      mountains: { eventMod: -0.06, dangerMod: 0.06,  illnessMod: 0.04,  encounterMod: -0.02 },
      river:     { eventMod: -0.03, dangerMod: 0.04,  illnessMod: 0.03,  encounterMod: 0.01 },
    }[terrainType] || { eventMod: 0, dangerMod: 0, illnessMod: 0, encounterMod: 0 };

    // Weather compounds difficulty
    const weatherDifficultyMod = todayWeather.difficultyScore >= 5 ? 0.05
      : todayWeather.difficultyScore >= 3 ? 0.02 : 0;

    // Random event check — frequency adapts to terrain
    // Higher threshold = fewer events (plains are quieter; mountains are eventful)
    const eventRoll = Math.random();
    const baseEventThreshold = state.gradeBand === 'k2' ? 0.80 : 0.72;
    const eventThreshold = Math.min(0.92, Math.max(0.55,
      baseEventThreshold + terrainDifficulty.eventMod - weatherDifficultyMod));

    if (eventRoll > eventThreshold) {
      const event = selectRandomEvent(state, eventsData);
      if (event) {
        dispatch({ type: 'SET_EVENT', event });
        return;
      }
    }

    // --- Trail danger check (scales with terrain + weather + hazard multiplier) ---
    const dangerRoll = Math.random();
    let dangerChance = (0.08 + terrainDifficulty.dangerMod + weatherDifficultyMod) * hazardMult;
    // Lingering increases danger (bandits, theft)
    if (state.daysStationary >= 2) dangerChance += 0.05 * state.daysStationary;
    // Low grace draws more hardship
    if (state.grace < 15) dangerChance += 0.05;
    else if (state.grace >= 75) dangerChance -= 0.03;
    // Chaplain adds wagon fragility (extra weight)
    if (state.chaplainInParty) dangerChance += CHAPLAIN_COSTS.wagonFragilityBonus;
    // Late season increases danger (winter storms, exhaustion)
    if (state.gameDate > '1848-09-15') dangerChance += 0.03;
    if (state.gameDate > '1848-11-01') dangerChance += 0.05;
    // Trail guide helps avoid dangers (education pays off)
    if (state.hasTrailGuide && Math.random() < STORE_BOOKS.trail_guide.effects.dangerAvoidance) {
      dangerChance = 0; // Guide helped identify and avoid the danger
    }

    if (dangerRoll < dangerChance) {
      const danger = selectTrailDanger(state, todayWeather, currentLandmark);
      if (danger && !dayMessage) {
        dispatch({ type: 'LOG_DANGER', danger });
        dayMessage = danger.description;
        // Apply danger effects
        if (danger.effects?.morale) dispatch({ type: 'UPDATE_MORALE', delta: danger.effects.morale });
        if (danger.effects?.food_loss) dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: Math.max(0, state.foodLbs - danger.effects.food_loss) });
        if (danger.effects?.cash_loss) dispatch({ type: 'UPDATE_SUPPLIES', cash: Math.max(0, state.cash - danger.effects.cash_loss) });
        if (danger.effects?.oxen_lost) dispatch({ type: 'UPDATE_SUPPLIES', oxenYokes: Math.max(0, state.oxenYokes - danger.effects.oxen_lost) });
        if (danger.effects?.clothing_loss) dispatch({ type: 'UPDATE_SUPPLIES', clothingSets: Math.max(0, state.clothingSets - danger.effects.clothing_loss) });

        // Items (books, tools, Bible) can be lost in river crossings, theft, fire, storms
        const itemLossCategories = ['river_crossing', 'theft', 'fire', 'storm', 'mechanical'];
        if (itemLossCategories.includes(danger.category) || danger.id?.includes('river') || danger.id?.includes('thief') || danger.id?.includes('fire') || danger.id?.includes('storm')) {
          const ownedItems = [];
          if (state.hasBible) ownedItems.push('bible');
          if (state.hasFarmersAlmanac) ownedItems.push('farmers_almanac');
          if (state.hasTrailGuide) ownedItems.push('trail_guide');
          if (state.hasToolSet) ownedItems.push('tool_set');
          if (ownedItems.length > 0 && Math.random() < 0.12) {
            const lostItem = ownedItems[Math.floor(Math.random() * ownedItems.length)];
            dispatch({ type: 'LOSE_ITEM', item: lostItem, cause: danger.category || danger.id });
            const itemNames = { bible: 'your Bible', farmers_almanac: "the Farmer's Almanac", trail_guide: 'the trail guide', tool_set: 'your tool set' };
            const lossVerbs = danger.id?.includes('thief') || danger.category === 'theft'
              ? 'was stolen' : danger.id?.includes('river') || danger.category === 'river_crossing'
              ? 'was lost in the crossing' : 'was destroyed';
            dayMessage += ` ${itemNames[lostItem]} ${lossVerbs}.`;
          }
        }

        // If danger has choices, fire it as an event instead
        if (danger.choices) {
          dispatch({ type: 'SET_EVENT', event: { ...danger, type: danger.id, title: danger.name } });
          return;
        }
      }
    }

    // --- Positive encounter check (grace + terrain influenced) ---
    // More encounters on plains (friendly travelers, native trade early in journey)
    const goodRoll = Math.random();
    let goodChance = 0.05 + terrainDifficulty.encounterMod;
    if (state.grace >= 75) goodChance += 0.08; // High grace = more good fortune
    else if (state.grace >= 40) goodChance += 0.02;
    // Early journey has more fellow travelers and native interactions
    if (state.distanceTraveled < 500) goodChance += 0.03;

    if (goodRoll < goodChance && !dayMessage) {
      const encounter = selectPositiveEncounter(state, currentLandmark);
      if (encounter) {
        if (encounter.effects?.morale) dispatch({ type: 'UPDATE_MORALE', delta: encounter.effects.morale });
        if (encounter.effects?.food_gain) dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: state.foodLbs + encounter.effects.food_gain });
        // Bible can be received as a gift from missionaries, chaplains, or kind strangers
        if (encounter.effects?.bible_gift && !state.hasBible) {
          dispatch({ type: 'LOAD_STATE', savedState: { hasBible: true } });
          dayMessage = (encounter.description || '') + ' They also gave your family a Bible.';
        }
        if (encounter.effects?.health_boost) {
          const healTarget = aliveAfterStarvation.find(m => m.health !== 'good');
          if (healTarget) {
            const order = ['dead', 'critical', 'poor', 'fair', 'good'];
            const idx = order.indexOf(healTarget.health);
            if (idx < 4) dispatch({ type: 'UPDATE_PARTY_HEALTH', updates: [{ name: healTarget.name, health: order[idx + 1] }] });
          }
        }
        if (encounter.choices) {
          dispatch({ type: 'SET_EVENT', event: { ...encounter, type: encounter.id, title: encounter.name } });
          return;
        }
        dayMessage = encounter.description;
        dispatch({ type: 'RESOLVE_EVENT', eventType: 'positive_encounter', outcome: encounter.name, description: encounter.description });
      }
    }

    // Illness check — terrain + weather + conditions affect illness rates
    const illnessRoll = Math.random();
    let illnessChance = 0.06 + terrainDifficulty.illnessMod;
    if (state.pace === 'grueling') illnessChance += 0.08;
    if (state.pace === 'strenuous') illnessChance += 0.03;
    if (state.rations === 'bare_bones') illnessChance += 0.06;
    if (state.rations === 'meager') illnessChance += 0.02;
    if (state.pace === 'grueling' && state.rations === 'bare_bones') illnessChance += 0.15;
    // Late season
    if (state.gameDate > '1848-10-01') illnessChance += 0.05;
    // Weather effects on illness: wet/cold weather increases risk
    if (todayWeather.condition === 'heavy_rain' || todayWeather.condition === 'blizzard') illnessChance += 0.06;
    else if (todayWeather.condition === 'rain' || todayWeather.condition === 'snow') illnessChance += 0.03;
    if (todayWeather.temperature?.current < 32) illnessChance += 0.04;
    // Insufficient clothing in cold
    if (todayWeather.temperature?.current < 40 && state.clothingSets < aliveAfterStarvation.length) illnessChance += 0.05;
    // Hygiene/camp activity prevention bonus
    if (state.illnessPreventionBonus) illnessChance -= state.illnessPreventionBonus;
    // Farmer's Almanac reduces illness (folk remedies, herbal knowledge)
    if (state.hasFarmersAlmanac) illnessChance -= STORE_BOOKS.farmers_almanac.effects.illnessReduction;

    if (illnessRoll < illnessChance && aliveAfterStarvation.length > 0) {
      const victim = aliveAfterStarvation[Math.floor(Math.random() * aliveAfterStarvation.length)];
      if (victim.health !== 'critical') {
        const illnesses = ['cholera', 'dysentery', 'typhoid', 'exhaustion', 'measles'];
        const illness = illnesses[Math.floor(Math.random() * illnesses.length)];
        const healthOrder = ['good', 'fair', 'poor', 'critical'];
        const idx = healthOrder.indexOf(victim.health);
        const newHealth = idx < 3 ? healthOrder[idx + 1] : 'critical';

        dispatch({
          type: 'UPDATE_PARTY_HEALTH',
          updates: [{ name: victim.name, health: newHealth, illness }]
        });
        dispatch({
          type: 'RESOLVE_EVENT',
          eventType: 'illness',
          outcome: `${victim.name} has ${illness}`,
          description: `${victim.name} has come down with ${illness}. Their condition is ${newHealth}.`
        });
        dayMessage = `${victim.name} has come down with ${illness}!`;
      }
    }

    // Trail wear — the journey itself wears people down
    // Every 7 days there's a chance a healthy/fair member deteriorates
    // Mountain terrain is much harder on the body than flatland
    if (state.trailDay % 7 === 0) {
      const healthyMembers = aliveAfterStarvation.filter(m => m.health === 'good' || m.health === 'fair');
      if (healthyMembers.length > 0) {
        let wearChance = 0.15 * hazardMult; // Base weekly wear scaled by terrain hazard
        if (terrainType === 'mountains') wearChance += 0.08;
        else if (terrainType === 'plains') wearChance -= 0.05;
        if (state.pace === 'grueling') wearChance += 0.20;
        if (state.pace === 'strenuous') wearChance += 0.08;
        if (state.rations === 'bare_bones') wearChance += 0.12;
        if (state.rations === 'meager') wearChance += 0.05;

        healthyMembers.forEach(m => {
          if (Math.random() < wearChance) {
            const healthOrder = ['good', 'fair', 'poor', 'critical'];
            const idx = healthOrder.indexOf(m.health);
            const newHealth = idx < 3 ? healthOrder[idx + 1] : 'critical';
            dispatch({
              type: 'UPDATE_PARTY_HEALTH',
              updates: [{ name: m.name, health: newHealth }]
            });
            if (!dayMessage) {
              const wearMessages = [
                `${m.name} is showing signs of exhaustion from the long journey.`,
                `${m.name} has been weakened by the relentless travel.`,
                `The trail is taking its toll on ${m.name}.`,
                `${m.name} is not looking well after weeks on the trail.`,
              ];
              dayMessage = wearMessages[Math.floor(Math.random() * wearMessages.length)];
            }
          }
        });
      }
    }

    // Morale decay — morale naturally drops over time without rest
    if (state.trailDay % 5 === 0) {
      const moraleDecay = state.pace === 'grueling' ? -5 : state.pace === 'strenuous' ? -3 : -1;
      dispatch({ type: 'UPDATE_MORALE', delta: moraleDecay });
    }

    // Death check for critical members — higher death rates
    const chaplainAlive = state.chaplainInParty && aliveAfterStarvation.some(m => m.isChaplain);
    aliveAfterStarvation.filter(m => m.health === 'critical' && !m.isChaplain).forEach(m => {
      const deathRoll = Math.random();
      const deathChance = state.rations === 'filling' ? 0.20 : state.rations === 'meager' ? 0.30 : 0.50;
      if (deathRoll < deathChance) {
        if (chaplainAlive && !state.lastRitesFired) {
          dispatch({ type: 'LAST_RITES' });
          dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.LAST_RITES, trigger: 'last_rites' });
          dispatch({ type: 'UPDATE_MORALE', delta: Math.round(-15 * GAME_CONSTANTS.LAST_RITES_MORALE_REDUCTION) });
          dayMessage = `Fr. Joseph administered Last Rites to ${m.name} before they passed. ${m.name} died of ${m.illness || 'exhaustion'}, but the party found peace in the sacrament.`;
        } else {
          dispatch({ type: 'UPDATE_MORALE', delta: -15 });
          dayMessage = `${m.name} has died of ${m.illness || 'exhaustion'}.`;
        }
        dispatch({
          type: 'PARTY_MEMBER_DIES',
          name: m.name,
          cause: m.illness || 'exhaustion'
        });
      }
    });

    // Grueling pace with sick members — grace penalty
    if (state.pace === 'grueling') {
      const sickMembers = aliveAfterStarvation.filter(m => m.health === 'poor' || m.health === 'critical');
      if (sickMembers.length > 0) {
        dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.GRUELING_SICK, trigger: 'grueling_while_sick' });
      }
    }

    // Advance the day
    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: dailyMiles });

    // Check if arrived at next landmark
    const newDistToNext = state.distanceToNextLandmark - dailyMiles;
    if (newDistToNext <= 0 && nextLandmark) {
      const newIdx = state.currentLandmarkIndex + 1;
      dispatch({
        type: 'ARRIVE_LANDMARK',
        landmarkIndex: newIdx,
        distanceToNext: landmarks[newIdx + 1] ? landmarks[newIdx + 1].distance_from_previous : 0,
        totalLandmarks: landmarks.length
      });
      // Refill water at forts, missions, towns, and river landmarks
      const lType = nextLandmark.type;
      if (lType === 'fort' || lType === 'mission' || lType === 'town' || nextLandmark.terrain_type === 'river') {
        dispatch({ type: 'REFILL_WATER', capacity: 200 });
      }
      // Missions may gift a Bible to travelers who don't have one
      if (lType === 'mission' && !state.hasBible && Math.random() < 0.4) {
        dispatch({ type: 'LOAD_STATE', savedState: { hasBible: true } });
        setTravelMessage(`You have arrived at ${nextLandmark.name}! The missionaries there gifted your family a Bible.`);
        return;
      }
      setTravelMessage(`You have arrived at ${nextLandmark.name}!`);
      return;
    }

    // Feast day check
    const nextDate = addDays(state.gameDate, 1);
    const feastDays = {
      '1848-08-15': { id: 'assumption', name: 'Feast of the Assumption', text: 'Today is the Feast of the Assumption of the Blessed Virgin Mary. Many in the wagon train pause to pray.' },
      '1848-11-01': { id: 'all_saints', name: "All Saints' Day", text: "Today is All Saints' Day. The faithful remember those who have gone before." },
      '1848-11-02': { id: 'all_souls', name: "All Souls' Day", text: "Today is All Souls' Day. A time to remember and pray for the dead." }
    };
    const feast = feastDays[nextDate];
    if (feast && !state.feastDaysEncountered.includes(feast.id)) {
      dispatch({ type: 'FEAST_DAY', feastDay: feast.id });
      dayMessage = feast.text;
    }

    if (!dayMessage) {
      // Use weather description as the flavor when nothing else happens
      if (todayWeather.difficultyScore >= 3) {
        dayMessage = todayWeather.description;
      } else {
        dayMessage = getFlavorMessage(
          currentLandmark?.terrain_type || 'plains',
          state,
          state.trailDay
        );
        // Append weather note for informational color
        if (todayWeather.conditionLabel && todayWeather.conditionLabel !== 'Fair' && todayWeather.conditionLabel !== 'Sunny') {
          dayMessage += ` The weather: ${todayWeather.conditionLabel.toLowerCase()}, ${todayWeather.temperature?.current || '--'}°F.`;
        }
      }
    }
    setTravelMessage(dayMessage);
  }, [state, dispatch, nextLandmark, landmarks]);

  function handleSundayChoice(rested) {
    setShowSundayPrompt(false);
    dispatch({ type: 'SUNDAY_REST', rested });
    if (rested) {
      // Bible provides extra grace on Sunday rest (reading Scripture)
      const sundayGrace = GRACE_DELTAS.SUNDAY_REST + (state.hasBible ? STORE_BIBLE.effects.sundayRestGraceBonus : 0);
      dispatch({ type: 'UPDATE_GRACE', delta: sundayGrace, trigger: 'sunday_rest' });
      // Bible provides extra morale on rest (comfort from Scripture)
      const sundayMorale = 5 + (state.hasBible ? STORE_BIBLE.effects.restMoraleBonus : 0);
      dispatch({ type: 'UPDATE_MORALE', delta: sundayMorale });

      const healthUpdates = state.partyMembers
        .filter(m => m.alive && m.health !== 'good')
        .map(m => {
          const order = ['dead', 'critical', 'poor', 'fair', 'good'];
          const idx = order.indexOf(m.health);
          return { name: m.name, health: idx < 4 ? order[idx + 1] : m.health };
        });
      if (healthUpdates.length > 0) {
        dispatch({ type: 'UPDATE_PARTY_HEALTH', updates: healthUpdates });
        setTravelMessage('Your party rested on the Sabbath. Everyone feels refreshed. The sick are improving.');
      } else {
        setTravelMessage('Your party rested on the Sabbath. Everyone feels refreshed.');
      }

      dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
    } else {
      skipSundayCheckRef.current = true;
      travelOneDay();
    }
  }

  function handleContinueTravel() {
    setTravelMessage('');
    travelOneDay();
  }

  function handleRest() {
    if (isAfter(state.gameDate, GAME_CONSTANTS.END_DATE)) {
      dispatch({ type: 'SET_STATUS', status: 'failed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
      return;
    }
    const alive = state.partyMembers.filter(m => m.alive);
    if (alive.length === 0) {
      dispatch({ type: 'SET_STATUS', status: 'failed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
      return;
    }

    trackAction('rest');

    // Track stationary days for lingering danger
    dispatch({ type: 'INCREMENT_STATIONARY' });

    // Generate weather for the rest day
    const terrainType = currentLandmark?.terrain_type || 'plains';
    const restWeather = generateWeather(state.gameDate, terrainType, state.recentWeather || []);
    dispatch({ type: 'SET_WEATHER', weather: restWeather });

    setIsResting(true);
    const updates = state.partyMembers
      .filter(m => m.alive && m.health !== 'good')
      .map(m => {
        const healthOrder = ['dead', 'critical', 'poor', 'fair', 'good'];
        const idx = healthOrder.indexOf(m.health);
        return { name: m.name, health: idx < 4 ? healthOrder[idx + 1] : m.health };
      });
    if (updates.length > 0) {
      dispatch({ type: 'UPDATE_PARTY_HEALTH', updates });
    }
    // Bible provides comfort during rest
    if (state.hasBible) {
      dispatch({ type: 'UPDATE_MORALE', delta: Math.round(STORE_BIBLE.effects.restMoraleBonus / 2) });
    }
    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });

    // Lingering danger warning
    const stationaryDays = (state.daysStationary || 0) + 1;
    if (stationaryDays >= 3) {
      setTravelMessage('Your party rested, but you have been in one place too long. Idle camps draw unwanted attention, and winter draws closer with every day lost.');
    } else {
      const bibleNote = state.hasBible ? ' Reading Scripture brings comfort to the weary.' : '';
      setTravelMessage(`Your party rested for a day. The sick are feeling a little better.${bibleNote}`);
    }
    setIsResting(false);
  }

  function handleFindWater() {
    if (isAfter(state.gameDate, GAME_CONSTANTS.END_DATE)) {
      dispatch({ type: 'SET_STATUS', status: 'failed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
      return;
    }

    trackAction('find_water');
    dispatch({ type: 'INCREMENT_STATIONARY' });

    // Generate weather for the search day
    const terrainType = currentLandmark?.terrain_type || 'plains';
    const searchWeather = generateWeather(state.gameDate, terrainType, state.recentWeather || []);
    dispatch({ type: 'SET_WEATHER', weather: searchWeather });

    // Success depends on terrain — river terrain is almost guaranteed, mountains harder
    let successChance = 0.55;
    if (terrainType === 'river' || terrainType === 'riverbank') successChance = 0.95;
    else if (terrainType === 'plains') successChance = 0.45;
    else if (terrainType === 'mountains') successChance = 0.35;
    else if (terrainType === 'desert') successChance = 0.20;

    // Trail guide helps find water
    if (state.hasTrailGuide) successChance = Math.min(0.95, successChance + 0.15);

    const roll = Math.random();
    if (roll < successChance) {
      // Found water — refill between 40-120 gallons depending on terrain
      const baseRefill = terrainType === 'river' ? 120 : terrainType === 'plains' ? 60 : 40;
      const refillAmount = Math.round(baseRefill * (0.7 + Math.random() * 0.6));
      dispatch({ type: 'REFILL_WATER', amount: refillAmount, capacity: 200 });
      setTravelMessage(`Your party spent the day searching for water and found a ${terrainType === 'river' ? 'good stream' : 'spring'}. You refilled ${refillAmount} gallons.`);
    } else {
      setTravelMessage('Your party spent the day searching for water but found nothing. A wasted day — the trail stretches on.');
      dispatch({ type: 'UPDATE_MORALE', delta: -3 });
    }

    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
  }

  function handleTalkToMember(member) {
    dispatch({ type: 'TALK_TO_MEMBER', name: member.name });
    trackAction('talk_to_member');

    // Generate contextual dialogue based on what's bothering them
    const morale = member.morale ?? 70;
    const health = member.health;
    let dialogue;

    if (health === 'critical') {
      dialogue = `${member.name} looks up weakly. "I'm scared... I don't know if I can go on. Please pray for me."`;
    } else if (health === 'poor') {
      dialogue = `${member.name} winces. "I'm not feeling well. Maybe we should rest a day."`;
    } else if (morale < 25) {
      const lowReasons = [
        `${member.name} stares at the horizon. "I want to go home. Why did we leave?"`,
        `${member.name} is barely holding back tears. "We've lost so much on this trail."`,
        `${member.name} speaks quietly. "I'm afraid of what comes next."`,
      ];
      dialogue = lowReasons[Math.floor(Math.random() * lowReasons.length)];
    } else if (morale < 50) {
      const midReasons = [
        `${member.name} sighs. "The road is long. Will we ever get there?"`,
        `${member.name} looks tired. "I miss home. But we have to keep going, don't we?"`,
        `${member.name} kicks a stone. "I'm hungry and my feet hurt."`,
      ];
      dialogue = midReasons[Math.floor(Math.random() * midReasons.length)];
    } else if (morale < 75) {
      const okReasons = [
        `${member.name} smiles a little. "It's hard, but we'll make it together."`,
        `${member.name} nods. "I'm alright. Just tired from the walk."`,
      ];
      dialogue = okReasons[Math.floor(Math.random() * okReasons.length)];
    } else {
      const goodReasons = [
        `${member.name} grins. "What an adventure! I can't wait to see Oregon!"`,
        `${member.name} laughs. "Did you see that eagle? This land is beautiful."`,
      ];
      dialogue = goodReasons[Math.floor(Math.random() * goodReasons.length)];
    }

    setTravelMessage(dialogue);
  }

  function handleGatherFirewood() {
    trackAction('gather_firewood');
    dispatch({ type: 'INCREMENT_STATIONARY' });

    const terrainType = currentLandmark?.terrain_type || 'plains';
    const gatherWeather = generateWeather(state.gameDate, terrainType, state.recentWeather || []);
    dispatch({ type: 'SET_WEATHER', weather: gatherWeather });

    // Yield depends on terrain — forests and rivers have wood, plains less so
    let yield_ = 3;
    if (terrainType === 'mountains') yield_ = 5;
    else if (terrainType === 'river') yield_ = 4;
    else if (terrainType === 'hills') yield_ = 4;
    else if (terrainType === 'plains') yield_ = 2;

    // Randomize a bit
    yield_ = Math.max(1, yield_ + Math.floor(Math.random() * 3) - 1);

    dispatch({ type: 'UPDATE_SUPPLIES', firewoodBundles: (state.firewoodBundles || 0) + yield_ });
    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
    setTravelMessage(`Your party spent the day gathering firewood. You collected ${yield_} bundles.`);
  }

  function handleHuntingComplete(foodGained, bisonKilled = 0) {
    setShowHunting(false);
    if (foodGained > 0) {
      dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: state.foodLbs + foodGained });

      if (bisonKilled >= 3) {
        dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.OVERHUNT, trigger: 'overhunt_bison' });
        dispatch({ type: 'DEPLETE_BISON', amount: bisonKilled * 15 });
        setTravelMessage(`You brought back ${foodGained} lbs of food, but you took more bison than your party needs. The herd suffers.`);
      } else {
        if (bisonKilled > 0) {
          dispatch({ type: 'DEPLETE_BISON', amount: bisonKilled * 10 });
        }
        setTravelMessage(`You hunted and brought back ${foodGained} lbs of food!`);
      }
    } else {
      setTravelMessage('The hunt was unsuccessful.');
    }
    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
  }

  const totalDistance = landmarks.reduce((sum, l) => sum + (l.distance_from_previous || 0), 0);
  const progressPercent = Math.min(100, (state.distanceTraveled / totalDistance) * 100);

  if (showHunting) {
    return <HuntingMinigame onComplete={handleHuntingComplete} ammo={state.ammoBoxes} bisonPopulation={state.bisonPopulation} />;
  }

  const graceRange = getGraceRange(state.grace);
  const terrainType = currentLandmark?.terrain_type || 'plains';

  // Upcoming landmarks for mini-map
  const upcomingLandmarks = [];
  if (currentLandmark) upcomingLandmarks.push({ ...currentLandmark, index: state.currentLandmarkIndex });
  if (nextLandmark) upcomingLandmarks.push({ ...nextLandmark, index: state.currentLandmarkIndex + 1 });
  const thirdLandmark = landmarks[state.currentLandmarkIndex + 2];
  if (thirdLandmark) upcomingLandmarks.push({ ...thirdLandmark, index: state.currentLandmarkIndex + 2 });

  const currentTemp = state.currentWeather?.temperature?.current ?? 65;
  const needsFirewood = currentTemp < 50;
  const noFire = state.noFireLastNight;

  // Helper to get morale emoji
  const getMoraleIcon = (morale) => {
    if (morale >= 75) return '😊';
    if (morale >= 50) return '😐';
    if (morale >= 25) return '😟';
    return '😢';
  };

  const getMoraleColor = (morale) => {
    if (morale >= 75) return 'text-green-600';
    if (morale >= 50) return 'text-yellow-600';
    if (morale >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-trail-cream" style={{ fontFamily: "'Lora', Georgia, serif" }}>

      {/* ═══ TOP BAR ═══ */}
      <div className="flex-none flex items-center justify-between px-4 py-1 bg-trail-darkBrown text-trail-cream">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-sm tracking-wide">The Long Way Home</span>
          <span className="text-trail-tan/50">|</span>
          <span>{formatGameDate(state.gameDate)}</span>
          <span className="text-trail-tan/50">|</span>
          <span>Day {state.trailDay}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-trail-tan/70">Grace:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-24 h-2 bg-trail-brown/50 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${getGraceColor(state.grace)}`}
                style={{ width: `${state.grace}%` }} />
            </div>
            <span className={`text-xs font-semibold ${
              state.grace >= 75 ? 'text-yellow-300' : state.grace >= 40 ? 'text-trail-tan' : state.grace >= 15 ? 'text-orange-400' : 'text-red-400'
            }`}>{state.grace}</span>
          </div>
        </div>
      </div>

      {/* ═══ HERO: Trail Scene ═══ */}
      <div className="flex-none h-[35vh] min-h-[180px] max-h-[280px] relative">
        <TerrainScene
          terrainType={terrainType}
          landmarkName={currentLandmark?.name}
          weather={state.currentWeather}
        />
        {/* Mini-map overlay at bottom of scene */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-4 py-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowFullMap(true)}>
            <div className="flex-1 flex items-center gap-1">
              {upcomingLandmarks.map((lm, i) => {
                const isCurrent = lm.index === state.currentLandmarkIndex;
                return (
                  <div key={lm.id || i} className="flex items-center">
                    {i > 0 && <div className="w-10 h-0.5 bg-white/30 mx-0.5" />}
                    <div className="flex flex-col items-center">
                      <div className={`rounded-full ${
                        isCurrent ? 'w-3 h-3 bg-trail-gold border-2 border-white' : 'w-2 h-2 bg-white/50 border border-white/60'
                      }`} />
                      <span className={`text-[9px] mt-0.5 ${isCurrent ? 'text-white font-bold' : 'text-white/60'}`}>
                        {lm.name?.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="w-10 h-0.5 bg-white/20 mx-0.5" />
              <span className="text-[9px] text-white/40">...</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-trail-gold/80 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-[9px] text-white/60">{Math.round(progressPercent)}%</span>
            </div>
            <span className="text-[9px] text-white/50 hover:text-white/80 transition-colors">View Map →</span>
          </div>
        </div>
      </div>

      {/* ═══ NARRATIVE ═══ */}
      {travelMessage && (
        <div className="flex-none px-6 py-2 bg-trail-parchment/80 border-y border-trail-tan/40">
          <p className="text-center text-sm text-trail-darkBrown italic leading-snug">
            &ldquo;{travelMessage}&rdquo;
          </p>
        </div>
      )}

      {/* ═══ DASHBOARD: Actions/Supplies LEFT, Status RIGHT ═══ */}
      <div className="flex-1 flex min-h-0 border-t border-trail-tan/30">

        {/* ──── LEFT: Actions + Travel Plan + Supplies ──── */}
        <div className="flex-1 flex flex-col min-w-0 px-4 py-2 overflow-y-auto">

          {/* Action buttons */}
          <div className="flex-none mb-3">
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleContinueTravel}
                className="btn-primary py-1.5 px-5 text-sm">
                Continue on the Trail
              </button>
              <button onClick={handleRest}
                className="bg-trail-parchment border border-trail-tan text-trail-darkBrown px-4 py-1.5 rounded-lg text-sm hover:bg-trail-tan/30 transition-colors">
                Rest
              </button>
              <button onClick={handleFindWater}
                className="bg-trail-parchment border border-trail-tan text-trail-darkBrown px-4 py-1.5 rounded-lg text-sm hover:bg-trail-tan/30 transition-colors">
                Find Water
              </button>
              {state.gradeBand !== 'k2' && state.ammoBoxes > 0 && (
                <button onClick={() => setShowHunting(true)}
                  className="bg-trail-parchment border border-trail-tan text-trail-darkBrown px-4 py-1.5 rounded-lg text-sm hover:bg-trail-tan/30 transition-colors">
                  Hunt
                </button>
              )}
              <button onClick={handleGatherFirewood}
                className="bg-trail-parchment border border-trail-tan text-trail-darkBrown px-4 py-1.5 rounded-lg text-sm hover:bg-trail-tan/30 transition-colors">
                Gather Firewood
              </button>
              {state.partyMembers.some(m => m.alive && m.health === 'critical') && state.prayerCooldownDay < state.trailDay && (
                <button
                  onClick={() => {
                    const criticalMember = state.partyMembers.find(m => m.alive && m.health === 'critical');
                    const prayerGrace = GRACE_DELTAS.PRAYER + (state.hasBible ? STORE_BIBLE.effects.prayerGraceBonus : 0);
                    dispatch({ type: 'UPDATE_GRACE', delta: prayerGrace, trigger: 'prayer_crisis' });
                    dispatch({ type: 'UPDATE_MORALE', delta: 3 });
                    dispatch({ type: 'PRAY', memberName: criticalMember?.name });
                    if (state.chaplainInParty) {
                      setTravelMessage(`Fr. Joseph leads the party in prayer for ${criticalMember?.name}. A sense of calm settles over the group.`);
                    } else {
                      setTravelMessage(`The party prays together for ${criticalMember?.name}. It doesn't change the illness, but it steadies the heart.`);
                    }
                  }}
                  className="bg-trail-gold/20 border border-trail-gold text-trail-darkBrown px-4 py-1.5 rounded-lg text-sm hover:bg-trail-gold/30 transition-colors">
                  Pray
                </button>
              )}
            </div>
          </div>

          {/* Travel Plan + Supplies side by side */}
          <div className="flex gap-4">
            {/* Travel Plan */}
            <div className="flex-1">
              <h3 className="text-[11px] font-bold text-trail-darkBrown uppercase tracking-wider mb-1.5"
                style={{ fontVariant: 'small-caps' }}>Travel Plan</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-trail-brown w-12">Pace:</label>
                  <select value={state.pace}
                    onChange={e => dispatch({ type: 'SET_PACE', pace: e.target.value })}
                    className="flex-1 text-[11px] px-1.5 py-1 border border-trail-tan rounded bg-white max-w-[140px]">
                    <option value="steady">Steady</option>
                    <option value="strenuous">Strenuous</option>
                    <option value="grueling">Grueling</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-trail-brown w-12">Rations:</label>
                  <select value={state.rations}
                    onChange={e => dispatch({ type: 'SET_RATIONS', rations: e.target.value })}
                    className="flex-1 text-[11px] px-1.5 py-1 border border-trail-tan rounded bg-white max-w-[140px]">
                    <option value="filling">Filling</option>
                    <option value="meager">Meager</option>
                    <option value="bare_bones">Bare Bones</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-trail-brown w-12">Water:</label>
                  <select value={state.waterRations}
                    onChange={e => dispatch({ type: 'SET_WATER_RATIONS', waterRations: e.target.value })}
                    className="flex-1 text-[11px] px-1.5 py-1 border border-trail-tan rounded bg-white max-w-[140px]">
                    <option value="full">Full</option>
                    <option value="moderate">Moderate</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-trail-brown w-12">Sleep:</label>
                  <select value={state.sleepSchedule}
                    onChange={e => dispatch({ type: 'SET_SLEEP_SCHEDULE', sleepSchedule: e.target.value })}
                    className="flex-1 text-[11px] px-1.5 py-1 border border-trail-tan rounded bg-white max-w-[140px]">
                    <option value="short">Short (5 hrs)</option>
                    <option value="normal">Normal (7 hrs)</option>
                    <option value="long">Long (9 hrs)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Supplies */}
            <div className="flex-1">
              <h3 className="text-[11px] font-bold text-trail-darkBrown uppercase tracking-wider mb-1.5"
                style={{ fontVariant: 'small-caps' }}>Supplies</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-trail-darkBrown">
                <span className="text-trail-brown">Food:</span>
                <span className={state.foodLbs < 50 ? 'text-red-600 font-bold' : ''}>{Math.round(state.foodLbs)} lbs</span>
                <span className="text-trail-brown">Water:</span>
                <span className={state.waterGallons < 20 ? 'text-red-600 font-bold' : state.waterGallons < 50 ? 'text-orange-600' : ''}>{Math.round(state.waterGallons)} gal</span>
                <span className="text-trail-brown">Firewood:</span>
                <span className={needsFirewood && (state.firewoodBundles || 0) < 2 ? 'text-orange-600 font-semibold' : ''}>{state.firewoodBundles || 0} bundles</span>
                <span className="text-trail-brown">Oxen:</span>
                <span>{state.oxenYokes} yoke</span>
                <span className="text-trail-brown">Ammo:</span>
                <span>{state.ammoBoxes} boxes</span>
                <span className="text-trail-brown">Clothing:</span>
                <span>{state.clothingSets} sets</span>
                <span className="text-trail-brown">Cash:</span>
                <span>${state.cash.toFixed(2)}</span>
                <span className="text-trail-brown">Parts:</span>
                <span>{state.spareParts.wheels}W {state.spareParts.axles}A {state.spareParts.tongues}T</span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          <div className="flex-none mt-2 space-y-0.5">
            {state.foodLbs < 50 && state.foodLbs > 0 && (
              <div className="text-[11px] text-orange-600 font-semibold">⚠ Low on food provisions</div>
            )}
            {state.foodLbs <= 0 && (
              <div className="text-[11px] text-red-600 font-bold">⚠ No food! Your party is starving!</div>
            )}
            {state.waterGallons > 0 && state.waterGallons < 20 && (
              <div className="text-[11px] text-orange-600 font-semibold">⚠ Water supply is low</div>
            )}
            {state.waterGallons <= 0 && (
              <div className="text-[11px] text-red-600 font-bold">⚠ Out of water!</div>
            )}
            {needsFirewood && (state.firewoodBundles || 0) < 2 && (
              <div className="text-[11px] text-orange-600 font-semibold">⚠ Low firewood — cold nights ahead</div>
            )}
            {noFire && (
              <div className="text-[11px] text-red-600 font-bold">⚠ No fire last night — the party suffered from the cold</div>
            )}
            {(state.daysStationary || 0) >= 3 && (
              <div className="text-[11px] text-red-600 font-semibold">⚠ Lingering too long ({state.daysStationary} days idle)</div>
            )}
          </div>

          {state.sessionSettings?.historian_enabled && (
            <button onClick={() => dispatch({ type: 'TOGGLE_HISTORIAN' })}
              className="mt-2 text-[11px] py-1 px-3 bg-trail-tan/20 border border-trail-tan rounded text-trail-darkBrown hover:bg-trail-tan/40 transition-colors">
              Trail Journal
            </button>
          )}
        </div>

        {/* ──── RIGHT: Weather + Family + Daily Log ──── */}
        <div className="w-64 flex-none flex flex-col border-l border-trail-tan/30 bg-trail-parchment/20 overflow-y-auto">

          {/* Weather */}
          <div className="flex-none px-3 py-2 border-b border-trail-tan/30">
            <WeatherBox weather={state.currentWeather} compact={true} />
          </div>

          {/* Your Family — per-member health + morale */}
          <div className="flex-none px-3 py-2 border-b border-trail-tan/30">
            <h3 className="text-[11px] font-bold text-trail-darkBrown uppercase tracking-wider mb-1.5"
              style={{ fontVariant: 'small-caps' }}>Your Family</h3>
            <div className="space-y-1.5">
              {state.partyMembers.map(m => {
                const morale = m.morale ?? 70;
                const canTalk = m.alive && (m.lastTalkedDay || 0) < state.trailDay;
                const needsTalk = m.alive && (morale < 50 || m.health === 'poor' || m.health === 'critical');
                return (
                  <div key={m.name} className={`flex items-center gap-1.5 ${!m.alive ? 'opacity-40' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`text-[11px] font-medium truncate ${!m.alive ? 'line-through text-gray-400' : 'text-trail-darkBrown'}`}>
                          {m.name}
                          {m.isChaplain && <span className="text-trail-gold ml-0.5">†</span>}
                        </span>
                      </div>
                      {m.alive && (
                        <div className="flex items-center gap-2 mt-0.5">
                          {/* Health */}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                            m.health === 'good' ? 'bg-green-100 text-green-700' :
                            m.health === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                            m.health === 'poor' ? 'bg-orange-100 text-orange-700' :
                            m.health === 'critical' ? 'bg-red-100 text-red-700 font-bold animate-pulse' :
                            'bg-gray-100 text-gray-400'
                          }`}>{m.health}</span>
                          {/* Morale */}
                          <span className={`text-[9px] ${getMoraleColor(morale)}`}>
                            {getMoraleIcon(morale)} {morale}%
                          </span>
                        </div>
                      )}
                      {!m.alive && (
                        <span className="text-[9px] text-gray-400">deceased</span>
                      )}
                    </div>
                    {/* Talk button */}
                    {needsTalk && canTalk && (
                      <button
                        onClick={() => handleTalkToMember(m)}
                        className="text-[9px] px-2 py-0.5 bg-trail-tan/30 border border-trail-tan/50 rounded text-trail-brown hover:bg-trail-tan/50 transition-colors whitespace-nowrap"
                        title={`Talk to ${m.name}`}
                      >
                        Talk
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Log */}
          <div className="flex-none px-3 py-2 border-b border-trail-tan/30">
            <h3 className="text-[11px] font-bold text-trail-darkBrown uppercase tracking-wider mb-1"
              style={{ fontVariant: 'small-caps' }}>Daily Log</h3>
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-trail-brown">Miles yesterday:</span>
                <span className="font-semibold text-trail-darkBrown">{state.lastDayMiles || 0} mi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-trail-brown">Total traveled:</span>
                <span className="text-trail-darkBrown">{Math.round(state.distanceTraveled)} / {totalDistance} mi</span>
              </div>
              {nextLandmark && (
                <div className="flex justify-between">
                  <span className="text-trail-brown">To {nextLandmark.name.split(' ').slice(0, 2).join(' ')}:</span>
                  <span className={`font-semibold ${state.distanceToNextLandmark < 30 ? 'text-green-700' : 'text-trail-darkBrown'}`}>
                    {Math.max(0, Math.round(state.distanceToNextLandmark))} mi
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Camp Activities */}
          {state.gradeBand !== 'k2' && (
            <div className="flex-none px-3 py-2">
              <CampActivitiesPanel
                onActivityComplete={(result) => {
                  if (result.timeCost > 0) {
                    dispatch({ type: 'INCREMENT_STATIONARY' });
                    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
                  }
                  setTravelMessage(result.message);
                }}
              />
            </div>
          )}
        </div>

        {/* Historian panel (overlays right side when open) */}
        {state.showHistorian && (
          <div className="w-72 flex-none border-l-2 border-trail-tan/40 bg-trail-parchment/20 overflow-y-auto">
            <HistorianPanel />
          </div>
        )}
      </div>

      {/* ═══ FULL MAP MODAL ═══ */}
      {showFullMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowFullMap(false)}>
          <div className="w-[90vw] h-[80vh] bg-trail-cream rounded-lg shadow-2xl border-2 border-trail-brown overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 bg-trail-darkBrown text-trail-cream">
              <span className="text-sm font-serif tracking-wide">Oregon Trail — 1848</span>
              <button onClick={() => setShowFullMap(false)}
                className="text-trail-cream/80 hover:text-white text-lg px-2">×</button>
            </div>
            <div className="h-[calc(100%-2.5rem)]">
              <OregonTrailMap
                landmarks={landmarks}
                currentIndex={state.currentLandmarkIndex}
                distanceToNext={state.distanceToNextLandmark}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sunday Rest Prompt */}
      {showSundayPrompt && (
        <SundayRestPrompt
          onChoice={handleSundayChoice}
          gameDate={state.gameDate}
          gradeBand={state.gradeBand}
        />
      )}
    </div>
  );
}

function selectRandomEvent(state, eventsData) {
  const validEvents = eventsData.events.filter(e => {
    if (!e.grade_bands.includes(state.gradeBand)) return false;
    if (e.is_cwm) return false;
    if (e.category === 'feast_day') return false;
    return true;
  });

  if (validEvents.length === 0) return null;

  const totalWeight = validEvents.reduce((sum, e) => sum + (e.probability_weight || 1), 0);
  let roll = Math.random() * totalWeight;
  for (const event of validEvents) {
    roll -= (event.probability_weight || 1);
    if (roll <= 0) return event;
  }
  return validEvents[0];
}

/**
 * Select a contextually appropriate trail danger based on terrain, weather,
 * season, and whether the party has been lingering.
 */
function selectTrailDanger(state, weather, landmark) {
  const month = parseInt(state.gameDate?.split('-')[1] || '6', 10);
  const terrainType = landmark?.terrain_type || 'plains';
  const ground = weather?.ground || 'firm';

  const validDangers = trailDangersData.dangers.filter(d => {
    // Terrain filter
    if (d.terrain_types && !d.terrain_types.includes(terrainType)) return false;
    // Season filter
    if (d.season_months && !d.season_months.includes(month)) return false;
    // Weather trigger filter
    if (d.weather_triggers) {
      const weatherMatch = d.weather_triggers.includes(weather?.condition) ||
        d.weather_triggers.includes(ground);
      if (!weatherMatch) return false;
    }
    // Wagon maintenance reduces breakdown chance
    if (d.category === 'mechanical' && state.wagonMaintained && Math.random() < 0.5) return false;
    // Trail guide helps with river crossings
    if (d.id?.includes('river') && state.hasTrailGuide && Math.random() < 0.20) return false;
    // Tool set reduces mechanical breakdown probability
    if (d.category === 'mechanical' && state.hasToolSet && Math.random() < 0.3) return false;
    return true;
  });

  if (validDangers.length === 0) return null;

  // Boost lingering-related dangers if party has been idle
  const adjustedDangers = validDangers.map(d => ({
    ...d,
    adjustedWeight: (d.probability_weight || 1) +
      (d.lingering_boost && (state.daysStationary || 0) >= 2 ? 5 * state.daysStationary : 0)
  }));

  const totalWeight = adjustedDangers.reduce((sum, d) => sum + d.adjustedWeight, 0);
  let roll = Math.random() * totalWeight;
  for (const danger of adjustedDangers) {
    roll -= danger.adjustedWeight;
    if (roll <= 0) return danger;
  }
  return adjustedDangers[0];
}

/**
 * Select a positive encounter, influenced by grace score.
 * Higher grace = better luck, more help from fellow travelers.
 */
function selectPositiveEncounter(state, landmark) {
  const terrainType = landmark?.terrain_type || 'plains';

  const validEncounters = trailDangersData.positive_encounters.filter(e => {
    if (e.terrain_types && !e.terrain_types.includes(terrainType)) return false;
    // Trail guide lowers grace threshold for native encounters (better cultural understanding)
    const effectiveThreshold = (e.grace_threshold && state.hasTrailGuide)
      ? Math.round(e.grace_threshold * (1 - STORE_BOOKS.trail_guide.effects.nativeEncounterBonus))
      : e.grace_threshold;
    if (effectiveThreshold && state.grace < effectiveThreshold) return false;
    return true;
  });

  if (validEncounters.length === 0) return null;

  const totalWeight = validEncounters.reduce((sum, e) => sum + (e.probability_weight || 1), 0);
  let roll = Math.random() * totalWeight;
  for (const encounter of validEncounters) {
    roll -= (encounter.probability_weight || 1);
    if (roll <= 0) return encounter;
  }
  return validEncounters[0];
}
