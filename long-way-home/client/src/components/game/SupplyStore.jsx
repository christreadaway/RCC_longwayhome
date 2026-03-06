import { useState, useMemo } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { STORE_BOOKS, STORE_TOOLS, STORE_BIBLE, MEDICINE_CONFIG, GRADE_35_PRELOADED_SUPPLIES } from '@shared/types';

/** Main supply items with emoji icons */
const MAIN_ITEMS = {
  oxenYokes:    { name: 'Oxen',     icon: '🐂', price: 40,   min: 1, max: 9,    unit: 'yoke', desc: 'Need at least 1 yoke' },
  foodLbs:      { name: 'Food',     icon: '🌾', price: 0.20, min: 0, max: 2000, step: 50, unit: 'lbs', desc: '2–3 lbs/person/day' },
  waterGallons: { name: 'Water',    icon: '💧', price: 0.05, min: 0, max: 300,  step: 25, unit: 'gal', desc: 'Refill at rivers & forts' },
  clothingSets: { name: 'Clothing', icon: '🧥', price: 10,   min: 0, max: 10,   unit: 'sets', desc: 'Protects against cold' },
  ammoBoxes:    { name: 'Ammo',     icon: '🔫', price: 2,    min: 0, max: 99,   unit: 'boxes', desc: '20 rounds per box' },
  medicineDoses:{ name: 'Medicine', icon: '💊', price: MEDICINE_CONFIG.price, min: 0, max: MEDICINE_CONFIG.maxDoses, unit: 'doses', desc: '60% cure chance' }
};

/** Spare parts */
const SPARE_PARTS = {
  wheels:  { name: 'Wheels',  icon: '☸', price: 10, min: 0, max: 3, unit: '' },
  axles:   { name: 'Axles',   icon: '⚙', price: 10, min: 0, max: 3, unit: '' },
  tongues: { name: 'Tongues', icon: '🪵', price: 10, min: 0, max: 3, unit: '' },
};

const ALL_ITEMS = { ...MAIN_ITEMS, ...SPARE_PARTS };

/** Toggle items */
const TOGGLE_ITEMS = {
  bible:           { ...STORE_BIBLE, icon: '✝', stateKey: 'hasBible' },
  farmers_almanac: { ...STORE_BOOKS.farmers_almanac, icon: '📅', stateKey: 'hasFarmersAlmanac' },
  trail_guide:     { ...STORE_BOOKS.trail_guide, icon: '🗺', stateKey: 'hasTrailGuide' },
  tool_set:        { ...STORE_TOOLS.tool_set, icon: '🔧', stateKey: 'hasToolSet' }
};

export default function SupplyStore() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const startingCash = state.cash;
  const is68 = state.gradeBand === '6_8';
  const is35 = state.gradeBand === '3_5';

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

  const budgetPct = Math.max(0, Math.min(100, (remaining / startingCash) * 100));

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #f5ead8 0%, #ecdabc 100%)',
      fontFamily: 'var(--font-body)',
    }}>
      {/* ═══ HEADER — Store name + budget bar ═══ */}
      <div style={{
        flexShrink: 0, padding: '16px 24px 12px',
        borderBottom: '2px solid rgba(120,80,40,0.2)',
        background: 'rgba(44,31,20,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700,
              color: '#2c1f14', margin: 0, lineHeight: 1.1,
            }}>
              Matt's General Store
            </h1>
            <p style={{ fontSize: '15px', color: '#5a4030', margin: '2px 0 0' }}>Independence, Missouri — 1848</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '32px', fontWeight: 800, lineHeight: 1,
              fontFamily: 'var(--font-display)',
              color: !canAfford ? '#b94040' : '#4a6890',
            }}>
              ${remaining.toFixed(2)}
            </div>
            <div style={{ fontSize: '13px', color: '#5a4030', marginTop: '2px' }}>
              of ${startingCash.toFixed(2)} budget
            </div>
          </div>
        </div>
        {/* Budget bar */}
        <div style={{
          height: '8px', borderRadius: '4px',
          background: 'rgba(120,80,40,0.12)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: '4px',
            width: `${budgetPct}%`,
            background: !canAfford ? '#b94040' : budgetPct < 25 ? '#c2873a' : '#4a7c59',
            transition: 'width 0.3s, background 0.3s',
          }} />
        </div>
      </div>

      {is35 && (
        <div style={{
          flexShrink: 0, padding: '6px 24px',
          background: 'rgba(74,124,89,0.08)', fontSize: '14px', color: '#4a7c59',
          borderBottom: '1px solid rgba(74,124,89,0.15)',
        }}>
          ✅ Your wagon already has basics loaded. Buy what else you need!
        </div>
      )}

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 24px 0' }}>

        {/* ═══ Main Supplies — 2-column grid ═══ */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
        }}>
          {Object.entries(MAIN_ITEMS).map(([key, item]) => {
            const cost = item.price * Math.max(0, quantities[key] - (preloaded?.[key] || 0));
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px',
                background: 'rgba(255,252,245,0.85)',
                border: '1px solid rgba(120,80,40,0.15)',
              }}>
                <span style={{ fontSize: '28px', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#2c1f14' }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#4a6890' }}>
                      ${cost.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#5a4030', opacity: 0.7, marginTop: '1px' }}>
                    {item.desc}
                    {preloaded?.[key] > 0 && (
                      <span style={{ marginLeft: '4px', color: '#4a7c59', fontWeight: 600 }}>
                        ({preloaded[key]} free)
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <button onClick={() => updateQuantity(key, -1)} style={{
                      width: '32px', height: '28px', borderRadius: '6px', border: '1px solid rgba(120,80,40,0.25)',
                      background: 'rgba(120,80,40,0.08)', cursor: 'pointer',
                      fontSize: '18px', fontWeight: 700, color: '#5a4030',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>−</button>
                    <span style={{
                      minWidth: '70px', textAlign: 'center',
                      fontSize: '16px', fontWeight: 700, color: '#2c1f14',
                    }}>
                      {quantities[key]}{item.unit ? ` ${item.unit}` : ''}
                    </span>
                    <button onClick={() => updateQuantity(key, 1)} style={{
                      width: '32px', height: '28px', borderRadius: '6px', border: '1px solid rgba(120,80,40,0.25)',
                      background: 'rgba(120,80,40,0.08)', cursor: 'pointer',
                      fontSize: '18px', fontWeight: 700, color: '#5a4030',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ Spare Parts — inline 3-col ═══ */}
        <div style={{ marginTop: '12px' }}>
          <div style={{
            fontSize: '13px', fontWeight: 700, color: '#2c1f14',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px',
          }}>
            Spare Parts — $10 each
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {Object.entries(SPARE_PARTS).map(([key, item]) => (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: '10px',
                background: 'rgba(255,252,245,0.85)',
                border: '1px solid rgba(120,80,40,0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#2c1f14' }}>{item.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button onClick={() => updateQuantity(key, -1)} style={{
                    width: '26px', height: '24px', borderRadius: '5px', border: '1px solid rgba(120,80,40,0.25)',
                    background: 'rgba(120,80,40,0.08)', cursor: 'pointer',
                    fontSize: '16px', fontWeight: 700, color: '#5a4030',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>−</button>
                  <span style={{ width: '24px', textAlign: 'center', fontSize: '16px', fontWeight: 700, color: '#2c1f14' }}>
                    {quantities[key]}
                  </span>
                  <button onClick={() => updateQuantity(key, 1)} style={{
                    width: '26px', height: '24px', borderRadius: '5px', border: '1px solid rgba(120,80,40,0.25)',
                    background: 'rgba(120,80,40,0.08)', cursor: 'pointer',
                    fontSize: '16px', fontWeight: 700, color: '#5a4030',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Books & Equipment (6-8 and 3-5) ═══ */}
        {(is68 || is35) && (
          <div style={{ marginTop: '12px' }}>
            <div style={{
              fontSize: '13px', fontWeight: 700, color: '#2c1f14',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px',
            }}>
              Books & Equipment
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(TOGGLE_ITEMS).map(([key, item]) => (
                <div key={key}
                  onClick={() => toggleItem(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                    border: `2px solid ${toggles[key] ? '#4a6890' : 'rgba(120,80,40,0.15)'}`,
                    background: toggles[key] ? 'rgba(74,104,144,0.08)' : 'rgba(255,252,245,0.85)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#2c1f14' }}>{item.name}</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#4a6890' }}>${item.price}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#5a4030', opacity: 0.7, marginTop: '1px' }}>
                      {item.description}
                    </div>
                  </div>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '5px', flexShrink: 0,
                    border: `2px solid ${toggles[key] ? '#4a6890' : 'rgba(120,80,40,0.3)'}`,
                    background: toggles[key] ? '#4a6890' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '14px', fontWeight: 700,
                  }}>
                    {toggles[key] && '✓'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ FOOTER — Purchase button (always visible) ═══ */}
      <div style={{
        flexShrink: 0, padding: '12px 24px 16px',
        borderTop: '2px solid rgba(120,80,40,0.15)',
        background: 'rgba(255,252,245,0.95)',
      }}>
        <button
          onClick={handlePurchase}
          disabled={!canAfford || quantities.oxenYokes < 1}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            fontSize: '20px', fontWeight: 700, cursor: canAfford && quantities.oxenYokes >= 1 ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-display)',
            background: canAfford && quantities.oxenYokes >= 1
              ? 'linear-gradient(135deg, #5a4030 0%, #2c1f14 100%)'
              : '#ccc',
            color: canAfford && quantities.oxenYokes >= 1 ? '#f5ead8' : '#888',
            boxShadow: canAfford && quantities.oxenYokes >= 1
              ? '0 4px 12px rgba(44,31,20,0.3)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {!canAfford ? '💸 Over Budget!' : quantities.oxenYokes < 1 ? '🐂 Need at least 1 yoke of oxen' : '🚀 Head West!'}
        </button>
      </div>
    </div>
  );
}
