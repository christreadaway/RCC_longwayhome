import { useState } from 'react';
import { api } from '../../utils/api';

export default function SessionSetup({ onSessionReady }) {
  const [mode, setMode] = useState('choose'); // choose | create | join
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [gradeBand, setGradeBand] = useState('6_8');
  const [apiKey, setApiKey] = useState('');
  const [settings, setSettings] = useState({
    historian_enabled: false,
    historian_model: 'claude-haiku-4-5',
    historian_access_mode: 'prompted',
    ai_exam_conscience_enabled: false,
    ai_npc_enabled: false,
    moral_label_mode: 'full',
    scripture_in_labels: false,
    cwm_reveal_end_screen: true,
    chaos_level: 'standard'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!code.trim() || !password.trim()) {
      setError('Session code and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.createSession({
        code: code.trim().toUpperCase(),
        password: password.trim(),
        gradeBand,
        settings: {
          ...settings,
          api_key: apiKey.trim() || undefined
        }
      });
      onSessionReady({
        code: code.trim().toUpperCase(),
        password: password.trim(),
        gradeBand,
        settings,
        ...result
      });
    } catch (err) {
      setError(err.message || 'Failed to create session.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinExisting(e) {
    e.preventDefault();
    if (!code.trim() || !password.trim()) {
      setError('Enter the session code and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const verify = await api.verifyPassword(code.trim().toUpperCase(), password.trim());
      if (!verify.valid) {
        setError('Incorrect password.');
        setLoading(false);
        return;
      }
      const info = await api.getSessionInfo(code.trim().toUpperCase());
      onSessionReady({
        code: code.trim().toUpperCase(),
        password: password.trim(),
        ...info
      });
    } catch (err) {
      setError(err.message || 'Session not found.');
    } finally {
      setLoading(false);
    }
  }

  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-8">
      <div className="card max-w-xl w-full">
        <h1 className="text-3xl font-bold text-trail-darkBrown text-center mb-2">Teacher Dashboard</h1>
        <p className="text-trail-brown text-center mb-6">The Long Way Home</p>

        {mode === 'choose' && (
          <div className="space-y-4">
            <button onClick={() => setMode('create')} className="btn-primary w-full py-3 text-lg">
              Create New Session
            </button>
            <button onClick={() => setMode('join')} className="btn-secondary w-full py-3 text-lg">
              Rejoin Existing Session
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-trail-darkBrown mb-1">Session Code</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. TRAIL42" className="input-field text-center tracking-wider" maxLength={10} />
              <p className="text-xs text-trail-brown mt-1">Students will use this code to join</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-trail-darkBrown mb-1">Teacher Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Dashboard password" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-trail-darkBrown mb-1">Grade Band</label>
              <select value={gradeBand} onChange={e => setGradeBand(e.target.value)} className="select-field">
                <option value="k2">K-2 (Journey to the Valley)</option>
                <option value="3_5">3-5 (The Long Trail)</option>
                <option value="6_8">6-8 (The Full Trail)</option>
              </select>
            </div>

            {/* AI Settings */}
            <div className="border border-trail-tan rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-trail-darkBrown">AI Features</h3>

              <div>
                <label className="block text-xs text-trail-brown mb-1">Anthropic API Key (optional)</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-ant-..." className="input-field text-sm" />
                <p className="text-xs text-trail-brown/60 mt-1">Required for AI features. Never stored permanently.</p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.historian_enabled}
                  onChange={e => updateSetting('historian_enabled', e.target.checked)} />
                AI Trail Historian
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.ai_npc_enabled}
                  onChange={e => updateSetting('ai_npc_enabled', e.target.checked)} />
                AI NPC Encounters
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.ai_exam_conscience_enabled}
                  onChange={e => updateSetting('ai_exam_conscience_enabled', e.target.checked)} />
                AI Examination of Conscience
              </label>
            </div>

            {/* Game Settings */}
            <div className="border border-trail-tan rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-trail-darkBrown">Game Settings</h3>

              <div>
                <label className="block text-xs text-trail-brown mb-1">Moral Label Mode</label>
                <select value={settings.moral_label_mode}
                  onChange={e => updateSetting('moral_label_mode', e.target.value)} className="select-field text-sm">
                  <option value="full">Full (labels appear immediately)</option>
                  <option value="post_choice">Post-Choice (labels after resolution)</option>
                  <option value="discussion_only">Discussion Only (no in-game labels)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.scripture_in_labels}
                  onChange={e => updateSetting('scripture_in_labels', e.target.checked)} />
                Include scripture references in labels
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.cwm_reveal_end_screen}
                  onChange={e => updateSetting('cwm_reveal_end_screen', e.target.checked)} />
                Reveal CWM framework on Examination of Conscience
              </label>

              <div>
                <label className="block text-xs text-trail-brown mb-1">Event Frequency</label>
                <select value={settings.chaos_level}
                  onChange={e => updateSetting('chaos_level', e.target.value)} className="select-field text-sm">
                  <option value="low">Low (fewer hardship events)</option>
                  <option value="standard">Standard</option>
                  <option value="high">High (more hardship events)</option>
                </select>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setMode('choose')} className="btn-secondary flex-1">Back</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinExisting} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-trail-darkBrown mb-1">Session Code</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. TRAIL42" className="input-field text-center tracking-wider" maxLength={10} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-trail-darkBrown mb-1">Teacher Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" />
            </div>
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setMode('choose')} className="btn-secondary flex-1">Back</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
