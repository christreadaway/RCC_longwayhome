import { useState, useEffect } from 'react';
import { useGameState, useGameDispatch } from '../../store/GameContext';
import { GAME_CONSTANTS, GRACE_DELTAS } from '@shared/types';
import { formatGameDate } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';
import { api } from '../../utils/api';
import landmarksData from '../../data/landmarks.json';
import landmarksK2 from '../../data/landmarks-k2.json';
import eventsData from '../../data/events.json';
import moralLabelsData from '../../data/moral-labels.json';

/**
 * Maps landmark IDs to available NPC characters.
 * NPCs reflect historically accurate tribal presence by region:
 * - Fort Kearney (Nebraska): Pawnee territory
 * - Fort Laramie (Wyoming): Lakota Sioux territory — Bordeaux was married to a Lakota woman
 * - Fort Bridger (SW Wyoming): Shoshone territory
 * - Fort Hall (Idaho): Shoshone-Bannock territory
 * - Fort Boise (Idaho): Nez Perce / Shoshone territory
 */
const NPC_LOCATIONS = {
  st_marys_mission: { key: 'desmet', name: 'Fr. Pierre-Jean De Smet', description: 'A Jesuit missionary invites you to speak with him.' },
  whitman_mission: { key: 'whitman', name: 'Marcus Whitman', description: 'The mission doctor offers a moment of conversation.' },
  fort_laramie: { key: 'bordeaux', name: 'James Bordeaux', description: 'A grizzled fur trader leans against the wall, watching you.' },
  fort_kearney: { key: 'scout_pawnee', name: 'Takoda (Pawnee Scout)', description: 'A Pawnee scout sits by the fire. His people know every river crossing and buffalo trail on these plains.' },
  fort_bridger: { key: 'scout_shoshone', name: 'Washakie (Shoshone Guide)', description: 'A Shoshone guide who knows every pass through these mountains offers to share what he knows.' },
  fort_hall: { key: 'scout_bannock', name: 'Taghee (Bannock Guide)', description: 'A Bannock guide familiar with the Snake River country sits nearby, mending a fishing net.' },
  fort_boise: { key: 'scout_nez_perce', name: 'Hímiin Maqsmáqs (Nez Perce Scout)', description: 'A Nez Perce scout who has guided many wagon trains through the Blue Mountains rests here.' },
};

export default function LandmarkScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [showStore, setShowStore] = useState(false);
  const [storeMessage, setStoreMessage] = useState('');
  const [cwmEvent, setCwmEvent] = useState(null);
  const [reconciliationEvent, setReconciliationEvent] = useState(null);
  const [reciprocityEvent, setReciprocityEvent] = useState(null);
  const [showNpcChat, setShowNpcChat] = useState(false);

  const landmarks = state.gradeBand === 'k2' ? landmarksK2.landmarks : landmarksData.landmarks;
  const landmark = landmarks[state.currentLandmarkIndex];
  const isLastLandmark = state.currentLandmarkIndex >= landmarks.length - 1;

  // Final landmark is handled in ARRIVE_LANDMARK reducer (sets status + phase).
  // This is a safety fallback in case LandmarkScreen renders for the final stop.
  useEffect(() => {
    if (isLastLandmark && state.phase !== 'GAME_OVER') {
      dispatch({ type: 'SET_STATUS', status: 'completed' });
      dispatch({ type: 'SET_PHASE', phase: 'GAME_OVER' });
    }
  }, [isLastLandmark, state.phase, dispatch]);

  // Check for CWM event at this landmark
  useEffect(() => {
    if (shouldFireCwm(state)) {
      const cwmEvents = eventsData.events.filter(e => e.is_cwm && e.grade_bands.includes(state.gradeBand));
      if (cwmEvents.length > 0) {
        const event = cwmEvents[Math.floor(Math.random() * cwmEvents.length)];
        setCwmEvent(event);
      }
    }
  }, []);

  // Check for reconciliation
  useEffect(() => {
    if (state.reconciliationPending && state.gradeBand !== 'k2') {
      const legsSinceSin = state.currentLandmarkIndex - state.reconciliationPending.legAtSin;
      if (legsSinceSin >= 1 && legsSinceSin <= 2 && Math.random() < GAME_CONSTANTS.RECONCILIATION_PROBABILITY) {
        setReconciliationEvent({
          type: state.reconciliationPending.sinEventType,
          title: 'A Second Chance',
          description: getReconciliationText(state.reconciliationPending.sinEventType)
        });
      }
    }
  }, []);

  // Check for reciprocity
  useEffect(() => {
    state.reciprocityPending.forEach(rp => {
      const legsSinceCwm = state.currentLandmarkIndex - rp.setAtLeg;
      if (legsSinceCwm >= 2 && Math.random() < GAME_CONSTANTS.RECIPROCITY_FIRE_PROBABILITY) {
        setReciprocityEvent({
          cwmType: rp.cwmType,
          ...getReciprocityReward(rp.cwmType)
        });
      }
    });
  }, []);

  function handleCwmChoice(helped) {
    const isDeceptive = Math.random() < GAME_CONSTANTS.CWM_DECEPTIVE_PROBABILITY;

    dispatch({
      type: 'CWM_EVENT_RESOLVED',
      eventType: cwmEvent.type,
      choice: helped ? 'helped' : 'declined',
      recipientGenuine: !isDeceptive
    });

    if (helped) {
      const effects = cwmEvent.choices?.find(c => c.id === 'help')?.effects || {};
      if (effects.food_lbs) dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: Math.max(0, state.foodLbs + effects.food_lbs) });
      if (effects.cash) dispatch({ type: 'UPDATE_SUPPLIES', cash: Math.max(0, state.cash + effects.cash) });
      dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.CWM_HELP, trigger: cwmEvent.type });
      dispatch({ type: 'UPDATE_MORALE', delta: 8 });
      dispatch({ type: 'ADD_RECIPROCITY_PENDING', cwmType: cwmEvent.type });
    } else {
      dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.CWM_DECLINE, trigger: `${cwmEvent.type}_declined` });
      dispatch({ type: 'UPDATE_MORALE', delta: -3 });
      if (state.gradeBand !== 'k2') {
        dispatch({
          type: 'SET_RECONCILIATION_PENDING',
          data: { sinEventType: cwmEvent.type, legAtSin: state.currentLandmarkIndex, attempts: 0 }
        });
      }
    }

    // Show moral label
    const labelKey = `cwm_${cwmEvent.type}_${helped ? 'helped' : 'declined'}`;
    const labels = moralLabelsData[labelKey];
    if (labels && labels[state.gradeBand]) {
      const mode = state.sessionSettings?.moral_label_mode || 'full';
      if (mode === 'full') {
        dispatch({ type: 'SHOW_LABEL', label: { id: labelKey, ...labels[state.gradeBand] } });
      }
    }

    dispatch({
      type: 'RESOLVE_EVENT',
      eventType: cwmEvent.type,
      outcome: helped ? 'helped' : 'declined',
      description: `${cwmEvent.title} — ${helped ? 'You helped.' : 'You passed by.'}`,
      moralLabelId: labelKey
    });

    setCwmEvent(null);
  }

  function handleReconciliation(taken) {
    if (taken) {
      dispatch({ type: 'UPDATE_GRACE', delta: GRACE_DELTAS.RECONCILIATION_TAKEN, trigger: 'reconciliation_taken' });
      dispatch({ type: 'UPDATE_MORALE', delta: 3 });

      const labels = moralLabelsData['reconciliation_taken'];
      if (labels && labels[state.gradeBand]) {
        dispatch({ type: 'SHOW_LABEL', label: { id: 'reconciliation_taken', ...labels[state.gradeBand] } });
      }
    } else {
      const labels = moralLabelsData['reconciliation_declined'];
      if (labels && labels[state.gradeBand]) {
        dispatch({ type: 'SHOW_LABEL', label: { id: 'reconciliation_declined', ...labels[state.gradeBand] } });
      }
    }
    dispatch({ type: 'CLEAR_RECONCILIATION' });
    setReconciliationEvent(null);
  }

  function handleReciprocity() {
    if (reciprocityEvent) {
      if (reciprocityEvent.food) dispatch({ type: 'UPDATE_SUPPLIES', foodLbs: state.foodLbs + reciprocityEvent.food });
      if (reciprocityEvent.cash) dispatch({ type: 'UPDATE_SUPPLIES', cash: state.cash + reciprocityEvent.cash });
      if (reciprocityEvent.spare_part) {
        const newParts = { ...state.spareParts };
        newParts[reciprocityEvent.spare_part] = (newParts[reciprocityEvent.spare_part] || 0) + 1;
        dispatch({ type: 'UPDATE_SUPPLIES', spareParts: newParts });
      }
      dispatch({ type: 'RECIPROCITY_FIRED', cwmType: reciprocityEvent.cwmType });
    }
    setReciprocityEvent(null);
  }

  function handleBuyItem(item, price) {
    if (state.cash < price) {
      setStoreMessage("You can't afford that.");
      return;
    }
    dispatch({ type: 'UPDATE_SUPPLIES', cash: state.cash - price, [item]: (state[item] || 0) + (item === 'foodLbs' ? 50 : 1) });
    setStoreMessage(`Purchased ${item === 'foodLbs' ? '50 lbs of food' : item}.`);
  }

  function handleContinue() {
    const nextIdx = state.currentLandmarkIndex + 1;
    if (nextIdx < landmarks.length) {
      dispatch({
        type: 'ADVANCE_DAY',
        distanceTraveled: 0
      });
      dispatch({ type: 'SET_PHASE', phase: 'TRAVELING' });
    }
  }

  if (isLastLandmark) return null;

  // Show CWM event first if one fired
  if (cwmEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-8">
        <div className="scene-card max-w-2xl w-full bg-white">
          <div className="p-6 bg-trail-blue">
            <h2 className="text-2xl font-bold text-white">{cwmEvent.title}</h2>
          </div>
          <div className="p-6">
            <p className="text-trail-darkBrown text-lg leading-relaxed mb-6">{cwmEvent.description}</p>
            <div className="space-y-3">
              {cwmEvent.choices?.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleCwmChoice(choice.id === 'help' || choice.id === 'helped')}
                  className="w-full text-left p-4 rounded-lg border-2 border-trail-tan hover:border-trail-blue hover:bg-trail-blue/5 transition-all"
                >
                  <div className="font-semibold text-trail-darkBrown">{choice.text}</div>
                  {choice.cost_text && <div className="text-sm text-trail-brown mt-1">{choice.cost_text}</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show reconciliation if pending
  if (reconciliationEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-8">
        <div className="scene-card max-w-2xl w-full bg-white">
          <div className="p-6 bg-trail-gold">
            <h2 className="text-2xl font-bold text-white">{reconciliationEvent.title}</h2>
          </div>
          <div className="p-6">
            <p className="text-trail-darkBrown text-lg leading-relaxed mb-6">{reconciliationEvent.description}</p>
            <div className="space-y-3">
              <button onClick={() => handleReconciliation(true)} className="btn-primary w-full py-3">
                Help them now
              </button>
              <button onClick={() => handleReconciliation(false)} className="btn-secondary w-full py-3">
                Continue on your way
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show reciprocity event
  if (reciprocityEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment flex items-center justify-center px-4 py-8">
        <div className="scene-card max-w-2xl w-full bg-white">
          <div className="p-6 bg-trail-green">
            <h2 className="text-2xl font-bold text-white">A Stranger Returns</h2>
          </div>
          <div className="p-6">
            <p className="text-trail-darkBrown text-lg leading-relaxed mb-6">{reciprocityEvent.description}</p>
            <button onClick={handleReciprocity} className="btn-primary w-full py-3">
              Accept their gift
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-trail-cream to-trail-parchment">
      {/* Landmark Scene */}
      <div className={`relative h-56 ${getLandmarkBg(landmark.type)} overflow-hidden flex items-end`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 p-6 text-white w-full">
          <h1 className="text-3xl font-bold">{landmark.name}</h1>
          <p className="text-white/80">{formatGameDate(state.gameDate)} — Day {state.trailDay}</p>
          {landmark.type === 'mission' && (
            <p className="text-white/70 text-sm mt-1 italic">A Catholic mission on the frontier</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="card">
          <p className="text-trail-darkBrown leading-relaxed">{landmark.description}</p>
        </div>

        {/* Resupply at forts/missions */}
        {landmark.can_resupply && !showStore && (
          <button onClick={() => setShowStore(true)} className="btn-secondary w-full">
            Visit the Trading Post
          </button>
        )}

        {showStore && landmark.prices && (
          <div className="card">
            <h3 className="text-xl font-bold text-trail-darkBrown mb-4">Trading Post</h3>
            <p className="text-sm text-trail-brown mb-3">Cash: ${state.cash.toFixed(2)}</p>
            {storeMessage && <p className="text-trail-blue text-sm mb-3">{storeMessage}</p>}
            <div className="grid grid-cols-2 gap-3">
              {landmark.prices.food_per_lb && (
                <button
                  onClick={() => {
                    if (state.cash >= landmark.prices.food_per_lb * 50) {
                      dispatch({ type: 'UPDATE_SUPPLIES', cash: state.cash - landmark.prices.food_per_lb * 50, foodLbs: state.foodLbs + 50 });
                      setStoreMessage('Bought 50 lbs of food.');
                    } else setStoreMessage("Can't afford that.");
                  }}
                  className="p-3 border border-trail-tan rounded-lg hover:bg-trail-parchment"
                >
                  <div className="font-semibold">Food (50 lbs)</div>
                  <div className="text-sm text-trail-brown">${(landmark.prices.food_per_lb * 50).toFixed(2)}</div>
                </button>
              )}
              {landmark.prices.clothing && (
                <button
                  onClick={() => {
                    if (state.cash >= landmark.prices.clothing) {
                      dispatch({ type: 'UPDATE_SUPPLIES', cash: state.cash - landmark.prices.clothing, clothingSets: state.clothingSets + 1 });
                      setStoreMessage('Bought 1 set of clothing.');
                    } else setStoreMessage("Can't afford that.");
                  }}
                  className="p-3 border border-trail-tan rounded-lg hover:bg-trail-parchment"
                >
                  <div className="font-semibold">Clothing (1 set)</div>
                  <div className="text-sm text-trail-brown">${landmark.prices.clothing.toFixed(2)}</div>
                </button>
              )}
              {landmark.prices.ammo && (
                <button
                  onClick={() => {
                    if (state.cash >= landmark.prices.ammo) {
                      dispatch({ type: 'UPDATE_SUPPLIES', cash: state.cash - landmark.prices.ammo, ammoBoxes: state.ammoBoxes + 1 });
                      setStoreMessage('Bought 1 box of ammo.');
                    } else setStoreMessage("Can't afford that.");
                  }}
                  className="p-3 border border-trail-tan rounded-lg hover:bg-trail-parchment"
                >
                  <div className="font-semibold">Ammunition (1 box)</div>
                  <div className="text-sm text-trail-brown">${landmark.prices.ammo.toFixed(2)}</div>
                </button>
              )}
              {landmark.prices.oxen && (
                <button
                  onClick={() => {
                    if (state.cash >= landmark.prices.oxen) {
                      dispatch({ type: 'UPDATE_SUPPLIES', cash: state.cash - landmark.prices.oxen, oxenYokes: state.oxenYokes + 1 });
                      setStoreMessage('Bought 1 yoke of oxen.');
                    } else setStoreMessage("Can't afford that.");
                  }}
                  className="p-3 border border-trail-tan rounded-lg hover:bg-trail-parchment"
                >
                  <div className="font-semibold">Oxen (1 yoke)</div>
                  <div className="text-sm text-trail-brown">${landmark.prices.oxen.toFixed(2)}</div>
                </button>
              )}
            </div>
            <button onClick={() => setShowStore(false)} className="text-trail-blue underline text-sm mt-3">
              Close trading post
            </button>
          </div>
        )}

        {/* NPC Encounter (if available at this landmark, 6-8 only) */}
        {state.gradeBand === '6_8' && landmark && NPC_LOCATIONS[landmark.id] && !showNpcChat && (
          <div className="card-parchment">
            <h3 className="font-semibold text-trail-darkBrown mb-1">{NPC_LOCATIONS[landmark.id].name}</h3>
            <p className="text-trail-brown text-sm mb-3">{NPC_LOCATIONS[landmark.id].description}</p>
            <button
              onClick={() => setShowNpcChat(true)}
              className="btn-secondary"
            >
              Speak with {NPC_LOCATIONS[landmark.id].name.split(' ')[0]}
            </button>
          </div>
        )}

        {showNpcChat && landmark && NPC_LOCATIONS[landmark.id] && (
          <NpcChatInline
            character={NPC_LOCATIONS[landmark.id].key}
            characterName={NPC_LOCATIONS[landmark.id].name}
            onClose={() => setShowNpcChat(false)}
            sessionCode={state.sessionCode}
            studentId={state.studentId}
            gameContext={{
              student_name: state.studentName,
              current_landmark: landmark.name,
              game_date: state.gameDate,
            }}
          />
        )}

        {/* Party Status */}
        <div className="card">
          <h3 className="font-semibold text-trail-darkBrown mb-2">Party Status</h3>
          <div className="space-y-1">
            {state.partyMembers.map(m => (
              <div key={m.name} className="flex justify-between text-sm">
                <span className={!m.alive ? 'line-through text-gray-400' : ''}>
                  {m.name} {m.isChaplain ? '(Chaplain)' : ''}
                </span>
                <span className={`health-${m.health}`}>{m.alive ? m.health : 'deceased'}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-trail-brown">
            <div>Food: {Math.round(state.foodLbs)} lbs</div>
            <div>Cash: ${state.cash.toFixed(2)}</div>
            <div>Morale: {state.morale}%</div>
          </div>
        </div>

        <button onClick={handleContinue} className="btn-primary w-full py-3 text-lg">
          Continue West
        </button>
      </div>
    </div>
  );
}

/**
 * Preloaded NPC dialogue with game-relevant tips and useful information.
 * Each NPC has suggested questions and hardcoded responses that help
 * the player learn about the trail and get gameplay tips.
 */
const NPC_DIALOGUE = {
  scout_pawnee: {
    greeting: "I am Takoda. My people, the Pawnee, have hunted these plains since before your grandfathers were born. I will tell you what I know of the land ahead.",
    suggestedQuestions: [
      { q: "What dangers lie ahead on the trail?", a: "The Platte River country is flat, but do not be fooled. Cholera lives in the stagnant water — drink only from moving streams. Beyond Fort Laramie, the hills begin. Keep your oxen rested before then, or they will fail you in the mountains." },
      { q: "Where can I find good hunting?", a: "The buffalo herds are thick between here and Chimney Rock. Hunt what you need, but take only what your wagon can carry. Waste angers the spirits of the land. A good hunter takes one or two — a foolish one kills many and leaves them to rot." },
      { q: "How should I manage my supplies?", a: "You will need at least 200 pounds of food to reach the next fort. Ration your food carefully — meager rations keep you moving. Save your money for Fort Laramie, where prices are fair. Further west, everything costs twice as much." },
      { q: "What is the weather like ahead?", a: "Summer storms come fast on the plains — they bring lightning and floods that wash away camps. By autumn, watch the mountain passes. If you are not past South Pass before the first snow, you may not pass at all. The mountains do not forgive the slow." },
      { q: "Tell me about your people, the Pawnee.", a: "The Pawnee are people of the earth and sky. We plant corn and squash in the river valleys, and hunt the buffalo on the open plains. We have lived here for many generations. Some of our young men scout for the wagon trains — the work is honest and we learn what the white settlers intend." }
    ]
  },
  scout_shoshone: {
    greeting: "I am Washakie. The Shoshone know these mountains as a mother knows her children. You are wise to ask before you travel further.",
    suggestedQuestions: [
      { q: "What is the best route through the mountains?", a: "South Pass is the only way for wagons. The pass is wide and gentle — many travelers are surprised when they cross the Continental Divide. But do not linger. After the pass, the Green River is dangerous. The current is strong and the water is cold. Pay the ferry if one is offered." },
      { q: "My party is getting sick. What should I do?", a: "Rest is the best medicine on the trail. When sickness comes, stop for a day. Clean water and rest will save more lives than pushing on ever will. If someone is critical, slow your pace. A grueling pace with sick people is a death sentence." },
      { q: "How do I keep my oxen healthy?", a: "Grass and water — that is all they ask. A steady pace preserves your oxen. Grueling pace breaks them down. If you lose your oxen, your journey ends. They are more valuable than gold out here." },
      { q: "What dangers are in this area?", a: "Rattlesnakes in the rocks. Sudden storms that bring flash floods through the canyons. And the river crossings — the Green River has taken many wagons. If your wagon is heavy with supplies, lighten it before the crossing or risk losing everything." },
      { q: "Tell me about the Shoshone people.", a: "We are the people of the high valleys and mountain streams. We follow the salmon, the elk, and the roots that grow in the meadows. Chief Washakie — my namesake — has kept peace with the travelers, for we see that cooperation serves everyone better than conflict." }
    ]
  },
  scout_bannock: {
    greeting: "I am Taghee. The Snake River country is my home. You look tired — the hardest part of your journey may still be ahead.",
    suggestedQuestions: [
      { q: "Tell me about the Snake River crossing.", a: "The Snake River is treacherous — deep, fast, cold. Many have drowned trying to ford it. Look for the wide, shallow places where the river spreads out. If you must cross deep water, unload your wagon and float it. Better to lose a day than lose your family." },
      { q: "How much further to Oregon?", a: "From Fort Hall, you have perhaps 800 miles yet. The worst terrain is still ahead — the Snake River canyon, then the Blue Mountains. Many wagons break apart in the Blue Mountains. Check your spare parts now. If you need wheels or axles, buy them here." },
      { q: "Is there good hunting ahead?", a: "Game is scarce along the Snake River — the canyon walls make hunting difficult. Stock up on food here at the fort. The salmon run in the river, but you need to know where to find them. Beyond the mountains, the game is plentiful again." },
      { q: "What should I be worried about?", a: "Your food supply and your timing. If you are reading this past October, you must hurry. Snow comes early to the Blue Mountains and it does not leave until spring. Also watch your morale — a discouraged party makes mistakes. Rest on Sundays if you can afford the time." },
      { q: "Tell me about the Bannock people.", a: "We are kin to the Shoshone, but the river and the salmon are our life. We fish these waters, hunt the high meadows, and trade with the Nez Perce to the west. The fort trades with us, and sometimes we guide the wagons through the difficult passes." }
    ]
  },
  scout_nez_perce: {
    greeting: "I am called Yellow Wolf by the traders. The Nez Perce have guided many travelers through the Blue Mountains. I can tell you what awaits.",
    suggestedQuestions: [
      { q: "How do we get through the Blue Mountains?", a: "The Blue Mountains are the last great barrier before the Columbia River. The forest is dense and the trails are steep. You will need to lower your wagons down some slopes with ropes. If you have spare parts, now is the time to use them — broken wheels on a mountain pass can end your journey." },
      { q: "What happens at The Dalles?", a: "At The Dalles, the trail meets the Columbia River. You must choose: ride the river rapids on a raft — dangerous but fast — or take the Barlow Road over Mount Hood. The Barlow Road is safer but costs time and toll money. Either way, the Willamette Valley is close." },
      { q: "How is my party holding up — any advice?", a: "If your people are sick, rest them now. The Blue Mountains will take everything your party has left. Filling rations and steady pace — that is how you survive the last stretch. Rushing through the mountains with hungry, exhausted people is how wagons are lost." },
      { q: "Are we going to make it?", a: "That depends on your supplies and your people. If you have food, healthy oxen, and your party can still walk, yes — the Valley is only a few weeks away. But I have seen many wagons turn back from the Blue Mountains. Do not give up. The hardest part of the journey is the last part." },
      { q: "Tell me about the Nez Perce.", a: "The Nez Perce — Nimíipuu, we call ourselves — have lived in this land since the beginning. We breed the finest horses on the continent, the Appaloosa. We fish for salmon in the rivers and hunt elk in the mountains. We helped Lewis and Clark when they came through, and we help the wagon trains now." }
    ]
  },
  desmet: {
    greeting: "Ah, welcome, my child. I am Father De Smet. Rest here a moment — God's creation is beautiful in this valley, non? Tell me, how goes your journey?",
    suggestedQuestions: [
      { q: "We've lost people on the trail. How do we go on?", a: "Loss is the heaviest burden of the trail, heavier than any wagon load. But you honor the departed by continuing — by carrying their memory to Oregon. Pray for them, grieve for them, but do not let grief stop your feet. They would want you to reach the Valley." },
      { q: "What are the Works of Mercy?", a: "The Corporal Works of Mercy are the hands of Christ in the world: feed the hungry, give drink to the thirsty, clothe the naked, shelter the homeless, visit the sick, visit the imprisoned, and bury the dead. On this trail, you will have many chances to practice each one. Every act of mercy strengthens the soul." },
      { q: "Tell me about the Native peoples here.", a: "I have lived among the Flathead people — the Bitterroot Salish — for many years. They are a noble and generous people who asked for missionaries to come teach them about the Catholic faith. I have also traveled among the Sioux, the Blackfeet, and the Crow. Each nation has its own wisdom and its own ways of knowing God." },
      { q: "Should I help strangers on the trail even when it costs me?", a: "That is perhaps the most important question you will face. When you share food with the hungry, you feed Christ himself. When you help a stranger, you may never see the reward — or you may find that the stranger returns your kindness tenfold when you need it most. Trust in Providence, my child." }
    ]
  },
  whitman: {
    greeting: "I'm Dr. Whitman. You look like you've been on the trail a while. How is your party? I can offer medical advice if any of your people are ailing.",
    suggestedQuestions: [
      { q: "Someone in my party is very sick. What should I do?", a: "Rest is the most important medicine we have. Stop the wagon, boil your drinking water, and keep the sick person warm and hydrated. Cholera and dysentery are the biggest killers on this trail, and both come from bad water. A grueling pace with a critically ill person almost guarantees you will lose them." },
      { q: "How do I prevent illness on the trail?", a: "Three rules: drink only clean, flowing water — never from pools or puddles. Keep your rations filling, not bare bones — starving people get sick faster. And do not push a grueling pace when your party is already weakened. Rest days save lives. Sunday rest is not just for the soul." },
      { q: "What medical supplies should I carry?", a: "Sadly, there is little true medicine available on the frontier. Rest, clean water, and adequate food are your best remedies. If you can trade for medicine at the forts, do so. But the truth is, prevention matters more than cure out here." },
      { q: "What is it like in Oregon?", a: "The Willamette Valley is everything the guidebooks promise — rich soil, mild winters, clean water, and timber for building. I came west to help people reach it, and I believe every hardship on this trail is worth the life that awaits you there. Keep going." }
    ]
  },
  bordeaux: {
    greeting: "Bordeaux's the name. I've been trading at this fort for twenty years. You need supplies, advice, or both? I deal fair — ask what you will.",
    suggestedQuestions: [
      { q: "What supplies do I need for the mountains ahead?", a: "Spare parts — wheels, axles, tongues. The mountain trails will break your wagon if it's not in good repair. Food, at least 300 pounds if you can manage it. And keep your oxen count up. Losing an ox team in the mountains means abandoning your wagon." },
      { q: "Are the prices fair further west?", a: "Ha! Fair? Everything costs double at Fort Bridger, triple at Fort Hall. If you have cash, spend it here where prices are reasonable. West of here, a wheel that costs $15 today will cost $20 or more. Buy what you need now." },
      { q: "What's the trail like beyond Fort Laramie?", a: "Rougher. The flat prairie is behind you. From here it's hills, then mountains, then rivers that want to kill you. Independence Rock by July Fourth — that's the rule. If you're behind schedule, push your pace now while the terrain allows it. Once you hit the mountains, grueling pace will cost you oxen." },
      { q: "Tell me about the fur trade.", a: "The beaver trade is mostly played out — too many trappers took too many pelts. Now I trade with the emigrants and the Lakota. My wife is Lakota, and her people are good trading partners. Fair dealing is everything out here — cheat someone on the frontier and word travels fast." }
    ]
  }
};

function NpcChatInline({ character, characterName, onClose, sessionCode, studentId, gameContext }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState(new Set());
  const dispatch = useGameDispatch();

  const dialogue = NPC_DIALOGUE[character];

  // Show greeting on mount
  useEffect(() => {
    if (dialogue?.greeting) {
      setMessages([{ role: 'npc', text: dialogue.greeting }]);
    }
  }, [character]);

  function handleSuggestedQuestion(sq) {
    if (isComplete || usedQuestions.has(sq.q)) return;

    setMessages(prev => [
      ...prev,
      { role: 'user', text: sq.q },
      { role: 'npc', text: sq.a }
    ]);
    setUsedQuestions(prev => new Set([...prev, sq.q]));

    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    if (newCount >= 3) {
      setIsComplete(true);
    }

    dispatch({
      type: 'ADD_NPC_TRANSCRIPT',
      transcript: { character: characterName, location: gameContext.current_landmark, question: sq.q, response: sq.a }
    });
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading || isComplete) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.npcChat(
        sessionCode, studentId, character, userMsg, exchangeCount, gameContext
      );
      setMessages(prev => [...prev, { role: 'npc', text: res.response }]);
      setExchangeCount(res.exchangeCount);
      setIsComplete(res.isComplete);

      dispatch({
        type: 'ADD_NPC_TRANSCRIPT',
        transcript: { character: characterName, location: gameContext.current_landmark, question: userMsg, response: res.response }
      });
    } catch {
      // Fallback to a generic helpful response
      const fallback = "I cannot speak to that right now, but let me say this — keep your supplies up, rest when your party is sick, and do not push a grueling pace through the mountains. That advice has saved many a wagon train.";
      setMessages(prev => [...prev, { role: 'npc', text: fallback }]);
      const newCount = exchangeCount + 1;
      setExchangeCount(newCount);
      if (newCount >= 3) setIsComplete(true);
    } finally {
      setLoading(false);
    }
  }

  const availableQuestions = dialogue?.suggestedQuestions?.filter(sq => !usedQuestions.has(sq.q)) || [];

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-trail-darkBrown">{characterName}</h3>
        <button onClick={onClose} className="text-trail-brown text-sm hover:text-trail-red">Close</button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
        {messages.map((msg, i) => (
          <div key={i} className={`text-sm p-2 rounded ${msg.role === 'user' ? 'bg-trail-blue/10 text-trail-darkBlue' : 'bg-trail-parchment text-trail-darkBrown italic'}`}>
            <strong>{msg.role === 'user' ? 'You' : characterName.split(' ')[0]}:</strong> {msg.text}
          </div>
        ))}
        {loading && <p className="text-trail-brown text-sm italic">Thinking...</p>}
      </div>

      {!isComplete ? (
        <div className="space-y-2">
          {/* Suggested questions */}
          {availableQuestions.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-trail-brown uppercase tracking-wider">Ask about:</p>
              {availableQuestions.map((sq, i) => (
                <button key={i} onClick={() => handleSuggestedQuestion(sq)}
                  className="w-full text-left text-sm p-2 rounded border border-trail-tan/50 hover:bg-trail-blue/5 hover:border-trail-blue transition-all text-trail-darkBrown">
                  {sq.q}
                </button>
              ))}
            </div>
          )}

          {/* Free-form input */}
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Or type your own question..."
              className="input-field flex-1 text-sm"
              maxLength={200}
            />
            <button type="submit" disabled={loading} className="btn-primary text-sm px-3">
              {loading ? '...' : 'Ask'}
            </button>
          </form>
          <p className="text-[10px] text-trail-brown/60 text-center">{3 - exchangeCount} question(s) remaining</p>
        </div>
      ) : (
        <p className="text-trail-brown text-sm italic">{characterName.split(' ')[0]} nods farewell. "Safe travels, friend. May the trail treat you well."</p>
      )}
    </div>
  );
}

function getLandmarkBg(type) {
  switch (type) {
    case 'fort': return 'bg-gradient-to-b from-amber-800 to-amber-600';
    case 'mission': return 'bg-gradient-to-b from-amber-700 to-yellow-600';
    case 'natural': return 'bg-gradient-to-b from-green-800 to-green-600';
    case 'town': return 'bg-gradient-to-b from-amber-900 to-amber-700';
    case 'destination': return 'bg-gradient-to-b from-green-700 to-emerald-500';
    default: return 'bg-gradient-to-b from-trail-brown to-trail-tan';
  }
}

function shouldFireCwm(state) {
  if (state.cwmFired >= GAME_CONSTANTS.CWM_MAX_PER_GAME) return false;
  // Don't fire in crisis
  const alive = state.partyMembers.filter(m => m.alive);
  if (state.foodLbs <= 0 || alive.filter(m => m.health === 'critical').length >= 2) return false;
  // Guarantee at least 1 past Fort Laramie (index ~3)
  if (state.cwmFired === 0 && state.currentLandmarkIndex >= 3) return true;
  // Random chance at landmarks
  return Math.random() < 0.35;
}

function getReconciliationText(sinEventType) {
  const texts = {
    feed_hungry: "You see the same family you passed before. They look weaker now, but they're still traveling. You have enough food to share a little.",
    give_drink: "The travelers you refused water are here at the river crossing, still parched. You could share some water now.",
    visit_sick: "The sick stranger you left by the trail has been carried to this place by others. They're still ill. You could stop to help.",
    shelter_homeless: "The abandoned child you passed has been taken in by another family, but they're struggling. You could lighten their burden.",
    bury_dead: "The unburied body you passed is still there at the side of the trail. You could take the time now.",
    fair_trade: "You see the family you took advantage of earlier. They seem to recognize you. You could offer them a fair deal this time.",
    forgive_thief: "The person who stole from you has come back, ashamed. They want to make it right."
  };
  return texts[sinEventType] || "Someone you passed before is here again. You have another chance to help.";
}

function getReciprocityReward(cwmType) {
  const rewards = {
    feed_hungry: { description: "The family you helped earlier is at a fort ahead. They've left you 30 lbs of dried meat as thanks.", food: 30 },
    give_drink: { description: "The travelers you shared water with found a fresh spring and left you extra water containers.", food: 20 },
    visit_sick: { description: "The stranger you helped has recovered and flags you down — they have a spare wagon wheel your size.", spare_part: 'wheels' },
    shelter_homeless: { description: "The child you took in knows a shortcut through the mountain pass. Your journey ahead is safer.", food: 0 },
    bury_dead: { description: "A passing traveler witnessed your kindness. They offer to scout ahead for you, finding safer terrain.", food: 15 },
    fair_trade: { description: "The family you traded fairly with tells others. A trader gives you a discount — you save $20.", cash: 20 },
    forgive_thief: { description: "The person you forgave has returned with $20 and a day's worth of supplies as restitution.", cash: 20, food: 10 }
  };
  return rewards[cwmType] || { description: "A stranger you helped before has left supplies for you.", food: 15 };
}
