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
    morale: gs.morale !== undefined ? gs.morale : '',
    cash_remaining: gs.cash !== undefined ? gs.cash : '',
    food_remaining: gs.food !== undefined ? gs.food : '',
    cwm_events_count: cwmEvents.length,
    cwm_events_detail: cwmSummary,
    sunday_rests: sundayRests,
    last_rites: lastRitesSummary,
    decisions: decisions,
    historian_query_count: historianCount,
    knowledge_panel_clicks: knowledgePanelCount,
    knowledge_panel_ids: knowledgePanelIds,
    npc_encounters: npcSummary,
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
  'morale',
  'cash_remaining',
  'food_remaining',
  'cwm_events_count',
  'cwm_events_detail',
  'sunday_rests',
  'last_rites',
  'decisions',
  'historian_query_count',
  'knowledge_panel_clicks',
  'knowledge_panel_ids',
  'npc_encounters',
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

    const filename = `pioneer-trail-${code}-${new Date().toISOString().split('T')[0]}.csv`;

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
