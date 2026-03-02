import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { GAME_CONSTANTS, PACE_MULTIPLIER, GRACE_DELTAS, GRACE_RANGES, PROFESSION_REPAIR, CHAPLAIN_COSTS, STORE_BOOKS, STORE_BIBLE, SLEEP_SCHEDULE, WATER_RATIONS, WATER_OXEN_MULTIPLIER, getHeatWaterMultiplier, CLERGY_SKILLS } from '@shared/types';
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

/** Health bar color */
function getHealthColor(health) {
  if (health === 'good') return 'bg-green-500';
  if (health === 'fair') return 'bg-yellow-500';
  if (health === 'poor') return 'bg-orange-500';
  if (health === 'critical') return 'bg-red-600';
  return 'bg-gray-400';
}

function getHealthPercent(health) {
  const map = { good: 100, fair: 75, poor: 50, critical: 25, dead: 0 };
  return map[health] ?? 0;
}

/** Supply icons */
const SI = {
  food: '\uD83C\uDF56',
  water: '\uD83D\uDCA7',
  firewood: '\uD83E\uDEB5',
  oxen: '\uD83D\uDC02',
  ammo: '\uD83D\uDCA5',
  clothing: '\uD83E\uDDE5',
  cash: '\uD83D\uDCB0',
  parts: '\u2699',
  medicine: '\uD83D\uDC8A',
};

export default function TravelScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [showSundayPrompt, setShowSundayPrompt] = useState(false);
  const [showHunting, setShowHunting] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [travelMessage, setTravelMessage] = useState('');
  const [showFullMap, setShowFullMap] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const travelTimerRef = useRef(null);
  const skipSundayCheckRef = useRef(false);

  const landmarks = state.gradeBand === 'k2' ? landmarksK2.landmarks : landmarksData.landmarks;
  const currentLandmark = landmarks[state.currentLandmarkIndex];
  const nextLandmark = landmarks[state.currentLandmarkIndex + 1];

  // Initialize distance to next landmark on first render
  useEffect(() => {
    if (state.distanceToNextLandmark === 0 && nextLandmark) {
      dispatch({ type: 'SET_DISTANCE', distance: nextLandmark.distance_from_previous });
    }
  }, [state.distanceToNextLandmark, nextLandmark, dispatch]);

  // ════════════════════════════════════════════════════════════
  //  TRAVEL ONE DAY — core game loop
  // ════════════════════════════════════════════════════════════
  const travelOneDay = useCallback(() => {
    if (state.isPaused || !nextLandmark) return;

    if (isSunday(state.gameDate) && !skipSundayCheckRef.current) {
      setShowSundayPrompt(true);
      return;
    }
    skipSundayCheckRef.current = false;

    if (isAfter(state.gameDate, GAME_CONSTANTS.END_DATE)) {
      dispatch({ type: 'SET_STATUS', status: 'failed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
      return;
    }

    const aliveAtStart = state.partyMembers.filter(m => m.alive);
    if (aliveAtStart.length === 0) {
      dispatch({ type: 'SET_STATUS', status: 'failed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
      return;
    }

    if (state.oxenYokes < 1) {
      setTravelMessage('You have no oxen. You cannot move until you acquire more.');
      return;
    }

    let dayMessage = '';
    const aliveCount = aliveAtStart.length;
    const rateMap = { filling: 3, meager: 2, bare_bones: 1 };
    const preCheckTemp = state.currentWeather?.temperature?.current ?? 65;
    let dailyConsumption = aliveCount * (rateMap[state.rations] || 2);
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
        if (newHealth === 'dead') deaths.push(m.name);
        else starvationUpdates.push({ name: m.name, health: newHealth });
      });
      if (starvationUpdates.length > 0) dispatch({ type: 'UPDATE_PARTY_HEALTH', updates: starvationUpdates });
      deaths.forEach(name => dispatch({ type: 'PARTY_MEMBER_DIES', name, cause: 'starvation' }));
      dayMessage = deaths.length > 0 ? `${deaths.join(' and ')} died of starvation.` : 'Your party is starving! Find food soon.';
    }

    const starvationDeaths = new Set();
    if (foodAfterToday <= 0) {
      aliveAtStart.forEach(m => {
        const idx = ['good', 'fair', 'poor', 'critical', 'dead'].indexOf(m.health);
        if (idx >= 3) starvationDeaths.add(m.name);
      });
    }
    const aliveAfterStarvation = aliveAtStart.filter(m => !starvationDeaths.has(m.name));
    if (aliveAfterStarvation.length === 0) {
      dispatch({ type: 'SET_STATUS', status: 'failed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
      return;
    }

    // Generate weather
    const terrainType = currentLandmark?.terrain_type || 'plains';
    const todayWeather = generateWeather(state.gameDate, terrainType, state.recentWeather || []);
    dispatch({ type: 'SET_WEATHER', weather: todayWeather });

    if (todayWeather.moraleModifier && todayWeather.moraleModifier < 0) {
      dispatch({ type: 'UPDATE_MORALE', delta: Math.round(todayWeather.moraleModifier / 2) });
    }

    // Water dehydration
    const waterRate = (WATER_RATIONS[state.waterRations] || WATER_RATIONS.full).perPerson;
    const heatMult = getHeatWaterMultiplier(todayWeather.temperature?.current ?? 65);
    const waterAfterToday = Math.max(0, state.waterGallons - ((aliveCount * waterRate + state.oxenYokes * waterRate * WATER_OXEN_MULTIPLIER) * heatMult));
    if (waterAfterToday <= 0 && state.waterGallons > 0) {
      dayMessage = 'Your water barrels are empty! The party and oxen suffer from thirst.';
      dispatch({ type: 'UPDATE_MORALE', delta: -8 });
    } else if (state.waterGallons <= 0) {
      const victim = aliveAfterStarvation[Math.floor(Math.random() * aliveAfterStarvation.length)];
      if (victim && victim.health !== 'critical') {
        const hOrder = ['good', 'fair', 'poor', 'critical'];
        const idx = hOrder.indexOf(victim.health);
        if (idx < 3) {
          dispatch({ type: 'UPDATE_PARTY_HEALTH', updates: [{ name: victim.name, health: hOrder[idx + 1] }] });
          dayMessage = `${victim.name} is suffering from dehydration. You must find water soon.`;
        }
      }
      dispatch({ type: 'UPDATE_MORALE', delta: -5 });
    }

    // Minimal water health penalty
    const waterHealthMod = (WATER_RATIONS[state.waterRations] || WATER_RATIONS.full).healthModifier || 0;
    if (waterHealthMod > 0 && state.waterGallons > 0 && Math.random() < waterHealthMod) {
      const thirsty = aliveAfterStarvation.find(m => m.health !== 'critical' && m.health !== 'dead' && m.health !== 'good');
      if (thirsty) {
        const hOrder = ['good', 'fair', 'poor', 'critical'];
        const idx = hOrder.indexOf(thirsty.health);
        if (idx < 3) {
          dispatch({ type: 'UPDATE_PARTY_HEALTH', updates: [{ name: thirsty.name, health: hOrder[idx + 1] }] });
          if (!dayMessage) dayMessage = `${thirsty.name} is weakened from insufficient water.`;
        }
      }
    }

    // Auto-refill at river
    if (terrainType === 'river' && state.waterGallons < 200) {
      dispatch({ type: 'REFILL_WATER', capacity: 200 });
    }

    // Chaplain oxen strain
    if (state.chaplainInParty && Math.random() < CHAPLAIN_COSTS.oxenStrainChance) {
      if (state.oxenYokes > 1) {
        dispatch({ type: 'UPDATE_SUPPLIES', oxenYokes: state.oxenYokes - 1 });
        dayMessage = dayMessage || 'One of the oxen has gone lame under the heavy load.';
      }
    }

    // Calculate daily miles
    const baseMiles = GAME_CONSTANTS.BASE_DAILY_MILES;
    const paceMult = PACE_MULTIPLIER[state.pace] || 1.0;
    const sleepMult = (SLEEP_SCHEDULE[state.sleepSchedule] || SLEEP_SCHEDULE.normal).travelBonus;
    let rawMiles = Math.round(baseMiles * paceMult * sleepMult);
    rawMiles = applyWeatherToTravel(rawMiles, todayWeather);

    const sleepConfig = SLEEP_SCHEDULE[state.sleepSchedule] || SLEEP_SCHEDULE.normal;
    if (sleepConfig.moraleModifier !== 0) dispatch({ type: 'UPDATE_MORALE', delta: sleepConfig.moraleModifier });
    if (sleepConfig.healthRecovery < 0 && Math.random() < Math.abs(sleepConfig.healthRecovery)) {
      const tired = aliveAfterStarvation.find(m => m.health !== 'critical' && m.health !== 'dead' && m.health !== 'good');
      if (tired) dispatch({ type: 'UPDATE_MORALE', delta: -1 });
    }

    if (state.oxenChecked) rawMiles = Math.round(rawMiles * 1.05);
    if (state.grace >= 75) rawMiles = Math.round(rawMiles * 1.05);
    else if (state.grace < 15) rawMiles = Math.round(rawMiles * 0.92);
    if (state.hasTrailGuide) rawMiles = Math.round(rawMiles * (1 + STORE_BOOKS.trail_guide.effects.travelBonus));
    if (state.waterGallons <= 0) rawMiles = Math.round(rawMiles * 0.7);

    // Clergy scout bonus
    const clergyMember = state.partyMembers.find(m => m.isChaplain && m.alive);
    if (clergyMember?.clergySkill === 'scout') rawMiles = Math.round(rawMiles * 1.03);

    const dailyMiles = Math.max(0, rawMiles);
    dispatch({ type: 'RESET_DAILY_BONUSES' });
    dispatch({ type: 'RESET_STATIONARY' });

    // Terrain-adaptive difficulty
    const hazardMult = currentLandmark?.hazard_multiplier ?? 1.0;
    const terrainDifficulty = {
      plains:    { eventMod: 0.06, dangerMod: -0.03, illnessMod: 0,     encounterMod: 0.04 },
      hills:     { eventMod: 0,    dangerMod: 0,     illnessMod: 0.02,  encounterMod: 0 },
      mountains: { eventMod: -0.06, dangerMod: 0.06,  illnessMod: 0.04,  encounterMod: -0.02 },
      river:     { eventMod: -0.03, dangerMod: 0.04,  illnessMod: 0.03,  encounterMod: 0.01 },
    }[terrainType] || { eventMod: 0, dangerMod: 0, illnessMod: 0, encounterMod: 0 };

    const weatherDifficultyMod = todayWeather.difficultyScore >= 5 ? 0.05 : todayWeather.difficultyScore >= 3 ? 0.02 : 0;

    // Random event check
    const eventRoll = Math.random();
    const baseEventThreshold = state.gradeBand === 'k2' ? 0.80 : 0.72;
    const eventThreshold = Math.min(0.92, Math.max(0.55, baseEventThreshold + terrainDifficulty.eventMod - weatherDifficultyMod));
    if (eventRoll > eventThreshold) {
      const event = selectRandomEvent(state, eventsData);
      if (event) { dispatch({ type: 'SET_EVENT', event }); return; }
    }

    // Trail danger check
    const dangerRoll = Math.random();
    let dangerChance = (0.08 + terrainDifficulty.dangerMod + weatherDifficultyMod) * hazardMult;
    if (state.daysStationary >= 2) dangerChance += 0.05 * state.daysStationary;
    if (state.grace < 15) dangerChance += 0.05;
    else if (state.grace >= 75) dangerChance -= 0.03;
    if (state.chaplainInParty) dangerChance += CHAPLAIN_COSTS.wagonFragilityBonus;
    if (state.gameDate > '1848-09-15') dangerChance += 0.03;
    if (state.gameDate > '1848-11-01') dangerChance += 0.05;
    if (state.hasTrailGuide && Math.random() < STORE_BOOKS.trail_guide.effects.dangerAvoidance) dangerChance = 0;
    if (clergyMember?.clergySkill === 'scout') dangerChance *= (1 - CLERGY_SKILLS.scout.dangerReduction);

    if (dangerRoll < dangerChance) {
      const danger = selectTrailDanger(state, todayWeather, currentLandmark);
      if (danger && !dayMessage) {
        dispatch({ type: 'LOG_DANGER', danger });
        dayMessage = danger.description;
        if (danger.effects?.morale) dispatch({ type: 'UPDATE_MORALE', delta: danger.effects.morale });
        if (danger.effects?.food_loss) dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: Math.max(0, state.foodLbs - danger.effects.food_loss) });
        if (danger.effects?.cash_loss) dispatch({ type: 'UPDATE_SUPPLIES', cash: Math.max(0, state.cash - danger.effects.cash_loss) });
        if (danger.effects?.oxen_lost) dispatch({ type: 'UPDATE_SUPPLIES', oxenYokes: Math.max(0, state.oxenYokes - danger.effects.oxen_lost) });
        if (danger.effects?.clothing_loss) dispatch({ type: 'UPDATE_SUPPLIES', clothingSets: Math.max(0, state.clothingSets - danger.effects.clothing_loss) });

        // Item loss from dangers
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
            const lossVerbs = danger.id?.includes('thief') || danger.category === 'theft' ? 'was stolen' : danger.id?.includes('river') || danger.category === 'river_crossing' ? 'was lost in the crossing' : 'was destroyed';
            dayMessage += ` ${itemNames[lostItem]} ${lossVerbs}.`;
          }
        }
        if (danger.choices) { dispatch({ type: 'SET_EVENT', event: { ...danger, type: danger.id, title: danger.name } }); return; }
      }
    }

    // Positive encounter check
    const goodRoll = Math.random();
    let goodChance = 0.05 + terrainDifficulty.encounterMod;
    if (state.grace >= 75) goodChance += 0.08;
    else if (state.grace >= 40) goodChance += 0.02;
    if (state.distanceTraveled < 500) goodChance += 0.03;

    if (goodRoll < goodChance && !dayMessage) {
      const encounter = selectPositiveEncounter(state, currentLandmark);
      if (encounter) {
        if (encounter.effects?.morale) dispatch({ type: 'UPDATE_MORALE', delta: encounter.effects.morale });
        if (encounter.effects?.food_gain) dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: state.foodLbs + encounter.effects.food_gain });
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
        if (encounter.choices) { dispatch({ type: 'SET_EVENT', event: { ...encounter, type: encounter.id, title: encounter.name } }); return; }
        dayMessage = encounter.description;
        dispatch({ type: 'RESOLVE_EVENT', eventType: 'positive_encounter', outcome: encounter.name, description: encounter.description });
      }
    }

    // Illness check
    const illnessRoll = Math.random();
    let illnessChance = 0.06 + terrainDifficulty.illnessMod;
    if (state.pace === 'grueling') illnessChance += 0.08;
    if (state.pace === 'strenuous') illnessChance += 0.03;
    if (state.rations === 'bare_bones') illnessChance += 0.06;
    if (state.rations === 'meager') illnessChance += 0.02;
    if (state.pace === 'grueling' && state.rations === 'bare_bones') illnessChance += 0.15;
    if (state.gameDate > '1848-10-01') illnessChance += 0.05;
    if (todayWeather.condition === 'heavy_rain' || todayWeather.condition === 'blizzard') illnessChance += 0.06;
    else if (todayWeather.condition === 'rain' || todayWeather.condition === 'snow') illnessChance += 0.03;
    if (todayWeather.temperature?.current < 32) illnessChance += 0.04;
    if (todayWeather.temperature?.current < 40 && state.clothingSets < aliveAfterStarvation.length) illnessChance += 0.05;
    if (state.illnessPreventionBonus) illnessChance -= state.illnessPreventionBonus;
    if (state.hasFarmersAlmanac) illnessChance -= STORE_BOOKS.farmers_almanac.effects.illnessReduction;
    if (clergyMember?.clergySkill === 'doctor') illnessChance *= (1 - CLERGY_SKILLS.doctor.illnessReduction);

    if (illnessRoll < illnessChance && aliveAfterStarvation.length > 0) {
      const victim = aliveAfterStarvation[Math.floor(Math.random() * aliveAfterStarvation.length)];
      if (victim.health !== 'critical') {
        const illnesses = ['cholera', 'dysentery', 'typhoid', 'exhaustion', 'measles'];
        const illness = illnesses[Math.floor(Math.random() * illnesses.length)];
        const hOrder = ['good', 'fair', 'poor', 'critical'];
        const idx = hOrder.indexOf(victim.health);
        const newHealth = idx < 3 ? hOrder[idx + 1] : 'critical';
        dispatch({ type: 'UPDATE_PARTY_HEALTH', updates: [{ name: victim.name, health: newHealth, illness }] });
        dispatch({ type: 'RESOLVE_EVENT', eventType: 'illness', outcome: `${victim.name} has ${illness}`, description: `${victim.name} has come down with ${illness}. Their condition is ${newHealth}.` });
        dayMessage = `${victim.name} has come down with ${illness}!`;
      }
    }

    // Trail wear (weekly)
    if (state.trailDay % 7 === 0) {
      const healthyMembers = aliveAfterStarvation.filter(m => m.health === 'good' || m.health === 'fair');
      if (healthyMembers.length > 0) {
        let wearChance = 0.15 * hazardMult;
        if (terrainType === 'mountains') wearChance += 0.08;
        else if (terrainType === 'plains') wearChance -= 0.05;
        if (state.pace === 'grueling') wearChance += 0.20;
        if (state.pace === 'strenuous') wearChance += 0.08;
        if (state.rations === 'bare_bones') wearChance += 0.12;
        if (state.rations === 'meager') wearChance += 0.05;
        healthyMembers.forEach(m => {
          if (Math.random() < wearChance) {
            const hOrder = ['good', 'fair', 'poor', 'critical'];
            const idx = hOrder.indexOf(m.health);
            const newHealth = idx < 3 ? hOrder[idx + 1] : 'critical';
            dispatch({ type: 'UPDATE_PARTY_HEALTH', updates: [{ name: m.name, health: newHealth }] });
            if (!dayMessage) {
              const msgs = [`${m.name} is showing signs of exhaustion.`, `${m.name} has been weakened by the relentless travel.`, `The trail is taking its toll on ${m.name}.`];
              dayMessage = msgs[Math.floor(Math.random() * msgs.length)];
            }
          }
        });
      }
    }

    // Morale decay
    if (state.trailDay % 5 === 0) {
      dispatch({ type: 'UPDATE_MORALE', delta: state.pace === 'grueling' ? -5 : state.pace === 'strenuous' ? -3 : -1 });
    }

    // Death check for critical members
    const chaplainAlive = state.chaplainInParty && aliveAfterStarvation.some(m => m.isChaplain);
    aliveAfterStarvation.filter(m => m.health === 'critical' && !m.isChaplain).forEach(m => {
      const deathChance = state.rations === 'filling' ? 0.20 : state.rations === 'meager' ? 0.30 : 0.50;
      if (Math.random() < deathChance) {
        if (chaplainAlive && !state.lastRitesFired) {
          dispatch({ type: 'LAST_RITES' });
          dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.LAST_RITES, trigger: 'last_rites' });
          dispatch({ type: 'UPDATE_MORALE', delta: Math.round(-15 * GAME_CONSTANTS.LAST_RITES_MORALE_REDUCTION) });
          dayMessage = `Fr. Joseph administered Last Rites to ${m.name}. ${m.name} died of ${m.illness || 'exhaustion'}, but the party found peace in the sacrament.`;
        } else {
          dispatch({ type: 'UPDATE_MORALE', delta: -15 });
          dayMessage = `${m.name} has died of ${m.illness || 'exhaustion'}.`;
        }
        dispatch({ type: 'PARTY_MEMBER_DIES', name: m.name, cause: m.illness || 'exhaustion' });
      }
    });

    // Grueling pace grace penalty
    if (state.pace === 'grueling') {
      const sick = aliveAfterStarvation.filter(m => m.health === 'poor' || m.health === 'critical');
      if (sick.length > 0) dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.GRUELING_SICK, trigger: 'grueling_while_sick' });
    }

    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: dailyMiles });

    // Landmark arrival check
    const newDistToNext = state.distanceToNextLandmark - dailyMiles;
    if (newDistToNext <= 0 && nextLandmark) {
      const newIdx = state.currentLandmarkIndex + 1;
      dispatch({ type: 'ARRIVE_LANDMARK', landmarkIndex: newIdx, distanceToNext: landmarks[newIdx + 1] ? landmarks[newIdx + 1].distance_from_previous : 0, totalLandmarks: landmarks.length });
      const lType = nextLandmark.type;
      if (lType === 'fort' || lType === 'mission' || lType === 'town' || nextLandmark.terrain_type === 'river') dispatch({ type: 'REFILL_WATER', capacity: 200 });
      if (lType === 'mission' && !state.hasBible && Math.random() < 0.4) {
        dispatch({ type: 'LOAD_STATE', savedState: { hasBible: true } });
        setTravelMessage(`You have arrived at ${nextLandmark.name}! The missionaries gifted your family a Bible.`);
        return;
      }
      setTravelMessage(`You have arrived at ${nextLandmark.name}!`);
      return;
    }

    // Feast day check
    const nextDate = addDays(state.gameDate, 1);
    const feastDays = {
      '1848-08-15': { id: 'assumption', name: 'Feast of the Assumption', text: 'Today is the Feast of the Assumption of the Blessed Virgin Mary.' },
      '1848-11-01': { id: 'all_saints', name: "All Saints' Day", text: "Today is All Saints' Day. The faithful remember those who have gone before." },
      '1848-11-02': { id: 'all_souls', name: "All Souls' Day", text: "Today is All Souls' Day. A time to remember and pray for the dead." }
    };
    const feast = feastDays[nextDate];
    if (feast && !state.feastDaysEncountered.includes(feast.id)) {
      dispatch({ type: 'FEAST_DAY', feastDay: feast.id });
      dayMessage = feast.text;
    }

    if (!dayMessage) {
      if (todayWeather.difficultyScore >= 3) {
        dayMessage = todayWeather.description;
      } else {
        dayMessage = getFlavorMessage(currentLandmark?.terrain_type || 'plains', state, state.trailDay);
        if (todayWeather.conditionLabel && todayWeather.conditionLabel !== 'Fair' && todayWeather.conditionLabel !== 'Sunny') {
          dayMessage += ` The weather: ${todayWeather.conditionLabel.toLowerCase()}, ${todayWeather.temperature?.current || '--'}\u00B0F.`;
        }
      }
    }
    setTravelMessage(dayMessage);
  }, [state, dispatch, nextLandmark, landmarks]);

  // ════════════════════════════════════════════════════════════
  //  ACTION HANDLERS
  // ════════════════════════════════════════════════════════════

  function handleSundayChoice(rested) {
    setShowSundayPrompt(false);
    dispatch({ type: 'SUNDAY_REST', rested });
    if (rested) {
      const sundayGrace = GRACE_DELTAS.SUNDAY_REST + (state.hasBible ? STORE_BIBLE.effects.sundayRestGraceBonus : 0);
      dispatch({ type: 'UPDATE_GRACE', delta: sundayGrace, trigger: 'sunday_rest' });
      dispatch({ type: 'UPDATE_MORALE', delta: 5 + (state.hasBible ? STORE_BIBLE.effects.restMoraleBonus : 0) });
      const healthUpdates = state.partyMembers.filter(m => m.alive && m.health !== 'good').map(m => {
        const order = ['dead', 'critical', 'poor', 'fair', 'good'];
        const idx = order.indexOf(m.health);
        return { name: m.name, health: idx < 4 ? order[idx + 1] : m.health };
      });
      if (healthUpdates.length > 0) dispatch({ type: 'UPDATE_PARTY_HEALTH', updates: healthUpdates });
      setTravelMessage(healthUpdates.length > 0 ? 'Your party rested on the Sabbath. The sick are improving.' : 'Your party rested on the Sabbath. Everyone feels refreshed.');
      dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
    } else {
      skipSundayCheckRef.current = true;
      travelOneDay();
    }
  }

  function handleContinueTravel() { setTravelMessage(''); travelOneDay(); }

  function handleRest() {
    if (isAfter(state.gameDate, GAME_CONSTANTS.END_DATE)) { dispatch({ type: 'SET_STATUS', status: 'failed' }); dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' }); return; }
    const alive = state.partyMembers.filter(m => m.alive);
    if (alive.length === 0) { dispatch({ type: 'SET_STATUS', status: 'failed' }); dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' }); return; }
    trackAction('rest');
    dispatch({ type: 'INCREMENT_STATIONARY' });
    const terrainType = currentLandmark?.terrain_type || 'plains';
    dispatch({ type: 'SET_WEATHER', weather: generateWeather(state.gameDate, terrainType, state.recentWeather || []) });
    const updates = state.partyMembers.filter(m => m.alive && m.health !== 'good').map(m => {
      const order = ['dead', 'critical', 'poor', 'fair', 'good'];
      const idx = order.indexOf(m.health);
      return { name: m.name, health: idx < 4 ? order[idx + 1] : m.health };
    });
    if (updates.length > 0) dispatch({ type: 'UPDATE_PARTY_HEALTH', updates });
    if (state.hasBible) dispatch({ type: 'UPDATE_MORALE', delta: Math.round(STORE_BIBLE.effects.restMoraleBonus / 2) });
    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
    const sd = (state.daysStationary || 0) + 1;
    setTravelMessage(sd >= 3 ? 'Your party rested, but lingering too long draws danger.' : `Your party rested for a day. The sick feel a little better.${state.hasBible ? ' Scripture brings comfort.' : ''}`);
  }

  function handleFindWater() {
    if (isAfter(state.gameDate, GAME_CONSTANTS.END_DATE)) { dispatch({ type: 'SET_STATUS', status: 'failed' }); dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' }); return; }
    trackAction('find_water');
    dispatch({ type: 'INCREMENT_STATIONARY' });
    const terrainType = currentLandmark?.terrain_type || 'plains';
    dispatch({ type: 'SET_WEATHER', weather: generateWeather(state.gameDate, terrainType, state.recentWeather || []) });
    let successChance = 0.55;
    if (terrainType === 'river' || terrainType === 'riverbank') successChance = 0.95;
    else if (terrainType === 'plains') successChance = 0.45;
    else if (terrainType === 'mountains') successChance = 0.35;
    if (state.hasTrailGuide) successChance = Math.min(0.95, successChance + 0.15);
    const clergy = state.partyMembers.find(m => m.isChaplain && m.alive);
    if (clergy?.clergySkill === 'scout') successChance = Math.min(0.95, successChance + CLERGY_SKILLS.scout.waterFindBonus);
    if (Math.random() < successChance) {
      const baseRefill = terrainType === 'river' ? 120 : terrainType === 'plains' ? 60 : 40;
      const amt = Math.round(baseRefill * (0.7 + Math.random() * 0.6));
      dispatch({ type: 'REFILL_WATER', amount: amt, capacity: 200 });
      setTravelMessage(`Found ${terrainType === 'river' ? 'a stream' : 'a spring'}! Refilled ${amt} gallons.`);
    } else {
      setTravelMessage('Searched all day but found no water.');
      dispatch({ type: 'UPDATE_MORALE', delta: -3 });
    }
    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
  }

  function handleTalkToMember(member) {
    dispatch({ type: 'TALK_TO_MEMBER', name: member.name });
    trackAction('talk_to_member');
    const morale = member.morale ?? 70;
    const h = member.health;
    let d;
    if (h === 'critical') d = `${member.name} looks up weakly. "Please pray for me."`;
    else if (h === 'poor') d = `${member.name} winces. "Maybe we should rest."`;
    else if (morale < 25) d = [`${member.name} stares at the horizon. "Why did we leave?"`, `${member.name} is barely holding on.`][Math.floor(Math.random() * 2)];
    else if (morale < 50) d = [`${member.name} sighs. "Will we ever get there?"`, `${member.name}: "I'm hungry and tired."`][Math.floor(Math.random() * 2)];
    else if (morale < 75) d = `${member.name} nods. "We'll make it together."`;
    else d = `${member.name} grins. "What an adventure!"`;
    setTravelMessage(d);
  }

  function handleGatherFirewood() {
    trackAction('gather_firewood');
    dispatch({ type: 'INCREMENT_STATIONARY' });
    const terrainType = currentLandmark?.terrain_type || 'plains';
    dispatch({ type: 'SET_WEATHER', weather: generateWeather(state.gameDate, terrainType, state.recentWeather || []) });
    let y = terrainType === 'mountains' ? 5 : terrainType === 'river' || terrainType === 'hills' ? 4 : 2;
    y = Math.max(1, y + Math.floor(Math.random() * 3) - 1);
    dispatch({ type: 'UPDATE_SUPPLIES', firewoodBundles: (state.firewoodBundles || 0) + y });
    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
    setTravelMessage(`Collected ${y} bundles of firewood.`);
  }

  function handleHuntingComplete(foodGained, bisonKilled = 0) {
    setShowHunting(false);
    if (foodGained > 0) {
      dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: state.foodLbs + foodGained });
      if (bisonKilled >= 3) {
        dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.OVERHUNT, trigger: 'overhunt_bison' });
        dispatch({ type: 'DEPLETE_BISON', amount: bisonKilled * 15 });
        setTravelMessage(`Brought back ${foodGained} lbs, but you overhunted. The herd suffers.`);
      } else {
        if (bisonKilled > 0) dispatch({ type: 'DEPLETE_BISON', amount: bisonKilled * 10 });
        setTravelMessage(`Hunted ${foodGained} lbs of food!`);
      }
    } else {
      setTravelMessage('The hunt was unsuccessful.');
    }
    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
  }

  function handleUseMedicine(name) {
    dispatch({ type: 'USE_MEDICINE', name });
    setTravelMessage(`Administered medicine to ${name}.`);
  }

  // ════════════════════════════════════════════════════════════
  //  COMPUTED VALUES
  // ════════════════════════════════════════════════════════════
  const totalDistance = landmarks.reduce((sum, l) => sum + (l.distance_from_previous || 0), 0);
  const progressPercent = Math.min(100, (state.distanceTraveled / totalDistance) * 100);

  if (showHunting) return <HuntingMinigame onComplete={handleHuntingComplete} ammo={state.ammoBoxes} bisonPopulation={state.bisonPopulation} />;

  const terrainType = currentLandmark?.terrain_type || 'plains';
  const upcomingLandmarks = [];
  if (currentLandmark) upcomingLandmarks.push({ ...currentLandmark, index: state.currentLandmarkIndex });
  if (nextLandmark) upcomingLandmarks.push({ ...nextLandmark, index: state.currentLandmarkIndex + 1 });
  const thirdLm = landmarks[state.currentLandmarkIndex + 2];
  if (thirdLm) upcomingLandmarks.push({ ...thirdLm, index: state.currentLandmarkIndex + 2 });

  const currentTemp = state.currentWeather?.temperature?.current ?? 65;
  const needsFirewood = currentTemp < 50;
  const noFire = state.noFireLastNight;

  // Contextual status
  const hints = [];
  if (currentTemp < 32) hints.push('Bitter cold');
  else if (currentTemp > 95) hints.push('Scorching heat');
  if (state.morale < 25) hints.push('Spirits very low');
  else if (state.morale < 50) hints.push('Party is weary');
  if (state.foodLbs > 0 && state.foodLbs < 50) hints.push('Food running low');
  if (state.waterGallons > 0 && state.waterGallons < 20) hints.push('Water scarce');
  if (state.daysStationary >= 3) hints.push('Lingering too long');
  const contextHint = hints.length > 0 ? hints.join(' \u2022 ') : null;

  const chaplainMember = state.partyMembers.find(m => m.isChaplain && m.alive);
  const chaplainSkillInfo = chaplainMember?.clergySkill ? CLERGY_SKILLS[chaplainMember.clergySkill] : null;

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-trail-cream" style={{ fontFamily: "'Lora', Georgia, serif" }}>

      {/* ═══ TOP BAR ═══ */}
      <div className="flex-none flex items-center justify-between px-4 py-1 bg-trail-darkBrown text-trail-cream" style={{ minHeight: '30px' }}>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-sm tracking-wide" style={{ fontVariant: 'small-caps' }}>The Long Way Home</span>
          <span className="text-trail-tan/40">|</span>
          <span>{formatGameDate(state.gameDate)}</span>
          <span className="text-trail-tan/40">|</span>
          <span>Day {state.trailDay}</span>
          {contextHint && (<><span className="text-trail-tan/40">|</span><span className="text-orange-300 text-[10px]">{contextHint}</span></>)}
        </div>
        <div className="flex items-center gap-3">
          {chaplainSkillInfo && <span className="text-[10px] text-trail-tan/60" title={chaplainSkillInfo.description}>Fr. Joseph: {chaplainSkillInfo.name}</span>}
          <span className="text-[10px] text-trail-tan/60">Grace:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-2 bg-trail-brown/50 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${getGraceColor(state.grace)}`} style={{ width: `${state.grace}%` }} />
            </div>
            <span className={`text-[11px] font-semibold ${state.grace >= 75 ? 'text-yellow-300' : state.grace >= 40 ? 'text-trail-tan' : state.grace >= 15 ? 'text-orange-400' : 'text-red-400'}`}>{state.grace}</span>
          </div>
        </div>
      </div>

      {/* ═══ MAIN: Scene (2/3) + Info Panel (1/3) ═══ */}
      <div className="flex-none flex" style={{ height: '38vh', minHeight: '200px', maxHeight: '300px' }}>
        {/* Terrain Scene */}
        <div className="relative" style={{ width: '66.666%' }}>
          <TerrainScene terrainType={terrainType} landmarkName={currentLandmark?.name} weather={state.currentWeather} partyMembers={state.partyMembers} />
          {/* Mini-map overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-1.5">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowFullMap(true)}>
              <div className="flex-1 flex items-center gap-1">
                {upcomingLandmarks.map((lm, i) => {
                  const isCur = lm.index === state.currentLandmarkIndex;
                  return (<div key={lm.id || i} className="flex items-center">
                    {i > 0 && <div className="w-8 h-0.5 bg-white/30 mx-0.5" />}
                    <div className="flex flex-col items-center">
                      <div className={`rounded-full ${isCur ? 'w-2.5 h-2.5 bg-trail-gold border border-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
                      <span className={`text-[8px] mt-0.5 whitespace-nowrap ${isCur ? 'text-white font-bold' : 'text-white/50'}`}>{lm.name?.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                  </div>);
                })}
                <div className="w-6 h-0.5 bg-white/20 mx-0.5" /><span className="text-[8px] text-white/30">...</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-trail-gold/80 rounded-full" style={{ width: `${progressPercent}%` }} /></div>
                <span className="text-[8px] text-white/50">{Math.round(progressPercent)}%</span>
              </div>
              <span className="text-[8px] text-white/40 hover:text-white/70">Map \u2192</span>
            </div>
          </div>
        </div>

        {/* Weather + Daily Log */}
        <div className="flex flex-col border-l border-trail-tan/30 bg-trail-parchment/30" style={{ width: '33.334%' }}>
          <div className="flex-none px-3 py-1.5 border-b border-trail-tan/20">
            <WeatherBox weather={state.currentWeather} compact={true} />
          </div>
          <div className="flex-1 px-3 py-1.5 overflow-hidden">
            <h3 className="text-[10px] font-bold text-trail-darkBrown uppercase tracking-wider mb-1" style={{ fontVariant: 'small-caps' }}>Daily Log</h3>
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between"><span className="text-trail-brown">Miles yesterday:</span><span className="font-semibold text-trail-darkBrown">{state.lastDayMiles || 0} mi</span></div>
              <div className="flex justify-between"><span className="text-trail-brown">Total:</span><span className="text-trail-darkBrown">{Math.round(state.distanceTraveled)} / {totalDistance} mi</span></div>
              {nextLandmark && <div className="flex justify-between"><span className="text-trail-brown">Next stop:</span><span className={`font-semibold ${state.distanceToNextLandmark < 30 ? 'text-green-700' : 'text-trail-darkBrown'}`}>{Math.max(0, Math.round(state.distanceToNextLandmark))} mi</span></div>}
              <div className="flex justify-between"><span className="text-trail-brown">Pace:</span><span className="text-trail-darkBrown capitalize">{state.pace}</span></div>
            </div>
            {/* Inline warnings */}
            <div className="mt-1 space-y-0.5">
              {state.foodLbs <= 0 && <div className="text-[10px] text-red-600 font-bold">\u26A0 No food!</div>}
              {state.foodLbs > 0 && state.foodLbs < 50 && <div className="text-[10px] text-orange-600">\u26A0 Low food</div>}
              {state.waterGallons <= 0 && <div className="text-[10px] text-red-600 font-bold">\u26A0 Out of water!</div>}
              {state.waterGallons > 0 && state.waterGallons < 20 && <div className="text-[10px] text-orange-600">\u26A0 Low water</div>}
              {needsFirewood && (state.firewoodBundles || 0) < 2 && <div className="text-[10px] text-orange-600">\u26A0 Low firewood</div>}
              {noFire && <div className="text-[10px] text-red-600">\u26A0 No fire last night</div>}
              {(state.daysStationary || 0) >= 3 && <div className="text-[10px] text-red-600">\u26A0 {state.daysStationary}d idle</div>}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ NARRATIVE ═══ */}
      {travelMessage && (
        <div className="flex-none px-4 py-1.5 bg-trail-parchment/60 border-y border-trail-tan/30">
          <p className="text-center text-[13px] text-trail-darkBrown italic leading-snug">&ldquo;{travelMessage}&rdquo;</p>
        </div>
      )}

      {/* ═══ BOTTOM DASHBOARD ═══ */}
      <div className="flex-1 flex min-h-0 border-t border-trail-tan/20">
        {/* COL 1: Actions */}
        <div className="flex flex-col gap-1 px-2.5 py-2 border-r border-trail-tan/20" style={{ width: '130px', flexShrink: 0 }}>
          <h3 className="text-[9px] font-bold text-trail-darkBrown uppercase tracking-widest mb-0.5" style={{ fontVariant: 'small-caps' }}>Actions</h3>
          <button onClick={handleContinueTravel} className="w-full text-left text-[11px] py-1.5 px-2 bg-trail-brown text-white rounded font-semibold hover:bg-trail-darkBrown transition-colors">{'\u25B6'} Continue</button>
          <button onClick={handleRest} className="w-full text-left text-[11px] py-1 px-2 bg-trail-parchment border border-trail-tan/50 rounded text-trail-darkBrown hover:bg-trail-tan/30 transition-colors">{SI.food.charAt(0) === '\uD83C' ? '\uD83D\uDECF' : '\uD83D\uDECF'} Rest</button>
          <button onClick={handleFindWater} className="w-full text-left text-[11px] py-1 px-2 bg-trail-parchment border border-trail-tan/50 rounded text-trail-darkBrown hover:bg-trail-tan/30 transition-colors">{SI.water} Water</button>
          {state.gradeBand !== 'k2' && state.ammoBoxes > 0 && <button onClick={() => setShowHunting(true)} className="w-full text-left text-[11px] py-1 px-2 bg-trail-parchment border border-trail-tan/50 rounded text-trail-darkBrown hover:bg-trail-tan/30 transition-colors">{'\uD83C\uDFF9'} Hunt</button>}
          <button onClick={handleGatherFirewood} className="w-full text-left text-[11px] py-1 px-2 bg-trail-parchment border border-trail-tan/50 rounded text-trail-darkBrown hover:bg-trail-tan/30 transition-colors">{SI.firewood} Wood</button>
          {state.partyMembers.some(m => m.alive && m.health === 'critical') && state.prayerCooldownDay < state.trailDay && (
            <button onClick={() => {
              const cm = state.partyMembers.find(m => m.alive && m.health === 'critical');
              dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.PRAYER + (state.hasBible ? STORE_BIBLE.effects.prayerGraceBonus : 0), trigger: 'prayer_crisis' });
              dispatch({ type: 'UPDATE_MORALE', delta: 3 });
              dispatch({ type: 'PRAY', memberName: cm?.name });
              setTravelMessage(state.chaplainInParty ? `Fr. Joseph leads prayer for ${cm?.name}.` : `The party prays for ${cm?.name}.`);
            }} className="w-full text-left text-[11px] py-1 px-2 bg-trail-gold/20 border border-trail-gold/50 rounded text-trail-darkBrown hover:bg-trail-gold/30 transition-colors">{'\uD83D\uDE4F'} Pray</button>
          )}
          {state.gradeBand !== 'k2' && <button onClick={() => setShowActivities(!showActivities)} className="w-full text-left text-[10px] py-1 px-2 bg-trail-tan/15 border border-trail-tan/30 rounded text-trail-brown hover:bg-trail-tan/30 transition-colors mt-auto">{showActivities ? '\u25BC' : '\u25B6'} Activities</button>}
          {state.sessionSettings?.historian_enabled && <button onClick={() => dispatch({ type: 'TOGGLE_HISTORIAN' })} className="w-full text-left text-[10px] py-1 px-2 bg-trail-tan/15 border border-trail-tan/30 rounded text-trail-brown hover:bg-trail-tan/30 transition-colors">{'\uD83D\uDCD6'} Journal</button>}
        </div>

        {/* COL 2: Travel Plan + Activities */}
        <div className="flex flex-col px-2.5 py-2 border-r border-trail-tan/20" style={{ width: '155px', flexShrink: 0 }}>
          <h3 className="text-[9px] font-bold text-trail-darkBrown uppercase tracking-widest mb-1" style={{ fontVariant: 'small-caps' }}>Travel Plan</h3>
          <div className="space-y-1">
            {[
              { label: 'Pace', value: state.pace, action: 'SET_PACE', key: 'pace', opts: [['steady','Steady'],['strenuous','Strenuous'],['grueling','Grueling']] },
              { label: 'Rations', value: state.rations, action: 'SET_RATIONS', key: 'rations', opts: [['filling','Filling'],['meager','Meager'],['bare_bones','Bare Bones']] },
              { label: 'Water', value: state.waterRations, action: 'SET_WATER_RATIONS', key: 'waterRations', opts: [['full','Full'],['moderate','Moderate'],['minimal','Minimal']] },
              { label: 'Sleep', value: state.sleepSchedule, action: 'SET_SLEEP_SCHEDULE', key: 'sleepSchedule', opts: [['short','Short'],['normal','Normal'],['long','Long']] },
            ].map(s => (
              <div key={s.key} className="flex items-center gap-1.5">
                <label className="text-[10px] text-trail-brown w-10">{s.label}:</label>
                <select value={s.value} onChange={e => dispatch({ type: s.action, [s.key]: e.target.value })} className="flex-1 text-[10px] px-1 py-0.5 border border-trail-tan/50 rounded bg-white">
                  {s.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>
          {showActivities && state.gradeBand !== 'k2' && (
            <div className="mt-2 flex-1 min-h-0">
              <CampActivitiesPanel onActivityComplete={r => { if (r.timeCost > 0) { dispatch({ type: 'INCREMENT_STATIONARY' }); dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 }); } setTravelMessage(r.message); setShowActivities(false); }} />
            </div>
          )}
        </div>

        {/* COL 3: Supplies */}
        <div className="flex flex-col px-2.5 py-2 border-r border-trail-tan/20" style={{ width: '155px', flexShrink: 0 }}>
          <h3 className="text-[9px] font-bold text-trail-darkBrown uppercase tracking-widest mb-1" style={{ fontVariant: 'small-caps' }}>Supplies</h3>
          <div className="space-y-0.5">
            {[
              { icon: SI.food, label: 'Food', value: `${Math.round(state.foodLbs)} lbs`, warn: state.foodLbs < 50, crit: state.foodLbs <= 0 },
              { icon: SI.water, label: 'Water', value: `${Math.round(state.waterGallons)} gal`, warn: state.waterGallons < 50, crit: state.waterGallons <= 0 },
              { icon: SI.firewood, label: 'Wood', value: `${state.firewoodBundles || 0} bndl`, warn: needsFirewood && (state.firewoodBundles || 0) < 2 },
              { icon: SI.oxen, label: 'Oxen', value: `${state.oxenYokes} yoke`, crit: state.oxenYokes < 1 },
              { icon: SI.ammo, label: 'Ammo', value: `${state.ammoBoxes} box` },
              { icon: SI.clothing, label: 'Clothes', value: `${state.clothingSets} sets` },
              { icon: SI.medicine, label: 'Meds', value: `${state.medicineDoses || 0} doses`, warn: (state.medicineDoses || 0) < 2 },
              { icon: SI.cash, label: 'Cash', value: `$${state.cash.toFixed(0)}` },
              { icon: SI.parts, label: 'Parts', value: `${state.spareParts.wheels}W ${state.spareParts.axles}A ${state.spareParts.tongues}T` },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-[12px] w-4 text-center">{item.icon}</span>
                <span className="text-[10px] text-trail-brown w-9 truncate">{item.label}</span>
                <span className={`text-[10px] font-medium flex-1 text-right ${item.crit ? 'text-red-600 font-bold' : item.warn ? 'text-orange-600 font-semibold' : 'text-trail-darkBrown'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* COL 4: Party */}
        <div className="flex-1 flex flex-col px-2.5 py-2 min-w-0 overflow-hidden">
          <h3 className="text-[9px] font-bold text-trail-darkBrown uppercase tracking-widest mb-1" style={{ fontVariant: 'small-caps' }}>Your Family</h3>
          <div className="space-y-1.5">
            {state.partyMembers.map(m => {
              const morale = m.morale ?? 70;
              const canTalk = m.alive && (m.lastTalkedDay || 0) < state.trailDay;
              const needsTalk = m.alive && (morale < 50 || m.health === 'poor' || m.health === 'critical');
              const canMed = m.alive && m.health !== 'good' && (state.medicineDoses || 0) > 0;
              return (
                <div key={m.name} className={!m.alive ? 'opacity-30' : ''}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`text-[11px] font-medium truncate ${!m.alive ? 'line-through text-gray-400' : 'text-trail-darkBrown'}`}>
                      {m.name}{m.isChaplain && <span className="text-trail-gold ml-0.5">{'\u2020'}</span>}
                    </span>
                    {m.alive && m.age && <span className="text-[8px] text-trail-brown/50">{m.gender === 'female' ? 'F' : 'M'},{m.age}</span>}
                    <span className="flex-1" />
                    {needsTalk && canTalk && <button onClick={() => handleTalkToMember(m)} className="text-[8px] px-1.5 py-0.5 bg-trail-tan/30 border border-trail-tan/50 rounded text-trail-brown hover:bg-trail-tan/50">Talk</button>}
                    {canMed && <button onClick={() => handleUseMedicine(m.name)} className="text-[8px] px-1.5 py-0.5 bg-green-50 border border-green-300 rounded text-green-700 hover:bg-green-100">{SI.medicine}</button>}
                  </div>
                  {m.alive && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-[8px] text-trail-brown w-5">HP</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-300 ${getHealthColor(m.health)}`} style={{ width: `${getHealthPercent(m.health)}%` }} /></div>
                        <span className={`text-[8px] w-9 text-right font-medium ${m.health === 'good' ? 'text-green-600' : m.health === 'fair' ? 'text-yellow-600' : m.health === 'poor' ? 'text-orange-600' : 'text-red-600'}`}>{m.health}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-[8px] w-3">{morale >= 75 ? '\uD83D\uDE0A' : morale >= 50 ? '\uD83D\uDE10' : morale >= 25 ? '\uD83D\uDE1F' : '\uD83D\uDE22'}</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-300 ${morale >= 75 ? 'bg-green-500' : morale >= 50 ? 'bg-yellow-500' : morale >= 25 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${morale}%` }} /></div>
                        <span className={`text-[8px] w-6 text-right ${morale >= 75 ? 'text-green-600' : morale >= 50 ? 'text-yellow-600' : morale >= 25 ? 'text-orange-600' : 'text-red-600'}`}>{morale}%</span>
                      </div>
                    </div>
                  )}
                  {!m.alive && <span className="text-[9px] text-gray-400 italic">deceased{m.causeOfDeath ? ` \u2014 ${m.causeOfDeath}` : ''}</span>}
                  {m.illness && m.alive && <span className="text-[9px] text-red-600 italic">{m.illness}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Historian overlay */}
        {state.showHistorian && <div className="w-72 flex-none border-l-2 border-trail-tan/40 bg-trail-parchment/20 overflow-hidden"><HistorianPanel /></div>}
      </div>

      {/* ═══ FULL MAP MODAL ═══ */}
      {showFullMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowFullMap(false)}>
          <div className="w-[90vw] h-[80vh] bg-trail-cream rounded-lg shadow-2xl border-2 border-trail-brown overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 bg-trail-darkBrown text-trail-cream">
              <span className="text-sm font-serif tracking-wide">Oregon Trail \u2014 1848</span>
              <button onClick={() => setShowFullMap(false)} className="text-trail-cream/80 hover:text-white text-lg px-2">{'\u00D7'}</button>
            </div>
            <div className="h-[calc(100%-2.5rem)]"><OregonTrailMap landmarks={landmarks} currentIndex={state.currentLandmarkIndex} distanceToNext={state.distanceToNextLandmark} /></div>
          </div>
        </div>
      )}

      {showSundayPrompt && <SundayRestPrompt onChoice={handleSundayChoice} gameDate={state.gameDate} gradeBand={state.gradeBand} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  SELECTION HELPERS
// ════════════════════════════════════════════════════════════

function selectRandomEvent(state, eventsData) {
  const valid = eventsData.events.filter(e => e.grade_bands.includes(state.gradeBand) && !e.is_cwm && e.category !== 'feast_day');
  if (valid.length === 0) return null;
  const tw = valid.reduce((s, e) => s + (e.probability_weight || 1), 0);
  let r = Math.random() * tw;
  for (const e of valid) { r -= (e.probability_weight || 1); if (r <= 0) return e; }
  return valid[0];
}

function selectTrailDanger(state, weather, landmark) {
  const month = parseInt(state.gameDate?.split('-')[1] || '6', 10);
  const tt = landmark?.terrain_type || 'plains';
  const ground = weather?.ground || 'firm';
  const valid = trailDangersData.dangers.filter(d => {
    if (d.terrain_types && !d.terrain_types.includes(tt)) return false;
    if (d.season_months && !d.season_months.includes(month)) return false;
    if (d.weather_triggers && !d.weather_triggers.includes(weather?.condition) && !d.weather_triggers.includes(ground)) return false;
    if (d.category === 'mechanical' && state.wagonMaintained && Math.random() < 0.5) return false;
    if (d.id?.includes('river') && state.hasTrailGuide && Math.random() < 0.20) return false;
    if (d.category === 'mechanical' && state.hasToolSet && Math.random() < 0.3) return false;
    return true;
  });
  if (valid.length === 0) return null;
  const adj = valid.map(d => ({ ...d, aw: (d.probability_weight || 1) + (d.lingering_boost && (state.daysStationary || 0) >= 2 ? 5 * state.daysStationary : 0) }));
  const tw = adj.reduce((s, d) => s + d.aw, 0);
  let r = Math.random() * tw;
  for (const d of adj) { r -= d.aw; if (r <= 0) return d; }
  return adj[0];
}

function selectPositiveEncounter(state, landmark) {
  const tt = landmark?.terrain_type || 'plains';
  const valid = trailDangersData.positive_encounters.filter(e => {
    if (e.terrain_types && !e.terrain_types.includes(tt)) return false;
    const threshold = (e.grace_threshold && state.hasTrailGuide) ? Math.round(e.grace_threshold * (1 - STORE_BOOKS.trail_guide.effects.nativeEncounterBonus)) : e.grace_threshold;
    if (threshold && state.grace < threshold) return false;
    return true;
  });
  if (valid.length === 0) return null;
  const tw = valid.reduce((s, e) => s + (e.probability_weight || 1), 0);
  let r = Math.random() * tw;
  for (const e of valid) { r -= (e.probability_weight || 1); if (r <= 0) return e; }
  return valid[0];
}
