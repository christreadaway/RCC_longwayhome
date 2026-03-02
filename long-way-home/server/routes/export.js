/**
 * Express router for CSV data export.
 *
 * GET /api/export/:code/csv
 *   - Generates a CSV file with all student data for a session
 *   - Includes: student name, final location, survivors, scores, grace,
 *     decisions, CWM events with deceptive flags, Sunday rests, Last Rites,
 *     historian queries, knowledge panel clicks, NPC encounters
 *   - Returns as a downloadable CSV file
 */

const express = require('express');
const { logger } = require('../logger');
const store = require('../state/store');

const router = express.Router();

/* ------------------------------------------------------------------ */
/*  CSV helper utilities                                                */
/* ------------------------------------------------------------------ */

/**
 * Escape a value for CSV output. Wraps in quotes if it contains
 * commas, quotes, or newlines.
 */
function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Convert an array of objects to CSV string.
 * @param {string[]} headers - Column headers
 * @param {object[]} rows    - Data rows (each row is an object keyed by header)
 * @returns {string}
 */
function toCSV(headers, rows) {
  const headerLine = headers.map(csvEscape).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => csvEscape(row[h])).join(',')
  );
  return [headerLine, ...dataLines].join('\r\n');
}

/* ------------------------------------------------------------------ */
/*  Extract data from game state                                        */
/* ------------------------------------------------------------------ */

function extractStudentRow(studentState) {
  const gs = studentState.gameState || {};

  // Party survivors
  const partyMembers = gs.party_members || [];
  const survivors = partyMembers.filter((m) => m.health !== 'dead');
  const deaths = partyMembers.filter((m) => m.health === 'dead');

  // CWM events
  const cwmEvents = gs.cwm_events || [];
  const cwmSummary = cwmEvents.map((e) => {
    const deceptive = e.recipient_genuine === false ? ' [DECEPTIVE]' : '';
    return `${e.type || 'unknown'}:${e.choice || 'unknown'}${deceptive}`;
  }).join('; ');

  // Event log decisions
  const eventLog = gs.event_log || [];
  const decisions = eventLog
    .filter((e) => e.choice)
    .map((e) => `${e.type || e.event_type || 'event'}:${e.choice}`)
    .join('; ');

  // Sunday rests
  const sundayRests = gs.sunday_rests || 0;

  // Last Rites
  const lastRites = gs.last_rites || [];
  const lastRitesSummary = Array.isArray(lastRites)
    ? lastRites.map((lr) => lr.member || lr).join('; ')
    : String(lastRites);

  // Historian queries
  const historianQueries = gs.historian_queries || [];
  const historianCount = Array.isArray(historianQueries) ? historianQueries.length : 0;

  // Knowledge panel clicks
  const knowledgePanelClicks = gs.knowledge_panel_clicks || [];
  const knowledgePanelCount = Array.isArray(knowledgePanelClicks) ? knowledgePanelClicks.length : 0;
  const knowledgePanelIds = Array.isArray(knowledgePanelClicks)
    ? knowledgePanelClicks.map((c) => c.card_id || c).join('; ')
    : '';

  // NPC encounters
  const npcEncounters = gs.npc_encounters || [];
  const npcSummary = Array.isArray(npcEncounters)
    ? npcEncounters.map((n) => `${n.character || 'unknown'}(${n.exchanges || 0})`).join('; ')
    : '';

  // Grace range
  const grace = gs.grace !== undefined ? gs.grace : 0;
  const graceRange = grace >= 75 ? 'HIGH' : grace >= 40 ? 'MODERATE' : grace >= 15 ? 'LOW' : 'DEPLETED';

  // Deceptive CWM count
  const cwmDeceptiveCount = cwmEvents.filter((e) => e.recipient_genuine === false).length;

  // Reconciliation events
  const reconciliationLog = gs.reconciliation_log || [];
  const reconciliationSummary = Array.isArray(reconciliationLog)
    ? reconciliationLog.map((r) => `${r.type || 'unknown'}:${r.taken ? 'taken' : 'declined'}`).join('; ')
    : '';

  // Reciprocity events
  const reciprocityLog = gs.reciprocity_log || [];
  const reciprocitySummary = Array.isArray(reciprocityLog)
    ? reciprocityLog.map((r) => `${r.type || 'unknown'}`).join('; ')
    : '';

  // Sunday rests skipped
  const sundayRestsSkipped = gs.sunday_rests_skipped || 0;

  // Feast days
  const feastDays = gs.feast_days_encountered || [];
  const feastDaySummary = Array.isArray(feastDays) ? feastDays.join('; ') : '';

  // Prayers offered
  const prayersOffered = gs.prayers_offered || 0;

  // Moral labels dismissed count
  const moralLabelsDismissed = gs.moral_labels_dismissed || [];
  const moralLabelsDismissedCount = Array.isArray(moralLabelsDismissed) ? moralLabelsDismissed.length : 0;

  return {
    student_name: studentState.studentName || '',
    student_id: studentState.studentId || '',
    final_state: gs.state || '',
    current_landmark: gs.current_landmark || '',
    miles_traveled: gs.miles_traveled || 0,
    game_date: gs.game_date || '',
    party_size: partyMembers.length,
    survivors: survivors.length,
    survivor_names: survivors.map((m) => m.name || 'Unknown').join('; '),
    deaths_count: deaths.length,
    death_names: deaths.map((m) => m.name || 'Unknown').join('; '),
    grace: gs.grace !== undefined ? gs.grace : '',
    grace_range: graceRange,
    morale: gs.morale !== undefined ? gs.morale : '',
    score: gs.score || 0,
    grace_adjusted_score: gs.grace_adjusted_score || 0,
    cash_remaining: gs.cash !== undefined ? gs.cash : '',
    food_remaining: gs.food !== undefined ? gs.food : '',
    profession: gs.profession || '',
    chaplain_in_party: gs.chaplain_in_party ? 'Yes' : 'No',
    cwm_events_count: cwmEvents.length,
    cwm_events_detail: cwmSummary,
    cwm_deceptive_count: cwmDeceptiveCount,
    reconciliation_events: reconciliationSummary,
    reciprocity_events: reciprocitySummary,
    sunday_rests: sundayRests,
    sunday_rests_skipped: sundayRestsSkipped,
    feast_days: feastDaySummary,
    last_rites: lastRitesSummary,
    prayers_offered: prayersOffered,
    decisions: decisions,
    historian_query_count: historianCount,
    knowledge_panel_clicks: knowledgePanelCount,
    knowledge_panel_ids: knowledgePanelIds,
    npc_encounters: npcSummary,
    moral_labels_dismissed: moralLabelsDismissedCount,
    life_in_oregon: gs.life_in_oregon_narrative || '',
    joined_at: studentState.joinedAt || '',
    last_update: studentState.lastUpdateAt || '',
  };
}

/* ------------------------------------------------------------------ */
/*  GET /:code/csv                                                      */
/* ------------------------------------------------------------------ */

const CSV_HEADERS = [
  'student_name',
  'student_id',
  'final_state',
  'current_landmark',
  'miles_traveled',
  'game_date',
  'party_size',
  'survivors',
  'survivor_names',
  'deaths_count',
  'death_names',
  'grace',
  'grace_range',
  'morale',
  'score',
  'grace_adjusted_score',
  'cash_remaining',
  'food_remaining',
  'profession',
  'chaplain_in_party',
  'cwm_events_count',
  'cwm_events_detail',
  'cwm_deceptive_count',
  'reconciliation_events',
  'reciprocity_events',
  'sunday_rests',
  'sunday_rests_skipped',
  'feast_days',
  'last_rites',
  'prayers_offered',
  'decisions',
  'historian_query_count',
  'knowledge_panel_clicks',
  'knowledge_panel_ids',
  'npc_encounters',
  'moral_labels_dismissed',
  'life_in_oregon',
  'joined_at',
  'last_update',
];

router.get('/:code/csv', (req, res) => {
  try {
    const { code } = req.params;

    const session = store.getSession(code);
    if (!session) {
      return res.status(404).json({ error: `Session "${code}" not found` });
    }

    const students = store.getStudentStates(code);
    const rows = students.map(extractStudentRow);
    const csv = toCSV(CSV_HEADERS, rows);

    const filename = `long-way-home-${code}-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info('CSV_EXPORTED', {
      sessionCode: code,
      studentCount: students.length,
    });

    return res.send(csv);
  } catch (err) {
    logger.error('CSV_EXPORT_ERROR', { code: req.params.code, error: err.message });
    return res.status(500).json({ error: 'Failed to generate CSV export' });
  }
});

module.exports = router;
