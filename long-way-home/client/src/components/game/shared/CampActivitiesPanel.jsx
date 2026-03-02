/**
 * CampActivitiesPanel — UI for managing camp activities during the journey.
 *
 * Shows available activities with their time costs and benefits.
 * Activities on cooldown are shown but disabled.
 */

import { useState } from 'react';
import { useGameState, useGameDispatch } from '../../../store/GameContext';
import { getAvailableActivities, executeActivity } from '../../../game/campActivities';
import { getFeatureFlags } from '../../../game/gradeband';
import { trackAction } from '../../../utils/crashLogger';
import { logger } from '../../../utils/logger';

export default function CampActivitiesPanel({ onActivityComplete }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityResult, setActivityResult] = useState(null);

  const featureFlags = getFeatureFlags(state.gradeBand);
  const activities = getAvailableActivities(state, featureFlags);

  function handleSelectActivity(activity) {
    if (!activity.available) return;
    setSelectedActivity(activity);
    setActivityResult(null);
  }

  function handleExecute() {
    if (!selectedActivity) return;

    trackAction('camp_activity', { id: selectedActivity.id });
    logger.info('CAMP_ACTIVITY', { id: selectedActivity.id, day: state.trailDay });

    const result = executeActivity(selectedActivity.id, state);

    // Apply effects through dispatch
    if (result.effects.morale) {
      dispatch({ type: 'UPDATE_MORALE', delta: result.effects.morale });
    }
    if (result.effects.grace) {
      dispatch({ type: 'UPDATE_GRACE', delta: result.effects.grace, trigger: `activity_${selectedActivity.id}` });
    }
    if (result.effects.foodCost) {
      dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: state.foodLbs - result.effects.foodCost });
    }
    if (result.effects.healthRecovery) {
      const updates = state.partyMembers
        .filter(m => m.alive && m.health !== 'good')
        .slice(0, 1) // Only heal one member per activity
        .map(m => {
          const order = ['dead', 'critical', 'poor', 'fair', 'good'];
          const idx = order.indexOf(m.health);
          return { name: m.name, health: idx < 4 ? order[idx + 1] : m.health };
        });
      if (updates.length > 0) {
        dispatch({ type: 'UPDATE_PARTY_HEALTH', updates });
      }
    }
    if (result.effects.reconciliationClear) {
      dispatch({ type: 'CLEAR_RECONCILIATION' });
    }

    // Record cooldown + advance partial day
    dispatch({
      type: 'CAMP_ACTIVITY_PERFORMED',
      activityId: selectedActivity.id,
      timeCost: result.timeCost,
      effects: result.effects,
    });

    setActivityResult(result);

    if (onActivityComplete) {
      onActivityComplete(result);
    }
  }

  function handleClose() {
    setSelectedActivity(null);
    setActivityResult(null);
  }

  return (
    <div className="border border-trail-tan/50 rounded bg-trail-parchment/40 px-2.5 py-1.5">
      <h3 className="text-[10px] font-bold text-trail-darkBrown uppercase tracking-wider mb-1.5"
        style={{ fontVariant: 'small-caps' }}>
        Camp Activities
      </h3>

      {activityResult ? (
        /* Activity result display */
        <div className="space-y-2">
          <div className="text-[11px] text-trail-darkBrown italic leading-snug font-serif whitespace-pre-line">
            {activityResult.message}
          </div>
          <div className="text-[10px] text-trail-brown">
            Time spent: {activityResult.timeCost >= 1 ? `${activityResult.timeCost} day` : `${Math.round(activityResult.timeCost * 24)} hours`}
          </div>
          <button
            onClick={handleClose}
            className="w-full text-[10px] py-1 px-2 bg-trail-tan/30 border border-trail-tan rounded text-trail-darkBrown hover:bg-trail-tan/50 transition-colors"
          >
            Done
          </button>
        </div>
      ) : selectedActivity ? (
        /* Activity confirmation */
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-trail-darkBrown">{selectedActivity.name}</div>
          <div className="text-[10px] text-trail-brown leading-snug">{selectedActivity.description}</div>
          <div className="text-[10px] text-trail-brown">
            Time: {selectedActivity.timeCost >= 1 ? `${selectedActivity.timeCost} day` : `${Math.round(selectedActivity.timeCost * 24)} hours`}
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleExecute}
              className="flex-1 text-[10px] py-1 px-2 bg-trail-brown/80 border border-trail-brown rounded text-trail-cream hover:bg-trail-brown transition-colors"
            >
              Do This
            </button>
            <button
              onClick={handleClose}
              className="flex-1 text-[10px] py-1 px-2 bg-trail-tan/30 border border-trail-tan rounded text-trail-darkBrown hover:bg-trail-tan/50 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        /* Activity list */
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {activities.map(activity => (
            <button
              key={activity.id}
              onClick={() => handleSelectActivity(activity)}
              disabled={!activity.available}
              className={`w-full text-left text-[10px] py-1 px-1.5 rounded transition-colors ${
                activity.available
                  ? 'hover:bg-trail-tan/30 text-trail-darkBrown cursor-pointer'
                  : 'text-trail-brown/50 cursor-not-allowed'
              }`}
            >
              <div className="font-semibold">{activity.name}</div>
              {!activity.available && activity.cooldownRemaining > 0 && (
                <div className="text-[9px] text-trail-brown/40">
                  Available in {activity.cooldownRemaining} day{activity.cooldownRemaining !== 1 ? 's' : ''}
                </div>
              )}
            </button>
          ))}
          {activities.length === 0 && (
            <div className="text-[10px] text-trail-brown/60 italic py-2 text-center">
              No activities available right now.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
