import { useState, useMemo } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';

const STORE_ITEMS = {
  oxenYokes: { name: 'Oxen (yoke)', price: 40, min: 1, max: 9, unit: 'yoke', desc: 'You need at least 1 yoke to move.' },
  foodLbs: { name: 'Food', price: 0.20, min: 0, max: 2000, step: 50, unit: 'lbs', desc: 'Each person eats 2-3 lbs/day.' },
  clothingSets: { name: 'Clothing', price: 10, min: 0, max: 10, unit: 'sets', desc: 'Protects against cold weather.' },
  ammoBoxes: { name: 'Ammunition', price: 2, min: 0, max: 99, unit: 'boxes', desc: '20 rounds per box for hunting.' },
  wheels: { name: 'Spare Wheels', price: 10, min: 0, max: 3, unit: '', desc: 'Wagons break down on rough terrain.' },
  axles: { name: 'Spare Axles', price: 10, min: 0, max: 3, unit: '', desc: '' },
  tongues: { name: 'Spare Tongues', price: 10, min: 0, max: 3, unit: '', desc: '' }
};

export default function SupplyStore() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const startingCash = state.cash;

  const [quantities, setQuantities] = useState({
    oxenYokes: 2,
    foodLbs: 500,
    clothingSets: state.partyMembers.length,
    ammoBoxes: 10,
    wheels: 1,
    axles: 1,
    tongues: 1
  });

  const totalCost = useMemo(() => {
    let cost = 0;
    cost += quantities.oxenYokes * STORE_ITEMS.oxenYokes.price;
    cost += quantities.foodLbs * STORE_ITEMS.foodLbs.price;
    cost += quantities.clothingSets * STORE_ITEMS.clothingSets.price;
    cost += quantities.ammoBoxes * STORE_ITEMS.ammoBoxes.price;
    cost += quantities.wheels * STORE_ITEMS.wheels.price;
    cost += quantities.axles * STORE_ITEMS.axles.price;
    cost += quantities.tongues * STORE_ITEMS.tongues.price;
    return Math.round(cost * 100) / 100;
  }, [quantities]);

  const remaining = startingCash - totalCost;
  const canAfford = remaining >= 0;

  function updateQuantity(key, delta) {
    const item = STORE_ITEMS[key];
    const step = item.step || 1;
    setQuantities(prev => ({
      ...prev,
      [key]: Math.max(item.min, Math.min(item.max, prev[key] + delta * step))
    }));
  }

  function handlePurchase() {
    if (!canAfford) return;
    if (quantities.oxenYokes < 1) return;

    dispatch({
      type: 'SET_SUPPLIES',
      cash: remaining,
      foodLbs: quantities.foodLbs,
      clothingSets: quantities.clothingSets,
      ammoBoxes: quantities.ammoBoxes,
      spareParts: {
        wheels: quantities.wheels,
        axles: quantities.axles,
        tongues: quantities.tongues
      },
      oxenYokes: quantities.oxenYokes
    });
    dispatch({ type: 'SET_PHASE', phase: 'TRAVELING' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-8">
      <div className="card max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-trail-darkBrown">Matt's General Store</h1>
          <p className="text-trail-brown">Independence, Missouri</p>
          <p className="text-lg font-semibold text-trail-blue mt-2">
            Budget: ${startingCash.toFixed(2)}
          </p>
        </div>

        <div className="space-y-3">
          {Object.entries(STORE_ITEMS).map(([key, item]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-trail-parchment/50 rounded-lg">
              <div className="flex-1">
                <div className="font-semibold text-trail-darkBrown">{item.name}</div>
                {item.desc && <div className="text-xs text-trail-brown">{item.desc}</div>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-trail-brown w-20 text-right">
                  ${(item.price * quantities[key]).toFixed(2)}
                </span>
                <button
                  onClick={() => updateQuantity(key, -1)}
                  className="w-8 h-8 rounded-full bg-trail-brown/20 hover:bg-trail-brown/40 flex items-center justify-center font-bold"
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold">
                  {quantities[key]}{item.unit ? ` ${item.unit}` : ''}
                </span>
                <button
                  onClick={() => updateQuantity(key, 1)}
                  className="w-8 h-8 rounded-full bg-trail-brown/20 hover:bg-trail-brown/40 flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg border border-trail-tan">
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total Cost:</span>
            <span className="font-bold">${totalCost.toFixed(2)}</span>
          </div>
          <div className={`flex justify-between text-lg mt-1 ${!canAfford ? 'text-trail-red' : 'text-trail-green'}`}>
            <span>Remaining:</span>
            <span className="font-bold">${remaining.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={!canAfford || quantities.oxenYokes < 1}
          className={`mt-6 w-full text-lg py-3 rounded-lg font-semibold transition-colors shadow-md ${
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
