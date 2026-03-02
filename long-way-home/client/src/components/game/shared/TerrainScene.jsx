/**
 * TerrainScene — renders a large, immersive SVG landscape.
 * This is the hero visual of the travel screen.
 * Terrain types: plains, hills, mountains, river
 */
export default function TerrainScene({ terrainType, landmarkName, weather, timeOfDay }) {
  // Sky colors based on time of day / weather
  const skyColors = weather?.condition === 'overcast' || weather?.condition === 'rain'
    ? { top: '#8a9aaa', bottom: '#a0aab5' }
    : weather?.condition === 'heavy_rain' || weather?.condition === 'blizzard'
    ? { top: '#5a6a7a', bottom: '#7a8a95' }
    : { top: '#5a9fd4', bottom: '#a8d0e8' };

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
        </defs>

        {/* Sky */}
        <rect width="800" height="280" fill="url(#heroSky)" />

        {/* Clouds */}
        <g opacity="0.6">
          <ellipse cx="150" cy="40" rx="60" ry="15" fill="white" />
          <ellipse cx="130" cy="38" rx="40" ry="12" fill="white" />
          <ellipse cx="480" cy="30" rx="50" ry="12" fill="white" />
          <ellipse cx="650" cy="50" rx="45" ry="10" fill="white" opacity="0.5" />
          <ellipse cx="350" cy="55" rx="35" ry="8" fill="white" opacity="0.4" />
        </g>

        {/* Sun/Moon */}
        <circle cx="680" cy="45" r="20" fill="#f4d35e" opacity="0.8" />
        <circle cx="680" cy="45" r="25" fill="#f4d35e" opacity="0.15" />

        {/* Terrain-specific elements */}
        {terrainType === 'plains' && <PlainsScene />}
        {terrainType === 'hills' && <HillsScene />}
        {terrainType === 'mountains' && <MountainsScene />}
        {terrainType === 'river' && <RiverScene />}
        {!['plains', 'hills', 'mountains', 'river'].includes(terrainType) && <PlainsScene />}

        {/* Main ground */}
        <rect x="0" y="220" width="800" height="60" fill="url(#groundGrad)" />

        {/* Trail / dirt road */}
        <path d="M-20,255 Q100,248 200,252 Q350,258 500,250 Q650,244 820,248"
          stroke="url(#dirtTrail)" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M-20,255 Q100,248 200,252 Q350,258 500,250 Q650,244 820,248"
          stroke="#8a7050" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3"
          strokeDasharray="4,8" />

        {/* Wagon (larger, more detailed) */}
        <g transform="translate(340, 228)" className="wagon-animate">
          {/* Wagon body */}
          <rect x="0" y="4" width="40" height="16" rx="3" fill="#8B6914" stroke="#5C4033" strokeWidth="1.5" />
          {/* Canvas top */}
          <path d="M-2,4 Q20,-8 42,4" fill="#F0E8D0" stroke="#8B7355" strokeWidth="1" />
          <path d="M2,4 Q20,-4 38,4" fill="none" stroke="#d4c4a0" strokeWidth="0.5" />
          {/* Wheels */}
          <g>
            <circle cx="8" cy="24" r="6" fill="none" stroke="#5C4033" strokeWidth="2" />
            <circle cx="8" cy="24" r="1" fill="#5C4033" />
            <line x1="8" y1="18" x2="8" y2="30" stroke="#5C4033" strokeWidth="0.5" />
            <line x1="2" y1="24" x2="14" y2="24" stroke="#5C4033" strokeWidth="0.5" />
          </g>
          <g>
            <circle cx="32" cy="24" r="6" fill="none" stroke="#5C4033" strokeWidth="2" />
            <circle cx="32" cy="24" r="1" fill="#5C4033" />
            <line x1="32" y1="18" x2="32" y2="30" stroke="#5C4033" strokeWidth="0.5" />
            <line x1="26" y1="24" x2="38" y2="24" stroke="#5C4033" strokeWidth="0.5" />
          </g>
          {/* Yoke and tongue */}
          <line x1="-2" y1="12" x2="-28" y2="14" stroke="#5C4033" strokeWidth="2" />
          {/* Oxen pair */}
          <g transform="translate(-52, 4)">
            <ellipse cx="12" cy="14" rx="10" ry="7" fill="#8B7355" stroke="#5C4033" strokeWidth="0.8" />
            <circle cx="4" cy="11" r="3" fill="#7a6345" stroke="#5C4033" strokeWidth="0.5" />
            {/* Horns */}
            <path d="M2,9 Q0,6 3,8" stroke="#d4c4a0" strokeWidth="0.8" fill="none" />
            <path d="M6,9 Q8,6 5,8" stroke="#d4c4a0" strokeWidth="0.8" fill="none" />
          </g>
          <g transform="translate(-36, 4)">
            <ellipse cx="12" cy="14" rx="10" ry="7" fill="#7a6345" stroke="#5C4033" strokeWidth="0.8" />
            <circle cx="4" cy="11" r="3" fill="#6a5335" stroke="#5C4033" strokeWidth="0.5" />
            <path d="M2,9 Q0,6 3,8" stroke="#d4c4a0" strokeWidth="0.8" fill="none" />
            <path d="M6,9 Q8,6 5,8" stroke="#d4c4a0" strokeWidth="0.8" fill="none" />
          </g>
        </g>

        {/* Dust kicked up by wagon */}
        <g opacity="0.2">
          <ellipse cx="400" cy="258" rx="15" ry="4" fill="#c4a470" />
          <ellipse cx="415" cy="260" rx="10" ry="3" fill="#c4a470" />
        </g>

        {/* Foreground grass details */}
        {[20, 80, 160, 250, 450, 560, 640, 720, 780].map(x => (
          <g key={x} opacity="0.7">
            <line x1={x} y1={265} x2={x - 3} y2={258} stroke="#3a5a1a" strokeWidth="1" />
            <line x1={x + 2} y1={265} x2={x + 4} y2={257} stroke="#4a6a2a" strokeWidth="1" />
            <line x1={x + 5} y1={265} x2={x + 3} y2={259} stroke="#3a5a1a" strokeWidth="0.8" />
          </g>
        ))}
      </svg>

      {/* Location label overlay */}
      {landmarkName && (
        <div className="absolute bottom-1 left-2 text-[10px] text-white/60 font-serif italic">
          Near {landmarkName}
        </div>
      )}
    </div>
  );
}

function PlainsScene() {
  return (
    <g>
      {/* Distant horizon — very flat */}
      <path d="M0,215 Q200,208 400,212 Q600,206 800,210 L800,220 L0,220 Z"
        fill="#8aa54a" opacity="0.5" />
      <path d="M0,218 Q150,212 300,216 Q500,210 700,215 L800,213 L800,220 L0,220 Z"
        fill="#7a9a3a" opacity="0.6" />

      {/* Tall grass in distance */}
      {[50, 120, 200, 310, 420, 530, 620, 710].map(x => (
        <g key={x} opacity="0.5">
          <line x1={x} y1={220} x2={x - 2} y2={212} stroke="#6a8a2a" strokeWidth="1.2" />
          <line x1={x + 4} y1={220} x2={x + 5} y2={210} stroke="#5a7a2a" strokeWidth="1" />
          <line x1={x + 8} y1={220} x2={x + 7} y2={213} stroke="#6a8a2a" strokeWidth="0.8" />
        </g>
      ))}

      {/* Distant buffalo silhouettes */}
      <g opacity="0.15" transform="translate(550, 205)">
        <ellipse cx="0" cy="0" rx="8" ry="5" fill="#3a2a1a" />
        <ellipse cx="20" cy="1" rx="7" ry="4" fill="#3a2a1a" />
        <ellipse cx="-15" cy="2" rx="6" ry="4" fill="#3a2a1a" />
      </g>
    </g>
  );
}

function HillsScene() {
  return (
    <g>
      {/* Rolling hills in distance */}
      <path d="M0,220 Q80,180 180,195 Q280,170 380,185 Q480,160 580,178 Q680,165 800,180 L800,220 Z"
        fill="#6a8a3a" opacity="0.35" />
      <path d="M0,220 Q100,190 220,200 Q340,180 460,195 Q580,175 700,190 Q760,182 800,188 L800,220 Z"
        fill="#5a7a2a" opacity="0.45" />

      {/* Scattered trees on hills */}
      {[100, 250, 380, 520, 680].map(x => (
        <g key={x}>
          <line x1={x} y1={210} x2={x} y2={195} stroke="#3a4a2a" strokeWidth="2" />
          <circle cx={x} cy={192} r="7" fill="#4a7a2a" opacity="0.6" />
        </g>
      ))}

      {/* Rocks */}
      <ellipse cx="160" cy="215" rx="6" ry="3" fill="#9a8a7a" opacity="0.4" />
      <ellipse cx="480" cy="212" rx="5" ry="2.5" fill="#8a7a6a" opacity="0.35" />
    </g>
  );
}

function MountainsScene() {
  return (
    <g>
      {/* Distant snow-capped peaks */}
      <polygon points="80,220 160,90 240,220" fill="#6a7a8a" opacity="0.35" />
      <polygon points="160,220 260,70 360,220" fill="#7a8a9a" opacity="0.4" />
      <polygon points="350,220 440,100 530,220" fill="#6a7a8a" opacity="0.35" />
      <polygon points="480,220 560,85 640,220" fill="#7a8a9a" opacity="0.38" />
      <polygon points="600,220 680,110 760,220" fill="#6a7a8a" opacity="0.32" />

      {/* Snow caps */}
      <polygon points="152,100 160,90 168,100" fill="white" opacity="0.8" />
      <polygon points="250,82 260,70 270,82" fill="white" opacity="0.85" />
      <polygon points="432,110 440,100 448,110" fill="white" opacity="0.75" />
      <polygon points="552,95 560,85 568,95" fill="white" opacity="0.8" />
      <polygon points="672,120 680,110 688,120" fill="white" opacity="0.7" />

      {/* Mid-range forested hills */}
      <path d="M0,220 Q80,190 180,200 Q300,180 420,195 Q540,178 660,192 Q740,185 800,195 L800,220 Z"
        fill="#4a6a2a" opacity="0.5" />

      {/* Pine trees (foreground) */}
      {[40, 120, 220, 300, 480, 580, 700, 760].map(x => (
        <g key={x}>
          <line x1={x} y1={220} x2={x} y2={205} stroke="#2a3a1a" strokeWidth="1.5" />
          <polygon points={`${x - 6},215 ${x},200 ${x + 6},215`} fill="#2a5a1a" opacity="0.7" />
          <polygon points={`${x - 4},210 ${x},202 ${x + 4},210`} fill="#3a6a2a" opacity="0.6" />
        </g>
      ))}
    </g>
  );
}

function RiverScene() {
  return (
    <g>
      {/* Far bank with trees */}
      <path d="M0,195 Q200,185 400,190 Q600,183 800,188 L800,210 L0,210 Z"
        fill="#5a7a3a" opacity="0.5" />

      {/* Trees on far bank */}
      {[60, 150, 280, 400, 520, 650, 740].map(x => (
        <g key={x}>
          <line x1={x} y1={195} x2={x} y2={182} stroke="#3a4a2a" strokeWidth="2" />
          <circle cx={x} cy={179} r="6" fill="#4a7a2a" opacity="0.6" />
        </g>
      ))}

      {/* River water */}
      <path d="M0,210 Q150,205 300,208 Q500,202 700,206 L800,204 L800,230 Q600,225 400,228 Q200,232 0,228 Z"
        fill="#4A7C9B" opacity="0.65" />

      {/* Water reflections / ripples */}
      <path d="M100,215 Q130,213 160,215" stroke="white" strokeWidth="1" fill="none" opacity="0.25" />
      <path d="M300,212 Q340,210 380,212" stroke="white" strokeWidth="0.8" fill="none" opacity="0.2" />
      <path d="M500,218 Q540,216 580,218" stroke="white" strokeWidth="1" fill="none" opacity="0.25" />
      <path d="M650,213 Q680,211 710,213" stroke="white" strokeWidth="0.8" fill="none" opacity="0.2" />

      {/* Near bank */}
      <path d="M0,228 Q200,232 400,228 Q600,225 800,230 L800,220 Q600,225 400,228 Q200,232 0,228 Z"
        fill="#5a7a3a" opacity="0.6" />

      {/* Rocks in/near water */}
      <ellipse cx="250" cy="220" rx="6" ry="3" fill="#8a8a7a" opacity="0.5" />
      <ellipse cx="550" cy="216" rx="5" ry="2.5" fill="#7a7a6a" opacity="0.4" />
    </g>
  );
}
