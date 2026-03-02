import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { GAME_CONSTANTS, PACE_MULTIPLIER, GRACE_DELTAS } from '@shared/types';
import { formatGameDate, isSunday, addDays, isAfter } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';
import TrailMap from './shared/TrailMap';
import PartyStatus from './shared/PartyStatus';
import HistorianPanel from './shared/HistorianPanel';
import KnowledgePanel from './shared/KnowledgePanel';
import SundayRestPrompt from './shared/SundayRestPrompt';
import HuntingMinigame from './shared/HuntingMinigame';

// Landmarks data (loaded dynamically based on grade band)
import landmarksData from '../../data/landmarks.json';
import landmarksK2 from '../../data/landmarks-k2.json';
import eventsData from '../../data/events.json';

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

    // Starvation check — fire when food runs out this day or was already out
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
        if (idx >= 3) starvationDeaths.add(m.name); // critical -> dead
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

    // Random event check (simplified — roll chance per day)
    const eventRoll = Math.random();
    const eventThreshold = state.gradeBand === 'k2' ? 0.85 : 0.75;

    if (eventRoll > eventThreshold) {
      // Fire a random event
      const event = selectRandomEvent(state, eventsData);
      if (event) {
        dispatch({ type: 'SET_EVENT', event });
        return;
      }
    }

    // Illness check
    const illnessRoll = Math.random();
    let illnessChance = 0.03; // base 3% per day
    if (state.pace === 'grueling') illnessChance += 0.05;
    if (state.rations === 'bare_bones') illnessChance += 0.04;
    if (state.pace === 'grueling' && state.rations === 'bare_bones') illnessChance += 0.15;

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

    // Death check for critical members (use aliveAfterStarvation to avoid stale data)
    aliveAfterStarvation.filter(m => m.health === 'critical').forEach(m => {
      const deathRoll = Math.random();
      const deathChance = state.rations === 'filling' ? 0.15 : state.rations === 'meager' ? 0.25 : 0.4;
      if (deathRoll < deathChance) {
        dispatch({
          type: 'PARTY_MEMBER_DIES',
          name: m.name,
          cause: m.illness || 'exhaustion'
        });
        dayMessage = `${m.name} has died of ${m.illness || 'exhaustion'}.`;
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

    // Feast day check — use the post-advance date
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
      const messages = [
        'The trail stretches ahead.',
        'Your wagon creaks along the trail.',
        'Another day on the trail.',
        'The landscape slowly changes as you travel west.',
        'Dust rises behind your wagon.'
      ];
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
      setTravelMessage('Your party rested on the Sabbath. Everyone feels refreshed.');
      // Advance date but not distance
      dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
    } else {
      // Player chose to travel on Sunday — skip the Sunday check and travel normally
      skipSundayCheckRef.current = true;
      travelOneDay();
    }
  }

  function handleContinueTravel() {
    setTravelMessage('');
    travelOneDay();
  }

  function handleRest() {
    // Guard: check end date
    if (isAfter(state.gameDate, GAME_CONSTANTS.END_DATE)) {
      dispatch({ type: 'SET_STATUS', status: 'failed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
      return;
    }
    // Guard: check all dead
    const alive = state.partyMembers.filter(m => m.alive);
    if (alive.length === 0) {
      dispatch({ type: 'SET_STATUS', status: 'failed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
      return;
    }

    setIsResting(true);
    // Rest restores party health slightly
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

  function handleHuntingComplete(foodGained) {
    setShowHunting(false);
    if (foodGained > 0) {
      dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: state.foodLbs + foodGained });
      setTravelMessage(`You hunted and brought back ${foodGained} lbs of food!`);
    } else {
      setTravelMessage('The hunt was unsuccessful.');
    }
    dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
  }

  const totalDistance = landmarks.reduce((sum, l) => sum + (l.distance_from_previous || 0), 0);
  const progressPercent = Math.min(100, (state.distanceTraveled / totalDistance) * 100);

  if (showHunting) {
    return <HuntingMinigame onComplete={handleHuntingComplete} ammo={state.ammoBoxes} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-trail-cream">
      {/* Trail Scene Header */}
      <div className="relative h-48 bg-gradient-to-b from-sky-300 to-sky-100 overflow-hidden">
        {/* Sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-sky-200" />
        {/* Mountains */}
        <svg className="absolute bottom-8 w-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <polygon fill="#6b8e6b" points="0,200 100,80 200,150 350,60 500,120 650,40 800,100 950,50 1100,90 1200,200" opacity="0.5"/>
          <polygon fill="#4a7c4a" points="0,200 150,100 300,160 450,90 600,140 750,70 900,130 1050,80 1200,200" opacity="0.6"/>
        </svg>
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-8 bg-gradient-to-b from-green-700 to-green-800" />
        {/* Wagon */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 wagon-animate">
          <svg width="80" height="50" viewBox="0 0 80 50">
            <rect x="10" y="10" width="50" height="25" rx="3" fill="#8B6914" stroke="#5C4033" strokeWidth="2"/>
            <path d="M10,10 Q35,0 60,10" fill="white" stroke="#5C4033" strokeWidth="1.5"/>
            <circle cx="15" cy="38" r="8" fill="none" stroke="#5C4033" strokeWidth="2.5"/>
            <circle cx="55" cy="38" r="8" fill="none" stroke="#5C4033" strokeWidth="2.5"/>
            <line x1="15" y1="30" x2="15" y2="46" stroke="#5C4033" strokeWidth="1"/>
            <line x1="7" y1="38" x2="23" y2="38" stroke="#5C4033" strokeWidth="1"/>
            <line x1="55" y1="30" x2="55" y2="46" stroke="#5C4033" strokeWidth="1"/>
            <line x1="47" y1="38" x2="63" y2="38" stroke="#5C4033" strokeWidth="1"/>
          </svg>
        </div>
        {/* Date and Location */}
        <div className="absolute top-4 left-4 bg-black/30 text-white px-3 py-1 rounded-lg text-sm">
          {formatGameDate(state.gameDate)} — Day {state.trailDay}
        </div>
        <div className="absolute top-4 right-4 bg-black/30 text-white px-3 py-1 rounded-lg text-sm">
          Near {currentLandmark?.name || 'Independence'}
        </div>
      </div>

      {/* Trail Progress Bar */}
      <div className="px-4 py-2">
        <TrailMap landmarks={landmarks} currentIndex={state.currentLandmarkIndex} progress={progressPercent} />
      </div>

      {/* Main Content Area */}
      <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {/* Left: Party & Supplies */}
        <div className="space-y-4">
          <PartyStatus
            members={state.partyMembers}
            morale={state.morale}
            food={state.foodLbs}
            cash={state.cash}
          />

          <div className="card">
            <h3 className="font-semibold text-trail-darkBrown mb-2">Supplies</h3>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <span>Food:</span><span className={state.foodLbs < 50 ? 'text-trail-red font-bold' : ''}>{Math.round(state.foodLbs)} lbs</span>
              <span>Oxen:</span><span>{state.oxenYokes} yoke</span>
              <span>Ammo:</span><span>{state.ammoBoxes} boxes</span>
              <span>Clothing:</span><span>{state.clothingSets} sets</span>
              <span>Cash:</span><span>${state.cash.toFixed(2)}</span>
              <span>Spare Parts:</span><span>{state.spareParts.wheels}W {state.spareParts.axles}A {state.spareParts.tongues}T</span>
            </div>
          </div>

          {/* Pace & Rations Controls */}
          <div className="card">
            <h3 className="font-semibold text-trail-darkBrown mb-2">Travel Settings</h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-trail-brown">Pace:</label>
                <select
                  value={state.pace}
                  onChange={e => dispatch({ type: 'SET_PACE', pace: e.target.value })}
                  className="select-field text-sm ml-2"
                >
                  <option value="steady">Steady (safe)</option>
                  <option value="strenuous">Strenuous (faster)</option>
                  <option value="grueling">Grueling (fastest)</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-trail-brown">Rations:</label>
                <select
                  value={state.rations}
                  onChange={e => dispatch({ type: 'SET_RATIONS', rations: e.target.value })}
                  className="select-field text-sm ml-2"
                >
                  <option value="filling">Filling (3 lbs/person/day)</option>
                  <option value="meager">Meager (2 lbs/person/day)</option>
                  <option value="bare_bones">Bare Bones (1 lb/person/day)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Travel Message & Actions */}
        <div className="space-y-4">
          {travelMessage && (
            <div className="card-parchment text-center">
              <p className="text-trail-darkBrown">{travelMessage}</p>
            </div>
          )}

          {nextLandmark && (
            <div className="text-center text-sm text-trail-brown">
              {Math.max(0, Math.round(state.distanceToNextLandmark))} miles to {nextLandmark.name}
            </div>
          )}

          <div className="space-y-2">
            <button onClick={handleContinueTravel} className="btn-primary w-full py-3 text-lg">
              Continue on the Trail
            </button>
            <button onClick={handleRest} className="btn-secondary w-full">
              Rest for a Day
            </button>
            {state.gradeBand !== 'k2' && state.ammoBoxes > 0 && (
              <button onClick={() => setShowHunting(true)} className="btn-secondary w-full">
                Go Hunting
              </button>
            )}
            {state.chaplainInParty && state.partyMembers.some(m => m.alive && m.health === 'critical') && (
              <button
                onClick={() => {
                  dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.PRAYER, trigger: 'prayer_crisis' });
                  dispatch({ type: 'UPDATE_MORALE', delta: 3 });
                  setTravelMessage('Fr. Joseph leads the party in prayer. A sense of calm settles over the group.');
                }}
                className="w-full py-2 px-4 bg-trail-gold/20 border border-trail-gold text-trail-darkBrown rounded-lg hover:bg-trail-gold/30 transition-colors"
              >
                Pray for the Sick
              </button>
            )}
          </div>
        </div>

        {/* Right: Knowledge Panel / Historian */}
        <div className="space-y-4">
          {state.sessionSettings?.historian_enabled && (
            <button
              onClick={() => dispatch({ type: 'TOGGLE_HISTORIAN' })}
              className="w-full py-2 px-4 bg-trail-tan/50 border border-trail-tan rounded-lg text-trail-darkBrown hover:bg-trail-tan/70 transition-colors text-sm"
            >
              Open Trail Journal
            </button>
          )}
          {state.showHistorian && <HistorianPanel />}
          <KnowledgePanel
            currentLandmark={currentLandmark}
            lastEvent={state.eventLog[state.eventLog.length - 1]}
            gradeBand={state.gradeBand}
          />
        </div>
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

function selectRandomEvent(state, eventsData) {
  const validEvents = eventsData.events.filter(e => {
    if (!e.grade_bands.includes(state.gradeBand)) return false;
    if (e.is_cwm) return false; // CWM handled separately
    if (e.category === 'feast_day') return false; // Handled in travel
    return true;
  });

  if (validEvents.length === 0) return null;

  // Weighted random selection
  const totalWeight = validEvents.reduce((sum, e) => sum + (e.probability_weight || 1), 0);
  let roll = Math.random() * totalWeight;
  for (const event of validEvents) {
    roll -= (event.probability_weight || 1);
    if (roll <= 0) return event;
  }
  return validEvents[0];
}
