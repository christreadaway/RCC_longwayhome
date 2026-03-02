# The Long Way Home — Enhancements Requirements
*Replayability, Party Personality System, and Premium Tier*
*Version 1.0 | Addendum to main requirements doc | For Claude Code Build*

---

## Overview

This document specifies enhancements to the base game that (a) dramatically increase replayability and depth, (b) introduce a personality system based on Working Genius and Myers-Briggs dimensions, and (c) define the Basic vs. Premium product tiers and freemium monetization model.

These features are **additive** — the base game (main requirements doc) is fully playable without them. Build the base game first, then layer these in.

**Dependency:** Read `the-long-way-home-requirements.md` and `CLAUDE.md` before this document.

---

## 1. Replayability Enhancements

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

## 2. Party Member Personality System

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

## 3. Monetization — Basic vs. Premium

### 3A. Product Tiers

#### Basic (Free — Forever)
The foundational game. Fully playable, educationally valuable, no time limit.

| Feature | Basic |
|---------|-------|
| Grade bands | 6–8 only |
| Trail routes | Main Trail only |
| Event pool | 30 events |
| Party members | Named only (no personality system) |
| AI features | None |
| Teacher dashboard | Basic (health, location, CWM decisions) |
| Moral labeling | Full (all grade bands' label system) |
| Grace meter | Active |
| Knowledge Panel | 6 cards |
| NPC encounters | None |
| Session export | Basic CSV |
| Students per session | 30 |
| Runs per student | Unlimited |
| Personality system | None |
| Research metrics | None |
| Feedback form | None |

#### Premium ($99/year per teacher — $499/year per school)
The full system. Everything in the base requirements doc plus all enhancements.

| Feature | Premium |
|---------|---------|
| Grade bands | K–2, 3–5, 6–8 |
| Trail routes | All 3 (main, southern, northern) |
| Event pool | 150+ events with history tracking |
| Party members | Full personality system (WG + MBTI) |
| AI features | All 5 (Historian, NPC, Exam of Conscience, Insights, Dynamic Narrative) |
| Teacher dashboard | Full (Grace, personality, transcripts, achievements, metrics) |
| Moral labeling | Full + teacher-configurable mode |
| Cascading consequences | Active |
| Hidden achievements | Active |
| Knowledge Panel | 12+ cards |
| Session export | Full CSV with personality data |
| Students per session | 30 |
| Personality analytics | Full class research panel |
| Research portal access | Yes |
| Priority support | Yes |

#### School Site License ($799/year)
Premium for unlimited teachers at one campus. Adds:
- Shared research data dashboard across all classrooms
- Admin view: all teacher sessions visible to principal/curriculum director
- Custom branding (school name, colors)
- Quarterly aggregate report emailed to admin

---

### 3B. Consumer Freemium Web Version

A public-facing website (domain set via `VITE_APP_DOMAIN` environment variable) where anyone can play — no classroom, no teacher, no session code required.

**Freemium model:**

| | Free | Paid ($4.99/month or $29.99/year) |
|-|------|-----------------------------------|
| Trail legs | First 3 (Independence → Fort Laramie) | Full trail |
| Routes | Main Trail only | All 3 routes |
| AI features | None | Trail Historian only |
| Grade band | 6–8 only | All 3 |
| Personality system | Randomized, not viewable | Full — player can see their party's types |
| Run history | None | Full history with stats |
| Paywall trigger | After Fort Laramie | — |

**Why Fort Laramie is the right gate:**
- Fort Laramie is roughly 1/3 of the trail — enough time to experience a CWM event, a death, a river crossing, and the core loop
- It's the first major milestone with a sense of real accomplishment
- The player is invested but hasn't "seen everything"
- Historically, Fort Laramie was where many emigrants first felt the enormity of what they'd committed to — thematically resonant as a decision point

**Paywall UX:**
When the player arrives at Fort Laramie (free play), a full-screen illustrated scene appears:

> *"You've reached Fort Laramie — one third of the way home. The trail ahead is longer, harder, and more beautiful than anything you've crossed. Oregon is still over 1,000 miles away.*
>
> *Continue the journey for $4.99/month — or unlock the full trail, all three routes, and your party's personality profiles."*

Two CTAs: "Continue Journey" (subscribe) and "Start Over" (replay the free section). No dark patterns. No countdown timers. Just the choice.

**Consumer vs. Classroom accounts:**
Consumer accounts are individual (parent/student/adult). Classroom accounts (teacher dashboard, session codes, multi-student) are always paid Premium. The consumer version is a single-player experience — no dashboard, no session code.

---

### 3C. Upgrade Path for Teachers

Teachers using Basic in their classroom see a subtle "Upgrade to Premium" prompt in the dashboard footer with one sentence on what they're missing. No pop-ups during sessions — only visible before/after a session starts.

**Most persuasive upgrade moment:** After a session, the Basic dashboard shows a greyed-out "Class Personality Analytics" panel with a one-line teaser: *"5 of your students had an Enablement genius party member. Premium shows you how that affected their choices."* That's the hook.

---

## 4. Data Requirements — Additions

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

## 5. Business Rules — Additions

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

## 6. Success Criteria — Additions

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

## 7. Open Questions — New Items

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
