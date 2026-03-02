import landmarksData from '../../data/landmarks.json';

export default function StudentCard({ student, onViewTranscript, showDebug, isHighlighted, onHighlight }) {
  const gs = student.gameState || {};
  const landmarks = landmarksData.landmarks;
  const currentLandmark = landmarks[gs.currentLandmarkIndex || 0];
  const alive = (gs.partyMembers || []).filter(m => m.alive);
  const total = (gs.partyMembers || []).length;
  const graceColor = getGraceColor(gs.grace || 50);
  const healthSummary = getHealthSummary(gs.partyMembers || []);
  const cwmHelped = (gs.cwmEvents || []).filter(e => e.choice === 'helped').length;
  const cwmDeclined = (gs.cwmEvents || []).filter(e => e.choice === 'declined').length;
  const cwmDeceptive = (gs.cwmEvents || []).filter(e => !e.recipientGenuine).length;

  return (
    <div className={`card hover:shadow-xl transition-shadow ${isHighlighted ? 'ring-4 ring-purple-500 bg-purple-50' : ''} ${gs.status === 'completed' ? 'ring-2 ring-green-400' : gs.status === 'failed' ? 'ring-2 ring-red-400' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-trail-darkBrown text-lg">{student.studentName || gs.studentName}</h3>
          <p className="text-xs text-trail-brown">
            {currentLandmark?.name || 'Independence'} — Day {gs.trailDay || 1}
          </p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-semibold ${
          gs.status === 'completed' ? 'bg-green-100 text-green-700' :
          gs.status === 'failed' ? 'bg-red-100 text-red-700' :
          gs.isPaused ? 'bg-yellow-100 text-yellow-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {gs.status === 'completed' ? 'Finished' : gs.status === 'failed' ? 'Failed' : gs.isPaused ? 'Paused' : 'Active'}
        </div>
      </div>

      {/* Party Health */}
      <div className="flex gap-1 mb-3">
        {(gs.partyMembers || []).map((m, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${getHealthBarColor(m)}`}
            title={`${m.name}: ${m.alive ? m.health : 'dead'}`} />
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Alive:</span>
          <span className="font-semibold">{alive.length}/{total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Cash:</span>
          <span className="font-semibold">${(gs.cash || 0).toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Food:</span>
          <span className={`font-semibold ${(gs.foodLbs || 0) < 50 ? 'text-red-600' : ''}`}>{Math.round(gs.foodLbs || 0)} lbs</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Chaplain:</span>
          <span className="font-semibold">{gs.chaplainInParty ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {/* Grace Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Grace</span>
          <span className={`font-bold ${graceColor}`}>{gs.grace || 50}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${getGraceBgColor(gs.grace || 50)}`}
            style={{ width: `${gs.grace || 50}%` }} />
        </div>
      </div>

      {/* CWM Events */}
      {(gs.cwmEvents || []).length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">Works:</span>
          <div className="flex gap-1">
            {(gs.cwmEvents || []).map((e, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full ${
                  e.choice === 'helped' && e.recipientGenuine !== false
                    ? 'bg-green-500'
                    : e.choice === 'helped' && e.recipientGenuine === false
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                title={`${e.eventType}: ${e.choice}${e.recipientGenuine === false ? ' (deceptive)' : ''}`}
              />
            ))}
          </div>
          {cwmDeceptive > 0 && (
            <span className="text-xs text-yellow-600" title="Deceptive recipients encountered">[{cwmDeceptive}D]</span>
          )}
        </div>
      )}

      {/* Last Event */}
      {gs.eventLog && gs.eventLog.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 truncate">
          Last: {gs.eventLog[gs.eventLog.length - 1].description}
        </div>
      )}

      {/* Score & Profession */}
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {gs.profession && (
          <div className="flex justify-between">
            <span className="text-gray-500">Job:</span>
            <span className="font-semibold capitalize">{gs.profession}</span>
          </div>
        )}
        {gs.graceAdjustedScore > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Score:</span>
            <span className="font-semibold">{gs.graceAdjustedScore}</span>
          </div>
        )}
        {(gs.prayersOffered || 0) > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Prayers:</span>
            <span className="font-semibold">{gs.prayersOffered}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Morale:</span>
          <span className="font-semibold">{gs.morale || 0}%</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {(gs.historianTranscript || []).length > 0 && (
          <button onClick={onViewTranscript}
            className="text-xs text-trail-blue hover:underline">
            Historian ({gs.historianTranscript.length})
          </button>
        )}
        <span className="text-xs text-gray-400">
          Cards: {(gs.knowledgeCardsRead || []).length}
        </span>
        <span className="text-xs text-gray-400">
          Rests: {gs.sundayRestsTaken || 0}
        </span>
        <button
          onClick={() => onHighlight?.(student.studentId)}
          className={`text-xs ml-auto ${isHighlighted ? 'text-purple-600 font-bold' : 'text-gray-400 hover:text-purple-500'}`}
        >
          {isHighlighted ? 'Highlighted' : 'Highlight'}
        </button>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
          <div>studentId: {student.studentId}</div>
          <div>phase: {gs.phase}</div>
          <div>morale: {gs.morale}</div>
          <div>grace: {gs.grace}</div>
          <div>reconciliation: {gs.reconciliationPending ? 'pending' : 'none'}</div>
          <div>reciprocity: {(gs.reciprocityPending || []).length} pending</div>
          <div>lastRites: {gs.lastRitesFired ? 'yes' : 'no'}</div>
          {gs.eventLog && gs.eventLog.slice(-3).map((e, i) => (
            <div key={i} className="text-gray-500">{e.date}: {e.type} - {e.description?.substring(0, 50)}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function getHealthSummary(members) {
  const alive = members.filter(m => m.alive);
  if (alive.every(m => m.health === 'good')) return 'green';
  if (alive.some(m => m.health === 'critical')) return 'red';
  return 'yellow';
}

function getHealthBarColor(member) {
  if (!member.alive) return 'bg-gray-300';
  switch (member.health) {
    case 'good': return 'bg-green-500';
    case 'fair': return 'bg-yellow-500';
    case 'poor': return 'bg-orange-500';
    case 'critical': return 'bg-red-500';
    default: return 'bg-gray-300';
  }
}

function getGraceColor(grace) {
  if (grace >= 75) return 'text-yellow-500';
  if (grace >= 40) return 'text-gray-500';
  if (grace >= 15) return 'text-orange-500';
  return 'text-red-600';
}

function getGraceBgColor(grace) {
  if (grace >= 75) return 'bg-yellow-400';
  if (grace >= 40) return 'bg-gray-400';
  if (grace >= 15) return 'bg-orange-400';
  return 'bg-red-500';
}
