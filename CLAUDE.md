# CLAUDE.md — Pioneer Trail
*Project context for Claude Code. Read this first before any build session.*

---

## What This Project Is

**Pioneer Trail** is a browser-based educational game — a from-scratch rebuild of Oregon Trail mechanics for Catholic middle school classroom use. It is not a clone; it uses no original MECC/HMH code or assets. All content is original.

The game has three distinct surfaces:
1. **Student game** — the main gameplay experience
2. **Teacher dashboard** — real-time monitoring of all student sessions
3. **Node.js backend** — session state, AI proxy, Historian logging

Full requirements: `pioneer-trail-requirements.md`  
Catholic design framework: `catholic.md`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) |
| Styling | Tailwind CSS |
| Animation | Framer Motion + Pixi.js (hunting/scenes) |
| Backend | Node.js + Express |
| Real-time sync | Polling (10s intervals) — WebSocket in v2 |
| AI features | Anthropic API (claude-haiku-4-5 default) via server-side proxy |
| Database | None (MVP) — in-memory server state + localStorage |
| Deployment | Not specified yet |

---

## Architecture — Engine vs. Game Content

**Critical design principle:** The engine must never contain game-specific content. Oregon Trail, 1848, Jesuit missions, specific diseases — none of that lives in the engine. It lives in the game's `content/` folder. This keeps the engine extractable for future games (Journey of Paul, Mayflower, etc.) without refactoring.

```
Engine knows about:          Game content provides:
─────────────────────        ──────────────────────────
- Trail/journey progression  - Specific landmarks + distances
- Grace meter                - Era-appropriate event text
- Personality system         - NPC characters + dialogue
- Event firing framework     - Moral label copy
- Moral label system         - Knowledge panel cards
- Teacher dashboard          - Catholic curriculum references
- AI proxy                   - Route definitions
- Grade band flags           - Illness/hazard tables
```

If you can't add a second game by just swapping the `content/` folder and `game.config.js`, the engine boundary has been violated. Claude Code should enforce this strictly.

## Project Structure

```
long-way-home/                 # Monorepo — engine + first game
│
├── engine/                    # ⚙️ GAME ENGINE — no game-specific content, ever
│   ├── core/
│   │   ├── game-loop.js       # State machine (SETUP→TRAVELING→EVENT→LANDMARK→END)
│   │   ├── probability.js     # All probability calculations
│   │   └── gradeband.js       # Grade band feature flag system
│   ├── systems/
│   │   ├── grace.js           # Grace meter (generic — no Catholic-specific text)
│   │   ├── personality.js     # Working Genius + MBTI system
│   │   ├── events.js          # Event firing + cascade flag engine
│   │   ├── reconciliation.js  # Make It Right system
│   │   ├── reciprocity.js     # Stranger Returns system
│   │   ├── morallabels.js     # Label rendering (text comes from content/)
│   │   └── achievements.js    # Hidden achievement evaluation
│   ├── ai/
│   │   ├── proxy.js           # Anthropic API wrapper (generic)
│   │   └── prompts.js         # Prompt templates with {placeholders}
│   ├── dashboard/             # Teacher dashboard (generic — no game-specific UI)
│   └── utils/
│       └── logger.js
│
├── games/
│   └── long-way-home/         # 🎮 FIRST GAME — content only
│       ├── content/
│       │   ├── events.json          # All Oregon Trail events
│       │   ├── events-k2.json       # K–2 simplified event set
│       │   ├── landmarks.json       # Trail landmarks + distances
│       │   ├── landmarks-k2.json    # 5-stop K–2 trail
│       │   ├── routes.json          # Main Trail, Southern Cutoff, Northern Mountain
│       │   ├── npcs.json            # De Smet, Whitman, Bridger, etc.
│       │   ├── moral-labels.json    # Label text by event + grade band
│       │   ├── knowledge-panel.json # Historical knowledge cards
│       │   ├── illness.json         # Disease progression tables
│       │   └── catholic-curriculum.json  # CWM names, Commandments, Beatitudes
│       ├── components/
│       │   ├── scenes/              # Pixi.js visual scenes (Oregon Trail-specific)
│       │   ├── k2/                  # K–2 UI variant components
│       │   └── MoralLabel.jsx       # Game-specific label card styling
│       └── game.config.js           # ← THE BOUNDARY
│           /*
│             era: '1848',
│             setting: 'american_frontier',
│             defaultRoute: 'main_trail',
│             catholicAnchor: 'jesuit_frontier',
│             gradeBands: ['k2', '3_5', '6_8'],
│             aiPersona: 'trail_historian',
│             ...
│           */
│
├── server/                    # Node.js backend
│   ├── routes/
│   │   ├── session.js
│   │   ├── historian.js
│   │   ├── npc.js
│   │   ├── insights.js
│   │   └── export.js
│   ├── state/store.js
│   └── logger.js
│
├── shared/
│   └── types.js               # Shared data structures
│
├── .env.example
├── CLAUDE.md                  # This file
├── the-long-way-home-requirements.md
├── lwyh-enhancements-requirements.md
└── catholic.md
```

## Future Games (same engine, different content/)

When Journey of Paul is ready:
```
games/
├── long-way-home/       ← Oregon Trail, 1848
├── journey-of-paul/     ← Mediterranean, 50 AD, Acts of the Apostles
│   ├── content/
│   │   ├── events.json         # Shipwrecks, imprisonments, conversions
│   │   ├── landmarks.json      # Damascus→Jerusalem→Antioch→Corinth→Rome
│   │   ├── npcs.json           # Barnabas, Luke, Timothy, Silas, Lydia
│   │   └── moral-labels.json   # Early Church framework
│   └── game.config.js
├── mayflower/           ← Atlantic crossing, 1620
└── the-crusades/        ← Europe to Holy Land, 1095+ (complex moral terrain)
```

The engine extraction step happens naturally when game #2 is started. Don't extract prematurely — build Long Way Home first, then extract the engine when Journey of Paul begins. You'll know exactly what's shared by then.

---

## Environment Variables

Copy `.env.example` to `.env` before running locally. Never commit `.env`.

```bash
# Server
PORT=3000
LOG_LEVEL=info                         # debug | info | warn | error

# AI Features (server-side only — never in client .env)
# The teacher provides their key at session creation; it is held in memory only
# This var is a fallback for development/testing only
ANTHROPIC_API_KEY_DEV=                 # Dev/test only — teachers provide their own in prod

# Feedback
VITE_FEEDBACK_FORM_URL=                # Google Form base URL for teacher feedback
```

**CRITICAL:** The Anthropic API key provided by teachers must never appear in:
- Client-side code
- Network responses visible in browser DevTools
- Server logs (log only key presence Y/N, never the value)
- Git history

---

## Key Systems — How They Work

### Game State Machine
The core game is a state machine. States:
`SETUP → SUPPLY_PURCHASE → TRAVELING → REST_POINT → EVENT_RESOLUTION → LANDMARK → GAME_OVER`

All state transitions are logged. Game state is serialized to localStorage after every transition so students can refresh without losing progress.

### Grade Band Feature Flags
`gradeband.js` exports a `getFeatureFlags(gradeBand)` function that returns a feature config object. All components and game logic check flags before rendering or executing. This is the single source of truth for grade band behavior — never scatter grade band conditionals across components.

```javascript
// Example
const flags = getFeatureFlags('k2')
// → { supplySystem: false, illnessProgression: false, chaplain: false,
//     lastRites: false, aiHistorian: false, reconciliationEvents: false,
//     guardianAngel: true, goldenRulePrompts: true, trailStops: 5, ... }
```

### Moral Labels
`morallabels.js` and `moral-labels.json` handle all label generation. Pattern:
1. Game event fires and resolves
2. Event type + choice + grade band → label lookup in `moral-labels.json`
3. `MoralLabel.jsx` component receives label data and renders dismissible card
4. Label timing (immediate vs post-choice vs suppressed) controlled by session `moral_label_mode` setting
5. Label dismiss logged to student state

`moral-labels.json` structure:
```json
{
  "cwm_feed_hungry_helped": {
    "k2": { "valence": "positive", "title": "KINDNESS!", "body": "You shared your food...", "forward_prompt": "Jesus is happy when we share!" },
    "3_5": { "valence": "positive", "title": "Corporal Work of Mercy: Feed the Hungry", "body": "...", "scripture": "Matthew 25:35" },
    "6_8": { "valence": "positive", "title": "Work of Mercy: Feeding the Hungry", "body": "..." }
  },
  "cwm_feed_hungry_declined": { ... },
  "reconciliation_taken": { ... },
  "reconciliation_declined_second_time": { ... }
}
```

**CRITICAL:** Labels for deceptive CWM events use the SAME label as genuine events. Never reference `recipient_genuine` in label selection logic. The deceptive flag is for teacher dashboard only.

### Reconciliation Events
`reconciliation.js` manages the Make It Right system. After a sinful choice:
1. Sets `reconciliation_pending = true` on game state
2. On each trail leg advance, rolls probability (0.4)
3. If fires: selects appropriate reconciliation event from `events.json` keyed by original sin event type
4. Player choice → updates grace/morale + fires moral label + clears pending flag
5. Only fires once per original sin event

### The "Bad Person" Arc
`life_in_oregon_narrative` is generated at game completion based on Grace range. For 6–8 with AI Exam of Conscience enabled, this is AI-generated from the event log. For 3–5 and K–2, it's a templated narrative selected by Grace range from `moral-labels.json`. The narrative is stored on the student state object so the teacher can read it in the dashboard.

### Grace Meter
(unchanged from prior version — see above)

### Corporal Works of Mercy + Deceptive Charity
- Events defined in `cwm.js` and `events.json`
- Each CWM event has a `recipient_is_deceptive: boolean` assigned at fire time (25% probability)
- Deceptive flag stored in `gameState.cwm_events[].recipient_genuine`
- Grace accrues identically regardless of deceptive flag
- **Deceptive flag must never appear in any student-facing UI, text, or component**
- Teacher dashboard reads and displays the flag

### Stranger Reciprocity
- Tracked in `gameState.reciprocity_pending` and `reciprocity_fire_probability`
- `reciprocity.js` checks on each trail leg advance
- Selects appropriate Stranger Returns event from lookup table keyed by original CWM event type
- 40–60% fire rate — not guaranteed

### AI Features (all server-proxied)
All AI calls go through `server/ai/proxy.js`. Pattern:
1. Client sends game context (no API key) to server endpoint
2. Server retrieves session API key from in-memory store
3. Server builds full prompt from context + system prompt in `prompts.js`
4. Server calls Anthropic API
5. Server returns only the response text to client
6. Server logs { studentId, tokenCount, latencyMs } — never logs the key

**If API call fails:** Return a predefined fallback response (graceful degradation). Game continues. Student sees friendly error in Historian journal UI.

### Knowledge Panel
Static JSON loaded at startup. No API calls. Structure:
```json
{
  "cards": [{
    "id": "cholera_explainer",
    "trigger_events": ["illness_cholera"],
    "trigger_landmarks": [],
    "title": "...",
    "body": "...",
    "image_key": "...",
    "sources": [...]
  }]
}
```
Cards load based on current game event/landmark. Student clicks to expand. Reading logged.

### Teacher Dashboard Sync
Polling-based. Every 10 seconds, dashboard fetches `/api/session/:code/students` which returns all student states. Teacher dashboard renders from this snapshot. No WebSockets in MVP.

---

## Coding Standards

### General
- Functional React components only — no class components
- All game logic lives in `client/src/game/` — not in components
- Components render; game logic computes
- No `any` types — use JSDoc or TypeScript if available
- No magic numbers — use named constants in `constants.js`

### Logging
Use the logger, not console.log. Every significant event must be logged.

**Client:**
```javascript
import { logger } from '../utils/logger'
logger.info('EVENT_FIRED', { type, date, outcome, partyState })
logger.warn('HEALTH_CRITICAL', { member, cause, trailDay })
logger.error('STATE_SYNC_FAILED', { studentId, error, retryCount })
logger.info('GRACE_CHANGED', { studentId, delta, newValue, trigger })
logger.info('HISTORIAN_QUERY', { studentId, question, gameContext })
logger.error('HISTORIAN_API_FAILED', { studentId, error, fallbackShown })
```

**Server:**
```javascript
logger.info('STUDENT_JOINED', { sessionCode, studentId, timestamp })
logger.info('GAME_STATE_UPDATE', { studentId, landmark, partyHealth, grace })
logger.info('HISTORIAN_PROXIED', { studentId, tokenCount, model, latencyMs })
logger.error('SYNC_ERROR', { studentId, error, stack })
logger.error('API_KEY_ERROR', { sessionCode, error }) // NEVER log the key value
```

Log buffer: last 100 events per student, stored in memory. Teacher dashboard includes hidden debug panel showing last 10 errors per student. Errors include copy-pasteable stack traces.

Log verbosity controlled by `LOG_LEVEL` environment variable.

### Error Handling
Every async operation wrapped in try/catch. Every AI call has a predefined fallback. No unhandled promise rejections. Network errors should never crash the game.

### State Mutations
All game state mutations go through the state machine. No direct state mutations from components. Use dispatched actions (Redux-style or Context + useReducer).

---

## AI Prompt Reference

All prompts live in `server/ai/prompts.js`. Never hardcode prompts in route handlers.

**Historian system prompt key:** `HISTORIAN_SYSTEM`  
**NPC encounter prompts key:** `NPC_[CHARACTER_KEY]` (e.g., `NPC_DESMET`, `NPC_WHITMAN`)  
**Examination of Conscience key:** `EXAM_CONSCIENCE`  
**Teacher Insight Generator key:** `TEACHER_INSIGHTS`  

Context injection pattern (all prompts use template literals):
```javascript
const prompt = HISTORIAN_SYSTEM
  .replace('{student_name}', state.student_name)
  .replace('{party_names}', state.party_members.map(m => m.name).join(', '))
  .replace('{current_landmark}', state.current_landmark)
  .replace('{game_date}', state.game_date)
  .replace('{last_event_description}', state.event_log.slice(-1)[0]?.description || 'none')
```

---

## Data Files

### `knowledge-panel.json`
Historical content cards. Each card must have:
- `id` (unique string)
- `trigger_events` (array of event type strings, can be empty)
- `trigger_landmarks` (array of landmark strings, can be empty)
- `title` (≤ 40 chars)
- `body` (3–5 sentences, age-appropriate)
- `image_key` (references an asset)
- `sources` (array of source strings — for content accuracy accountability)

At least 12 cards required for MVP. See requirements §4E for full list.

### `events.json`
All game events with probability weights, outcomes, and text. CWM events marked with `"is_cwm": true`. Deceptive events NOT pre-marked — deceptive flag assigned at runtime.

### `landmarks.json`
Trail segment definitions: start, end, distance_miles, terrain_type, hazard_multiplier, landmark_name, landmark_type (fort | mission | natural).

---

## Running Locally

```bash
# Install dependencies
cd /Users/christreadaway/pioneer-trail
npm install

# Set up environment
cp .env.example .env
# Edit .env — add VITE_FEEDBACK_FORM_URL if available

# Run dev (starts both client and server with concurrently)
npm run dev

# Client runs on http://localhost:5173
# Server runs on http://localhost:3000
# Teacher dashboard: http://localhost:5173/teacher
```

---

## Debugging

**Copy-paste error workflow:**
1. Open teacher dashboard
2. Click student card → "Debug" tab (hidden; toggle with Ctrl+Shift+D)
3. Copy the error trace from the debug panel
4. Paste into Claude Code with the file/function context

**Grace meter issues:** All Grace changes logged as `GRACE_CHANGED`. Filter logs for this event to trace any unexpected behavior.

**AI call failures:** All AI errors logged as `HISTORIAN_API_FAILED` or `NPC_API_FAILED`. Check server logs for `API_KEY_ERROR` if all AI features fail simultaneously.

**State sync issues:** Client logs `STATE_SYNC_FAILED`. Check network tab for failed requests to `/api/session/:code/state`.

---

## What NOT to Build in This Session (Out of Scope)

- User accounts or persistent login
- Long-term database storage
- WebSocket real-time (use polling)
- Mobile-native app
- LMS integration
- Full accessibility compliance
- Leaderboard persistence across sessions

---

## Open Questions for Chris Before Build

See `pioneer-trail-requirements.md` Section 9 for full list. Blockers before first Claude Code session:

1. **Game name confirmed?** (Default: "Pioneer Trail")
2. **Art style decided?** (Default: illustrated storybook / warm palette)
3. **Target device?** (Default: Chromebook landscape 1366×768)
4. **Which grade band to build first?** (Recommend 6–8 as the full variant; K–2 and 3–5 can follow as simplifications)
5. **Google Form URL for feedback?** (Hide button if env var missing — not a blocker)
6. **Who provides the API key in production?** (Default: teacher enters at session setup)
7. **K–2 guardian angel character** — named character or ambient presence? This affects asset scope.

---

*This file is the source of truth for Claude Code sessions on this project. Update it as the project evolves — especially when new features are added, architectural decisions are made, or open questions are resolved.*
