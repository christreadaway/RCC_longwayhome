import { useState, useRef, useCallback } from 'react';

/**
 * Approximate coordinates for each landmark on the Oregon Trail.
 */
const LANDMARK_COORDS = {
  independence_mo:   { x: 665, y: 308 },
  fort_kearney:      { x: 555, y: 268 },
  chimney_rock:      { x: 478, y: 258 },
  fort_laramie:      { x: 440, y: 248 },
  independence_rock: { x: 395, y: 252 },
  south_pass:        { x: 370, y: 256 },
  st_marys_mission:  { x: 310, y: 210 },
  fort_bridger:      { x: 365, y: 275 },
  green_river:       { x: 355, y: 268 },
  fort_hall:         { x: 295, y: 252 },
  snake_river:       { x: 260, y: 248 },
  fort_boise:        { x: 225, y: 252 },
  whitman_mission:   { x: 195, y: 225 },
  blue_mountains:    { x: 175, y: 232 },
  the_dalles:        { x: 145, y: 220 },
  willamette_valley: { x: 128, y: 235 },
};

/**
 * Topographic terrain regions — colored fills to show prairies, mountains, desert, forest
 */
function TerrainRegions() {
  return (
    <g className="terrain-regions">
      <defs>
        {/* Prairie grassland pattern */}
        <pattern id="prairieGrass" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#d4c98a" />
          <line x1="2" y1="7" x2="2" y2="5" stroke="#b8ad6e" strokeWidth="0.3" />
          <line x1="5" y1="8" x2="5" y2="6" stroke="#b8ad6e" strokeWidth="0.3" />
        </pattern>
        {/* Mountain terrain pattern */}
        <pattern id="mountainTerrain" x="0" y="0" width="12" height="10" patternUnits="userSpaceOnUse">
          <rect width="12" height="10" fill="#c4b896" />
          <path d="M2,10 L6,4 L10,10" fill="none" stroke="#9e8e6e" strokeWidth="0.4" opacity="0.5" />
        </pattern>
        {/* Forest pattern */}
        <pattern id="forestTerrain" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#8faa6f" />
          <circle cx="3" cy="3" r="1.5" fill="#7a9a5a" opacity="0.4" />
        </pattern>
      </defs>

      {/* Great Plains — wide prairie from Missouri to Rockies */}
      <path d="M460,195 L700,215 L720,360 L460,340 Z"
        fill="url(#prairieGrass)" opacity="0.5" />

      {/* Rocky Mountain region */}
      <path d="M300,175 L460,195 L460,340 L440,350 L380,360 L300,340 Z"
        fill="url(#mountainTerrain)" opacity="0.45" />

      {/* Great Basin / high desert */}
      <path d="M220,195 L300,175 L300,340 L220,350 Z"
        fill="#d6c8a0" opacity="0.35" />

      {/* Blue Mountains / Cascades forest region */}
      <path d="M100,175 L220,195 L220,350 L100,350 Z"
        fill="url(#forestTerrain)" opacity="0.4" />

      {/* Pacific coastal strip */}
      <path d="M85,170 L100,175 L100,350 L85,350 Z"
        fill="#8db5a0" opacity="0.4" />
    </g>
  );
}

/**
 * Topographic contour lines for mountains
 */
function MountainContours() {
  return (
    <g className="mountain-contours" opacity="0.35">
      {/* Rocky Mountains — contour ridgeline with small peaks */}
      <path d="M320,178 L335,190 L340,195 L355,210 L365,225 L375,238 L385,248 L395,260 L405,272 L415,285 L425,300 L435,315 L445,330"
        stroke="#8B7355" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Peak markers along Rockies */}
      <g fill="#8B7355" opacity="0.5">
        <polygon points="335,190 332,197 338,197" />
        <polygon points="355,210 352,217 358,217" />
        <polygon points="375,238 372,245 378,245" />
        <polygon points="395,260 392,267 398,267" />
        <polygon points="415,285 412,292 418,292" />
      </g>
      {/* Secondary ridgeline west of main Rockies */}
      <path d="M310,185 L325,200 L335,215 L345,230 L355,248 L365,265"
        stroke="#8B7355" strokeWidth="1" fill="none" opacity="0.25" strokeLinecap="round" />

      {/* Blue Mountains */}
      <path d="M160,222 L170,228 L180,235 L192,242"
        stroke="#6B7B55" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <g fill="#6B7B55" opacity="0.5">
        <polygon points="170,228 167,234 173,234" />
        <polygon points="182,236 179,242 185,242" />
      </g>

      {/* Cascade Range (far west) */}
      <path d="M115,185 L118,200 L122,215 L125,230 L128,250"
        stroke="#6B7B55" strokeWidth="1.2" fill="none" opacity="0.25" strokeLinecap="round" />
    </g>
  );
}

/**
 * State/territory boundaries with labels
 */
function StateBoundaries() {
  return (
    <g className="state-boundaries" strokeWidth="0.8" fill="none" opacity="0.3">
      {/* Missouri */}
      <path d="M640,275 L640,340 L690,345 L700,310 L690,275 L670,270 L650,272 Z"
        stroke="#5C4033" fill="#e8d5b7" fillOpacity="0.2" />
      <text x="665" y="320" fontSize="7" fill="#5C4033" textAnchor="middle" opacity="0.5"
        fontFamily="Georgia, serif" fontStyle="italic">Missouri</text>

      {/* Iowa */}
      <path d="M605,235 L640,235 L650,272 L670,270 L670,250 L690,245 L690,225 L605,225 Z"
        stroke="#5C4033" fill="#d4c4a0" fillOpacity="0.15" />
      <text x="645" y="252" fontSize="6" fill="#5C4033" textAnchor="middle" opacity="0.4"
        fontFamily="Georgia, serif" fontStyle="italic">Iowa</text>

      {/* Unorganized Territory */}
      <path d="M460,220 L605,225 L605,235 L640,235 L650,272 L640,275 L460,270 Z"
        stroke="#5C4033" strokeDasharray="3,2" />
      <text x="545" y="250" fontSize="6" fill="#5C4033" textAnchor="middle" opacity="0.35"
        fontFamily="Georgia, serif" fontStyle="italic">Unorganized Territory</text>

      {/* Oregon Territory */}
      <path d="M100,170 L250,170 L250,200 L300,200 L300,260 L250,270 L200,270 L150,260 L100,250 Z"
        stroke="#5C4033" fill="#c5d4a0" fillOpacity="0.15" />
      <text x="175" y="215" fontSize="7" fill="#4a5a30" textAnchor="middle" opacity="0.5"
        fontFamily="Georgia, serif" fontStyle="italic">Oregon Territory</text>

      {/* Mexican Territory */}
      <path d="M100,250 L150,260 L200,270 L250,270 L300,260 L300,340 L250,380 L150,380 L100,350 Z"
        stroke="#5C4033" strokeDasharray="3,2" />
      <text x="200" y="320" fontSize="6" fill="#5C4033" textAnchor="middle" opacity="0.3"
        fontFamily="Georgia, serif" fontStyle="italic">Mexican Territory</text>

      {/* Rocky Mountain region */}
      <path d="M300,200 L460,220 L460,270 L440,290 L380,310 L300,300 L300,260 Z"
        stroke="#5C4033" strokeDasharray="3,2" />

      {/* Indian Territory */}
      <path d="M580,275 L640,275 L640,340 L580,340 Z"
        stroke="#5C4033" fill="#c9b99a" fillOpacity="0.15" />
      <text x="610" y="312" fontSize="5.5" fill="#5C4033" textAnchor="middle" opacity="0.4"
        fontFamily="Georgia, serif" fontStyle="italic">Indian Territory</text>
    </g>
  );
}

/**
 * Geographic features: rivers, Pacific Ocean
 */
function GeographicFeatures() {
  return (
    <g className="geographic-features">
      {/* Pacific Ocean */}
      <path d="M80,160 L100,165 L100,380 L80,380 Z"
        fill="#a4c4d8" opacity="0.5" />
      <text x="88" y="270" fontSize="5" fill="#5a7a8a" textAnchor="middle" opacity="0.6"
        fontFamily="Georgia, serif" writingMode="tb" letterSpacing="2">PACIFIC</text>

      {/* Missouri River — wider, more visible */}
      <path d="M695,240 L675,255 L655,262 L630,262 L600,258 L570,255 L550,252"
        stroke="#7ca8c4" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round" />
      <text x="630" y="256" fontSize="4" fill="#5a8aaa" opacity="0.5" fontStyle="italic">Missouri R.</text>

      {/* Platte River */}
      <path d="M665,270 L630,267 L590,264 L550,261 L510,259 L480,257 L455,254"
        stroke="#7ca8c4" strokeWidth="1.5" fill="none" opacity="0.45" strokeLinecap="round" />
      <text x="530" y="270" fontSize="3.5" fill="#5a8aaa" opacity="0.45" fontStyle="italic">Platte R.</text>

      {/* North Platte fork */}
      <path d="M510,259 L490,252 L470,248 L450,246"
        stroke="#7ca8c4" strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />

      {/* Snake River */}
      <path d="M305,248 L280,246 L255,248 L235,252 L215,250 L200,248"
        stroke="#7ca8c4" strokeWidth="1.5" fill="none" opacity="0.45" strokeLinecap="round" />
      <text x="255" y="243" fontSize="3.5" fill="#5a8aaa" opacity="0.45" fontStyle="italic">Snake R.</text>

      {/* Columbia River */}
      <path d="M200,225 L175,220 L155,216 L138,220 L128,232"
        stroke="#7ca8c4" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round" />
      <text x="160" y="212" fontSize="3.5" fill="#5a8aaa" opacity="0.5" fontStyle="italic">Columbia R.</text>

      {/* Green River */}
      <path d="M367,248 L362,268 L358,288 L354,308"
        stroke="#7ca8c4" strokeWidth="1" fill="none" opacity="0.35" strokeLinecap="round" />

      {/* Sweetwater River (near Independence Rock) */}
      <path d="M415,250 L400,252 L385,254 L370,256"
        stroke="#7ca8c4" strokeWidth="0.8" fill="none" opacity="0.3" strokeLinecap="round" />
    </g>
  );
}

/**
 * The trail path connecting all landmarks
 */
function TrailPath({ landmarks, currentIndex }) {
  const points = landmarks
    .map(lm => LANDMARK_COORDS[lm.id])
    .filter(Boolean);

  if (points.length < 2) return null;

  const traveledPath = points.slice(0, currentIndex + 1).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const futurePath = points.slice(currentIndex).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <g className="trail-path">
      {/* Trail shadow for depth */}
      <path d={futurePath} stroke="#8B6914" strokeWidth="3" fill="none"
        opacity="0.08" strokeLinecap="round" />
      {/* Future trail (dashed) */}
      <path d={futurePath} stroke="#B8860B" strokeWidth="1.5" fill="none"
        strokeDasharray="4,3" opacity="0.35" strokeLinecap="round" />
      {/* Traveled trail shadow */}
      <path d={traveledPath} stroke="#5C3310" strokeWidth="3.5" fill="none"
        opacity="0.1" strokeLinecap="round" />
      {/* Traveled trail (solid) */}
      <path d={traveledPath} stroke="#8B4513" strokeWidth="2.5" fill="none"
        opacity="0.8" strokeLinecap="round" />
    </g>
  );
}

/**
 * Landmark dots with labels
 */
function LandmarkDots({ landmarks, currentIndex }) {
  return (
    <g className="landmark-dots">
      {landmarks.map((lm, i) => {
        const coord = LANDMARK_COORDS[lm.id];
        if (!coord) return null;

        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;

        let fill = '#aaa';
        let stroke = '#888';
        let r = 3;
        if (isPast) { fill = '#8B4513'; stroke = '#5C4033'; r = 3.5; }
        if (isCurrent) { fill = '#D4A017'; stroke = '#8B6914'; r = 5; }
        if (lm.type === 'mission') { stroke = '#D4A017'; }
        if (lm.type === 'fort') { stroke = '#5C4033'; }

        return (
          <g key={lm.id}>
            {isCurrent && (
              <circle cx={coord.x} cy={coord.y} r={8} fill="#D4A017" opacity="0.25">
                <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={coord.x} cy={coord.y} r={r}
              fill={fill} stroke={stroke} strokeWidth={isCurrent ? 2 : 1}
            />
            {/* Fort icon: small square */}
            {lm.type === 'fort' && !isCurrent && (
              <rect x={coord.x - 2} y={coord.y - 6} width="4" height="3" fill="#5C4033" opacity="0.4" rx="0.5" />
            )}
            {/* Mission icon: small cross */}
            {lm.type === 'mission' && !isCurrent && (
              <g opacity="0.5">
                <line x1={coord.x} y1={coord.y - 8} x2={coord.x} y2={coord.y - 4} stroke="#D4A017" strokeWidth="0.8" />
                <line x1={coord.x - 1.5} y1={coord.y - 6.5} x2={coord.x + 1.5} y2={coord.y - 6.5} stroke="#D4A017" strokeWidth="0.8" />
              </g>
            )}
            {/* Labels — show for current, start, end, forts, and missions */}
            {(isCurrent || i === 0 || i === landmarks.length - 1 || lm.type === 'fort' || lm.type === 'mission') && (
              <text
                x={coord.x}
                y={coord.y - (r + (lm.type === 'fort' || lm.type === 'mission' ? 8 : 4))}
                fontSize={isCurrent ? '7' : '5.5'}
                fill={isCurrent ? '#3a2010' : '#6B5B45'}
                textAnchor="middle"
                fontWeight={isCurrent ? 'bold' : 'normal'}
                fontFamily="Georgia, serif"
              >
                {lm.name.replace(', Missouri', '').replace('Willamette ', 'W. ')}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Wagon icon at current position
 */
function WagonIcon({ landmarks, currentIndex, distanceToNext }) {
  const current = LANDMARK_COORDS[landmarks[currentIndex]?.id];
  const next = LANDMARK_COORDS[landmarks[currentIndex + 1]?.id];

  if (!current) return null;

  let wx = current.x;
  let wy = current.y;

  if (next && distanceToNext > 0 && landmarks[currentIndex + 1]) {
    const totalDist = landmarks[currentIndex + 1].distance_from_previous || 1;
    const traveled = totalDist - distanceToNext;
    const pct = Math.max(0, Math.min(1, traveled / totalDist));
    wx = current.x + (next.x - current.x) * pct;
    wy = current.y + (next.y - current.y) * pct;
  }

  return (
    <g transform={`translate(${wx - 8}, ${wy - 12})`}>
      <rect x="2" y="2" width="12" height="6" rx="1" fill="#8B6914" stroke="#5C4033" strokeWidth="0.5" />
      <path d="M2,2 Q8,0 14,2" fill="white" stroke="#5C4033" strokeWidth="0.4" />
      <circle cx="4" cy="9" r="2" fill="none" stroke="#5C4033" strokeWidth="0.7" />
      <circle cx="12" cy="9" r="2" fill="none" stroke="#5C4033" strokeWidth="0.7" />
    </g>
  );
}

export default function OregonTrailMap({ landmarks, currentIndex, distanceToNext }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef(null);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(3, prev + 0.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const next = Math.max(1, prev - 0.5);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(3, prev + 0.25));
    } else {
      setZoom(prev => {
        const next = Math.max(1, prev - 0.25);
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  }, []);

  const handleCenterOnPlayer = useCallback(() => {
    const coord = LANDMARK_COORDS[landmarks[currentIndex]?.id];
    if (!coord || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const scaleX = rect.width / 800;
    const scaleY = rect.height / 420;
    const scale = Math.min(scaleX, scaleY);
    setPan({
      x: centerX - coord.x * scale * zoom,
      y: centerY - coord.y * scale * zoom
    });
  }, [landmarks, currentIndex, zoom]);

  return (
    <div className="relative rounded-lg overflow-hidden border-2 border-trail-brown/40 bg-[#e8dcc0]"
      style={{ height: '100%' }}>
      {/* Map title banner */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-1 bg-trail-brown/85">
        <span className="text-[10px] text-trail-cream font-serif tracking-wider uppercase">Oregon Trail — 1848</span>
        <div className="flex gap-1.5">
          <button onClick={handleCenterOnPlayer}
            className="text-[10px] text-trail-cream/80 hover:text-white px-1" title="Center on wagon">
            &#9737;
          </button>
          <button onClick={handleZoomIn}
            className="text-trail-cream/80 hover:text-white text-sm leading-none px-1 font-bold" title="Zoom in">+</button>
          <button onClick={handleZoomOut}
            className="text-trail-cream/80 hover:text-white text-sm leading-none px-1 font-bold" title="Zoom out">&minus;</button>
        </div>
      </div>

      {/* SVG Map */}
      <div
        ref={containerRef}
        className="w-full h-full pt-6 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          viewBox="80 160 640 220"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          {/* Base parchment background */}
          <rect x="80" y="160" width="640" height="220" fill="#e8dcc0" />

          {/* Topographic terrain regions */}
          <TerrainRegions />
          <MountainContours />
          <StateBoundaries />
          <GeographicFeatures />
          <TrailPath landmarks={landmarks} currentIndex={currentIndex} />
          <LandmarkDots landmarks={landmarks} currentIndex={currentIndex} />
          <WagonIcon landmarks={landmarks} currentIndex={currentIndex} distanceToNext={distanceToNext} />

          {/* Compass rose */}
          <g transform="translate(700, 345)">
            <circle r="14" fill="#e8dcc0" stroke="#8B7355" strokeWidth="0.8" opacity="0.8" />
            <text y="-5" fontSize="6" textAnchor="middle" fill="#5C4033" fontWeight="bold" fontFamily="Georgia, serif">N</text>
            <text y="9" fontSize="4" textAnchor="middle" fill="#8B7355" fontFamily="Georgia, serif">S</text>
            <text x="-7" y="2.5" fontSize="4" textAnchor="middle" fill="#8B7355" fontFamily="Georgia, serif">W</text>
            <text x="7" y="2.5" fontSize="4" textAnchor="middle" fill="#8B7355" fontFamily="Georgia, serif">E</text>
            <line x1="0" y1="-10" x2="0" y2="10" stroke="#8B7355" strokeWidth="0.5" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#8B7355" strokeWidth="0.5" />
            {/* Decorative star */}
            <polygon points="0,-3 0.8,-0.8 3,0 0.8,0.8 0,3 -0.8,0.8 -3,0 -0.8,-0.8"
              fill="#D4A017" opacity="0.5" />
          </g>

          {/* Scale bar */}
          <g transform="translate(600, 370)">
            <line x1="0" y1="0" x2="60" y2="0" stroke="#5C4033" strokeWidth="0.8" />
            <line x1="0" y1="-2" x2="0" y2="2" stroke="#5C4033" strokeWidth="0.8" />
            <line x1="60" y1="-2" x2="60" y2="2" stroke="#5C4033" strokeWidth="0.8" />
            <text x="30" y="6" fontSize="4" fill="#5C4033" textAnchor="middle" fontFamily="Georgia, serif">~200 miles</text>
          </g>
        </svg>
      </div>

      {/* Zoom level indicator */}
      {zoom > 1 && (
        <div className="absolute bottom-1 right-2 text-[8px] text-trail-brown/50">
          {zoom.toFixed(1)}x
        </div>
      )}
    </div>
  );
}
