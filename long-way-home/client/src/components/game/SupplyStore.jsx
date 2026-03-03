import { useState, useMemo } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { STORE_BOOKS, STORE_TOOLS, STORE_BIBLE, MEDICINE_CONFIG, GRADE_35_PRELOADED_SUPPLIES } from '@shared/types';

const STORE_ITEMS = {
  oxenYokes: { name: 'Oxen (yoke)', price: 40, min: 1, max: 9, unit: 'yoke', desc: 'You need at least 1 yoke to move.' },
  foodLbs: { name: 'Food', price: 0.20, min: 0, max: 2000, step: 50, unit: 'lbs', desc: 'Each person eats 2-3 lbs/day.' },
  waterGallons: { name: 'Water', price: 0.05, min: 0, max: 300, step: 25, unit: 'gal', desc: 'For your family and oxen. Refill at rivers and forts.' },
  clothingSets: { name: 'Clothing', price: 10, min: 0, max: 10, unit: 'sets', desc: 'Protects against cold weather.' },
  ammoBoxes: { name: 'Ammunition', price: 2, min: 0, max: 99, unit: 'boxes', desc: '20 rounds per box for hunting.' },
  wheels: { name: 'Spare Wheels', price: 10, min: 0, max: 3, unit: '', desc: 'Wagons break down on rough terrain.' },
  axles: { name: 'Spare Axles', price: 10, min: 0, max: 3, unit: '', desc: '' },
  tongues: { name: 'Spare Tongues', price: 10, min: 0, max: 3, unit: '', desc: '' },
  medicineDoses: { name: 'Medicine', price: MEDICINE_CONFIG.price, min: 0, max: MEDICINE_CONFIG.maxDoses, unit: 'doses', desc: 'Treats illness and improves health. 60% chance per dose.' }
};

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
    for (const [key, item] of Object.entries(STORE_ITEMS)) {
      const qty = quantities[key] || 0;
      // 3-5: only charge for amounts above the pre-loaded baseline
      const freeQty = preloaded?.[key] || 0;
      const purchasedQty = Math.max(0, qty - freeQty);
      cost += purchasedQty * item.price;
    }
    // Add toggle item costs
    for (const [key, item] of Object.entries(TOGGLE_ITEMS)) {
      if (toggles[key]) cost += item.price;
    }
    return Math.round(cost * 100) / 100;
  }, [quantities, toggles, preloaded]);

  const remaining = startingCash - totalCost;
  const canAfford = remaining >= 0;

  function updateQuantity(key, delta) {
    const item = STORE_ITEMS[key];
    const step = item.step || 1;
    // 3-5: can't go below pre-loaded amounts (those are already in the wagon)
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
    <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-8">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-trail-darkBrown">Matt's General Store</h1>
          <p className="text-trail-brown">Independence, Missouri</p>
          <p className="text-lg font-semibold text-trail-blue mt-2">
            Budget: ${startingCash.toFixed(2)}
          </p>
          {is35 && (
            <p className="text-sm text-trail-brown mt-1">
              Your wagon already has some basics loaded. Buy what else you need!
            </p>
          )}
        </div>

        {/* ═══ Standard Supplies ═══ */}
        <div className="space-y-2">
          {Object.entries(STORE_ITEMS).map(([key, item]) => (
            <div key={key} className="flex items-center justify-between p-2.5 bg-trail-parchment/50 rounded-lg">
              <div className="flex-1">
                <div className="font-semibold text-trail-darkBrown text-sm">
                  {item.name}
                  {preloaded?.[key] > 0 && (
                    <span className="ml-1.5 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                      {preloaded[key]}{item.unit ? ` ${item.unit}` : ''} free
                    </span>
                  )}
                </div>
                {item.desc && <div className="text-[10px] text-trail-brown">{item.desc}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-trail-brown w-16 text-right">
                  ${(item.price * Math.max(0, quantities[key] - (preloaded?.[key] || 0))).toFixed(2)}
                </span>
                <button
                  onClick={() => updateQuantity(key, -1)}
                  className="w-7 h-7 rounded-full bg-trail-brown/20 hover:bg-trail-brown/40 flex items-center justify-center font-bold text-sm"
                >
                  -
                </button>
                <span className="w-14 text-center font-semibold text-sm">
                  {quantities[key]}{item.unit ? ` ${item.unit}` : ''}
                </span>
                <button
                  onClick={() => updateQuantity(key, 1)}
                  className="w-7 h-7 rounded-full bg-trail-brown/20 hover:bg-trail-brown/40 flex items-center justify-center font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ Books & Tools (6-8 and 3-5 only) ═══ */}
        {(is68 || state.gradeBand === '3_5') && (
          <div className="mt-4">
            <h2 className="text-sm font-bold text-trail-darkBrown uppercase tracking-wider mb-2"
              style={{ fontVariant: 'small-caps' }}>
              Books & Equipment
            </h2>
            <div className="space-y-2">
              {Object.entries(TOGGLE_ITEMS).map(([key, item]) => (
                <div key={key}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    toggles[key]
                      ? 'border-trail-blue bg-trail-blue/10'
                      : 'border-trail-tan/50 bg-trail-parchment/30 hover:border-trail-blue/40'
                  }`}
                  onClick={() => toggleItem(key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={toggles[key]}
                        onChange={() => toggleItem(key)}
                        className="w-4 h-4 text-trail-blue rounded"
                        onClick={e => e.stopPropagation()}
                      />
                      <span className="font-semibold text-trail-darkBrown text-sm">{item.name}</span>
                    </div>
                    <span className="font-bold text-trail-blue text-sm">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-trail-brown mt-1 ml-6">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Total & Purchase ═══ */}
        <div className="mt-4 p-3 bg-white rounded-lg border border-trail-tan">
          <div className="flex justify-between text-base">
            <span className="font-semibold">Total Cost:</span>
            <span className="font-bold">${totalCost.toFixed(2)}</span>
          </div>
          <div className={`flex justify-between text-base mt-1 ${!canAfford ? 'text-trail-red' : 'text-trail-green'}`}>
            <span>Remaining:</span>
            <span className="font-bold">${remaining.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={!canAfford || quantities.oxenYokes < 1}
          className={`mt-4 w-full text-lg py-3 rounded-lg font-semibold transition-colors shadow-md ${
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
