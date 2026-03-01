<!-- PART 1 OF 4: Overview, Grade Bands (Sections 1-4A) -->

# The Long Way Home — Product Requirements Document
*Rebuilt Oregon Trail for AI Ethics Classroom Use — Catholic Edition*
*Version 1.4 | For Claude Code Build*

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
