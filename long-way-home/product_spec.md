# The Long Way Home — Product Specification
*Living document tracking implemented features, architecture decisions, and current state*

---

## Project Identity
- **Name:** The Long Way Home
- **Type:** Browser-based educational game (Oregon Trail mechanics, Catholic curriculum)
- **Grade Bands:** K-2, 3-5, 6-8
- **Tech Stack:** React + Vite (client), Node.js + Express (server), Tailwind CSS, Framer Motion
- **Version:** 1.0.0 (MVP)

---

## Architecture Overview

### Client (React + Vite)
```
client/src/
├── App.jsx                    # Main app shell, phase-based rendering
├── main.jsx                   # Entry point, React Router setup
├── index.css                  # Tailwind + custom animations
├── store/GameContext.jsx       # Global state via useReducer + Context
├── game/                      # Pure JS game logic (no React)
│   ├── engine.js              # State machine, score calc, narratives
│   ├── events.js              # Event system (random + triggered)
│   ├── grace.js               # Grace meter logic
│   ├── gradeband.js           # Feature flags by grade band
│   ├── cwm.js                 # Corporal Works of Mercy events
│   ├── reciprocity.js         # Stranger Returns system
│   ├── reconciliation.js      # Make It Right events
│   ├── morallabels.js         # Label generation
│   └── probability.js         # All probability calculations
├── components/
│   ├── game/                  # Student-facing game screens
│   │   ├── TitleScreen.jsx    # Title, join session, offline play
│   │   ├── SetupScreen.jsx    # Name, profession, party, chaplain
│   │   ├── SupplyStore.jsx    # Independence supply purchase
│   │   ├── TravelScreen.jsx   # Main travel loop with map, events
│   │   ├── LandmarkScreen.jsx # Fort/mission arrival, CWM, resupply
│   │   ├── EventScreen.jsx    # Event resolution with choices
│   │   ├── GameOverScreen.jsx # Score, narrative, exam of conscience
│   │   └── shared/            # Reusable game UI components
│   │       ├── MoralLabel.jsx       # Centered pop-in moral label (green/red)
│   │       ├── PauseOverlay.jsx     # Teacher-paused overlay
│   │       ├── TrailMap.jsx         # Trail progress visualization
│   │       ├── OregonTrailMap.jsx   # SVG map with 1848 boundaries, zoom/pan
│   │       ├── TerrainScene.jsx     # Dynamic terrain (plains/hills/mountains/river)
│   │       ├── PartyStatus.jsx      # Party health/supplies
│   │       ├── SundayRestPrompt.jsx # Sunday rest decision
│   │       ├── HuntingMinigame.jsx  # Click-based hunting with hit feedback
│   │       ├── HistorianPanel.jsx   # AI Trail Historian chat
│   │       └── KnowledgePanel.jsx   # Historical knowledge cards
│   └── dashboard/             # Teacher dashboard
│       ├── TeacherDashboard.jsx  # Router wrapper
│       ├── SessionSetup.jsx      # Create/join session
│       ├── DashboardMain.jsx     # Student grid, controls, insights
│       ├── StudentCard.jsx       # Individual student card
│       ├── SettingsPanel.jsx     # Live session settings
│       └── TranscriptViewer.jsx  # AI transcript viewer
├── data/                      # Static game data (JSON)
│   ├── landmarks.json         # 16-landmark trail for 6-8
│   ├── landmarks-k2.json      # 5-stop trail for K-2
│   ├── events.json            # 50 events across 12 categories
│   ├── events-k2.json         # 8 simplified K-2 events
│   ├── illness.json           # 7 illness types with tiers
│   ├── knowledge-panel.json   # 12 historical cards for 6-8
│   ├── knowledge-panel-3-5.json # 5 cards for 3-5
│   ├── moral-labels.json      # 22 label groups x 3 grade bands
│   ├── catholic-curriculum.json # CWM, Commandments, Beatitudes
│   ├── trail-flavor.js        # 300+ ambient narrative messages (14 categories)
│   └── trail-dangers.json     # 30+ trail dangers + 13 positive encounters
├── game/
│   ├── __tests__/             # Test suite (Node-runnable ESM)
│   │   ├── weather.test.js    # 12 weather system tests
│   │   ├── campActivities.test.js # 12 camp activities tests
│   │   └── loader.mjs         # Custom ESM loader for Vite aliases
│   ├── weather.js             # Historically accurate 1848 weather generation
│   ├── campActivities.js      # Camp activities system (11 activities)
│   └── tripReport.js          # End-of-trip difficulty index generator
└── utils/
    ├── logger.js              # Client-side logger with buffer
    ├── api.js                 # API client wrapper
    ├── dateUtils.js           # Game date utilities
    └── crashLogger.js         # Crash logging with game state snapshots
```

### Server (Node.js + Express)
```
server/
├── index.js                   # Express app entry point
├── logger.js                  # Structured server logger
├── state/store.js             # In-memory session/student store
├── routes/
│   ├── session.js             # Session CRUD, join, pause, settings
│   ├── historian.js           # AI historian query proxy
│   ├── npc.js                 # AI NPC encounter proxy
│   ├── insights.js            # AI class insights generator
│   ├── export.js              # CSV session export
│   └── crashReport.js         # Crash report persistence (POST + GET)
└── ai/
    ├── prompts.js             # All AI system prompts
    └── proxy.js               # Anthropic API proxy with fallbacks
```

---

## Implemented Features

### Core Game Loop
- [x] State machine: TITLE → SETUP → SUPPLY_PURCHASE → TRAVELING → REST_POINT → EVENT_RESOLUTION → LANDMARK → GAME_OVER
- [x] Date system starting April 1, 1848
- [x] Daily food consumption by rations setting
- [x] Pace system (steady/strenuous/grueling) affecting distance and illness
- [x] Party health progression: good → fair → poor → critical → dead
- [x] Death checks for critical members
- [x] Mountain pass deadline (Oct 15) with blizzard risk
- [x] Win condition: reach Willamette Valley before Dec 31, 1848
- [x] Score calculation with Grace multiplier
- [x] LocalStorage persistence (auto-save every state change)
- [x] Server state sync (10-second polling)

### Grade Band System
- [x] K-2: 5-stop trail, no supplies, 2 companions, guardian angel, immediate labels
- [x] 3-5: Full trail, basic supplies, 2-tier illness, reconciliation events
- [x] 6-8: Full game with all features enabled
- [x] Feature flags via `getFeatureFlags(gradeBand)`
- [x] Session-level grade band (locked at creation)

### Catholic Content Systems
- [x] Grace Meter (0-100, invisible to students, visible to teacher)
- [x] Grace effects on illness, good events, score multiplier
- [x] Corporal Works of Mercy events (7 types, max 3 per game)
- [x] Deceptive charity mechanic (25% of CWM events)
- [x] Stranger Reciprocity system (50% fire rate, 2-4 legs after CWM)
- [x] Reconciliation "Make It Right" events (40% chance, 3-5 and 6-8 only)
- [x] Sunday rest mechanic (health recovery + morale + grace)
- [x] Prayer during crisis (chaplain-dependent)
- [x] Last Rites (chaplain + dying member)
- [x] Feast day flavor text (Aug 15, Nov 1, Nov 2)
- [x] Moral labeling system (3 modes: full, post-choice, discussion-only)
- [x] Grade-appropriate labels for all 22 event types
- [x] Examination of Conscience (templated + AI option)
- [x] Arrival narrative by Grace range (4 variants)
- [x] "Life in Oregon" epilogue (6-8 only, 4 variants)

### AI Features
- [x] Trail Historian (context-aware Q&A, post-event or free access)
- [x] NPC Encounters (7 characters, 3-exchange cap, preloaded dialogue with suggested questions)
- [x] Personalized Examination of Conscience (AI-generated from event log)
- [x] Teacher Insight Generator (anonymized aggregate analysis)
- [x] Graceful fallbacks when API unavailable
- [x] API key security (server-side only, never logged)

### Historically Accurate NPC Scouts
- [x] Takoda (Pawnee Scout) at Fort Kearney — Pawnee territory
- [x] Washakie (Shoshone Guide) at Fort Bridger — Shoshone territory
- [x] Taghee (Bannock Guide) at Fort Hall — Bannock territory
- [x] Hímiin Maqsmáqs (Nez Perce Scout) at Fort Boise — Nez Perce territory
- [x] Each scout provides regionally accurate dialogue with gameplay tips
- [x] Preloaded suggested questions with hardcoded answers (no AI dependency)

### Trail Flavor Text System
- [x] 300+ ambient narrative messages across 14 categories
- [x] Categories: terrain (4 types), weather, wildlife, camp life, humanity, children, faith, hardship, wagon train, night sky, food, water, seasonal, milestone
- [x] Weighted random selection based on game context (low food → more hardship messages, etc.)
- [x] Historical humanity touches: singing "Oh! Susanna", fiddle playing, reading Pilgrim's Progress, journal writing, James Fenimore Cooper, harmonica playing "Amazing Grace"

### Difficulty Tuning
- [x] Base illness rate doubled (3% → 6%) with terrain/seasonal modifiers
- [x] Weekly trail wear mechanic (degraded health from journey hardship)
- [x] Morale decay every 5 days
- [x] Increased death chance at low food levels
- [x] Event frequency increased (threshold 0.75 → 0.60, 40% more events)

### Teacher Dashboard
- [x] Session creation with code, password, grade band, settings
- [x] Real-time student grid (10-second polling)
- [x] Student cards: name, location, health bars, Grace bar, CWM icons
- [x] Deceptive recipient indicator (yellow dot, teacher only)
- [x] Sort by name/location/health/grace
- [x] Filter by struggling/at-risk/completed
- [x] Pause/Resume all games
- [x] Live session settings panel
- [x] Historian transcript viewer per student
- [x] NPC transcript viewer
- [x] Debug panel (Ctrl+Shift+D)
- [x] CSV session export (26 columns)
- [x] Class Insights generation button
- [x] Feedback link (Google Form pre-populated)

### Historical Knowledge Panel
- [x] 12 contextual cards for 6-8
- [x] 5 simplified cards for 3-5
- [x] Trigger by landmark arrival or event type
- [x] Non-blocking (rest points only)
- [x] Reading tracked per student

### Weather System
- [x] Historically accurate 1848 weather generation based on month, terrain, and region
- [x] Temperature (Fahrenheit), wind speed/direction, 16 condition types (sunny, cloudy, rain, snow, dust storm, etc.)
- [x] Deterministic via seeded PRNG — same date always produces same weather
- [x] Ground conditions: firm, dry, damp, wet, muddy, sloshy, icy, snowpack
- [x] Ground moisture accumulates from recent weather history (last 5 days) and dries with sun/wind
- [x] Terrain weather shifts: mountains boost snow, rivers boost fog/rain, desert boosts dust storms
- [x] Weather affects travel speed via per-condition travel modifiers
- [x] Weather affects illness probability (cold + wet = higher illness chance)
- [x] WeatherBox UI component: temperature, wind, condition, ground, travel impact (color-coded)
- [x] Monthly temperature ranges calibrated to 1848 Great Plains/Rocky Mountain data

### Camp Activities System
- [x] 11 activities: talk with family, tend oxen, cook a proper meal, check provisions, wash up, pray, attend Mass, confession, let children play, mend wagon, help fellow emigrants
- [x] All activities use 1848-appropriate language (johnnycakes, buffalo chips, mumblety-peg, tallow, felloe, hardtack)
- [x] Time cost per activity (portion of a travel day)
- [x] Cooldown system (day-based, prevents spam)
- [x] Grade band filtering (K-2 gets simplified subset, 6-8 gets all activities)
- [x] Mission-only activities: attend Mass, confession (only at landmarks with type: mission)
- [x] Rich family dialogue system with 40+ lines across morale states (high, moderate, low, critical)
- [x] Conditional dialogue: hungry, sick member by name, bad weather, death occurred, lingering too long
- [x] Family suggestions system providing actionable hints based on game state
- [x] Activity effects: morale boost, grace increase, health recovery, food cost, travel bonus, reconciliation clear
- [x] CampActivitiesPanel UI component with activity list → confirmation → result flow

### Trail Dangers & Positive Encounters
- [x] 30+ trail dangers across 9 categories: environmental, mechanical, animal, wildlife, human, health, navigation, social, supply
- [x] Each danger: difficulty score (0-10), terrain/season/weather filters, probability weight
- [x] Some dangers have player choices (robbery: comply/resist/negotiate; bad water: drink/boil/search)
- [x] Lingering danger: theft, robbery, hostile encounters boosted when stationary too long
- [x] 13 positive encounters including CWM opportunities (sick traveler, struggling family, found lost belongings)
- [x] Grace-influenced encounter probability: higher grace = more positive encounters, lower grace = more hardship
- [x] Grace threshold on some encounters (helpful native guide requires grace ≥ 50)
- [x] Choice-based encounters test greed vs. charity (share food or keep it, return found goods or keep them)

### Trip Management & Miles Calculation
- [x] Miles driven by pace × weather × ground conditions × oxen care × grace bonus/penalty
- [x] Oxen checked bonus: +10% travel distance after tending
- [x] Grace influence: grace ≥ 70 = +5% travel; grace ≤ 20 = -8% travel
- [x] Lingering danger system: each stationary day increases bandit/robbery probability
- [x] Warning displayed after 2+ consecutive rest days about lingering danger
- [x] Daily bonuses (oxen check, wagon maintenance) reset each travel day

### Trip Difficulty Report
- [x] End-of-trip difficulty index (0-10 scale) with descriptive labels
- [x] Four weighted categories: weather hardship (25%), trail dangers (35%), party health (25%), supply management (15%)
- [x] Labels: "Remarkably Easy" through "Nearly Impossible"
- [x] Grace influence summary text based on final grace score
- [x] Comprehensive stats: days traveled, bad weather days, dangers encountered, deaths, robberies, breakdowns

### Crash Logging & Error Recovery
- [x] Client-side crash logger with user action tracking (last 30 actions)
- [x] Crash reports capture: error + stack, game state snapshot, recent actions, event log, browser info
- [x] Reports stored in localStorage (up to 20) AND sent to server
- [x] Global error handlers for uncaught exceptions and unhandled promise rejections
- [x] React Error Boundary integration helper (`logReactError`)
- [x] Server endpoint: POST `/api/session/crash-report` persists to `crash-reports.log`
- [x] Server endpoint: GET `/api/session/crash-reports` retrieves last 50 for teacher debug panel
- [x] Game state sanitizer extracts only essential debugging fields

### Test Suite
- [x] 12 weather system tests: valid reports, determinism, terrain effects, seasonal temps, travel modifiers, ground conditions
- [x] 12 camp activities tests: activity structure, grade band filtering, mission requirements, cooldowns, effects, dialogue, anachronism check
- [x] Custom ESM loader for running tests outside Vite (handles extensionless imports + @shared alias)
- [x] All 24 tests passing

### Visual Design
- [x] Warm illustrated storybook palette (tan/brown/blue/gold)
- [x] Animated wagon SVG
- [x] Parallax trail scene header
- [x] Health-coded party status bars
- [x] Grace-colored progress bar (visible on travel screen top bar + teacher dashboard)
- [x] Pulsing knowledge panel indicators
- [x] Moral label centered pop-in animation (green for positive, red for negative)
- [x] Mission vs Fort distinct visual treatment
- [x] SVG trail map with 1848 state/territory boundaries, zoom/pan controls
- [x] Terrain scene visualization (plains, hills, mountains, river) based on current geography
- [x] Viewport-fitting layout (no scrolling — entire game above the fold)

---

## Design Decisions

1. **useReducer over Redux** — Game state is complex but contained within a single provider. No need for middleware or dev tools at MVP.
2. **Polling over WebSocket** — Simpler to implement; 10s interval acceptable for classroom use. WebSocket planned for v2.
3. **In-memory server state** — No database for MVP. Sessions are ephemeral (single class period). Server restart clears all data.
4. **CWM deceptive flag never in student state serialization to client** — The `recipientGenuine` field is stored in `cwmEvents[]` but the student UI never reads it. Teacher dashboard reads it from server-synced state.
5. **Separate landmark data files per grade band** — Avoids complex filtering in-game; K-2 has its own trail.
6. **Moral labels as JSON data** — All label text externalized for easy editing by curriculum reviewers.

---

## Deployment

### Netlify (Current)
- **URL:** longwayhome.netlify.app
- **Platform:** Netlify (static hosting + serverless functions)
- **Config:** `netlify.toml` in `long-way-home/` directory
- **Base directory:** `long-way-home` (must be set in Netlify UI since repo root is `RCC_longwayhome`)
- **Build command:** `cd client && npm install && npx vite build`
- **Publish directory:** `client/dist` (relative to base)
- **Functions:** `netlify/functions/api.js` wraps Express app via `serverless-http`
- **Redirects:** `/api/*` → serverless function, `/*` → `index.html` (SPA fallback)
- **Node version:** 20 (set in `netlify.toml`)

### Architecture (Production)
- Static client build served by Netlify CDN
- Express API wrapped as a single Netlify Function (`api.js`)
- `server/index.js` uses `require.main === module` guard so `app.listen()` only runs standalone, not when imported by serverless wrapper
- "Play Offline" mode requires no backend — fully client-side

### Also Supported
- **Docker:** `Dockerfile` + `.dockerignore` included
- **Render:** `render.yaml` for one-click deploy
- **Heroku/Railway:** `Procfile` included
- **Any Node.js host:** `npm run build && npm start` serves everything from port 3000

### Note on Serverless State
Netlify Functions are stateless — the in-memory session store (`server/state/store.js`) resets between cold starts. This means:
- "Play Offline" works perfectly (no server calls)
- Classroom sessions (multi-student with teacher dashboard) will lose state between function invocations
- For persistent classroom use, deploy to a long-running Node.js host (Render, Railway, Docker) or add a database

---

## Known Limitations (MVP)

- No persistent database — sessions lost on server restart (or serverless cold start)
- No WebSocket — 10s polling latency for dashboard
- No mobile-optimized layout (works on tablet landscape)
- Hunting minigame is click-based only (no keyboard/touch optimization)
- AI features require teacher-provided Anthropic API key
- No multiplayer interaction between students
- No LMS integration
- No accessibility compliance beyond basic keyboard nav

---

## Bug Fix History

### v1.0.1 — Playtest Bug Fixes (2026-03-01)

**15 bugs found and fixed** across 3 severity levels:

- **Critical (3):** Distance initialization (instant landmark arrival), Sunday rest infinite loop, game win showing failure screen
- **Medium (5):** Starvation not killing members, stale alive member lists, travel message overwrite, missing rest guards, feast day date offset
- **Low (7):** Render-time dispatch, confusing hook guard, useMemo with full state dep, stale closure in hunting ammo, nested state update in hunting, unused import, missing useEffect dependency

All fixes verified via clean production build (66 modules, 107KB gzipped).

### v1.0.2 — Deployment Setup (2026-03-02)

- Added Netlify deployment support (`netlify.toml`, serverless function wrapper)
- Added multi-platform deploy configs (Dockerfile, render.yaml, Procfile)
- Refactored `server/index.js` to guard `app.listen()` behind `require.main === module` for serverless compatibility
- Added `serverless-http` dependency
- Updated `package.json` with `postinstall` script, `engines` field (Node 18+), and improved `build` script
- Production build verified: client serves from single port alongside API

### v1.0.3 — Playtest Feedback Session (2026-03-02)

**Major UI overhaul and bug fixes** from live playtest feedback:

#### Layout & Visual
- Viewport-fitting layout: entire game above the fold, no scrolling (h-screen flex)
- 3-column travel screen: left sidebar (terrain/party/supplies), center (map/progress/actions), right (optional historian)
- SVG trail map with 1848 state/territory boundaries, landmark dots, zoom/pan controls
- Dynamic terrain scene (plains, hills, mountains, river) based on current geography
- Grace score visible on travel screen top bar with color-coded progress bar

#### Moral Labels Fix
- Centered pop-in animation (was sliding from left)
- Green border/background for positive, red for negative (was inconsistent)
- **Critical bug fix:** CWM events used diverse choice IDs (share_food, pay_fair_price, forgive, etc.) but label lookup only checked for 'help'/'helped' — ALL CWM events showed negative labels. Fixed by checking `grace_change > 0` to determine helped/declined.

#### Event System Fixes
- Template placeholders ({member_name}, {student_name}, {party_size}) now properly resolved in event descriptions
- Effect key mismatches fixed: events.json used `morale_change`/`health_change` but code only checked `morale`/`health_delta` — now handles both
- Added health_change processing (numeric → tier conversion: each -5 = 1 tier down)
- Added oxen_loss effect handling

#### Hunting Minigame Fixes
- Animal sizes increased: squirrel 20→35, rabbit 25→40, deer 40→55, bison 55→70
- **Critical bug fix:** Food wasn't accumulating due to React state batching — click handler read stale state outside setAnimals callback. Fixed by moving all logic inside functional state updates.
- Hit radius increased to `size * 0.9` for better click detection
- Added hit/miss flash feedback

#### NPC Scout System
- Historically accurate tribal scouts per region (Pawnee, Shoshone, Bannock, Nez Perce)
- Preloaded dialogue with 4-5 suggested questions per NPC containing gameplay tips
- Still supports free-form AI-powered questions as fallback

#### Difficulty Increase
- Base illness rate doubled (3% → 6%) with terrain/seasonal modifiers
- Weekly trail wear mechanic (health degradation from journey hardship)
- Morale decay every 5 days without rest
- Death chance increased at low food levels
- Event frequency up 40% (threshold 0.75 → 0.60)

#### Trail Flavor Text
- 300+ ambient narrative messages across 14 categories
- Context-aware weighted selection (hardship increases when food/morale low, seasonal by game date)
- Historical humanity: singing, fiddle, harmonica, books, journal writing, cards, dancing

### v1.0.4 — Weather, Camp Activities, Trail Dangers & Crash Logging (2026-03-02)

- Added historically accurate 1848 weather system with 16 condition types, ground condition tracking, terrain modifiers
- Added 11 camp activities with 1848-appropriate language, cooldowns, grade band filtering, rich family dialogue
- Added 30+ trail dangers across 9 categories + 13 positive encounters with grace-influenced probability
- Added trip difficulty report (0-10 index) with weighted scoring across weather/dangers/health/supplies
- Added comprehensive crash logging: client action tracking, game state snapshots, server persistence
- Integrated weather and camp activities into TravelScreen with miles calculation driven by pace, weather, ground, oxen, grace
- Added lingering danger system (stationary days boost bandit/robbery probability)
- 24 passing tests (12 weather + 12 camp activities)
- Production build verified: 76 modules, 455KB JS (140KB gzipped)

---

*This document should be updated as features are added, bugs are fixed, and architectural decisions are made.*
