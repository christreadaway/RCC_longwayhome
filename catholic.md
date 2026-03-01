# Catholic Values Framework for Game Design
*A reusable guide for embedding Catholic teaching into educational game mechanics*
*Maintained by [Parish/School Name] — AI Ethics & Catholic Education Initiative*

---

## Purpose

This document is a living framework for developers and designers building games for Catholic educational contexts. It translates Catholic moral theology, social teaching, and spiritual tradition into practical game mechanics that work across genres and age groups.

Use this alongside any game's PRD. It does not replace game design — it informs it.

---

## Core Design Principle

**Catholic values work best when they are discovered, not instructed.**

A student who chooses to help a starving stranger and later experiences an unexpected act of kindness has learned something. A student who is told "Catholic teaching says to help the poor" has been lectured. The goal of this framework is to create conditions for the former. The game surfaces the experience. The teacher surfaces the theology.

This means:
- Never label virtuous choices as "the Catholic option" during play
- Never penalize players explicitly for sinful choices — let consequences teach
- Let moral frameworks emerge in post-game discussion, not in-game prompts
- Trust the teacher to close the loop

---

## The Seven Corporal Works of Mercy as Game Mechanics

These seven works — drawn from Matthew 25 and centuries of Catholic tradition — are the most reliable source of ethical decision events in any game set in contexts of scarcity, travel, or community.

| Work | Game Event Template | Key Mechanic | Cost of Virtue |
|------|--------------------|-----------| ---------------|
| Feed the hungry | Struggling traveler/family with no food | Share food or pass | Resource loss (food/coins) |
| Give drink to the thirsty | Dry crossing, exhausted strangers | Share water or conserve | Supply depletion |
| Clothe the naked | Traveler with no winter gear | Give clothing or ignore | Clothing/equipment loss |
| Shelter the homeless | Displaced person/child needs a place | Take them in or turn away | Space, resource overhead |
| Visit the sick | Ill stranger at roadside | Stop to help or continue | Time lost, illness exposure |
| Ransom the captive | Unjust situation (debt, exploitation) | Intervene at cost or walk by | Cash, conflict risk |
| Bury the dead | Unburied person, no one to do it | Stop to give proper burial or continue | Time lost |

**Design rules for all Corporal Works events:**
1. The "right" choice must always cost something real — virtue without sacrifice is not virtue
2. Outcomes should vary — sometimes helping is rewarded, sometimes it simply costs and nothing comes back
3. Some recipients should be dishonest or ungrateful — Grace accrues to intent, not outcome
4. Never fire during a survival crisis — the choice must feel real, not impossible
5. Maximum 3 per playthrough in most game contexts — scarcity makes them land harder

---

## The Seven Spiritual Works of Mercy as Game Mechanics

More interior than the Corporal Works, these apply especially in dialogue-heavy, choice-driven, or relationship-based games.

| Work | Game Event Template | Mechanic |
|------|--------------------|-----------| 
| Instruct the ignorant | Student/character who doesn't understand something | Share knowledge vs. ignore their confusion |
| Counsel the doubtful | NPC facing a difficult decision, asks for advice | Give honest counsel vs. tell them what they want to hear |
| Admonish the sinner | Companion doing something harmful | Speak up at social cost or stay quiet |
| Bear wrongs patiently | Another player/NPC wrongs you without reason | Respond with patience or retaliate |
| Forgive offenses | Someone who has genuinely harmed you asks forgiveness | Forgive or withhold |
| Comfort the afflicted | Grieving or suffering character | Stop and be present vs. move on |
| Pray for the living and dead | Death, crisis, or moral crossroads moment | Pray (small mechanic) or don't |

---

## Catholic Social Teaching Principles as Game Systems

Seven principles that translate into broader systemic mechanics, not just single events:

### 1. Life and Dignity of the Human Person
Every character — enemy, ally, stranger — has inherent dignity. Games should make it *feel costly* to treat people as means rather than ends.
- Mechanic: NPCs have names. Death messages include causes. The game doesn't let you forget who died.

### 2. Call to Family, Community, and Participation
Humans flourish in community. Solo-optimization strategies should subtly underperform cooperative ones.
- Mechanic: Party morale systems. Chaplain and community bonuses. Shared outcomes.

### 3. Rights and Responsibilities
Freedom comes with obligation. Having more resources creates greater capacity — and responsibility — to help.
- Mechanic: Triggered CWM events scale in cost to player's current resources. Rich players face harder asks.

### 4. Option for the Poor and Vulnerable
Special moral weight on choices affecting the most vulnerable.
- Mechanic: Grace modifier — helping the most desperate (lowest health, no food) yields higher Grace than helping someone comfortable.

### 5. The Dignity of Work and the Rights of Workers
Labor is sacred. Exploitation — whether of others or of land — carries consequences.
- Mechanic: Overhunting degrades bison populations. Grueling pace on sick party members drains Grace. Fair wages in labor events.

### 6. Solidarity
We are responsible for one another across distance and time. Stranger encounters aren't interruptions — they're obligations.
- Mechanic: Stranger reciprocity system. The web of mutual aid is visible in retrospect, even when individual choices felt isolated.

### 7. Care for God's Creation
Stewardship of the natural world.
- Mechanic: Overhunting has lasting effects. Pollution or resource depletion in relevant game settings has downstream impact.

---

## Grace as a Game Mechanic — Design Specification

The **Grace system** is the primary Catholic rewards mechanism. It should be applied consistently across games built under this framework.

### Core Rules
- Grace is always **invisible to the player** during gameplay. They feel its effects; they never see a number.
- Grace is always **visible to the teacher** in the monitoring dashboard.
- Grace tracks **intent**, not outcome. Helping someone who turns out to be dishonest still accrues Grace.
- Grace **modulates probability**, not destiny. It tilts the odds at the margins; it does not guarantee outcomes. Bad things still happen to virtuous players. Cholera doesn't check your Grace score.
- The **biggest Grace reward is narrative** — the end-of-game story should feel different based on how you lived, not just your numerical score.

### Standard Grace Event Table (adapt per game context)

| Action | Grace Delta | Notes |
|--------|------------|-------|
| Help in any CWM event | +12 to +18 | Scale to cost of helping |
| Help despite personal hardship | +20 | Triggered when player is resource-constrained |
| Decline to help (CWM event) | -8 | |
| Exploit a vulnerable character | -12 | |
| Forgive an offense | +10 | |
| Retaliate disproportionately | -8 | |
| Pray during crisis | +3 | |
| Include religious companion/guide | +5 (one-time) | |
| Observe Sabbath/holy day rest | +5 | |
| Stewardship of resources (no waste) | +3 per instance | |
| Exploit/abuse natural resources | -5 per instance | |
| Push others past safe limits for personal gain | -3 per day | |

### Grace Effect Ranges (standard)

| Range | Label | Mechanical Effects |
|-------|-------|-------------------|
| 75–100 | High | Probability tilt toward good events; score multiplier 1.2x; arrival narrative: peace |
| 40–74 | Moderate | Baseline game, no adjustment |
| 15–39 | Low | Probability tilt toward hardship; recovery slower |
| 0–14 | Depleted | Morale floor collapses; guaranteed late-game hardship event; arrival narrative: hollow |

### The Arrival Narrative Rule
Every game built under this framework should have a **differentiated arrival/ending narrative** based on Grace range. This is the most important single implementation of the system. The numerical score tells you how efficiently you traveled. The narrative tells you who you became.

---

## The Deceptive Charity Mechanic

One of the most theologically rich mechanics in this framework. Some recipients of charity are dishonest, ungrateful, or taking advantage. The player cannot know in advance.

**The design principle:** Catholic charity is not conditional on the recipient's worthiness. You give because giving forms you, not because the recipient deserves it.

**Implementation rules:**
1. 20–30% of generosity events should have a deceptive recipient
2. Grace accrues identically — the player's act is what matters
3. The game **never reveals** that a recipient was deceptive to the student during play
4. The teacher **can see** the deceptive flag in the monitoring dashboard
5. Downstream "Stranger Returns" events can still fire after deceptive events — a different stranger may show grace in return for the student's generosity
6. This mechanic should be surfaced in post-game discussion: "Some of you helped a stranger who wasn't what they seemed. Does that change whether it was the right choice?"

---

## Theological Guardrails

These are non-negotiable design rules to ensure Catholic content is handled with integrity:

**On prayer:**
- Prayer is always available as an option; never guaranteed to change outcomes
- Prayer should have small, real, probabilistic effects — not magical results
- The game never mocks prayer or presents it as superstition

**On death:**
- Death is part of the game, not sanitized away
- Death should be named and specific — not abstract
- Last Rites (or equivalent) should be available when appropriate, and should feel like peace, not a cheat code

**On virtue:**
- Virtue should cost something. Free virtue is not virtue.
- The game should not make vice feel cartoonishly bad. Real sin is tempting. Real sacrifice is hard. Model both honestly.

**On other faiths:**
- Protestant, Jewish, Native American, and other spiritual traditions present in historical contexts should be treated with dignity
- The Catholic framework is the *lens*, not the exclusive content
- The chaplain/religious companion should be presented as a choice, never a requirement

**On Grace:**
- Never name the Grace system explicitly in student-facing UI
- Never use it as a behavior management system ("do Catholic things to win")
- It should feel, in retrospect, like the natural weight of how you lived — not a point system you gamed

---

## Suggested AI Features for Catholic Educational Games

These AI features work consistently well in Catholic educational game contexts:

| Feature | Purpose | Implementation Note |
|---------|---------|-------------------|
| **Contextual AI Companion** | Historical/moral guide available at rest points | Constrain to era-appropriate topics; block mechanical advice |
| **Personalized Examination of Conscience** | End-game AI reflection drawn from player's specific choices | Requires event log; send to Haiku with specific prompt |
| **AI NPC Encounters** | Brief conversations with historical or composite characters | Cap at 3 exchanges; period-appropriate voice; teacher can view |
| **Teacher Insight Generator** | Post-session AI analysis of class patterns → discussion prompts | Anonymized aggregate data only; Haiku sufficient |
| **Dynamic Arrival Narrative** | AI-written ending paragraph tuned to Grace score and event log | Most powerful single use of AI in this context |

**AI system prompt principles for Catholic educational contexts:**
- AI should not dispense theology — it should ask good questions
- AI should never undermine the player's choices or lecture about virtue
- AI should surface historical and moral context, not conclusions
- All AI content appropriate for the target age group; reviewed by teacher before deployment
- AI never reveals game mechanics, probability, or scoring internals

---

## Catholic Curriculum by Grade Band

This section maps age-appropriate Catholic curriculum to game mechanics. Any game built under this framework should select the appropriate band and align its moral content, vocabulary, and labeling accordingly.

---

### K–2: Foundation of Love

**Core question the game asks:** *How does God want us to treat each other?*

**Curriculum anchors:**
- God loves us unconditionally
- The Golden Rule (Matthew 7:12)
- The Two Great Commandments (Matthew 22:37-39)
- Basic virtues: kindness, sharing, honesty, courage
- Simple prayer: "God, help me be kind today"
- The Guardian Angel — children this age have a natural connection to guardian angels; a gentle trail companion character works beautifully here

**What to label and how:**

Every moral choice gets an immediate, named label in large friendly type:
- KINDNESS, GENEROSITY, SHARING, HONESTY, BRAVERY (positive)
- SELFISH, UNKIND, UNFAIR (negative — gently, not harshly)

Follow every label with one sentence connecting it to faith: *"Jesus asks us to be kind, just like you were!"* or *"That wasn't the kind thing to do. God loves you and wants you to try again."*

**The "try again" principle:** K–2 games should always offer at least one repair opportunity. Children this age are in the developmental stage of learning that mistakes can be corrected. The game should reflect that grace is available.

---

### 3–5: Building Moral Vocabulary

**Core question the game asks:** *What does it mean to be a good person — and what happens when we're not?*

**Curriculum anchors:**
- The Ten Commandments (introduce all 10; reference relevant ones at moral events)
- The Beatitudes (Matthew 5:3-12) — especially "Blessed are the merciful" and "Blessed are the peacemakers"
- The Corporal Works of Mercy (introduce the concept and names)
- Sin: understanding that choices have consequences and break our relationship with God and others
- Conscience: the inner voice that tells us right from wrong
- Reconciliation: the sacrament and the concept — making things right after we've done wrong

**What to label and how:**

Name the specific Commandment or Beatitude. Connect it to the event:
- *"You forgave the person who wronged you. Jesus said, 'Blessed are the merciful, for they shall receive mercy.' That was mercy."*
- *"You lied to the trader. The 8th Commandment calls us to honesty. This is a sin — it hurts your relationship with God and with others."*

**The Reconciliation arc is especially powerful at this age.** Students ages 8–11 are often preparing for or have recently received First Reconciliation. The in-game "Make It Right" events reinforce that grace is available after sin — which is exactly the theology of the sacrament.

**The examination of conscience at end-game** should be simple, structured, and inviting:
- *"What did you do well on the trail?"*
- *"What do you wish you had done differently?"*
- *"Who did you help? Who did you miss helping?"*

---

### 6–8: Moral Reasoning and Catholic Social Teaching

**Core question the game asks:** *Who am I becoming — and does that matter?*

**Curriculum anchors:**
- Catholic Social Teaching (all 7 principles — mapped to game systems in the CST section above)
- All 7 Corporal Works of Mercy
- All 7 Spiritual Works of Mercy (surface in AI dialogue and NPC encounters)
- Virtue ethics: prudence, justice, fortitude, temperance (cardinal virtues); faith, hope, charity (theological virtues)
- Conscience formation: the difference between following your conscience and rationalizing sin
- The concept of social sin: systems and habits that make wrongdoing easier and virtue harder
- Free will and its consequences: you can choose poorly and still "succeed" — but what does it cost?
- The dignity of every human person — especially the poor, sick, and dying

**What to label and how:**

Frame it as moral formation, not correction. The student is 13, not 7:
- *"The Church calls this feeding the hungry — a Corporal Work of Mercy. You chose it when it wasn't free."*
- *"Pushing your sick party member to Grueling pace is a violation of their dignity. The 5th Commandment protects human life — including those in your care."*

The 6–8 label should feel like a peer reflection, not a scolding. Tone: serious, honest, brief.

**The "Bad Person" arc is the most powerful 6–8 Catholic curriculum moment.** A student who arrives at Willamette Valley with depleted Grace has not "lost" — but they've won a life the game shows them honestly. This is the closest a classroom game can come to the parable of the Prodigal Son told from the *older brother's* perspective: you followed the rules, you got there, you kept everything — and you're empty.

The teacher should surface this explicitly: *"Some of you made it to Oregon with more money than anyone else. What did that cost? Is that winning?"*

---

## Moral Labeling Design System

Labels are the primary in-game curriculum delivery mechanism. They should be designed with the same care as the game itself.

### Label Anatomy

Every label has five components. Not all are used at every grade band.

```
[VALENCE ICON]  [FRAMEWORK NAME]
[1–2 sentence explanation — age appropriate]
[Scripture or Catechism reference — optional, teacher-configurable]
[Forward-looking prompt — K-2 required, optional for 3-5 and 6-8]
[Dismiss button]
```

### Label Vocabulary by Grade Band

| Concept | K–2 | 3–5 | 6–8 |
|---------|-----|-----|-----|
| Positive choice | "That was KINDNESS!" | "Corporal Work of Mercy: Feed the Hungry" | "Work of Mercy: Feeding the Hungry" |
| Negative choice | "That was selfish." | "Selfishness / Against the 5th Commandment" | "Violation of human dignity / 5th Commandment" |
| Forgiveness | "You forgave! That's what Jesus does for us." | "Blessed are the merciful (Matthew 5:7)" | "Mercy over justice — the harder virtue" |
| Sin label | "That wasn't kind." | "This is a sin. It hurts your relationship with God." | "This is a sin against [specific principle/commandment]." |
| Grace prompt | "God still loves you. Try again." | "Reconciliation is always available." | (No forward prompt — let it sit) |

### Label Timing

- **K–2:** Always immediate. Children this age need the connection made in the moment or it's lost.
- **3–5:** Default immediate; teacher can delay to post-resolution.
- **6–8:** Default immediate; teacher can set to post-choice or suppress entirely for discussion-based sessions.

### What Must Never Be Labeled

- Random bad luck (blizzard, disease from terrain, oxen death)
- Tactical choices that don't cross ethical thresholds
- The deceptive nature of a charity recipient — ever

### The Deceptive Charity Label Rule

When a student helps a CWM event where the recipient turns out to be deceptive, the label should be **identical to a genuine event**. The student helped. Grace accrued. The label should say so — the Works of Mercy label, warm, affirming. Never hint at the deception in the label.

The teacher sees the deceptive flag. The student never does — not in gameplay, not in the label, not even in the Examination of Conscience. This is intentional theology: we don't give conditionally.

---

Every game using this framework should surface the following in the teacher dashboard:

- Grace score per student (0–100, color-coded)
- CWM events: fired, choice made, whether recipient was genuine/deceptive
- Religious companion included (Y/N)
- Prayer actions taken
- Sabbath/holy day observances
- Stranger Returns events fired
- Examination of Conscience panel viewed

---

## Discussion Facilitation — Post-Game Framework

The game creates the experience. The teacher creates the learning. This framework provides the bridge.

**Standard discussion arc:**

1. **Inventory** — "What happened to your party? What decisions did you face?"
2. **Surprise** — "What surprised you? What didn't go the way you expected?"
3. **The Hard Choices** — "Tell me about a moment where you had to choose between helping someone else and protecting your own party."
4. **The Grifter Question** — (After deceptive charity events) "Some of you helped a stranger who wasn't what they seemed. Does that change whether it was the right choice? Why or why not?"
5. **The Framework Reveal** — (Teacher's discretion) "The choices you faced today — feeding the hungry, visiting the sick, burying the dead — these have a name. They're called the Corporal Works of Mercy. You practiced them without knowing it."
6. **The AI Bridge** — (For AI ethics class context) "A real AI was analyzing your decisions today and generating those reflection prompts. What does it mean that an AI can identify moral patterns in your behavior? Can it understand *why* you chose what you chose?"

---

*This framework is maintained as part of [Parish/School Name]'s Catholic educational technology initiative. It should evolve as games are built and deployed — add to it, refine it, but never simplify it. The richness of Catholic moral tradition can bear the complexity.*
