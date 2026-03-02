/**
 * Profession Balance Playtest Simulation
 *
 * Tests multiple cash configurations to find values where:
 *   Tradesman = EASY  (best skills, can fix anything)
 *   Farmer    = MEDIUM (balanced)
 *   Banker    = HARD   (most money but no trail skills)
 *
 * Run: node --loader ./loader.mjs balancePlaytest.mjs
 */
import {
  PROFESSION_CASH, PROFESSION_REPAIR, CHAPLAIN_COSTS,
  STORE_BOOKS, STORE_TOOLS, STORE_BIBLE,
  PACE_MULTIPLIER, RATIONS_CONSUMPTION,
  GAME_CONSTANTS, GRACE_DELTAS, HEALTH_ORDER
} from '@shared/types';

const NUM_RUNS = 500;
const TOTAL_MILES = 2040;
const MAX_DAYS = 270;

function createState(profession, cashOverride, buy) {
  const cash = cashOverride;
  const b = buy(cash);
  return {
    profession, cash: b.remaining,
    foodLbs: b.food, waterGallons: b.water, clothingSets: b.clothing,
    ammoBoxes: b.ammo, oxenYokes: b.oxen,
    spareParts: { wheels: b.wheels, axles: b.axles, tongues: b.tongues },
    hasFarmersAlmanac: b.fa, hasTrailGuide: b.tg, hasToolSet: b.ts, hasBible: b.bi,
    chaplainInParty: false,
    party: [
      { name: 'Leader', health: 'good', alive: true },
      { name: 'Spouse', health: 'good', alive: true },
      { name: 'Child1', health: 'good', alive: true },
      { name: 'Child2', health: 'good', alive: true }
    ],
    pace: 'steady', rations: 'filling',
    dist: 0, day: 1, morale: 70, grace: 50,
    dangerCount: 0, repairsNeeded: 0, repairsFixed: 0,
    daysLostRepair: 0, itemsLost: []
  };
}

function smartBuy(cash) {
  let r = cash;
  const oxen = 2; r -= 80;
  let tg = false, fa = false, ts = false, bi = false;
  if (r >= 290) { tg = true; r -= 90; }
  if (r >= 225) { fa = true; r -= 75; }
  if (r >= 170) { ts = true; r -= 50; }
  if (r >= 125) { bi = true; r -= 25; }
  const wheels = 1, axles = 1, tongues = 1; r -= 30;
  const clothing = 4; r -= 40;
  const ammo = 10; r -= 20;
  const water = 200; r -= 10;
  const food = Math.min(2000, Math.max(100, Math.round(r / 0.20)));
  r -= food * 0.20;
  return { remaining: Math.round(r * 100) / 100, food, water, clothing, ammo, oxen, wheels, axles, tongues, tg, fa, ts, bi };
}

function degradeHealth(m) {
  const idx = HEALTH_ORDER.indexOf(m.health);
  if (idx < 4) m.health = HEALTH_ORDER[idx + 1];
  if (m.health === 'dead') m.alive = false;
}

function improveHealth(m) {
  const idx = HEALTH_ORDER.indexOf(m.health);
  if (idx > 0 && idx < 4) m.health = HEALTH_ORDER[idx - 1];
}

function simDay(s) {
  const alive = s.party.filter(m => m.alive);
  if (alive.length === 0 || s.day > MAX_DAYS) return { ...s, failed: true, reason: alive.length === 0 ? 'all_dead' : 'time' };
  if (s.oxenYokes < 1) return { ...s, failed: true, reason: 'no_oxen' };
  const ac = alive.length;

  s.foodLbs = Math.max(0, s.foodLbs - ac * (RATIONS_CONSUMPTION[s.rations] || 3));
  s.waterGallons = Math.max(0, s.waterGallons - (ac * 2 + s.oxenYokes * 4));

  if (s.foodLbs <= 0) alive.forEach(m => degradeHealth(m));
  if (s.waterGallons <= 0) {
    const v = alive.filter(m => m.alive)[Math.floor(Math.random() * alive.filter(m => m.alive).length)];
    if (v && HEALTH_ORDER.indexOf(v.health) < 3) degradeHealth(v);
    s.morale = Math.max(0, s.morale - 5);
  }
  if (s.day % 3 === 0 && Math.random() < 0.5) s.waterGallons = Math.min(200, s.waterGallons + 100);

  let miles = Math.round(GAME_CONSTANTS.BASE_DAILY_MILES * (PACE_MULTIPLIER[s.pace] || 1));
  if (s.hasTrailGuide) miles = Math.round(miles * 1.03);
  if (s.grace >= 75) miles = Math.round(miles * 1.05);
  else if (s.grace < 15) miles = Math.round(miles * 0.92);
  if (s.waterGallons <= 0) miles = Math.round(miles * 0.7);
  miles = Math.round(miles * (0.85 + Math.random() * 0.20));

  if (s.day % 7 === 0 && Math.random() < 0.6) {
    s.grace = Math.min(100, s.grace + GRACE_DELTAS.SUNDAY_REST + (s.hasBible ? STORE_BIBLE.effects.sundayRestGraceBonus : 0));
    s.morale = Math.min(100, s.morale + 5 + (s.hasBible ? STORE_BIBLE.effects.restMoraleBonus : 0));
    s.party.filter(m => m.alive && m.health !== 'good').forEach(m => improveHealth(m));
    miles = 0;
  }

  s.dist += Math.max(0, miles);

  let illChance = 0.06;
  if (s.pace === 'grueling') illChance += 0.08;
  if (s.rations === 'bare_bones') illChance += 0.06;
  if (s.rations === 'meager') illChance += 0.02;
  if (s.hasFarmersAlmanac) illChance -= 0.03;
  if (s.clothingSets < ac) illChance += 0.05;
  const aliveNow = s.party.filter(m => m.alive);
  if (Math.random() < illChance && aliveNow.length > 0) {
    degradeHealth(aliveNow[Math.floor(Math.random() * aliveNow.length)]);
  }

  if (s.day % 7 === 0) {
    let wc = 0.15;
    if (s.pace === 'grueling') wc += 0.20;
    if (s.pace === 'strenuous') wc += 0.08;
    aliveNow.filter(m => m.alive && (m.health === 'good' || m.health === 'fair')).forEach(m => {
      if (Math.random() < wc) degradeHealth(m);
    });
  }

  let dangerChance = 0.08;
  if (s.grace < 15) dangerChance += 0.05;
  if (s.hasTrailGuide && Math.random() < 0.05) dangerChance = 0;

  if (Math.random() < dangerChance) {
    s.dangerCount++;
    const dtype = Math.random();
    if (dtype < 0.35) {
      s.repairsNeeded++;
      const repair = PROFESSION_REPAIR[s.profession];
      const toolBonus = s.hasToolSet ? STORE_TOOLS.tool_set.effects.repairBonus : 0;
      if (Math.random() < Math.min(0.95, repair.repairChance + toolBonus)) {
        s.repairsFixed++;
      } else {
        const pt = ['wheels', 'axles', 'tongues'][Math.floor(Math.random() * 3)];
        if (s.spareParts[pt] > 0) { s.spareParts[pt]--; s.repairsFixed++; }
        else s.morale = Math.max(0, s.morale - 10);
      }
      const timeRedux = s.hasToolSet ? STORE_TOOLS.tool_set.effects.repairTimeReduction : 1;
      const timeCost = repair.timeCostDays * timeRedux;
      s.daysLostRepair += timeCost;
      s.dist -= Math.round(miles * timeCost * 0.5);
    } else if (dtype < 0.55) {
      s.foodLbs = Math.max(0, s.foodLbs - 30 - Math.random() * 50);
    } else if (dtype < 0.70) {
      const owned = [];
      if (s.hasBible) owned.push('hasBible');
      if (s.hasFarmersAlmanac) owned.push('hasFarmersAlmanac');
      if (s.hasTrailGuide) owned.push('hasTrailGuide');
      if (s.hasToolSet) owned.push('hasToolSet');
      if (owned.length > 0 && Math.random() < 0.12) {
        const lost = owned[Math.floor(Math.random() * owned.length)];
        s[lost] = false;
        s.itemsLost.push(lost);
      }
      s.morale = Math.max(0, s.morale - 5);
    } else if (dtype < 0.85) {
      const aliveD = s.party.filter(m => m.alive);
      if (aliveD.length > 0) degradeHealth(aliveD[Math.floor(Math.random() * aliveD.length)]);
    } else {
      if (s.oxenYokes > 1 && Math.random() < 0.3) s.oxenYokes--;
      s.morale = Math.max(0, s.morale - 3);
    }
  }

  s.party.filter(m => m.alive && m.health === 'critical').forEach(m => {
    const dc = s.rations === 'filling' ? 0.20 : s.rations === 'meager' ? 0.30 : 0.50;
    if (Math.random() < dc) { m.alive = false; m.health = 'dead'; s.morale = Math.max(0, s.morale - 15); }
  });

  if (s.day % 5 === 0) s.morale = Math.max(0, s.morale + (s.pace === 'grueling' ? -5 : s.pace === 'strenuous' ? -3 : -1));
  if (s.hasBible && s.morale < STORE_BIBLE.effects.moraleFloor) s.morale = STORE_BIBLE.effects.moraleFloor;

  if (s.day % 6 === 0 && s.ammoBoxes > 0 && s.foodLbs < 200) {
    s.ammoBoxes--;
    s.foodLbs += 40 + Math.floor(Math.random() * 60);
  }

  if (s.foodLbs < 100) s.rations = 'meager';
  if (s.foodLbs < 30) s.rations = 'bare_bones';
  if (s.foodLbs >= 300) s.rations = 'filling';

  s.day++;
  if (s.dist >= TOTAL_MILES) return { ...s, arrived: true };
  if (s.party.filter(m => m.alive).length === 0) return { ...s, failed: true, reason: 'all_dead' };
  return s;
}

function runGame(prof, cashVal, buyFn) {
  let s = createState(prof, cashVal, buyFn);
  while (!s.arrived && !s.failed && s.day <= MAX_DAYS) s = simDay(s);
  if (!s.arrived && !s.failed) { s.failed = true; s.reason = 'time'; }
  return s;
}

function calcStats(runs) {
  const arr = runs.filter(r => r.arrived);
  return {
    arrRate: arr.length / runs.length,
    avgDays: arr.length ? arr.reduce((s, r) => s + r.day, 0) / arr.length : 0,
    avgSurv: runs.reduce((s, r) => s + r.party.filter(m => m.alive).length, 0) / runs.length,
    avgMorale: runs.reduce((s, r) => s + r.morale, 0) / runs.length,
    repN: runs.reduce((s, r) => s + r.repairsNeeded, 0),
    repF: runs.reduce((s, r) => s + r.repairsFixed, 0),
    daysLost: runs.reduce((s, r) => s + r.daysLostRepair, 0) / runs.length,
  };
}

// ── Test configurations ──
const CONFIGS = [
  { label: 'I',  banker: 650,  farmer: 850,  tradesman: 1100 },
  { label: 'J',  banker: 650,  farmer: 900,  tradesman: 1200 },
  { label: 'K',  banker: 700,  farmer: 850,  tradesman: 1000 },
  { label: 'L',  banker: 700,  farmer: 900,  tradesman: 1100 },
];

const profs = ['tradesman', 'farmer', 'banker'];

console.log(`\n${'='.repeat(78)}`);
console.log(`  PROFESSION BALANCE PLAYTEST — ${NUM_RUNS} runs per profession per config`);
console.log(`  Goal: Tradesman(easy) > Farmer(medium) > Banker(hard), all > 30% arrival`);
console.log(`${'='.repeat(78)}\n`);

for (const cfg of CONFIGS) {
  const res = {};
  for (const p of profs) {
    const runs = [];
    for (let i = 0; i < NUM_RUNS; i++) runs.push(runGame(p, cfg[p], smartBuy));
    res[p] = calcStats(runs);
  }

  const t = res.tradesman, f = res.farmer, b = res.banker;
  const order = t.arrRate > f.arrRate && f.arrRate > b.arrRate ? 'CORRECT' :
                t.arrRate >= f.arrRate && f.arrRate >= b.arrRate ? 'CLOSE' : 'WRONG';
  const spread = ((Math.max(t.arrRate, f.arrRate, b.arrRate) - Math.min(t.arrRate, f.arrRate, b.arrRate)) * 100).toFixed(1);
  const allPlayable = t.arrRate > 0.30 && f.arrRate > 0.30 && b.arrRate > 0.30;

  const sb = { t: smartBuy(cfg.tradesman), f: smartBuy(cfg.farmer), b: smartBuy(cfg.banker) };

  console.log(`${'─'.repeat(78)}`);
  console.log(`  ${cfg.label}: T=$${cfg.tradesman} F=$${cfg.farmer} B=$${cfg.banker}`);
  console.log(`  Purchases → T: ${sb.t.food}lb food, guide=${sb.t.tg}, alm=${sb.t.fa}, tool=${sb.t.ts}, bible=${sb.t.bi}`);
  console.log(`              F: ${sb.f.food}lb food, guide=${sb.f.tg}, alm=${sb.f.fa}, tool=${sb.f.ts}, bible=${sb.f.bi}`);
  console.log(`              B: ${sb.b.food}lb food, guide=${sb.b.tg}, alm=${sb.b.fa}, tool=${sb.b.ts}, bible=${sb.b.bi}`);
  console.log(`  ${'Metric'.padEnd(16)} ${'Tradesman'.padEnd(14)} ${'Farmer'.padEnd(14)} ${'Banker'.padEnd(14)}`);
  console.log(`  ${'─'.repeat(54)}`);
  console.log(`  ${'Arrival %'.padEnd(16)} ${(t.arrRate*100).toFixed(1).padEnd(14)} ${(f.arrRate*100).toFixed(1).padEnd(14)} ${(b.arrRate*100).toFixed(1).padEnd(14)}`);
  console.log(`  ${'Survivors'.padEnd(16)} ${t.avgSurv.toFixed(2).padEnd(14)} ${f.avgSurv.toFixed(2).padEnd(14)} ${b.avgSurv.toFixed(2).padEnd(14)}`);
  console.log(`  ${'Repair %'.padEnd(16)} ${(t.repN?(t.repF/t.repN*100):0).toFixed(0).padEnd(14)} ${(f.repN?(f.repF/f.repN*100):0).toFixed(0).padEnd(14)} ${(b.repN?(b.repF/b.repN*100):0).toFixed(0).padEnd(14)}`);
  console.log(`  ${'Days Lost'.padEnd(16)} ${t.daysLost.toFixed(1).padEnd(14)} ${f.daysLost.toFixed(1).padEnd(14)} ${b.daysLost.toFixed(1).padEnd(14)}`);
  console.log(`  Order: ${order} | Spread: ${spread}% | All playable: ${allPlayable ? 'YES' : 'NO'}`);
  console.log('');
}
