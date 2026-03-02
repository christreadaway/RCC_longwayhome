/**
 * Tests for the Camp Activities System
 */

import { getAvailableActivities, executeActivity, selectFamilyDialogue, CAMP_ACTIVITIES } from '../campActivities.js';

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, error: e.message });
  }
}
function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// Mock game states
const baseState68 = {
  gradeBand: '6_8',
  morale: 50,
  grace: 50,
  foodLbs: 100,
  cash: 200,
  oxenYokes: 3,
  ammoBoxes: 5,
  clothingSets: 4,
  spareParts: { wheels: 1, axles: 1, tongues: 1 },
  trailDay: 10,
  partyMembers: [
    { name: 'John', health: 'good', alive: true, isLeader: true },
    { name: 'Mary', health: 'fair', alive: true },
    { name: 'Sarah', health: 'good', alive: true },
  ],
  chaplainInParty: false,
  activityCooldowns: {},
  daysStationary: 0,
};

const baseStateK2 = {
  ...baseState68,
  gradeBand: 'k2',
};

const flags68 = { supplySystem: true, sundayRest: true, feastDays: true };
const flagsK2 = { supplySystem: false, sundayRest: false };

// --- Tests ---

test('CAMP_ACTIVITIES has expected activities', () => {
  assert(CAMP_ACTIVITIES.talk_family, 'Should have talk_family');
  assert(CAMP_ACTIVITIES.tend_oxen, 'Should have tend_oxen');
  assert(CAMP_ACTIVITIES.cook_meal, 'Should have cook_meal');
  assert(CAMP_ACTIVITIES.pray, 'Should have pray');
  assert(CAMP_ACTIVITIES.attend_mass, 'Should have attend_mass');
  assert(CAMP_ACTIVITIES.confession, 'Should have confession');
  assert(CAMP_ACTIVITIES.children_play, 'Should have children_play');
  assert(CAMP_ACTIVITIES.mend_wagon, 'Should have mend_wagon');
  assert(CAMP_ACTIVITIES.help_emigrants, 'Should have help_emigrants');
});

test('6-8 grade band has more activities than K-2', () => {
  const activities68 = getAvailableActivities(baseState68, flags68);
  const activitiesK2 = getAvailableActivities(baseStateK2, flagsK2);
  assert(activities68.length > activitiesK2.length,
    `6-8 (${activities68.length}) should have more than K-2 (${activitiesK2.length})`);
});

test('K-2 can still talk to family and pray', () => {
  const activities = getAvailableActivities(baseStateK2, flagsK2);
  const ids = activities.map(a => a.id);
  assert(ids.includes('talk_family'), 'K-2 should have talk_family');
  assert(ids.includes('pray'), 'K-2 should have pray');
  assert(ids.includes('children_play'), 'K-2 should have children_play');
});

test('Mass is only available at missions', () => {
  const activities = getAvailableActivities(baseState68, flags68);
  const massActivity = activities.find(a => a.id === 'attend_mass');
  assert(!massActivity, 'Mass should not be available when not at a mission');

  const atMission = {
    ...baseState68,
    currentLandmarkData: { type: 'mission', name: "St. Mary's Mission" },
  };
  const missionActivities = getAvailableActivities(atMission, flags68);
  const mass = missionActivities.find(a => a.id === 'attend_mass');
  assert(mass, 'Mass should be available at a mission');
});

test('activity cooldowns work', () => {
  const cooledDown = {
    ...baseState68,
    activityCooldowns: { tend_oxen: 10 }, // Used on day 10, cooldown = 1
    trailDay: 10,
  };
  const activities = getAvailableActivities(cooledDown, flags68);
  const oxen = activities.find(a => a.id === 'tend_oxen');
  assert(oxen, 'Tend oxen should be in list');
  assert(!oxen.available, 'Tend oxen should be on cooldown');
});

test('executeActivity returns effects and message', () => {
  const result = executeActivity('talk_family', baseState68);
  assert(result.message, 'Should return a message');
  assert(typeof result.timeCost === 'number', 'Should return time cost');
  assert(result.effects.morale > 0, 'Should boost morale');
});

test('cook_meal costs extra food', () => {
  const result = executeActivity('cook_meal', baseState68);
  assert(result.effects.foodCost > 0, 'Should have food cost');
  assert(result.effects.morale > 0, 'Should boost morale');
});

test('tend_oxen gives travel bonus', () => {
  const result = executeActivity('tend_oxen', baseState68);
  assert(result.effects.oxenChecked === true, 'Should mark oxen as checked');
  assert(result.effects.travelBonus > 0, 'Should give travel bonus');
});

test('confession clears reconciliation', () => {
  const result = executeActivity('confession', baseState68);
  assert(result.effects.reconciliationClear === true, 'Should clear reconciliation');
  assert(result.effects.grace > 0, 'Should increase grace');
});

test('selectFamilyDialogue returns appropriate dialogue for low morale', () => {
  const lowMorale = { ...baseState68, morale: 15 };
  const dialogue = selectFamilyDialogue(lowMorale);
  assert(dialogue.speaker, 'Should have a speaker');
  assert(dialogue.text, 'Should have text');
  assert(dialogue.mood, 'Should have mood');
});

test('selectFamilyDialogue includes sick member references', () => {
  const sickState = {
    ...baseState68,
    morale: 50,
    partyMembers: [
      { name: 'John', health: 'good', alive: true, isLeader: true },
      { name: 'Mary', health: 'critical', alive: true },
    ],
  };
  // Run multiple times to increase chance of getting a sick-specific line
  let gotSickLine = false;
  for (let i = 0; i < 20; i++) {
    const d = selectFamilyDialogue(sickState);
    if (d.text.includes('Mary')) {
      gotSickLine = true;
      break;
    }
  }
  assert(gotSickLine, 'Should eventually reference the sick member by name');
});

test('all activity descriptions are 1848-appropriate', () => {
  for (const [key, activity] of Object.entries(CAMP_ACTIVITIES)) {
    assert(!activity.description.includes('phone'), `${key} mentions phone`);
    assert(!activity.description.includes('internet'), `${key} mentions internet`);
    assert(!activity.description.includes('app'), `${key} mentions app`);
    assert(!activity.description.includes('email'), `${key} mentions email`);
    assert(!activity.description.includes('text'), `${key} mentions texting`);
  }
});

// --- Report ---
console.log('\n=== Camp Activities Tests ===');
results.forEach(r => {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}: ${r.name}${r.error ? ` - ${r.error}` : ''}`);
});
const passed = results.filter(r => r.pass).length;
console.log(`\n${passed}/${results.length} tests passed\n`);

if (passed < results.length) {
  process.exit(1);
}
