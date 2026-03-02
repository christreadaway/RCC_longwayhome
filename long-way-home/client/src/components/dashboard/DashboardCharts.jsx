/**
 * Dashboard Charts — SVG-based visualizations of class-wide metrics.
 * No external chart library needed; pure SVG for lightweight rendering.
 */

export default function DashboardCharts({ students }) {
  if (!students || students.length === 0) return null;

  const graceDistribution = getGraceDistribution(students);
  const cwmChoices = getCwmChoices(students);
  const survivalRate = getSurvivalRate(students);
  const trailProgress = getTrailProgress(students);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Grace Distribution */}
      <div className="card">
        <h3 className="text-sm font-bold text-trail-darkBrown mb-3">Grace Distribution</h3>
        <div className="flex items-end gap-2 h-32">
          {graceDistribution.map((band) => (
            <div key={band.label} className="flex-1 flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">{band.count}</span>
              <div
                className={`w-full rounded-t ${band.color} transition-all`}
                style={{ height: `${Math.max(4, (band.count / Math.max(students.length, 1)) * 100)}%` }}
              />
              <span className="text-xs text-gray-600 mt-1 leading-tight text-center">{band.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CWM Choices */}
      <div className="card">
        <h3 className="text-sm font-bold text-trail-darkBrown mb-3">Works of Mercy Choices</h3>
        {cwmChoices.total > 0 ? (
          <div>
            <div className="flex h-6 rounded-full overflow-hidden bg-gray-200">
              {cwmChoices.helped > 0 && (
                <div
                  className="bg-green-500 flex items-center justify-center text-xs text-white font-bold"
                  style={{ width: `${(cwmChoices.helped / cwmChoices.total) * 100}%` }}
                >
                  {cwmChoices.helped}
                </div>
              )}
              {cwmChoices.declined > 0 && (
                <div
                  className="bg-red-400 flex items-center justify-center text-xs text-white font-bold"
                  style={{ width: `${(cwmChoices.declined / cwmChoices.total) * 100}%` }}
                >
                  {cwmChoices.declined}
                </div>
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded-full inline-block" /> Helped ({cwmChoices.helped})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-400 rounded-full inline-block" /> Declined ({cwmChoices.declined})
              </span>
            </div>
            {cwmChoices.deceptive > 0 && (
              <div className="text-xs text-yellow-600 mt-1">
                {cwmChoices.deceptive} deceptive recipient{cwmChoices.deceptive > 1 ? 's' : ''} encountered
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No CWM events yet</p>
        )}
      </div>

      {/* Trail Progress */}
      <div className="card">
        <h3 className="text-sm font-bold text-trail-darkBrown mb-3">Trail Progress</h3>
        <div className="space-y-1">
          {trailProgress.map((student) => (
            <div key={student.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-20 truncate" title={student.name}>
                {student.name}
              </span>
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    student.status === 'completed' ? 'bg-green-500' :
                    student.status === 'failed' ? 'bg-red-400' : 'bg-trail-blue'
                  }`}
                  style={{ width: `${student.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{Math.round(student.progress)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Survival & Morale */}
      <div className="card">
        <h3 className="text-sm font-bold text-trail-darkBrown mb-3">Class Health Overview</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{survivalRate.avgSurvival}%</div>
            <div className="text-xs text-gray-500">Avg Survival</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-trail-blue">{survivalRate.avgMorale}</div>
            <div className="text-xs text-gray-500">Avg Morale</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">{survivalRate.avgGrace}</div>
            <div className="text-xs text-gray-500">Avg Grace</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>Sunday Rests: {survivalRate.totalSundayRests}</div>
          <div>Prayers: {survivalRate.totalPrayers}</div>
          <div>Historian Q&As: {survivalRate.totalHistorian}</div>
          <div>Knowledge Cards: {survivalRate.totalKnowledge}</div>
        </div>
      </div>
    </div>
  );
}

function getGraceDistribution(students) {
  const bands = [
    { label: 'Depleted', min: 0, max: 14, count: 0, color: 'bg-red-500' },
    { label: 'Low', min: 15, max: 39, count: 0, color: 'bg-orange-400' },
    { label: 'Moderate', min: 40, max: 74, count: 0, color: 'bg-gray-400' },
    { label: 'High', min: 75, max: 100, count: 0, color: 'bg-yellow-400' },
  ];
  students.forEach(s => {
    const grace = s.gameState?.grace ?? 50;
    const band = bands.find(b => grace >= b.min && grace <= b.max);
    if (band) band.count++;
  });
  return bands;
}

function getCwmChoices(students) {
  let helped = 0;
  let declined = 0;
  let deceptive = 0;
  students.forEach(s => {
    (s.gameState?.cwmEvents || []).forEach(e => {
      if (e.choice === 'helped') helped++;
      else declined++;
      if (e.recipientGenuine === false) deceptive++;
    });
  });
  return { helped, declined, deceptive, total: helped + declined };
}

function getSurvivalRate(students) {
  let totalAlive = 0;
  let totalMembers = 0;
  let moraleSum = 0;
  let graceSum = 0;
  let totalSundayRests = 0;
  let totalPrayers = 0;
  let totalHistorian = 0;
  let totalKnowledge = 0;

  students.forEach(s => {
    const gs = s.gameState || {};
    const members = gs.partyMembers || [];
    totalMembers += members.length;
    totalAlive += members.filter(m => m.alive).length;
    moraleSum += gs.morale || 0;
    graceSum += gs.grace || 50;
    totalSundayRests += gs.sundayRestsTaken || 0;
    totalPrayers += gs.prayersOffered || 0;
    totalHistorian += (gs.historianTranscript || []).length;
    totalKnowledge += (gs.knowledgeCardsRead || []).length;
  });

  const count = students.length || 1;
  return {
    avgSurvival: totalMembers > 0 ? Math.round((totalAlive / totalMembers) * 100) : 100,
    avgMorale: Math.round(moraleSum / count),
    avgGrace: Math.round(graceSum / count),
    totalSundayRests,
    totalPrayers,
    totalHistorian,
    totalKnowledge,
  };
}

function getTrailProgress(students) {
  const TOTAL_LANDMARKS = 16;
  return students.map(s => {
    const gs = s.gameState || {};
    const idx = gs.currentLandmarkIndex || 0;
    return {
      id: s.studentId,
      name: s.studentName || gs.studentName || 'Unknown',
      progress: Math.min(100, (idx / (TOTAL_LANDMARKS - 1)) * 100),
      status: gs.status,
    };
  }).sort((a, b) => b.progress - a.progress);
}
