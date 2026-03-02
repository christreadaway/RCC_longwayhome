/**
 * Weather System
 *
 * Generates historically-accurate daily weather for the Oregon Trail (1848).
 * Weather is based on month, terrain/geography, and recent history.
 * It affects travel speed, health, morale, and ground conditions.
 *
 * Weather data is deterministic for a given game date + seed, so it
 * produces consistent results if regenerated.
 *
 * @module weather
 */

import { parseGameDate } from '../utils/dateUtils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Wind descriptions and their mph ranges */
const WIND_LEVELS = {
  calm: { min: 0, max: 5, label: 'Calm', travelModifier: 0 },
  light: { min: 5, max: 15, label: 'Light breeze', travelModifier: 0 },
  moderate: { min: 15, max: 25, label: 'Moderate wind', travelModifier: -0.05 },
  strong: { min: 25, max: 40, label: 'Strong wind', travelModifier: -0.15 },
  gale: { min: 40, max: 60, label: 'Gale', travelModifier: -0.35 },
};

/** Sky conditions and their effects */
const CONDITIONS = {
  sunny: { label: 'Sunny', icon: 'sun', travelModifier: 0, moraleModifier: 2, difficultyScore: 0 },
  fair: { label: 'Fair', icon: 'cloud-sun', travelModifier: 0, moraleModifier: 1, difficultyScore: 0 },
  partly_cloudy: { label: 'Partly Cloudy', icon: 'cloud-sun', travelModifier: 0, moraleModifier: 0, difficultyScore: 0 },
  cloudy: { label: 'Cloudy', icon: 'cloud', travelModifier: 0, moraleModifier: -1, difficultyScore: 1 },
  overcast: { label: 'Overcast', icon: 'cloud', travelModifier: -0.05, moraleModifier: -2, difficultyScore: 1 },
  light_rain: { label: 'Light Rain', icon: 'cloud-drizzle', travelModifier: -0.1, moraleModifier: -3, difficultyScore: 2 },
  rain: { label: 'Rain', icon: 'cloud-rain', travelModifier: -0.2, moraleModifier: -5, difficultyScore: 3 },
  heavy_rain: { label: 'Heavy Rain', icon: 'cloud-rain-heavy', travelModifier: -0.35, moraleModifier: -8, difficultyScore: 5 },
  thunderstorm: { label: 'Thunderstorm', icon: 'cloud-lightning', travelModifier: -0.5, moraleModifier: -12, difficultyScore: 7 },
  light_snow: { label: 'Light Snow', icon: 'snowflake', travelModifier: -0.2, moraleModifier: -5, difficultyScore: 4 },
  snow: { label: 'Snow', icon: 'snowflake', travelModifier: -0.4, moraleModifier: -10, difficultyScore: 6 },
  heavy_snow: { label: 'Heavy Snow', icon: 'snowflake-heavy', travelModifier: -0.6, moraleModifier: -15, difficultyScore: 9 },
  blizzard: { label: 'Blizzard', icon: 'wind-snow', travelModifier: -1.0, moraleModifier: -20, difficultyScore: 10 },
  fog: { label: 'Fog', icon: 'fog', travelModifier: -0.15, moraleModifier: -3, difficultyScore: 2 },
  hail: { label: 'Hail', icon: 'hail', travelModifier: -0.4, moraleModifier: -10, difficultyScore: 7 },
  dust_storm: { label: 'Dust Storm', icon: 'wind', travelModifier: -0.5, moraleModifier: -12, difficultyScore: 8 },
};

/** Ground conditions affected by recent weather */
const GROUND_CONDITIONS = {
  firm: { label: 'Firm', travelModifier: 0, difficultyScore: 0 },
  dry: { label: 'Dry & Dusty', travelModifier: -0.05, difficultyScore: 1 },
  damp: { label: 'Damp', travelModifier: -0.05, difficultyScore: 1 },
  wet: { label: 'Wet', travelModifier: -0.1, difficultyScore: 2 },
  muddy: { label: 'Muddy', travelModifier: -0.2, difficultyScore: 3 },
  sloshy: { label: 'Sloshy', travelModifier: -0.3, difficultyScore: 5 },
  icy: { label: 'Icy', travelModifier: -0.35, difficultyScore: 6 },
  snowpack: { label: 'Snow-covered', travelModifier: -0.4, difficultyScore: 7 },
};

/**
 * Historical temperature ranges (Fahrenheit) by month for the Oregon Trail corridor.
 * Based on historical records from the Great Plains, Rocky Mountain, and Pacific NW regions.
 * Each terrain type has a modifier applied.
 */
const MONTHLY_TEMPS = {
  // month: { low, high } — average for Great Plains corridor
  1:  { low: 10, high: 35 },
  2:  { low: 15, high: 40 },
  3:  { low: 25, high: 52 },
  4:  { low: 35, high: 62 },  // Game starts April 1
  5:  { low: 45, high: 72 },
  6:  { low: 55, high: 85 },
  7:  { low: 60, high: 95 },
  8:  { low: 58, high: 92 },
  9:  { low: 48, high: 80 },
  10: { low: 35, high: 65 },
  11: { low: 22, high: 48 },
  12: { low: 12, high: 35 },
};

/** Terrain-based temperature adjustments */
const TERRAIN_TEMP_MODIFIER = {
  plains: 0,
  hills: -3,
  mountains: -12,
  river: -2,
  desert: 8,
  town: 0,
  fort: 0,
  mission: -2,
  natural: 0,
  destination: 0,
};

/** Weather probability weights by month — what's more likely when */
const MONTHLY_WEATHER_WEIGHTS = {
  // April: Spring storms, some rain, mostly fair
  4: { sunny: 15, fair: 20, partly_cloudy: 20, cloudy: 15, light_rain: 12, rain: 8, heavy_rain: 3, thunderstorm: 4, fog: 3 },
  // May: Warming, thunderstorm season begins
  5: { sunny: 18, fair: 20, partly_cloudy: 15, cloudy: 12, light_rain: 10, rain: 8, heavy_rain: 4, thunderstorm: 8, fog: 2, hail: 3 },
  // June: Hot, thunderstorms common on plains
  6: { sunny: 22, fair: 20, partly_cloudy: 15, cloudy: 8, light_rain: 8, rain: 6, heavy_rain: 4, thunderstorm: 10, dust_storm: 4, hail: 3 },
  // July: Hottest month, dry except for sudden storms
  7: { sunny: 28, fair: 22, partly_cloudy: 15, cloudy: 5, light_rain: 5, rain: 4, heavy_rain: 3, thunderstorm: 8, dust_storm: 7, hail: 3 },
  // August: Still hot, storm frequency drops
  8: { sunny: 25, fair: 22, partly_cloudy: 18, cloudy: 8, light_rain: 7, rain: 5, heavy_rain: 3, thunderstorm: 6, dust_storm: 4, hail: 2 },
  // September: Cooling, rain increases
  9: { sunny: 18, fair: 20, partly_cloudy: 18, cloudy: 15, light_rain: 10, rain: 8, heavy_rain: 4, thunderstorm: 3, fog: 4 },
  // October: Cold approaching, rain/early snow
  10: { sunny: 12, fair: 15, partly_cloudy: 15, cloudy: 18, overcast: 10, light_rain: 10, rain: 5, light_snow: 5, fog: 5, heavy_rain: 3, snow: 2 },
  // November: Cold, snow in mountains
  11: { sunny: 8, fair: 10, partly_cloudy: 10, cloudy: 15, overcast: 15, light_rain: 5, rain: 3, light_snow: 12, snow: 10, heavy_snow: 5, fog: 4, blizzard: 3 },
  // December: Winter, blizzard risk
  12: { sunny: 5, fair: 8, partly_cloudy: 8, cloudy: 12, overcast: 15, light_snow: 15, snow: 15, heavy_snow: 10, blizzard: 8, fog: 4 },
};

/** Mountain terrain shifts weather probabilities toward cold/snow */
const TERRAIN_WEATHER_SHIFT = {
  mountains: { snow_boost: 15, cold_shift: true },
  river: { fog_boost: 8, rain_boost: 5 },
  desert: { dust_boost: 10, dry_boost: true },
  plains: {},
  hills: { cold_shift_minor: true },
};

// ---------------------------------------------------------------------------
// Seeded random (deterministic per game day)
// ---------------------------------------------------------------------------

/**
 * Simple seeded PRNG for deterministic weather generation.
 * Same date + seed always produces same weather.
 */
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * Creates a numeric seed from a date string.
 */
function dateSeed(dateStr) {
  let hash = 0;
  const str = dateStr + '_weather_1848';
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates weather for a specific game date at the given terrain.
 *
 * @param {string} gameDate - Game date string (YYYY-MM-DD)
 * @param {string} terrainType - Current terrain type from landmarks data
 * @param {Array<Object>} recentWeather - Last 3-5 days of weather (for ground conditions)
 * @returns {WeatherReport}
 */
export function generateWeather(gameDate, terrainType, recentWeather = []) {
  const date = parseGameDate(gameDate);
  const month = date.getMonth() + 1;
  const rand = seededRandom(dateSeed(gameDate));

  // Temperature
  const temp = generateTemperature(month, terrainType, rand);

  // Conditions
  const condition = generateCondition(month, terrainType, temp, rand);

  // Wind
  const wind = generateWind(month, condition, rand);

  // Ground conditions based on recent weather
  const ground = calculateGroundConditions(recentWeather, temp, terrainType);

  // Calculate travel modifier (combined effect)
  const conditionData = CONDITIONS[condition] || CONDITIONS.fair;
  const windData = WIND_LEVELS[wind.level] || WIND_LEVELS.calm;
  const groundData = GROUND_CONDITIONS[ground] || GROUND_CONDITIONS.firm;

  const weatherTravelModifier = conditionData.travelModifier + windData.travelModifier + groundData.travelModifier;

  // Difficulty score for this day
  const difficultyScore = conditionData.difficultyScore + groundData.difficultyScore +
    (wind.level === 'gale' ? 5 : wind.level === 'strong' ? 2 : 0);

  return {
    date: gameDate,
    temperature: temp,
    condition,
    conditionLabel: conditionData.label,
    conditionIcon: conditionData.icon,
    wind,
    ground,
    groundLabel: GROUND_CONDITIONS[ground]?.label || 'Firm',
    travelModifier: Math.max(-1, weatherTravelModifier),
    moraleModifier: conditionData.moraleModifier,
    difficultyScore,
    description: buildWeatherDescription(temp, conditionData, wind, groundData),
  };
}

/**
 * Calculates the effective daily miles accounting for weather.
 *
 * @param {number} baseMiles - Base daily miles (from pace)
 * @param {Object} weather - Weather report from generateWeather()
 * @returns {number} Adjusted miles (minimum 0)
 */
export function applyWeatherToTravel(baseMiles, weather) {
  const modifier = 1 + (weather.travelModifier || 0);
  return Math.max(0, Math.round(baseMiles * modifier));
}

/**
 * Returns all weather-related constants for display.
 */
export function getWeatherConstants() {
  return { CONDITIONS, WIND_LEVELS, GROUND_CONDITIONS };
}

// ---------------------------------------------------------------------------
// Internal: Temperature
// ---------------------------------------------------------------------------

function generateTemperature(month, terrainType, rand) {
  const range = MONTHLY_TEMPS[month] || MONTHLY_TEMPS[6];
  const terrainMod = TERRAIN_TEMP_MODIFIER[terrainType] || 0;

  // Random variation within the monthly range
  const base = range.low + rand() * (range.high - range.low);

  // Daily variance (+/- 8 degrees)
  const variance = (rand() - 0.5) * 16;

  const temp = Math.round(base + terrainMod + variance);

  return {
    high: Math.round(temp + 5 + rand() * 8),
    low: Math.round(temp - 5 - rand() * 8),
    current: temp,
  };
}

// ---------------------------------------------------------------------------
// Internal: Condition selection
// ---------------------------------------------------------------------------

function generateCondition(month, terrainType, temp, rand) {
  const weights = { ...(MONTHLY_WEATHER_WEIGHTS[month] || MONTHLY_WEATHER_WEIGHTS[6]) };

  // Apply terrain shifts
  const shift = TERRAIN_WEATHER_SHIFT[terrainType] || {};

  if (shift.snow_boost && temp.current < 40) {
    weights.light_snow = (weights.light_snow || 0) + shift.snow_boost;
    weights.snow = (weights.snow || 0) + Math.round(shift.snow_boost * 0.6);
    weights.heavy_snow = (weights.heavy_snow || 0) + Math.round(shift.snow_boost * 0.3);
    // Reduce rain when snowing
    weights.rain = Math.max(0, (weights.rain || 0) - 5);
    weights.light_rain = Math.max(0, (weights.light_rain || 0) - 5);
  }

  if (shift.fog_boost) {
    weights.fog = (weights.fog || 0) + shift.fog_boost;
  }

  if (shift.rain_boost) {
    weights.rain = (weights.rain || 0) + shift.rain_boost;
    weights.light_rain = (weights.light_rain || 0) + shift.rain_boost;
  }

  if (shift.dust_boost && temp.current > 70) {
    weights.dust_storm = (weights.dust_storm || 0) + shift.dust_boost;
    weights.sunny = (weights.sunny || 0) + 5;
    // Less rain in desert
    weights.rain = Math.max(0, (weights.rain || 0) - 5);
  }

  // Can't snow if it's warm
  if (temp.current > 40) {
    delete weights.light_snow;
    delete weights.snow;
    delete weights.heavy_snow;
    delete weights.blizzard;
  }

  // Can't have dust storm in wet conditions or snow
  if (temp.current < 50) {
    delete weights.dust_storm;
  }

  // Weighted random selection
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = rand() * totalWeight;

  for (const [condition, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return condition;
  }

  return 'fair';
}

// ---------------------------------------------------------------------------
// Internal: Wind
// ---------------------------------------------------------------------------

function generateWind(month, condition, rand) {
  // Base wind chance varies by month (windier in spring and late fall)
  const windChances = {
    4: 0.4, 5: 0.35, 6: 0.3, 7: 0.25, 8: 0.25,
    9: 0.3, 10: 0.4, 11: 0.5, 12: 0.55,
  };

  const baseChance = windChances[month] || 0.3;

  // Storms always have wind
  const stormConditions = ['thunderstorm', 'blizzard', 'dust_storm', 'heavy_snow'];
  const isStorm = stormConditions.includes(condition);

  let level = 'calm';
  let speed = Math.round(rand() * 5);

  if (isStorm) {
    // Storms have strong to gale winds
    const stormRoll = rand();
    if (stormRoll < 0.4) {
      level = 'strong';
      speed = 25 + Math.round(rand() * 15);
    } else {
      level = 'gale';
      speed = 40 + Math.round(rand() * 20);
    }
  } else if (rand() < baseChance) {
    const roll = rand();
    if (roll < 0.5) {
      level = 'light';
      speed = 5 + Math.round(rand() * 10);
    } else if (roll < 0.85) {
      level = 'moderate';
      speed = 15 + Math.round(rand() * 10);
    } else {
      level = 'strong';
      speed = 25 + Math.round(rand() * 15);
    }
  }

  // Wind direction (flavor only)
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const direction = directions[Math.floor(rand() * directions.length)];

  return {
    level,
    speed,
    direction,
    label: WIND_LEVELS[level]?.label || 'Calm',
  };
}

// ---------------------------------------------------------------------------
// Internal: Ground conditions
// ---------------------------------------------------------------------------

/**
 * Calculates ground conditions based on recent weather history.
 * Rain accumulates moisture; sun/wind dries things out.
 */
function calculateGroundConditions(recentWeather, temp, terrainType) {
  if (!recentWeather || recentWeather.length === 0) {
    return 'firm';
  }

  // Calculate moisture score from recent days
  let moisture = 0;

  const moistureContribution = {
    light_rain: 2,
    rain: 4,
    heavy_rain: 7,
    thunderstorm: 6,
    light_snow: 1,
    snow: 3,
    heavy_snow: 5,
    blizzard: 6,
    fog: 1,
    hail: 2,
  };

  const dryingContribution = {
    sunny: -3,
    fair: -2,
    partly_cloudy: -1,
    cloudy: 0,
    overcast: 0,
  };

  for (const day of recentWeather) {
    const condition = day.condition || 'fair';
    moisture += moistureContribution[condition] || 0;
    moisture += dryingContribution[condition] || 0;

    // Strong wind dries ground
    if (day.wind && day.wind.level === 'strong') moisture -= 1;
    if (day.wind && day.wind.level === 'gale') moisture -= 2;
  }

  // Temperature affects ground: freezing = icy, warm = dries faster
  if (temp.current < 32 && moisture > 2) {
    return 'icy';
  }
  if (temp.current < 32 && moisture > 5) {
    return 'snowpack';
  }

  // Terrain affects drainage
  if (terrainType === 'river') moisture += 2;
  if (terrainType === 'mountains') moisture -= 1; // better drainage
  if (terrainType === 'desert') moisture -= 3;

  // Map moisture to ground condition
  if (moisture <= 0) return terrainType === 'desert' ? 'dry' : 'firm';
  if (moisture <= 2) return 'damp';
  if (moisture <= 4) return 'wet';
  if (moisture <= 7) return 'muddy';
  return 'sloshy';
}

// ---------------------------------------------------------------------------
// Internal: Description builder
// ---------------------------------------------------------------------------

function buildWeatherDescription(temp, conditionData, wind, groundData) {
  const parts = [];

  // Temperature feel
  if (temp.current > 95) {
    parts.push('Scorching heat bears down on the wagon train');
  } else if (temp.current > 85) {
    parts.push('The day is hot and the sun relentless');
  } else if (temp.current > 70) {
    parts.push('A warm day');
  } else if (temp.current > 55) {
    parts.push('Pleasant temperatures');
  } else if (temp.current > 40) {
    parts.push('A chill hangs in the air');
  } else if (temp.current > 25) {
    parts.push('Bitter cold grips the trail');
  } else {
    parts.push('Dangerously cold temperatures');
  }

  // Sky
  const condDesc = {
    sunny: 'with clear skies overhead',
    fair: 'under mostly clear skies',
    partly_cloudy: 'with scattered clouds',
    cloudy: 'beneath a blanket of grey clouds',
    overcast: 'under heavy, leaden skies',
    light_rain: 'with a steady drizzle falling',
    rain: 'as rain soaks the trail',
    heavy_rain: 'as torrential rain pounds the wagons',
    thunderstorm: 'as thunder rolls and lightning cracks the sky',
    light_snow: 'as gentle snowflakes drift down',
    snow: 'as snow blankets the landscape',
    heavy_snow: 'as a heavy snowfall reduces visibility',
    blizzard: 'as a howling blizzard engulfs everything',
    fog: 'as thick fog obscures the trail ahead',
    hail: 'as hailstones pelt the wagon covers',
    dust_storm: 'as choking dust swirls in every direction',
  };

  parts.push(condDesc[Object.keys(CONDITIONS).find(k => CONDITIONS[k] === conditionData)] || 'under uncertain skies');

  // Wind
  if (wind.level === 'strong') {
    parts.push(`Strong ${wind.direction} winds make progress difficult`);
  } else if (wind.level === 'gale') {
    parts.push(`Gale-force winds from the ${wind.direction} threaten to overturn wagons`);
  }

  // Ground
  if (groundData.travelModifier < -0.15) {
    const groundDesc = {
      muddy: 'Wheels sink into deep mud with every turn',
      sloshy: 'The trail is a waterlogged mess — wagons struggle through standing water',
      icy: 'Ice makes footing treacherous for oxen and travelers alike',
      snowpack: 'Deep snow buries the trail, slowing progress to a crawl',
    };
    const key = Object.keys(GROUND_CONDITIONS).find(k => GROUND_CONDITIONS[k] === groundData);
    if (groundDesc[key]) {
      parts.push(groundDesc[key]);
    }
  }

  return parts.join('. ') + '.';
}

/**
 * @typedef {Object} WeatherReport
 * @property {string} date - Game date
 * @property {{ high: number, low: number, current: number }} temperature - Fahrenheit
 * @property {string} condition - Condition key (e.g., 'rain', 'sunny')
 * @property {string} conditionLabel - Human-readable condition
 * @property {string} conditionIcon - Icon identifier
 * @property {{ level: string, speed: number, direction: string, label: string }} wind
 * @property {string} ground - Ground condition key
 * @property {string} groundLabel - Human-readable ground condition
 * @property {number} travelModifier - Combined travel modifier (-1 to 0)
 * @property {number} moraleModifier - Morale impact
 * @property {number} difficultyScore - Daily difficulty score (0-10+)
 * @property {string} description - Narrative weather description
 */
