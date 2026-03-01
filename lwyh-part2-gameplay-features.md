<!-- PART 2 OF 4: Core Gameplay, CWM, Grace, Labeling (Sections 4B-4C) -->

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
