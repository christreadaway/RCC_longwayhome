import { formatGameDate } from '../../../utils/dateUtils';

export default function SundayRestPrompt({ onChoice, gameDate, gradeBand }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-trail-gold/30 to-trail-tan/30 p-6">
          <h2 className="text-2xl font-bold text-trail-darkBrown">Sunday on the Trail</h2>
          <p className="text-trail-brown text-sm mt-1">{formatGameDate(gameDate)}</p>
        </div>

        <div className="p-6">
          <p className="text-trail-darkBrown leading-relaxed mb-6">
            {gradeBand === 'k2'
              ? "It's Sunday! Do you want to rest today? Resting will help everyone feel better."
              : "It's the Sabbath. Many wagon trains observed Sunday rest — a day to recover, pray, and tend to the party. But every day you rest is a day you're not moving toward Oregon."
            }
          </p>

          <div className="space-y-3">
            <button
              onClick={() => onChoice(true)}
              className="w-full p-4 rounded-lg border-2 border-trail-gold hover:bg-trail-gold/10 transition-all text-left"
            >
              <div className="font-semibold text-trail-darkBrown">Rest on the Sabbath</div>
              <div className="text-sm text-trail-brown mt-1">
                Lose 1 travel day. Party members recover health. Morale bonus.
              </div>
            </button>
            <button
              onClick={() => onChoice(false)}
              className="w-full p-4 rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all text-left"
            >
              <div className="font-semibold text-trail-darkBrown">Continue Traveling</div>
              <div className="text-sm text-trail-brown mt-1">
                Keep moving. No bonus. No penalty.
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
