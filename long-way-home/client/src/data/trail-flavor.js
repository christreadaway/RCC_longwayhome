/**
 * Trail Flavor Text System
 *
 * Hundreds of ambient narrative messages that bring the journey to life.
 * Organized by category and terrain, with state-aware selection.
 *
 * Categories:
 *   terrain     — landscape descriptions specific to terrain type
 *   weather     — sky, temperature, wind, precipitation
 *   wildlife    — animals observed along the trail
 *   campLife    — evening activities, morning routines
 *   humanity    — singing, reading, instruments, conversations, boredom
 *   children    — kids playing, learning, asking questions
 *   faith       — prayer, reflection, small moments of devotion
 *   hardship    — dust, fatigue, monotony, aching bodies
 *   wagonTrain  — encounters with other travelers, wagon maintenance
 *   milestone   — distance markers, time reflections
 *   nightSky    — stars, moon, evening observations
 *   food        — cooking, meals, hunting talk
 *   water       — finding water, creek crossings, thirst
 *   history     — passing landmarks, old campsites, trail markers
 */

// ─────────────────────────────────────────────
//  TERRAIN-SPECIFIC
// ─────────────────────────────────────────────

export const TERRAIN_MESSAGES = {
  plains: [
    'The prairie grass stretches to the horizon in every direction.',
    'A gentle wind ripples through the tall grass as your wagon rolls west.',
    'The flat expanse of the Great Plains unfolds before you.',
    'Dust rises behind your wagon wheels. The trail stretches ahead.',
    'Prairie dogs watch your wagon from their burrows as you pass.',
    'The trail cuts a thin brown line through endless green-gold grass.',
    'Wildflowers bloom along the trail edges — purple, yellow, white.',
    'A sea of grass sways in the wind like ocean waves.',
    'The horizon is so flat you can see wagons miles ahead of you.',
    'Buffalo grass crunches under the wagon wheels.',
    'Grasshoppers leap out of the way of the plodding oxen.',
    'The sky feels impossibly wide out here on the open plains.',
    'You pass the bones of an old buffalo, sun-bleached and half-buried in grass.',
    'A lone cottonwood tree marks a dried-up creek bed.',
    'Wagon ruts from last year\'s trains are still visible in the hard-packed earth.',
    'The scent of sage and dry grass fills the air.',
    'Heat shimmers rise from the trail, making distant shapes dance and waver.',
    'A dust devil spins across the prairie a quarter mile to the south.',
    'You cross a shallow creek, barely enough water for the oxen to drink.',
    'The sun beats down on the open prairie. There is no shade for miles.',
  ],
  hills: [
    'The rolling hills slow the oxen, but the views are breathtaking.',
    'Your wagon crests another hill. The trail dips and rises ahead.',
    'Rocky outcroppings dot the hillside. The terrain is getting rougher.',
    'Scattered trees provide welcome shade as you climb the gentle slopes.',
    'The landscape changes as foothills give way to steeper ground.',
    'You can see the trail winding through the hills like a ribbon.',
    'The oxen strain against the uphill grade. The wheels creak in protest.',
    'A hawk circles overhead, riding the updrafts along the ridge.',
    'Loose shale clatters down the hillside as the wagon passes.',
    'Juniper and scrub cedar dot the rocky slopes.',
    'The air feels cooler up here in the hills.',
    'You look back and see the plains you crossed — an impossibly vast flatness.',
    'The trail narrows between two sandstone bluffs.',
    'A spring bubbles up from the rocks — clear, cold water.',
    'The children gather colorful stones from a dry creek bed.',
    'Antelope bound away across the hillside at your approach.',
    'The wagon tips at a dangerous angle crossing a steep gully.',
    'Red clay soil stains the wagon wheels and the oxen\'s hooves.',
    'The wind is stronger up here, whipping dust into your eyes.',
    'You find names carved into a sandstone cliff — earlier emigrants.',
  ],
  mountains: [
    'Towering peaks rise ahead, their summits lost in clouds.',
    'The mountain pass is narrow. Your wagon barely fits between the rocks.',
    'Pine trees line the steep trail. The air is thin and cold.',
    'Snow gleams on distant peaks. The mountain crossing tests your resolve.',
    'Eagles circle above the ridgeline as your wagon climbs higher.',
    'The temperature drops sharply as you gain altitude.',
    'Fallen timber blocks the trail. The men clear it with axes.',
    'A mountain stream runs cold and clear beside the trail.',
    'The oxen are breathing hard. The altitude is taking its toll.',
    'You can see your breath in the thin mountain air this morning.',
    'Spruce and fir trees tower overhead, blocking out the sun.',
    'A rockslide has narrowed the trail to a single wagon\'s width.',
    'The sound of the wind through the pines is the only noise for miles.',
    'Snow patches cling to the north-facing slopes even now.',
    'The wagon groans on the steep downgrade. You lock the rear wheels.',
    'A deer watches from the treeline, unafraid of the slow-moving wagon.',
    'The mountain meadow is carpeted with wildflowers.',
    'You can see for a hundred miles from this ridge — the whole trail laid out behind you.',
    'Ice has formed in the water buckets overnight.',
    'The trail switchbacks up the mountainside in painful, slow curves.',
  ],
  river: [
    'The sound of rushing water grows louder as you approach the crossing.',
    'The river churns with spring runoff. The crossing will be dangerous.',
    'Cottonwood trees line the riverbanks, their leaves whispering in the breeze.',
    'Other wagons are camped at the crossing, waiting for the water to drop.',
    'The river glitters in the sunlight. It looks peaceful, but the current runs deep.',
    'Willows and alders crowd the riverbank.',
    'The children splash in the shallows while the adults study the crossing.',
    'Fish jump in the deeper pools — trout, by the look of them.',
    'The riverbank is muddy and churned up by dozens of wagons before you.',
    'Mosquitoes swarm in thick clouds near the water.',
    'A family upstream is washing clothes in the river, spreading them on rocks to dry.',
    'The ford is marked with stakes driven into the riverbed by earlier trains.',
    'Sand and gravel shift underfoot near the water\'s edge.',
    'Frogs chorus from the reeds as evening approaches.',
    'A beaver dam upstream has created a calm, deep pool.',
    'The water is brown and silty — snowmelt from the mountains.',
    'Driftwood and debris mark the high-water line several feet above the current level.',
    'The oxen drink deeply at the river before you urge them on.',
    'Tracks in the mud show that elk came to drink here this morning.',
    'The ferry operator charges three dollars per wagon — steep, but the river is too high to ford.',
  ],
};

// ─────────────────────────────────────────────
//  WEATHER (any terrain)
// ─────────────────────────────────────────────

export const WEATHER_MESSAGES = [
  'The sun rises in a blaze of orange and gold. It will be a clear day.',
  'Gray clouds gather on the western horizon. Rain may be coming.',
  'A light rain falls, turning the trail to mud but cooling the air.',
  'The wind picks up, flapping the canvas wagon cover noisily.',
  'It\'s a perfect day for travel — cool, clear, with a gentle breeze.',
  'The heat is oppressive today. Everyone moves slowly.',
  'Thunder rumbles in the distance, but the storm passes to the north.',
  'A rainbow arcs across the sky after a brief shower.',
  'Frost coats the grass this morning. Winter is not far off.',
  'Morning fog clings to the low ground, burning off by mid-morning.',
  'The wind shifts to the north, bringing a chill that wasn\'t there yesterday.',
  'A cloudless sky stretches overhead — beautiful, but it means no shade.',
  'Lightning flickers on the horizon as night falls.',
  'The air smells of rain, though none has fallen yet.',
  'An unseasonably warm day makes the traveling easier.',
  'Hail the size of peas clatters off the wagon cover.',
  'Thin clouds streak the sky like brushstrokes.',
  'The sunset paints the western sky in shades of crimson and amber.',
  'A strong crosswind pushes the wagon to the side. The driver fights to hold course.',
  'Dew soaks everything this morning — blankets, boots, the canvas cover.',
];

// ─────────────────────────────────────────────
//  WILDLIFE
// ─────────────────────────────────────────────

export const WILDLIFE_MESSAGES = [
  'A jackrabbit freezes, then bolts across the trail in front of the oxen.',
  'Coyotes howled throughout the night. The sound is lonely and beautiful.',
  'A meadowlark sings from a fence post that someone drove into the prairie.',
  'A rattlesnake coiled beside the trail sends everyone scrambling.',
  'Prairie dogs pop in and out of their burrows, chittering at the wagon.',
  'A red-tailed hawk drops from the sky and snatches something from the grass.',
  'Antelope race alongside the wagon for a while before veering off.',
  'Crickets fill the evening air with their song.',
  'An owl hoots from somewhere in the darkness as the campfire dies.',
  'You spot a herd of buffalo in the distance — dark shapes against the grass.',
  'A roadrunner darts across the trail, startling the lead oxen.',
  'Wild turkeys scatter into the brush at your approach.',
  'A golden eagle soars overhead, its wingspan enormous.',
  'Fireflies blink in the tall grass as dusk falls.',
  'A gopher snake slithers lazily across the sun-warmed trail.',
  'Magpies chatter and squabble in the cottonwood trees.',
  'You hear wolves howling at dusk. The sound carries for miles.',
  'A family of quail hustles their chicks across the trail.',
  'Horse flies torment the oxen all afternoon.',
  'A curious ground squirrel sits up on its hind legs and watches the wagon pass.',
];

// ─────────────────────────────────────────────
//  CAMP LIFE — evening and morning routines
// ─────────────────────────────────────────────

export const CAMP_LIFE_MESSAGES = [
  'The evening campfire crackles and pops. Sparks drift up into the darkening sky.',
  'Someone in the next wagon is frying salt pork. The smell drifts over.',
  'The women mend clothing by firelight while the men check the wagon wheels.',
  'The oxen are unhitched and grazing contentedly on the prairie grass.',
  'Coffee boils over the fire. The rich smell is one of the few comforts out here.',
  'Breakfast is cold biscuits and dried meat. Nobody complains — there\'s nothing else.',
  'The wagon is repacked and loaded before dawn. Every mile counts.',
  'Someone greases the wagon axles. The squeaking had been driving everyone mad.',
  'The camp is broken quickly this morning. Everyone knows the routine by now.',
  'Water barrels are refilled at a creek. You strain it through cloth to remove the silt.',
  'The bedrolls are laid out under the wagon. Stars fill the sky overhead.',
  'Someone banks the fire carefully. The coals will be needed for the morning coffee.',
  'Laundry is hung on ropes between the wagons. It dries quickly in the prairie wind.',
  'The animals are watered and fed before anyone eats.',
  'Candles are too precious to burn, so the camp settles in as soon as the sun goes down.',
  'Someone patches a hole in the wagon cover with a scrap of canvas.',
  'The evening meal is a thin stew of dried beans and whatever wild onions could be found.',
  'Boots are set by the fire to dry overnight.',
  'A bucket of water is heated for washing. It\'s the first warm wash in days.',
  'The night watch is set. Two hours each, no exceptions.',
];

// ─────────────────────────────────────────────
//  HUMANITY — songs, books, instruments, conversations, boredom
// ─────────────────────────────────────────────

export const HUMANITY_MESSAGES = [
  'Someone starts singing "Oh! Susanna" and half the wagon train joins in.',
  'A man plays his fiddle by the campfire. The tune is lively but the eyes are tired.',
  'One of the women reads aloud from Pilgrim\'s Progress while the others sew.',
  'The children beg for a story. Someone tells the tale of Daniel Boone.',
  'A harmonica plays softly — "Amazing Grace" — as the sun sets.',
  'Two men argue over the best route forward. The map is spread on a barrel.',
  'A woman writes in her journal by candlelight, recording the day\'s events.',
  'Someone brought a copy of the Bible and reads a Psalm aloud at supper.',
  'The older children practice their letters in the dirt with sticks.',
  'A girl braids wildflowers into her hair. Her mother tells her not to dawdle.',
  'Someone whistles "Home, Sweet Home." Nobody joins in. The song hits too close.',
  'A grandfather tells the children about the War of 1812. They listen, wide-eyed.',
  'Two families share their evening meal together. The conversation is warm.',
  'A boy whittles a toy horse from a stick. He\'s getting quite good at it.',
  'Someone reads from a copy of James Fenimore Cooper\'s "The Deerslayer."',
  'A woman sings a lullaby in German. Her voice carries across the quiet camp.',
  'A man teaches his son to tie proper knots — bowline, clove hitch, square knot.',
  'Letters home are written carefully. They\'ll be posted at the next fort.',
  'A couple dances a waltz by the firelight. Others clap and cheer.',
  'Someone recites poetry — Longfellow. "Life is real! Life is earnest!"',
  'A mother teaches her daughter to make biscuits with the last of the flour.',
  'Two boys race each other to a distant rock and back. The adults shake their heads.',
  'An old man plays checkers against himself, the board balanced on a crate.',
  'Someone has a deck of cards. A game of whist breaks out after supper.',
  'A woman reads aloud from a letter she received before leaving home. She cries quietly.',
  'A man carves the date and his family name into a rock. His children help.',
  'The teenagers walk ahead of the wagon, restless and eager to stretch their legs.',
  'Someone tells a joke. The laughter feels strange out here — precious and rare.',
  'A man plays "Yankee Doodle" on a tin whistle. The children march in circles.',
  'Someone brought a small accordion. Polka music fills the evening air.',
  'An argument breaks out over the last piece of bacon. It\'s settled by splitting it.',
  'A boy reads Robinson Crusoe by the fire, completely lost in the adventure.',
  'Someone hums a hymn — "Abide With Me" — as the wagon creaks along.',
  'A woman sketches the landscape in a small notebook. She\'s quite talented.',
  'Boredom settles over the wagon like a heavy blanket. Nobody speaks for an hour.',
  'A man whittles a whistle for his daughter. She blows it incessantly.',
  'Someone tells ghost stories after dark. The children pretend not to be scared.',
  'A grandmother teaches the girls to knit. Progress is slow but earnest.',
  'A debate about slavery divides the campfire. Tempers cool by morning.',
  'A young couple walks together in the twilight, away from the wagons.',
];

// ─────────────────────────────────────────────
//  CHILDREN (only if party has members)
// ─────────────────────────────────────────────

export const CHILDREN_MESSAGES = [
  'The children run alongside the wagon, burning off restless energy.',
  'A child asks, "Are we there yet?" for the hundredth time today.',
  'Two siblings squabble in the back of the wagon. Peace is restored with a biscuit.',
  'A child collects colorful stones along the trail, filling their pockets.',
  'The youngest falls asleep in the wagon, lulled by the rocking motion.',
  'A boy catches a frog at the creek and names it General. It escapes by noon.',
  'The children play tag around the circled wagons at the evening camp.',
  'A girl makes a doll from a corn husk and a scrap of cloth.',
  'A child asks where the sun goes at night. Nobody has a good answer.',
  'The children are put to work gathering buffalo chips for the fire. They complain loudly.',
  'A boy claims to have seen a bear. Nobody believes him, but everyone looks around nervously.',
  'The children count wagons in the train. They keep losing count and starting over.',
  'A girl asks if there are schools in Oregon. Her mother promises there will be.',
  'A child draws pictures in the dust with a stick — a house, a tree, a dog.',
  'The little ones are hungry between meals. Dried apple rings quiet them for a while.',
];

// ─────────────────────────────────────────────
//  FAITH (mild, natural, non-preachy)
// ─────────────────────────────────────────────

export const FAITH_MESSAGES = [
  'Someone says a quiet grace before the evening meal. Others bow their heads.',
  'A hymn book is passed around. The singing is imperfect but heartfelt.',
  'The sunset is so beautiful that someone whispers, "The Lord\'s handiwork."',
  'A woman prays the rosary as she walks beside the wagon.',
  'Someone reads from Psalms: "The Lord is my shepherd; I shall not want."',
  'A cross is placed at a grave beside the trail. The party pauses in silence.',
  'Evening prayers are said together. The words are familiar and comforting.',
  'A man reads from his prayer book as the oxen plod forward.',
  'Someone finds a small wildflower growing from a rock. "Even here," she says, "God provides."',
  'The Sabbath rest is discussed. Some want to travel; others insist on honoring the day.',
  'A child asks about heaven. The answer is gentle and full of hope.',
  'Morning prayers are brief. The trail waits for no one.',
  'Someone carves a small cross into a walking stick.',
  'A woman sings "Be Thou My Vision" softly to herself as she walks.',
  'Grace is said over a meager meal. Gratitude doesn\'t require abundance.',
];

// ─────────────────────────────────────────────
//  HARDSHIP — dust, fatigue, monotony, aching
// ─────────────────────────────────────────────

export const HARDSHIP_MESSAGES = [
  'Everyone\'s feet ache. Walking fifteen miles a day wears a body down.',
  'The monotony of the trail is crushing. Every mile looks the same as the last.',
  'Dust coats everything — food, clothes, skin, lungs. You can taste it.',
  'Someone\'s boots have worn through. They wrap their feet in cloth and keep walking.',
  'Sleep is fitful on the hard ground. The rocks seem to find every sore spot.',
  'Tempers are short today. The trail tests even the strongest friendships.',
  'The wagon jolts through a deep rut, rattling everyone\'s teeth.',
  'Blisters on blistered hands. The oxen yoke is unforgiving.',
  'A wheel rim is loose. It rattles and bangs with every turn.',
  'The sun is relentless. There is no escape from it on the open trail.',
  'Someone mentions how far home is. Nobody wants to think about it.',
  'The dried meat is almost too tough to chew. But it\'s all there is.',
  'Your back aches from sitting on the hard wagon seat all day.',
  'Flies swarm the food before it\'s even served.',
  'The trail dust has given everyone a persistent cough.',
  'Homesickness settles in at night, when the work is done and the mind wanders.',
  'A broken spoke means stopping to repair. Every delay costs time.',
  'The water barrel is running low. Everyone rations carefully.',
  'Clothes are stiff with sweat and trail dust. There\'s no time to wash properly.',
  'Nobody can remember what day of the week it is anymore.',
];

// ─────────────────────────────────────────────
//  WAGON TRAIN — other travelers, wagon issues
// ─────────────────────────────────────────────

export const WAGON_TRAIN_MESSAGES = [
  'A faster wagon train overtakes you, raising a cloud of dust.',
  'You pass an abandoned wagon by the trail. Its contents are scattered.',
  'A family heading east passes you. They warn of rough terrain ahead.',
  'You share a campsite with another wagon train tonight. News is exchanged.',
  'Someone finds a letter pinned to a stake by the trail — a message for a family behind you.',
  'Wagon tracks in the mud show that many have passed this way before.',
  'A pile of discarded furniture sits by the trail — a heavy dresser, a rocking chair.',
  'A grave marker by the trail reads only a name and a date. No other details.',
  'You meet a mountain man heading east. He trades news for tobacco.',
  'Another family\'s ox has gone lame. They ask if you can spare any medicine.',
  'Wheel ruts from hundreds of wagons have worn the trail a foot deep.',
  'A sign scratched into a rock reads: "Good water 3 miles ahead."',
  'Someone has left a cairn of stones marking a fork in the trail.',
  'You find a child\'s shoe by the trail. It\'s small and well-worn.',
  'A broken axle from another wagon lies in the grass, stripped of useful hardware.',
  'Travelers ahead have left the remains of a campfire still smoldering.',
  'A man offers to trade a barrel of flour for ammunition. The deal is fair.',
  'You see smoke from a campfire ahead. Friend or foe? The answer turns out to be friend.',
  'A family shares their fresh-baked bread with you. It\'s the best thing you\'ve tasted in weeks.',
  'Graffiti on a cliff face: dozens of names and dates. You add your own.',
];

// ─────────────────────────────────────────────
//  NIGHT SKY
// ─────────────────────────────────────────────

export const NIGHT_SKY_MESSAGES = [
  'The stars are impossibly bright tonight. The Milky Way stretches overhead.',
  'A shooting star streaks across the sky. Someone makes a wish.',
  'The moon is full tonight, casting silver light across the prairie.',
  'The Big Dipper points north. You check your heading by starlight.',
  'A thin crescent moon hangs in the western sky at dusk.',
  'The constellation Orion is visible on the southern horizon.',
  'A cloudless night means a cold one. Extra blankets are pulled from the wagon.',
  'Coyote calls echo under a canopy of stars.',
  'Firelight and starlight — the only illumination for a hundred miles.',
  'Someone points out the North Star to the children and explains navigation.',
];

// ─────────────────────────────────────────────
//  FOOD & COOKING
// ─────────────────────────────────────────────

export const FOOD_MESSAGES = [
  'Supper tonight is cornmeal mush with a little dried fruit. Simple, but filling.',
  'The sourdough starter survived another day. Fresh bread tomorrow.',
  'Someone finds wild berries growing near the trail. A welcome treat.',
  'Dinner is beans again. Nobody says a word.',
  'The dried buffalo meat is tough, but it keeps you moving.',
  'Coffee is rationed to half a cup each. It barely takes the edge off.',
  'Wild onions are dug from the meadow and added to the evening stew.',
  'Hardtack and jerky. The trail diet is nothing if not consistent.',
  'A successful fishing in the creek yields four trout. They fry up beautifully.',
  'Someone discovers weevils in the flour. They\'re picked out, and the bread is baked anyway.',
  'Fresh antelope meat roasts over the fire. The smell is heavenly.',
  'The sugar is gone. Tea and coffee will be bitter from here on.',
  'Dandelion greens are gathered and boiled. They\'re bitter but nutritious.',
  'Apple butter, brought from home, is nearly gone. The last jar is opened sparingly.',
  'The cook makes do with what\'s available. Creativity is the best seasoning on the trail.',
];

// ─────────────────────────────────────────────
//  WATER
// ─────────────────────────────────────────────

export const WATER_MESSAGES = [
  'The water barrel is topped off at a clear spring. Cold, clean water — a blessing.',
  'Alkali water at this creek. The oxen refuse to drink it.',
  'Rain barrels catch a few gallons overnight. Every drop counts.',
  'The water tastes of minerals and mud, but it\'s drinkable.',
  'A cold mountain stream runs beside the trail. Everyone fills their canteens.',
  'Water is rationed today. The next known creek is twenty miles ahead.',
  'The children are told not to drink from the stagnant pool. They obey grudgingly.',
  'Fresh snowmelt from the mountains makes the sweetest water on the whole trail.',
];

// ─────────────────────────────────────────────
//  SEASONAL / TIME-BASED
// ─────────────────────────────────────────────

export const SPRING_MESSAGES = [
  'Spring flowers carpet the prairie in patches of color.',
  'The rivers are high with snowmelt. Crossings will be treacherous.',
  'Mud season slows the wagons to a crawl.',
  'Green shoots push up through last year\'s dead grass.',
  'Birdsong fills the morning air — robins, meadowlarks, sparrows.',
];

export const SUMMER_MESSAGES = [
  'The July heat is brutal. Everyone drinks twice as much water.',
  'Summer thunderstorms build every afternoon, towering and electric.',
  'The days are long — the sun doesn\'t set until after eight.',
  'Mosquitoes are thick in the lowlands. Everyone suffers.',
  'The grass is turning brown under the relentless summer sun.',
];

export const FALL_MESSAGES = [
  'The aspen trees are turning gold. Autumn is beautiful but urgent.',
  'A hard frost coats everything in white crystals this morning.',
  'Geese fly south in great V formations. Winter approaches.',
  'The days are growing shorter. Every hour of daylight is precious.',
  'The air has a crispness that wasn\'t there a week ago.',
  'Leaves crunch underfoot. The season is changing fast.',
  'The first snow flurries of the season swirl in the wind.',
  'A bitter wind blows down from the mountains. Winter is close.',
];

// ─────────────────────────────────────────────
//  MILESTONE / REFLECTION
// ─────────────────────────────────────────────

export const MILESTONE_MESSAGES = [
  'You\'ve been on the trail for a month now. Home feels very far away.',
  'Another hundred miles behind you. The journey is measured in footsteps.',
  'Halfway there — or so the guidebook claims.',
  'You think about what you left behind. Then you think about what lies ahead.',
  'The trail has changed everyone. You\'re harder now, leaner, quieter.',
  'Someone marks the distance on the wagon sideboards. The tallies are growing.',
  'Letters written home describe things you could never have imagined before.',
  'Each landmark passed is a small victory. Each day survived is a gift.',
  'You wonder what Oregon really looks like. The descriptions in the guidebook seem too good.',
  'You calculate the remaining miles. The number is both hopeful and daunting.',
];

// ─────────────────────────────────────────────
//  MESSAGE PICKER
// ─────────────────────────────────────────────

/**
 * Get a contextual flavor message based on game state.
 * Picks from weighted categories to ensure variety.
 *
 * @param {string} terrainType - 'plains', 'hills', 'mountains', 'river'
 * @param {Object} state - game state for context
 * @param {number} trailDay - current trail day
 * @returns {string}
 */
export function getFlavorMessage(terrainType, state, trailDay) {
  // Build a weighted pool of candidate messages
  const pool = [];

  // Terrain messages — always relevant, moderate weight
  const terrainMsgs = TERRAIN_MESSAGES[terrainType] || TERRAIN_MESSAGES.plains;
  pool.push(...terrainMsgs.map(m => ({ msg: m, weight: 2 })));

  // Weather — common
  pool.push(...WEATHER_MESSAGES.map(m => ({ msg: m, weight: 2 })));

  // Wildlife — lighter weight
  pool.push(...WILDLIFE_MESSAGES.map(m => ({ msg: m, weight: 1 })));

  // Camp life — moderate, more at evening (even days simulate evening scenes)
  pool.push(...CAMP_LIFE_MESSAGES.map(m => ({ msg: m, weight: trailDay % 3 === 0 ? 3 : 1 })));

  // Humanity — the core "life on the trail" feel — heavier weight
  pool.push(...HUMANITY_MESSAGES.map(m => ({ msg: m, weight: 3 })));

  // Children
  pool.push(...CHILDREN_MESSAGES.map(m => ({ msg: m, weight: 1 })));

  // Faith — lighter, occasional
  pool.push(...FAITH_MESSAGES.map(m => ({ msg: m, weight: 1 })));

  // Hardship — heavier if health is declining or food is low
  const hardshipWeight = (state?.foodLbs < 100 || state?.morale < 50) ? 3 : 1;
  pool.push(...HARDSHIP_MESSAGES.map(m => ({ msg: m, weight: hardshipWeight })));

  // Wagon train encounters
  pool.push(...WAGON_TRAIN_MESSAGES.map(m => ({ msg: m, weight: 1 })));

  // Night sky — every few days
  if (trailDay % 4 === 0) {
    pool.push(...NIGHT_SKY_MESSAGES.map(m => ({ msg: m, weight: 3 })));
  }

  // Food
  pool.push(...FOOD_MESSAGES.map(m => ({ msg: m, weight: 1 })));

  // Water — heavier in dry terrain
  const waterWeight = terrainType === 'plains' ? 2 : 1;
  pool.push(...WATER_MESSAGES.map(m => ({ msg: m, weight: waterWeight })));

  // Seasonal messages based on game date
  if (state?.gameDate) {
    const month = parseInt(state.gameDate.split('-')[1], 10);
    if (month >= 4 && month <= 5) {
      pool.push(...SPRING_MESSAGES.map(m => ({ msg: m, weight: 2 })));
    } else if (month >= 6 && month <= 8) {
      pool.push(...SUMMER_MESSAGES.map(m => ({ msg: m, weight: 2 })));
    } else if (month >= 9) {
      pool.push(...FALL_MESSAGES.map(m => ({ msg: m, weight: 3 })));
    }
  }

  // Milestone reflections — every 10-15 days
  if (trailDay % 12 === 0) {
    pool.push(...MILESTONE_MESSAGES.map(m => ({ msg: m, weight: 4 })));
  }

  // Weighted random selection
  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.msg;
  }

  return pool[0].msg;
}
