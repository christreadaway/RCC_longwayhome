import { useState } from 'react';

export default function SettingsPanel({ session, onClose, onUpdate }) {
  const [settings, setSettings] = useState(session.settings || {});

  function updateSetting(key, value) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    onUpdate(updated);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-trail-darkBrown">Session Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-trail-darkBrown mb-1">Moral Label Mode</label>
            <select
              value={settings.moral_label_mode || 'full'}
              onChange={e => updateSetting('moral_label_mode', e.target.value)}
              className="select-field text-sm"
            >
              <option value="full">Full (immediate labels)</option>
              <option value="post_choice">Post-Choice</option>
              <option value="discussion_only">Discussion Only</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox"
              checked={settings.historian_enabled || false}
              onChange={e => updateSetting('historian_enabled', e.target.checked)} />
            AI Trail Historian
          </label>

          {settings.historian_enabled && (
            <div className="ml-6">
              <label className="block text-xs text-gray-500 mb-1">Access Mode</label>
              <select
                value={settings.historian_access_mode || 'prompted'}
                onChange={e => updateSetting('historian_access_mode', e.target.value)}
                className="select-field text-sm"
              >
                <option value="prompted">Post-Event Only</option>
                <option value="free">Free (any rest point)</option>
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox"
              checked={settings.ai_npc_enabled || false}
              onChange={e => updateSetting('ai_npc_enabled', e.target.checked)} />
            AI NPC Encounters
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox"
              checked={settings.ai_exam_conscience_enabled || false}
              onChange={e => updateSetting('ai_exam_conscience_enabled', e.target.checked)} />
            AI Examination of Conscience
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox"
              checked={settings.scripture_in_labels || false}
              onChange={e => updateSetting('scripture_in_labels', e.target.checked)} />
            Scripture references in labels
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox"
              checked={settings.cwm_reveal_end_screen !== false}
              onChange={e => updateSetting('cwm_reveal_end_screen', e.target.checked)} />
            Reveal CWM on end screen
          </label>

          <div>
            <label className="block text-sm font-semibold text-trail-darkBrown mb-1">Event Frequency</label>
            <select
              value={settings.chaos_level || 'standard'}
              onChange={e => updateSetting('chaos_level', e.target.value)}
              className="select-field text-sm"
            >
              <option value="low">Low</option>
              <option value="standard">Standard</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-primary w-full">Done</button>
        </div>
      </div>
    </div>
  );
}
