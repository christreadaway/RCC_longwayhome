/**
 * Trip Report & Difficulty Scoring
 *
 * Calculates a comprehensive difficulty index for the completed journey
 * based on all adverse events, weather hardships, dangers encountered,
 * and the player's management decisions.
 *
 * The difficulty index gives context to the player's score — surviving
 * a hard journey is more impressive than an easy one.
 *
 * @module tripReport
 */

// ---------------------------------------------------------------------------
// Difficulty Categories
// ---------------------------------------------------------------------------

const DIFFICULTY_LABELS = {
  0: 'Remarkably Easy',
  1: 'Mild',
  2: 'Moderate',
  3: 'Challenging',
  4: 'Difficult',
  5: 'Very Difficult',
  6: 'Grueling',
  7: 'Severe',
  8: 'Brutal',
  9: 'Harrowing',
  10: 'Nearly Impossible',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a comprehensive trip report from the completed game state.
 * Called at GAME_OVER to produce the final summary.
 *
 * @param {Object} gameState - Final game state
 * @returns {TripReport}
 */
export function generateTripReport(gameState) {
  const weatherLog = gameState.weatherLog || [];
  const eventLog = gameState.eventLog || [];
  const dangerLog = gameState.dangerLog || [];
  const activityLog = gameState.activityLog || [];

  // --- Weather difficulty ---
  const weatherDifficulty = calculateWeatherDifficulty(weatherLog);

  // --- Danger/event difficulty ---
  const dangerDifficulty = calculateDangerDifficulty(dangerLog, eventLog);

  // --- Health difficulty ---
  const healthDifficulty = calculateHealthDifficulty(gameState);

  // --- Supply difficulty ---
  const supplyDifficulty = calculateSupplyDifficulty(gameState);

  // --- Compute overall difficulty index (0-10 scale) ---
  const rawDifficulty = (
    weatherDifficulty.score * 0.25 +
    dangerDifficulty.score * 0.35 +
    healthDifficulty.score * 0.25 +
    supplyDifficulty.score * 0.15
  );

  const difficultyIndex = Math.min(10, Math.round(rawDifficulty * 10) / 10);
  const difficultyLabel = DIFFICULTY_LABELS[Math.min(10, Math.round(difficultyIndex))] || 'Unknown';

  // --- Grace influence summary ---
  const graceInfluence = summarizeGraceInfluence(gameState);

  // --- Build stats ---
  const stats = {
    totalDaysTraveled: gameState.trailDay || 0,
    totalMilesTraveled: gameState.distanceTraveled || 0,
    daysOfBadWeather: weatherLog.filter(w => w.difficultyScore >= 3).length,
    daysOfGoodWeather: weatherLog.filter(w => w.difficultyScore === 0).length,
    dangersEncountered: dangerLog.length,
    positiveEncounters: eventLog.filter(e => e.type === 'positive_encounter').length,
    deathsInParty: (gameState.partyMembers || []).filter(m => !m.alive).length,
    survivorsCount: (gameState.partyMembers || []).filter(m => m.alive).length,
    campActivitiesPerformed: activityLog.length,
    daysRested: gameState.daysRested || 0,
    daysStationary: gameState.totalDaysStationary || 0,
    robberies: dangerLog.filter(d => d.id === 'robbery_armed' || d.id === 'theft_nighttime').length,
    wagonBreakdowns: dangerLog.filter(d => d.category === 'mechanical').length,
    illnessEvents: eventLog.filter(e => e.type === 'illness').length,
    riverCrossings: eventLog.filter(e => e.type === 'river_crossing').length,
  };

  // --- Build category breakdowns for the report ---
  const categories = {
    weather: {
      label: 'Weather Hardship',
      score: weatherDifficulty.score,
      details: weatherDifficulty.details,
    },
    dangers: {
      label: 'Trail Dangers',
      score: dangerDifficulty.score,
      details: dangerDifficulty.details,
    },
    health: {
      label: 'Health & Illness',
      score: healthDifficulty.score,
      details: healthDifficulty.details,
    },
    supplies: {
      label: 'Supply Management',
      score: supplyDifficulty.score,
      details: supplyDifficulty.details,
    },
  };

  return {
    difficultyIndex,
    difficultyLabel,
    graceInfluence,
    stats,
    categories,
    weatherLog: weatherLog.slice(-30), // Last 30 days for display
    dangerLog,
    narrative: buildReportNarrative(difficultyIndex, stats, gameState),
  };
}

// ---------------------------------------------------------------------------
// Internal: Weather difficulty
// ---------------------------------------------------------------------------

function calculateWeatherDifficulty(weatherLog) {
  if (weatherLog.length === 0) {
    return { score: 0, details: 'No weather data recorded.' };
  }

  const totalDifficultyPoints = weatherLog.reduce((sum, w) => sum + (w.difficultyScore || 0), 0);
  const maxPossible = weatherLog.length * 10; // 10 is max per day
  const ratio = totalDifficultyPoints / maxPossible;

  const severeCount = weatherLog.filter(w => w.difficultyScore >= 7).length;
  const badCount = weatherLog.filter(w => w.difficultyScore >= 3).length;

  const details = `${badCount} days of foul weather out of ${weatherLog.length} days traveled. ` +
    `${severeCount} days of severe conditions (storms, blizzards, extreme heat).`;

  return {
    score: Math.min(1, ratio * 3 + severeCount * 0.02),
    details,
  };
}

// ---------------------------------------------------------------------------
// Internal: Danger difficulty
// ---------------------------------------------------------------------------

function calculateDangerDifficulty(dangerLog, eventLog) {
  if (dangerLog.length === 0 && eventLog.length === 0) {
    return { score: 0, details: 'A remarkably uneventful journey.' };
  }

  const totalDangerPoints = dangerLog.reduce((sum, d) => sum + (d.difficulty_score || 0), 0);
  const dangerCount = dangerLog.length;

  // Categorize dangers
  const categoryCounts = {};
  for (const danger of dangerLog) {
    const cat = danger.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  const robberyCount = dangerLog.filter(d => d.id === 'robbery_armed' || d.id === 'theft_nighttime').length;
  const breakdownCount = dangerLog.filter(d => d.category === 'mechanical').length;

  const parts = [];
  if (dangerCount > 0) parts.push(`${dangerCount} dangers encountered`);
  if (robberyCount > 0) parts.push(`${robberyCount} robbery/theft incidents`);
  if (breakdownCount > 0) parts.push(`${breakdownCount} wagon breakdowns`);

  const score = Math.min(1, (totalDangerPoints / 80) + (dangerCount * 0.03));

  return {
    score,
    details: parts.join('. ') || 'Few dangers on the trail.',
  };
}

// ---------------------------------------------------------------------------
// Internal: Health difficulty
// ---------------------------------------------------------------------------

function calculateHealthDifficulty(gameState) {
  const party = gameState.partyMembers || [];
  const dead = party.filter(m => !m.alive).length;
  const sick = party.filter(m => m.alive && (m.health === 'poor' || m.health === 'critical')).length;
  const total = party.length || 1;

  const illnessCount = (gameState.eventLog || []).filter(e => e.type === 'illness').length;

  const deathPenalty = dead / total;
  const illnessPenalty = Math.min(0.3, illnessCount * 0.03);

  const parts = [];
  if (dead > 0) parts.push(`${dead} member${dead > 1 ? 's' : ''} perished`);
  if (illnessCount > 0) parts.push(`${illnessCount} illness events`);
  if (sick > 0) parts.push(`${sick} still ailing at journey's end`);

  return {
    score: Math.min(1, deathPenalty + illnessPenalty + sick * 0.05),
    details: parts.join('. ') || 'The party remained in good health throughout.',
  };
}

// ---------------------------------------------------------------------------
// Internal: Supply difficulty
// ---------------------------------------------------------------------------

function calculateSupplyDifficulty(gameState) {
  const parts = [];
  let score = 0;

  const food = gameState.foodLbs || 0;
  if (food <= 0) {
    score += 0.4;
    parts.push('Arrived with no food remaining');
  } else if (food < 30) {
    score += 0.2;
    parts.push('Nearly out of food at journey\'s end');
  }

  const cash = gameState.cash || 0;
  if (cash <= 0) {
    score += 0.1;
    parts.push('Penniless upon arrival');
  }

  const oxen = gameState.oxenYokes || 0;
  if (oxen <= 1) {
    score += 0.15;
    parts.push('Down to the last yoke of oxen');
  }

  // Check if they had starvation days
  const starvationEvents = (gameState.eventLog || []).filter(e =>
    e.type === 'starvation' || (e.description && e.description.includes('starv'))
  ).length;
  if (starvationEvents > 0) {
    score += 0.2;
    parts.push(`${starvationEvents} days of starvation`);
  }

  return {
    score: Math.min(1, score),
    details: parts.join('. ') || 'Supplies held out through the journey.',
  };
}

// ---------------------------------------------------------------------------
// Internal: Grace influence
// ---------------------------------------------------------------------------

function summarizeGraceInfluence(gameState) {
  const grace = gameState.grace || 50;
  const graceHistory = gameState.graceHistory || [];

  if (grace >= 75) {
    return 'Your family\'s faith and charity brought blessings on the trail. Higher grace brought favorable encounters and warded off the worst of misfortune.';
  } else if (grace >= 40) {
    return 'Your family walked a middle path — neither especially charitable nor selfish. Fortune treated you accordingly.';
  } else if (grace >= 15) {
    return 'Missed opportunities for charity and moments of selfishness drew hardship toward your wagon. The trail seemed to test you more harshly.';
  } else {
    return 'A pattern of selfishness and hard-heartedness brought bitter consequences. The trail was merciless to those who showed no mercy to others.';
  }
}

// ---------------------------------------------------------------------------
// Internal: Narrative
// ---------------------------------------------------------------------------

function buildReportNarrative(difficultyIndex, stats, gameState) {
  const parts = [];

  if (difficultyIndex >= 7) {
    parts.push(`The journey of ${stats.totalDaysTraveled} days and ${stats.totalMilesTraveled} miles was among the most harrowing any emigrant family could endure.`);
  } else if (difficultyIndex >= 4) {
    parts.push(`Over ${stats.totalDaysTraveled} days and ${stats.totalMilesTraveled} miles, the trail tested your family at every turn.`);
  } else {
    parts.push(`Your ${stats.totalDaysTraveled}-day, ${stats.totalMilesTraveled}-mile journey was, by the standards of the Oregon Trail, a fortunate one.`);
  }

  if (stats.daysOfBadWeather > 10) {
    parts.push(`Foul weather plagued ${stats.daysOfBadWeather} days of travel, turning the trail to mud and testing the wagon\'s limits.`);
  }

  if (stats.robberies > 0) {
    parts.push(`Thieves and road agents struck ${stats.robberies} time${stats.robberies > 1 ? 's' : ''}, a grim reminder that not all dangers came from nature.`);
  }

  if (stats.deathsInParty > 0) {
    parts.push(`Most grievously, ${stats.deathsInParty} member${stats.deathsInParty > 1 ? 's' : ''} of the party did not survive to see Oregon.`);
  }

  if (stats.survivorsCount === (gameState.partyMembers || []).length) {
    parts.push('By God\'s grace, every member of the party survived — no small miracle on the Oregon Trail.');
  }

  return parts.join(' ');
}

/**
 * @typedef {Object} TripReport
 * @property {number} difficultyIndex - 0-10 scale
 * @property {string} difficultyLabel - Human-readable label
 * @property {string} graceInfluence - Summary of how grace affected the journey
 * @property {Object} stats - Numerical statistics
 * @property {Object} categories - Category breakdowns
 * @property {Array} weatherLog - Recent weather history
 * @property {Array} dangerLog - All dangers encountered
 * @property {string} narrative - Narrative summary
 */
