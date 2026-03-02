import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { GAME_CONSTANTS, PACE_MULTIPLIER, GRACE_DELTAS, GRACE_RANGES } from '@shared/types';
import { formatGameDate, isSunday, addDays, isAfter } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';
import OregonTrailMap from './shared/OregonTrailMap';
import TerrainScene from './shared/TerrainScene';
import PartyStatus from './shared/PartyStatus';
import HistorianPanel from './shared/HistorianPanel';
import KnowledgePanel from './shared/KnowledgePanel';
import SundayRestPrompt from './shared/SundayRestPrompt';
import HuntingMinigame from './shared/HuntingMinigame';

// Landmarks data (loaded dynamically based on grade band)
import landmarksData from '../../data/landmarks.json';
import landmarksK2 from '../../data/landmarks-k2.json';
import eventsData from '../../data/events.json';

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

    // Calculate food after today's consumption (mirrors ADVANCE_DAY reducer)
    const aliveCount = aliveAtStart.length;
    const rateMap = { filling: 3, meager: 2, bare_bones: 1 };
    const dailyConsumption = aliveCount * (rateMap[state.rations] || 2);
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

    // Calculate distance traveled
    const baseMiles = GAME_CONSTANTS.BASE_DAILY_MILES;
    const paceMult = PACE_MULTIPLIER[state.pace] || 1.0;
    const dailyMiles = Math.round(baseMiles * paceMult);

    // Random event check — events fire more frequently for a challenging game
    const eventRoll = Math.random();
    const eventThreshold = state.gradeBand === 'k2' ? 0.75 : 0.60;

    if (eventRoll > eventThreshold) {
      const event = selectRandomEvent(state, eventsData);
      if (event) {
        dispatch({ type: 'SET_EVENT', event });
        return;
      }
    }

    // Illness check — higher base rate, terrain and conditions matter more
    const illnessRoll = Math.random();
    let illnessChance = 0.06; // 6% base (was 3%)
    if (state.pace === 'grueling') illnessChance += 0.08;
    if (state.pace === 'strenuous') illnessChance += 0.03;
    if (state.rations === 'bare_bones') illnessChance += 0.06;
    if (state.rations === 'meager') illnessChance += 0.02;
    if (state.pace === 'grueling' && state.rations === 'bare_bones') illnessChance += 0.15;
    // Mountain and river terrain increase illness risk
    if (currentLandmark?.terrain_type === 'mountains') illnessChance += 0.04;
    if (currentLandmark?.terrain_type === 'river') illnessChance += 0.03;
    // Late season increases risk (after October)
    if (state.gameDate > '1848-10-01') illnessChance += 0.05;

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
    if (state.trailDay % 7 === 0) {
      const healthyMembers = aliveAfterStarvation.filter(m => m.health === 'good' || m.health === 'fair');
      if (healthyMembers.length > 0) {
        let wearChance = 0.15; // 15% base weekly wear
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
      const messages = getTerrainMessages(currentLandmark?.terrain_type);
      dayMessage = messages[Math.floor(Math.random() * messages.length)];
    }
    setTravelMessage(dayMessage);
  }, [state, dispatch, nextLandmark, landmarks]);

  function handleSundayChoice(rested) {
    setShowSundayPrompt(false);
    dispatch({ type: 'SUNDAY_REST', rested });
    if (rested) {
      dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.SUNDAY_REST, trigger: 'sunday_rest' });
      dispatch({ type: 'UPDATE_MORALE', delta: 5 });

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
    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
    setTravelMessage('Your party rested for a day. The sick are feeling a little better.');
    setIsResting(false);
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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-trail-cream">
      {/* ═══ TOP BAR: date, location, grace ═══ */}
      <div className="flex-none flex items-center justify-between px-3 py-1.5 bg-trail-darkBrown text-trail-cream border-b-2 border-trail-brown"
        style={{ fontFamily: "'Lora', Georgia, serif" }}>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold">{formatGameDate(state.gameDate)}</span>
          <span className="text-trail-tan/70">|</span>
          <span>Day {state.trailDay}</span>
        </div>
        <div className="text-sm font-semibold tracking-wide">
          Near {currentLandmark?.name || 'Independence'}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-trail-tan/70">Grace:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-2.5 bg-trail-brown/50 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${getGraceColor(state.grace)}`}
                style={{ width: `${state.grace}%` }} />
            </div>
            <span className={`text-xs font-semibold ${
              state.grace >= 75 ? 'text-yellow-300' : state.grace >= 40 ? 'text-trail-tan' : state.grace >= 15 ? 'text-orange-400' : 'text-red-400'
            }`}>{state.grace} ({graceRange})</span>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT: 3-column layout ═══ */}
      <div className="flex-1 flex min-h-0">

        {/* ──── LEFT COLUMN: terrain scene + party + supplies ──── */}
        <div className="w-64 flex-none flex flex-col border-r-2 border-trail-tan/40 bg-trail-parchment/30">
          {/* Terrain Scene */}
          <div className="flex-none h-28 border-b border-trail-tan/30">
            <TerrainScene terrainType={terrainType} landmarkName={currentLandmark?.name} />
          </div>

          {/* Party Members */}
          <div className="flex-none px-3 py-2 border-b border-trail-tan/30">
            <h3 className="text-xs font-bold text-trail-darkBrown uppercase tracking-wider mb-1"
              style={{ fontVariant: 'small-caps' }}>Party</h3>
            <div className="space-y-0.5">
              {state.partyMembers.map(m => (
                <div key={m.name} className="flex justify-between items-center text-xs">
                  <span className={`${!m.alive ? 'line-through text-gray-400' : 'text-trail-darkBrown'}`}>
                    {m.name}
                    {m.isChaplain && <span className="text-trail-gold ml-0.5">&dagger;</span>}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    m.health === 'good' ? 'bg-green-100 text-green-700' :
                    m.health === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                    m.health === 'poor' ? 'bg-orange-100 text-orange-700' :
                    m.health === 'critical' ? 'bg-red-100 text-red-700 font-bold' :
                    'bg-gray-100 text-gray-500'
                  }`}>{m.alive ? m.health : 'dead'}</span>
                </div>
              ))}
            </div>
            {/* Morale bar */}
            <div className="mt-1.5">
              <div className="flex justify-between text-[10px] text-trail-brown mb-0.5">
                <span>Morale</span>
                <span>{state.morale}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${
                  state.morale >= 60 ? 'bg-green-500' : state.morale >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                }`} style={{ width: `${state.morale}%` }} />
              </div>
            </div>
          </div>

          {/* Supplies */}
          <div className="flex-none px-3 py-2 border-b border-trail-tan/30">
            <h3 className="text-xs font-bold text-trail-darkBrown uppercase tracking-wider mb-1"
              style={{ fontVariant: 'small-caps' }}>Supplies</h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-trail-darkBrown">
              <span className="text-trail-brown">Food:</span>
              <span className={state.foodLbs < 50 ? 'text-red-600 font-bold' : ''}>{Math.round(state.foodLbs)} lbs</span>
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

          {/* Travel Settings */}
          <div className="flex-none px-3 py-2 border-b border-trail-tan/30">
            <h3 className="text-xs font-bold text-trail-darkBrown uppercase tracking-wider mb-1"
              style={{ fontVariant: 'small-caps' }}>Settings</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <label className="text-[10px] text-trail-brown w-10">Pace:</label>
                <select value={state.pace}
                  onChange={e => dispatch({ type: 'SET_PACE', pace: e.target.value })}
                  className="flex-1 text-[11px] px-1 py-0.5 border border-trail-tan rounded bg-white">
                  <option value="steady">Steady</option>
                  <option value="strenuous">Strenuous</option>
                  <option value="grueling">Grueling</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-[10px] text-trail-brown w-10">Food:</label>
                <select value={state.rations}
                  onChange={e => dispatch({ type: 'SET_RATIONS', rations: e.target.value })}
                  className="flex-1 text-[11px] px-1 py-0.5 border border-trail-tan rounded bg-white">
                  <option value="filling">Filling</option>
                  <option value="meager">Meager</option>
                  <option value="bare_bones">Bare Bones</option>
                </select>
              </div>
            </div>
          </div>

          {/* Warnings */}
          <div className="flex-1 px-3 py-2 overflow-y-auto">
            {state.foodLbs < 50 && state.foodLbs > 0 && (
              <div className="text-[10px] text-orange-600 font-semibold mb-1">Low food!</div>
            )}
            {state.foodLbs <= 0 && (
              <div className="text-[10px] text-red-600 font-bold mb-1">No food! Starving!</div>
            )}
            {state.sessionSettings?.historian_enabled && (
              <button onClick={() => dispatch({ type: 'TOGGLE_HISTORIAN' })}
                className="w-full text-[10px] py-1 px-2 bg-trail-tan/30 border border-trail-tan rounded text-trail-darkBrown hover:bg-trail-tan/50 transition-colors mt-1">
                Trail Journal
              </button>
            )}
          </div>
        </div>

        {/* ──── CENTER COLUMN: map + message + actions ──── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Trail Map */}
          <div className="flex-1 min-h-0">
            <OregonTrailMap
              landmarks={landmarks}
              currentIndex={state.currentLandmarkIndex}
              distanceToNext={state.distanceToNextLandmark}
            />
          </div>

          {/* Progress bar */}
          <div className="flex-none px-3 py-1 bg-trail-parchment/50 border-t border-trail-tan/30">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-trail-brown whitespace-nowrap">
                {Math.round(state.distanceTraveled)} mi
              </span>
              <div className="flex-1 h-2 bg-trail-tan/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-trail-brown to-trail-gold rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-[10px] text-trail-brown whitespace-nowrap">
                {totalDistance} mi
              </span>
            </div>
            {nextLandmark && (
              <div className="text-center text-[10px] text-trail-brown mt-0.5">
                {Math.max(0, Math.round(state.distanceToNextLandmark))} miles to {nextLandmark.name}
              </div>
            )}
          </div>

          {/* Message & Actions */}
          <div className="flex-none px-4 py-2 bg-trail-parchment/60 border-t-2 border-trail-tan/50">
            {travelMessage && (
              <div className="text-center text-sm text-trail-darkBrown mb-2 italic font-serif leading-snug">
                &ldquo;{travelMessage}&rdquo;
              </div>
            )}
            <div className="flex gap-2 justify-center flex-wrap">
              <button onClick={handleContinueTravel}
                className="btn-primary py-1.5 px-5 text-sm">
                Continue on the Trail
              </button>
              <button onClick={handleRest}
                className="btn-secondary py-1.5 px-4 text-sm">
                Rest
              </button>
              {state.gradeBand !== 'k2' && state.ammoBoxes > 0 && (
                <button onClick={() => setShowHunting(true)}
                  className="btn-secondary py-1.5 px-4 text-sm">
                  Hunt
                </button>
              )}
              {state.partyMembers.some(m => m.alive && m.health === 'critical') && state.prayerCooldownDay < state.trailDay && (
                <button
                  onClick={() => {
                    const criticalMember = state.partyMembers.find(m => m.alive && m.health === 'critical');
                    dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.PRAYER, trigger: 'prayer_crisis' });
                    dispatch({ type: 'UPDATE_MORALE', delta: 3 });
                    dispatch({ type: 'PRAY', memberName: criticalMember?.name });
                    if (state.chaplainInParty) {
                      setTravelMessage(`Fr. Joseph leads the party in prayer for ${criticalMember?.name}. A sense of calm settles over the group.`);
                    } else {
                      setTravelMessage(`The party prays together for ${criticalMember?.name}. It doesn't change the illness, but it steadies the heart.`);
                    }
                  }}
                  className="py-1.5 px-4 text-sm bg-trail-gold/20 border border-trail-gold text-trail-darkBrown rounded-lg hover:bg-trail-gold/30 transition-colors">
                  Pray
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ──── RIGHT COLUMN: Knowledge Panel / Historian (if open) ──── */}
        {state.showHistorian && (
          <div className="w-72 flex-none border-l-2 border-trail-tan/40 bg-trail-parchment/20 overflow-y-auto">
            <HistorianPanel />
          </div>
        )}
      </div>

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

/** Terrain-specific ambient messages */
function getTerrainMessages(terrainType) {
  const messages = {
    plains: [
      'The prairie grass stretches to the horizon in every direction.',
      'A gentle wind ripples through the tall grass as your wagon rolls west.',
      'The flat expanse of the Great Plains unfolds before you.',
      'Dust rises behind your wagon wheels. The trail stretches ahead.',
      'Prairie dogs watch your wagon from their burrows as you pass.',
    ],
    hills: [
      'The rolling hills slow the oxen, but the views are breathtaking.',
      'Your wagon crests another hill. The trail dips and rises ahead.',
      'Rocky outcroppings dot the hillside. The terrain is getting rougher.',
      'Scattered trees provide welcome shade as you climb the gentle slopes.',
      'The landscape changes as foothills give way to steeper ground.',
    ],
    mountains: [
      'Towering peaks rise ahead, their summits lost in clouds.',
      'The mountain pass is narrow. Your wagon barely fits between the rocks.',
      'Pine trees line the steep trail. The air is thin and cold.',
      'Snow gleams on distant peaks. The mountain crossing tests your resolve.',
      'Eagles circle above the ridgeline as your wagon climbs higher.',
    ],
    river: [
      'The sound of rushing water grows louder as you approach the crossing.',
      'The river churns with spring runoff. The crossing will be dangerous.',
      'Cottonwood trees line the riverbanks, their leaves whispering in the breeze.',
      'Other wagons are camped at the crossing, waiting for the water to drop.',
      'The river glitters in the sunlight. It looks peaceful, but the current runs deep.',
    ]
  };
  return messages[terrainType] || messages.plains;
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
