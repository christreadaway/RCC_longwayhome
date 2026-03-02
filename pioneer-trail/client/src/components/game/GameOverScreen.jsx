import { useState, useEffect, useMemo } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { GRACE_RANGES } from '@shared/types';
import { formatGameDate } from '../../utils/dateUtils';
import { api } from '../../utils/api';
import { logger } from '../../utils/logger';

export default function GameOverScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [examOfConscience, setExamOfConscience] = useState(null);
  const [showExam, setShowExam] = useState(false);

  const survived = state.partyMembers.filter(m => m.alive);
  const dead = state.partyMembers.filter(m => !m.alive);
  const didWin = state.status === 'completed';
  const graceRange = getGraceRange(state.grace);

  // Calculate score
  const score = useMemo(() => {
    let raw = 0;
    raw += survived.length * 200;
    raw += Math.round(state.foodLbs);
    raw += Math.round(state.cash);
    raw += state.clothingSets * 10;
    raw += state.ammoBoxes * 5;
    raw += state.oxenYokes * 40;
    if (didWin) raw += 500;
    // Days remaining bonus
    const endDate = new Date(1848, 11, 31);
    const gameDate = new Date(state.gameDate);
    const daysLeft = Math.max(0, Math.floor((endDate - gameDate) / (1000 * 60 * 60 * 24)));
    raw += daysLeft * 5;

    const graceMultiplier = state.grace >= 75 ? 1.2 : 1.0;
    const adjusted = Math.round(raw * graceMultiplier);

    return { raw, adjusted, graceMultiplier };
  }, [survived.length, state.foodLbs, state.cash, state.clothingSets, state.ammoBoxes, state.oxenYokes, didWin, state.gameDate, state.grace]);

  // Save score
  useEffect(() => {
    dispatch({
      type: 'SET_SCORE',
      score: score.raw,
      graceAdjustedScore: score.adjusted,
      narrative: getArrivalNarrative(state, graceRange, didWin)
    });

    // Sync final state to server
    if (state.sessionCode) {
      api.updateState(state.sessionCode, state.studentId, { ...state, score: score.raw, graceAdjustedScore: score.adjusted })
        .catch(err => logger.error('FINAL_STATE_SYNC_FAILED', { error: err.message }));
    }
  }, []);

  // Fetch AI Exam of Conscience if enabled
  useEffect(() => {
    if (state.sessionSettings?.ai_exam_conscience_enabled && state.sessionCode) {
      api.historianQuery(state.sessionCode, state.studentId, '__exam_conscience__', {
        event_log: state.eventLog,
        grace_score: state.grace,
        party_names: state.partyMembers.map(m => m.name),
        deaths: dead.map(m => ({ name: m.name, cause: m.causeOfDeath }))
      }).then(res => {
        if (res.response) setExamOfConscience(res.response);
      }).catch(() => {
        setExamOfConscience(getTemplatedExam(state));
      });
    } else {
      setExamOfConscience(getTemplatedExam(state));
    }
  }, []);

  function handleNewGame() {
    localStorage.removeItem(`lwh_state_${state.studentId}`);
    dispatch({ type: 'RESET' });
  }

  const narrative = getArrivalNarrative(state, graceRange, didWin);
  const lifeInOregon = didWin ? getLifeInOregon(graceRange) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className={`scene-card ${didWin ? 'bg-gradient-to-b from-green-700 to-green-500' : 'bg-gradient-to-b from-gray-700 to-gray-500'} p-8 text-center text-white`}>
          <h1 className="text-4xl font-bold mb-2">
            {didWin ? 'You Made It!' : 'The Trail Ends Here'}
          </h1>
          <p className="text-white/80 text-lg">
            {didWin
              ? `You arrived at the Willamette Valley on ${formatGameDate(state.gameDate)}.`
              : state.partyMembers.every(m => !m.alive)
                ? 'Your entire party has perished on the trail.'
                : `Your journey ended on ${formatGameDate(state.gameDate)}.`
            }
          </p>
        </div>

        {/* Arrival Narrative */}
        <div className="card-parchment">
          <p className="text-trail-darkBrown leading-relaxed italic text-lg">
            {narrative}
          </p>
        </div>

        {/* Party Summary */}
        <div className="card">
          <h2 className="text-xl font-bold text-trail-darkBrown mb-4">Your Party</h2>
          <div className="space-y-2">
            {state.partyMembers.map(m => (
              <div key={m.name} className={`flex justify-between items-center p-2 rounded ${m.alive ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className={`font-semibold ${!m.alive ? 'text-gray-500' : 'text-trail-darkBrown'}`}>
                  {m.name} {m.isChaplain ? '(Chaplain)' : m.isPlayer ? '(You)' : ''}
                </span>
                <span className={m.alive ? 'text-green-600' : 'text-red-600'}>
                  {m.alive ? 'Survived' : `Died of ${m.causeOfDeath || 'unknown causes'}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Score */}
        <div className="card text-center">
          <h2 className="text-xl font-bold text-trail-darkBrown mb-4">Final Score</h2>
          <div className="text-5xl font-bold text-trail-blue mb-2">{score.adjusted}</div>
          {score.graceMultiplier > 1 && (
            <p className="text-trail-gold text-sm">
              Grace multiplier applied ({score.graceMultiplier}x)
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm text-trail-brown mt-4 max-w-sm mx-auto">
            <div>Survivors: {survived.length}</div>
            <div>Days on Trail: {state.trailDay}</div>
            <div>Cash: ${state.cash.toFixed(2)}</div>
            <div>Food: {Math.round(state.foodLbs)} lbs</div>
            <div>Sunday Rests: {state.sundayRestsTaken}</div>
            <div>People Helped: {state.cwmEvents.filter(e => e.choice === 'helped').length}</div>
          </div>
        </div>

        {/* Life in Oregon (6-8 win only) */}
        {lifeInOregon && state.gradeBand === '6_8' && didWin && (
          <div className="card-parchment">
            <h2 className="text-xl font-bold text-trail-darkBrown mb-3">Life in Oregon</h2>
            <p className="text-trail-darkBrown leading-relaxed italic">{lifeInOregon}</p>
          </div>
        )}

        {/* Journey Stats */}
        <div className="card">
          <h2 className="text-xl font-bold text-trail-darkBrown mb-3">Your Journey</h2>
          <div className="space-y-2 text-sm">
            {state.cwmEvents.length > 0 && (
              <div>
                <h3 className="font-semibold">Choices on the Trail:</h3>
                {state.cwmEvents.map((e, i) => (
                  <div key={i} className="ml-4 text-trail-brown">
                    {e.eventType.replace(/_/g, ' ')} — {e.choice === 'helped' ? 'You helped' : 'You passed by'}
                  </div>
                ))}
              </div>
            )}
            {dead.length > 0 && (
              <div>
                <h3 className="font-semibold">Lost Along the Way:</h3>
                {dead.map(m => (
                  <div key={m.name} className="ml-4 text-trail-brown">
                    {m.name} — {m.causeOfDeath || 'unknown causes'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Examination of Conscience */}
        <div className="card-parchment">
          <button
            onClick={() => setShowExam(!showExam)}
            className="w-full text-left"
          >
            <h2 className="text-xl font-bold text-trail-darkBrown flex items-center justify-between">
              <span>{state.sessionSettings?.cwm_reveal_end_screen !== false ? 'Examination of Conscience' : 'Looking Back'}</span>
              <span className="text-trail-brown text-sm">{showExam ? 'Hide' : 'Show'}</span>
            </h2>
          </button>
          {showExam && examOfConscience && (
            <div className="mt-4 space-y-3 text-trail-darkBrown leading-relaxed">
              <p className="italic">{examOfConscience}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button onClick={handleNewGame} className="btn-primary flex-1 py-3">
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}

function getGraceRange(grace) {
  if (grace >= 75) return 'HIGH';
  if (grace >= 40) return 'MODERATE';
  if (grace >= 15) return 'LOW';
  return 'DEPLETED';
}

function getArrivalNarrative(state, graceRange, didWin) {
  const survived = state.partyMembers.filter(m => m.alive);
  const dead = state.partyMembers.filter(m => !m.alive);

  if (!didWin) {
    if (state.partyMembers.every(m => !m.alive)) {
      return `The trail claimed everyone. ${state.studentName}'s wagon sits empty somewhere between Independence and the Willamette Valley, a silent marker of a journey that asked too much.`;
    }
    return `Your journey ended before reaching Oregon. The trail is long, and not everyone who starts it finishes. But the choices you made — the people you helped or passed by — those shaped who you became along the way.`;
  }

  const narratives = {
    HIGH: `You arrived at the Willamette Valley with ${survived.length} companion${survived.length !== 1 ? 's' : ''} by your side. The journey was hard — the trail always is — but you carried something more than supplies in that wagon. The families you fed, the strangers you stopped for, the Sundays you rested — they cost you time and resources, but they gave you something money couldn't buy. As you look out over the valley, you feel a peace that has nothing to do with the land ahead and everything to do with the person you became on the way here.`,

    MODERATE: `You arrived at the Willamette Valley on a clear day. ${survived.length} of your party made it. ${dead.length > 0 ? `You lost ${dead.map(m => m.name).join(' and ')} along the way — their names will stay with you.` : ''} You made some hard choices on the trail. Some you're proud of. Some you wonder about. That's the trail — it asks more questions than it answers. The valley is beautiful. The life ahead is yours to build.`,

    LOW: `You reached the Willamette Valley. Your wagon is intact, your supplies are decent. ${dead.length > 0 ? `But ${dead.map(m => m.name).join(' and ')} ${dead.length > 1 ? 'are' : 'is'} buried somewhere behind you on the trail.` : ''} You passed a few people who needed help. You kept your head down and your pace up. It worked — you're here. But the valley feels quieter than you expected. The people who could have been friends are somewhere behind you, still on the trail or in the ground.`,

    DEPLETED: `You reached the Willamette Valley with $${state.cash.toFixed(0)} in your pocket and ${Math.round(state.foodLbs)} pounds of food in the wagon. ${dead.length > 0 ? `Of the ${state.partyMembers.length} people who began this journey, ${dead.length} ${dead.length > 1 ? 'are' : 'is'} buried along the trail. ${dead.map(m => `${m.name} died of ${m.causeOfDeath || 'hardship'}`).join('. ')}.` : ''} You arrived. No one was waiting for you. The strangers you passed along the way are somewhere behind you, still on the trail or in the ground. The land is beautiful. You'll have to decide what kind of person you want to be here — because the trail is over, and it's too late to go back.`
  };

  return narratives[graceRange] || narratives.MODERATE;
}

function getLifeInOregon(graceRange) {
  const narratives = {
    HIGH: "In the years that followed, you became a pillar of the small community forming in the valley. You helped build the first church. Your name became synonymous with generosity — the kind of person neighbors trusted and strangers sought out. The trail shaped you, and you carried its lessons into every season of your new life.",
    MODERATE: "You settled well in the Willamette Valley. Built a cabin, planted crops, found your footing. A decent life with some regrets and mostly peace. Sometimes, on quiet evenings, you thought about the trail — the choices you made, the ones you didn't. But the valley was good to you, and you to it, mostly.",
    LOW: "You prospered in Oregon — more land than most, a solid house, money in reserve. But the neighbors kept their distance, and you kept yours. The people who could have been lifelong friends were left behind on the trail. You were comfortable. You were alone. The trail taught you how to survive. It just didn't teach you how to live.",
    DEPLETED: "You made it. Rich enough, even. But the kind of alone that money doesn't fix. The trail shaped you — just not the way you'd want to tell your grandchildren. In the quiet moments, you wondered if the supplies you hoarded and the people you passed were worth the price of arriving with everything except the one thing that matters."
  };
  return narratives[graceRange] || narratives.MODERATE;
}

function getTemplatedExam(state) {
  const helped = state.cwmEvents.filter(e => e.choice === 'helped');
  const declined = state.cwmEvents.filter(e => e.choice === 'declined');
  const dead = state.partyMembers.filter(m => !m.alive);

  let exam = 'Looking back on your journey:\n\n';

  if (helped.length > 0) {
    exam += `You stopped to help ${helped.length} time${helped.length > 1 ? 's' : ''} when someone needed you. Each time, it cost you something — supplies, time, risk. But you chose to help anyway.\n\n`;
  }

  if (declined.length > 0) {
    exam += `There ${declined.length > 1 ? 'were' : 'was'} ${declined.length} time${declined.length > 1 ? 's' : ''} when someone needed your help and you kept moving. What would you do differently if you could go back?\n\n`;
  }

  if (dead.length > 0) {
    exam += `You lost ${dead.map(m => m.name).join(', ')} on this journey. Their lives mattered. Could any of those losses have been prevented?\n\n`;
  }

  if (state.sundayRestsTaken > 0) {
    exam += `You rested on the Sabbath ${state.sundayRestsTaken} time${state.sundayRestsTaken > 1 ? 's' : ''}. That rest cost you travel time, but gave your party something more than miles.\n`;
  }

  return exam;
}
