import { useState, useMemo } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { PROFESSION_CASH, PROFESSION_CASH_BY_GRADE, K2_DEFAULT_PROFESSION, K2_STARTING_SUPPLIES, GAME_CONSTANTS, GRACE_DELTAS, CLERGY_SKILLS, randomClergySkill, randomClergyAge } from '@shared/types';

const AGE_OPTIONS = [
  { label: 'Child (6-12)', min: 6, max: 12 },
  { label: 'Teen (13-17)', min: 13, max: 17 },
  { label: 'Adult (18-54)', min: 18, max: 54 },
  { label: 'Elder (55-65)', min: 55, max: 65 },
];

function randomAgeInRange(range) {
  return range.min + Math.floor(Math.random() * (range.max - range.min + 1));
}

export default function SetupScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const is68 = state.gradeBand === '6_8';
  const is35 = state.gradeBand === '3_5';
  const isK2 = state.gradeBand === 'k2';

  const companionCount = isK2 ? 2 : 4;

  const [playerName, setPlayerName] = useState(state.studentName || '');
  const [playerGender, setPlayerGender] = useState('male');
  const [playerAgeRange, setPlayerAgeRange] = useState(2); // Adult index
  const [companions, setCompanions] = useState(
    Array.from({ length: companionCount }, () => ({ name: '', gender: 'male', ageRange: 2 }))
  );
  const [profession, setProfession] = useState('tradesman');
  const [includeChaplain, setIncludeChaplain] = useState(false);
  const [error, setError] = useState('');

  // Generate chaplain details once when toggled on
  const chaplainDetails = useMemo(() => ({
    skill: randomClergySkill(),
    age: randomClergyAge(),
  }), [includeChaplain]);

  function handleCompanionChange(index, field, value) {
    const updated = [...companions];
    updated[index] = { ...updated[index], [field]: value };
    setCompanions(updated);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter your name.');
      return;
    }

    const validCompanions = companions.filter(c => c.name.trim());
    if (validCompanions.length === 0) {
      setError(isK2 ? 'Name at least one friend to travel with.' : 'Name at least one companion.');
      return;
    }

    const partyMembers = [
      {
        name: playerName.trim(),
        health: 'good',
        alive: true,
        isPlayer: true,
        gender: playerGender,
        age: randomAgeInRange(AGE_OPTIONS[playerAgeRange]),
        morale: GAME_CONSTANTS.INITIAL_MORALE,
      },
      ...validCompanions.map(c => ({
        name: c.name.trim(),
        health: 'good',
        alive: true,
        isPlayer: false,
        gender: c.gender,
        age: randomAgeInRange(AGE_OPTIONS[c.ageRange]),
        morale: GAME_CONSTANTS.INITIAL_MORALE,
      }))
    ];

    if (includeChaplain) {
      const skill = CLERGY_SKILLS[chaplainDetails.skill];
      partyMembers.push({
        name: 'Fr. Joseph',
        health: 'good',
        alive: true,
        isPlayer: false,
        isChaplain: true,
        gender: 'male',
        age: chaplainDetails.age,
        clergySkill: chaplainDetails.skill,
        morale: GAME_CONSTANTS.INITIAL_MORALE,
      });
    }

    // Grade-band-specific starting cash
    const gradeCash = PROFESSION_CASH_BY_GRADE[state.gradeBand];
    const startingCash = isK2 ? 0 : (gradeCash?.[profession] ?? PROFESSION_CASH[profession] ?? 400);

    dispatch({
      type: 'SET_PLAYER_INFO',
      studentName: playerName.trim(),
      profession: isK2 ? K2_DEFAULT_PROFESSION.id : profession,
      partyMembers,
      chaplainInParty: includeChaplain,
      startingCash
    });

    // Grace bonus for chaplain
    if (includeChaplain) {
      dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.CHAPLAIN, trigger: 'chaplain_included' });
    }

    if (isK2) {
      // K-2: Start fully provisioned — no store visit, no economic decisions
      const partySize = validCompanions.length + 1;
      dispatch({
        type: 'SET_SUPPLIES',
        cash: K2_STARTING_SUPPLIES.cash,
        foodLbs: K2_STARTING_SUPPLIES.foodLbs,
        clothingSets: partySize,
        ammoBoxes: K2_STARTING_SUPPLIES.ammoBoxes,
        spareParts: {
          wheels: K2_STARTING_SUPPLIES.wheels,
          axles: K2_STARTING_SUPPLIES.axles,
          tongues: K2_STARTING_SUPPLIES.tongues
        },
        oxenYokes: K2_STARTING_SUPPLIES.oxenYokes,
        waterGallons: K2_STARTING_SUPPLIES.waterGallons,
        medicineDoses: K2_STARTING_SUPPLIES.medicineDoses
      });
      dispatch({ type: 'SET_PHASE', phase: 'TRAVELING' });
    } else {
      dispatch({ type: 'SET_PHASE', phase: 'SUPPLY_PURCHASE' });
    }
  }

  const chaplainSkill = CLERGY_SKILLS[chaplainDetails.skill];

  return (
    <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-8">
      <form onSubmit={handleSubmit} className="card max-w-2xl w-full space-y-5">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-trail-darkBrown">
            {isK2 ? 'Start Your Journey!' : 'Prepare for the Trail'}
          </h1>
          <p className="text-lg text-trail-brown mt-1">
            {isK2
              ? 'Who are you traveling with?'
              : 'Independence, Missouri — April 1, 1848'}
          </p>
        </div>

        {/* Player name + demographics */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="block text-base font-semibold text-trail-darkBrown mb-1">
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
          <div>
            <label className="block text-xs font-semibold text-trail-darkBrown mb-1 uppercase tracking-wider">Gender</label>
            <div className="flex gap-1">
              {['male', 'female'].map(g => (
                <button key={g} type="button" onClick={() => setPlayerGender(g)}
                  className={`px-3 py-2 rounded-lg border text-base transition-all ${
                    playerGender === g
                      ? 'border-trail-blue bg-trail-blue/10 text-trail-darkBlue font-semibold'
                      : 'border-trail-tan hover:border-trail-blue/50 text-trail-brown'
                  }`}>
                  {g === 'male' ? 'M' : 'F'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-trail-darkBrown mb-1 uppercase tracking-wider">Age</label>
            <select value={playerAgeRange} onChange={e => setPlayerAgeRange(Number(e.target.value))}
              className="text-base px-2 py-2 border border-trail-tan rounded-lg bg-white">
              {AGE_OPTIONS.map((opt, i) => (
                <option key={i} value={i}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Profession (6-8 and 3-5 only) */}
        {!isK2 && (() => {
          const gradeCash = PROFESSION_CASH_BY_GRADE[state.gradeBand] || PROFESSION_CASH;
          return (
          <div>
            <label className="block text-base font-semibold text-trail-darkBrown mb-1">Profession</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'tradesman', label: 'Tradesman', cash: `$${gradeCash.tradesman}`, difficulty: 'Easy', diffColor: 'text-green-700 bg-green-50', trait: 'Master of repairs, never loses time' },
                { id: 'farmer', label: 'Farmer', cash: `$${gradeCash.farmer}`, difficulty: 'Medium', diffColor: 'text-yellow-700 bg-yellow-50', trait: 'Balanced — can fix some things' },
                { id: 'banker', label: 'Banker', cash: `$${gradeCash.banker}`, difficulty: 'Hard', diffColor: 'text-red-700 bg-red-50', trait: 'No trail skills — repairs cost time and parts' }
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
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${p.diffColor}`}>{p.difficulty}</div>
                  <div className="text-base font-bold text-trail-blue mt-1">{p.cash}</div>
                  <div className="text-xs mt-0.5 text-trail-brown">{p.trait}</div>
                </button>
              ))}
            </div>
          </div>
          );
        })()}

        {/* Companions with age & gender */}
        <div>
          <label className="block text-base font-semibold text-trail-darkBrown mb-1">
            {isK2 ? 'Name your friends:' : 'Name Your Companions'}
          </label>
          <div className="space-y-2">
            {companions.map((comp, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                <input
                  type="text"
                  value={comp.name}
                  onChange={e => handleCompanionChange(i, 'name', e.target.value)}
                  placeholder={`Companion ${i + 1}`}
                  className="input-field"
                  maxLength={20}
                />
                <div className="flex gap-1">
                  {['male', 'female'].map(g => (
                    <button key={g} type="button" onClick={() => handleCompanionChange(i, 'gender', g)}
                      className={`px-2.5 py-2 rounded border text-sm transition-all ${
                        comp.gender === g
                          ? 'border-trail-blue bg-trail-blue/10 text-trail-darkBlue font-semibold'
                          : 'border-trail-tan/50 text-trail-brown hover:border-trail-blue/40'
                      }`}>
                      {g === 'male' ? 'M' : 'F'}
                    </button>
                  ))}
                </div>
                <select value={comp.ageRange} onChange={e => handleCompanionChange(i, 'ageRange', Number(e.target.value))}
                  className="text-sm px-1.5 py-2 border border-trail-tan rounded bg-white">
                  {AGE_OPTIONS.map((opt, j) => (
                    <option key={j} value={j}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Chaplain option (6-8 only) */}
        {is68 && (
          <div className="card-parchment !p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeChaplain}
                onChange={e => setIncludeChaplain(e.target.checked)}
                className="mt-1 w-5 h-5 text-trail-blue rounded"
              />
              <div className="flex-1">
                <span className="font-semibold text-trail-darkBrown">Include a Trail Chaplain</span>
                <p className="text-base text-trail-brown mt-1">
                  Fr. Joseph, a Franciscan friar, will join your party. He provides morale support,
                  unlocks prayer options, and can administer Last Rites if needed.
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  Cost: extra food and clothing, added weight strains your oxen and wagon.
                </p>
                {includeChaplain && (
                  <div className="mt-2 p-2 bg-trail-cream rounded border border-trail-tan/50">
                    <div className="text-sm text-trail-darkBrown">
                      <span className="font-semibold">Fr. Joseph</span>
                      <span className="text-trail-brown ml-1">— Age {chaplainDetails.age}</span>
                    </div>
                    <div className="text-sm mt-1">
                      <span className="font-semibold text-trail-blue">Skill: {chaplainSkill.name}</span>
                      <span className="text-trail-brown ml-1">— {chaplainSkill.description}</span>
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        )}

        {isK2 && (
          <div className="card-parchment !p-3 text-center">
            <p className="text-base text-trail-brown">
              Your wagon is loaded and ready to go! You have food, water, and everything you need.
            </p>
          </div>
        )}

        {error && <p className="text-trail-red text-base text-center">{error}</p>}

        <button type="submit" className="btn-primary w-full text-lg py-3">
          {isK2 ? 'Start the Journey!' : 'Head to the General Store'}
        </button>
      </form>
    </div>
  );
}
