/**
 * WeatherBox — Displays current weather conditions in the travel UI.
 *
 * Shows temperature, wind, sky conditions, and ground conditions
 * in a compact box styled to match the trail-era aesthetic.
 */

import { useMemo } from 'react';

/** Weather condition icons using Unicode/text symbols for simplicity */
const CONDITION_ICONS = {
  'sun': '☀',
  'cloud-sun': '⛅',
  'cloud': '☁',
  'cloud-drizzle': '🌧',
  'cloud-rain': '🌧',
  'cloud-rain-heavy': '🌧',
  'cloud-lightning': '⛈',
  'snowflake': '❄',
  'snowflake-heavy': '❄',
  'wind-snow': '🌨',
  'fog': '🌫',
  'hail': '🌨',
  'wind': '🌬',
};

/** Ground condition color coding */
const GROUND_COLORS = {
  firm: 'text-green-700',
  dry: 'text-yellow-700',
  damp: 'text-blue-600',
  wet: 'text-blue-700',
  muddy: 'text-amber-800',
  sloshy: 'text-amber-900',
  icy: 'text-cyan-600',
  snowpack: 'text-blue-300',
};

export default function WeatherBox({ weather, compact = false }) {
  if (!weather) return null;

  const icon = CONDITION_ICONS[weather.conditionIcon] || '☁';
  const temp = weather.temperature || {};
  const wind = weather.wind || {};

  const travelImpact = useMemo(() => {
    const mod = weather.travelModifier || 0;
    if (mod <= -0.4) return { label: 'Travel halted', color: 'text-red-700' };
    if (mod <= -0.2) return { label: 'Travel impaired', color: 'text-orange-600' };
    if (mod < 0) return { label: 'Slightly slower', color: 'text-yellow-700' };
    return { label: 'Good traveling', color: 'text-green-700' };
  }, [weather.travelModifier]);

  const groundColor = GROUND_COLORS[weather.ground] || 'text-trail-brown';

  return (
    <div className={`border border-trail-tan/50 rounded bg-trail-parchment/40 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}>
      <h3 className={`font-bold text-trail-darkBrown uppercase tracking-wider ${compact ? 'text-[10px] mb-1' : 'text-xs mb-1.5'}`}
        style={{ fontVariant: 'small-caps' }}>
        Weather
      </h3>

      {/* Condition + temperature row */}
      <div className={`flex items-center ${compact ? 'gap-1.5 mb-1' : 'gap-2 mb-1.5'}`}>
        <span className={`${compact ? 'text-lg' : 'text-2xl'} leading-none`} title={weather.conditionLabel}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-trail-darkBrown truncate ${compact ? 'text-[11px]' : 'text-sm'}`}>
            {weather.conditionLabel}
          </div>
          <div className={`text-trail-brown ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {temp.current !== undefined ? `${temp.current}°F` : '--'}
            {temp.high !== undefined && (
              <span className="text-trail-brown/60 ml-1">
                (H {temp.high}° / L {temp.low}°)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Wind */}
      <div className={`flex justify-between ${compact ? 'text-[10px] mb-0.5' : 'text-xs mb-1'}`}>
        <span className="text-trail-brown">Wind:</span>
        <span className="text-trail-darkBrown">
          {wind.label || 'Calm'}
          {wind.speed > 5 && ` ${wind.speed} mph ${wind.direction}`}
        </span>
      </div>

      {/* Ground conditions */}
      <div className={`flex justify-between ${compact ? 'text-[10px] mb-0.5' : 'text-xs mb-1'}`}>
        <span className="text-trail-brown">Ground:</span>
        <span className={`font-semibold ${groundColor}`}>
          {weather.groundLabel || 'Firm'}
        </span>
      </div>

      {/* Travel impact */}
      <div className={`flex justify-between ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <span className="text-trail-brown">Travel:</span>
        <span className={`font-semibold ${travelImpact.color}`}>
          {travelImpact.label}
        </span>
      </div>
    </div>
  );
}
