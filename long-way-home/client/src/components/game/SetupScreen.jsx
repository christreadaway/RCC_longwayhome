import { useState } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { PROFESSION_CASH, GAME_CONSTANTS, GRACE_DELTAS } from '@shared/types';

export default function SetupScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const is68 = state.gradeBand === '6_8';
  const is35 = state.gradeBand === '3_5';
  const isK2 = state.gradeBand === 'k2';

  const [playerName, setPlayerName] = useState(state.studentName || '');
  const [companions, setCompanions] = useState(
    isK2 ? ['', ''] : ['', '', '', '']
  );
  const [profession, setProfession] = useState('tradesman');
  const [includeChaplain, setIncludeChaplain] = useState(false);
  const [error, setError] = useState('');

  function handleCompanionChange(index, value) {
    const updated = [...companions];
    updated[index] = value;
    setCompanions(updated);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter your name.');
      return;
    }

    const validCompanions = companions.filter(c => c.trim());
    if (validCompanions.length === 0) {
      setError(isK2 ? 'Name at least one friend to travel with.' : 'Name at least one companion.');
      return;
    }

    const partyMembers = [
      { name: playerName.trim(), health: 'good', alive: true, isPlayer: true },
      ...validCompanions.map(name => ({ name: name.trim(), health: 'good', alive: true, isPlayer: false }))
    ];

    if (includeChaplain) {
      partyMembers.push({ name: 'Fr. Joseph', health: 'good', alive: true, isPlayer: false, isChaplain: true });
    }

    const startingCash = isK2 ? 0 : (PROFESSION_CASH[profession] || 400);

    dispatch({
      type: 'SET_PLAYER_INFO',
      studentName: playerName.trim(),
      profession: isK2 ? null : profession,
      partyMembers,
      chaplainInParty: includeChaplain,
      startingCash
    });

    // Grace bonus for chaplain
    if (includeChaplain) {
      dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.CHAPLAIN, trigger: 'chaplain_included' });
    }

    if (isK2) {
      // K-2 skips supply purchase — go straight to travel
      dispatch({
        type: 'SET_SUPPLIES',
        cash: 0,
        foodLbs: 200,
        clothingSets: validCompanions.length + 1,
        ammoBoxes: 0,
        spareParts: { wheels: 0, axles: 0, tongues: 0 },
        oxenYokes: 2,
        waterGallons: 200
      });
      dispatch({ type: 'SET_PHASE', phase: 'TRAVELING' });
    } else {
      dispatch({ type: 'SET_PHASE', phase: 'SUPPLY_PURCHASE' });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-8">
      <form onSubmit={handleSubmit} className="card max-w-lg w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-trail-darkBrown">
            {isK2 ? 'Start Your Journey!' : 'Prepare for the Trail'}
          </h1>
          <p className="text-trail-brown mt-1">
            {isK2
              ? 'Who are you traveling with?'
              : 'Independence, Missouri — April 1, 1848'}
          </p>
        </div>

        {/* Player name */}
        <div>
          <label className="block text-sm font-semibold text-trail-darkBrown mb-1">
            {isK2 ? 'What is your name?' : 'Your Name'}
          </label>
          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            className="input-field"
            maxLength={20}
            autoFocus
          />
        </div>

        {/* Profession (6-8 and 3-5 only) */}
        {!isK2 && (
          <div>
            <label className="block text-sm font-semibold text-trail-darkBrown mb-1">Profession</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'tradesman', label: 'Tradesman', cash: `$${PROFESSION_CASH.tradesman}`, difficulty: 'Easy', diffColor: 'text-green-700 bg-green-50', trait: 'Master of repairs, never loses time' },
                { id: 'farmer', label: 'Farmer', cash: `$${PROFESSION_CASH.farmer}`, difficulty: 'Medium', diffColor: 'text-yellow-700 bg-yellow-50', trait: 'Balanced — can fix some things' },
                { id: 'banker', label: 'Banker', cash: `$${PROFESSION_CASH.banker}`, difficulty: 'Hard', diffColor: 'text-red-700 bg-red-50', trait: 'No trail skills — repairs cost time and parts' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProfession(p.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    profession === p.id
                      ? 'border-trail-blue bg-trail-blue/10 text-trail-darkBlue'
                      : 'border-trail-tan hover:border-trail-blue/50'
                  }`}
                >
                  <div className="font-semibold">{p.label}</div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${p.diffColor}`}>{p.difficulty}</div>
                  <div className="text-sm font-bold text-trail-blue mt-1">{p.cash}</div>
                  <div className="text-[10px] mt-0.5 text-trail-brown">{p.trait}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Companions */}
        <div>
          <label className="block text-sm font-semibold text-trail-darkBrown mb-1">
            {isK2 ? 'Name your friends:' : 'Name Your Companions'}
          </label>
          <div className="space-y-2">
            {companions.map((name, i) => (
              <input
                key={i}
                type="text"
                value={name}
                onChange={e => handleCompanionChange(i, e.target.value)}
                placeholder={`Companion ${i + 1}`}
                className="input-field"
                maxLength={20}
              />
            ))}
          </div>
        </div>

        {/* Chaplain option (6-8 only) */}
        {is68 && (
          <div className="card-parchment">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeChaplain}
                onChange={e => setIncludeChaplain(e.target.checked)}
                className="mt-1 w-5 h-5 text-trail-blue rounded"
              />
              <div>
                <span className="font-semibold text-trail-darkBrown">Include a Trail Chaplain</span>
                <p className="text-sm text-trail-brown mt-1">
                  Fr. Joseph, a Franciscan friar, will join your party. He provides morale support,
                  unlocks prayer options, and can administer Last Rites if needed.
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Cost: extra food and clothing, added weight strains your oxen and wagon.
                </p>
              </div>
            </label>
          </div>
        )}

        {error && <p className="text-trail-red text-sm text-center">{error}</p>}

        <button type="submit" className="btn-primary w-full text-lg py-3">
          {isK2 ? 'Start the Journey!' : 'Head to the General Store'}
        </button>
      </form>
    </div>
  );
}
