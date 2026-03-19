/**
 * TrailSceneCSS — Pure CSS/SVG trail scene with terrain-specific landscapes
 * and comprehensive weather rendering for all 16 weather conditions.
 *
 * Terrain types map to real Oregon Trail geography:
 * - plains: Nebraska/Kansas flat grasslands
 * - hills: Wyoming foothills, sagebrush
 * - mountains: Rocky Mountains, pine forests
 * - river: River crossings, water dominant
 */

// ── Sky gradients by weather condition ──────────────────────────────────────

const SKY = {
  clear:        'linear-gradient(180deg, #4a90d9 0%, #87c0ea 40%, #c8dfc6 100%)',
  partlyCloudy: 'linear-gradient(180deg, #5a98d4 0%, #90bce0 50%, #c0d6c0 100%)',
  cloudy:       'linear-gradient(180deg, #7a8a98 0%, #96a4ae 50%, #a8b4a8 100%)',
  overcast:     'linear-gradient(180deg, #687078 0%, #828a92 50%, #949a94 100%)',
  lightRain:    'linear-gradient(180deg, #5a6878 0%, #7a8898 50%, #90988e 100%)',
  rain:         'linear-gradient(180deg, #4a5868 0%, #6a7888 50%, #808878 100%)',
  heavyRain:    'linear-gradient(180deg, #3a4858 0%, #5a6878 50%, #6a7068 100%)',
  storm:        'linear-gradient(180deg, #2a3040 0%, #3a4050 45%, #5a5a60 100%)',
  lightSnow:    'linear-gradient(180deg, #a0a8b4 0%, #b8c0c8 50%, #cad0cc 100%)',
  snow:         'linear-gradient(180deg, #90989e 0%, #a8b0b8 50%, #bcc2bc 100%)',
  heavySnow:    'linear-gradient(180deg, #808890 0%, #989ea6 50%, #b0b4ae 100%)',
  blizzard:     'linear-gradient(180deg, #70787e 0%, #8a9098 50%, #a0a4a0 100%)',
  fog:          'linear-gradient(180deg, #b8c0c8 0%, #c8ccd2 50%, #d4d8d4 100%)',
  dust:         'linear-gradient(180deg, #8a7050 0%, #a08060 50%, #b89870 100%)',
  hail:         'linear-gradient(180deg, #3a4858 0%, #5a6878 50%, #707868 100%)',
  hotClear:     'linear-gradient(180deg, #3a78c0 0%, #7ab4e0 35%, #d8c8a0 100%)',
};

function getSkyKey(condition, temp) {
  if (temp > 95 && (condition === 'sunny' || condition === 'fair')) return 'hotClear';
  const map = {
    sunny: 'clear', fair: 'clear', partly_cloudy: 'partlyCloudy',
    cloudy: 'cloudy', overcast: 'overcast',
    light_rain: 'lightRain', rain: 'rain', heavy_rain: 'heavyRain',
    thunderstorm: 'storm',
    light_snow: 'lightSnow', snow: 'snow', heavy_snow: 'heavySnow',
    blizzard: 'blizzard', fog: 'fog', dust_storm: 'dust', hail: 'hail',
  };
  return map[condition] || 'clear';
}

// ── Terrain color palettes ─────────────────────────────────────────────────

const TERRAIN = {
  plains: {
    farGround:  '#8a9a50',   // prairie grass far
    midGround:  '#9aaa58',   // prairie grass mid
    road:       ['#c8a870', '#b89050'],
    roadLine:   'rgba(255,220,120,0.28)',
    foreground: '#a0aa60',
    trees:      { trunk: '#7a6a40', crown: '#6a7a3a', count: 2, style: 'scattered' },
    grass:      { color1: '#7a8a3a', color2: '#8a9a4a', tall: true },
  },
  hills: {
    farGround:  '#7a8a6a',   // sagebrush gray-green
    midGround:  '#6a7a5a',   // darker sage
    road:       ['#b8a078', '#a08858'],
    roadLine:   'rgba(200,180,120,0.22)',
    foreground: '#8a9470',
    trees:      { trunk: '#5a4a30', crown: '#5a6a3a', count: 3, style: 'scrub' },
    grass:      { color1: '#6a7a50', color2: '#7a8a5a', tall: false },
  },
  mountains: {
    farGround:  '#4a6a3a',   // dark pine green
    midGround:  '#5a7a4a',   // evergreen
    road:       ['#9a8a70', '#887858'],
    roadLine:   'rgba(180,160,110,0.2)',
    foreground: '#5a7040',
    trees:      { trunk: '#3a2a1a', crown: '#2a5a1a', count: 5, style: 'pine' },
    grass:      { color1: '#4a5a2a', color2: '#5a6a3a', tall: false },
  },
  river: {
    farGround:  '#5a7a3a',   // bank vegetation
    midGround:  '#6a8a4a',
    road:       ['#b0a078', '#988860'],
    roadLine:   'rgba(180,160,120,0.18)',
    foreground: '#6a8040',
    trees:      { trunk: '#5a4a2a', crown: '#4a7a3a', count: 3, style: 'willow' },
    grass:      { color1: '#5a7a3a', color2: '#6a8a4a', tall: true },
  },
};

export default function TrailSceneCSS({ weather, isTraveling = false, terrainType = 'plains' }) {
  const condition = weather?.condition || 'sunny';
  const temp = weather?.temperature?.current ?? 65;
  const windLevel = weather?.wind?.level || 'calm';
  const ground = weather?.ground || 'firm';
  const skyKey = getSkyKey(condition, temp);
  const t = TERRAIN[terrainType] || TERRAIN.plains;

  const showRain = ['light_rain', 'rain', 'heavy_rain', 'thunderstorm'].includes(condition);
  const showSnow = ['light_snow', 'snow', 'heavy_snow', 'blizzard'].includes(condition);
  const showFog = condition === 'fog';
  const showDust = condition === 'dust_storm';
  const showHail = condition === 'hail';
  const showLightning = condition === 'thunderstorm';
  const showHeat = temp > 90 && !showRain && !showSnow;
  const isWindy = windLevel === 'strong' || windLevel === 'gale';
  const snowGround = ground === 'snowpack' || ground === 'icy';

  const rainCount = condition === 'light_rain' ? 15 : condition === 'rain' ? 30 : 50;
  const snowCount = condition === 'light_snow' ? 20 : condition === 'snow' ? 40 : condition === 'heavy_snow' ? 60 : 80;
  const rainAnim = isWindy ? 'rainFallAngled' : 'rainFall';
  const snowAnim = condition === 'blizzard' || isWindy ? 'snowFallHorizontal' : 'snowFall';

  // Sun visibility
  const showSun = ['clear', 'partlyCloudy', 'hotClear'].includes(skyKey);

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: SKY[skyKey],
    }}>
      {/* Sun */}
      {showSun && (
        <div style={{
          position: 'absolute', top: '8%', right: '12%', width: '30px', height: '30px',
          borderRadius: '50%', background: '#f4d35e',
          boxShadow: '0 0 20px rgba(244,211,94,0.5), 0 0 60px rgba(244,211,94,0.2)',
          opacity: temp > 90 ? 1 : 0.85,
        }} />
      )}

      {/* Mountain peaks (mountains terrain only) */}
      {terrainType === 'mountains' && (
        <>
          <div style={{ position: 'absolute', bottom: '36%', left: '5%', width: 0, height: 0,
            borderLeft: '60px solid transparent', borderRight: '60px solid transparent',
            borderBottom: '90px solid #6a7a8a', opacity: 0.5 }} />
          <div style={{ position: 'absolute', bottom: '36%', left: '25%', width: 0, height: 0,
            borderLeft: '80px solid transparent', borderRight: '80px solid transparent',
            borderBottom: '120px solid #7a8a9a', opacity: 0.45 }} />
          <div style={{ position: 'absolute', bottom: '36%', right: '15%', width: 0, height: 0,
            borderLeft: '70px solid transparent', borderRight: '70px solid transparent',
            borderBottom: '100px solid #6a7a8a', opacity: 0.4 }} />
          {/* Snow caps */}
          <div style={{ position: 'absolute', bottom: 'calc(36% + 82px)', left: 'calc(5% + 48px)', width: 0, height: 0,
            borderLeft: '12px solid transparent', borderRight: '12px solid transparent',
            borderBottom: '10px solid rgba(255,255,255,0.85)' }} />
          <div style={{ position: 'absolute', bottom: 'calc(36% + 112px)', left: 'calc(25% + 66px)', width: 0, height: 0,
            borderLeft: '14px solid transparent', borderRight: '14px solid transparent',
            borderBottom: '12px solid rgba(255,255,255,0.9)' }} />
          <div style={{ position: 'absolute', bottom: 'calc(36% + 92px)', right: 'calc(15% + 56px)', width: 0, height: 0,
            borderLeft: '12px solid transparent', borderRight: '12px solid transparent',
            borderBottom: '10px solid rgba(255,255,255,0.8)' }} />
        </>
      )}

      {/* Far ground layer */}
      <div style={{
        position: 'absolute', width: '140%', left: '-20%', bottom: '27%',
        height: terrainType === 'plains' ? '14%' : terrainType === 'mountains' ? '22%' : '20%',
        background: t.farGround,
        opacity: 0.7,
        borderRadius: terrainType === 'plains' ? '0' : '50% 50% 0 0',
      }} />

      {/* Mid ground layer (hills/rolling terrain) */}
      {terrainType !== 'plains' && (
        <div style={{
          position: 'absolute', width: '120%', left: '-10%', bottom: '21%',
          height: terrainType === 'mountains' ? '18%' : '16%',
          background: t.midGround,
          borderRadius: '50% 50% 0 0',
        }} />
      )}

      {/* River (river terrain) */}
      {terrainType === 'river' && (
        <div style={{
          position: 'absolute', width: '100%', bottom: '18%', height: '15%',
          background: 'linear-gradient(180deg, #4a8aaa, #3a7090)',
          overflow: 'hidden',
        }}>
          {/* Water ripples */}
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              position: 'absolute', left: `${i * 22 - 5}%`, top: `${30 + i * 12}%`,
              width: '30%', height: '2px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              animation: `waterRipple ${3 + i * 0.5}s linear infinite`,
            }} />
          ))}
        </div>
      )}

      {/* Road / ground */}
      <div style={{
        position: 'absolute', width: '100%', bottom: 0,
        height: terrainType === 'river' ? '18%' : '28%',
        background: snowGround
          ? 'linear-gradient(180deg, #e8e8ec, #d0d0d8)'
          : ground === 'muddy' || ground === 'sloshy'
          ? `linear-gradient(180deg, #7a6040, #6a5030)`
          : `linear-gradient(180deg, ${t.road[0]}, ${t.road[1]})`,
      }}>
        {/* Dashed center line */}
        <div style={{
          position: 'absolute', left: '48%', right: '48%', top: 0, bottom: 0,
          borderLeft: `1px dashed ${t.roadLine}`,
          borderRight: `1px dashed ${t.roadLine}`,
        }} />
        {/* Puddles (muddy/wet ground) */}
        {(ground === 'muddy' || ground === 'sloshy' || ground === 'wet') && (
          <>
            <div style={{ position: 'absolute', left: '20%', top: '30%', width: '40px', height: '12px', borderRadius: '50%', background: 'rgba(80,100,120,0.25)' }} />
            <div style={{ position: 'absolute', left: '55%', top: '55%', width: '30px', height: '10px', borderRadius: '50%', background: 'rgba(80,100,120,0.2)' }} />
            <div style={{ position: 'absolute', left: '75%', top: '20%', width: '25px', height: '8px', borderRadius: '50%', background: 'rgba(80,100,120,0.18)' }} />
          </>
        )}
        {/* Ice sheen */}
        {ground === 'icy' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(180,210,240,0.15)', pointerEvents: 'none' }} />
        )}
      </div>

      {/* Trees — terrain-specific */}
      {terrainType === 'mountains' && (
        <>
          <PineTree left="5%" bottom="28%" scale={0.9} windLevel={windLevel} />
          <PineTree left="15%" bottom="30%" scale={0.7} windLevel={windLevel} />
          <PineTree left="72%" bottom="28%" scale={1} windLevel={windLevel} />
          <PineTree left="82%" bottom="32%" scale={0.6} windLevel={windLevel} />
          <PineTree left="90%" bottom="29%" scale={0.8} windLevel={windLevel} />
        </>
      )}
      {terrainType === 'plains' && (
        <>
          <Tree left="85%" bottom="28%" scale={0.8} windLevel={windLevel} />
          {/* Prairie grass tufts */}
          {[10, 25, 40, 55, 70].map(x => (
            <GrassTuft key={x} left={`${x}%`} bottom="28%" tall windLevel={windLevel} color={t.grass.color1} />
          ))}
        </>
      )}
      {terrainType === 'hills' && (
        <>
          <ScrubBush left="10%" bottom="27%" scale={0.8} />
          <ScrubBush left="30%" bottom="29%" scale={0.6} />
          <ScrubBush left="75%" bottom="28%" scale={0.7} />
          <Tree left="50%" bottom="30%" scale={0.7} windLevel={windLevel} />
        </>
      )}
      {terrainType === 'river' && (
        <>
          <WillowTree left="8%" bottom="33%" scale={0.9} windLevel={windLevel} />
          <WillowTree left="80%" bottom="34%" scale={0.7} windLevel={windLevel} />
          <Tree left="92%" bottom="32%" scale={0.6} windLevel={windLevel} />
        </>
      )}

      {/* Clouds — vary by condition */}
      {!['fog', 'dust_storm', 'blizzard', 'heavy_snow'].includes(condition) && (
        <>
          <Cloud left="12%" top="6%" scale={1} traveling={isTraveling} dark={showRain || showSnow} />
          <Cloud left="55%" top="12%" scale={0.7} traveling={isTraveling} slow dark={showRain || showSnow} />
          {['cloudy', 'overcast', 'light_rain', 'rain', 'heavy_rain', 'thunderstorm', 'snow', 'light_snow'].includes(condition) && (
            <>
              <Cloud left="30%" top="4%" scale={0.9} traveling={isTraveling} dark />
              <Cloud left="75%" top="8%" scale={0.6} traveling={isTraveling} slow dark />
            </>
          )}
        </>
      )}

      {/* Wagon group */}
      <div
        className={isTraveling ? 'wagon-traveling' : ''}
        style={{
          position: 'absolute',
          bottom: terrainType === 'river' ? '16%' : '20%',
          left: '38%',
          display: 'flex', alignItems: 'flex-end', gap: '2px',
        }}
      >
        <span style={{ fontSize: '20px', lineHeight: 1 }}>🐂</span>
        <span style={{ fontSize: '20px', lineHeight: 1 }}>🐂</span>
        <div className={isTraveling ? 'wagon-wobble' : ''} style={{ position: 'relative', marginLeft: '2px' }}>
          <div style={{
            width: '36px', height: '18px',
            background: '#f0e6d0', borderRadius: '8px 8px 0 0',
            border: '1.5px solid #a08060', borderBottom: 'none',
          }} />
          <div style={{
            width: '40px', height: '8px', marginLeft: '-2px',
            background: '#8a6a3a', borderRadius: '0 0 3px 3px',
            border: '1.5px solid #6a4a2a',
          }} />
          <div style={{
            position: 'absolute', bottom: '-5px', left: '2px',
            width: '10px', height: '10px', borderRadius: '50%',
            border: '2px solid #5a3a1a', background: '#8a6a3a',
          }} />
          <div style={{
            position: 'absolute', bottom: '-5px', right: '4px',
            width: '10px', height: '10px', borderRadius: '50%',
            border: '2px solid #5a3a1a', background: '#8a6a3a',
          }} />
        </div>
        {isTraveling && (
          <div className="dust-puff" style={{
            position: 'absolute', bottom: '2px', left: '-10px',
            width: '12px', height: '8px', borderRadius: '50%',
            background: snowGround ? 'rgba(220,220,240,0.5)' : 'rgba(180,150,100,0.5)',
          }} />
        )}
      </div>

      {/* ═══ WEATHER OVERLAYS ═══ */}

      {/* Storm darkening overlay */}
      {['thunderstorm', 'heavy_rain', 'blizzard', 'heavy_snow'].includes(condition) && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,20,40,0.3)', pointerEvents: 'none' }} />
      )}

      {/* Rain */}
      {showRain && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {Array.from({ length: rainCount }, (_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(i * (100 / rainCount)) + (Math.sin(i * 7) * 3)}%`,
              top: '-5%',
              width: '1.5px',
              height: `${8 + (i % 4) * 2}px`,
              background: condition === 'heavy_rain' || condition === 'thunderstorm'
                ? 'rgba(180,200,220,0.55)' : 'rgba(140,170,200,0.4)',
              animation: `${rainAnim} ${condition === 'heavy_rain' || condition === 'thunderstorm' ? '0.45s' : condition === 'rain' ? '0.65s' : '0.85s'} linear infinite`,
              animationDelay: `${(i * 0.033)}s`,
            }} />
          ))}
        </div>
      )}

      {/* Snow */}
      {showSnow && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {Array.from({ length: snowCount }, (_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(i * (100 / snowCount)) + (Math.sin(i * 5) * 5)}%`,
              top: '-3%',
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.85)',
              animation: `${snowAnim} ${2 + (i % 5) * 0.5}s linear infinite`,
              animationDelay: `${(i * 0.08)}s`,
            }} />
          ))}
        </div>
      )}

      {/* Hail */}
      {showHail && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(i * 5) + (Math.sin(i * 3) * 3)}%`,
              top: '-5%',
              width: '4px', height: '4px', borderRadius: '50%',
              background: 'rgba(220,230,240,0.9)',
              boxShadow: '0 0 2px rgba(200,210,220,0.5)',
              animation: `hailBounce ${0.6 + (i % 3) * 0.15}s linear infinite`,
              animationDelay: `${i * 0.12}s`,
            }} />
          ))}
        </div>
      )}

      {/* Lightning */}
      {showLightning && (
        <div style={{
          position: 'absolute', top: '5%', left: '30%', width: '3px',
          height: '40%', pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(255,255,200,0.9), rgba(255,255,200,0))',
          clipPath: 'polygon(50% 0%, 70% 25%, 40% 30%, 65% 55%, 35% 60%, 55% 85%, 45% 100%, 55% 60%, 30% 55%, 60% 30%, 35% 25%)',
          animation: 'lightningFlash 4s ease-in-out infinite',
          animationDelay: '1.5s',
        }} />
      )}

      {/* Fog overlay */}
      {showFog && (
        <>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(200,208,216,0.1) 0%, rgba(200,208,216,0.5) 50%, rgba(200,208,216,0.75) 100%)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
            background: 'rgba(200,208,216,0.5)', pointerEvents: 'none',
            filter: 'blur(8px)',
          }} />
        </>
      )}

      {/* Dust storm overlay */}
      {showDust && (
        <>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'rgba(140,100,50,0.3)',
          }} />
          {Array.from({ length: 15 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${-10 + (Math.sin(i * 4) * 5)}%`,
              top: `${20 + (i * 5)}%`,
              width: `${8 + (i % 4) * 4}px`,
              height: `${3 + (i % 3)}px`,
              borderRadius: '50%',
              background: 'rgba(160,120,60,0.5)',
              animation: `dustBlow ${1.5 + (i % 4) * 0.5}s linear infinite`,
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </>
      )}

      {/* Heat shimmer */}
      {showHeat && (
        <div style={{
          position: 'absolute', bottom: '26%', left: 0, right: 0, height: '6%',
          background: 'linear-gradient(180deg, rgba(255,200,100,0.08), transparent)',
          animation: 'heatShimmer 2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Cold frost tint */}
      {temp < 32 && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'rgba(180,200,230,0.08)',
          boxShadow: 'inset 0 0 40px rgba(180,200,230,0.15)',
        }} />
      )}

      {/* Blizzard whiteout */}
      {condition === 'blizzard' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'rgba(220,225,230,0.35)',
        }} />
      )}
    </div>
  );
}

// ── Terrain elements ───────────────────────────────────────────────────────

function Tree({ left, bottom, scale = 1, windLevel = 'calm' }) {
  const anim = windLevel === 'gale' ? 'treeBendStrong 1.5s ease-in-out infinite' :
               windLevel === 'strong' ? 'treeBend 2s ease-in-out infinite' : 'none';
  return (
    <div style={{
      position: 'absolute', left, bottom, transform: `scale(${scale})`,
      transformOrigin: 'bottom center', animation: anim,
    }}>
      <div style={{ width: '6px', height: '16px', background: '#5a3a1a', margin: '0 auto', borderRadius: '1px' }} />
      <div style={{
        width: '22px', height: '24px', background: '#3a6830',
        borderRadius: '50% 50% 40% 40%', marginTop: '-12px',
        boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.15)',
      }} />
    </div>
  );
}

function PineTree({ left, bottom, scale = 1, windLevel = 'calm' }) {
  const anim = windLevel === 'gale' ? 'treeBendStrong 1.5s ease-in-out infinite' :
               windLevel === 'strong' ? 'treeBend 2s ease-in-out infinite' : 'none';
  return (
    <div style={{
      position: 'absolute', left, bottom, transform: `scale(${scale})`,
      transformOrigin: 'bottom center', animation: anim,
    }}>
      <div style={{ width: '4px', height: '12px', background: '#3a2a1a', margin: '0 auto' }} />
      <div style={{
        width: 0, height: 0, marginTop: '-8px',
        borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
        borderBottom: '18px solid #2a5a1a', margin: '0 auto -8px',
      }} />
      <div style={{
        width: 0, height: 0,
        borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
        borderBottom: '14px solid #2a5a1a', margin: '0 auto -6px',
      }} />
    </div>
  );
}

function WillowTree({ left, bottom, scale = 1, windLevel = 'calm' }) {
  const anim = windLevel === 'gale' ? 'treeBendStrong 1.5s ease-in-out infinite' :
               windLevel === 'strong' ? 'treeBend 2s ease-in-out infinite' : 'none';
  return (
    <div style={{
      position: 'absolute', left, bottom, transform: `scale(${scale})`,
      transformOrigin: 'bottom center', animation: anim,
    }}>
      <div style={{ width: '5px', height: '20px', background: '#5a4a2a', margin: '0 auto', borderRadius: '1px' }} />
      <div style={{
        width: '30px', height: '22px', background: '#4a7a3a',
        borderRadius: '40% 40% 60% 60%', marginTop: '-14px',
        boxShadow: 'inset -2px 3px 5px rgba(0,0,0,0.1)',
      }} />
    </div>
  );
}

function ScrubBush({ left, bottom, scale = 1 }) {
  return (
    <div style={{
      position: 'absolute', left, bottom, transform: `scale(${scale})`,
      transformOrigin: 'bottom center',
    }}>
      <div style={{
        width: '16px', height: '10px', background: '#6a7a50',
        borderRadius: '50%',
        boxShadow: 'inset -2px -1px 3px rgba(0,0,0,0.1)',
      }} />
    </div>
  );
}

function GrassTuft({ left, bottom, tall = false, windLevel = 'calm', color = '#7a8a3a' }) {
  const anim = windLevel === 'gale' ? 'grassSwayStrong 0.8s ease-in-out infinite' :
               windLevel === 'strong' || windLevel === 'moderate' ? 'grassSway 1.5s ease-in-out infinite' : 'none';
  const h = tall ? '14px' : '8px';
  return (
    <div style={{
      position: 'absolute', left, bottom, width: '12px', height: h,
      transformOrigin: 'bottom center', animation: anim,
    }}>
      <div style={{ position: 'absolute', left: '2px', bottom: 0, width: '2px', height: '100%', background: color, borderRadius: '1px 1px 0 0', transform: 'rotate(-8deg)' }} />
      <div style={{ position: 'absolute', left: '5px', bottom: 0, width: '2px', height: '85%', background: color, borderRadius: '1px 1px 0 0', transform: 'rotate(5deg)', opacity: 0.8 }} />
      <div style={{ position: 'absolute', left: '8px', bottom: 0, width: '2px', height: '70%', background: color, borderRadius: '1px 1px 0 0', transform: 'rotate(12deg)', opacity: 0.7 }} />
    </div>
  );
}

function Cloud({ left, top, scale = 1, traveling = false, slow = false, dark = false }) {
  return (
    <div
      className={traveling ? (slow ? 'cloud-drift-slow' : 'cloud-drift') : ''}
      style={{
        position: 'absolute', left, top, transform: `scale(${scale})`,
        width: '60px', height: '20px',
      }}
    >
      <div style={{
        position: 'absolute', left: '10px', top: '4px',
        width: '40px', height: '16px', borderRadius: '10px',
        background: dark ? 'rgba(130,140,150,0.7)' : 'rgba(255,255,255,0.85)',
      }} />
      <div style={{
        position: 'absolute', left: '20px', top: '0',
        width: '24px', height: '14px', borderRadius: '50%',
        background: dark ? 'rgba(120,130,140,0.75)' : 'rgba(255,255,255,0.9)',
      }} />
      <div style={{
        position: 'absolute', left: '5px', top: '6px',
        width: '18px', height: '12px', borderRadius: '50%',
        background: dark ? 'rgba(130,140,150,0.65)' : 'rgba(255,255,255,0.8)',
      }} />
    </div>
  );
}
