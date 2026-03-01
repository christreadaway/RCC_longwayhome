import { useState, useEffect } from 'react';
import { useGameDispatch } from '../../../store/GameContext';
import { GAME_CONSTANTS } from '@shared/types';

export default function MoralLabel({ label }) {
  const dispatch = useGameDispatch();
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, (GAME_CONSTANTS.LABEL_FADE_SECONDS - 1) * 1000);

    const dismissTimer = setTimeout(() => {
      dispatch({ type: 'DISMISS_LABEL' });
    }, GAME_CONSTANTS.LABEL_FADE_SECONDS * 1000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [label, dispatch]);

  if (!label) return null;

  const isPositive = label.valence === 'positive';

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm z-50 ${fading ? 'moral-label-exit' : 'moral-label-enter'}`}
    >
      <div
        className={`rounded-xl shadow-2xl border-2 overflow-hidden ${
          isPositive
            ? 'border-trail-gold bg-gradient-to-br from-yellow-50 to-amber-50'
            : 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50'
        }`}
      >
        {/* Header */}
        <div className={`px-4 py-2 ${isPositive ? 'bg-trail-gold/20' : 'bg-orange-200/50'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-lg ${isPositive ? 'text-trail-darkBrown' : 'text-red-900'}`}>
              {label.title}
            </h3>
            <button
              onClick={() => dispatch({ type: 'DISMISS_LABEL' })}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="text-trail-darkBrown text-sm leading-relaxed">
            {label.body}
          </p>

          {label.scripture && (
            <p className="text-trail-brown text-xs mt-2 italic">
              {label.scripture}
            </p>
          )}

          {label.forward_prompt && (
            <p className={`text-sm mt-2 ${isPositive ? 'text-trail-blue' : 'text-orange-700'} italic`}>
              {label.forward_prompt}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
