export default function TrailMap({ landmarks, currentIndex, progress }) {
  const displayLandmarks = landmarks.length > 8
    ? landmarks.filter((_, i) => i === 0 || i === landmarks.length - 1 || i === currentIndex || i === currentIndex + 1 || i % 3 === 0)
    : landmarks;

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-trail-tan/30">
      {/* Progress bar */}
      <div className="trail-progress-bar mb-2">
        <div
          className="trail-progress-fill bg-gradient-to-r from-trail-brown to-trail-gold"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {/* Landmark dots */}
      <div className="flex justify-between items-center px-1">
        {displayLandmarks.map((lm, i) => {
          const realIndex = landmarks.indexOf(lm);
          const isPast = realIndex < currentIndex;
          const isCurrent = realIndex === currentIndex;
          const isFuture = realIndex > currentIndex;

          return (
            <div key={lm.id || i} className="flex flex-col items-center" style={{ minWidth: 0, flex: '0 0 auto' }}>
              <div
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  isCurrent
                    ? 'border-trail-blue bg-trail-blue scale-125'
                    : isPast
                    ? 'border-trail-brown bg-trail-brown'
                    : 'border-gray-300 bg-white'
                } ${lm.type === 'mission' ? 'ring-2 ring-trail-gold ring-offset-1' : ''}`}
              />
              <span className={`text-[9px] mt-1 text-center leading-tight max-w-[60px] truncate ${
                isCurrent ? 'text-trail-blue font-bold' : 'text-gray-400'
              }`}>
                {lm.name?.split(' ').slice(0, 2).join(' ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
