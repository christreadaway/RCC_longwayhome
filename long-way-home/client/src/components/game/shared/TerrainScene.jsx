/**
 * TerrainScene — renders an SVG landscape matching the current terrain type.
 * Terrain types: plains, hills, mountains, river
 */
export default function TerrainScene({ terrainType, landmarkName }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="100%" stopColor="#B0D4E8" />
          </linearGradient>
        </defs>
        {/* Sky */}
        <rect width="400" height="120" fill="url(#skyGrad)" />

        {terrainType === 'plains' && <PlainsScene />}
        {terrainType === 'hills' && <HillsScene />}
        {terrainType === 'mountains' && <MountainsScene />}
        {terrainType === 'river' && <RiverScene />}

        {/* Ground baseline */}
        <rect x="0" y="95" width="400" height="25" fill="#5a7a3a" />

        {/* Wagon on trail */}
        <g transform="translate(180, 82)">
          <rect x="0" y="0" width="22" height="10" rx="2" fill="#8B6914" stroke="#5C4033" strokeWidth="1" />
          <path d="M0,0 Q11,-6 22,0" fill="#F5F0E0" stroke="#5C4033" strokeWidth="0.8" />
          <circle cx="4" cy="12" r="3.5" fill="none" stroke="#5C4033" strokeWidth="1.2" />
          <circle cx="18" cy="12" r="3.5" fill="none" stroke="#5C4033" strokeWidth="1.2" />
          {/* Oxen */}
          <ellipse cx="-10" cy="8" rx="5" ry="4" fill="#8B7355" stroke="#5C4033" strokeWidth="0.5" />
          <ellipse cx="-18" cy="8" rx="5" ry="4" fill="#7a6345" stroke="#5C4033" strokeWidth="0.5" />
        </g>

        {/* Trail ruts */}
        <path d="M0,100 Q100,98 200,100 Q300,102 400,100" stroke="#4a6a2a" strokeWidth="1" fill="none" opacity="0.4" />
        <path d="M0,102 Q100,100 200,102 Q300,104 400,102" stroke="#4a6a2a" strokeWidth="1" fill="none" opacity="0.3" />
      </svg>
    </div>
  );
}

function PlainsScene() {
  return (
    <g>
      {/* Flat prairie with grass tufts */}
      <rect x="0" y="90" width="400" height="5" fill="#7a9a4a" />
      {/* Distant low horizon */}
      <path d="M0,92 Q100,89 200,91 Q300,88 400,91 L400,95 L0,95 Z" fill="#6a8a3a" opacity="0.6" />
      {/* Grass tufts */}
      {[30, 80, 140, 220, 280, 340, 370].map(x => (
        <g key={x}>
          <line x1={x} y1={95} x2={x - 2} y2={90} stroke="#5a7a2a" strokeWidth="0.8" />
          <line x1={x} y1={95} x2={x + 1} y2={89} stroke="#6a8a3a" strokeWidth="0.8" />
          <line x1={x} y1={95} x2={x + 3} y2={91} stroke="#5a7a2a" strokeWidth="0.8" />
        </g>
      ))}
      {/* Distant clouds */}
      <ellipse cx="80" cy="25" rx="30" ry="8" fill="white" opacity="0.5" />
      <ellipse cx="300" cy="20" rx="25" ry="7" fill="white" opacity="0.4" />
    </g>
  );
}

function HillsScene() {
  return (
    <g>
      {/* Rolling hills */}
      <path d="M0,95 Q50,75 120,85 Q180,70 250,80 Q320,65 400,78 L400,95 Z"
        fill="#6a8a3a" opacity="0.5" />
      <path d="M0,95 Q80,80 160,88 Q240,76 320,84 Q380,78 400,82 L400,95 Z"
        fill="#5a7a2a" opacity="0.6" />
      {/* Scattered rocks */}
      <ellipse cx="90" cy="92" rx="4" ry="2" fill="#9a8a7a" opacity="0.5" />
      <ellipse cx="310" cy="90" rx="3" ry="1.5" fill="#8a7a6a" opacity="0.4" />
      {/* A few trees */}
      {[60, 150, 350].map(x => (
        <g key={x}>
          <line x1={x} y1={92} x2={x} y2={82} stroke="#5a4a2a" strokeWidth="1.5" />
          <circle cx={x} cy={80} r="5" fill="#4a7a2a" opacity="0.7" />
        </g>
      ))}
    </g>
  );
}

function MountainsScene() {
  return (
    <g>
      {/* Distant snow-capped peaks */}
      <polygon points="50,95 100,40 150,95" fill="#6a7a8a" opacity="0.4" />
      <polygon points="80,95 140,30 200,95" fill="#7a8a9a" opacity="0.5" />
      <polygon points="200,95 260,35 320,95" fill="#6a7a8a" opacity="0.45" />
      <polygon points="280,95 330,45 380,95" fill="#7a8a9a" opacity="0.4" />
      {/* Snow caps */}
      <polygon points="95,45 100,40 105,45" fill="white" opacity="0.7" />
      <polygon points="133,37 140,30 147,37" fill="white" opacity="0.8" />
      <polygon points="253,42 260,35 267,42" fill="white" opacity="0.7" />
      <polygon points="325,50 330,45 335,50" fill="white" opacity="0.6" />
      {/* Mid-range hills */}
      <path d="M0,95 Q60,80 120,88 Q200,75 280,85 Q350,78 400,84 L400,95 Z"
        fill="#5a7a3a" opacity="0.6" />
      {/* Pine trees */}
      {[40, 95, 170, 250, 340, 380].map(x => (
        <g key={x}>
          <line x1={x} y1={94} x2={x} y2={86} stroke="#3a4a2a" strokeWidth="1" />
          <polygon points={`${x - 4},90 ${x},82 ${x + 4},90`} fill="#3a5a2a" opacity="0.8" />
        </g>
      ))}
    </g>
  );
}

function RiverScene() {
  return (
    <g>
      {/* River banks */}
      <path d="M0,95 Q100,85 200,90 Q300,82 400,88 L400,95 Z"
        fill="#5a7a3a" opacity="0.5" />
      {/* River water */}
      <path d="M0,95 Q80,92 160,88 Q240,92 320,87 Q380,90 400,88 L400,100 Q300,95 200,100 Q100,96 0,100 Z"
        fill="#4A7C9B" opacity="0.6" />
      {/* Water reflections */}
      <path d="M60,96 Q80,95 100,96" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M200,93 Q220,92 240,93" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M300,94 Q320,93 340,94" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3" />
      {/* Far bank trees */}
      {[50, 130, 270, 360].map(x => (
        <g key={x}>
          <line x1={x} y1={88} x2={x} y2={80} stroke="#4a5a2a" strokeWidth="1" />
          <circle cx={x} cy={78} r="4" fill="#4a7a2a" opacity="0.6" />
        </g>
      ))}
      {/* Rocks in/near water */}
      <ellipse cx="180" cy="96" rx="4" ry="2" fill="#8a8a7a" opacity="0.5" />
      <ellipse cx="280" cy="94" rx="3" ry="1.5" fill="#7a7a6a" opacity="0.4" />
    </g>
  );
}
