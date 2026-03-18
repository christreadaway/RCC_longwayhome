# The Long Way Home — Product Requirements Document
*Rebuilt Oregon Trail for AI Ethics Classroom Use — Catholic Edition*
*Version 2.0 — Consolidated | For Claude Code Build*
*Consolidates original requirements, UI design specification, and enhancement features into a single document.*
*Consolidates original requirements, UI design specification, and enhancement features into a single document.*

---

## 1. What This Is

**The Long Way Home** is a browser-based educational game rebuilt from the Oregon Trail (early 1990s MECC version) gameplay loop, featuring upgraded visuals, a real-time teacher monitoring dashboard, and deeply integrated Catholic moral and religious education content. The game is designed in three grade-band variants — K–2, 3–5, and 6–8 — each with age-appropriate mechanics, Catholic curriculum alignment, and explicit moral labeling calibrated to the student's developmental stage.

The teacher selects the grade band at session creation. All three bands share the same engine and teacher dashboard; they differ in complexity, vocabulary, Catholic content depth, and UI treatment.

> **⚠️ Naming note:** Do NOT use the name "Oregon Trail" — the brand is owned by Houghton Mifflin Harcourt. All IP here is built from scratch using uncopyrightable game mechanics. Name the game "The Long Way Home" or a teacher-customizable alternative.

---

## 2. Who It's For

| User | Description |
|------|-------------|
| **Students K–2 (ages 5–8)** | Simplified "Journey to the Valley" variant — illustration-heavy, 2–3 decisions per leg, immediate virtue reinforcement |
| **Students 3–5 (ages 8–11)** | Intermediate variant — Oregon Trail mechanics at ~60% complexity, Beatitudes and Ten Commandments curriculum |
| **Students 6–8 (ages 11–14)** | Full game — complete mechanics, CST and Works of Mercy curriculum, AI features |
| **Teacher / Facilitator** | Selects grade band at session creation; monitors all students in real time; same dashboard across all bands |

---

## 3. User Stories / Jobs to Be Done

### Student (all grade bands)
- As a student, I want to name my party and feel like this journey is mine.
- As a student, I want to make choices that have real consequences so I feel the weight of decisions.
- As a student, I want the game to tell me when I do something good or bad — in words I understand.
- As a student, I want to feel like living well on the trail actually changed my story at the end.
- As a student, I want the game to feel visually modern and engaging.

### Student (3–5 and 6–8 additions)
- As a student, I want to understand why things happen (disease, hardship) and learn real history.
- As a student, I want to face dilemmas where helping others costs me something, and decide anyway.
- As a student, I want to be able to ask questions about what I'm experiencing and get real answers.

### Student (6–8 only)
- As a student, I want the game to surface the ethical frameworks behind the choices I made — so I can discuss them.
- As a student, I want to see that living selfishly gets me to the end — but not the same end.

### Teacher
- As a teacher, I want to select the grade band for my class so content is age-appropriate.
- As a teacher, I want to see every student's current game state on one screen — no clicking around.
- As a teacher, I want to see which students made virtuous or sinful choices and use those as discussion anchors.
- As a teacher, I want to start and stop game sessions for the whole class.
- As a teacher, I want to export a summary of outcomes after a session.
- As a teacher, I want to enable or disable AI features per session.
- As a teacher, I want to read every student's AI Historian conversation transcript.
- As a teacher, I want to control the explicitness of moral labeling in-game.

---

## 4. Core Features

---

### 4A. Grade Band System

The teacher selects a grade band at session creation. This single setting drives: game complexity, vocabulary level, Catholic curriculum content, moral labeling style, UI density, and which AI features are available.

**Grade band is a session-level setting — one teacher session = one grade band. Teachers cannot mix grade bands in a single session.**

---

#### GRADE BAND: K–2 — "Journey to the Valley"

**Philosophy:** Simple, warm, immediate. Every choice teaches one virtue. Labels are explicit, affectionate, and immediate. The child should always know what they did and why it matters.

**Simplifications from full game:**
- Trail has 5 stops (not 15 landmarks) — illustrated scenes, not a map
- No supply purchasing — party starts with fixed supplies
- 2–3 choices per leg maximum (e.g., "Help the family? Yes / No")
- No illness progression system — illness is a single event with a single resolution
- No probability math exposed — outcomes lean more heavily toward narrative, less toward random
- No hunting mini-game — replaced by "Find Food" illustrated choice (berries vs. stream)
- No cash/economy system
- No pace or rations settings — simplified to "Rest today?" Yes / No
- Party is the child + 2 named friends or siblings (not profession-based)

**Catholic Curriculum: K–2 Alignment**

| Concept | How it appears in game |
|---------|----------------------|
| God loves us and asks us to love others | Trail companion (guardian angel character) reminds child after good choices |
| The Golden Rule | "Would you want someone to do this for you?" shown before each helping choice |
| Basic virtues: kindness, sharing, honesty | Each CWM event labeled with the virtue word immediately after choice |
| Simple prayer | "Say a prayer for [Name]" option at crisis moments; illustrated prayer card shown |
| God sees our choices | End-screen: "God saw everything you did on the trail. Here's what you did..." |
| The two Great Commandments | Framed in simple onboarding: "On this journey, try to love God and love your neighbor." |

**Moral Labeling Style (K–2):**

Immediate, warm, named explicitly:

> 🌟 **"That was KINDNESS!"**  
> *You shared your food with the hungry family. Jesus asks us to feed the hungry. That's one of the most loving things we can do.*

> 😔 **"That was selfish."**  
> *You walked past the family without helping. They were hungry and you had food. That's not how Jesus wants us to treat others. You can still change how you act next time.*

Labels appear as illustrated cards — warm colors for virtue, muted colors for sin. Not scary. Not punishing. Honest.

**K–2 "Bad Person" Arc:** A K–2 student who makes consistently selfish choices arrives at the Valley alone, with fewer friends. End screen: a gentle illustrated scene — one figure instead of three. Narration: *"You made it. But your friends didn't. Some of the people you passed by needed you, and you kept going. What do you think you could do differently?"* No score penalty language. Just the picture and the question.

---

#### GRADE BAND: 3–5 — "The Long Trail"

**Philosophy:** Vocabulary building, moral reasoning introduction, cause-and-effect ethics. Students can handle consequences and should start to name the frameworks behind their choices. More complex than K–2 but still guided.

**Simplifications from full 6–8 game:**
- Full 15-landmark trail but fewer random events (1 per leg vs. up to 3)
- Basic supply system — simpler purchasing, no profession selection
- Illness progression exists but at 2 tiers (Sick / Very Sick / Dead) not 4
- Hunting mini-game included but simplified (click to shoot, no scroll)
- River crossings with 3 options (not 4)
- No AI NPC Encounters (3–5 default off — teachable but complex)
- Grace meter active but effects more gentle than 6–8

**Catholic Curriculum: 3–5 Alignment**

| Concept | How it appears in game |
|---------|----------------------|
| The Ten Commandments | Specific Commandments referenced in moral labels when relevant (e.g., "You lied to the trader — this breaks the 8th Commandment") |
| The Beatitudes | Key Beatitudes surfaced after relevant events ("Blessed are the merciful..." after forgiving a thief) |
| Corporal Works of Mercy | Named and briefly explained when triggered — "This is called **visiting the sick**, one of the Works of Mercy" |
| Sin: mortal vs. venial | Age-appropriate framing: "big sins that hurt our friendship with God" vs. "smaller sins" — not full moral theology |
| Conscience | "Your conscience is the voice inside that tells you right from wrong. Listen to it." Appears at choice moments. |
| Reconciliation | After a sinful choice, a "Make it right?" follow-up event can fire — e.g., go back and help; some repair possible |
| The Examination of Conscience | End-screen reflection structured around: What did I do well? What could I have done better? |

**Moral Labeling Style (3–5):**

Named and explained, slightly more mature:

> ✨ **Corporal Work of Mercy: Feed the Hungry**  
> *You gave food to the Garcia family even though it cost you. Jesus called us to feed the hungry. This is one of the Seven Corporal Works of Mercy — actions that take care of people's bodies.*

> ⚠️ **Selfishness / Against the 5th Commandment**  
> *You pushed your party to travel even though Thomas was very sick. The 5th Commandment says we must protect human life — including those in our care. Thomas got worse.*

**Reconciliation Events (3–5 and 6–8):**

After a sinful choice, there is a ~40% chance a **"Make It Right" event** fires within the next 1–2 trail legs. This event gives the student a chance to partially repair the harm. It never fully erases the consequence — but it opens a door.

> *Two days after you passed the Garcia family without helping, you see them again at the river crossing. They look even weaker. You can share some of your food now. It won't undo what happened — but it's something.*

If the student takes the Reconciliation event: Grace partial restoration (+5), morale boost, brief affirming label.  
If the student declines again: Grace no change, event closes.

**3–5 "Bad Person" Arc:** Arrival is possible. End screen distinguishes: number of party members alive, Grace range, key decisions. Narrative: *"You reached the Willamette Valley. But the trail left marks. [Names of dead party members] didn't make it. Some of the choices that cost them could have gone differently. What would you do if you could travel the trail again?"* Honest, not punishing. Named.

---

#### GRADE BAND: 6–8 — "The Full Trail" (Existing Design)

Full game as specified throughout this document. Catholic curriculum aligned with middle school catechesis.

**Catholic Curriculum: 6–8 Alignment**

| Concept | How it appears in game |
|---------|----------------------|
| Catholic Social Teaching (all 7 principles) | Embedded in game systems — see `catholic.md` for full mapping |
| Corporal Works of Mercy (all 7) | Core CWM event system — labeled per teacher setting |
| Spiritual Works of Mercy | Surface in AI Historian responses and NPC dialogue |
| Virtue ethics | Grace system tracks virtues; Examination of Conscience names them at end |
| Conscience formation | Moral labels frame choices as conscience moments; AI Historian can discuss conscience directly |
| Social sin | "Bad Person Arc" — see below |
| Human dignity | Death messages, Last Rites, and NPC encounters all reinforce the dignity of each person |
| Free will and consequences | Core design principle — player can choose poorly and still "win," but the story tells the truth |

**Moral Labeling Style (6–8):**

Present, but calibrated — names the framework without lecturing:

> *You chose to help the Garza family. The Church calls this **feeding the hungry** — one of the Seven Corporal Works of Mercy. You chose it when it cost you something. That matters.*

> *You pushed Grueling pace while Thomas had a fever. He got worse. The Church teaches that we have a responsibility to protect the lives in our care — this is tied to the 5th Commandment and the dignity of human life.*

Labels appear as a brief sidebar card — readable but dismissible. Not modal, not blocking. Students can continue without reading it, but it's there.

**The "Bad Person" Arrival Arc — 6–8 Full Specification:**

A student who plays with consistently depleted Grace (< 15 at arrival) CAN reach Willamette Valley. The game does not prevent it. But the arrival experience is entirely different.

*Mechanical state of a depleted-Grace arrival:*
- Likely has more cash (didn't spend it on others)
- Likely has more food (didn't share)
- Likely has fewer party members (pushed people past their limits)
- Likely has no chaplain (didn't bother with the cost)
- Never administered Last Rites
- Declined every CWM event
- May have exploited desperate traders

*Narrative treatment:*

The arrival scene generates a Grace-specific narrative. For depleted Grace:

> *You reached the Willamette Valley on November 4, 1848. You still had $340 in your pocket and 80 pounds of food in the wagon. Of the four people who began this journey with you, two are buried along the trail. Maria died of cholera outside Fort Boise. You kept moving. James died three weeks later from exhaustion you could have prevented. You had the supplies.*
>
> *You arrived. No one was waiting for you. The strangers you passed along the way are somewhere behind you, still on the trail or in the ground. The land is beautiful. You'll have to decide what kind of person you want to be here — because the trail is over, and it's too late to go back.*

*Post-arrival consequence panel (unique to 6–8):*

A final screen — "Life in Oregon" — describes what happens to the player's character in the years after arrival, in 3–4 sentences. It is probabilistic, not deterministic, but Grace strongly influences it:

| Grace Range | "Life in Oregon" Framing |
|-------------|-------------------------|
| 75–100 | Community member; helped build the first church; names in the area still carry yours |
| 40–74 | Settled well; a decent life; some regrets, mostly peace |
| 15–39 | Prosperous but isolated; the people who could have been friends were left behind on the trail |
| 0–14 | Made it. Rich enough, even. But the kind of alone that money doesn't fix. The trail shaped you — just not the way you'd want to tell your grandchildren. |

This is the Catholic answer to "can a bad person win?" — Yes. And here's what winning costs.

**Explicit moral labeling — 6–8 teacher control:**

The teacher can set labeling to one of three modes:
- **Full** — all moral labels appear in real time (default for religion class use)
- **Post-choice** — label appears after the resolution event, not during the choice
- **Discussion only** — no in-game labels; teacher surfaces frameworks in discussion (original design for ethics class)

---

#### Grade Band Comparison Summary

| Feature | K–2 | 3–5 | 6–8 |
|---------|-----|-----|-----|
| Trail length | 5 stops | 15 landmarks (simplified events) | 15 landmarks (full) |
| Supply system | None | Basic | Full |
| Illness | Single event | 2 tiers | 4 tiers |
| CWM events | 1–2, simplified | 1–2, labeled | 1–3, with deceptive recipients |
| Reconciliation events | No | Yes | Yes |
| Moral labeling | Immediate, warm, explicit | Named + explained | Named + framed (teacher-configurable) |
| Sin identification | Named simply | Named with Commandment/Beatitude | Named with full framework |
| Grace meter | Active (simplified) | Active | Full |
| "Bad Person" arc | Gentle picture | Named, narrative | Full narrative + Life in Oregon |
| Sunday rest | Yes (simplified) | Yes | Yes |
| Last Rites | No | No | Yes (with chaplain) |
| AI Historian | Off (N/A) | Optional | Optional |
| AI NPC Encounters | Off (N/A) | Off (optional) | Optional |
| Personalized Exam | Off | Simple | Full AI version |
| Knowledge Panel | Off | 3–5 cards (simpler) | Full 12-card set |
| Catholic curriculum | Golden Rule, Great Commandments, basic virtues | Ten Commandments, Beatitudes, CWM introduced | Full CST, all Works of Mercy, virtue ethics, conscience |

---

### 4B. Student Gameplay — 6–8 Full Variant

*K–2 and 3–5 variants share this engine with the simplifications defined in Section 4A. All mechanics below are the 6–8 baseline; grade-band flags disable or simplify features for younger bands.*

#### Setup / Onboarding
- Student enters their name and party member names (up to 4 companions)
- Student selects a profession: Banker, Carpenter, or Farmer (affects starting cash — $1,600 / $800 / $400)
- Student optionally includes a **Trail Chaplain** (Jesuit or Franciscan friar) as a party member — costs food/space but provides passive morale bonus and unlocks Catholic-specific events and Last Rites. The choice is presented neutrally; students are not required to include one.
- Student purchases starting supplies at Independence, Missouri:
  - Oxen (required, 1–9 yokes)
  - Food (lbs)
  - Clothing (sets)
  - Ammunition (boxes)
  - Spare parts: wagon wheels, axles, tongues
- Player can spend remaining cash on the trail at forts

#### Trail Progression
- Landmarks: Independence MO → Fort Kearney → Chimney Rock → Fort Laramie → Independence Rock → South Pass → **St. Mary's Mission** → Fort Bridger → Green River → Fort Hall → Snake River → Fort Boise → **Whitman Mission** → Blue Mountains → The Dalles → Willamette Valley
- Catholic missions replace two generic stops. They function identically (rest, resupply) but with distinct visual treatment — mission courtyard, chapel bell, illustrated scene card — and slightly lower prices than forts (hospitality, not commerce)
- Each "leg" of trail is a travel segment with distance, terrain type, and hazard probability
- Player chooses travel **pace**: Steady, Strenuous, Grueling
- Player chooses **rations**: Filling, Meager, Bare Bones
- **Date system**: starts April 1, 1848; time advances per leg traveled

#### Events (Random + Triggered)
The game fires random events on the trail. Each has a visual scene and outcome resolution:

| Category | Events |
|----------|--------|
| **Weather** | Heavy rain (delay), blizzard (if mountain pass too late), fog, heat wave |
| **Illness** | Cholera, typhoid, dysentery, measles, exhaustion, broken leg, snakebite |
| **Trail hazards** | Wagon breakdown (by part), river crossing (ford vs ferry vs wait), lost trail, fire |
| **Resources** | Food spoilage, oxen death, theft |
| **Good events** | Wild fruit, good weather, helpful travelers, shortcut |
| **Catholic feast days** | Aug 15 (Assumption), Nov 1 (All Saints), Nov 2 (All Souls — sobering if party has lost members) — flavor text only, no mechanical effect |
| **Corporal Works of Mercy** | See dedicated section below |

#### Corporal Works of Mercy Events

These are the game's primary ethical decision moments. They fire as random events, unlabeled — students make the choice before knowing the framework. Teacher surfaces the connection during discussion.

Each event presents a real cost-benefit tradeoff — the "right" choice is never mechanically free. Critically: **some recipients are not who they appear to be.** A seemingly starving traveler may be a grifter. A desperate family may be lying about their situation. The game does not telegraph this in advance. This is intentional.

**Core CWM events:**

| Event | Choice | Cost of Helping | What It Teaches |
|-------|--------|-----------------|-----------------|
| Starving family stopped on trail | Share food or pass | Lose 20–40 lbs food | Feed the hungry |
| Thirsty travelers at dry crossing | Share water or conserve | Lose water supply, risk own thirst | Give drink to the thirsty |
| Sick stranger at roadside | Stop to help (lose 1 travel day) or continue | Time lost; illness exposure risk | Visit the sick |
| Abandoned child at burned wagon | Take them in (costs food, space) or leave | Food cost + random event weight added | Shelter the homeless |
| Deceased settler, no burial | Stop to give proper burial or continue | Lose half a travel day | Bury the dead |
| Desperate family offers trade at unfair price | Accept fair trade or exploit their desperation | Miss opportunity for cheap goods | Justice / fair dealing |
| Fellow traveler admits stealing your food | Forgive and share, or demand restitution | Possible resource loss | Mercy over justice |

**Deceptive charity events — the grifter mechanic:**

These events look identical to standard CWM events at presentation. The player has no way to know in advance which they are. Grace accrues the same way — the moral act is the act of giving, regardless of the recipient's honesty. The resource cost is real either way.

| Scenario | What Player Sees | What Actually Happens |
|----------|-----------------|----------------------|
| "Traveling preacher" asks for food | Appears holy, claims to be en route to a mission | Takes your food and disappears. No reciprocity. Player feels the loss. Grace +15 still awarded. |
| "Injured" stranger asks for a ride | Claims broken ankle, asks to ride in your wagon | Perfectly healthy; adds wagon weight, slows travel for 2 days, then leaves. Grace +12. |
| Family claims their wagon was robbed | Ask for cash to resupply | Story is exaggerated; they had resources. You're out $15–30. Grace +15. |

**Stranger Reciprocity System:**

When a student helps a CWM event (genuine or deceptive), a reciprocity flag is set with a probability of future return. This is not guaranteed — it's a 40–60% chance depending on context. If it fires, a **Stranger Returns** event appears 2–4 trail legs later.

| Original Act | Possible Stranger Return |
|--------------|--------------------------|
| Fed a starving family | The family is at a fort ahead — they leave you 30 lbs of dried meat |
| Helped a sick stranger | Stranger fully recovered, flags you down — has spare wagon wheel your size |
| Gave the grifter food | A *different* traveler witnesses your generosity, offers to scout ahead for you (reduces next hazard probability) |
| Forgave the thief | Thief returns, ashamed — offers $20 cash and a day of labor |
| Took in the abandoned child | Child knows the mountain pass route; reduces blizzard risk by 20% |

**Critical design rule:** Stranger Returns should never feel like a guaranteed vending machine. 40–60% fire rate means students who helped generously will sometimes receive nothing back — and students who helped the grifter may still experience grace returning through an *unrelated* stranger. That unpredictability is the theology. You give because it's right, not because it pays.

**Grace rule for deceptive events:**
```
IF player_helps AND recipient_is_deceptive THEN grace += 15 (same as genuine)
// Intent is what Grace tracks, not outcome
// The game NEVER tells the student whether the recipient was genuine or not
// Teacher can see this in the dashboard — deceptive events are flagged in the event log
```

**Rules for Works events:**
- Fire at most 3 per playthrough (up from 2 — to ensure richer discussion material)
- At least 1 per playthrough guaranteed if the game lasts past Fort Laramie
- At least 1 of the 3 should be a deceptive event if the student reaches South Pass
- Never fire when player is already in a survival crisis (food = 0, multiple Critical members)
- Teacher dashboard flags which Works events each student encountered, whether they helped, and whether the recipient was genuine or deceptive
- Works event decisions and reciprocity outcomes included in session export CSV

#### Sunday Rest Mechanic
- Each Sunday on the in-game calendar, a prompt appears: "Rest on the Sabbath or continue traveling?"
- **Rest**: Lose 1 travel day. All party members recover 1 health tier. Party morale bonus applied.
- **Push through**: No penalty. No bonus. Party morale unaffected.
- This is a genuine tradeoff — resting too often risks missing the mountain pass deadline. Presented neutrally; no moral judgment from the game.
- Historically accurate: many wagon trains observed Sunday rest.

#### Prayer During Crisis
- When any party member reaches Critical health, an additional response option appears alongside the medical choices: **"Pray for [Name]"**
- Effect: Does not cure illness. Provides a morale stabilizer — slows the morale decay that follows Critical health events. Framed as the party finding resolve and clarity.
- If a chaplain is in the party, the prayer option is always available (not just at Critical); provides a small (+5%) reduction in illness escalation probability.
- The game never guarantees prayer changes an outcome — it reflects reality.

#### Last Rites
- Triggers when a party member transitions from Critical to imminent death AND a chaplain is in the party
- Short illustrated scene: the chaplain at the bedside, simple and dignified
- Effect: Party morale impact from the death is reduced by 40%. The party grieves, but with peace.
- If no chaplain is present, death scene is identical but without the Last Rites moment
- Death message still names the cause: "Clara died of typhoid fever on August 3, 1848."

#### Reconciliation Events (3–5 and 6–8)

After a student makes a sinful or selfish choice, there is a 40% probability that a **"Make It Right" event** fires within the next 1–2 trail legs. This is not guaranteed — and that gap matters. The door opens; the student decides whether to walk through it.

**Rules:**
- Only fires if the original choice was a CWM decline or an exploit event (not passive bad luck)
- Presents the same person or situation again in a new context
- Partially restores what was lost — never fully undoes consequences
- If student takes the Reconciliation event: Grace +5, morale boost, affirming moral label
- If student declines again: no change; event closes; moral label surfaces the second refusal
- Maximum 1 Reconciliation event per CWM event (you don't get infinite chances)
- Teacher dashboard flags which students had Reconciliation events available and whether they took them

**Example (K–2 skip; 3–5 and 6–8):**
> *Three days after you passed the Garcia family without sharing your food, you see them again at the river crossing. They look weaker. You have enough food to share a little without putting your party at risk. You could help them now.*

#### Moral Labeling System

All grade bands label moral choices explicitly — the framework, vocabulary, and tone differ by band. Labeling is the core Catholic curriculum delivery mechanism. Students should always know what they did and why it matters in their faith tradition.

**Labeling appears as a dismissible sidebar card** — never a blocking modal. Student can continue gameplay immediately; card fades after 8 seconds if not dismissed.

**What gets labeled:**
- Every CWM event decision (help or decline)
- Every Reconciliation event decision
- Every exploitation or unfair trade decision
- Sunday rest / Sabbath choice
- Prayer choices
- Overhunting (stewardship)
- Last Rites (when administered)
- Grueling pace while party is sick (3–5 and 6–8)

**Labeling does NOT apply to:**
- Random bad luck (blizzard, oxen death, illness from terrain)
- Tactical choices (pace, supply purchases) unless they cross an ethical threshold
- The deceptive charity mechanic — helping a grifter is still labeled as a Work of Mercy; the deception is never surfaced in the label

**Label design by grade band:**

K–2:
- Large illustrated card with a single virtue/sin word in big type
- Warm/muted color based on valence
- 1–2 sentences, simple vocabulary
- Always closes with a forward-looking prompt: "Next time you can..."

3–5:
- Named framework (Commandment number, Beatitude text, or CWM title)
- 2–3 sentences explaining the framework
- Cause-and-effect framing: "Because you chose X, Y happened."
- Brief scripture reference when natural (Matthew 25, the Beatitudes)

6–8:
- Framework name + brief framing, not a lecture
- 2 sentences maximum
- Teacher can set to Full / Post-choice / Discussion-only (see Section 4A)
- No scripture reference by default (teacher can enable in settings)

**Teacher override:**
Teacher can globally disable labels at any point during a session (e.g., to run a "discover it yourself" variant for older students and reveal the framework in discussion afterward).

#### Hunting Mini-Game
- Triggered by player choice at rest points
- Visual: scrolling scene, animals cross the screen
- Player taps/clicks to shoot
- Ammo consumed per shot; animals have different yields (squirrel < rabbit < deer < bison)
- Overhunting possible — bison population degrades if hunted too aggressively

#### River Crossings
- Player must decide: ford it, caulk and float, wait for lower water, or pay for ferry
- Decision factors shown: river depth, wagon weight, time of year
- Outcome is probabilistic — risk of drowning party members, losing supplies

#### Party Health / Death
- Each party member has a health status: Good → Fair → Poor → Critical → Dead
- Death messages are specific and educational (e.g., "Thomas died of cholera. Cholera spreads through contaminated water.")
- Player cannot continue without at least 1 surviving member (including themselves)

#### Win Condition
- Reach Willamette Valley before December 31, 1848
- Score calculated from: days remaining, cash remaining, party survivors, supplies remaining, **Grace score multiplier** (see Grace Meter below)
- End screen shows final score, outcome narrative, and comparison percentile (vs. class average if connected)
- **Examination of Conscience panel** — appears after score, before session ends. Lists 3–5 moments from the student's specific playthrough: decisions that helped others, decisions that hurt others, deaths that could have been prevented. If teacher has enabled CWM labeling, this panel names the Corporal Works framework. Otherwise labeled only as "Looking Back."

#### Grace Meter

The Grace meter is the Catholic behavior reward system. It is **invisible to students during gameplay** — they experience its effects but never see the number. It is **visible to the teacher** on the dashboard (0–100 per student).

**How it fills:**
| Action | Grace +/- |
|--------|-----------|
| Help in a CWM event | +15 |
| Sunday rest taken | +5 |
| Pray during crisis | +3 |
| Include chaplain in party | +5 (one-time at start) |
| Last Rites administered | +8 |
| Chose fair trade over exploitation | +5 |
| **Decline to help in CWM event** | -8 |
| **Exploit desperate traveler** | -10 |
| **Push Grueling pace while party is sick** | -3 per day |
| **Overhunt (bison population depleted)** | -5 |

**How it affects outcomes — mechanical rewards for virtue:**

Grace does not prevent bad luck. Cholera still kills. Blizzards still happen. But Grace modulates probability at the margins in ways a player who lives well will feel over time:

| Grace Range | Effect |
|-------------|--------|
| 75–100 (High) | Illness escalation probability –15%; random good events +10%; one "stranger helped you" event guaranteed to fire; final score multiplier 1.2x |
| 40–74 (Moderate) | No bonus, no penalty — baseline game |
| 15–39 (Low) | Random good events –10%; illness recovery slower (+1 day per tier) |
| 0–14 (Depleted) | Morale floor drops to 0; one additional hardship event guaranteed to fire late trail |

**Narrative payoff — the arrival scene:**
The Willamette Valley arrival scene generates a unique narrative paragraph based on Grace score. High Grace = the party is welcomed, whole, at peace. Low Grace = arrival is hollow, the cost of every shortcut visible in who didn't make it. This is the biggest Catholic reward — the story you earned.

**Grace and the Examination of Conscience:**
The end-screen reflection panel draws directly from Grace history. If Grace is high, the panel surfaces what the player did right. If low, it surfaces the moments that cost them — not as accusation, but as honest accounting.

---

### 4D. AI Trail Historian

A contextual AI assistant students can consult during gameplay. Powered by Claude API (Haiku by default). **Off by default — teacher must enable per session.**

#### What It Is
The Trail Historian is presented in-game as a weathered journal or "trail companion" — not a chatbot, not a robot. Visual treatment: a worn leather journal that opens when accessed. The AI responds in the voice of a knowledgeable trail guide, historically grounded, age-appropriate, warm but not cartoonish.

The Historian is **context-aware** — it knows the student's current game state (location, date, recent events) and responds accordingly. If a student just experienced a cholera death, the Historian can speak to that specifically.

#### When Students Can Access It
- **At rest points** between trail legs — not during active events or crises
- **After major events** — a small journal icon pulses for 30 seconds after any significant event (death, illness, CWM event, river crossing) indicating the Historian has something to say or is available for questions
- **Teacher can restrict** to post-event only, or open it freely during rest points

#### What Students Can Ask
The system prompt constrains the Historian to stay in scope:
- Historical facts about the Oregon Trail era (diseases, terrain, supplies, travel conditions)
- What life was like for settlers, missionaries, Native Americans encountered on the trail
- Explanations of in-game events ("why did my oxen die?", "what is cholera?")
- Context about Catholic missions and the role of the Church on the frontier
- Reflection prompts ("was there anything I could have done differently?")

**Out of scope (system prompt blocks):**
- Anything unrelated to the game, the trail, or the historical period
- Advice that gives unfair mechanical advantage ("just always choose X")
- Content inappropriate for 6–8th grade
- The AI never reveals game mechanics, probabilities, or the Grace meter

#### System Prompt (base — Claude Code should implement this)
```
You are a Trail Historian for The Long Way Home, an educational game set on the Oregon Trail in 1848. 
You speak as a knowledgeable, warm trail companion — think a wise historian who has studied this 
journey deeply. You are NOT a robot or a chatbot. You respond in 2–4 sentences unless the student 
asks for more detail.

Current game context: {student_name} is traveling with {party_names}. They are currently at 
{current_landmark}, it is {game_date}. Recent event: {last_event_description}.

Stay strictly within these topics:
- Oregon Trail history (1840s–1860s)
- Diseases, travel conditions, supplies, terrain of the era
- Catholic missions, Jesuit and Franciscan presence on the frontier
- The experience of settlers, missionaries, and Native peoples
- Thoughtful reflection on decisions made in the game

Never reveal game mechanics, probabilities, or internal scoring. Never discuss topics unrelated 
to the trail and its era. If asked something out of scope, redirect warmly: "That's not something 
I know much about — but I can tell you about [related trail topic]."

Keep all responses appropriate for students ages 11–14.
```

#### Teacher Transcript View
- Every student's AI Historian conversation is logged in full
- Teacher dashboard shows a "Historian" tab on each student card — click to read full transcript
- Transcripts update in real time
- Teacher can see: student question, Historian response, timestamp, game context at time of question
- Session export CSV includes summary: number of Historian queries per student, topics asked about

#### Teacher Configuration Settings (session-level)
| Setting | Options | Default |
|---------|---------|---------|
| AI Historian enabled | On / Off | Off |
| AI model | claude-haiku-4-5 / claude-sonnet-4-6 / custom endpoint | claude-haiku-4-5 |
| API key | Teacher-provided key entered in session setup | None (required to enable) |
| Historian access mode | Free (any rest point) / Prompted (post-event only) | Prompted |
| CWM labels in-game | Labeled / Unlabeled | Unlabeled |
| Examination of Conscience CWM reveal | Reveal framework / Keep unlabeled | Reveal |

#### Cost Estimate for Teachers
At Haiku pricing (~$0.25/M input tokens, ~$1.25/M output tokens), a 30-student session with moderate Historian use (5 queries per student, ~200 tokens each) costs approximately **$0.02–0.05 per session**. Negligible. Note this in teacher setup documentation.

---

### 4E. Historical Knowledge Panel

A set of 5–8 contextual "Did You Know?" cards available at every landmark and after every major event type. **Fully preloaded as static JSON — no API calls.** Content is researched, accurate, and age-appropriate. Cards appear as small pulsing icons in the sidebar; clicking opens a brief illustrated card without leaving the game screen.

**Design principles:**
- Never interrupts active gameplay — cards only available at rest points and post-event
- Dismissible in one tap
- Reading is optional; game never gates progress on engaging with cards
- Each card is 3–5 sentences max with one visual element

**Card triggers and sample content:**

| Trigger | Card Title | Content Summary |
|---------|-----------|-----------------|
| Cholera event fires | "What Was Cholera?" | Caused by contaminated water; killed thousands on the trail; not understood until the 1850s; how symptoms progressed |
| River crossing | "The Platte River" | Why the Platte was both essential and dangerous; "a mile wide and an inch deep"; quicksand; historical crossing statistics |
| Arrive at St. Mary's Mission | "The Jesuits on the Frontier" | Who the Jesuits were; Fr. Pierre-Jean De Smet; the mission system; relationships with Flathead and Potawatomi peoples |
| Arrive at Fort Laramie | "Fort Laramie's History" | Originally a fur trading post; purchased by US Army 1849; meeting point for thousands of emigrants |
| Bison hunting | "The Great Bison Herds" | 30–60 million bison before westward expansion; role in Plains Indian culture; collapse by 1890 |
| Party member dies | "Death on the Trail" | 1 in 10 emigrants died on the Oregon Trail; cholera most common cause; graves unmarked to prevent desecration |
| Wagon breakdown | "What It Took to Cross" | Weight limits; wagon construction; the spare parts emigrants carried; common failure points |
| Blizzard in mountain pass | "The Donner Party" | Brief, age-appropriate account; same mountain passes; same timing window; what went wrong |
| First Sunday rest prompt | "Sabbath on the Trail" | How different religious communities observed Sunday; historical accounts of Sunday rest debates among wagon trains |
| Whitman Mission stop | "Marcus and Narcissa Whitman" | Their story; role as Oregon pioneers and missionaries; the 1847 Whitman Massacre and its causes |
| CWM event fires (any) | "Hospitality on the Trail" | Historical accounts of wagon train generosity; the culture of mutual aid among emigrants; what travelers were expected to offer strangers |
| Arrive Willamette Valley | "The Oregon Country" | What settlers found; land claims; the founding of Oregon Territory; what happened to the Native peoples already there |

**Data structure (preloaded JSON):**
```json
{
  "cards": [
    {
      "id": "cholera_explainer",
      "trigger_events": ["illness_cholera"],
      "trigger_landmarks": [],
      "title": "What Was Cholera?",
      "body": "...",
      "image_key": "cholera_card",
      "grade_level": "6-8",
      "sources": ["Oregon-California Trails Association", "PBS Oregon Trail documentary"]
    }
  ]
}
```

**Teacher view:** Dashboard shows which Knowledge Panel cards each student clicked. Included in session export. Teacher can use this to gauge curiosity and depth of engagement.

---

### 4F. Additional AI-Powered Features

Beyond the Trail Historian, three additional AI features use the same Anthropic API key. All are **off by default**, individually toggleable in teacher settings.

#### 1. Personalized Examination of Conscience
At game end, instead of templated reflection text, Haiku generates a unique 3–4 sentence Examination of Conscience drawn from the student's actual event log. It references specific decisions, specific names, specific moments.

Example output for a student who declined a CWM event and pushed grueling pace while sick:
*"You faced hard choices on this trail. When you met the Garza family outside Fort Kearney, you kept moving — their hunger didn't stop your clock. And in the days after Sarah fell ill, you pushed Grueling when the trail demanded rest. She made it. But the question worth sitting with: what would you do if she hadn't?"*

**System prompt note:** AI is given event log, Grace score, CWM decisions, deaths, and party names. Instructed to be honest but not punishing — a mirror, not a judge.

#### 2. Dynamic NPC Encounters
At Catholic mission stops and select fort stops, students can initiate a brief AI conversation with a historically grounded character. **Maximum 3 exchanges, then the conversation closes naturally.**

| Location | Character | Historical Basis |
|----------|-----------|-----------------|
| St. Mary's Mission | Father Pierre-Jean De Smet, SJ | Real Jesuit missionary, known to many wagon trains |
| Whitman Mission | Marcus Whitman | Real figure; mission stop on the historical trail |
| Fort Laramie | Bordeaux, fur trader | Composite of documented Fort Laramie traders |
| Any fort | Pawnee scout | Composite; many wagon trains hired Native scouts |

System prompt constrains character to: speak in period-appropriate voice, answer questions about their life and the trail ahead, stay in character, end gracefully after 3 exchanges. Never discusses modern topics or game mechanics.

**Teacher can see all NPC transcripts** in the same Historian transcript viewer.

#### 3. Teacher Insight Generator
After a session closes (or any time during), the teacher can trigger an AI analysis of class-wide patterns. Haiku receives anonymized aggregate data: distribution of CWM choices, Grace score ranges, most common causes of death, most asked Historian questions, common NPC exchange topics.

Output: 3–5 discussion prompts specific to what *this class* experienced.

Example output:
*"17 of your 24 students helped the stranger at Fort Kearney — but 11 of those were later helped by a stranger in return, while 6 received nothing back. That's your entry point: why did 17 help if they couldn't know what would happen? And what do the 7 who passed think now? Your class also asked the Historian about cholera more than any other topic — consider pairing the historical explanation with a modern parallel (contaminated water systems, vaccine access) for a live ethics bridge."*

This feature is the most direct AI ethics curriculum hook — a real AI analyzing student behavior and generating pedagogical recommendations, in a classroom studying AI ethics. That recursion is worth naming explicitly to students.

---

### 4G. Teacher Feedback

A permanent feedback link available in the teacher dashboard footer. Clicking opens a Google Form in a new tab.

**Pre-populated fields (passed as URL query params):**
- Session date
- Session code
- Student count
- AI features enabled (Y/N per feature)
- Game version

**Form fields:**
1. Overall session rating (1–5 stars)
2. Did students engage with the game? (Yes / Somewhat / No)
3. Did the AI Historian add value? (Yes / No / Not enabled)
4. Were the CWM events effective discussion anchors? (Yes / No / Didn't use them)
5. What would you change? (open text)
6. What worked best? (open text)
7. Would you use this again? (Yes / No / Maybe)

Google Form owned by teacher/admin. Claude Code implements URL construction to pre-populate fields. Actual form creation is outside build scope — teacher provides the base URL as environment variable `VITE_FEEDBACK_FORM_URL`.

---

### 4B. Teacher Dashboard

#### Access
- Separate URL route: `/teacher` or `/dashboard`
- Password-protected (simple class password set at session start — no Google Auth required for MVP)
- Teacher sets a **session code** students use to join (e.g., "TRAIL42")

#### Dashboard Layout
- Grid of student cards — one per active student
- Each card shows:
  - Student name
  - Current landmark / location on trail
  - Date in-game
  - Party health summary (color-coded: green / yellow / red)
  - Cash remaining
  - Food remaining
  - Party members alive / total
  - Last major event (text)
  - **Chaplain in party** (Y/N indicator)
  - **Works of Mercy encountered** — icon badge: count fired, dot per event (green = helped, red = declined, yellow = helped/deceptive recipient)
  - **Grace meter** — small progress bar (0–100), color-coded: gold (75+), gray (40–74), amber (15–39), red (0–14)
  - **Historian queries** — count; chat icon opens full transcript
  - **Knowledge Panel cards clicked** — count of historical cards the student read
- Cards update in real time (polling every 10 seconds or WebSocket)

#### Dashboard Footer
- **"Generate Class Insights" button** — triggers AI Teacher Insight Generator (Section 4F)
- **"Give Feedback" link** — opens Google Form pre-populated with session data (Section 4G)

#### Filtering & Sorting
- Sort by: name, location, health, date, score
- Filter by: struggling (1+ critical members), at risk (low food or cash), completed

#### Teacher Controls
- **Pause all games** — freezes all student sessions simultaneously (good for discussion moments)
- **Reset session** — clears all student data for current session
- **Highlight a student** — projects their game state for class discussion (read-only view)
- **Session settings panel** — accessible before and during session:
  - Toggle AI Historian on/off
  - Set Historian access mode (free / post-event only)
  - Enter API key for all AI features
  - Toggle AI Personalized Examination of Conscience on/off
  - Toggle AI NPC Encounters on/off
  - Toggle CWM in-game labels (labeled / unlabeled)
  - Toggle CWM reveal on Examination of Conscience end screen
  - Set randomness/chaos level (Low / Standard / High — affects frequency of hardship events)

#### Historian Transcript Viewer
- Accessible from each student card ("Historian" tab)
- Shows full conversation: student question → Historian response → timestamp → game context at time of query
- Teacher can scan all transcripts quickly to identify rich discussion material
- Flag icon: teacher can mark specific exchanges to spotlight in class discussion

#### Session Export
- At session end, teacher can download CSV with:
  - Student name
  - Final location reached
  - Party survivors
  - Score (raw + Grace-adjusted)
  - Final Grace score (0–100)
  - Key decisions made (pace, rations, profession, chaplain included Y/N)
  - Cause of each death
  - CWM events: type, choice (helped/declined), recipient genuine or deceptive, reciprocity event fired Y/N
  - Sunday rest choices (how many Sundays rested vs. traveled)
  - Whether Last Rites was available and triggered
  - AI Historian: number of queries, topic summary (history / illness / ethics / Catholic / other)
  - Knowledge Panel: count of cards clicked, card IDs
  - NPC encounters: location, character, exchange count

---

### 4C. Upgraded Graphics

Replace all original ASCII/16-color graphics with:

| Element | Approach |
|---------|----------|
| **Background landscapes** | Layered parallax CSS/Canvas scenes — prairie, river, mountain, desert biomes; changes as player progresses |
| **Wagon** | Animated SVG wagon that rocks as it travels; shows damage state if parts broken |
| **Hunting scene** | Side-scrolling Canvas animation with animal sprites |
| **Weather effects** | CSS particle effects: rain, snow, dust |
| **Event illustrations** | Illustrated scene cards (SVG or generated pixel-art style) for each major event type |
| **Mission landmarks** | Distinct visual — adobe or stone chapel, bell tower, courtyard; warmer and quieter than fort scenes |
| **Last Rites scene** | Simple, dignified illustrated card — candlelight, friar, bedside. Not graphic, not maudlin. |
| **Corporal Works events** | Each CWM event has its own illustrated scene card — the starving family, the roadside stranger, the abandoned child |
| **UI chrome** | Clean, modern educational UI — warm tan/brown/blue palette; large readable type |
| **Map view** | Stylized trail map showing current progress with animated wagon marker; mission stops marked with small cross icon |

**Style reference:** Warm, illustrated storybook aesthetic — not cartoonish, not photorealistic. Think Ken Burns documentary art direction crossed with a well-designed educational app.

---

## 5. Business Rules and Logic

```
IF pace = Grueling AND rations = Bare Bones THEN illness probability += 30%
IF oxen_count < 2 THEN trail_speed = 0 (wagon cannot move)
IF food_lbs <= 0 THEN rations forced to Bare Bones; health degrades daily
IF party_member health = Critical AND rations != Filling THEN death_check each travel day
IF mountain_pass_date > Oct 15 THEN blizzard_probability = 80%
IF ammunition = 0 THEN hunting disabled
IF cash = 0 THEN fort purchases disabled
IF river_depth > 3ft AND caulk_float THEN loss_probability = 40%
IF river_depth > 5ft AND ford THEN certain wagon loss, 60% drowning per member
IF all_party_members dead THEN game_over, show final stats
IF student session inactive > 30 min THEN auto-pause (preserves state)

// Catholic mechanics
IF chaplain_in_party = true THEN morale_floor += 10 (baseline morale never drops below 10%)
IF chaplain_in_party = true AND party_member = Critical THEN prayer_option = always_visible
IF chaplain_in_party = true AND party_member = dying THEN last_rites_scene fires before death
IF last_rites_fired = true THEN morale_death_penalty *= 0.6
IF sunday_rest = true THEN all_party_members recover 1 health tier; morale += 5
IF CWM_event fires AND all_party_members healthy AND food > 50lbs THEN event is valid (don't fire into survival crisis)
IF CWM_events_fired >= 2 THEN no further CWM events for this playthrough
IF player_chooses_help on CWM event THEN resource cost applied; morale += 8; grace += 15
IF player_chooses_pass on CWM event THEN no resource cost; morale -= 3; grace -= 8
IF game_date = Aug 15 OR Nov 1 OR Nov 2 THEN feast_day_flavor_text fires (no mechanical effect)

// Grace meter effects
IF grace >= 75 THEN illness_escalation_probability -= 15%; good_event_probability += 10%; score_multiplier = 1.2
IF grace <= 14 THEN morale_floor = 0; one guaranteed hardship event fires in final trail third
IF grace >= 75 AND game_complete THEN arrival_narrative = 'high_grace' variant; show Life in Oregon (high)
IF grace <= 14 AND game_complete THEN arrival_narrative = 'depleted_grace' variant; show Life in Oregon (depleted)
IF grace 15-39 THEN illness_recovery_time += 1 day per tier; good_event_probability -= 10%

// Grade band routing
IF grade_band = 'k2' THEN disable: supply_system, illness_progression, hunting_minigame, chaplain, last_rites, ai_historian, npc_encounters, knowledge_panel
IF grade_band = 'k2' THEN enable: guardian_angel_companion, golden_rule_prompts, simple_prayer_cards, 5_stop_trail
IF grade_band = '3_5' THEN disable: last_rites, npc_encounters (default off), full_knowledge_panel
IF grade_band = '3_5' THEN enable: reconciliation_events, commandment_labels, beatitude_labels, 2_tier_illness
IF grade_band = '6_8' THEN all features active per teacher settings

// Moral labeling
IF moral_label_mode = 'full' THEN label fires immediately after choice
IF moral_label_mode = 'post_choice' THEN label fires after event resolution
IF moral_label_mode = 'discussion_only' THEN no labels fire; events logged for teacher
IF grade_band = 'k2' THEN moral_label_mode = 'full' (locked)
IF grade_band = '3_5' THEN moral_label_mode = 'full' (default; teacher can change)
IF grade_band = '6_8' THEN moral_label_mode = 'full' (default; teacher can set to post_choice or discussion_only)
IF deceptive_charity_event AND player_helps THEN label = Work of Mercy label (same as genuine); deceptive flag NOT referenced

// Reconciliation events
IF sinful_choice_made AND grade_band IN ('3_5', '6_8') THEN reconciliation_pending = true; probability = 0.4
IF reconciliation_pending AND trail_legs_since_sin BETWEEN 1 AND 2 THEN roll probability
IF player_takes_reconciliation THEN grace += 5; morale += 3; apply affirming label; clear pending
IF player_declines_reconciliation THEN apply second-refusal label; clear pending
IF reconciliation already fired for this sin THEN no second attempt

// Deceptive charity / stranger reciprocity
IF cwm_event_fires THEN randomly assign recipient_is_deceptive (25% probability)
IF player_helps AND recipient_is_deceptive THEN grace += 15 (same as genuine — intent tracked, not outcome)
IF player_helps THEN set reciprocity_pending = true; reciprocity_fire_probability = 0.5
IF reciprocity_pending = true AND trail_legs_since_cwm >= 2 THEN roll reciprocity_fire_probability
IF reciprocity_fires THEN select appropriate Stranger Returns event from table; clear reciprocity_pending
// NEVER reveal to student whether recipient was genuine or deceptive during gameplay
// Teacher dashboard flags deceptive events; student never sees this

// AI Historian
IF historian_enabled = false THEN historian_ui_hidden completely
IF historian_enabled = true AND access_mode = 'prompted' THEN historian_accessible only at rest points + 30s post-event window
IF historian_enabled = true AND access_mode = 'free' THEN historian_accessible at all rest points
IF historian_query fires THEN log { student_id, timestamp, game_context_snapshot, question, response }
IF api_key_invalid OR api_unreachable THEN historian_shows graceful error; game continues unaffected

// AI Personalized Examination of Conscience
IF exam_conscience_ai_enabled = true AND game_complete THEN send event_log to Haiku; render returned text
IF exam_conscience_ai_enabled = false THEN render templated reflection text from event_log

// AI NPC Encounters
IF npc_encounters_enabled = true AND student_at_mission_or_fort THEN show "Speak with [character]" option
IF npc_conversation_exchanges >= 3 THEN character ends conversation gracefully
IF npc_api_fails THEN hide NPC option silently; game continues

// Teacher Insight Generator
IF teacher_clicks_generate_insights THEN send anonymized aggregate session data to Haiku; render returned prompts
IF insight_api_fails THEN show error message; session data not lost

// Knowledge Panel
IF landmark_reached OR major_event_fires THEN load matching card_ids from knowledge_panel.json
IF student_clicks_card THEN log { student_id, card_id, timestamp }; mark card as read

// Feedback
IF teacher_clicks_feedback THEN construct Google Form URL with session metadata; open in new tab
IF VITE_FEEDBACK_FORM_URL not set THEN hide feedback link
```

Illness progression:
- Illness strikes randomly based on terrain, water source, and rations
- Severity determined on event trigger
- Rest reduces severity; continuing travel at Grueling pace worsens it
- Untreated illness: Good → Fair → Poor → Critical over 3–7 trail days; Critical → Dead in 1–3 days

---

## 6. Data Requirements

### Student Game State (stored per session)
```
session_code: string
student_id: string (generated)
student_name: string
grade_band: 'k2' | '3_5' | '6_8'
party_members: [{ name, health_status, alive }]
chaplain_in_party: boolean
profession: enum
current_landmark: string
trail_day: int
game_date: date
cash: float
food_lbs: float
clothing_sets: int
ammo_boxes: int
spare_parts: { wheels, axles, tongues }
oxen_yokes: int
pace: enum
rations: enum
morale: int (0–100)
grace: int (0–100)  // invisible to student
sunday_rests_taken: int
sunday_rests_skipped: int
cwm_events: [{ event_type, date, choice: helped|declined, recipient_genuine: boolean, reciprocity_fired: boolean }]
reconciliation_events: [{ sin_event_ref, fired: boolean, taken: boolean, declined: boolean }]
reconciliation_pending: boolean
reciprocity_pending: boolean
last_rites_fired: boolean
feast_days_encountered: [string]
moral_labels_dismissed: [string]  // card IDs the student dismissed without reading
knowledge_cards_read: [string]
historian_transcript: [{ timestamp, game_context, question, response }]
npc_transcripts: [{ location, character, timestamp, exchanges: [{question, response}] }]
event_log: [{ date, event_type, outcome, description, moral_label_id: string|null }]
score: int
grace_adjusted_score: int
life_in_oregon_narrative: string  // set at game completion
status: active | paused | completed | failed
```

### Session Configuration (teacher-level)
```
session_code: string
teacher_password: string (hashed)
created_at: timestamp
status: active | closed
grade_band: 'k2' | '3_5' | '6_8'
students: [student_ids]
settings: {
  historian_enabled: boolean
  historian_model: string
  historian_api_key: string (server-side only)
  historian_access_mode: 'free' | 'prompted'
  ai_exam_conscience_enabled: boolean
  ai_npc_enabled: boolean
  moral_label_mode: 'full' | 'post_choice' | 'discussion_only'
  scripture_in_labels: boolean
  cwm_reveal_end_screen: boolean
  chaos_level: 'low' | 'standard' | 'high'
}
```

### Persistence
- MVP: **localStorage + in-memory server state** (no database required)
- Student state stored client-side; synced to server on each action
- If student refreshes browser, game resumes from last saved state
- Session data lives only for duration of class period (no long-term storage required)

---

## 7. Integrations and Dependencies

| Dependency | Purpose | Notes |
|------------|---------|-------|
| **React** | Frontend framework | Vite + React recommended |
| **Canvas API or Pixi.js** | Hunting mini-game, animated scenes | Pixi.js preferred for performance |
| **CSS Animations / Framer Motion** | Weather effects, transitions | |
| **WebSocket or polling** | Real-time teacher dashboard sync | Simple polling (10s) acceptable for MVP |
| **Node.js + Express** | Backend: session state, API proxy, insight generator | |
| **Anthropic API** | Historian, NPC encounters, Exam of Conscience, Teacher Insights | claude-haiku-4-5 default; server-side proxy only |
| **Knowledge Panel JSON** | Static preloaded historical content | Bundled with app; no runtime API needed |
| **Google Forms** | Teacher feedback | URL-only integration; form created separately |
| **No database for MVP** | In-memory state only | Add Firebase/Firestore in v2 if needed |

> **⚠️ API Key Security:** The teacher's Anthropic API key must NEVER be exposed to the client/browser. All API calls proxy through Node.js. Key absent from all client-side code, logs, and network responses.

**Environment variables required:**
```
VITE_FEEDBACK_FORM_URL=<Google Form base URL>
ANTHROPIC_API_KEY_STORAGE=session  # key stored in server memory per session, never persisted
LOG_LEVEL=info
PORT=3000
```

---

## 8. Out of Scope (Not Building Yet)

- User accounts / login system (MVP uses session codes only)
- Long-term data persistence across class periods
- Multiplayer interactions between student games
- AI-generated event content (all events are pre-scripted)
- Mobile-native app (web-only, but should be tablet-friendly)
- Accessibility compliance beyond basic keyboard navigation
- LMS integration (Google Classroom, Canvas)
- Leaderboard persistence across sessions

---

## 9. Open Questions — Items Requiring Chris's Input

| # | Question | Why It Matters | Default If No Answer |
|---|----------|----------------|----------------------|
| 1 | **Game name** — "The Long Way Home" or something else? | Branding, avoids HMH IP issue | Use "The Long Way Home" |
| 2 | **Art style** — Illustrated storybook vs. modern pixel art vs. 3D flat? | Drives entire visual build | Illustrated storybook / warm palette |
| 3 | **Session persistence** — Should teacher be able to save and resume sessions next class period? | Determines if we need a real database | No — single-session only for MVP |
| 4 | **Teacher auth** — Simple password or Google Auth? | Complexity + security tradeoff | Simple password |
| 5 | **Screen target** — What devices are students using? Chromebooks, iPads, desktops? | Affects responsive design priorities | Chromebook (landscape, 1366×768) |
| 6 | **Class size** — How many students max per session? | Affects dashboard grid layout | 30 students |
| 7 | **Chaplain naming** — "Jesuit" or "Franciscan" or generic "trail friar"? | Historical accuracy, denominational sensitivity | Generic "trail friar" — teacher can contextualize |
| 8 | **Grace meter visibility** — Should students ever see any hint of the Grace system, or purely invisible throughout? | Affects whether virtue feels discovered or meta-gamed | Fully invisible — students feel it, never see it |
| 9 | **Historian persona depth** — Should the Historian have a name and illustrated portrait, or stay as a journal interface? | Immersion vs. build complexity | Named journal ("The Trail Record") with no character portrait for MVP |
| 10 | **Who provides the API key** — School-level key managed by IT, or teacher enters their own per session? | Operational workflow | Teacher enters own key at session setup |

> ✅ **Resolved from prior version:** CWM labeling and Examination of Conscience reveal are now teacher-configurable settings (see Section 4D Teacher Configuration Settings).

> **⚠️ No D64 disk image needed.** This is a full rebuild from scratch in React/Node.js using only the gameplay mechanics (which are not copyrightable). No original MECC code, assets, or media will be used.

---

## 10. Success Criteria

| Criterion | Measure |
|-----------|---------|
| Student can complete a full game end-to-end | Start → Independence → Willamette Valley (win or death) without errors |
| Teacher dashboard shows all students in real time | Latency under 15 seconds; all active students visible |
| Teacher pause/resume works across all sessions | All student games freeze within 5 seconds of teacher command |
| Game is playable on classroom Chromebooks | No crashes; 60fps or better on 4+ year old hardware |
| Event system fires correctly | All 20+ event types trigger, resolve, and update state correctly |
| Hunting mini-game works | Ammo consumed, food gained, displayed correctly |
| River crossing decisions reflect correct probability | Test 100 fords at >5ft depth — 60% should result in loss |
| Session export produces accurate CSV | All fields populated including CWM, Grace, deceptive flags, Knowledge Panel, NPC data |
| No original MECC IP used | Zero borrowed code, assets, or copyrighted content |
| Teacher can onboard class in under 5 minutes | Session code generated, shared, and students joined |
| CWM events fire correctly | 1–3 events per playthrough; at least 1 guaranteed past Fort Laramie; never fires in crisis |
| Deceptive charity fires at ~25% of CWM events | Test 100 sessions — deceptive rate within 20–30% |
| Grace tracks intent not outcome | Deceptive recipient still yields Grace +15 when player helps |
| Stranger reciprocity fires ~50% when eligible | 2+ trail legs since CWM; correct Stranger Returns event selected |
| Recipient deception never revealed to student | No UI, text, or log entry in student view exposes deceptive flag |
| Sunday rest mechanic functions | Rest recovers health tier; skip provides no bonus; morale tracked correctly |
| Last Rites scene triggers correctly | Only fires with chaplain in party + member dying; morale reduction applies |
| Grace meter invisible to students | No UI element in student view exposes Grace value |
| Arrival scene varies by Grace | High and low Grace yield distinct narrative text on end screen |
| Knowledge Panel cards load contextually | Correct card IDs load per landmark and event type; wrong-context cards never shown |
| Knowledge Panel does not interrupt gameplay | Cards only accessible at rest points; no auto-pop during active events |
| AI Historian responds in context | References current landmark, date, and recent event |
| AI NPC encounters cap at 3 exchanges | Character closes naturally after 3; no 4th exchange possible |
| Personalized Exam of Conscience references specific events | Student's actual party names and decisions appear in AI-generated text |
| Teacher Insight Generator produces relevant prompts | Output references actual class data, not generic suggestions |
| API key never in client | Verified by network inspection — key absent from all browser-visible requests/responses |
| All AI features fail gracefully | API down → game continues; student sees friendly error; no data lost |
| Feedback link constructs correct URL | Google Form pre-populated with session metadata |
| Teacher settings propagate within 10 seconds | Toggling any setting reflects in active student sessions promptly |

---

## Logging Infrastructure (Required)

Claude Code must implement logging at these layers:

**Client-side (browser console + log buffer)**
```javascript
// All game state transitions logged
logger.info('EVENT_FIRED', { type, date, outcome, partyState })
logger.warn('HEALTH_CRITICAL', { member, cause, trailDay })
logger.error('STATE_SYNC_FAILED', { studentId, error, retryCount })
logger.info('GRACE_CHANGED', { studentId, delta, newValue, trigger })
logger.info('HISTORIAN_QUERY', { studentId, question, gameContext })
logger.error('HISTORIAN_API_FAILED', { studentId, error, fallbackShown })
```

**Server-side (Node.js)**
```javascript
// Session-level logging
logger.info('STUDENT_JOINED', { sessionCode, studentId, timestamp })
logger.info('GAME_STATE_UPDATE', { studentId, landmark, partyHealth, grace })
logger.info('HISTORIAN_PROXIED', { studentId, tokenCount, model, latencyMs })
logger.error('SYNC_ERROR', { studentId, error, stack })
logger.error('API_KEY_ERROR', { sessionCode, error }) // Never log the key itself
```

- Log buffer stored in memory (last 100 events per student)
- Teacher dashboard includes hidden "Debug" panel showing last 10 errors per student
- Errors include copy-pasteable stack traces for Claude Code debugging sessions
- Log verbosity controlled by `VITE_LOG_LEVEL` environment variable (debug | info | warn | error)


---

## 11. UI Design Specification


---

### Design Philosophy

The game screen never scrolls. Every element is a flex child that proportionally shares available height — nothing demands more space than it's given. On small screens, content compresses gracefully; on large screens, it breathes. The aesthetic is warm parchment and frontier ink — Playfair Display for headings, Crimson Pro for body text. The player should feel transported, not like they're using a web app.

---

### Typefaces

Load via Google Fonts CDN:

```
https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap
```

| Role | Family | Weight | Size |
|------|--------|--------|------|
| Game title | Playfair Display | 700 | `clamp(13px, 1.8vw, 18px)` |
| Event title | Playfair Display | 700 | `clamp(15px, 1.8vw, 19px)` |
| Body / UI | Crimson Pro | 400 | `clamp(12px, 1.3vw, 14px)` |
| Choice labels | Crimson Pro | 700 | `clamp(13px, 1.4vw, 16px)` |
| Eyebrows / labels | Crimson Pro | 600 | 9.5–11px, uppercase, letter-spacing 1px |

`clamp()` ensures type scales proportionally between breakpoints rather than snapping.

---

### Color Tokens

```css
--parchment:  #f5ead8   /* page background */
--parch-dark: #ecdabc   /* resource bar background */
--amber:      #c2873a   /* primary accent */
--amber-dk:   #9a6828   /* amber hover / selected state */
--green:      #4a7c59   /* blessing events, healthy status, rest choice */
--red:        #b94040   /* crisis events, critical status, action choice */
--blue:       #4a6890   /* encounter events, moral choice */
--gold:       #c2a84f   /* grace meter, trail fill, header accents */
--ink:        #2c1f14   /* primary text */
--ink-lt:     #5a4030   /* secondary text */
--hdr:        #2c1f14   /* header background (same as ink — intentional) */
--border:     rgba(120,80,40,0.18)
```

---

### Layout — Three Breakpoints

The root element receives a class (`bp-desktop`, `bp-tablet`, `bp-mobile`) set by a `useWindowWidth` hook. This is preferred over CSS-only media queries because it also controls JSX logic (which chips to show, face sizes, etc.).

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Desktop | ≥ 1024px | Side-by-side: scene 44% left, panel 56% right |
| Tablet | 640–1023px | Stacked: scene 38% top, panel 62% bottom |
| Mobile | < 640px | Stacked: scene 30% top, panel 70% bottom |
| Landscape phone | any width, height < 480px | Override to side-by-side regardless of bp class |

**Critical CSS rules for no-scroll:**
```css
html, body, #root { width: 100%; height: 100%; overflow: hidden; }

.game-root { width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; }

/* Every flex container must have this pair to allow shrinking */
flex: 1;
min-height: 0;   /* ← without this, flex children refuse to shrink */
overflow: hidden;
```

---

### Fixed Chrome Heights

```css
--hdr-h:  48px   /* header bar */
--res-h:  38px   /* resource bar */
```

Everything else flexes to fill the remaining space.

---

### Header Bar

**Height:** 48px  
**Background:** `#2c1f14`  
**Bottom border:** 2px solid `--amber-dk`

Three regions in a horizontal flex row (`justify-content: space-between`):

### Left — Title Group
- **Game title:** Playfair Display 700, `--gold`, `clamp(13px, 1.8vw, 18px)`, `white-space: nowrap`
- **Era subtitle:** 10px, uppercase, `rgba(245,234,216,0.48)`, hidden on mobile

### Center — Chips + Weather
Pill-shaped chips (`border-radius: 20px`, `background: rgba(255,255,255,0.08)`, `border: 1px solid rgba(255,255,255,0.12)`):
- `📅 Aug 14, 1848` — always visible
- `Day 112` — hidden on mobile
- `Steady Pace` — desktop only
- **Weather Widget** (interactive pill, cycles sunny → rainy → stormy on click):
  - Shows emoji icon + label + temperature in two stacked lines
  - `sunny`: ☀️ Sunny 74°F
  - `rainy`: 🌧️ Rainy 58°F
  - `stormy`: ⛈️ Stormy 52°F

### Right — Grace Meter
Horizontal row: `✝` cross icon · "Grace" label · pip track · numeric value

**Pip track:** 10 small rectangles (`12px × 6px`, `border-radius: 2px`), filled color based on value:
- > 70: `--gold` (`#c2a84f`)
- 41–70: muted green (`#9aaa6a`)
- ≤ 40: `--red`

On mobile: reduce to 5 pips, hide "Grace" text label.

---

### Resource Bar

**Height:** 38px  
**Background:** `--parch-dark`  
**Bottom border:** 1px solid `--border`

Six resource items in equal-width flex columns (`flex: 1` each, `border-right: 1px solid --border`, last child no border):

| Icon | Label | Warn |
|------|-------|------|
| 🌾 | Food | — |
| 💰 | Cash | — |
| 🔫 | Ammo | ⚠️ red value |
| 🔧 | Spares | — |
| 💊 | Medicine | ⚠️ red value |
| 🐂 | Oxen | — |

Each item: emoji icon (14px) + two-line text block (value in `--ink` 700, label in 9px uppercase `--ink-lt` 60% opacity). Warning items: value color switches to `--red`. Text uses `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` — never wraps.

---

### Scene Column (Left / Top)

### Trail Scene Canvas

Fills all available height above the trail progress bar. Pure CSS/SVG scene — no image assets required.

**Sky gradient** (changes with weather):
```css
sunny:  linear-gradient(180deg, #4a90d9 0%, #a8d0f0 55%, #d4e8c2 100%)
rainy:  linear-gradient(180deg, #5a6a7a 0%, #8a9aaa 50%, #aab8aa 100%)
stormy: linear-gradient(180deg, #2a3040 0%, #4a5060 50%, #6a7068 100%)
```

**Scene layers (bottom to top):**
1. **Far hill** — `width: 140%`, `left: -20%`, `height: 36%`, `bottom: 27%`, `background: #5a7c4a`, `opacity: 0.75`, `border-radius: 50% 50% 0 0`
2. **Mid hill** — `width: 120%`, `left: -10%`, `height: 28%`, `bottom: 21%`, `background: #6a8c5a`
3. **Road** — `height: 28%` from bottom, `linear-gradient(180deg, #c8a870, #b89050)`. Dashed center line via `::after` pseudo-element (`left: 48%; right: 48%; border-left/right: 1px dashed rgba(255,220,120,0.28)`)
4. **Trees** — CSS div trees (trunk + crown). Placed at `left: 7% bottom: 28%`, `left: 76% bottom: 27%`, `left: 85% bottom: 33%`. Crown: `background: #3a6830`, `border-radius: 50% 50% 40% 40%`, inner shadow.
5. **Clouds** — Two CSS clouds with `::before`/`::after` pseudo-elements for puffiness. Second cloud scaled to 68%. On travel: animate `translateX` drift.
6. **Wagon group** — Positioned `bottom: 20%; left: 38%`. Comprises two 🐂 ox emojis + CSS wagon (canvas top + bed + two wheels).
7. **Weather overlays** — Storm: dark rgba overlay `rgba(20,20,40,0.32)`. Rain/storm: `N` rain-drop divs animated with `translateY(110%) rotate(10deg)`.

**Travel animation** (triggered when player chooses "Push Forward"):
```css
@keyframes wagonTravel {
  0%   { left: 38%; }
  35%  { left: 47%; }
  65%  { left: 30%; }
  100% { left: 38%; }
}
/* Duration: 3.5s ease-in-out forwards */
```
Wagon body also wobbles vertically (`translateY -2px` at 50%, `0.35s` cycle). Dust puff animates off the back-left with `scale()` + `translateX` keyframes.

Cloud drift animation runs during travel (`3.5s ease-in-out infinite alternate`).

### Trail Progress Bar

**Background:** `#2c1f14` (dark ink)  
**Padding:** `9px 13px 11px`  
Fixed height — never flexes.

**Header row:** "🗺️ Trail to Oregon" (gold, 11px, 600) + miles counter (10px, 48% white) space-between.

**Trail track:** `height: 6px`, `border-radius: 3px`, light white background. Gold gradient fill to current position.

Seven landmark markers positioned absolutely along the track:
- **Done:** gold filled dot (14px circle)
- **Ahead:** dim white filled dot
- Name label 8px below each dot (hidden on mobile to prevent overlap)

**Wagon emoji** (`🐂`) positioned at current mile percentage with gold drop shadow.

**Next stop row:** "Next: [Name]" label · progress bar (`flex: 1`) filled green · distance string (gold). All `white-space: nowrap`.

---

### Panel Column (Right / Bottom)

The panel column is a vertical flex container. Children share the height proportionally — no child ever causes overflow. `overflow: hidden` on every container.

### Flex weights

| Section | Flex value | Notes |
|---------|-----------|-------|
| Event panel | `flex: 3` | ~30% of panel |
| Party label + grid | `flex-shrink: 0` | Exactly as tall as the cards need |
| Choices section | `flex: 4` | Fills all remaining space |

### Event Panel

Left border 4px, color by event type:

| Type | Border | Background tint |
|------|--------|----------------|
| crisis | `--red` | `rgba(185,64,64,0.05)` |
| blessing | `--green` | `rgba(74,124,89,0.05)` |
| encounter | `--blue` | `rgba(74,104,144,0.05)` |
| moral | `--amber` | `rgba(194,135,58,0.05)` |

**Structure (flex column, gap 4px):**
1. **Eyebrow** — "⚡ What Just Happened", 9.5px uppercase, `--ink-lt` 60% opacity
2. **Title** — Playfair Display 700, `clamp(15px, 1.8vw, 19px)`. `-webkit-line-clamp: 2` — never blows out on long titles.
3. **Body** — `clamp(12px, 1.3vw, 14px)`, line-height 1.5, `-webkit-line-clamp: 3` — gracefully truncates at 3 lines.
4. **Moral badge** — pill shape, solid color background (set per event), white text 11px 600. Color examples: Perseverance `#c2873a`, Courage `#b94040`, Charity `#4a7c59`. `align-self: flex-start`.

### Party Section

Section eyebrow label: 9.5px uppercase, `--ink-lt` 60% opacity. Padding `6px 14px 0`.

Party grid: `display: grid`, columns based on breakpoint:
- Desktop: `1fr 1fr` (2×2)
- Tablet + Mobile: `repeat(4, 1fr)` (all four in a row)

**Party card:**  
`background: rgba(255,252,245,0.85)`, `border: 1px solid --border`, `border-radius: 7px`, `padding: 6px 8px`

Sick: amber border tint. Critical: red border tint. Dead: `opacity: 0.45; filter: grayscale(0.8)`.

**Inside each card — horizontal flex:**

**Character face (SVG, drawn in code — no image assets):**
- Ellipse hair (color by role)
- Ellipse face (skin tone by role)
- Two rosy cheek ellipses (pink, 40% opacity)
- Two eye ellipses + white shine circles
- Mouth path — SVG quadratic curve, shape based on mood:
  - `happy`: upward curve
  - `neutral`: horizontal line
  - `worried`: downward bow
  - `grim`: sharp inverted V
- Status dot (top-right, 9px radius): green=healthy, amber=sick, red=critical, grey=dead

Face sizes: 48px desktop/tablet, 40px mobile.

**Text details (flex column):**
- Name: `clamp(12px, 1.2vw, 14px)` 700, ellipsis overflow
- Role: 10px, `--ink-lt` 55% opacity
- Health bar: 4px height, color: green >70, amber 41–70, red ≤40
- Status text: 10px 600, same color as health bar

### Choices Section

`flex: 4` — owns the remaining panel height. Padding `0 14px 10px`. Top border `1px solid --border`.

Section label: same eyebrow style. When a choice is selected, appends `→ [Choice Name]` in amber-dark 700.

**Choices list:** `flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 5px`

**Each choice button:** `flex: 1` — all four share height equally. Never a fixed height.

```
[Emoji]  [Label text        ]  [›]
         [Sublabel text      ]
```

- **Emoji:** `clamp(18px, 2vw, 22px)`, `flex-shrink: 0`
- **Label:** `clamp(13px, 1.4vw, 16px)`, 700, `--ink`, ellipsis
- **Sublabel:** `clamp(10px, 1vw, 12px)`, `--ink-lt` 75% opacity, `-webkit-line-clamp: 2`
- **Chevron `›`:** 20px, color = tone accent, `flex-shrink: 0`
- **Sublabels hidden** on tablet/mobile 2-col grid (too small to read)

**Tone accent colors** (used for border + chevron when selected):

| Tone | Color | Use case |
|------|-------|----------|
| action | `#b94040` | Push forward, hunt, cross river |
| rest | `#4a7c59` | Rest, camp, wait |
| moral | `#5a7aaa` | Help others, share supplies |
| faith | `#c2a84f` | Pray, reflect, seek guidance |

**Default state:** `border: 1.5px solid rgba(120,80,40,0.22)`, `background: rgba(255,250,242,0.9)`

**Hover:** `border-color: --amber`, `background: rgba(245,234,216,1)`, `transform: translateX(3px)`

**Selected:** border = tone accent, background = tone accent at 8% opacity, `box-shadow: 0 0 0 2px [accent]28`, `transform: translateX(3px)`

---

### Responsive Behavior Summary

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Layout | Side-by-side | Stacked | Stacked |
| Scene height | ~65% of screen | 38% | 30% |
| Header era subtitle | Visible | Visible | Hidden |
| Header "Steady Pace" chip | Visible | Hidden | Hidden |
| Header "Day 112" chip | Visible | Visible | Hidden |
| Grace meter pips | 10 | 10 | 5 |
| "Grace" text label | Visible | Visible | Hidden |
| Party grid | 2×2 | 4-across | 4-across |
| Choices layout | 1-column | 2×2 grid | 2×2 grid |
| Choice sublabels | Visible | Hidden | Hidden |
| Landmark names on trail | Visible | Visible | Hidden |
| Face size | 48px | 48px | 40px |

---

### Animations

| Animation | Trigger | Duration | Notes |
|-----------|---------|----------|-------|
| Wagon travel | "Push Forward" choice | 3.5s | Left position: 38→47→30→38%, ease-in-out |
| Wagon wobble | During travel | 0.35s loop | `translateY(-2px)` at 50% |
| Dust puff | During travel | 0.85s loop | scale + translateX off wagon rear |
| Cloud drift | During travel | 3.5s / 4.2s alternate | Both clouds drift left simultaneously |
| Rain fall | Weather = rainy/stormy | 0.75s / 0.5s loop | `translateY(110%) rotate(10deg)` |
| Grace pip fill | Any grace change | 0.3s | CSS `transition: background 0.3s` |
| Trail fill | Mile update | 0.5s | CSS `transition: width 0.5s` |
| Health bar | Health change | 0.4s | CSS `transition: width 0.4s` |
| Choice hover | Hover | 0.12s | `translateX(3px)` |

**Performance note:** All animations are CSS-only (no JS animation loops). Rain uses `N` static divs with staggered `animation-delay`, not dynamically spawned elements. Total animation cost is minimal — suitable for Chromebook hardware.

---

### Landmark Data Reference

| Short | Full Name | Mile |
|-------|-----------|------|
| Start | Independence, MO | 0 |
| Kearny | Fort Kearny | 307 |
| Chimney | Chimney Rock | 521 |
| Laramie | Fort Laramie | 667 |
| S.Pass | South Pass | 932 |
| Ft.Hall | Fort Hall | 1,288 |
| Oregon | Oregon City | 2,170 |

---

### Implementation Notes for Claude Code

1. **No-scroll is structural, not cosmetic.** Every flex container needs `min-height: 0` or it will refuse to shrink and cause overflow. This is the most common mistake.

2. **Choice buttons must be `flex: 1` inside a flex-direction column.** Do not give them a fixed height. On short screens they compress; on tall screens they expand. The font `clamp()` values ensure text remains readable at both extremes.

3. **`-webkit-line-clamp`** is the correct tool for graceful text truncation inside fixed containers. Use it on event body (3 lines) and choice sublabels (2 lines).

4. **Weather state lives in React**, not CSS classes on the body. The sky gradient, rain divs, and storm overlay are all conditionally rendered based on a `weather` state string (`"sunny" | "rainy" | "stormy"`).

5. **Character faces are procedural SVG** — no image files needed. The face is parameterized by `member.role` (skin/hair color), `member.mood` (eye shape + mouth curve), and `member.status` (status dot color). Size is a prop (`size={48}`).

6. **Breakpoint class** (`bp-desktop`, `bp-tablet`, `bp-mobile`) is set on `.game-root` by a `useWindowWidth` hook, not via CSS media queries alone. This allows JSX logic (conditional chip rendering, face sizes) to stay in sync with layout.

7. **Trail progress bar background is `#2c1f14`** (same as header). This creates a visual anchor — dark bookends (header + trail) frame the parchment content between them.

8. **Resource bar uses `overflow: hidden`**, not `overflow-x: auto`. At the target sizes (tablet+) all six items fit comfortably with `flex: 1` equal columns. If a future build adds more resources, consider switching to scroll or using `display: grid` with `minmax`.

---

## 12. Enhancement Features (Post-MVP)

*These features are additive — the base game (sections 1–10) is fully playable without them. Build the base game first, then layer these in.*

### 12.1 Replayability Enhancements

### 1A. Expanded Event Pool

**Current state:** ~30 distinct events.  
**Target:** 150+ distinct events across all categories.

The AI Historian integration already connects to the Anthropic API. Use the same infrastructure to *generate and validate* new historically grounded events during a build phase — not at runtime. Events are generated, reviewed for historical accuracy and age-appropriateness, then committed to `events.json` as static content. Players never know which events are AI-authored vs. hand-written.

**Event generation prompt (build-time, not runtime):**
```
Generate 10 historically accurate Oregon Trail events for [category] suitable for [grade band].
Each event must: reference a real historical condition of the 1848 trail, present a meaningful
choice, have 2-3 resolution outcomes, and include a Catholic moral dimension where natural.
Return JSON matching the events.json schema.
```

**Target event distribution (150+ total):**

| Category | Current | Target |
|----------|---------|--------|
| Weather events | 4 | 18 |
| Illness events | 7 | 22 |
| Trail hazards | 5 | 20 |
| Resource events | 4 | 15 |
| Good fortune events | 4 | 15 |
| Corporal Works of Mercy | 10 | 30 |
| Stranger encounters | 3 | 20 |
| Historical figure encounters | 0 | 12 |
| Native American interactions | 0 | 10 (respectful, historically grounded) |
| Catholic feast / mission events | 3 | 12 |
| Party member-specific events | 0 | 16 (triggered by personality type) |

**Per-run draw:** Each playthrough draws from the pool using weighted random selection. Events flagged as "rare" (weight < 0.1) fire at most once across a player's entire history — creating genuine discovery moments even on run 50.

**Event history tracking:** Per student account (Premium) or per browser session (Basic), the engine tracks which events have fired. Rare events that have already fired are deprioritized on subsequent runs so new content surfaces naturally.

---

### 1B. Branching Trail Routes

**Current state:** One fixed 15-landmark trail.  
**Target:** Three distinct routes with different landmark sets, terrain, event pools, and Catholic historical content.

Route selection is a meaningful early decision with asymmetric tradeoffs — not just cosmetic variation.

#### Route 1: The Main Trail (Oregon Trail)
*Current path. Default for first-time players.*
- Independence MO → Platte River → Fort Kearney → Chimney Rock → Fort Laramie → South Pass → St. Mary's Mission → Fort Bridger → Fort Hall → Snake River → Fort Boise → Whitman Mission → Blue Mountains → The Dalles → Willamette Valley
- Balanced difficulty. Well-traveled — lower random hazard but more competition for resources at forts.
- Catholic anchor: Jesuit missions, Whitman Mission

#### Route 2: The Southern Cutoff (Hastings Cutoff variant)
*Unlocked after 1 completed run. Faster but dangerous.*
- Diverges at Fort Bridger — skips Fort Hall entirely, cuts through Nevada desert
- Significantly shorter in time but: extreme heat events, water scarcity, no fort resupply
- Higher stakes. The Donner Party took a variant of this route — historical anchor for discussion
- Catholic anchor: fewer missions, more isolated — tests self-reliance vs. community
- Unique events: desert dehydration, mirage events, abandoned wagon camps

#### Route 3: The Northern Mountain Route
*Unlocked after 3 completed runs.*
- Takes the longer northern path through Montana territory
- Longer calendar but: more water, cooler temps, more mission stops
- Higher probability of Catholic historical figure encounters (Fr. De Smet traveled this region extensively)
- Catholic anchor: St. Ignatius Mission, multiple Jesuit outposts
- Unique events: Blackfoot and Flathead tribal encounters, mountain weather extremes, fur trader camps

**Route selection UI:** After supply purchase, a hand-drawn map card appears showing the three routes with brief descriptions of the tradeoffs. For K–2: always Main Trail. For 3–5 and 6–8: player chooses.

**Route data structure:**
```json
{
  "routes": {
    "main_trail": {
      "id": "main_trail",
      "display_name": "The Main Trail",
      "unlock_condition": "always",
      "landmarks": [...],
      "event_pool_modifiers": { "weather_hot": -0.2, "water_scarcity": -0.3 },
      "catholic_sites": ["st_marys_mission", "whitman_mission"]
    },
    "southern_cutoff": {
      "unlock_condition": "runs_completed >= 1",
      ...
    },
    "northern_mountain": {
      "unlock_condition": "runs_completed >= 3",
      ...
    }
  }
}
```

---

### 1C. Cascading Consequence Chains

**Current state:** Most events are independent — one event fires, resolves, closes.  
**Target:** Key decisions create flags that gate or modify content 2–6 trail legs later.

This is the single biggest driver of emergent storytelling. Events that feel like throwaway choices in run 1 reveal their consequences in run 5.

**Implementation:** Each event can set `consequence_flags` on game state. Downstream events check for flags before firing or modify their resolution based on flags present.

**Cascade examples:**

| Trigger Event | Flag Set | Downstream Effect (2-6 legs later) |
|---------------|----------|-------------------------------------|
| Took in the abandoned child at Fort Kearney | `child_elena_in_party` | Child knows a mountain pass shortcut — reduces blizzard risk at South Pass by 25% |
| Forgave the food thief | `forgave_thief` | Same person reappears at a river crossing — offers to help caulk your wagon |
| Exploited the desperate trader | `exploited_garcia` | Garcia family spreads word — fort prices increase 15% at next two stops |
| Shared water at dry crossing | `shared_with_morrison` | Morrison family catches up to you — brings 40 lbs of dried meat as thanks |
| Declined to bury the settler | `unburied_settler` | Another traveler mentions the unburied grave with horror — party morale -5, chaplain (if present) is visibly troubled |
| Overhunted bison | `bison_depleted` | Subsequent hunting events in same region return 40% less food |
| Pushed sick party member at Grueling pace | `overworked_thomas` | Thomas develops chronic weakness — permanent health tier reduction for rest of trail |
| Prayed during every crisis | `consistent_prayer` | At a mission stop, the chaplain or priest notes the party's faithfulness — morale restoration event fires |
| Helped 3 CWM events in a row | `pattern_of_mercy` | A traveler you helped earlier has told others — one guaranteed positive stranger encounter fires |

**Flag persistence:** Flags persist on `gameState.consequence_flags[]`. Claude Code should implement a simple flag evaluation engine that checks flags at event fire time.

**Cascade depth limit:** No cascade should exceed 3 levels deep (trigger → consequence → consequence) to prevent complexity explosion in MVP.

---

### 1D. Hidden Achievements and Unlockable Content

Content that only surfaces under specific, non-obvious conditions. Students who've played 20 times are still finding new things. Never shown in a checklist — discovery is the reward.

**Hidden encounter events (fire only under specific conditions):**

| Achievement | Condition | What Happens |
|-------------|-----------|--------------|
| The Faithful Party | Grace ≥ 80 by Independence Rock | A Jesuit priest rides alongside your wagon for one leg — unique illustrated scene, morale fully restored |
| The Reluctant Saint | Helped every CWM event but Grace still < 40 (helped but also exploited) | End-screen reflection includes a specific line: "You gave with one hand and took with the other. The trail noticed." |
| The Prodigal | Depleted Grace player takes a Reconciliation event in the final third of trail | Unique arrival scene variant — not the hollow ending, not the triumphant one. Something in between. |
| The Historian | Student has clicked 10+ Knowledge Panel cards across their runs | A special journal entry unlocks in the Trail Historian — a longer historical narrative about the trail's real death toll |
| The Unbreakable | Party reaches Willamette Valley with all 5 members alive | Rare achievement — unique end screen art, noted in teacher dashboard |
| Desert Survivor | Completes Southern Cutoff without losing a party member | Extremely rare. Unique narrative paragraph. |
| Friend of the Missions | Visits both Catholic mission stops AND has chaplain AND Grace ≥ 75 | Mission stop triggers a unique blessing scene with gameplay effect: one future illness automatically reduced in severity |

**Teacher visibility:** Teacher dashboard shows which achievements each student has unlocked. Useful for discussion: "Three of you found the hidden Prodigal ending — who can tell us what that means?"

---

### 1E. Larger NPC and CWM Pools

**CWM pool expansion:** From ~10 to 30 distinct CWM event variants across the 7 Works. Each Work has at least 4 distinct event scenarios — same moral principle, different historical context.

*Feed the Hungry — 4 variants:*
1. Starving emigrant family (current)
2. Native American family displaced from their land (adds historical complexity)
3. Mormon pioneer group (religious difference — same humanity)
4. Escaped enslaved person heading north (deeply serious; 6–8 only — teacher can disable)

**NPC encounter pool expansion:** From 4 named characters to 15+.

| Character | Location | Historical Basis | Grade Band |
|-----------|----------|-----------------|------------|
| Fr. Pierre-Jean De Smet, SJ | Northern Route / St. Mary's Mission | Real Jesuit — traveled the trail multiple times | 3–5, 6–8 |
| Marcus Whitman | Whitman Mission | Real figure; complex history | 6–8 |
| Narcissa Whitman | Whitman Mission | First white woman to cross Rockies | 6–8 |
| Jim Bridger | Fort Bridger | Real fur trapper; knew the trail better than anyone | 3–5, 6–8 |
| Tamsen Donner | Southern Cutoff only | Deeply sobering; only fires if player takes the southern route | 6–8 |
| Chief Washakie | South Pass area | Shoshone leader; genuinely helpful to emigrants | 3–5, 6–8 |
| An emigrant diarist | Any rest point | Composite — based on real trail diaries (Amelia Knight, etc.) | 3–5, 6–8 |
| Fr. Blanchet | Fort Vancouver / The Dalles | Real Catholic missionary in Oregon Territory | 6–8 |
| A freed Black emigrant | Main Trail | Composite; Black emigrants were on the trail | 6–8 |
| Young Pawnee guide | Fort Kearney area | Composite; Pawnee scouts were common | 3–5, 6–8 |
| A Protestant minister | Any fort | Creates natural dialogue about shared faith and difference | 3–5, 6–8 |

All NPC encounters are AI-powered (existing Anthropic integration), constrained to 3 exchanges, period-appropriate voice, teacher-viewable transcripts.

---

### 2. Party Member Personality System

### 2A. Design Philosophy

Party members are no longer named health bars. Each has a **primary Working Genius** (Lencioni) and a **secondary MBTI pair** (two relevant dimensions). Together these create a personality profile that:

- Generates unique dialogue and reactions during events
- Provides passive mechanical bonuses/penalties based on situation type
- Creates party composition strategy — different combinations suit different routes
- Generates backend research data across thousands of runs

**The Catholic integration:** Different personality types will naturally incline toward different virtues and stumble on different sins. A Feeling-Judging type with Enablement genius will almost always help in CWM events. A Thinking-Perceiving type with Tenacity genius will push the party hard and resist Sunday rest. Neither is a bad person — they're wired differently, and the trail tests different things in different people. That's a discussion worth having.

---

### 2B. Working Genius — Primary Personality Layer

Patrick Lencioni's six Working Geniuses adapted for trail context:

| Genius | Trail Expression | Mechanical Bonus | Catholic Resonance |
|--------|-----------------|-----------------|-------------------|
| **Wonder (W)** | Always asking questions, noticing things others miss | Unlocks 1 additional Knowledge Panel card per landmark; auto-suggests AI Historian at rest points | Contemplative — the tradition of inquiry and wonder at creation |
| **Invention (I)** | Improvises solutions to problems | Wagon repair events: 25% better outcomes; river crossings: one additional creative option available | The creative gift — building something from nothing |
| **Discernment (D)** | Reads situations intuitively; often right | Before major decisions, party member speaks: "Something feels off about this crossing..." (probabilistic warning — correct 65% of the time) | Prudence — the capacity to judge rightly |
| **Galvanizing (G)** | Rallies the party when morale is low | When party morale drops below 30%, Galvanizing member triggers a morale recovery event (+15 morale) once per trail | Leadership as service — the gift of calling people forward |
| **Enablement (E)** | Naturally moves to help others | Grace +3 on all CWM events when this member is alive; player shown helping nudge ("Maria would want to stop...") | Charity as disposition — not just choice but character |
| **Tenacity (T)** | Drives through hardship, resists stopping | Illness recovery: +1 tier improvement chance per day; pace penalties reduced 20% | Fortitude — the capacity to endure |

**Working Genius Frustrations (each Genius has a corresponding weakness):**

| Genius | Frustration Expression | Mechanical Effect |
|--------|----------------------|------------------|
| Wonder | Paralysis when action is required | Indecision event: player prompted twice before choice locks (minor delay) |
| Invention | Boredom with routine; pushes unnecessary risks | Occasional "reckless idea" event fires — small gamble the player must manage |
| Discernment | Reluctance to commit without certainty | River crossing: Discernment member adds hesitation cost (half travel day) before player can choose |
| Galvanizing | Frustration when no one listens | If player ignores Galvanizing member's morale event, member health degrades slightly |
| Enablement | Burned out from always giving | After 2 CWM helping events, Enablement member health drops 1 tier (giving costs them) |
| Tenacity | Pushes past the point of wisdom | If pace = Grueling for 3+ consecutive legs, Tenacity member resists resting — player must override |

---

### 2C. Myers-Briggs Dimensions — Secondary Personality Layer

Two MBTI dimensions applied per party member (not all four — keeps it tractable):

**Dimension 1: Thinking (T) vs. Feeling (F)**

| Type | Trail Behavior | Mechanical Effect |
|------|---------------|-----------------|
| **Thinking** | Makes decisions on logic and efficiency; less naturally moved by suffering | No Grace nudge on CWM events; better at resource optimization (5% food efficiency) |
| **Feeling** | Deeply affected by others' suffering; moves toward helping | Grace nudge fires on CWM events ("James is visibly moved by the family's situation..."); morale drops more after party deaths |

**Dimension 2: Judging (J) vs. Perceiving (P)**

| Type | Trail Behavior | Mechanical Effect |
|------|---------------|-----------------|
| **Judging** | Thrives with structure, planning, and routine | Sunday rest bonus doubled for this member; benefits from Filling rations more than Meager |
| **Perceiving** | Adapts well to chaos; dislikes rigid structure | Random event penalties reduced 15%; chafes under Sunday rest (morale -2 if rest chosen when they're healthy) |

**Combined secondary profiles (4 combinations):**

| Profile | Shorthand | Character tendency |
|---------|-----------|-------------------|
| Thinking-Judging | TJ | Efficient, principled, disciplined — natural resource manager |
| Thinking-Perceiving | TP | Resourceful, pragmatic, adaptable — good in crisis, less generous |
| Feeling-Judging | FJ | Organized, caring, reliable — natural chaplain complement |
| Feeling-Perceiving | FP | Empathetic, spontaneous, creative — highest CWM engagement |

---

### 2D. Party Member Personality Profiles — Full Combination

Each party member has: `working_genius` (W/I/D/G/E/T) + `mbti_secondary` (TJ/TP/FJ/FP) = 24 distinct personality combinations.

With 5 party slots (student + 4 companions), the number of unique party compositions is large enough to support hundreds of meaningfully different runs.

**Data structure:**
```json
{
  "party_member": {
    "name": "Maria",
    "working_genius": "Enablement",
    "working_genius_frustration": "burnout_after_cwm",
    "mbti_secondary": "FJ",
    "personality_label": "The Faithful Helper",
    "trait_description": "Maria moves toward people in need — it's just who she is. But she gives until it costs her.",
    "mechanical_bonuses": ["grace_+3_on_cwm", "cwm_nudge_active"],
    "mechanical_penalties": ["health_-1_after_2_cwm_events"],
    "dialogue_style": "warm, concerned, action-oriented",
    "death_impact_modifier": 1.3
  }
}
```

**Personality labels (displayable names for the UI — warm, not clinical):**

| WG + MBTI | Label |
|-----------|-------|
| Enablement + FJ | The Faithful Helper |
| Galvanizing + FP | The Heart of the Party |
| Tenacity + TJ | The Steady Hand |
| Wonder + FP | The Dreamer |
| Discernment + TJ | The Quiet Advisor |
| Invention + TP | The Problem Solver |
| Tenacity + FJ | The Determined Caregiver |
| Galvanizing + TJ | The Natural Leader |
| Enablement + FP | The Open-Handed One |
| Wonder + TJ | The Thoughtful Observer |
| *... (24 total — full table in catholic.md)* | |

---

### 2E. Teacher Personality Controls

**At session creation, teacher chooses one of three modes:**

| Mode | Description | Best For |
|------|-------------|----------|
| **Randomized** | System assigns personality types randomly to all party members across all students | Default — maximizes variance and research data |
| **Teacher-assigned** | Teacher sets specific types for each party member slot (e.g., always put an Enablement FJ in slot 2) | Curriculum focus — e.g., "today we're studying Enablement genius" |
| **Student-chosen** | Students see simplified personality descriptions and pick for their party | Older grades; self-awareness discussion |

**Teacher personality dashboard panel:**
- Per student: shows Working Genius and MBTI profile of each party member
- Class view: distribution of personality types across the session
- Filter: "show me all students with a Tenacity primary" — useful for targeted discussion

---

### 2F. Party Personality Backend Metrics

This is where the project becomes genuinely fascinating outside the classroom.

The backend tracks personality type performance data across ALL sessions. Aggregate, anonymized. Over time this builds a dataset that has never existed before: how do different personality orientations affect moral decision-making, survival, and virtue formation in a simulated high-stakes environment?

**Metrics tracked per completed run:**

```
run_id: string
grade_band: string
route: string
party_composition: [{ working_genius, mbti_secondary }]
final_grace: int
party_survival_rate: float  (survivors / total)
cwm_events_helped: int
cwm_events_declined: int
cause_of_death_per_member: [{ member_personality, cause }]
sunday_rests_taken: int
historian_queries: int
arrival_narrative_tier: 'high' | 'moderate' | 'low' | 'depleted'
run_duration_minutes: int
```

**Research questions this dataset can answer:**

| Question | How Data Answers It |
|----------|-------------------|
| Which Working Genius primary has the highest survival rate? | Aggregate survival_rate by working_genius across 1000+ runs |
| Do Feeling types generate more Grace than Thinking types? | Correlate mbti_secondary with final_grace |
| Does having an Enablement member correlate with more CWM events taken? | Filter runs with Enablement in party vs. without; compare cwm_events_helped |
| Which personality combination is most likely to reach depleted Grace? | Cross-tab working_genius × mbti_secondary × arrival_narrative_tier |
| Does party personality diversity improve survival? | Measure variance in WG types × survival_rate |
| Do Wonder types use the AI Historian more? | Correlate working_genius with historian_queries |
| Which personality types are most likely to be "the last one standing"? | Track which personality slots survive when others die |

**Teacher-facing analytics (in-app):**

A "Class Research" tab in the teacher dashboard (Premium only) shows:
- Your class's aggregate data vs. all other sessions on the platform
- Simple visualizations: "Parties with an Enablement member helped strangers 68% more often"
- Anonymized class comparisons: "Your class's Grace average was in the top 30% of all sessions this month"

**The Catholic research angle:**

This dataset is genuinely original. A paper titled "Personality Orientation and Moral Decision-Making Under Scarcity: Evidence from a Catholic Educational Game" would be publishable in Catholic education or applied psychology journals. Aggregated across thousands of runs from Catholic schools, the data becomes a unique window into how Working Genius and MBTI dimensions predict virtue formation. 

Consider building a simple research portal (`research.[GAME_DOMAIN]`) where educators and researchers can query anonymized aggregate data.

---


---

### Monetization & Product Tiers

*Monetization and product tier details are maintained separately in `long-way-home/business_spec.md`.*

### 4. Data Requirements — Additions

### New Game State Fields (Premium)
```
working_genius_primary: string
mbti_secondary: string
consequence_flags: [string]
event_history: [string]  // event IDs fired across ALL runs (for rare event tracking)
route_selected: 'main_trail' | 'southern_cutoff' | 'northern_mountain'
runs_completed: int  // cross-session; requires account
achievements_unlocked: [string]
personality_label: string
```

### New Session Config Fields (Premium)
```
personality_mode: 'randomized' | 'teacher_assigned' | 'student_chosen'
personality_assignments: [{ slot: int, working_genius: string, mbti_secondary: string }]
route_mode: 'player_choice' | 'teacher_locked'
locked_route: string | null
event_pool_version: string  // tracks which event pool was active for research purposes
```

### Research Metrics Collection (Backend — Premium)
```
// Written to research store on run completion — never contains PII
research_run: {
  run_id: uuid (generated)
  session_date: date (no time)
  grade_band: string
  route: string
  party_composition: [{ working_genius, mbti_secondary }]
  final_grace: int
  survival_rate: float
  cwm_helped: int
  cwm_declined: int
  deceptive_events_encountered: int
  sunday_rests: int
  historian_queries: int
  arrival_tier: string
  duration_minutes: int
  achievements_unlocked: [string]
  route: string
  school_id: uuid (anonymized)
}
```

---

### 5. Business Rules — Additions

```
// Route unlocking
IF runs_completed = 0 THEN route_options = ['main_trail'] only
IF runs_completed >= 1 THEN route_options += ['southern_cutoff']
IF runs_completed >= 3 THEN route_options += ['northern_mountain']
IF grade_band = 'k2' THEN route = 'main_trail' always (locked)

// Personality system
IF tier = 'basic' THEN personality_system_disabled; party members are name-only
IF personality_mode = 'randomized' THEN assign random WG + MBTI to each party member at game start
IF personality_mode = 'teacher_assigned' THEN use teacher-specified assignments
IF party_member.working_genius = 'Enablement' AND cwm_events_helped >= 2 THEN member.health -= 1 tier (burnout)
IF party_member.working_genius = 'Galvanizing' AND morale < 30 THEN galvanizing_recovery_event fires (once per run)
IF party_member.mbti_secondary contains 'F' THEN cwm_nudge_active = true
IF party_member.mbti_secondary = 'FJ' AND sunday_rest = true THEN member morale +3 (bonus above party bonus)
IF party_member.mbti_secondary = 'TP' AND sunday_rest = true THEN member morale -2 (resists rest)
IF party_member.working_genius = 'Tenacity' AND pace = 'Grueling' for >= 3 legs THEN tenacity_override_event fires

// Cascading consequences
IF consequence_flag SET THEN evaluate downstream_events at each trail leg advance
IF downstream_event qualifies (flags match) THEN add to event pool for current leg with weight = 0.8
IF cascade_depth > 3 THEN no further downstream events from this chain

// Hidden achievements
IF grace >= 80 AND current_landmark = 'independence_rock' THEN faithful_party_event eligible
IF cwm_events_helped = all_cwm_events_fired AND grace < 40 THEN reluctant_saint_flag = true
IF grade_band = '6_8' AND grace <= 14 AND reconciliation_taken = true AND landmark_index > 10 THEN prodigal_ending_eligible
IF knowledge_cards_read_total >= 10 THEN historian_journal_unlocked

// Freemium gate
IF tier = 'consumer_free' AND current_landmark = 'fort_laramie' THEN show_paywall_screen
IF player_subscribes THEN continue from fort_laramie (state preserved)
IF player_declines THEN offer 'start over' only

// Research metrics
IF run_complete AND tier IN ('premium', 'consumer_paid') THEN write research_run to research store
IF tier = 'basic' THEN no research metrics collected (privacy — no account, no tracking)

// Event history (rare events)
IF event fired AND event.rarity = 'rare' THEN add event.id to player.event_history
IF event.id IN player.event_history AND event.rarity = 'rare' THEN event_weight *= 0.1 (heavily deprioritized)
```

---

### 6. Success Criteria — Additions

| Criterion | Measure |
|-----------|---------|
| Route unlocking works correctly | Southern Cutoff unavailable on run 0; available on run 1; Northern Mountain on run 3 |
| Branching routes have meaningfully different events | Desert heat events fire only on Southern Cutoff; Northern mission events only on Northern Route |
| Cascade flags persist correctly | Consequence flag set at event A surfaces correctly at downstream event B 3 legs later |
| Rare events deprioritize after first fire | Run 2: event marked 'rare' that fired in run 1 fires in < 10% of subsequent runs |
| Working Genius bonuses apply correctly | Galvanizing recovery event fires when morale < 30; Enablement burnout fires after 2 CWM events |
| MBTI secondary effects apply correctly | FP types show cwm_nudge in logs; TJ types show Sunday rest bonus doubled |
| Personality mode 'teacher-assigned' works | Teacher-set WG/MBTI appear on correct party member slots in all student games |
| Paywall fires at Fort Laramie | Consumer free tier always triggers paywall scene on Fort Laramie arrival |
| State preserved through paywall | Player who subscribes at paywall continues from Fort Laramie with full state |
| Research metrics write correctly | Completed Premium runs appear in research store; no PII present in records |
| Basic tier has no personality system | Party members in Basic sessions show name only; no WG/MBTI in any UI or data |
| Hidden achievements fire under correct conditions | Faithful Party achievement only fires when grace ≥ 80 at Independence Rock |
| Teacher personality panel accurate | Teacher sees correct WG/MBTI per student per party slot |
| Class analytics show correct aggregates | WG distribution, survival rates, Grace averages match raw session data |

---

### 7. Open Questions — New Items

| # | Question | Default |
|---|----------|---------|
| 1 | **Payment processor** — Stripe or other? | Stripe |
| 2 | **Account system for Premium** — Google Auth (consistent with existing preference) or email/password? | Google Auth |
| 3 | **Consumer domain** — `[GAME_DOMAIN]` (set via environment variable `VITE_APP_DOMAIN`) or different? | TBD |
| 4 | **Research portal** — build in MVP or Phase 2? | Phase 2 |
| 5 | **Event generation pipeline** — who reviews AI-generated events for accuracy before commit? | Chris + one history-aware reviewer |
| 6 | **Personality system for K–2** — full WG/MBTI or simplified (just 2–3 personality types)? | Simplified — 3 types: Helper, Leader, Problem-Solver |
| 7 | **School admin view** — site license admin portal in MVP or Phase 2? | Phase 2 |
| 8 | **Lencioni Working Genius trademark** — confirm no licensing issue for using the framework in a commercial product | Needs legal check before launch |
| 9 | **MBTI trademark** — same question; may want to use "personality dimensions" language rather than "Myers-Briggs" explicitly | Use descriptive language ("thinking/feeling orientation") not the MBTI brand name |

---

*This document is an addendum to `the-long-way-home-requirements.md`. Build the base game first. Layer these enhancements in the order listed: event pool expansion → branching routes → cascading consequences → personality system → monetization. Each enhancement is independently deployable.*
