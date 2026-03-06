import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { GAME_CONSTANTS, PACE_MULTIPLIER, GRACE_DELTAS, GRACE_RANGES, PROFESSION_REPAIR, CHAPLAIN_COSTS, STORE_BOOKS, STORE_BIBLE, SLEEP_SCHEDULE, WATER_RATIONS, WATER_OXEN_MULTIPLIER, getHeatWaterMultiplier, CLERGY_SKILLS } from '@shared/types';
import { formatGameDate, isSunday, addDays, isAfter } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';
import { logCrash, trackAction } from '../../utils/crashLogger';
import OregonTrailMap from './shared/OregonTrailMap';
import HistorianPanel from './shared/HistorianPanel';
import KnowledgePanel from './shared/KnowledgePanel';
import SundayRestPrompt from './shared/SundayRestPrompt';
import HuntingMinigame from './shared/HuntingMinigame';
import CampActivitiesPanel from './shared/CampActivitiesPanel';
import TrailSceneCSS from './shared/TrailSceneCSS';
import TrailProgressBar from './shared/TrailProgressBar';
import CharacterFace from './shared/CharacterFace';
import { useWindowWidth } from '../../hooks/useWindowWidth';

// Game systems
import { generateWeather, applyWeatherToTravel } from '../../game/weather';
import trailDangersData from '../../data/trail-dangers.json';

// Landmarks data (loaded dynamically based on grade band)
import landmarksData from '../../data/landmarks.json';
import landmarksK2 from '../../data/landmarks-k2.json';
import eventsData from '../../data/events.json';
import { getFlavorMessage } from '../../data/trail-flavor';

/** Grace pip color */
function getGracePipColor(grace) {
  if (grace > 70) return 'var(--gold)';
  if (grace > 40) return '#9aaa6a';
  return 'var(--red)';
}

/** Health bar hex color */
function getHealthBarColor(health) {
  if (health === 'good') return 'var(--green)';
  if (health === 'fair') return 'var(--amber)';
  if (health === 'poor') return 'var(--amber)';
  if (health === 'critical') return 'var(--red)';
  return '#888';
}

function getHealthPercent(health) {
  const map = { good: 100, fair: 75, poor: 50, critical: 25, dead: 0 };
  return map[health] ?? 0;
}

/** Weather emoji + label */
function getWeatherDisplay(weather) {
  if (!weather) return { icon: '☀️', label: 'Sunny', temp: '--' };
  const c = weather.condition || 'fair';
  const temp = weather.temperature?.current ?? '--';
  if (c.includes('blizzard') || c.includes('storm') || c === 'stormy') return { icon: '⛈️', label: 'Stormy', temp };
  if (c.includes('rain') || c === 'rainy') return { icon: '🌧️', label: 'Rainy', temp };
  if (c.includes('snow')) return { icon: '🌨️', label: 'Snow', temp };
  return { icon: '☀️', label: 'Sunny', temp };
}

/** Determine narrative event type for panel border color */
function classifyMessage(msg) {
  if (!msg) return 'encounter';
  const m = msg.toLowerCase();
  if (m.includes('died') || m.includes('starvation') || m.includes('dehydration') || m.includes('critical') || m.includes('broken') || m.includes('stolen') || m.includes('destroyed') || m.includes('lame') || m.includes('illness') || m.includes('cholera') || m.includes('dysentery') || m.includes('typhoid')) return 'crisis';
  if (m.includes('rested') || m.includes('found') || m.includes('refill') || m.includes('better') || m.includes('refreshed') || m.includes('hunted') || m.includes('collected') || m.includes('gifted') || m.includes('bible')) return 'blessing';
  if (m.includes('arrived') || m.includes('pray') || m.includes('sacrament') || m.includes('last rites')) return 'moral';
  return 'encounter';
}

const EVENT_BORDER = { crisis: 'var(--red)', blessing: 'var(--green)', encounter: 'var(--blue)', moral: 'var(--amber)' };
const EVENT_BG = { crisis: 'rgba(185,64,64,0.05)', blessing: 'rgba(74,124,89,0.05)', encounter: 'rgba(74,104,144,0.05)', moral: 'rgba(194,135,58,0.05)' };

const TONE_COLORS = { action: '#b94040', rest: '#4a7c59', moral: '#5a7aaa', faith: '#c2a84f' };

export default function TravelScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const bp = useWindowWidth();
  const [showSundayPrompt, setShowSundayPrompt] = useState(false);
  const [showHunting, setShowHunting] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [travelMessage, setTravelMessage] = useState('');
  const [showFullMap, setShowFullMap] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [isTraveling, setIsTraveling] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
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
          dayMessage += ` The weather: ${todayWeather.conditionLabel.toLowerCase()}, ${todayWeather.temperature?.current || '--'}°F.`;
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

  function handleContinueTravel() {
    setTravelMessage('');
    setSelectedChoice(null);
    setIsTraveling(true);
    setTimeout(() => { setIsTraveling(false); travelOneDay(); }, 3500);
  }

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
  const contextHint = hints.length > 0 ? hints.join(' • ') : null;

  const chaplainMember = state.partyMembers.find(m => m.isChaplain && m.alive);
  const chaplainSkillInfo = chaplainMember?.clergySkill ? CLERGY_SKILLS[chaplainMember.clergySkill] : null;

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════

  const isDesktop = bp === 'bp-desktop';
  const isMobile = bp === 'bp-mobile';
  const weatherDisplay = getWeatherDisplay(state.currentWeather);
  const eventType = classifyMessage(travelMessage);
  const faceSize = isMobile ? 40 : 48;

  // Build choices
  const choices = [];
  choices.push({ id: 'continue', emoji: '▶️', label: 'Push Forward', sub: `${state.pace} pace • ~${Math.round(GAME_CONSTANTS.BASE_DAILY_MILES * (PACE_MULTIPLIER[state.pace] || 1))} mi/day`, tone: 'action', handler: handleContinueTravel, disabled: isTraveling });
  choices.push({ id: 'rest', emoji: '🛏️', label: 'Rest for a Day', sub: 'Recover health, no miles traveled', tone: 'rest', handler: handleRest });
  choices.push({ id: 'water', emoji: '💧', label: 'Find Water', sub: `Current: ${Math.round(state.waterGallons)} gal`, tone: 'rest', handler: handleFindWater });
  if (state.gradeBand !== 'k2' && state.ammoBoxes > 0) {
    choices.push({ id: 'hunt', emoji: '🏹', label: 'Hunt for Food', sub: `${state.ammoBoxes} ammo boxes remaining`, tone: 'action', handler: () => setShowHunting(true) });
  }
  choices.push({ id: 'wood', emoji: '🪵', label: 'Gather Firewood', sub: `${state.firewoodBundles || 0} bundles in stock`, tone: 'rest', handler: handleGatherFirewood });
  if (state.partyMembers.some(m => m.alive && m.health === 'critical') && state.prayerCooldownDay < state.trailDay) {
    const cm = state.partyMembers.find(m => m.alive && m.health === 'critical');
    choices.push({ id: 'pray', emoji: '🙏', label: 'Pray', sub: cm ? `Pray for ${cm.name}` : 'Offer prayers for the sick', tone: 'faith', handler: () => {
      const critMember = state.partyMembers.find(m2 => m2.alive && m2.health === 'critical');
      dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.PRAYER + (state.hasBible ? STORE_BIBLE.effects.prayerGraceBonus : 0), trigger: 'prayer_crisis' });
      dispatch({ type: 'UPDATE_MORALE', delta: 3 });
      dispatch({ type: 'PRAY', memberName: critMember?.name });
      setTravelMessage(state.chaplainInParty ? `Fr. Joseph leads prayer for ${critMember?.name}.` : `The party prays for ${critMember?.name}.`);
    }});
  }

  // Resource items for the bar
  const resources = [
    { icon: '🌾', label: 'Food', value: `${Math.round(state.foodLbs)} lbs`, warn: state.foodLbs < 50 || state.foodLbs <= 0 },
    { icon: '💰', label: 'Cash', value: `$${state.cash.toFixed(0)}` },
    { icon: '🔫', label: 'Ammo', value: `${state.ammoBoxes}`, warn: state.ammoBoxes <= 0 },
    { icon: '🔧', label: 'Spares', value: `${state.spareParts.wheels + state.spareParts.axles + state.spareParts.tongues}` },
    { icon: '💊', label: 'Medicine', value: `${state.medicineDoses || 0}`, warn: (state.medicineDoses || 0) < 2 },
    { icon: '🐂', label: 'Oxen', value: `${state.oxenYokes}`, warn: state.oxenYokes < 1 },
  ];

  return (
    <div className={`game-root ${bp}`}>

      {/* ═══ HEADER BAR ═══ */}
      <header style={{
        height: 'var(--hdr-h)', flexShrink: 0,
        background: 'var(--hdr)', borderBottom: '2px solid var(--amber-dk)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', color: 'var(--parchment)',
      }}>
        {/* Left — Title */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold)', fontSize: 'clamp(13px, 1.8vw, 18px)', whiteSpace: 'nowrap' }}>
            The Long Way Home
          </span>
          {!isMobile && (
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'rgba(245,234,216,0.5)' }}>
              Oregon Trail, 1848
            </span>
          )}
        </div>

        {/* Center — Chips + Weather */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Chip>📅 {formatGameDate(state.gameDate)}</Chip>
          {!isMobile && <Chip>Day {state.trailDay}</Chip>}
          {isDesktop && <Chip style={{ textTransform: 'capitalize' }}>{state.pace} Pace</Chip>}
          <Chip>
            <span style={{ fontSize: '14px' }}>{weatherDisplay.icon}</span>
            <span>{weatherDisplay.label} {weatherDisplay.temp}°F</span>
          </Chip>
        </div>

        {/* Right — Grace Meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontSize: '16px' }}>✝</span>
          {!isMobile && <span style={{ fontSize: '12px', color: 'rgba(245,234,216,0.6)' }}>Grace</span>}
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            {Array.from({ length: isMobile ? 5 : 10 }, (_, i) => {
              const threshold = isMobile ? (i + 1) * 20 : (i + 1) * 10;
              const filled = state.grace >= threshold;
              return (
                <div key={i} style={{
                  width: '12px', height: '6px', borderRadius: '2px',
                  background: filled ? getGracePipColor(state.grace) : 'rgba(255,255,255,0.12)',
                  transition: 'background 0.3s',
                }} />
              );
            })}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: getGracePipColor(state.grace), minWidth: '20px', textAlign: 'right' }}>
            {state.grace}
          </span>
        </div>
      </header>

      {/* ═══ RESOURCE BAR ═══ */}
      <div style={{
        height: 'var(--res-h)', flexShrink: 0,
        background: 'var(--parch-dark)', borderBottom: '1px solid var(--border)',
        display: 'flex',
      }}>
        {resources.map((r, i) => (
          <div key={i} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            borderRight: i < resources.length - 1 ? '1px solid var(--border)' : 'none',
            padding: '0 4px', overflow: 'hidden',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{r.icon}</span>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: 'clamp(14px, 1.4vw, 16px)', fontWeight: 700, color: r.warn ? 'var(--red)' : 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.value}
              </div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ink-lt)', opacity: 0.7, whiteSpace: 'nowrap' }}>
                {r.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ MAIN CONTENT: Scene + Panel ═══ */}
      <div style={{
        flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden',
        flexDirection: isDesktop ? 'row' : 'column',
      }}>

        {/* SCENE COLUMN */}
        <div style={{
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          ...(isDesktop
            ? { width: '44%', flexShrink: 0 }
            : { height: isMobile ? '30%' : '38%', flexShrink: 0 }),
        }}>
          {/* Trail Scene */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }} onClick={() => setShowFullMap(true)}>
            <TrailSceneCSS weather={state.currentWeather} isTraveling={isTraveling} />
          </div>
          {/* Trail Progress Bar */}
          <TrailProgressBar
            landmarks={landmarks}
            currentIndex={state.currentLandmarkIndex}
            distanceTraveled={state.distanceTraveled}
            distanceToNext={state.distanceToNextLandmark}
            bp={bp}
          />
        </div>

        {/* PANEL COLUMN */}
        <div style={{
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderLeft: isDesktop ? '1px solid var(--border)' : 'none',
          borderTop: !isDesktop ? '1px solid var(--border)' : 'none',
        }}>

          {/* Event Panel (flex: 3) */}
          <div style={{
            flex: 3, minHeight: 0, overflow: 'hidden',
            borderLeft: `4px solid ${EVENT_BORDER[eventType]}`,
            background: EVENT_BG[eventType],
            padding: '10px 14px',
            display: 'flex', flexDirection: 'column', gap: '4px',
          }}>
            <span className="eyebrow">⚡ What Just Happened</span>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 'clamp(18px, 2vw, 24px)', color: 'var(--ink)',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              margin: 0,
            }}>
              {travelMessage ? travelMessage.split('.')[0] : 'The trail awaits…'}
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 'clamp(14px, 1.4vw, 16px)',
              lineHeight: 1.5, color: 'var(--ink-lt)',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              margin: 0,
            }}>
              {travelMessage || 'Choose an action below to continue your journey west.'}
            </p>
            {travelMessage && (
              <span style={{
                alignSelf: 'flex-start', borderRadius: '20px', padding: '3px 12px',
                background: EVENT_BORDER[eventType], color: 'white',
                fontSize: '13px', fontWeight: 600,
                fontFamily: 'var(--font-body)',
              }}>
                {eventType === 'crisis' ? 'Hardship' : eventType === 'blessing' ? 'Blessing' : eventType === 'moral' ? 'Grace' : 'Journey'}
              </span>
            )}
          </div>

          {/* Party Section (flex-shrink: 0) */}
          <div style={{ flexShrink: 0, padding: '6px 14px 0', overflow: 'hidden' }}>
            <span className="eyebrow">👨‍👩‍👧‍👦 Your Party</span>
            <div style={{
              display: 'grid', gap: '5px', marginTop: '5px',
              gridTemplateColumns: isDesktop ? '1fr 1fr' : `repeat(${Math.min(4, state.partyMembers.length)}, 1fr)`,
            }}>
              {state.partyMembers.map(m => {
                const morale = m.morale ?? 70;
                const hPct = getHealthPercent(m.health);
                const isDead = !m.alive || m.health === 'dead';
                const isSick = m.health === 'poor' || m.illness;
                const isCritical = m.health === 'critical';
                const canMed = m.alive && m.health !== 'good' && (state.medicineDoses || 0) > 0;
                return (
                  <div key={m.name} style={{
                    background: 'rgba(255,252,245,0.85)',
                    border: `1px solid ${isCritical ? 'var(--red)' : isSick ? 'var(--amber)' : 'var(--border)'}`,
                    borderRadius: '7px', padding: '6px 8px',
                    opacity: isDead ? 0.45 : 1, filter: isDead ? 'grayscale(0.8)' : 'none',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    cursor: m.alive ? 'pointer' : 'default',
                  }}
                    onClick={() => m.alive && (m.lastTalkedDay || 0) < state.trailDay && handleTalkToMember(m)}
                  >
                    <CharacterFace member={m} size={faceSize} />
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: 'clamp(14px, 1.3vw, 16px)', fontWeight: 700, color: 'var(--ink)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {m.name}{m.isChaplain ? ' †' : ''}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-lt)', opacity: 0.65 }}>
                        {m.isChaplain ? 'Chaplain' : m.isPlayer ? 'Leader' : m.gender === 'female' ? 'Woman' : 'Man'}
                        {m.illness && m.alive ? ` • ${m.illness}` : ''}
                      </div>
                      {m.alive && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <div style={{ flex: 1, height: '4px', background: 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '2px', transition: 'width 0.4s',
                              width: `${hPct}%`, background: getHealthBarColor(m.health),
                            }} />
                          </div>
                          <span style={{
                            fontSize: '12px', fontWeight: 600,
                            color: getHealthBarColor(m.health), whiteSpace: 'nowrap',
                          }}>
                            {isDead ? 'Dead' : m.health.charAt(0).toUpperCase() + m.health.slice(1)}
                          </span>
                          {canMed && (
                            <button onClick={e => { e.stopPropagation(); handleUseMedicine(m.name); }} style={{
                              fontSize: '10px', padding: '1px 4px', borderRadius: '4px',
                              background: 'rgba(74,124,89,0.1)', border: '1px solid var(--green)',
                              color: 'var(--green)', cursor: 'pointer', lineHeight: 1,
                            }}>
                              💊
                            </button>
                          )}
                        </div>
                      )}
                      {isDead && <span style={{ fontSize: '10px', color: '#888', fontStyle: 'italic' }}>Deceased{m.causeOfDeath ? ` — ${m.causeOfDeath}` : ''}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Choices Section (flex: 4) */}
          <div style={{
            flex: 4, minHeight: 0, display: 'flex', flexDirection: 'column',
            padding: '0 14px 10px', borderTop: '1px solid var(--border)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '6px 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="eyebrow">🧭 What will you do?</span>
              {selectedChoice && (
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--amber-dk)' }}>
                  → {selectedChoice}
                </span>
              )}
              {/* Travel plan controls (compact) */}
              {state.gradeBand !== 'k2' && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select value={state.pace} onChange={e => dispatch({ type: 'SET_PACE', pace: e.target.value })}
                    style={{ fontSize: '13px', padding: '3px 6px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white', fontFamily: 'var(--font-body)' }}>
                    <option value="steady">Steady</option>
                    <option value="strenuous">Strenuous</option>
                    <option value="grueling">Grueling</option>
                  </select>
                  <select value={state.rations} onChange={e => dispatch({ type: 'SET_RATIONS', rations: e.target.value })}
                    style={{ fontSize: '13px', padding: '3px 6px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white', fontFamily: 'var(--font-body)' }}>
                    <option value="filling">Filling</option>
                    <option value="meager">Meager</option>
                    <option value="bare_bones">Bare Bones</option>
                  </select>
                </div>
              )}
            </div>

            {/* Choice Buttons */}
            <div style={{
              flex: 1, minHeight: 0, display: 'flex',
              flexDirection: (isMobile || !isDesktop) ? 'row' : 'column',
              flexWrap: (isMobile || !isDesktop) ? 'wrap' : 'nowrap',
              gap: '5px',
            }}>
              {choices.map(c => {
                const isSelected = selectedChoice === c.label;
                const accent = TONE_COLORS[c.tone] || TONE_COLORS.action;
                return (
                  <button key={c.id} onClick={() => { setSelectedChoice(c.label); c.handler(); }}
                    disabled={c.disabled}
                    style={{
                      flex: (isMobile || !isDesktop) ? '1 1 calc(50% - 3px)' : 1,
                      minHeight: 0,
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: '8px', cursor: c.disabled ? 'wait' : 'pointer',
                      border: `1.5px solid ${isSelected ? accent : 'rgba(120,80,40,0.22)'}`,
                      background: isSelected ? `${accent}14` : 'rgba(255,250,242,0.9)',
                      boxShadow: isSelected ? `0 0 0 2px ${accent}28` : 'none',
                      transform: isSelected ? 'translateX(3px)' : 'none',
                      transition: 'all 0.12s ease',
                      textAlign: 'left', fontFamily: 'var(--font-body)',
                      opacity: c.disabled ? 0.5 : 1,
                    }}
                  >
                    <span style={{ fontSize: 'clamp(18px, 2vw, 22px)', flexShrink: 0 }}>{c.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: 'clamp(15px, 1.5vw, 18px)', fontWeight: 700, color: 'var(--ink)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {c.label}
                      </div>
                      {isDesktop && c.sub && (
                        <div style={{
                          fontSize: 'clamp(12px, 1.1vw, 14px)', color: 'var(--ink-lt)', opacity: 0.75,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {c.sub}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '20px', color: accent, flexShrink: 0 }}>›</span>
                  </button>
                );
              })}
            </div>

            {/* Secondary actions row */}
            <div style={{ flexShrink: 0, display: 'flex', gap: '6px', marginTop: '4px', justifyContent: 'flex-end' }}>
              {state.gradeBand !== 'k2' && (
                <button onClick={() => setShowActivities(!showActivities)} style={{
                  fontSize: '13px', padding: '5px 12px', borderRadius: '6px',
                  border: '1px solid var(--border)', background: 'rgba(255,250,242,0.8)',
                  color: 'var(--ink-lt)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>
                  ⚙️ Activities
                </button>
              )}
              {state.sessionSettings?.historian_enabled && (
                <button onClick={() => dispatch({ type: 'TOGGLE_HISTORIAN' })} style={{
                  fontSize: '13px', padding: '5px 12px', borderRadius: '6px',
                  border: '1px solid var(--border)', background: 'rgba(255,250,242,0.8)',
                  color: 'var(--ink-lt)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>
                  📖 Journal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODALS / OVERLAYS ═══ */}

      {/* Activities overlay */}
      {showActivities && state.gradeBand !== 'k2' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={() => setShowActivities(false)}>
          <div className="w-[400px] max-h-[70vh] overflow-auto bg-white rounded-lg shadow-2xl border-2 border-trail-tan p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-game-ink">Camp Activities</h3>
              <button onClick={() => setShowActivities(false)} className="text-lg px-2">×</button>
            </div>
            <CampActivitiesPanel onActivityComplete={r => { if (r.timeCost > 0) { dispatch({ type: 'INCREMENT_STATIONARY' }); dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 }); } setTravelMessage(r.message); setShowActivities(false); }} />
          </div>
        </div>
      )}

      {/* Full Map Modal */}
      {showFullMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowFullMap(false)}>
          <div className="w-[90vw] h-[80vh] bg-white rounded-lg shadow-2xl border-2 overflow-hidden" style={{ borderColor: 'var(--amber)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2" style={{ background: 'var(--hdr)', color: 'var(--parchment)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Oregon Trail — 1848</span>
              <button onClick={() => setShowFullMap(false)} className="hover:text-white text-lg px-2" style={{ color: 'rgba(245,234,216,0.8)' }}>×</button>
            </div>
            <div className="h-[calc(100%-2.5rem)]"><OregonTrailMap landmarks={landmarks} currentIndex={state.currentLandmarkIndex} distanceToNext={state.distanceToNextLandmark} /></div>
          </div>
        </div>
      )}

      {/* Historian overlay */}
      {state.showHistorian && (
        <div className="fixed inset-0 z-40 flex items-end justify-end">
          <div className="w-80 h-full bg-white border-l-2 shadow-2xl overflow-hidden" style={{ borderColor: 'var(--amber)' }}>
            <HistorianPanel />
          </div>
        </div>
      )}

      {showSundayPrompt && <SundayRestPrompt onChoice={handleSundayChoice} gameDate={state.gameDate} gradeBand={state.gradeBand} />}
    </div>
  );
}

/** Header chip pill */
function Chip({ children, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      borderRadius: '20px', padding: '4px 12px',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.12)',
      fontSize: '13px', color: 'rgba(245,234,216,0.9)',
      whiteSpace: 'nowrap', fontFamily: 'var(--font-body)',
      ...style,
    }}>
      {children}
    </span>
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
