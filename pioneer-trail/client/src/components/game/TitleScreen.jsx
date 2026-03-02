import { useState } from 'react';
import { useGameDispatch } from '../../store/GameContext';
import { api } from '../../utils/api';
import { logger } from '../../utils/logger';

export default function TitleScreen() {
  const dispatch = useGameDispatch();
  const [mode, setMode] = useState('title'); // title | join | create
  const [sessionCode, setSessionCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin(e) {
    e.preventDefault();
    if (!sessionCode.trim() || !studentName.trim()) {
      setError('Please enter both a session code and your name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.joinSession(sessionCode.trim().toUpperCase(), studentName.trim());
      logger.info('SESSION_JOINED', { sessionCode, studentId: result.studentId });

      dispatch({
        type: 'SET_SESSION',
        sessionCode: sessionCode.trim().toUpperCase(),
        studentId: result.studentId,
        gradeBand: result.gradeBand,
        settings: result.settings
      });
      dispatch({ type: 'SET_PHASE', phase: 'SETUP' });
    } catch (err) {
      setError(err.message || 'Could not join session. Check your code and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handlePlayOffline() {
    const id = 'offline_' + Date.now();
    dispatch({
      type: 'SET_SESSION',
      sessionCode: null,
      studentId: id,
      gradeBand: '6_8',
      settings: { moral_label_mode: 'full', historian_enabled: false }
    });
    dispatch({ type: 'SET_PHASE', phase: 'SETUP' });
  }

  // Check localStorage for saved game
  function handleResume() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('lwh_state_'));
    if (keys.length > 0) {
      try {
        const saved = JSON.parse(localStorage.getItem(keys[keys.length - 1]));
        if (saved && saved.phase !== 'TITLE' && saved.phase !== 'GAME_OVER') {
          dispatch({ type: 'LOAD_STATE', savedState: saved });
          return true;
        }
      } catch (e) {
        logger.error('RESUME_FAILED', { error: e.message });
      }
    }
    return false;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-trail-cream to-trail-parchment px-4">
      {/* Trail scene background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-green-800/20 to-transparent" />
        <div className="absolute bottom-12 left-1/4 w-32 h-20 bg-trail-brown/10 rounded-full" />
        <div className="absolute bottom-8 right-1/3 w-40 h-24 bg-trail-brown/10 rounded-full" />
      </div>

      <div className="relative z-10 text-center max-w-xl w-full">
        <h1 className="text-5xl md:text-6xl font-bold text-trail-darkBrown mb-2 font-display">
          The Long Way Home
        </h1>
        <p className="text-trail-brown text-lg mb-8 italic">
          A journey of faith, choice, and consequence
        </p>

        {mode === 'title' && (
          <div className="space-y-4">
            <button onClick={() => setMode('join')} className="btn-primary w-64 text-lg py-3">
              Join a Session
            </button>
            <br />
            <button onClick={handlePlayOffline} className="btn-secondary w-64 text-lg py-3">
              Play Offline
            </button>
            <br />
            <button
              onClick={() => {
                if (!handleResume()) {
                  setError('No saved game found.');
                  setTimeout(() => setError(''), 3000);
                }
              }}
              className="text-trail-blue underline hover:text-trail-darkBlue text-sm mt-4 inline-block"
            >
              Resume Saved Game
            </button>
          </div>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="card max-w-md mx-auto space-y-4">
            <h2 className="text-xl font-semibold text-trail-darkBrown">Join Session</h2>
            <div>
              <label className="block text-sm text-trail-brown mb-1">Session Code</label>
              <input
                type="text"
                value={sessionCode}
                onChange={e => setSessionCode(e.target.value.toUpperCase())}
                placeholder="e.g. TRAIL42"
                className="input-field text-center text-lg tracking-wider"
                maxLength={10}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-trail-brown mb-1">Your Name</label>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Enter your name"
                className="input-field"
                maxLength={30}
              />
            </div>
            {error && <p className="text-trail-red text-sm">{error}</p>}
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={() => setMode('title')} className="btn-secondary">
                Back
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Joining...' : 'Join'}
              </button>
            </div>
          </form>
        )}

        {mode === 'title' && error && (
          <p className="text-trail-red text-sm mt-4">{error}</p>
        )}

        <p className="text-trail-brown/50 text-xs mt-12">
          An educational game for Catholic classrooms
        </p>
      </div>
    </div>
  );
}
