import { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/api';
import { logger } from '../../utils/logger';
import StudentCard from './StudentCard';
import SettingsPanel from './SettingsPanel';
import TranscriptViewer from './TranscriptViewer';

export default function DashboardMain({ session, setSession }) {
  const [students, setStudents] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Poll for student states
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const result = await api.getStudents(session.code);
        setStudents(result.students || []);
      } catch (err) {
        logger.error('DASHBOARD_POLL_FAILED', { error: err.message });
      }
    };

    fetchStudents();
    const interval = setInterval(fetchStudents, 10000);
    return () => clearInterval(interval);
  }, [session.code]);

  // Ctrl+Shift+D for debug
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handlePauseToggle() {
    try {
      if (isPaused) {
        await api.resumeAll(session.code);
        setIsPaused(false);
      } else {
        await api.pauseAll(session.code);
        setIsPaused(true);
      }
    } catch (err) {
      logger.error('PAUSE_TOGGLE_FAILED', { error: err.message });
    }
  }

  async function handleGenerateInsights() {
    setInsightsLoading(true);
    try {
      const aggregateData = {
        studentCount: students.length,
        gradeBand: session.gradeBand,
        cwmChoices: students.flatMap(s => s.gameState?.cwmEvents || []),
        graceScores: students.map(s => s.gameState?.grace || 50),
        deaths: students.flatMap(s => (s.gameState?.partyMembers || []).filter(m => !m.alive)),
        historianQueries: students.reduce((sum, s) => sum + (s.gameState?.historianTranscript?.length || 0), 0),
        commonEvents: getCommonEvents(students),
        sundayRests: students.reduce((sum, s) => sum + (s.gameState?.sundayRestsTaken || 0), 0)
      };
      const result = await api.generateInsights(session.code, aggregateData);
      setInsights(result.insights || [result.insights]);
    } catch (err) {
      setInsights(['Unable to generate insights. Check that an API key is configured.']);
    } finally {
      setInsightsLoading(false);
    }
  }

  async function handleExport() {
    try {
      const blob = await api.exportCsv(session.code);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session_${session.code}_export.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('EXPORT_FAILED', { error: err.message });
    }
  }

  // Sort and filter
  const displayStudents = [...students]
    .filter(s => {
      if (filterBy === 'struggling') {
        return s.gameState?.partyMembers?.some(m => m.alive && m.health === 'critical');
      }
      if (filterBy === 'at_risk') {
        return (s.gameState?.foodLbs || 0) < 50 || (s.gameState?.cash || 0) < 10;
      }
      if (filterBy === 'completed') {
        return s.gameState?.status === 'completed' || s.gameState?.status === 'failed';
      }
      return true;
    })
    .sort((a, b) => {
      const gsA = a.gameState || {};
      const gsB = b.gameState || {};
      switch (sortBy) {
        case 'name': return (a.studentName || '').localeCompare(b.studentName || '');
        case 'location': return (gsA.currentLandmarkIndex || 0) - (gsB.currentLandmarkIndex || 0);
        case 'health': return countCritical(gsB) - countCritical(gsA);
        case 'grace': return (gsB.grace || 0) - (gsA.grace || 0);
        default: return 0;
      }
    });

  const feedbackUrl = buildFeedbackUrl(session, students);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-trail-darkBrown text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">The Long Way Home — Teacher Dashboard</h1>
            <div className="flex items-center gap-4 text-sm text-trail-tan mt-1">
              <span>Session: <strong>{session.code}</strong></span>
              <span>Grade Band: <strong>{session.gradeBand === 'k2' ? 'K-2' : session.gradeBand === '3_5' ? '3-5' : '6-8'}</strong></span>
              <span>Students: <strong>{students.length}</strong></span>
              {isPaused && <span className="text-red-400 font-bold">PAUSED</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePauseToggle}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isPaused ? 'Resume All' : 'Pause All'}
            </button>
            <button onClick={() => setShowSettings(true)} className="px-4 py-2 bg-trail-blue rounded-lg text-sm hover:bg-trail-darkBlue">
              Settings
            </button>
            <button onClick={handleExport} className="px-4 py-2 bg-trail-brown rounded-lg text-sm hover:bg-trail-darkBrown">
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Filters and Sort */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort:</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="select-field text-sm w-auto">
              <option value="name">Name</option>
              <option value="location">Location</option>
              <option value="health">Health (critical first)</option>
              <option value="grace">Grace Score</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select value={filterBy} onChange={e => setFilterBy(e.target.value)} className="select-field text-sm w-auto">
              <option value="all">All Students</option>
              <option value="struggling">Struggling</option>
              <option value="at_risk">At Risk</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Student Grid */}
        {displayStudents.length === 0 ? (
          <div className="card text-center py-12">
            <h2 className="text-xl text-gray-500">No students have joined yet</h2>
            <p className="text-gray-400 mt-2">Share session code <strong>{session.code}</strong> with your class</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayStudents.map(student => (
              <StudentCard
                key={student.studentId}
                student={student}
                onViewTranscript={() => {
                  setSelectedStudent(student);
                  setShowTranscript(true);
                }}
                showDebug={showDebug}
              />
            ))}
          </div>
        )}

        {/* Insights Section */}
        <div className="mt-8 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-trail-darkBrown">Class Insights</h2>
            <button
              onClick={handleGenerateInsights}
              disabled={insightsLoading || students.length === 0}
              className="btn-secondary text-sm"
            >
              {insightsLoading ? 'Generating...' : 'Generate Class Insights'}
            </button>
          </div>
          {insights && (
            <div className="space-y-3">
              {(Array.isArray(insights) ? insights : [insights]).map((insight, i) => (
                <div key={i} className="p-3 bg-trail-parchment rounded-lg text-trail-darkBrown text-sm leading-relaxed">
                  {insight}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>The Long Way Home — Teacher Dashboard</span>
          {feedbackUrl && (
            <a href={feedbackUrl} target="_blank" rel="noopener noreferrer" className="text-trail-blue hover:underline">
              Give Feedback
            </a>
          )}
        </footer>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel
          session={session}
          onClose={() => setShowSettings(false)}
          onUpdate={(newSettings) => {
            api.updateSettings(session.code, newSettings).catch(err => logger.error('SETTINGS_UPDATE_FAILED', { error: err.message }));
          }}
        />
      )}

      {/* Transcript Viewer */}
      {showTranscript && selectedStudent && (
        <TranscriptViewer
          student={selectedStudent}
          onClose={() => { setShowTranscript(false); setSelectedStudent(null); }}
        />
      )}
    </div>
  );
}

function countCritical(gs) {
  return (gs?.partyMembers || []).filter(m => m.alive && m.health === 'critical').length;
}

function getCommonEvents(students) {
  const counts = {};
  students.forEach(s => {
    (s.gameState?.eventLog || []).forEach(e => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function buildFeedbackUrl(session, students) {
  const baseUrl = import.meta.env?.VITE_FEEDBACK_FORM_URL;
  if (!baseUrl) return null;
  const params = new URLSearchParams({
    session_date: new Date().toISOString().split('T')[0],
    session_code: session.code,
    student_count: students.length,
    ai_enabled: session.settings?.historian_enabled ? 'Y' : 'N',
    grade_band: session.gradeBand,
    version: '1.0.0'
  });
  return `${baseUrl}?${params.toString()}`;
}
