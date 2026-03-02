export default function TranscriptViewer({ student, onClose }) {
  const gs = student.gameState || {};
  const transcript = gs.historianTranscript || [];
  const npcTranscripts = gs.npcTranscripts || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-trail-darkBrown">
              Transcripts — {student.studentName || gs.studentName}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Historian Transcript */}
          {transcript.length > 0 && (
            <div>
              <h3 className="font-bold text-trail-darkBrown mb-3">Trail Historian</h3>
              <div className="space-y-4">
                {transcript.map((entry, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-sm">
                      <div className="text-trail-blue font-semibold mb-1">
                        Student: {entry.question}
                      </div>
                      <div className="text-trail-darkBrown bg-trail-parchment/30 p-2 rounded">
                        {entry.response}
                      </div>
                    </div>
                    {entry.gameContext && (
                      <div className="text-xs text-gray-400 mt-2">
                        Context: {entry.gameContext.current_landmark}, {entry.gameContext.game_date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NPC Transcripts */}
          {npcTranscripts.length > 0 && (
            <div>
              <h3 className="font-bold text-trail-darkBrown mb-3">NPC Encounters</h3>
              <div className="space-y-4">
                {npcTranscripts.map((npc, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-sm font-semibold text-trail-brown mb-2">
                      {npc.character} at {npc.location}
                    </div>
                    {(npc.exchanges || []).map((ex, j) => (
                      <div key={j} className="text-sm mb-2">
                        <div className="text-trail-blue">Student: {ex.question}</div>
                        <div className="text-trail-darkBrown">{npc.character}: {ex.response}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {transcript.length === 0 && npcTranscripts.length === 0 && (
            <p className="text-gray-400 text-center py-8">No transcripts available for this student.</p>
          )}
        </div>
      </div>
    </div>
  );
}
