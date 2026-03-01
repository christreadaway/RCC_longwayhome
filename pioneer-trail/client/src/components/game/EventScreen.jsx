import { useState, useEffect } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { GRACE_DELTAS, GAME_CONSTANTS } from '@shared/types';
import { logger } from '../../utils/logger';
import moralLabelsData from '../../data/moral-labels.json';

export default function EventScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const event = state.currentEvent;

  // If no event, transition back to traveling (useEffect avoids dispatch during render)
  useEffect(() => {
    if (!event) {
      dispatch({ type: 'SET_PHASE', phase: 'TRAVELING' });
    }
  }, [event, dispatch]);

  if (!event) {
    return null;
  }

  function handleChoice(choice) {
    setSelectedChoice(choice);
    logger.info('EVENT_CHOICE', { eventId: event.id, choiceId: choice.id });

    // Process effects
    let description = choice.outcome_text || `You chose: ${choice.text}`;
    let moralLabelId = null;

    // Apply resource effects
    if (choice.effects) {
      const eff = choice.effects;

      if (eff.food_lbs) dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: Math.max(0, state.foodLbs + eff.food_lbs) });
      if (eff.cash) dispatch({ type: 'UPDATE_SUPPLIES', cash: Math.max(0, state.cash + eff.cash) });
      if (eff.ammo) dispatch({ type: 'UPDATE_SUPPLIES', ammoBoxes: Math.max(0, state.ammoBoxes + eff.ammo) });
      if (eff.oxen) dispatch({ type: 'UPDATE_SUPPLIES', oxenYokes: Math.max(0, state.oxenYokes + eff.oxen) });
      if (eff.clothing) dispatch({ type: 'UPDATE_SUPPLIES', clothingSets: Math.max(0, state.clothingSets + eff.clothing) });
      if (eff.grace) dispatch({ type: 'UPDATE_GRACE', delta: eff.grace, trigger: event.id });
      if (eff.morale) dispatch({ type: 'UPDATE_MORALE', delta: eff.morale });

      // Spare parts
      if (eff.spare_part) {
        const newParts = { ...state.spareParts };
        if (eff.spare_part === 'wheel') newParts.wheels = Math.max(0, newParts.wheels - 1);
        if (eff.spare_part === 'axle') newParts.axles = Math.max(0, newParts.axles - 1);
        if (eff.spare_part === 'tongue') newParts.tongues = Math.max(0, newParts.tongues - 1);
        dispatch({ type: 'UPDATE_SUPPLIES', spareParts: newParts });
      }

      // Time cost
      if (eff.time_days) {
        for (let i = 0; i < eff.time_days; i++) {
          dispatch({ type: 'ADVANCE_DAY', distanceTraveled: 0 });
        }
      }

      // Health effects
      if (eff.health_target === 'random_member') {
        const alive = state.partyMembers.filter(m => m.alive);
        if (alive.length > 0) {
          const victim = alive[Math.floor(Math.random() * alive.length)];
          const healthOrder = ['good', 'fair', 'poor', 'critical'];
          const idx = healthOrder.indexOf(victim.health);
          const newIdx = Math.min(3, idx + (eff.health_delta || 1));
          dispatch({
            type: 'UPDATE_PARTY_HEALTH',
            updates: [{ name: victim.name, health: healthOrder[newIdx] }]
          });
          description += ` ${victim.name} is now ${healthOrder[newIdx]}.`;
        }
      }

      // River crossing drowning
      if (eff.drowning_chance) {
        const alive = state.partyMembers.filter(m => m.alive);
        alive.forEach(m => {
          if (Math.random() < eff.drowning_chance) {
            dispatch({ type: 'PARTY_MEMBER_DIES', name: m.name, cause: 'drowning at river crossing' });
            description += ` ${m.name} drowned in the crossing!`;
          }
        });
      }
    }

    // CWM event handling
    if (event.is_cwm) {
      const helped = choice.id === 'help' || choice.id === 'helped';
      const isDeceptive = Math.random() < GAME_CONSTANTS.CWM_DECEPTIVE_PROBABILITY;

      dispatch({
        type: 'CWM_EVENT_RESOLVED',
        eventType: event.type,
        choice: helped ? 'helped' : 'declined',
        recipientGenuine: !isDeceptive
      });

      if (helped) {
        dispatch({ type: 'ADD_RECIPROCITY_PENDING', cwmType: event.type });
      } else {
        // Set reconciliation pending for sinful choice
        if (state.gradeBand !== 'k2') {
          dispatch({
            type: 'SET_RECONCILIATION_PENDING',
            data: { sinEventType: event.type, legAtSin: state.currentLandmarkIndex, attempts: 0 }
          });
        }
      }

      // Moral label
      const labelKey = `cwm_${event.type}_${helped ? 'helped' : 'declined'}`;
      const labels = moralLabelsData[labelKey];
      if (labels) {
        const bandLabel = labels[state.gradeBand];
        if (bandLabel) {
          moralLabelId = labelKey;
          const mode = state.sessionSettings?.moral_label_mode || 'full';
          if (mode === 'full') {
            dispatch({ type: 'SHOW_LABEL', label: { id: labelKey, ...bandLabel } });
          }
        }
      }
    }

    // Resolve the event
    dispatch({
      type: 'RESOLVE_EVENT',
      eventType: event.type || event.category,
      outcome: choice.id,
      description,
      moralLabelId
    });

    setOutcome({
      text: description,
      effects: choice.effects
    });
  }

  function handleContinue() {
    setSelectedChoice(null);
    setOutcome(null);
    dispatch({ type: 'SET_PHASE', phase: 'TRAVELING' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-8">
      <div className="scene-card max-w-2xl w-full bg-white">
        {/* Event Scene Header */}
        <div className={`p-6 ${getEventHeaderColor(event.category)}`}>
          <h2 className="text-2xl font-bold text-white">{event.title}</h2>
          <p className="text-white/80 text-sm mt-1">{event.category?.replace(/_/g, ' ')}</p>
        </div>

        {/* Event Description */}
        <div className="p-6">
          <p className="text-trail-darkBrown text-lg leading-relaxed mb-6">
            {event.description}
          </p>

          {/* Choices */}
          {!outcome && (
            <div className="space-y-3">
              {event.choices?.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice)}
                  className="w-full text-left p-4 rounded-lg border-2 border-trail-tan hover:border-trail-blue hover:bg-trail-blue/5 transition-all"
                >
                  <div className="font-semibold text-trail-darkBrown">{choice.text}</div>
                  {choice.cost_text && (
                    <div className="text-sm text-trail-brown mt-1">{choice.cost_text}</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Outcome */}
          {outcome && (
            <div className="space-y-4">
              <div className="p-4 bg-trail-parchment rounded-lg">
                <p className="text-trail-darkBrown">{outcome.text}</p>
                {outcome.effects && (
                  <div className="mt-2 text-sm text-trail-brown">
                    {outcome.effects.food_lbs && <span className={outcome.effects.food_lbs > 0 ? 'text-trail-green' : 'text-trail-red'}>Food: {outcome.effects.food_lbs > 0 ? '+' : ''}{outcome.effects.food_lbs} lbs </span>}
                    {outcome.effects.cash && <span className={outcome.effects.cash > 0 ? 'text-trail-green' : 'text-trail-red'}>Cash: {outcome.effects.cash > 0 ? '+' : ''}${outcome.effects.cash} </span>}
                    {outcome.effects.time_days && <span className="text-trail-red">Time: {outcome.effects.time_days} day(s) lost </span>}
                  </div>
                )}
              </div>
              <button onClick={handleContinue} className="btn-primary w-full py-3">
                Continue on the Trail
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getEventHeaderColor(category) {
  switch (category) {
    case 'weather': return 'bg-blue-600';
    case 'illness': return 'bg-red-700';
    case 'trail_hazard': return 'bg-orange-700';
    case 'resource': return 'bg-yellow-700';
    case 'good_event': return 'bg-green-600';
    case 'cwm': return 'bg-trail-blue';
    case 'feast_day': return 'bg-purple-600';
    default: return 'bg-trail-brown';
  }
}
