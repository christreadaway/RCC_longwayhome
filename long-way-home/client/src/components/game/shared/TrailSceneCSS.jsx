/**
 * Pure CSS/SVG trail scene — no image assets.
 * Sky gradient, hills, road, trees, clouds, wagon, weather overlays.
 */

const SKY = {
  sunny:  'linear-gradient(180deg, #4a90d9 0%, #a8d0f0 55%, #d4e8c2 100%)',
  rainy:  'linear-gradient(180deg, #5a6a7a 0%, #8a9aaa 50%, #aab8aa 100%)',
  stormy: 'linear-gradient(180deg, #2a3040 0%, #4a5060 50%, #6a7068 100%)',
};

export default function TrailSceneCSS({ weather = 'sunny', isTraveling = false }) {
  const condition = weather?.condition || weather || 'sunny';
  const skyKey = condition === 'stormy' ? 'stormy' : condition === 'rainy' ? 'rainy' : 'sunny';
  const showRain = skyKey === 'rainy' || skyKey === 'stormy';

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: SKY[skyKey],
    }}>
      {/* Far hill */}
      <div style={{
        position: 'absolute', width: '140%', left: '-20%', height: '36%', bottom: '27%',
        background: '#5a7c4a', opacity: 0.75, borderRadius: '50% 50% 0 0',
      }} />

      {/* Mid hill */}
      <div style={{
        position: 'absolute', width: '120%', left: '-10%', height: '28%', bottom: '21%',
        background: '#6a8c5a', borderRadius: '50% 50% 0 0',
      }} />

      {/* Road */}
      <div style={{
        position: 'absolute', width: '100%', height: '28%', bottom: 0,
        background: 'linear-gradient(180deg, #c8a870, #b89050)',
      }}>
        {/* Dashed center line */}
        <div style={{
          position: 'absolute', left: '48%', right: '48%', top: 0, bottom: 0,
          borderLeft: '1px dashed rgba(255,220,120,0.28)',
          borderRight: '1px dashed rgba(255,220,120,0.28)',
        }} />
      </div>

      {/* Trees */}
      <Tree left="7%" bottom="28%" scale={1} />
      <Tree left="76%" bottom="27%" scale={0.9} />
      <Tree left="85%" bottom="33%" scale={0.7} />

      {/* Clouds */}
      <Cloud left="15%" top="8%" scale={1} traveling={isTraveling} />
      <Cloud left="60%" top="14%" scale={0.68} traveling={isTraveling} slow />

      {/* Wagon group */}
      <div
        className={isTraveling ? 'wagon-traveling' : ''}
        style={{
          position: 'absolute', bottom: '20%', left: '38%',
          display: 'flex', alignItems: 'flex-end', gap: '2px',
        }}
      >
        {/* Oxen */}
        <span style={{ fontSize: '20px', lineHeight: 1 }}>🐂</span>
        <span style={{ fontSize: '20px', lineHeight: 1 }}>🐂</span>
        {/* Wagon body */}
        <div className={isTraveling ? 'wagon-wobble' : ''} style={{ position: 'relative', marginLeft: '2px' }}>
          {/* Canvas top */}
          <div style={{
            width: '36px', height: '18px',
            background: '#f0e6d0', borderRadius: '8px 8px 0 0',
            border: '1.5px solid #a08060', borderBottom: 'none',
          }} />
          {/* Wagon bed */}
          <div style={{
            width: '40px', height: '8px', marginLeft: '-2px',
            background: '#8a6a3a', borderRadius: '0 0 3px 3px',
            border: '1.5px solid #6a4a2a',
          }} />
          {/* Wheels */}
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
        {/* Dust puff */}
        {isTraveling && (
          <div className="dust-puff" style={{
            position: 'absolute', bottom: '2px', left: '-10px',
            width: '12px', height: '8px', borderRadius: '50%',
            background: 'rgba(180,150,100,0.5)',
          }} />
        )}
      </div>

      {/* Storm overlay */}
      {skyKey === 'stormy' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(20,20,40,0.32)', pointerEvents: 'none',
        }} />
      )}

      {/* Rain drops */}
      {showRain && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(i * 3.33) + Math.random() * 2}%`,
              top: '-5%',
              width: '1.5px',
              height: `${8 + Math.random() * 6}px`,
              background: skyKey === 'stormy' ? 'rgba(180,200,220,0.5)' : 'rgba(140,170,200,0.4)',
              animation: `rainFall ${skyKey === 'stormy' ? '0.5s' : '0.75s'} linear infinite`,
              animationDelay: `${i * 0.05}s`,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function Tree({ left, bottom, scale = 1 }) {
  return (
    <div style={{
      position: 'absolute', left, bottom, transform: `scale(${scale})`, transformOrigin: 'bottom center',
    }}>
      {/* Trunk */}
      <div style={{
        width: '6px', height: '16px', background: '#5a3a1a',
        margin: '0 auto', borderRadius: '1px',
      }} />
      {/* Crown */}
      <div style={{
        width: '22px', height: '24px', background: '#3a6830',
        borderRadius: '50% 50% 40% 40%', marginTop: '-12px',
        boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.15)',
      }} />
    </div>
  );
}

function Cloud({ left, top, scale = 1, traveling = false, slow = false }) {
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
        background: 'rgba(255,255,255,0.85)',
      }} />
      <div style={{
        position: 'absolute', left: '20px', top: '0',
        width: '24px', height: '14px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.9)',
      }} />
      <div style={{
        position: 'absolute', left: '5px', top: '6px',
        width: '18px', height: '12px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.8)',
      }} />
    </div>
  );
}
