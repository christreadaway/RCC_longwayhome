import { useState, useEffect } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { GAME_CONSTANTS, GRACE_DELTAS } from '@shared/types';
import { formatGameDate } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';
import landmarksData from '../../data/landmarks.json';
import landmarksK2 from '../../data/landmarks-k2.json';
import eventsData from '../../data/events.json';
import moralLabelsData from '../../data/moral-labels.json';

export default function LandmarkScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [showStore, setShowStore] = useState(false);
  const [storeMessage, setStoreMessage] = useState('');
  const [cwmEvent, setCwmEvent] = useState(null);
  const [reconciliationEvent, setReconciliationEvent] = useState(null);
  const [reciprocityEvent, setReciprocityEvent] = useState(null);

  const landmarks = state.gradeBand === 'k2' ? landmarksK2.landmarks : landmarksData.landmarks;
  const landmark = landmarks[state.currentLandmarkIndex];
  const isLastLandmark = state.currentLandmarkIndex >= landmarks.length - 1;

  // Final landmark is handled in ARRIVE_LANDMARK reducer (sets status + phase).
  // This is a safety fallback in case LandmarkScreen renders for the final stop.
  useEffect(() => {
    if (isLastLandmark && state.phase !== 'GAME_OVER') {
      dispatch({ type: 'SET_STATUS', status: 'completed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
    }
  }, [isLastLandmark, state.phase, dispatch]);

  // Check for CWM event at this landmark
  useEffect(() => {
    if (shouldFireCwm(state)) {
      const cwmEvents = eventsData.events.filter(e => e.is_cwm && e.grade_bands.includes(state.gradeBand));
      if (cwmEvents.length > 0) {
        const event = cwmEvents[Math.floor(Math.random() * cwmEvents.length)];
        setCwmEvent(event);
      }
    }
  }, []);

  // Check for reconciliation
  useEffect(() => {
    if (state.reconciliationPending && state.gradeBand !== 'k2') {
      const legsSinceSin = state.currentLandmarkIndex - state.reconciliationPending.legAtSin;
      if (legsSinceSin >= 1 && legsSinceSin <= 2 && Math.random() < GAME_CONSTANTS.RECONCILIATION_PROBABILITY) {
        setReconciliationEvent({
          type: state.reconciliationPending.sinEventType,
          title: 'A Second Chance',
          description: getReconciliationText(state.reconciliationPending.sinEventType)
        });
      }
    }
  }, []);

  // Check for reciprocity
  useEffect(() => {
    state.reciprocityPending.forEach(rp => {
      const legsSinceCwm = state.currentLandmarkIndex - rp.setAtLeg;
      if (legsSinceCwm >= 2 && Math.random() < GAME_CONSTANTS.RECIPROCITY_FIRE_PROBABILITY) {
        setReciprocityEvent({
          cwmType: rp.cwmType,
          ...getReciprocityReward(rp.cwmType)
        });
      }
    });
  }, []);

  function handleCwmChoice(helped) {
    const isDeceptive = Math.random() < GAME_CONSTANTS.CWM_DECEPTIVE_PROBABILITY;

    dispatch({
      type: 'CWM_EVENT_RESOLVED',
      eventType: cwmEvent.type,
      choice: helped ? 'helped' : 'declined',
      recipientGenuine: !isDeceptive
    });

    if (helped) {
      const effects = cwmEvent.choices?.find(c => c.id === 'help')?.effects || {};
      if (effects.food_lbs) dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: Math.max(0, state.foodLbs + effects.food_lbs) });
      if (effects.cash) dispatch({ type: 'UPDATE_SUPPLIES', cash: Math.max(0, state.cash + effects.cash) });
      dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.CWM_HELP, trigger: cwmEvent.type });
      dispatch({ type: 'UPDATE_MORALE', delta: 8 });
      dispatch({ type: 'ADD_RECIPROCITY_PENDING', cwmType: cwmEvent.type });
    } else {
      dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.CWM_DECLINE, trigger: `${cwmEvent.type}_declined` });
      dispatch({ type: 'UPDATE_MORALE', delta: -3 });
      if (state.gradeBand !== 'k2') {
        dispatch({
          type: 'SET_RECONCILIATION_PENDING',
          data: { sinEventType: cwmEvent.type, legAtSin: state.currentLandmarkIndex, attempts: 0 }
        });
      }
    }

    // Show moral label
    const labelKey = `cwm_${cwmEvent.type}_${helped ? 'helped' : 'declined'}`;
    const labels = moralLabelsData[labelKey];
    if (labels && labels[state.gradeBand]) {
      const mode = state.sessionSettings?.moral_label_mode || 'full';
      if (mode === 'full') {
        dispatch({ type: 'SHOW_LABEL', label: { id: labelKey, ...labels[state.gradeBand] } });
      }
    }

    dispatch({
      type: 'RESOLVE_EVENT',
      eventType: cwmEvent.type,
      outcome: helped ? 'helped' : 'declined',
      description: `${cwmEvent.title} — ${helped ? 'You helped.' : 'You passed by.'}`,
      moralLabelId: labelKey
    });

    setCwmEvent(null);
  }

  function handleReconciliation(taken) {
    if (taken) {
      dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.RECONCILIATION_TAKEN, trigger: 'reconciliation_taken' });
      dispatch({ type: 'UPDATE_MORALE', delta: 3 });

      const labels = moralLabelsData['reconciliation_taken'];
      if (labels && labels[state.gradeBand]) {
        dispatch({ type: 'SHOW_LABEL', label: { id: 'reconciliation_taken', ...labels[state.gradeBand] } });
      }
    } else {
      const labels = moralLabelsData['reconciliation_declined'];
      if (labels && labels[state.gradeBand]) {
        dispatch({ type: 'SHOW_LABEL', label: { id: 'reconciliation_declined', ...labels[state.gradeBand] } });
      }
    }
    dispatch({ type: 'CLEAR_RECONCILIATION' });
    setReconciliationEvent(null);
  }

  function handleReciprocity() {
    if (reciprocityEvent) {
      if (reciprocityEvent.food) dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: state.foodLbs + reciprocityEvent.food });
      if (reciprocityEvent.cash) dispatch({ type: 'UPDATE_SUPPLIES', cash: state.cash + reciprocityEvent.cash });
      if (reciprocityEvent.spare_part) {
        const newParts = { ...state.spareParts };
        newParts[reciprocityEvent.spare_part] = (newParts[reciprocityEvent.spare_part] || 0) + 1;
        dispatch({ type: 'UPDATE_SUPPLIES', spareParts: newParts });
      }
      dispatch({ type: 'RECIPROCITY_FIRED', cwmType: reciprocityEvent.cwmType });
    }
    setReciprocityEvent(null);
  }

  function handleBuyItem(item, price) {
    if (state.cash < price) {
      setStoreMessage("You can't afford that.");
      return;
    }
    dispatch({ type: 'UPDATE_SUPPLIES', cash: state.cash - price, [item]: (state[item] || 0) + (item === 'foodLbs' ? 50 : 1) });
    setStoreMessage(`Purchased ${item === 'foodLbs' ? '50 lbs of food' : item}.`);
  }

  function handleContinue() {
    const nextIdx = state.currentLandmarkIndex + 1;
    if (nextIdx < landmarks.length) {
      dispatch({
        type: 'ADVANCE_DAY',
        distanceTraveled: 0
      });
      dispatch({ type: 'SET_PHASE', phase: 'TRAVELING' });
    }
  }

  if (isLastLandmark) return null;

  // Show CWM event first if one fired
  if (cwmEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-8">
        <div className="scene-card max-w-2xl w-full bg-white">
          <div className="p-6 bg-trail-blue">
            <h2 className="text-2xl font-bold text-white">{cwmEvent.title}</h2>
          </div>
          <div className="p-6">
            <p className="text-trail-darkBrown text-lg leading-relaxed mb-6">{cwmEvent.description}</p>
            <div className="space-y-3">
              {cwmEvent.choices?.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleCwmChoice(choice.id === 'help' || choice.id === 'helped')}
                  className="w-full text-left p-4 rounded-lg border-2 border-trail-tan hover:border-trail-blue hover:bg-trail-blue/5 transition-all"
                >
                  <div className="font-semibold text-trail-darkBrown">{choice.text}</div>
                  {choice.cost_text && <div className="text-sm text-trail-brown mt-1">{choice.cost_text}</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show reconciliation if pending
  if (reconciliationEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-8">
        <div className="scene-card max-w-2xl w-full bg-white">
          <div className="p-6 bg-trail-gold">
            <h2 className="text-2xl font-bold text-white">{reconciliationEvent.title}</h2>
          </div>
          <div className="p-6">
            <p className="text-trail-darkBrown text-lg leading-relaxed mb-6">{reconciliationEvent.description}</p>
            <div className="space-y-3">
              <button onClick={() => handleReconciliation(true)} className="btn-primary w-full py-3">
                Help them now
              </button>
              <button onClick={() => handleReconciliation(false)} className="btn-secondary w-full py-3">
                Continue on your way
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show reciprocity event
  if (reciprocityEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-8">
        <div className="scene-card max-w-2xl w-full bg-white">
          <div className="p-6 bg-trail-green">
            <h2 className="text-2xl font-bold text-white">A Stranger Returns</h2>
          </div>
          <div className="p-6">
            <p className="text-trail-darkBrown text-lg leading-relaxed mb-6">{reciprocityEvent.description}</p>
            <button onClick={handleReciprocity} className="btn-primary w-full py-3">
              Accept their gift
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment">
      {/* Landmark Scene */}
      <div className={`relative h-56 ${getLandmarkBg(landmark.type)} overflow-hidden flex items-end`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 p-6 text-white w-full">
          <h1 className="text-3xl font-bold">{landmark.name}</h1>
          <p className="text-white/80">{formatGameDate(state.gameDate)} — Day {state.trailDay}</p>
          {landmark.type === 'mission' && (
            <p className="text-white/70 text-sm mt-1 italic">A Catholic mission on the frontier</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="card">
          <p className="text-trail-darkBrown leading-relaxed">{landmark.description}</p>
        </div>

        {/* Resupply at forts/missions */}
        {landmark.can_resupply && !showStore && (
          <button onClick={() => setShowStore(true)} className="btn-secondary w-full">
            Visit the Trading Post
          </button>
        )}

        {showStore && landmark.prices && (
          <div className="card">
            <h3 className="text-xl font-bold text-trail-darkBrown mb-4">Trading Post</h3>
            <p className="text-sm text-trail-brown mb-3">Cash: ${state.cash.toFixed(2)}</p>
            {storeMessage && <p className="text-trail-blue text-sm mb-3">{storeMessage}</p>}
            <div className="grid grid-cols-2 gap-3">
              {landmark.prices.food_per_lb && (
                <button
                  onClick={() => {
                    if (state.cash >= landmark.prices.food_per_lb * 50) {
                      dispatch({ type: 'UPDATE_SUPPLIES', cash: state.cash - landmark.prices.food_per_lb * 50, foodLbs: state.foodLbs + 50 });
                      setStoreMessage('Bought 50 lbs of food.');
                    } else setStoreMessage("Can't afford that.");
                  }}
                  className="p-3 border border-trail-tan rounded-lg hover:bg-trail-parchment"
                >
                  <div className="font-semibold">Food (50 lbs)</div>
                  <div className="text-sm text-trail-brown">${(landmark.prices.food_per_lb * 50).toFixed(2)}</div>
                </button>
              )}
              {landmark.prices.clothing && (
                <button
                  onClick={() => {
                    if (state.cash >= landmark.prices.clothing) {
                      dispatch({ type: 'UPDATE_SUPPLIES', cash: state.cash - landmark.prices.clothing, clothingSets: state.clothingSets + 1 });
                      setStoreMessage('Bought 1 set of clothing.');
                    } else setStoreMessage("Can't afford that.");
                  }}
                  className="p-3 border border-trail-tan rounded-lg hover:bg-trail-parchment"
                >
                  <div className="font-semibold">Clothing (1 set)</div>
                  <div className="text-sm text-trail-brown">${landmark.prices.clothing.toFixed(2)}</div>
                </button>
              )}
              {landmark.prices.ammo && (
                <button
                  onClick={() => {
                    if (state.cash >= landmark.prices.ammo) {
                      dispatch({ type: 'UPDATE_SUPPLIES', cash: state.cash - landmark.prices.ammo, ammoBoxes: state.ammoBoxes + 1 });
                      setStoreMessage('Bought 1 box of ammo.');
                    } else setStoreMessage("Can't afford that.");
                  }}
                  className="p-3 border border-trail-tan rounded-lg hover:bg-trail-parchment"
                >
                  <div className="font-semibold">Ammunition (1 box)</div>
                  <div className="text-sm text-trail-brown">${landmark.prices.ammo.toFixed(2)}</div>
                </button>
              )}
              {landmark.prices.oxen && (
                <button
                  onClick={() => {
                    if (state.cash >= landmark.prices.oxen) {
                      dispatch({ type: 'UPDATE_SUPPLIES', cash: state.cash - landmark.prices.oxen, oxenYokes: state.oxenYokes + 1 });
                      setStoreMessage('Bought 1 yoke of oxen.');
                    } else setStoreMessage("Can't afford that.");
                  }}
                  className="p-3 border border-trail-tan rounded-lg hover:bg-trail-parchment"
                >
                  <div className="font-semibold">Oxen (1 yoke)</div>
                  <div className="text-sm text-trail-brown">${landmark.prices.oxen.toFixed(2)}</div>
                </button>
              )}
            </div>
            <button onClick={() => setShowStore(false)} className="text-trail-blue underline text-sm mt-3">
              Close trading post
            </button>
          </div>
        )}

        {/* Party Status */}
        <div className="card">
          <h3 className="font-semibold text-trail-darkBrown mb-2">Party Status</h3>
          <div className="space-y-1">
            {state.partyMembers.map(m => (
              <div key={m.name} className="flex justify-between text-sm">
                <span className={!m.alive ? 'line-through text-gray-400' : ''}>
                  {m.name} {m.isChaplain ? '(Chaplain)' : ''}
                </span>
                <span className={`health-${m.health}`}>{m.alive ? m.health : 'deceased'}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-trail-brown">
            <div>Food: {Math.round(state.foodLbs)} lbs</div>
            <div>Cash: ${state.cash.toFixed(2)}</div>
            <div>Morale: {state.morale}%</div>
          </div>
        </div>

        <button onClick={handleContinue} className="btn-primary w-full py-3 text-lg">
          Continue West
        </button>
      </div>
    </div>
  );
}

function getLandmarkBg(type) {
  switch (type) {
    case 'fort': return 'bg-gradient-to-b from-amber-800 to-amber-600';
    case 'mission': return 'bg-gradient-to-b from-amber-700 to-yellow-600';
    case 'natural': return 'bg-gradient-to-b from-green-800 to-green-600';
    case 'town': return 'bg-gradient-to-b from-amber-900 to-amber-700';
    case 'destination': return 'bg-gradient-to-b from-green-700 to-emerald-500';
    default: return 'bg-gradient-to-b from-trail-brown to-trail-tan';
  }
}

function shouldFireCwm(state) {
  if (state.cwmFired >= GAME_CONSTANTS.CWM_MAX_PER_GAME) return false;
  // Don't fire in crisis
  const alive = state.partyMembers.filter(m => m.alive);
  if (state.foodLbs <= 0 || alive.filter(m => m.health === 'critical').length >= 2) return false;
  // Guarantee at least 1 past Fort Laramie (index ~3)
  if (state.cwmFired === 0 && state.currentLandmarkIndex >= 3) return true;
  // Random chance at landmarks
  return Math.random() < 0.35;
}

function getReconciliationText(sinEventType) {
  const texts = {
    feed_hungry: "You see the same family you passed before. They look weaker now, but they're still traveling. You have enough food to share a little.",
    give_drink: "The travelers you refused water are here at the river crossing, still parched. You could share some water now.",
    visit_sick: "The sick stranger you left by the trail has been carried to this place by others. They're still ill. You could stop to help.",
    shelter_homeless: "The abandoned child you passed has been taken in by another family, but they're struggling. You could lighten their burden.",
    bury_dead: "The unburied body you passed is still there at the side of the trail. You could take the time now.",
    fair_trade: "You see the family you took advantage of earlier. They seem to recognize you. You could offer them a fair deal this time.",
    forgive_thief: "The person who stole from you has come back, ashamed. They want to make it right."
  };
  return texts[sinEventType] || "Someone you passed before is here again. You have another chance to help.";
}

function getReciprocityReward(cwmType) {
  const rewards = {
    feed_hungry: { description: "The family you helped earlier is at a fort ahead. They've left you 30 lbs of dried meat as thanks.", food: 30 },
    give_drink: { description: "The travelers you shared water with found a fresh spring and left you extra water containers.", food: 20 },
    visit_sick: { description: "The stranger you helped has recovered and flags you down — they have a spare wagon wheel your size.", spare_part: 'wheels' },
    shelter_homeless: { description: "The child you took in knows a shortcut through the mountain pass. Your journey ahead is safer.", food: 0 },
    bury_dead: { description: "A passing traveler witnessed your kindness. They offer to scout ahead for you, finding safer terrain.", food: 15 },
    fair_trade: { description: "The family you traded fairly with tells others. A trader gives you a discount — you save $20.", cash: 20 },
    forgive_thief: { description: "The person you forgave has returned with $20 and a day's worth of supplies as restitution.", cash: 20, food: 10 }
  };
  return rewards[cwmType] || { description: "A stranger you helped before has left supplies for you.", food: 15 };
}
