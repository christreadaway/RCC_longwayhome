import { useState, useRef, useCallback } from 'react';

/**
 * Approximate lat/lng coordinates for each landmark on the Oregon Trail.
 * These are used to place dots on the SVG map.
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
 * 1848 state/territory boundaries rendered as SVG paths.
 * Simplified outlines for readability at small sizes.
 */
function StateBoundaries() {
  return (
    <g className="state-boundaries" strokeWidth="0.8" fill="none" opacity="0.4">
      {/* Missouri (state by 1821) */}
      <path d="M640,275 L640,340 L690,345 L700,310 L690,275 L670,270 L650,272 Z"
        stroke="#5C4033" fill="#e8d5b7" fillOpacity="0.3" />
      <text x="665" y="320" fontSize="7" fill="#5C4033" textAnchor="middle" opacity="0.6">Missouri</text>

      {/* Iowa Territory / State (1846) */}
      <path d="M605,235 L640,235 L650,272 L670,270 L670,250 L690,245 L690,225 L605,225 Z"
        stroke="#5C4033" fill="#d4c4a0" fillOpacity="0.2" />
      <text x="645" y="252" fontSize="6" fill="#5C4033" textAnchor="middle" opacity="0.5">Iowa</text>

      {/* Unorganized Territory / Nebraska area */}
      <path d="M460,220 L605,225 L605,235 L640,235 L650,272 L640,275 L460,270 Z"
        stroke="#5C4033" fill="#ddd2b5" fillOpacity="0.15" />
      <text x="545" y="255" fontSize="7" fill="#5C4033" textAnchor="middle" opacity="0.5">Unorganized Territory</text>

      {/* Oregon Country (joint occupancy ended 1846, Oregon Territory 1848) */}
      <path d="M100,170 L250,170 L250,200 L300,200 L300,260 L250,270 L200,270 L150,260 L100,250 Z"
        stroke="#5C4033" fill="#c5d4a0" fillOpacity="0.2" />
      <text x="180" y="228" fontSize="8" fill="#5C4033" textAnchor="middle" opacity="0.6">Oregon Territory</text>

      {/* Mexican Cession / Alta California area (Mexican until 1848 Treaty of Guadalupe Hidalgo) */}
      <path d="M100,250 L150,260 L200,270 L250,270 L300,260 L300,340 L250,380 L150,380 L100,350 Z"
        stroke="#5C4033" fill="#ddc9a0" fillOpacity="0.15" />
      <text x="200" y="320" fontSize="7" fill="#5C4033" textAnchor="middle" opacity="0.4">Mexican Territory</text>

      {/* Rocky Mountain / unorganized region (future Wyoming, etc.) */}
      <path d="M300,200 L460,220 L460,270 L440,290 L380,310 L300,300 L300,260 Z"
        stroke="#5C4033" fill="#d5cbb5" fillOpacity="0.15" />
      <text x="380" y="280" fontSize="6" fill="#5C4033" textAnchor="middle" opacity="0.4">Unorganized</text>

      {/* Indian Territory (future Oklahoma/Kansas) */}
      <path d="M580,275 L640,275 L640,340 L580,340 Z"
        stroke="#5C4033" fill="#c9b99a" fillOpacity="0.2" />
      <text x="610" y="312" fontSize="6" fill="#5C4033" textAnchor="middle" opacity="0.5">Indian Territory</text>
    </g>
  );
}

/**
 * Geographic features: rivers and mountain ranges
 */
function GeographicFeatures() {
  return (
    <g className="geographic-features">
      {/* Missouri River */}
      <path d="M690,245 L670,260 L650,268 L620,265 L590,258 L560,255"
        stroke="#7ca8c4" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />

      {/* Platte River */}
      <path d="M660,272 L620,268 L580,265 L540,262 L500,260 L470,258 L450,255"
        stroke="#7ca8c4" strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round" />

      {/* Snake River */}
      <path d="M300,250 L270,248 L245,250 L225,255 L210,252"
        stroke="#7ca8c4" strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round" />

      {/* Columbia River */}
      <path d="M195,225 L170,222 L148,218 L130,225 L128,235"
        stroke="#7ca8c4" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />

      {/* Green River */}
      <path d="M365,250 L360,270 L355,290 L350,310"
        stroke="#7ca8c4" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />

      {/* Rocky Mountains spine */}
      <path d="M320,180 L340,200 L360,220 L380,240 L400,260 L410,280 L420,300 L430,320"
        stroke="#8B7355" strokeWidth="2.5" fill="none" opacity="0.2" strokeLinecap="round"
        strokeDasharray="4,3" />

      {/* Blue Mountains */}
      <path d="M165,225 L180,235 L190,240"
        stroke="#8B7355" strokeWidth="2" fill="none" opacity="0.2" strokeLinecap="round"
        strokeDasharray="3,2" />
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

  // Build path string
  const traveledPath = points.slice(0, currentIndex + 1).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const futurePath = points.slice(currentIndex).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <g className="trail-path">
      {/* Future trail (dashed) */}
      <path d={futurePath} stroke="#B8860B" strokeWidth="1.5" fill="none"
        strokeDasharray="4,3" opacity="0.3" strokeLinecap="round" />
      {/* Traveled trail (solid) */}
      <path d={traveledPath} stroke="#8B4513" strokeWidth="2" fill="none"
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
        const isFuture = i > currentIndex;

        let fill = '#999';
        let stroke = '#777';
        let r = 3;
        if (isPast) { fill = '#8B4513'; stroke = '#5C4033'; r = 3; }
        if (isCurrent) { fill = '#D4A017'; stroke = '#8B6914'; r = 5; }
        if (lm.type === 'mission') { stroke = '#D4A017'; }

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
            {/* Label — show for current, start, end, forts, and missions */}
            {(isCurrent || i === 0 || i === landmarks.length - 1 || lm.type === 'fort' || lm.type === 'mission') && (
              <text
                x={coord.x}
                y={coord.y - (r + 4)}
                fontSize={isCurrent ? '7' : '5.5'}
                fill={isCurrent ? '#5C4033' : '#8B7355'}
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

  // Interpolate position between current and next landmark
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
    // SVG viewBox is 800x420, map takes 100% width
    const scaleX = rect.width / 800;
    const scaleY = rect.height / 420;
    const scale = Math.min(scaleX, scaleY);
    setPan({
      x: centerX - coord.x * scale * zoom,
      y: centerY - coord.y * scale * zoom
    });
  }, [landmarks, currentIndex, zoom]);

  return (
    <div className="relative rounded-lg overflow-hidden border-2 border-trail-brown/40 bg-[#f5e6c8]"
      style={{ height: '100%' }}>
      {/* Map title banner */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-2 py-0.5 bg-trail-brown/80">
        <span className="text-[9px] text-trail-cream font-serif tracking-wider uppercase">Oregon Trail &mdash; 1848</span>
        <div className="flex gap-1">
          <button onClick={handleCenterOnPlayer}
            className="text-[9px] text-trail-cream/80 hover:text-white px-1" title="Center on wagon">
            &#9737;
          </button>
          <button onClick={handleZoomIn}
            className="text-trail-cream/80 hover:text-white text-xs leading-none px-1 font-bold" title="Zoom in">+</button>
          <button onClick={handleZoomOut}
            className="text-trail-cream/80 hover:text-white text-xs leading-none px-1 font-bold" title="Zoom out">&minus;</button>
        </div>
      </div>

      {/* SVG Map */}
      <div
        ref={containerRef}
        className="w-full h-full pt-5 cursor-grab active:cursor-grabbing"
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
          {/* Background terrain tinting */}
          <defs>
            <linearGradient id="terrainGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a8c686" stopOpacity="0.15" />
              <stop offset="30%" stopColor="#c4b07a" stopOpacity="0.1" />
              <stop offset="60%" stopColor="#b5a37a" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#c9b896" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <rect x="80" y="160" width="640" height="220" fill="url(#terrainGrad)" />

          <StateBoundaries />
          <GeographicFeatures />
          <TrailPath landmarks={landmarks} currentIndex={currentIndex} />
          <LandmarkDots landmarks={landmarks} currentIndex={currentIndex} />
          <WagonIcon landmarks={landmarks} currentIndex={currentIndex} distanceToNext={distanceToNext} />

          {/* Compass rose */}
          <g transform="translate(700, 345)">
            <circle r="12" fill="#f5e6c8" stroke="#8B7355" strokeWidth="0.5" opacity="0.7" />
            <text y="-4" fontSize="6" textAnchor="middle" fill="#5C4033" fontWeight="bold">N</text>
            <text y="8" fontSize="4" textAnchor="middle" fill="#8B7355">S</text>
            <text x="-7" y="2" fontSize="4" textAnchor="middle" fill="#8B7355">W</text>
            <text x="7" y="2" fontSize="4" textAnchor="middle" fill="#8B7355">E</text>
            <line x1="0" y1="-9" x2="0" y2="9" stroke="#8B7355" strokeWidth="0.5" />
            <line x1="-9" y1="0" x2="9" y2="0" stroke="#8B7355" strokeWidth="0.5" />
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
