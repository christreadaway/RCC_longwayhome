import { useState, useMemo } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { STORE_BOOKS, STORE_TOOLS, STORE_BIBLE, MEDICINE_CONFIG, GRADE_35_PRELOADED_SUPPLIES } from '@shared/types';

/** Main supply items — shown as full rows */
const MAIN_ITEMS = {
  oxenYokes: { name: 'Oxen', price: 40, min: 1, max: 9, unit: 'yoke', desc: 'Need at least 1 yoke to move.' },
  foodLbs: { name: 'Food', price: 0.20, min: 0, max: 2000, step: 50, unit: 'lbs', desc: 'Each person eats 2-3 lbs/day.' },
  waterGallons: { name: 'Water', price: 0.05, min: 0, max: 300, step: 25, unit: 'gal', desc: 'Refill at rivers and forts.' },
  clothingSets: { name: 'Clothing', price: 10, min: 0, max: 10, unit: 'sets', desc: 'Protects against cold.' },
  ammoBoxes: { name: 'Ammo', price: 2, min: 0, max: 99, unit: 'boxes', desc: '20 rounds per box.' },
  medicineDoses: { name: 'Medicine', price: MEDICINE_CONFIG.price, min: 0, max: MEDICINE_CONFIG.maxDoses, unit: 'doses', desc: '60% cure chance per dose.' }
};

/** Spare parts — shown in a compact 3-col row */
const SPARE_PARTS = {
  wheels: { name: 'Wheels', price: 10, min: 0, max: 3, unit: '' },
  axles: { name: 'Axles', price: 10, min: 0, max: 3, unit: '' },
  tongues: { name: 'Tongues', price: 10, min: 0, max: 3, unit: '' },
};

/** Combined for cost calculation */
const ALL_ITEMS = { ...MAIN_ITEMS, ...SPARE_PARTS };

/** Toggle items (books, tools, Bible) — one-time purchases, not quantities */
const TOGGLE_ITEMS = {
  bible: { ...STORE_BIBLE, stateKey: 'hasBible' },
  farmers_almanac: { ...STORE_BOOKS.farmers_almanac, stateKey: 'hasFarmersAlmanac' },
  trail_guide: { ...STORE_BOOKS.trail_guide, stateKey: 'hasTrailGuide' },
  tool_set: { ...STORE_TOOLS.tool_set, stateKey: 'hasToolSet' }
};

export default function SupplyStore() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const startingCash = state.cash;
  const is68 = state.gradeBand === '6_8';
  const is35 = state.gradeBand === '3_5';

  // 3-5 gets pre-loaded supplies (free); 6-8 starts from scratch
  const preloaded = is35 ? GRADE_35_PRELOADED_SUPPLIES : null;

  const [quantities, setQuantities] = useState({
    oxenYokes: preloaded ? Math.max(2, preloaded.oxenYokes) : 2,
    foodLbs: preloaded ? Math.max(preloaded.foodLbs, 300) : 500,
    waterGallons: preloaded ? Math.max(preloaded.waterGallons, 150) : 200,
    clothingSets: state.partyMembers.length,
    ammoBoxes: 10,
    wheels: 1,
    axles: 1,
    tongues: 1,
    medicineDoses: 5
  });

  // Toggle items only available for 6-8 (and 3-5 for some)
  const [toggles, setToggles] = useState({
    bible: false,
    farmers_almanac: false,
    trail_guide: false,
    tool_set: false
  });

  const totalCost = useMemo(() => {
    let cost = 0;
    for (const [key, item] of Object.entries(ALL_ITEMS)) {
      const qty = quantities[key] || 0;
      const freeQty = preloaded?.[key] || 0;
      const purchasedQty = Math.max(0, qty - freeQty);
      cost += purchasedQty * item.price;
    }
    for (const [key, item] of Object.entries(TOGGLE_ITEMS)) {
      if (toggles[key]) cost += item.price;
    }
    return Math.round(cost * 100) / 100;
  }, [quantities, toggles, preloaded]);

  const remaining = startingCash - totalCost;
  const canAfford = remaining >= 0;

  function updateQuantity(key, delta) {
    const item = ALL_ITEMS[key];
    const step = item.step || 1;
    const floor = preloaded?.[key] != null ? Math.max(item.min, preloaded[key]) : item.min;
    setQuantities(prev => ({
      ...prev,
      [key]: Math.max(floor, Math.min(item.max, prev[key] + delta * step))
    }));
  }

  function toggleItem(key) {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handlePurchase() {
    if (!canAfford) return;
    if (quantities.oxenYokes < 1) return;

    dispatch({
      type: 'SET_SUPPLIES',
      cash: remaining,
      foodLbs: quantities.foodLbs,
      waterGallons: quantities.waterGallons,
      clothingSets: quantities.clothingSets,
      ammoBoxes: quantities.ammoBoxes,
      spareParts: {
        wheels: quantities.wheels,
        axles: quantities.axles,
        tongues: quantities.tongues
      },
      oxenYokes: quantities.oxenYokes,
      medicineDoses: quantities.medicineDoses,
      hasBible: toggles.bible,
      hasFarmersAlmanac: toggles.farmers_almanac,
      hasTrailGuide: toggles.trail_guide,
      hasToolSet: toggles.tool_set
    });
    dispatch({ type: 'SET_PHASE', phase: 'TRAVELING' });
  }

  return (
    <div className="h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-2">
      <div className="card max-w-2xl w-full max-h-[96vh] overflow-y-auto">
        {/* Header with budget — compact */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-trail-darkBrown">Matt's General Store</h1>
            <p className="text-sm text-trail-brown">Independence, Missouri</p>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold ${!canAfford ? 'text-trail-red' : 'text-trail-blue'}`}>
              ${remaining.toFixed(2)}
            </div>
            <div className="text-xs text-trail-brown">of ${startingCash.toFixed(2)}</div>
          </div>
        </div>

        {is35 && (
          <p className="text-xs text-trail-brown mb-2 bg-green-50 px-2 py-1 rounded">
            Your wagon already has basics loaded. Buy what else you need!
          </p>
        )}

        {/* ═══ Main Supplies ═══ */}
        <div className="space-y-1">
          {Object.entries(MAIN_ITEMS).map(([key, item]) => (
            <div key={key} className="flex items-center justify-between py-1.5 px-2 bg-trail-parchment/50 rounded">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-trail-darkBrown text-sm leading-tight">
                  {item.name}
                  {preloaded?.[key] > 0 && (
                    <span className="ml-1 text-[10px] font-bold text-green-700 bg-green-50 px-1 py-0.5 rounded-full">
                      {preloaded[key]} free
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-trail-brown leading-tight">{item.desc}</div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-trail-brown w-14 text-right">
                  ${(item.price * Math.max(0, quantities[key] - (preloaded?.[key] || 0))).toFixed(2)}
                </span>
                <button onClick={() => updateQuantity(key, -1)}
                  className="w-6 h-6 rounded-full bg-trail-brown/20 hover:bg-trail-brown/40 flex items-center justify-center font-bold text-xs">-</button>
                <span className="w-14 text-center font-semibold text-xs">
                  {quantities[key]}{item.unit ? ` ${item.unit}` : ''}
                </span>
                <button onClick={() => updateQuantity(key, 1)}
                  className="w-6 h-6 rounded-full bg-trail-brown/20 hover:bg-trail-brown/40 flex items-center justify-center font-bold text-xs">+</button>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ Spare Parts — compact 3-col grid ═══ */}
        <div className="mt-2">
          <div className="text-xs font-bold text-trail-darkBrown uppercase tracking-wider mb-1">Spare Parts ($10 each)</div>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.entries(SPARE_PARTS).map(([key, item]) => (
              <div key={key} className="flex items-center justify-between py-1.5 px-2 bg-trail-parchment/50 rounded">
                <span className="text-xs font-semibold text-trail-darkBrown">{item.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(key, -1)}
                    className="w-5 h-5 rounded-full bg-trail-brown/20 hover:bg-trail-brown/40 flex items-center justify-center font-bold text-[10px]">-</button>
                  <span className="w-4 text-center font-semibold text-xs">{quantities[key]}</span>
                  <button onClick={() => updateQuantity(key, 1)}
                    className="w-5 h-5 rounded-full bg-trail-brown/20 hover:bg-trail-brown/40 flex items-center justify-center font-bold text-[10px]">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Books & Tools (6-8 and 3-5 only) ═══ */}
        {(is68 || state.gradeBand === '3_5') && (
          <div className="mt-2">
            <div className="text-xs font-bold text-trail-darkBrown uppercase tracking-wider mb-1">Books & Equipment</div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(TOGGLE_ITEMS).map(([key, item]) => (
                <div key={key}
                  className={`py-1.5 px-2 rounded border cursor-pointer transition-all ${
                    toggles[key]
                      ? 'border-trail-blue bg-trail-blue/10'
                      : 'border-trail-tan/50 bg-trail-parchment/30 hover:border-trail-blue/40'
                  }`}
                  onClick={() => toggleItem(key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <input type="checkbox" checked={toggles[key]} onChange={() => toggleItem(key)}
                        className="w-3.5 h-3.5 text-trail-blue rounded" onClick={e => e.stopPropagation()} />
                      <span className="font-semibold text-trail-darkBrown text-xs">{item.name}</span>
                    </div>
                    <span className="font-bold text-trail-blue text-xs">${item.price}</span>
                  </div>
                  <p className="text-[10px] text-trail-brown mt-0.5 ml-5 leading-tight">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Purchase ═══ */}
        <button
          onClick={handlePurchase}
          disabled={!canAfford || quantities.oxenYokes < 1}
          className={`mt-3 w-full text-lg py-2.5 rounded-lg font-semibold transition-colors shadow-md ${
            canAfford && quantities.oxenYokes >= 1
              ? 'bg-trail-brown text-white hover:bg-trail-darkBrown'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {!canAfford ? 'Over Budget!' : quantities.oxenYokes < 1 ? 'Need at least 1 yoke of oxen' : 'Head West!'}
        </button>
      </div>
    </div>
  );
}
