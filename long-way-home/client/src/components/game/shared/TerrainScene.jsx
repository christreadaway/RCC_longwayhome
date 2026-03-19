/**
 * TerrainScene — renders an immersive SVG landscape with animated wagon and walking family.
 * Hero visual: 2/3 of screen width.
 * Terrain types: plains, hills, mountains, river
 * Weather overlays: rain, snow, fog, lightning, dust storm, snow ground
 */
export default function TerrainScene({ terrainType, landmarkName, weather, partyMembers }) {
  const condition = weather?.condition || '';
  const ground = weather?.ground || '';

  const skyColors = getSkyColors(condition);

  const alive = (partyMembers || []).filter(m => m.alive && !m.isChaplain);
  const hasChaplain = (partyMembers || []).some(m => m.isChaplain && m.alive);

  // Determine which weather overlays to show
  const showRain = condition.includes('rain') || condition === 'thunderstorm' || condition === 'hail';
  const isHeavyRain = condition === 'heavy_rain' || condition === 'thunderstorm' || condition === 'hail';
  const showSnow = condition.includes('snow') || condition === 'blizzard';
  const isHeavySnow = condition === 'blizzard' || condition === 'heavy_snow';
  const showFog = condition === 'fog';
  const showLightning = condition === 'thunderstorm';
  const showDust = condition === 'dust_storm';
  const showSnowGround = ground === 'snowpack' || ground === 'icy';

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#5a9fd4]">
      <svg viewBox="0 0 800 280" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="heroSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyColors.top} />
            <stop offset="100%" stopColor={skyColors.bottom} />
          </linearGradient>
          <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6a8a3a" />
            <stop offset="100%" stopColor="#4a6a2a" />
          </linearGradient>
          <linearGradient id="dirtTrail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9a8060" />
            <stop offset="100%" stopColor="#7a6040" />
          </linearGradient>
          {/* Fog gradient for bottom-up fade */}
          <linearGradient id="fogGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="30%" stopColor="white" stopOpacity="0.15" />
            <stop offset="60%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0.65" />
          </linearGradient>
        </defs>

        <rect width="800" height="280" fill="url(#heroSky)" />

        {/* Animated clouds — hide during dust storm */}
        {!showDust && (
          <g opacity="0.6">
            <ellipse cx="150" cy="40" rx="60" ry="15" fill="white">
              <animateTransform attributeName="transform" type="translate" values="0,0;15,0;0,0" dur="20s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="130" cy="38" rx="40" ry="12" fill="white">
              <animateTransform attributeName="transform" type="translate" values="0,0;12,0;0,0" dur="22s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="480" cy="30" rx="50" ry="12" fill="white">
              <animateTransform attributeName="transform" type="translate" values="0,0;-10,0;0,0" dur="25s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="650" cy="50" rx="45" ry="10" fill="white" opacity="0.5" />
          </g>
        )}

        {/* Sun — hide during heavy weather */}
        {!showDust && !isHeavyRain && !isHeavySnow && condition !== 'fog' && (
          <>
            <circle cx="680" cy="45" r="20" fill="#f4d35e" opacity="0.8" />
            <circle cx="680" cy="45" r="25" fill="#f4d35e" opacity="0.15" />
          </>
        )}

        {terrainType === 'plains' && <PlainsScene />}
        {terrainType === 'hills' && <HillsScene />}
        {terrainType === 'mountains' && <MountainsScene />}
        {terrainType === 'river' && <RiverScene />}
        {!['plains', 'hills', 'mountains', 'river'].includes(terrainType) && <PlainsScene />}

        <rect x="0" y="220" width="800" height="60" fill="url(#groundGrad)" />

        {/* Snow ground overlay */}
        {showSnowGround && <SnowGroundOverlay ground={ground} />}

        {/* Trail */}
        <path d="M-20,255 Q100,248 200,252 Q350,258 500,250 Q650,244 820,248" stroke="url(#dirtTrail)" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M-20,255 Q100,248 200,252 Q350,258 500,250 Q650,244 820,248" stroke="#8a7050" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3" strokeDasharray="4,8" />

        {/* Walking family members — sized and styled by age group */}
        {alive.slice(0, 4).map((m, i) => {
          const bx = 418 + i * 20;
          const by = 238;
          const isFemale = m.gender === 'female';
          const age = m.age || 25;
          const isChild = age < 13;
          const isTeen = age >= 13 && age < 18;
          const isElder = age >= 55;
          const sc = isChild ? 0.7 : isTeen ? 0.88 : isElder ? 0.95 : 1;
          // Teens bounce faster (more energy), elders walk slower
          const dur = isElder ? `${0.75 + i * 0.08}s` : isTeen ? `${0.42 + i * 0.06}s` : `${0.55 + i * 0.08}s`;
          // Age-appropriate clothing colors
          const bodyColor = isFemale
            ? (isChild ? '#B89ACB' : isTeen ? '#A07DB8' : isElder ? '#7A6080' : '#8B6D9B')
            : (isChild ? '#8BA0B5' : isTeen ? '#5A7A9D' : isElder ? '#6A7078' : '#6B7A8D');
          const hairColor = isElder ? '#B0A898' : isFemale ? '#C4946B' : '#5C4033';
          return (
            <g key={m.name} transform={`translate(${bx}, ${by}) scale(${sc})`}>
              <animateTransform attributeName="transform" type="translate" values={`${bx},${by};${bx},${by - 1.5};${bx},${by}`} dur={dur} repeatCount="indefinite" additive="sum" />
              <rect x="-2" y="-10" width="4" height="8" rx="1" fill={bodyColor} />
              <circle cx="0" cy="-13" r="3" fill="#D4A574" />
              {isFemale
                ? <ellipse cx="0" cy="-15" rx="3.5" ry="1.5" fill={hairColor} />
                : <rect x="-3" y="-16" width="6" height="2" rx="0.5" fill={hairColor} />}
              {/* Elder: walking stick */}
              {isElder && <line x1="4" y1="-8" x2="5" y2="4" stroke="#8B7355" strokeWidth="1" />}
              <line x1="-1" y1="-2" x2="-2.5" y2="3" stroke="#5C4033" strokeWidth="1.5">
                <animate attributeName="x2" values="-2.5;0.5;-2.5" dur={dur} repeatCount="indefinite" />
              </line>
              <line x1="1" y1="-2" x2="2.5" y2="3" stroke="#5C4033" strokeWidth="1.5">
                <animate attributeName="x2" values="2.5;-0.5;2.5" dur={dur} repeatCount="indefinite" />
              </line>
            </g>
          );
        })}

        {/* Chaplain */}
        {hasChaplain && (
          <g transform="translate(310, 238)">
            <animateTransform attributeName="transform" type="translate" values="310,238;310,236.5;310,238" dur="0.7s" repeatCount="indefinite" />
            <rect x="-3" y="-12" width="6" height="10" rx="1" fill="#2a2a2a" />
            <circle cx="0" cy="-15" r="3" fill="#D4A574" />
            <circle cx="0" cy="-17" r="2" fill="#3a2a1a" />
            <line x1="4" y1="-14" x2="4" y2="-6" stroke="#D4A017" strokeWidth="1.2" />
            <line x1="2" y1="-11" x2="6" y2="-11" stroke="#D4A017" strokeWidth="1.2" />
            <line x1="-1" y1="-2" x2="-2" y2="3" stroke="#1a1a1a" strokeWidth="1.5"><animate attributeName="x2" values="-2;1;-2" dur="0.7s" repeatCount="indefinite" /></line>
            <line x1="1" y1="-2" x2="2" y2="3" stroke="#1a1a1a" strokeWidth="1.5"><animate attributeName="x2" values="2;-1;2" dur="0.7s" repeatCount="indefinite" /></line>
          </g>
        )}

        {/* Wagon */}
        <g transform="translate(340, 228)" className="wagon-animate">
          <rect x="0" y="4" width="40" height="16" rx="3" fill="#8B6914" stroke="#5C4033" strokeWidth="1.5" />
          <path d="M-2,4 Q20,-8 42,4" fill="#F0E8D0" stroke="#8B7355" strokeWidth="1" />
          <path d="M2,4 Q20,-4 38,4" fill="none" stroke="#d4c4a0" strokeWidth="0.5" />
          {/* Wheels with spokes */}
          <g><circle cx="8" cy="24" r="6" fill="none" stroke="#5C4033" strokeWidth="2" /><circle cx="8" cy="24" r="1" fill="#5C4033" />
            <g><animateTransform attributeName="transform" type="rotate" from="0 8 24" to="360 8 24" dur="2s" repeatCount="indefinite" />
              <line x1="8" y1="18" x2="8" y2="30" stroke="#5C4033" strokeWidth="0.5" /><line x1="2" y1="24" x2="14" y2="24" stroke="#5C4033" strokeWidth="0.5" />
            </g>
          </g>
          <g><circle cx="32" cy="24" r="6" fill="none" stroke="#5C4033" strokeWidth="2" /><circle cx="32" cy="24" r="1" fill="#5C4033" />
            <g><animateTransform attributeName="transform" type="rotate" from="0 32 24" to="360 32 24" dur="2s" repeatCount="indefinite" />
              <line x1="32" y1="18" x2="32" y2="30" stroke="#5C4033" strokeWidth="0.5" /><line x1="26" y1="24" x2="38" y2="24" stroke="#5C4033" strokeWidth="0.5" />
            </g>
          </g>
          <line x1="-2" y1="12" x2="-28" y2="14" stroke="#5C4033" strokeWidth="2" />
          {/* Oxen */}
          <g transform="translate(-52, 4)">
            <animateTransform attributeName="transform" type="translate" values="-52,4;-52,3;-52,4" dur="0.8s" repeatCount="indefinite" />
            <ellipse cx="12" cy="14" rx="10" ry="7" fill="#8B7355" stroke="#5C4033" strokeWidth="0.8" />
            <circle cx="4" cy="11" r="3" fill="#7a6345" stroke="#5C4033" strokeWidth="0.5" />
            <path d="M2,9 Q0,6 3,8" stroke="#d4c4a0" strokeWidth="0.8" fill="none" />
            <path d="M6,9 Q8,6 5,8" stroke="#d4c4a0" strokeWidth="0.8" fill="none" />
          </g>
          <g transform="translate(-36, 4)">
            <animateTransform attributeName="transform" type="translate" values="-36,4;-36,3;-36,4" dur="0.9s" repeatCount="indefinite" />
            <ellipse cx="12" cy="14" rx="10" ry="7" fill="#7a6345" stroke="#5C4033" strokeWidth="0.8" />
            <circle cx="4" cy="11" r="3" fill="#6a5335" stroke="#5C4033" strokeWidth="0.5" />
            <path d="M2,9 Q0,6 3,8" stroke="#d4c4a0" strokeWidth="0.8" fill="none" />
            <path d="M6,9 Q8,6 5,8" stroke="#d4c4a0" strokeWidth="0.8" fill="none" />
          </g>
        </g>

        {/* Dust (trail dust — hide during rain/snow) */}
        {!showRain && !showSnow && (
          <g opacity="0.2">
            <ellipse cx="395" cy="258" rx="12" ry="3" fill="#c4a470"><animate attributeName="opacity" values="0.2;0.08;0.2" dur="1.5s" repeatCount="indefinite" /></ellipse>
            <ellipse cx="410" cy="260" rx="8" ry="2" fill="#c4a470" />
          </g>
        )}

        {/* Foreground grass */}
        {[20, 80, 160, 250, 450, 560, 640, 720, 780].map(x => (
          <g key={x} opacity="0.7">
            <line x1={x} y1={265} x2={x - 3} y2={258} stroke="#3a5a1a" strokeWidth="1" />
            <line x1={x + 2} y1={265} x2={x + 4} y2={257} stroke="#4a6a2a" strokeWidth="1" />
            <line x1={x + 5} y1={265} x2={x + 3} y2={259} stroke="#3a5a1a" strokeWidth="0.8" />
          </g>
        ))}

        {/* === WEATHER OVERLAYS === */}

        {/* Rain overlay */}
        {showRain && <RainOverlay heavy={isHeavyRain} />}

        {/* Snow overlay */}
        {showSnow && <SnowOverlay heavy={isHeavySnow} />}

        {/* Fog overlay */}
        {showFog && <FogOverlay />}

        {/* Lightning flash */}
        {showLightning && <LightningOverlay />}

        {/* Dust storm overlay */}
        {showDust && <DustStormOverlay />}
      </svg>

      {landmarkName && <div className="absolute bottom-1 left-2 text-[10px] text-white/60 font-serif italic">Near {landmarkName}</div>}
    </div>
  );
}

/** Determine sky gradient colors based on weather condition */
function getSkyColors(condition) {
  if (condition === 'fog') return { top: '#c0c8d0', bottom: '#d8dce0' };
  if (condition === 'dust_storm') return { top: '#8a7050', bottom: '#a08060' };
  if (condition === 'thunderstorm') return { top: '#3a3a50', bottom: '#5a5a68' };
  if (condition === 'blizzard' || condition === 'heavy_snow') return { top: '#8a8e94', bottom: '#a0a4aa' };
  if (condition === 'light_snow' || condition.includes('snow')) return { top: '#b0b8c0', bottom: '#c8ccd0' };
  if (condition === 'heavy_rain') return { top: '#5a6a7a', bottom: '#7a8a95' };
  if (condition === 'overcast' || condition === 'rain' || condition === 'light_rain' || condition === 'hail') return { top: '#8a9aaa', bottom: '#a0aab5' };
  return { top: '#5a9fd4', bottom: '#a8d0e8' };
}

/** Rain — angled SVG lines falling from top */
function RainOverlay({ heavy }) {
  const color = heavy ? 'rgba(180,200,220,0.5)' : 'rgba(140,170,200,0.4)';
  const strokeWidth = heavy ? 1.2 : 0.8;
  const count = heavy ? 40 : 22;

  // Generate deterministic rain drop positions
  const drops = [];
  for (let i = 0; i < count; i++) {
    const x = (i * 53 + 17) % 800;
    const y = (i * 37 + 11) % 200;
    const len = heavy ? 18 + (i % 8) : 12 + (i % 6);
    const delay = `${(i * 0.13) % 1.2}s`;
    drops.push({ x, y, len, delay });
  }

  return (
    <g>
      {drops.map((d, i) => (
        <line
          key={i}
          x1={d.x}
          y1={d.y}
          x2={d.x - 4}
          y2={d.y + d.len}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        >
          <animate
            attributeName="y1"
            values={`${d.y};${d.y + 280};${d.y}`}
            dur="1.2s"
            begin={d.delay}
            repeatCount="indefinite"
          />
          <animate
            attributeName="y2"
            values={`${d.y + d.len};${d.y + d.len + 280};${d.y + d.len}`}
            dur="1.2s"
            begin={d.delay}
            repeatCount="indefinite"
          />
        </line>
      ))}
    </g>
  );
}

/** Snow — floating SVG circles */
function SnowOverlay({ heavy }) {
  const count = heavy ? 50 : 25;
  const flakes = [];
  for (let i = 0; i < count; i++) {
    const cx = (i * 67 + 23) % 800;
    const cy = (i * 43 + 7) % 260;
    const r = 1 + (i % 3);
    const dur = `${3 + (i % 4)}s`;
    const delay = `${(i * 0.2) % 3}s`;
    flakes.push({ cx, cy, r, dur, delay });
  }

  return (
    <g>
      {flakes.map((f, i) => (
        <circle
          key={i}
          cx={f.cx}
          cy={f.cy}
          r={f.r}
          fill="white"
          opacity={0.6 + (i % 3) * 0.1}
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`0,0;${(i % 2 === 0 ? 10 : -10)},${40 + (i % 20)};${(i % 2 === 0 ? -5 : 5)},${80 + (i % 30)};0,${120 + (i % 40)}`}
            dur={f.dur}
            begin={f.delay}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </g>
  );
}

/** Fog — semi-transparent white covering bottom 60% with gradient fade */
function FogOverlay() {
  return (
    <g>
      <rect x="0" y="112" width="800" height="168" fill="url(#fogGrad)" />
      {/* Drifting fog wisps */}
      <ellipse cx="200" cy="180" rx="120" ry="20" fill="white" opacity="0.2">
        <animateTransform attributeName="transform" type="translate" values="0,0;30,0;0,0" dur="12s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="500" cy="200" rx="100" ry="15" fill="white" opacity="0.18">
        <animateTransform attributeName="transform" type="translate" values="0,0;-25,0;0,0" dur="15s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="700" cy="170" rx="80" ry="18" fill="white" opacity="0.15">
        <animateTransform attributeName="transform" type="translate" values="0,0;20,0;0,0" dur="10s" repeatCount="indefinite" />
      </ellipse>
    </g>
  );
}

/** Lightning — zigzag bolt that flashes rapidly */
function LightningOverlay() {
  return (
    <g>
      <path
        d="M320,20 L310,60 L325,58 L305,110 L322,105 L295,160"
        stroke="#f0e8c0"
        strokeWidth="2.5"
        fill="none"
        opacity="0"
        strokeLinejoin="round"
      >
        <animate
          attributeName="opacity"
          values="0;0;0;1;0;0.6;0;0;0;0;0;0;0;0;0"
          dur="4s"
          repeatCount="indefinite"
        />
      </path>
      {/* Screen flash effect */}
      <rect width="800" height="280" fill="white" opacity="0">
        <animate
          attributeName="opacity"
          values="0;0;0;0.15;0;0.08;0;0;0;0;0;0;0;0;0"
          dur="4s"
          repeatCount="indefinite"
        />
      </rect>
    </g>
  );
}

/** Dust storm — orange-brown overlay with horizontal particles */
function DustStormOverlay() {
  const particles = [];
  for (let i = 0; i < 30; i++) {
    const y = 40 + (i * 31 + 13) % 220;
    const startX = -20 - (i * 47) % 200;
    const w = 15 + (i % 10) * 3;
    const h = 1 + (i % 3);
    const dur = `${1.5 + (i % 5) * 0.3}s`;
    const delay = `${(i * 0.15) % 2}s`;
    particles.push({ y, startX, w, h, dur, delay });
  }

  return (
    <g>
      {/* Overall dust tint */}
      <rect width="800" height="280" fill="rgba(140,110,70,0.3)" />
      {/* Horizontal streaking particles */}
      {particles.map((p, i) => (
        <rect
          key={i}
          x={p.startX}
          y={p.y}
          width={p.w}
          height={p.h}
          rx={p.h / 2}
          fill="rgba(160,120,60,0.4)"
          opacity="0.5"
        >
          <animate
            attributeName="x"
            values={`${p.startX};820`}
            dur={p.dur}
            begin={p.delay}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.5;0.4;0"
            dur={p.dur}
            begin={p.delay}
            repeatCount="indefinite"
          />
        </rect>
      ))}
    </g>
  );
}

/** Snow/ice ground — white/blue-white rect over ground area */
function SnowGroundOverlay({ ground }) {
  const color = ground === 'icy' ? 'rgba(200,220,240,0.55)' : 'rgba(240,245,250,0.6)';
  return (
    <g>
      <rect x="0" y="220" width="800" height="60" fill={color} />
      {/* Subtle snow texture dots */}
      {[30, 90, 170, 260, 350, 440, 530, 610, 700, 770].map(x => (
        <circle key={x} cx={x} cy={235 + (x % 7)} r={1.5} fill="white" opacity="0.4" />
      ))}
    </g>
  );
}

function PlainsScene() {
  return (<g>
    <path d="M0,215 Q200,208 400,212 Q600,206 800,210 L800,220 L0,220 Z" fill="#8aa54a" opacity="0.5" />
    <path d="M0,218 Q150,212 300,216 Q500,210 700,215 L800,213 L800,220 L0,220 Z" fill="#7a9a3a" opacity="0.6" />
    {[50, 120, 200, 310, 420, 530, 620, 710].map(x => (<g key={x} opacity="0.5"><line x1={x} y1={220} x2={x - 2} y2={212} stroke="#6a8a2a" strokeWidth="1.2" /><line x1={x + 4} y1={220} x2={x + 5} y2={210} stroke="#5a7a2a" strokeWidth="1" /></g>))}
    <g opacity="0.15" transform="translate(550, 205)"><ellipse cx="0" cy="0" rx="8" ry="5" fill="#3a2a1a" /><ellipse cx="20" cy="1" rx="7" ry="4" fill="#3a2a1a" /><ellipse cx="-15" cy="2" rx="6" ry="4" fill="#3a2a1a" /></g>
  </g>);
}

function HillsScene() {
  return (<g>
    <path d="M0,220 Q80,180 180,195 Q280,170 380,185 Q480,160 580,178 Q680,165 800,180 L800,220 Z" fill="#6a8a3a" opacity="0.35" />
    <path d="M0,220 Q100,190 220,200 Q340,180 460,195 Q580,175 700,190 Q760,182 800,188 L800,220 Z" fill="#5a7a2a" opacity="0.45" />
    {[100, 250, 380, 520, 680].map(x => (<g key={x}><line x1={x} y1={210} x2={x} y2={195} stroke="#3a4a2a" strokeWidth="2" /><circle cx={x} cy={192} r="7" fill="#4a7a2a" opacity="0.6" /></g>))}
  </g>);
}

function MountainsScene() {
  return (<g>
    <polygon points="80,220 160,90 240,220" fill="#6a7a8a" opacity="0.35" />
    <polygon points="160,220 260,70 360,220" fill="#7a8a9a" opacity="0.4" />
    <polygon points="350,220 440,100 530,220" fill="#6a7a8a" opacity="0.35" />
    <polygon points="480,220 560,85 640,220" fill="#7a8a9a" opacity="0.38" />
    <polygon points="600,220 680,110 760,220" fill="#6a7a8a" opacity="0.32" />
    <polygon points="152,100 160,90 168,100" fill="white" opacity="0.8" />
    <polygon points="250,82 260,70 270,82" fill="white" opacity="0.85" />
    <polygon points="432,110 440,100 448,110" fill="white" opacity="0.75" />
    <polygon points="552,95 560,85 568,95" fill="white" opacity="0.8" />
    <path d="M0,220 Q80,190 180,200 Q300,180 420,195 Q540,178 660,192 Q740,185 800,195 L800,220 Z" fill="#4a6a2a" opacity="0.5" />
    {[40, 120, 220, 300, 480, 580, 700, 760].map(x => (<g key={x}><line x1={x} y1={220} x2={x} y2={205} stroke="#2a3a1a" strokeWidth="1.5" /><polygon points={`${x - 6},215 ${x},200 ${x + 6},215`} fill="#2a5a1a" opacity="0.7" /></g>))}
  </g>);
}

function RiverScene() {
  return (<g>
    <path d="M0,195 Q200,185 400,190 Q600,183 800,188 L800,210 L0,210 Z" fill="#5a7a3a" opacity="0.5" />
    {[60, 150, 280, 400, 520, 650, 740].map(x => (<g key={x}><line x1={x} y1={195} x2={x} y2={182} stroke="#3a4a2a" strokeWidth="2" /><circle cx={x} cy={179} r="6" fill="#4a7a2a" opacity="0.6" /></g>))}
    <path d="M0,210 Q150,205 300,208 Q500,202 700,206 L800,204 L800,230 Q600,225 400,228 Q200,232 0,228 Z" fill="#4A7C9B" opacity="0.65" />
    <path d="M100,215 Q130,213 160,215" stroke="white" strokeWidth="1" fill="none" opacity="0.25" />
    <path d="M300,212 Q340,210 380,212" stroke="white" strokeWidth="0.8" fill="none" opacity="0.2" />
    <path d="M500,218 Q540,216 580,218" stroke="white" strokeWidth="1" fill="none" opacity="0.25" />
    <path d="M0,228 Q200,232 400,228 Q600,225 800,230 L800,220 Q600,225 400,228 Q200,232 0,228 Z" fill="#5a7a3a" opacity="0.6" />
  </g>);
}
