# The Long Way Home — Product Specification
*Living document tracking implemented features, architecture decisions, and current state*

---

## Project Identity
- **Name:** The Long Way Home
- **Type:** Browser-based educational game (Oregon Trail mechanics, Catholic curriculum)
- **Grade Bands:** K-2, 3-5, 6-8
- **Tech Stack:** React + Vite (client), Node.js + Express (server), Tailwind CSS, Framer Motion
- **Version:** 1.0.12 (MVP)

---

## Architecture Overview

### Client (React + Vite)
```
client/src/
├── App.jsx                    # Main app shell, phase-based rendering
├── main.jsx                   # Entry point, React Router setup
├── index.css                  # Tailwind + custom animations + no-scroll enforcement
├── store/GameContext.jsx       # Global state via useReducer + Context
├── game/                      # Pure JS game logic (no React)
│   ├── engine.js              # State machine, score calc, age-based food/pace
│   ├── events.js              # Event system (random + triggered)
│   ├── grace.js               # Grace meter logic
│   ├── gradeband.js           # Feature flags by grade band
│   ├── cwm.js                 # Corporal Works of Mercy events
│   ├── reciprocity.js         # Stranger Returns system
│   ├── reconciliation.js      # Make It Right events
│   ├── morallabels.js         # Label generation
│   ├── probability.js         # All probability calculations (age-modified)
│   ├── weather.js             # Historically accurate 1848 weather generation
│   ├── campActivities.js      # Camp activities system (11 activities)
│   └── tripReport.js          # End-of-trip difficulty index generator
├── components/
│   ├── game/                  # Student-facing game screens
│   │   ├── TitleScreen.jsx    # Title, join session, offline play
│   │   ├── SetupScreen.jsx    # Name, profession, party (age/gender), chaplain
│   │   ├── SupplyStore.jsx    # Supply purchase with emoji visuals
│   │   ├── TravelScreen.jsx   # Main travel loop — no-scroll viewport layout
│   │   ├── LandmarkScreen.jsx # Fort/mission arrival, rest & recover, medicine
│   │   ├── EventScreen.jsx    # Event resolution with SVG category icons
│   │   ├── GameOverScreen.jsx # Score, narrative, exam of conscience
│   │   └── shared/            # Reusable game UI components
│   │       ├── MoralLabel.jsx       # Centered pop-in moral label (green/red)
│   │       ├── PauseOverlay.jsx     # Teacher-paused overlay
│   │       ├── TrailMap.jsx         # Trail progress visualization
│   │       ├── TrailProgressBar.jsx # Dark trail bar with landmark markers + gold fill
│   │       ├── TrailSceneCSS.jsx    # Pure CSS trail scene with weather overlays
│   │       ├── OregonTrailMap.jsx   # SVG map with 1848 boundaries, zoom/pan
│   │       ├── TerrainScene.jsx     # Animated terrain with walking family figures
│   │       ├── CharacterFace.jsx    # Procedural SVG faces (role, mood, health, age)
│   │       ├── PartyStatus.jsx      # Party health/supplies
│   │       ├── SundayRestPrompt.jsx # Sunday rest decision
│   │       ├── HuntingMinigame.jsx  # Click-based hunting with hit feedback
│   │       ├── HistorianPanel.jsx   # AI Trail Historian chat
│   │       ├── KnowledgePanel.jsx   # Historical knowledge cards
│   │       ├── CampActivitiesPanel.jsx # Camp activities with 1848 dialogue
│   │       └── WeatherBox.jsx       # Temperature, wind, condition, ground
│   └── dashboard/             # Teacher dashboard
│       ├── TeacherDashboard.jsx  # Router wrapper
│       ├── SessionSetup.jsx      # Create/join session
│       ├── DashboardMain.jsx     # Student grid, controls, insights
│       ├── DashboardCharts.jsx   # Class-level analytics
│       ├── StudentCard.jsx       # Individual student card
│       ├── SettingsPanel.jsx     # Live session settings
│       └── TranscriptViewer.jsx  # AI transcript viewer
├── data/                      # Static game data (JSON)
│   ├── landmarks.json         # 16-landmark trail for 6-8
│   ├── landmarks-k2.json      # 5-stop trail for K-2
│   ├── events.json            # 50 events across 12 categories
│   ├── events-k2.json         # 8 simplified K-2 events
│   ├── illness.json           # 7 illness types with tiers + age vulnerability
│   ├── knowledge-panel.json   # 12 historical cards for 6-8
│   ├── knowledge-panel-3-5.json # 5 cards for 3-5
│   ├── moral-labels.json      # 22 label groups x 3 grade bands
│   ├── catholic-curriculum.json # CWM, Commandments, Beatitudes
│   ├── trail-flavor.js        # 300+ ambient narrative messages (14 categories)
│   └── trail-dangers.json     # 30+ trail dangers + 13 positive encounters
├── hooks/
│   └── useWindowWidth.js      # Responsive breakpoint hook (desktop/tablet/mobile)
├── shared/
│   └── types.js               # Shared data structures, constants, age modifiers
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
- [x] K-2 shortcut: SETUP → TRAVELING (skip profession/store)
- [x] Date system starting April 1, 1848
- [x] Daily food consumption by rations setting (cold weather multiplier: 1.2x below 50F, 1.4x below 32F)
- [x] Pace system (steady/strenuous/grueling) affecting distance and illness
- [x] Party health progression: good → fair → poor → critical → dead
- [x] Death checks for critical members (age-modified)
- [x] Mountain pass deadline (Oct 15) with blizzard risk
- [x] Win condition: reach Willamette Valley before Dec 31, 1848
- [x] Score calculation with Grace multiplier
- [x] LocalStorage persistence (auto-save every state change)
- [x] Server state sync (10-second polling)

### Grade Band System
- [x] K-2: 5-stop trail, no supply store, auto-provisioned wagon, 2 companions, guardian angel, immediate labels
- [x] 3-5: Full trail, pre-loaded supply "care package" (1 oxen yoke, 200 lbs food, 100 gal water), reduced budgets, 2-tier illness, reconciliation events
- [x] 6-8: Full game — tight budgets force real trade-offs, all features enabled
- [x] Feature flags via `getFeatureFlags(gradeBand)`
- [x] Session-level grade band (locked at creation)
- [x] Grade-specific profession cash: K-2 none, 3-5 ($500/$400/$300), 6-8 ($800/$600/$400)

### Party Member System
- [x] Per-member age selection: Child (0-12), Teen (13-17), Adult (18-54), Elder (55-65)
- [x] Per-member gender selection (male/female)
- [x] Age-based gameplay modifiers:
  - Child: higher illness (+4%), less food (0.6x), can't hunt/repair, slower pace (0.85x)
  - Teen: lower illness (-2%), slight morale bonus, faster pace (1.05x)
  - Adult: baseline
  - Elder: highest illness (+5%) and death (+3%) risk, less food (0.8x), slower pace (0.9x)
- [x] Party travel speed limited by slowest member's age pace modifier
- [x] Age vulnerability multipliers on all 7 illnesses (measles hits kids, exhaustion hits elders)
- [x] Per-member morale tracking with Talk to Family interaction
- [x] CharacterFace.jsx: procedural SVG faces differentiated by age (freckles for kids, wrinkles for elders)

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
- [x] Holy Bible (Douay-Rheims, $25) with prayer/morale/grace bonuses

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
- [x] Himiin Maqsmaqs (Nez Perce Scout) at Fort Boise — Nez Perce territory
- [x] Each scout provides regionally accurate dialogue with gameplay tips
- [x] Preloaded suggested questions with hardcoded answers (no AI dependency)

### Trail Flavor Text System
- [x] 300+ ambient narrative messages across 14 categories
- [x] Categories: terrain (4 types), weather, wildlife, camp life, humanity, children, faith, hardship, wagon train, night sky, food, water, seasonal, milestone
- [x] Weighted random selection based on game context
- [x] Historical humanity touches: singing, fiddle, harmonica, books, journal writing

### Difficulty Tuning
- [x] Base illness rate doubled (3% → 6%) with terrain/seasonal modifiers
- [x] Weekly trail wear mechanic (degraded health from journey hardship)
- [x] Morale decay every 5 days
- [x] Increased death chance at low food levels
- [x] Event frequency increased (threshold 0.75 → 0.60, 40% more events)
- [x] Terrain-adaptive difficulty: plains quieter, mountains harder
- [x] Weather compounds terrain difficulty
- [x] Late-season danger escalation (after Sep 15 and Nov 1)
- [x] Age-modified illness and death probabilities

### Chaplain & Clergy System
- [x] Chaplain with random age (28-55) and random skill (7 skills)
- [x] Skills: Banker, Carpenter, Blacksmith, Doctor, Scout, Teacher, Tradesman
- [x] Each skill provides specific gameplay bonuses
- [x] Chaplain costs: extra food, clothing wear, oxen strain, wagon fragility
- [x] Chaplain enables: prayer, last rites, Mass attendance, confession

### Resource Management
- [x] Water rationing (full/moderate/minimal) with heat multiplier (1.25x at 80F, 1.5x at 90F, 1.8x at 100F)
- [x] Firewood resource for cold weather survival (1 bundle/night below 50F, 2 below 32F)
- [x] Cold-without-fire penalty: morale drops, sleep recovery negated
- [x] Cold weather food consumption increase
- [x] Sleep schedule (short/normal/long) affecting travel, health, morale
- [x] Gather Firewood and Find Water actions
- [x] Medicine supply with USE_MEDICINE reducer
- [x] Item loss mechanics (12% chance during river crossings, theft, fire, storms)
- [x] Purchasable books (Farmer's Almanac $75, Trail Guide $90), tools ($50), Bible ($25)

### Landmark Rest & Recovery
- [x] Rest & recover mechanic (1-3 days) at landmarks
- [x] Heals party, boosts morale, refills water
- [x] Medicine button for sick members
- [x] Enhanced party status display with morale bars

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
- [x] Dashboard charts / analytics
- [x] Feedback link (Google Form pre-populated)

### Historical Knowledge Panel
- [x] 12 contextual cards for 6-8
- [x] 5 simplified cards for 3-5
- [x] Trigger by landmark arrival or event type
- [x] Non-blocking (rest points only)
- [x] Reading tracked per student

### Weather System
- [x] Historically accurate 1848 weather generation based on month, terrain, and region
- [x] Temperature (Fahrenheit), wind speed/direction, 16 condition types
- [x] Deterministic via seeded PRNG
- [x] Ground conditions: firm, dry, damp, wet, muddy, sloshy, icy, snowpack
- [x] Ground moisture accumulates from recent weather history (last 5 days)
- [x] Terrain weather shifts: mountains boost snow, rivers boost fog/rain, desert boosts dust storms
- [x] Weather affects travel speed and illness probability
- [x] WeatherBox UI with temperature, wind, condition, ground, travel impact

### Camp Activities System
- [x] 11 activities with 1848-appropriate language
- [x] Time cost, cooldown system, grade band filtering
- [x] Mission-only activities: attend Mass, confession
- [x] Rich family dialogue system with 40+ lines across morale states
- [x] Family suggestions providing actionable hints based on game state
- [x] CampActivitiesPanel UI

### Trail Dangers & Positive Encounters
- [x] 30+ trail dangers across 9 categories
- [x] Difficulty score (0-10), terrain/season/weather filters
- [x] Choice-based dangers (robbery, bad water, etc.)
- [x] Lingering danger: boosted probability when stationary
- [x] 13 positive encounters including CWM opportunities
- [x] Grace-influenced encounter probability

### Trip Management & Miles Calculation
- [x] Miles driven by pace x weather x ground x oxen care x grace bonus/penalty
- [x] Oxen check bonus, grace influence on travel
- [x] Lingering danger system with warning after 2+ rest days
- [x] Daily bonuses reset each travel day

### Trip Difficulty Report
- [x] End-of-trip difficulty index (0-10 scale)
- [x] Four weighted categories: weather (25%), trail dangers (35%), party health (25%), supply management (15%)
- [x] Grace influence summary

### Crash Logging & Error Recovery
- [x] Client-side crash logger with user action tracking (last 30 actions)
- [x] Crash reports: error + stack, game state snapshot, recent actions, browser info
- [x] Reports stored in localStorage (up to 20) AND sent to server
- [x] Global error handlers for uncaught exceptions and unhandled promise rejections
- [x] Server endpoint: POST/GET crash reports

### Visual Design
- [x] No-scroll viewport-locked layout (html/body/root overflow:hidden)
- [x] Responsive: side-by-side on desktop (scene 44% / panel 56%), stacked on tablet/mobile
- [x] Playfair Display for headings, Crimson Pro for body (Google Fonts)
- [x] Color token system: --parchment, --amber, --ink, --gold, etc.
- [x] clamp() font sizing for proportional scaling
- [x] Animated walking family members (gender/age-aware) in terrain scene
- [x] Chaplain figure with cross, spinning wagon wheels, animated oxen
- [x] Pure CSS trail scene with weather overlays and travel animation
- [x] Procedural SVG character faces parameterized by role, mood, health, age
- [x] SVG trail map with 1848 state/territory boundaries, topographical features, zoom/pan
- [x] Event screen SVG illustration icons per category
- [x] Moral label centered pop-in animation (green positive, red negative)
- [x] SupplyStore with emoji visuals, fits one screen
- [x] Grace pip meter in header

### Test Suite
- [x] 12 weather system tests
- [x] 12 camp activities tests
- [x] Custom ESM loader for running tests outside Vite
- [x] Balance playtest script (500-run Monte Carlo)
- [x] All 24 tests passing

---

## Design Decisions

1. **useReducer over Redux** — Game state is complex but contained within a single provider. No need for middleware or dev tools at MVP.
2. **Polling over WebSocket** — Simpler to implement; 10s interval acceptable for classroom use. WebSocket planned for v2.
3. **In-memory server state** — No database for MVP. Sessions are ephemeral (single class period). Server restart clears all data.
4. **CWM deceptive flag never in student state serialization to client** — The `recipientGenuine` field is stored in `cwmEvents[]` but the student UI never reads it. Teacher dashboard reads it from server-synced state.
5. **Separate landmark data files per grade band** — Avoids complex filtering in-game; K-2 has its own trail.
6. **Moral labels as JSON data** — All label text externalized for easy editing by curriculum reviewers.
7. **K-2 skips store entirely** — Young children shouldn't make economic decisions. They get a fully provisioned wagon and jump straight to travel.
8. **Grade-specific budgets** — 3-5 gets a care package plus reduced cash; 6-8 gets tight budgets forcing real trade-offs.
9. **Age as a gameplay mechanic** — Children are a liability (can't work, get sick easily), elders slow the party. Creates strategic party composition.
10. **No-scroll UI** — Everything fits in the viewport. No scrolling required. This is critical for Chromebook classroom use.

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
Netlify Functions are stateless — the in-memory session store resets between cold starts. This means:
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

## Version History

### v1.0.0 — Initial Build (2026-03-01)
- Complete project scaffolding and all core game systems
- 9 game data files, 9 game logic modules, 7 game screens, 8 shared components
- Full teacher dashboard with session management
- AI integration (Historian, NPC, Insights, Exam of Conscience)

### v1.0.1 — Playtest Bug Fixes (2026-03-01)
- 15 bugs found and fixed (3 critical, 5 medium, 7 low)
- Critical: distance initialization, Sunday rest infinite loop, game win showing failure

### v1.0.2 — Deployment Setup (2026-03-02)
- Netlify deployment support, multi-platform deploy configs
- Serverless function wrapper for Express app

### v1.0.3 — Playtest Feedback & UI Overhaul (2026-03-02)
- Layout overhaul (no scrolling), SVG trail map, terrain visualization
- Moral labels fix (CWM choice detection), event template placeholders
- Hunting minigame fix (food accumulation), NPC scout system
- Difficulty increase, 300+ trail flavor text messages

### v1.0.4 — Weather, Camp Activities, Trail Dangers & Crash Logging (2026-03-02)
- Weather system (16 conditions, ground tracking, terrain modifiers)
- Camp activities (11 activities, 1848 language, family dialogue)
- Trail dangers (30+ dangers, 13 positive encounters, grace-influenced)
- Trip difficulty report, crash logging

### v1.0.5 — Bible, Item Loss, Profession Difficulty Tiers (2026-03-02)
- Holy Bible item with prayer/morale/grace bonuses
- Item loss mechanics (12% per qualifying danger)
- Profession cash rebalanced via Monte Carlo simulation

### v1.0.6 — Resource Management, Per-Member Morale, Terrain-Adaptive Difficulty (2026-03-02)
- Water rationing, firewood, cold/heat effects, sleep schedule
- Per-member morale with Talk to Family interaction
- Terrain-adaptive difficulty scaling
- Travel screen UI redesign with hero terrain scene

### v1.0.7 — Comprehensive UI/UX Overhaul (2026-03-02)
- TravelScreen: 2/3 terrain + 1/3 weather/log, 4-column dashboard, zero scrollbars
- TerrainScene: animated walking family (gender/age-aware), chaplain, spinning wheels
- SetupScreen: age picker (Child/Teen/Adult/Elder) and gender selector
- EventScreen: SVG illustration icons per event category
- LandmarkScreen: rest & recover mechanic (1-3 days), medicine button
- Clergy skills system (7 skills with gameplay effects)
- Medicine as purchasable supply

### v1.0.8 — K-2 Simplification & Grade-Band Economics (2026-03-03)
- K-2 skips profession and store, starts as "settler" with full provisions
- 3-5 gets pre-loaded care package, reduced budgets
- 6-8 budgets tightened ($800/$600/$400) for real trade-offs

### v1.0.9 — No-Scroll UI Redesign (2026-03-03)
- Viewport-locked layout per design spec v2.0
- New components: CharacterFace, TrailSceneCSS, TrailProgressBar
- Responsive breakpoints via useWindowWidth hook
- Playfair Display + Crimson Pro typography, color token system

### v1.0.10 — Age-Based Gameplay & Visual Differentiation (2026-03-03)
- Age modifiers: illness, death, food, hunting, repair, pace per age group
- Age vulnerability on all 7 illnesses
- CharacterFace: age-differentiated features (freckles, wrinkles, gray hair)
- TerrainScene: age-differentiated walking figures with size/speed scaling

### v1.0.11 — Unicode Fixes & Font Scaling (2026-03-03–06)
- Fixed unicode escapes rendering as literal text in JSX
- Increased font sizes throughout for Chromebook readability
- TitleScreen scroll fix, SupplyStore compacted for 768px viewport
- SupplyStore redesigned with bigger visuals and emoji icons

### v1.0.12 — CLAUDE.md Update (2026-03-07)
- Updated CLAUDE.md to match actual project structure
- Removed aspirational engine/games separation
- Accurate file tree reflecting all current source files

---

*This document should be updated as features are added, bugs are fixed, and architectural decisions are made.*
