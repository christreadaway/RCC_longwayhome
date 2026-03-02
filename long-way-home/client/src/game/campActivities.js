/**
 * Camp Activities System
 *
 * Manages all "manage the trip" activities the player can perform during
 * the 1848 Oregon Trail journey. Each activity costs time (portion of a day)
 * but provides benefits to health, morale, supplies, or spiritual welfare.
 *
 * All activities, dialogue, and descriptions are historically appropriate to
 * the 1848 emigrant experience. References drawn from primary source diaries
 * of Narcissa Whitman, Jesse Applegate, and other Oregon Trail emigrants.
 *
 * Activities:
 * - Talk with family (understand morale, hear concerns)
 * - Tend the oxen (prevent lameness, check yokes, find good grass)
 * - Cook a proper meal (health + morale, costs extra food + firewood time)
 * - Take stock of provisions (awareness, reduce spoilage)
 * - Wash up at the creek (health + morale, period-appropriate hygiene)
 * - Pray together / family devotions (grace + morale)
 * - Attend Mass (at missions with a priest — grace + morale + health)
 * - Go to Confession (sacrament of Reconciliation at missions)
 * - Let the children play (morale, games of the era)
 * - Mend the wagon (grease axles, tighten felloes, check tongue)
 * - Offer aid to fellow emigrants (grace + possible reciprocity)
 *
 * @module campActivities
 */

import { GRACE_DELTAS } from '@shared/types';

// ---------------------------------------------------------------------------
// Activity Definitions
// ---------------------------------------------------------------------------

export const CAMP_ACTIVITIES = {
  talk_family: {
    id: 'talk_family',
    name: 'Talk with the Family',
    description: 'Sit by the fire and hear what weighs on their hearts. Listen to worries, share encouragement, make plans together.',
    icon: 'users',
    timeCost: 0.25,
    requirements: {},
    grade_bands: ['k2', '3_5', '6_8'],
    effects: {
      morale: { base: 5, maxBonus: 10 },
    },
    cooldown_days: 0,
  },

  tend_oxen: {
    id: 'tend_oxen',
    name: 'Tend the Oxen',
    description: 'Check the yokes for chafing, inspect hooves for stones, and lead them to good grass and water. Well-tended oxen pull stronger and last longer.',
    icon: 'heart-pulse',
    timeCost: 0.25,
    requirements: { minOxen: 1 },
    grade_bands: ['3_5', '6_8'],
    effects: {
      oxen_health: true,
      travel_bonus: 0.05,
    },
    cooldown_days: 1,
  },

  cook_meal: {
    id: 'cook_meal',
    name: 'Cook a Proper Meal',
    description: 'Gather buffalo chips or wood for a real cook fire. Make johnnycakes, boil beans, and brew coffee. A hot meal does wonders after days of cold hardtack.',
    icon: 'cooking-pot',
    timeCost: 0.5,
    requirements: { minFood: 5 },
    grade_bands: ['3_5', '6_8'],
    effects: {
      morale: { base: 8 },
      health_recovery: true,
      food_cost: 3,
    },
    cooldown_days: 2,
  },

  check_provisions: {
    id: 'check_provisions',
    name: 'Take Stock of Provisions',
    description: 'Open every barrel and sack. Check the flour for weevils, the bacon for mold. Know exactly what you have and plan your rations.',
    icon: 'clipboard-list',
    timeCost: 0.1,
    requirements: {},
    grade_bands: ['3_5', '6_8'],
    effects: {
      awareness: true,
      spoilage_prevention: 0.5,
    },
    cooldown_days: 3,
  },

  wash_up: {
    id: 'wash_up',
    name: 'Wash Up at the Creek',
    description: 'Wash clothing on rocks, scrub the children, clean and re-bandage wounds. Cleanliness prevents the spread of camp fever and dysentery.',
    icon: 'droplets',
    timeCost: 0.5,
    requirements: {},
    grade_bands: ['3_5', '6_8'],
    effects: {
      health_recovery: true,
      morale: { base: 5 },
      illness_prevention: 0.15,
    },
    cooldown_days: 3,
  },

  pray: {
    id: 'pray',
    name: 'Family Devotions',
    description: 'Gather the family for prayer. Read Scripture by firelight, recite the Rosary, and commend your journey to God\'s providence.',
    icon: 'hands-praying',
    timeCost: 0.1,
    requirements: {},
    grade_bands: ['k2', '3_5', '6_8'],
    effects: {
      grace: GRACE_DELTAS.PRAYER,
      morale: { base: 4 },
    },
    cooldown_days: 1,
  },

  attend_mass: {
    id: 'attend_mass',
    name: 'Attend Holy Mass',
    description: 'A priest at the mission offers Mass. Your family receives Communion, hears the Gospel, and finds peace in the familiar ritual of the Church.',
    icon: 'church',
    timeCost: 0.5,
    requirements: { at_mission: true },
    grade_bands: ['3_5', '6_8'],
    effects: {
      grace: 8,
      morale: { base: 12 },
      health_recovery: true,
    },
    cooldown_days: 7,
  },

  confession: {
    id: 'confession',
    name: 'Sacrament of Confession',
    description: 'A priest hears your confession. You kneel and confess the sins of the trail — the selfishness, the fear, the failures of charity. "Te absolvo," he says. You are made new.',
    icon: 'cross',
    timeCost: 0.25,
    requirements: { at_mission: true, chaplain_or_mission: true },
    grade_bands: ['6_8'],
    effects: {
      grace: 12,
      morale: { base: 8 },
      reconciliation_clear: true,
    },
    cooldown_days: 7,
  },

  children_play: {
    id: 'children_play',
    name: 'Let the Children Play',
    description: 'The little ones chase hoops, play mumblety-peg, or splash in a creek. The older children and adults stretch weary limbs, tell stories, and sing familiar hymns.',
    icon: 'person-running',
    timeCost: 0.5,
    requirements: {},
    grade_bands: ['k2', '3_5', '6_8'],
    effects: {
      morale: { base: 10, childBonus: 5 },
    },
    cooldown_days: 2,
  },

  mend_wagon: {
    id: 'mend_wagon',
    name: 'Mend the Wagon',
    description: 'Grease the axles with tallow, tighten the iron tire on the felloe, check the tongue and reach. A stitch in time saves nine on the trail.',
    icon: 'wrench',
    timeCost: 0.5,
    requirements: {},
    grade_bands: ['3_5', '6_8'],
    effects: {
      breakdown_prevention: 0.5,
    },
    cooldown_days: 3,
  },

  help_emigrants: {
    id: 'help_emigrants',
    name: 'Offer Aid to Fellow Emigrants',
    description: 'Another family on the trail needs help — a stuck wagon, a sick child, a broken wheel. Christian charity calls you to lend a hand.',
    icon: 'handshake',
    timeCost: 0.5,
    requirements: {},
    grade_bands: ['3_5', '6_8'],
    effects: {
      grace: 5,
      morale: { base: 6 },
      reciprocity_chance: 0.3,
    },
    cooldown_days: 2,
  },
};

// ---------------------------------------------------------------------------
// Family Dialogue — 1848 Contextual
// ---------------------------------------------------------------------------

/**
 * Pre-loaded family dialogue lines grounded in the 1848 emigrant experience.
 * Language and concerns reflect what actual Oregon Trail families faced.
 */
export const FAMILY_DIALOGUE = {
  morale_high: [
    { speaker: 'wife', text: "The Lord has been good to us on this journey. I wrote to Mother about the beautiful country we've seen.", mood: 'grateful' },
    { speaker: 'wife', text: "The children are singing 'Amazing Grace' as they walk. It does my heart good to hear it.", mood: 'happy' },
    { speaker: 'husband', text: "I spoke with a man from the wagon ahead. He says the grass is fine near the next water. Good news for the oxen.", mood: 'hopeful' },
    { speaker: 'child', text: "Pa, I found an arrowhead by the creek! Can I keep it?", mood: 'excited' },
    { speaker: 'wife', text: "I never imagined land so vast. The sky goes on forever. Oregon will be worth every mile.", mood: 'awed' },
    { speaker: 'elder', text: "We should give thanks tonight. Many a family hasn't been so fortunate on this trail.", mood: 'reflective' },
  ],
  morale_moderate: [
    { speaker: 'wife', text: "How many more weeks? The children keep asking and I never know what to tell them.", mood: 'weary' },
    { speaker: 'wife', text: "I miss my kitchen. My garden. Sleeping in a proper bed. This wagon is no place to live.", mood: 'wistful' },
    { speaker: 'husband', text: "The oxen are wearing thin. We're asking a great deal of them.", mood: 'concerned' },
    { speaker: 'child', text: "Ma, my shoes have holes. The rocks hurt my feet.", mood: 'complaining' },
    { speaker: 'wife', text: "I saw Mrs. Henderson weeping by her wagon this morning. She lost her youngest last week. Lord have mercy.", mood: 'somber' },
    { speaker: 'elder', text: "We ought to read Scripture together more often. It steadies the nerves something fierce.", mood: 'thoughtful' },
  ],
  morale_low: [
    { speaker: 'wife', text: "I lie awake at night listening for wolves. I can't stop thinking about what happens if the food runs out.", mood: 'frightened' },
    { speaker: 'wife', text: "This was folly. We had a home. We had neighbors. Now we have dust and hardship and nothing certain ahead.", mood: 'despairing' },
    { speaker: 'husband', text: "Nobody speaks anymore during the march. Just silence and the creak of the wagon. Something's broken in our company.", mood: 'gloomy' },
    { speaker: 'child', text: "I don't want to go to Oregon! I want to go home! I hate this trail!", mood: 'crying' },
    { speaker: 'wife', text: "The bacon has gone rancid and the flour has weevils. What are we feeding these children?", mood: 'frustrated' },
    { speaker: 'elder', text: "We need rest, proper rest. Driving on like this will kill someone sure as cholera.", mood: 'stern' },
  ],
  morale_critical: [
    { speaker: 'wife', text: "I cannot go on. I just... the strength has left me entirely.", mood: 'broken' },
    { speaker: 'husband', text: "If we don't find help or rest soon, I fear the worst. We are at the end of ourselves.", mood: 'desperate' },
    { speaker: 'wife', text: "The little ones stare at me with hollow eyes. They haven't smiled in a fortnight. God forgive me for bringing them here.", mood: 'guilty' },
    { speaker: 'elder', text: "Hear me now — we stop, we rest, we pray, or we perish. There is no other way.", mood: 'resolute' },
  ],

  // Condition-specific
  hungry: [
    { speaker: 'wife', text: "The children are always hungry. A spoonful of flour soup isn't enough for growing bodies.", mood: 'worried' },
    { speaker: 'child', text: "My tummy hurts. When can we have real food again?", mood: 'hungry' },
    { speaker: 'husband', text: "We must find game or reach a fort soon. We can't stretch these provisions much further.", mood: 'urgent' },
  ],
  sick_member: [
    { speaker: 'wife', text: "{name} is burning with fever. We need to stop — rest is the only medicine we have left.", mood: 'worried' },
    { speaker: 'wife', text: "I've been up all night with {name}, trying to cool the fever with wet cloths. The trail can wait.", mood: 'exhausted' },
    { speaker: 'child', text: "Is {name} going to get better? Please say they'll get better.", mood: 'scared' },
  ],
  bad_weather: [
    { speaker: 'wife', text: "Everything is soaked through. The bedding, the clothes, the flour sacks. This rain will be the ruin of us.", mood: 'miserable' },
    { speaker: 'husband', text: "I can barely see the trail in this weather. One wrong step and the wagon goes into a gulch.", mood: 'tense' },
    { speaker: 'child', text: "I'm so cold, Ma. My fingers won't stop shaking.", mood: 'cold' },
  ],
  death_occurred: [
    { speaker: 'wife', text: "I keep looking for {name}, expecting to see them by the fire. Then I remember, and it's like losing them all over again.", mood: 'grieving' },
    { speaker: 'elder', text: "We should say a proper prayer for {name}'s soul tonight. They deserve that dignity at least.", mood: 'solemn' },
    { speaker: 'child', text: "Where did {name} go? Why did we leave them behind?", mood: 'confused' },
  ],
  good_weather: [
    { speaker: 'wife', text: "What a fine day the Lord has given us. Days like this remind me why we chose this path.", mood: 'cheerful' },
    { speaker: 'child', text: "Look at the sky, Pa! The clouds look like the sheep back home!", mood: 'playful' },
  ],
  near_landmark: [
    { speaker: 'wife', text: "We're near the next stop, thank the Lord. I'd give anything for a day of rest under a real roof.", mood: 'hopeful' },
    { speaker: 'husband', text: "I hear the fort has supplies. We should see what we can afford.", mood: 'planning' },
  ],
  lingering: [
    { speaker: 'husband', text: "I've heard tell of ruffians and road agents in these parts. We oughtn't linger here too long.", mood: 'nervous' },
    { speaker: 'wife', text: "Other wagons have been passing us for days. We're falling behind — winter waits for no one.", mood: 'anxious' },
    { speaker: 'elder', text: "The mountain passes close early. We must press on or risk being snowed in like the Donner Party.", mood: 'warning' },
  ],
};

/**
 * Contextual suggestions that family members offer, grounded in 1848 solutions.
 */
export const FAMILY_SUGGESTIONS = {
  low_morale: [
    "Perhaps we should stop early today and let the little ones run about. Their laughter would do us all good.",
    "If I could make proper johnnycakes and boil some coffee, I believe it would lift our spirits considerably.",
    "Let us pray the Rosary together tonight. Our Lady has seen many a pilgrim through dark times.",
    "This grueling pace is wearing everyone to the bone. Could we not travel at a steadier gait?",
    "If we could stop at the creek and wash up, I believe it would help. Cleanliness restores the soul as much as the body.",
  ],
  low_food: [
    "Game must be about somewhere. Perhaps the hunters should go out tomorrow.",
    "We'd best switch to meager rations. Better to eat less now than nothing at all later.",
    "The next fort surely has provisions. We just need to hold on until then.",
  ],
  sick_party: [
    "We cannot push {name} further in this condition. Rest is what's needed, even if it costs us a day.",
    "Have we any medicine left? Quinine, laudanum, anything?",
    "Clean water and boiled cloths — that's what the doctor in Independence told me. We must keep the camp clean.",
    "Let us pray for {name}'s healing. The Lord is the physician when earthly remedies fail.",
  ],
  bad_weather: [
    "Should we make camp and wait for this to pass? Traveling in such weather invites disaster.",
    "The wagon cover is leaking again. We need to re-pitch it before the flour gets soaked through.",
    "The oxen can barely keep their footing in this muck. We ought to slow down considerably.",
  ],
  lingering_too_long: [
    "I've heard from other emigrants that men of ill character haunt these parts. We should not tarry.",
    "The calendar doesn't lie — every day we sit here is a day closer to snow in the mountains.",
    "We must get moving. Three days in one place draws attention from the wrong sort of people.",
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns available camp activities filtered by grade band, requirements, and cooldowns.
 *
 * @param {Object} gameState - Current game state from context
 * @param {Object} featureFlags - From getFeatureFlags()
 * @returns {Array<Object>} Available activities
 */
export function getAvailableActivities(gameState, featureFlags) {
  const activities = [];

  for (const [key, activity] of Object.entries(CAMP_ACTIVITIES)) {
    if (!activity.grade_bands.includes(gameState.gradeBand)) continue;

    const reqs = activity.requirements;
    if (reqs.minOxen && (gameState.oxenYokes || 0) < reqs.minOxen) continue;
    if (reqs.minFood && (gameState.foodLbs || 0) < reqs.minFood) continue;

    if (reqs.at_mission) {
      const currentLandmark = gameState.currentLandmarkData;
      if (!currentLandmark || currentLandmark.type !== 'mission') continue;
    }

    if (reqs.chaplain_or_mission) {
      const atMission = gameState.currentLandmarkData?.type === 'mission';
      if (!atMission && !gameState.chaplainInParty) continue;
    }

    const lastUsed = (gameState.activityCooldowns || {})[key] || 0;
    const daysSinceLast = (gameState.trailDay || 1) - lastUsed;
    const onCooldown = daysSinceLast < activity.cooldown_days;

    activities.push({
      ...activity,
      available: !onCooldown,
      cooldownRemaining: onCooldown ? activity.cooldown_days - daysSinceLast : 0,
    });
  }

  return activities;
}

/**
 * Executes a camp activity and returns the state changes.
 *
 * @param {string} activityId - Activity key
 * @param {Object} gameState - Current game state
 * @returns {{ effects: Object, message: string, timeCost: number }}
 */
export function executeActivity(activityId, gameState) {
  const activity = CAMP_ACTIVITIES[activityId];
  if (!activity) {
    return { effects: {}, message: 'Unknown activity.', timeCost: 0 };
  }

  const effects = {};
  let message = '';

  switch (activityId) {
    case 'talk_family': {
      const dialogue = selectFamilyDialogue(gameState);
      const suggestion = selectFamilySuggestion(gameState);
      const moraleBoost = activity.effects.morale.base + (gameState.morale < 30 ? activity.effects.morale.maxBonus : 3);
      effects.morale = moraleBoost;
      const speakerLabel = dialogue.speaker === 'child' ? 'One of the children says'
        : dialogue.speaker === 'elder' ? 'An elder in the party says'
        : dialogue.speaker === 'wife' ? 'Your wife says'
        : 'Your husband says';
      message = `${speakerLabel}: "${dialogue.text}"`;
      if (suggestion) {
        message += `\n\n"${suggestion}"`;
      }
      break;
    }

    case 'tend_oxen': {
      effects.oxenChecked = true;
      effects.travelBonus = activity.effects.travel_bonus;
      message = 'You check the yokes for chafing, pick stones from their hooves, and lead them to a patch of good grass by the water. The beasts seem grateful for the attention and will pull stronger tomorrow.';
      break;
    }

    case 'cook_meal': {
      effects.morale = activity.effects.morale.base;
      effects.foodCost = activity.effects.food_cost;
      effects.healthRecovery = true;
      message = 'You gather buffalo chips for a proper fire and cook up johnnycakes with bacon grease, boil a pot of beans, and brew strong coffee. The smell alone lifts the camp\'s spirits. For a moment, it almost feels like home.';
      break;
    }

    case 'check_provisions': {
      effects.suppliesChecked = true;
      effects.spoilagePrevention = activity.effects.spoilage_prevention;
      const alive = (gameState.partyMembers || []).filter(m => m.alive).length || 1;
      const foodDays = Math.floor((gameState.foodLbs || 0) / (alive * 2));
      message = `You open every barrel and sack, checking for spoilage. At current rations, you reckon ${foodDays} days of food remain. ` +
        `Cash on hand: $${(gameState.cash || 0).toFixed(2)}. Oxen: ${gameState.oxenYokes || 0} yoke. ` +
        `Ammunition: ${gameState.ammoBoxes || 0} boxes. Spare parts: ${gameState.spareParts?.wheels || 0} wheels, ${gameState.spareParts?.axles || 0} axles, ${gameState.spareParts?.tongues || 0} tongues.`;
      break;
    }

    case 'wash_up': {
      effects.morale = activity.effects.morale.base;
      effects.healthRecovery = true;
      effects.illnessPrevention = activity.effects.illness_prevention;
      message = 'The family hauls water from the creek, scrubs clothing on flat rocks, and washes dirt and grime from weary bodies. Wounds are cleaned and re-bandaged with fresh cloth. It\'s simple, but the difference it makes to body and mind is remarkable.';
      break;
    }

    case 'pray': {
      effects.grace = activity.effects.grace;
      effects.morale = activity.effects.morale.base;
      message = gameState.chaplainInParty
        ? 'Fr. Joseph leads the family in evening devotions. He reads from the Psalms, and together you pray the Rosary as the stars come out over the prairie. His steady voice brings comfort to troubled hearts.'
        : 'The family gathers by the firelight. You read a passage of Scripture, then pray together — for safe passage, for the sick, for those you left behind. In the vast silence of the wilderness, it feels as though God is very near.';
      break;
    }

    case 'attend_mass': {
      effects.grace = activity.effects.grace;
      effects.morale = activity.effects.morale.base;
      effects.healthRecovery = true;
      message = 'The mission bell rings for Mass. Your family enters the simple chapel and kneels on the packed-earth floor. The Latin words, the incense, the Host — for a precious hour, the trail and its hardships fade away. You leave with lighter hearts and renewed purpose.';
      break;
    }

    case 'confession': {
      effects.grace = activity.effects.grace;
      effects.morale = activity.effects.morale.base;
      effects.reconciliationClear = true;
      message = 'You kneel behind the rough curtain and confess. The sins of the trail weigh heavy — the times you turned away from those in need, the harsh words, the moments of despair. "Ego te absolvo," the priest whispers. The weight lifts. Grace flows back like water in a dry creek bed.';
      break;
    }

    case 'children_play': {
      const hasChildren = (gameState.partyMembers || []).some(m => m.alive && !m.isLeader);
      effects.morale = activity.effects.morale.base + (hasChildren ? (activity.effects.morale.childBonus || 0) : 0);
      message = hasChildren
        ? 'The children chase hoops with sticks, play mumblety-peg, and splash in a shallow creek while the adults sit in the grass telling stories. Someone starts a hymn and others join in. For an afternoon, the trail seems less cruel.'
        : 'You take a few hours to rest properly — stretching weary muscles, walking without the weight of the journey pressing on your mind. Sometimes a body needs more than food and sleep; it needs a moment of peace.';
      break;
    }

    case 'mend_wagon': {
      effects.breakdownPrevention = activity.effects.breakdown_prevention;
      message = 'You pack the wheel hubs with tallow, check the iron tires for looseness, tighten the felloes with wooden wedges, and inspect the tongue and reach for cracks. An ounce of prevention is worth a pound of cure — especially when the nearest wheelwright is a thousand miles behind you.';
      break;
    }

    case 'help_emigrants': {
      effects.grace = activity.effects.grace;
      effects.morale = activity.effects.morale.base;
      effects.reciprocityChance = activity.effects.reciprocity_chance;
      message = 'A family from another wagon needs help — their wheel is sunk in a rut and the husband can\'t free it alone. You lend your back to the effort. When the wagon rolls free, the woman thanks you with tears in her eyes. "The Lord will remember your kindness," she says.';
      break;
    }

    default:
      message = 'Activity completed.';
  }

  return {
    effects,
    message,
    timeCost: activity.timeCost,
  };
}

/**
 * Selects contextual family dialogue based on game state.
 *
 * @param {Object} gameState
 * @returns {{ speaker: string, text: string, mood: string }}
 */
export function selectFamilyDialogue(gameState) {
  const pool = [];

  // Morale-based
  if (gameState.morale >= 70) pool.push(...FAMILY_DIALOGUE.morale_high);
  else if (gameState.morale >= 40) pool.push(...FAMILY_DIALOGUE.morale_moderate);
  else if (gameState.morale >= 20) pool.push(...FAMILY_DIALOGUE.morale_low);
  else pool.push(...FAMILY_DIALOGUE.morale_critical);

  // Condition-specific
  if ((gameState.foodLbs || 0) < 30) pool.push(...FAMILY_DIALOGUE.hungry);

  const sickMember = (gameState.partyMembers || []).find(m => m.alive && (m.health === 'poor' || m.health === 'critical'));
  if (sickMember) {
    pool.push(...FAMILY_DIALOGUE.sick_member.map(d => ({
      ...d, text: d.text.replace('{name}', sickMember.name),
    })));
  }

  const deadMember = (gameState.partyMembers || []).find(m => !m.alive);
  if (deadMember) {
    pool.push(...FAMILY_DIALOGUE.death_occurred.map(d => ({
      ...d, text: d.text.replace('{name}', deadMember.name),
    })));
  }

  if ((gameState.daysStationary || 0) >= 2) pool.push(...FAMILY_DIALOGUE.lingering);

  if (pool.length === 0) pool.push(...FAMILY_DIALOGUE.morale_moderate);

  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * @private
 */
function selectFamilySuggestion(gameState) {
  const suggestions = [];

  if (gameState.morale < 40) suggestions.push(...FAMILY_SUGGESTIONS.low_morale);
  if ((gameState.foodLbs || 0) < 50) suggestions.push(...FAMILY_SUGGESTIONS.low_food);

  const hasSick = (gameState.partyMembers || []).some(m => m.alive && (m.health === 'poor' || m.health === 'critical'));
  if (hasSick) {
    suggestions.push(...FAMILY_SUGGESTIONS.sick_party.map(s =>
      s.replace('{name}', (gameState.partyMembers.find(m => m.alive && (m.health === 'poor' || m.health === 'critical'))?.name || 'them'))
    ));
  }

  if ((gameState.daysStationary || 0) >= 2) suggestions.push(...FAMILY_SUGGESTIONS.lingering_too_long);

  if (suggestions.length === 0) return null;
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}
