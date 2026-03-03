/**
 * Trail progress bar with landmark markers.
 * Dark background (#2c1f14) — matches header for visual anchoring.
 */

export default function TrailProgressBar({ landmarks, currentIndex, distanceTraveled, distanceToNext, bp }) {
  const isMobile = bp === 'bp-mobile';
  const totalDistance = landmarks[landmarks.length - 1]?.cumulative_miles || 2170;
  const pct = Math.min(100, (distanceTraveled / totalDistance) * 100);
  const nextLandmark = landmarks[currentIndex + 1];
  const nextDist = nextLandmark?.distance_from_previous || 0;
  const nextPct = nextDist > 0 ? Math.max(0, Math.min(100, ((nextDist - distanceToNext) / nextDist) * 100)) : 0;

  return (
    <div style={{
      background: '#2c1f14', padding: '9px 13px 11px', flexShrink: 0,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ color: 'var(--gold)', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
          🗺️ Trail to Oregon
        </span>
        <span style={{ color: 'rgba(255,255,255,0.48)', fontSize: '10px' }}>
          {Math.round(distanceTraveled)} / {totalDistance} mi
        </span>
      </div>

      {/* Trail track with landmarks */}
      <div style={{ position: 'relative', height: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', marginBottom: '8px' }}>
        {/* Gold fill */}
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: '3px',
          background: 'linear-gradient(90deg, var(--gold), #d4b060)',
          width: `${pct}%`, transition: 'width 0.5s ease',
        }} />

        {/* Landmark dots */}
        {landmarks.map((lm, i) => {
          const lmPct = (lm.cumulative_miles / totalDistance) * 100;
          const done = i <= currentIndex;
          return (
            <div key={lm.id || i} style={{
              position: 'absolute', left: `${lmPct}%`, top: '50%', transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{
                width: done ? '14px' : '8px', height: done ? '14px' : '8px',
                borderRadius: '50%', background: done ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
                border: done ? '1.5px solid rgba(255,255,255,0.6)' : 'none',
                transition: 'all 0.3s',
              }} />
              {!isMobile && (
                <span style={{
                  position: 'absolute', top: '12px', whiteSpace: 'nowrap',
                  fontSize: '8px', color: done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                  fontFamily: 'var(--font-body)',
                }}>
                  {lm.short_name || lm.name?.split(' ').slice(0, 2).join(' ')}
                </span>
              )}
            </div>
          );
        })}

        {/* Wagon marker */}
        <span style={{
          position: 'absolute', left: `${pct}%`, top: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '14px', filter: 'drop-shadow(0 0 3px var(--gold))',
          transition: 'left 0.5s ease',
        }}>
          🐂
        </span>
      </div>

      {/* Next stop row */}
      {nextLandmark && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            color: 'rgba(255,255,255,0.48)', fontSize: '10px', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
          }}>
            Next: {nextLandmark.short_name || nextLandmark.name?.split(' ').slice(0, 2).join(' ')}
          </span>
          <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.12)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              background: 'var(--green)', width: `${nextPct}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <span style={{
            color: 'var(--gold)', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
          }}>
            {Math.max(0, Math.round(distanceToNext))} mi
          </span>
        </div>
      )}
    </div>
  );
}
