import { useState } from 'react';
import { useGameState, useGameDispatch } from '../../../store/GameContext';
import { api } from '../../../utils/api';
import { logger } from '../../../utils/logger';

export default function HistorianPanel() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError('');

    const gameContext = {
      student_name: state.studentName,
      party_names: state.partyMembers.map(m => m.name).join(', '),
      current_landmark: state.currentLandmarkIndex,
      game_date: state.gameDate,
      last_event_description: state.eventLog.length > 0
        ? state.eventLog[state.eventLog.length - 1].description
        : 'Beginning of the journey'
    };

    try {
      const result = await api.historianQuery(
        state.sessionCode,
        state.studentId,
        question.trim(),
        gameContext
      );

      dispatch({
        type: 'ADD_HISTORIAN_ENTRY',
        entry: {
          timestamp: new Date().toISOString(),
          question: question.trim(),
          response: result.response,
          gameContext
        }
      });

      logger.info('HISTORIAN_QUERY', { studentId: state.studentId, question: question.trim() });
      setQuestion('');
    } catch (err) {
      setError('The Trail Record is unavailable right now. Try again later.');
      logger.error('HISTORIAN_API_FAILED', { error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card max-h-96 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-trail-darkBrown">The Trail Record</h3>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_HISTORIAN' })}
          className="text-gray-400 hover:text-gray-600 text-lg"
        >
          &times;
        </button>
      </div>

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 max-h-48">
        {state.historianTranscript.length === 0 && (
          <p className="text-trail-brown text-sm italic">
            Ask about the trail, its history, or the events you've encountered.
          </p>
        )}
        {state.historianTranscript.map((entry, i) => (
          <div key={i} className="space-y-1">
            <div className="text-sm text-trail-blue font-semibold">You: {entry.question}</div>
            <div className="text-sm text-trail-darkBrown bg-trail-parchment/50 p-2 rounded">
              {entry.response}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleAsk} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask the Trail Record..."
          className="input-field text-sm flex-1"
          maxLength={200}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="btn-primary text-sm px-3"
        >
          {loading ? '...' : 'Ask'}
        </button>
      </form>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
