import { useState, useEffect, useRef, useCallback } from 'react';

const ANIMALS = [
  { type: 'squirrel', food: 5, speed: 3.5, size: 35, y: 0.7 },
  { type: 'rabbit', food: 8, speed: 3, size: 40, y: 0.65 },
  { type: 'deer', food: 30, speed: 2.5, size: 55, y: 0.5 },
  { type: 'bison', food: 100, speed: 1.5, size: 70, y: 0.55 }
];

export default function HuntingMinigame({ onComplete, ammo, bisonPopulation = 100 }) {
  const [ammoLeft, setAmmoLeft] = useState(Math.min(ammo * 20, 20));
  const [foodGained, setFoodGained] = useState(0);
  const [bisonKilled, setBisonKilled] = useState(0);
  const [animals, setAnimals] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(true);
  const [overhuntWarning, setOverhuntWarning] = useState(false);
  const [hitFlashes, setHitFlashes] = useState([]);
  const containerRef = useRef(null);

  // Spawn animals
  useEffect(() => {
    if (!gameActive) return;

    const interval = setInterval(() => {
      setAnimals(prev => {
        let pool = ANIMALS;
        if (bisonPopulation < 30) {
          pool = ANIMALS.filter(a => a.type !== 'bison');
        } else if (bisonPopulation < 60) {
          pool = [...ANIMALS.filter(a => a.type !== 'bison'), ...ANIMALS.filter(a => a.type !== 'bison')];
          pool.push(ANIMALS.find(a => a.type === 'bison'));
        }
        const animal = pool[Math.floor(Math.random() * pool.length)];
        const fromLeft = Math.random() > 0.5;
        const containerWidth = containerRef.current?.offsetWidth || 600;
        return [...prev.filter(a => a.alive), {
          id: Date.now() + Math.random(),
          ...animal,
          x: fromLeft ? -50 : containerWidth + 50,
          direction: fromLeft ? 1 : -1,
          yPos: animal.y * 250 + Math.random() * 40,
          alive: true
        }];
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [gameActive, bisonPopulation]);

  // Timer
  useEffect(() => {
    if (!gameActive) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameActive]);

  // Move animals
  useEffect(() => {
    if (!gameActive) return;
    const containerWidth = containerRef.current?.offsetWidth || 600;
    const moveInterval = setInterval(() => {
      setAnimals(prev =>
        prev.map(a => ({
          ...a,
          x: a.x + a.speed * a.direction * 2.5
        })).filter(a => a.x > -80 && a.x < containerWidth + 80)
      );
    }, 50);
    return () => clearInterval(moveInterval);
  }, [gameActive]);

  const handleShoot = useCallback((e) => {
    if (!gameActive) return;

    setAmmoLeft(prevAmmo => {
      if (prevAmmo <= 0) return prevAmmo;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return prevAmmo;
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const newAmmo = prevAmmo - 1;

      // Check hits against current animal positions
      let anyHit = false;
      setAnimals(prev =>
        prev.map(a => {
          if (!a.alive) return a;
          // Use generous hit detection — hit radius proportional to animal size
          const hitRadius = a.size * 0.9;
          const dx = Math.abs(clickX - a.x);
          const dy = Math.abs(clickY - a.yPos);
          if (dx < hitRadius && dy < hitRadius) {
            anyHit = true;
            // Accumulate food via functional state update
            setFoodGained(f => f + a.food);
            if (a.type === 'bison') {
              setBisonKilled(b => {
                const newCount = b + 1;
                if (newCount >= 3) setOverhuntWarning(true);
                return newCount;
              });
            }
            setHitFlashes(flashes => [...flashes, { id: Date.now() + Math.random(), x: a.x, y: a.yPos, food: a.food }]);
            return { ...a, alive: false };
          }
          return a;
        })
      );

      if (!anyHit) {
        setHitFlashes(flashes => [...flashes, { id: Date.now() + Math.random(), x: clickX, y: clickY, miss: true }]);
      }

      if (newAmmo <= 0) {
        setTimeout(() => setGameActive(false), 100);
      }

      return newAmmo;
    });
  }, [gameActive]);

  // Clean up hit flashes
  useEffect(() => {
    if (hitFlashes.length === 0) return;
    const timer = setTimeout(() => {
      setHitFlashes(prev => prev.slice(1));
    }, 800);
    return () => clearTimeout(timer);
  }, [hitFlashes]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-green-200 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* HUD */}
        <div className="flex justify-between items-center mb-4 bg-black/30 text-white rounded-lg px-4 py-2">
          <span>Ammo: {ammoLeft}</span>
          <span>Food: +{foodGained} lbs</span>
          <span>Time: {timeLeft}s</span>
        </div>

        {/* Hunting area */}
        <div
          ref={containerRef}
          className="relative w-full h-80 bg-gradient-to-b from-sky-200 to-green-300 rounded-xl overflow-hidden cursor-crosshair border-2 border-trail-brown"
          onClick={handleShoot}
        >
          {/* Ground */}
          <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-green-700 to-green-500" />

          {/* Trees */}
          <div className="absolute bottom-16 left-10">
            <div className="w-10 h-16 bg-green-800 rounded-full" />
            <div className="w-3 h-6 bg-amber-800 mx-auto" />
          </div>
          <div className="absolute bottom-16 right-20">
            <div className="w-12 h-20 bg-green-700 rounded-full" />
            <div className="w-3 h-6 bg-amber-800 mx-auto" />
          </div>

          {/* Animals */}
          {animals.filter(a => a.alive).map(a => (
            <div
              key={a.id}
              className="absolute"
              style={{
                left: `${a.x}px`,
                top: `${a.yPos}px`,
                transform: `scaleX(${a.direction})`
              }}
            >
              <AnimalSprite type={a.type} size={a.size} />
            </div>
          ))}

          {/* Hit flashes */}
          {hitFlashes.map(f => (
            <div key={f.id} className="absolute pointer-events-none animate-bounce"
              style={{ left: `${f.x}px`, top: `${f.y - 15}px` }}>
              {f.miss
                ? <span className="text-xs text-white font-bold bg-black/30 px-1 rounded">Miss!</span>
                : <span className="text-sm text-green-100 font-bold bg-green-800/70 px-1 rounded">+{f.food} lbs</span>
              }
            </div>
          ))}

          {/* Dead animals (faded) */}
          {animals.filter(a => !a.alive).map(a => (
            <div key={a.id} className="absolute opacity-30 pointer-events-none"
              style={{ left: `${a.x}px`, top: `${a.yPos + 5}px`, transform: 'rotate(90deg)' }}>
              <AnimalSprite type={a.type} size={a.size * 0.7} />
            </div>
          ))}

          {!gameActive && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-white rounded-xl p-6 text-center">
                <h3 className="text-xl font-bold text-trail-darkBrown mb-2">
                  {foodGained > 0 ? 'Nice Hunting!' : 'The Hunt is Over'}
                </h3>
                <p className="text-trail-brown mb-4">
                  You gathered {foodGained} lbs of food.
                  {bisonKilled > 0 && ` (${bisonKilled} bison taken)`}
                </p>
                {overhuntWarning && (
                  <p className="text-trail-red text-sm mb-3 italic">
                    You took more bison than needed. The herd is smaller now.
                  </p>
                )}
                <button onClick={() => onComplete(foodGained, bisonKilled)} className="btn-primary">
                  Return to Camp
                </button>
              </div>
            </div>
          )}
        </div>

        {gameActive && (
          <button
            onClick={() => setGameActive(false)}
            className="mt-4 btn-secondary"
          >
            Finish Hunting
          </button>
        )}
      </div>
    </div>
  );
}

function AnimalSprite({ type, size }) {
  const color = {
    squirrel: '#8B4513',
    rabbit: '#D2B48C',
    deer: '#8B6914',
    bison: '#4a3728'
  }[type] || '#8B6914';

  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <ellipse cx="20" cy="25" rx={type === 'bison' ? 18 : 12} ry={type === 'bison' ? 12 : 8} fill={color} />
      <circle cx={type === 'bison' ? 8 : 10} cy={type === 'bison' ? 18 : 20} r={type === 'bison' ? 7 : 5} fill={color} />
      <circle cx={type === 'bison' ? 5 : 7} cy={type === 'bison' ? 16 : 18} r="1.5" fill="white" />
      {type === 'deer' && (
        <>
          <line x1="8" y1="15" x2="4" y2="5" stroke={color} strokeWidth="2" />
          <line x1="4" y1="5" x2="2" y2="3" stroke={color} strokeWidth="1.5" />
          <line x1="4" y1="5" x2="6" y2="3" stroke={color} strokeWidth="1.5" />
        </>
      )}
      {/* Legs */}
      <line x1="14" y1="32" x2="14" y2="38" stroke={color} strokeWidth="2" />
      <line x1="26" y1="32" x2="26" y2="38" stroke={color} strokeWidth="2" />
    </svg>
  );
}
