/**
 * WeatherBox — Displays current weather conditions in the travel UI.
 *
 * Shows temperature, wind, sky conditions, and ground conditions
 * in a compact box using the Material Design 3 color system.
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

/** Ground condition color coding — Material Design 3 palette */
const GROUND_COLORS = {
  firm: 'text-primary',
  dry: 'text-secondary',
  damp: 'text-tertiary',
  wet: 'text-tertiary',
  muddy: 'text-secondary-dim',
  sloshy: 'text-secondary-dim',
  icy: 'text-tertiary',
  snowpack: 'text-tertiary-dim',
};

export default function WeatherBox({ weather, compact = false }) {
  if (!weather) return null;

  const icon = CONDITION_ICONS[weather.conditionIcon] || '☁';
  const temp = weather.temperature || {};
  const wind = weather.wind || {};

  const travelImpact = useMemo(() => {
    const mod = weather.travelModifier || 0;
    if (mod <= -0.4) return { label: 'Travel halted', color: 'text-error' };
    if (mod <= -0.2) return { label: 'Travel impaired', color: 'text-error/70' };
    if (mod < 0) return { label: 'Slightly slower', color: 'text-secondary' };
    return { label: 'Good traveling', color: 'text-primary' };
  }, [weather.travelModifier]);

  const groundColor = GROUND_COLORS[weather.ground] || 'text-secondary';

  return (
    <div className={`border border-outline-variant/50 rounded bg-surface-variant/40 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}>
      <h3 className={`font-bold text-on-background uppercase tracking-wider ${compact ? 'text-[10px] mb-1' : 'text-xs mb-1.5'}`}
        style={{ fontVariant: 'small-caps' }}>
        Weather
      </h3>

      {/* Condition + temperature row */}
      <div className={`flex items-center ${compact ? 'gap-1.5 mb-1' : 'gap-2 mb-1.5'}`}>
        <span className={`${compact ? 'text-lg' : 'text-2xl'} leading-none`} title={weather.conditionLabel}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-on-background truncate ${compact ? 'text-[11px]' : 'text-sm'}`}>
            {weather.conditionLabel}
          </div>
          <div className={`text-secondary ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {temp.current !== undefined ? `${temp.current}°F` : '--'}
            {temp.high !== undefined && (
              <span className="text-outline-variant/50 ml-1">
                (H {temp.high}° / L {temp.low}°)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Wind */}
      <div className={`flex justify-between ${compact ? 'text-[10px] mb-0.5' : 'text-xs mb-1'}`}>
        <span className="text-secondary">Wind:</span>
        <span className="text-on-background">
          {wind.label || 'Calm'}
          {wind.speed > 5 && ` ${wind.speed} mph ${wind.direction}`}
        </span>
      </div>

      {/* Ground conditions */}
      <div className={`flex justify-between ${compact ? 'text-[10px] mb-0.5' : 'text-xs mb-1'}`}>
        <span className="text-secondary">Ground:</span>
        <span className={`font-semibold ${groundColor}`}>
          {weather.groundLabel || 'Firm'}
        </span>
      </div>

      {/* Travel impact */}
      <div className={`flex justify-between ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <span className="text-secondary">Travel:</span>
        <span className={`font-semibold ${travelImpact.color}`}>
          {travelImpact.label}
        </span>
      </div>
    </div>
  );
}
