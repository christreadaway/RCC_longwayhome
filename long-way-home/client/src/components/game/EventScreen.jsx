import { useState, useEffect, useMemo } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { GRACE_DELTAS, GAME_CONSTANTS } from '@shared/types';
import { logger } from '../../utils/logger';
import moralLabelsData from '../../data/moral-labels.json';

/**
 * Replace template placeholders like {member_name} with actual game state values.
 */
function resolveTemplate(text, state) {
  if (!text) return text;
  const alive = state.partyMembers.filter(m => m.alive);
  const randomMember = alive.length > 0
    ? alive[Math.floor(Math.random() * alive.length)]
    : null;

  return text
    .replace(/\{member_name\}/g, randomMember?.name || 'a member of your party')
    .replace(/\{student_name\}/g, state.studentName || 'Pioneer')
    .replace(/\{party_size\}/g, String(alive.length));
}

export default function EventScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const rawEvent = state.currentEvent;

  // Resolve template placeholders in the event text once, on mount
  const event = useMemo(() => {
    if (!rawEvent) return null;
    // Pick a consistent random member for this event
    const alive = state.partyMembers.filter(m => m.alive);
    const member = alive.length > 0
      ? alive[Math.floor(Math.random() * alive.length)]
      : null;
    const memberName = member?.name || 'a member of your party';

    const replace = (text) => {
      if (!text) return text;
      return text
        .replace(/\{member_name\}/g, memberName)
        .replace(/\{student_name\}/g, state.studentName || 'Pioneer')
        .replace(/\{party_size\}/g, String(alive.length));
    };

    return {
      ...rawEvent,
      _resolvedMember: member,
      description: replace(rawEvent.description),
      choices: rawEvent.choices?.map(c => ({
        ...c,
        text: replace(c.text),
        outcome_text: replace(c.outcome_text),
        cost_text: replace(c.cost_text),
      }))
    };
  }, [rawEvent?.id]); // Only re-resolve on new event

  // If no event, transition back to traveling
  useEffect(() => {
    if (!rawEvent) {
      dispatch({ type: 'SET_PHASE', phase: 'TRAVELING' });
    }
  }, [rawEvent, dispatch]);

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

      // Food effects
      if (eff.food_lbs) {
        dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: Math.max(0, state.foodLbs + eff.food_lbs) });
      }
      // Cash effects
      if (eff.cash) {
        dispatch({ type: 'UPDATE_SUPPLIES', cash: Math.max(0, state.cash + eff.cash) });
      }
      // Ammo effects
      if (eff.ammo) {
        dispatch({ type: 'UPDATE_SUPPLIES', ammoBoxes: Math.max(0, state.ammoBoxes + eff.ammo) });
      }
      // Oxen effects
      if (eff.oxen) {
        dispatch({ type: 'UPDATE_SUPPLIES', oxenYokes: Math.max(0, state.oxenYokes + eff.oxen) });
      }
      // Clothing effects
      if (eff.clothing) {
        dispatch({ type: 'UPDATE_SUPPLIES', clothingSets: Math.max(0, state.clothingSets + eff.clothing) });
      }

      // Grace effects (support both "grace" and "grace_change" keys)
      const graceVal = eff.grace || eff.grace_change;
      if (graceVal) {
        dispatch({ type: 'UPDATE_GRACE', delta: graceVal, trigger: event.id });
      }

      // Morale effects (support both "morale" and "morale_change" keys)
      const moraleVal = eff.morale || eff.morale_change;
      if (moraleVal) {
        dispatch({ type: 'UPDATE_MORALE', delta: moraleVal });
      }

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

      // Health effects — support both "health_change" (numeric) and "health_target" pattern
      if (eff.health_change) {
        // health_change is a numeric value. Negative means damage.
        // Apply to a random alive member (or the event's resolved member)
        const alive = state.partyMembers.filter(m => m.alive);
        if (alive.length > 0) {
          const victim = event._resolvedMember && event._resolvedMember.alive
            ? event._resolvedMember
            : alive[Math.floor(Math.random() * alive.length)];
          const healthOrder = ['good', 'fair', 'poor', 'critical'];
          const idx = healthOrder.indexOf(victim.health);
          // Each -5 health_change = 1 tier down. Positive = heal up.
          const tierShift = Math.round(eff.health_change / -5);
          if (tierShift !== 0) {
            const newIdx = Math.max(0, Math.min(3, idx + tierShift));
            if (newIdx !== idx) {
              dispatch({
                type: 'UPDATE_PARTY_HEALTH',
                updates: [{ name: victim.name, health: healthOrder[newIdx] }]
              });
              if (tierShift > 0) {
                description += ` ${victim.name}'s condition worsened to ${healthOrder[newIdx]}.`;
              } else {
                description += ` ${victim.name} is recovering — now ${healthOrder[newIdx]}.`;
              }
            }
          }
        }
      }

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

      // Oxen loss
      if (eff.oxen_loss) {
        const newOxen = Math.max(0, state.oxenYokes - eff.oxen_loss);
        dispatch({ type: 'UPDATE_SUPPLIES', oxenYokes: newOxen });
        description += ` You lost ${eff.oxen_loss} yoke of oxen.`;
      }
    }

    // CWM event handling
    if (event.is_cwm) {
      // Determine if the player chose the charitable option — CWM help choices
      // have positive grace_change, decline choices have negative grace_change
      const helped = choice.effects?.grace_change > 0 || choice.effects?.grace > 0;
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

    // Non-CWM moral label from events.json (if the event has a moral_label_key)
    if (!event.is_cwm && event.moral_label_key) {
      const labelKey = `${event.moral_label_key}_${choice.id}`;
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
    <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-4">
      <div className="scene-card max-w-2xl w-full bg-white max-h-[95vh] overflow-y-auto flex flex-col">
        {/* Illustrated Event Header */}
        <div className={`relative p-5 ${getEventHeaderColor(event.category)} overflow-hidden flex-none`}>
          <EventIllustration category={event.category} />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white drop-shadow-md">{event.title}</h2>
            <p className="text-white/80 text-sm mt-1">{event.category?.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {/* Event Description */}
        <div className="p-5 flex-1 overflow-y-auto">
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
                  <div className="mt-2 text-sm space-x-2">
                    {outcome.effects.food_lbs !== undefined && outcome.effects.food_lbs !== 0 && (
                      <span className={outcome.effects.food_lbs > 0 ? 'text-green-600' : 'text-red-600'}>
                        Food: {outcome.effects.food_lbs > 0 ? '+' : ''}{outcome.effects.food_lbs} lbs
                      </span>
                    )}
                    {outcome.effects.cash !== undefined && outcome.effects.cash !== 0 && (
                      <span className={outcome.effects.cash > 0 ? 'text-green-600' : 'text-red-600'}>
                        Cash: {outcome.effects.cash > 0 ? '+' : ''}${outcome.effects.cash}
                      </span>
                    )}
                    {outcome.effects.morale_change !== undefined && outcome.effects.morale_change !== 0 && (
                      <span className={outcome.effects.morale_change > 0 ? 'text-green-600' : 'text-red-600'}>
                        Morale: {outcome.effects.morale_change > 0 ? '+' : ''}{outcome.effects.morale_change}
                      </span>
                    )}
                    {outcome.effects.health_change !== undefined && outcome.effects.health_change !== 0 && (
                      <span className={outcome.effects.health_change > 0 ? 'text-green-600' : 'text-red-600'}>
                        Health: {outcome.effects.health_change > 0 ? '+' : ''}{outcome.effects.health_change}
                      </span>
                    )}
                    {outcome.effects.time_days !== undefined && outcome.effects.time_days > 0 && (
                      <span className="text-red-600">
                        Time: {outcome.effects.time_days} day(s) lost
                      </span>
                    )}
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

/** SVG illustrations for event types */
function EventIllustration({ category }) {
  const shared = "absolute right-2 top-1/2 -translate-y-1/2 opacity-20 w-24 h-24";
  switch (category) {
    case 'weather':
      return <svg className={shared} viewBox="0 0 64 64"><path d="M32 12a14 14 0 0 1 14 14 10 10 0 0 1-2 20H18a10 10 0 0 1-2-20A14 14 0 0 1 32 12z" fill="white"/><path d="M22 50l-4 8M30 50l-4 8M38 50l-4 8M46 50l-4 8" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>;
    case 'illness':
      return <svg className={shared} viewBox="0 0 64 64"><rect x="26" y="8" width="12" height="48" rx="2" fill="white"/><rect x="8" y="26" width="48" height="12" rx="2" fill="white"/></svg>;
    case 'trail_hazard':
      return <svg className={shared} viewBox="0 0 64 64"><polygon points="32,6 58,54 6,54" fill="none" stroke="white" strokeWidth="3"/><line x1="32" y1="22" x2="32" y2="38" stroke="white" strokeWidth="3" strokeLinecap="round"/><circle cx="32" cy="46" r="2" fill="white"/></svg>;
    case 'resource':
      return <svg className={shared} viewBox="0 0 64 64"><rect x="12" y="24" width="40" height="28" rx="4" fill="none" stroke="white" strokeWidth="3"/><path d="M20 24V18a12 12 0 0 1 24 0v6" fill="none" stroke="white" strokeWidth="3"/></svg>;
    case 'good_event':
      return <svg className={shared} viewBox="0 0 64 64"><circle cx="32" cy="28" r="16" fill="none" stroke="white" strokeWidth="3"/><path d="M32 16l3 8h8l-6 5 2 8-7-5-7 5 2-8-6-5h8z" fill="white"/></svg>;
    case 'cwm':
      return <svg className={shared} viewBox="0 0 64 64"><path d="M32 8C18 8 8 20 8 32c0 18 24 26 24 26s24-8 24-26C56 20 46 8 32 8z" fill="none" stroke="white" strokeWidth="3"/></svg>;
    case 'moral_choice':
      return <svg className={shared} viewBox="0 0 64 64"><circle cx="22" cy="32" r="12" fill="none" stroke="white" strokeWidth="2.5"/><circle cx="42" cy="32" r="12" fill="none" stroke="white" strokeWidth="2.5"/><path d="M30 26l4-4 4 4M30 38l4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>;
    default:
      return <svg className={shared} viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="none" stroke="white" strokeWidth="3"/><path d="M32 20v16M32 42v4" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>;
  }
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
    case 'moral_choice': return 'bg-trail-brown';
    default: return 'bg-trail-brown';
  }
}
