/**
 * WeatherBox — Displays current weather conditions in the travel UI.
 *
 * Shows temperature, wind, sky conditions, and ground conditions
 * in a compact box styled to match the trail-era aesthetic.
 */

import { useMemo } from 'react';

/** Weather condition icons using Unicode/text symbols for simplicity */
const CONDITION_ICONS = {
  'sun': '\u2600',             // ☀
  'cloud-sun': '\u26C5',      // ⛅
  'cloud': '\u2601',          // ☁
  'cloud-drizzle': '\uD83C\uDF27', // 🌧
  'cloud-rain': '\uD83C\uDF27',
  'cloud-rain-heavy': '\uD83C\uDF27',
  'cloud-lightning': '\u26C8',  // ⛈
  'snowflake': '\u2744',       // ❄
  'snowflake-heavy': '\u2744',
  'wind-snow': '\uD83C\uDF28', // 🌨
  'fog': '\uD83C\uDF2B',      // 🌫
  'hail': '\uD83C\uDF28',
  'wind': '\uD83C\uDF2C',     // 🌬
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

export default function WeatherBox({ weather }) {
  if (!weather) return null;

  const icon = CONDITION_ICONS[weather.conditionIcon] || '\u2601';
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
    <div className="border border-trail-tan/50 rounded bg-trail-parchment/40 px-2.5 py-1.5">
      <h3 className="text-[10px] font-bold text-trail-darkBrown uppercase tracking-wider mb-1"
        style={{ fontVariant: 'small-caps' }}>
        Weather
      </h3>

      {/* Condition + temperature row */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-lg leading-none" title={weather.conditionLabel}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-trail-darkBrown truncate">
            {weather.conditionLabel}
          </div>
          <div className="text-[10px] text-trail-brown">
            {temp.current !== undefined ? `${temp.current}\u00B0F` : '--'}
            {temp.high !== undefined && (
              <span className="text-trail-brown/60 ml-1">
                (H {temp.high}\u00B0 / L {temp.low}\u00B0)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Wind */}
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-trail-brown">Wind:</span>
        <span className="text-trail-darkBrown">
          {wind.label || 'Calm'}
          {wind.speed > 5 && ` ${wind.speed} mph ${wind.direction}`}
        </span>
      </div>

      {/* Ground conditions */}
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-trail-brown">Ground:</span>
        <span className={`font-semibold ${groundColor}`}>
          {weather.groundLabel || 'Firm'}
        </span>
      </div>

      {/* Travel impact */}
      <div className="flex justify-between text-[10px]">
        <span className="text-trail-brown">Travel:</span>
        <span className={`font-semibold ${travelImpact.color}`}>
          {travelImpact.label}
        </span>
      </div>
    </div>
  );
}
