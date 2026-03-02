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
│   │       ├── MoralLabel.jsx       # Dismissible moral label card
│   │       ├── PauseOverlay.jsx     # Teacher-paused overlay
│   │       ├── TrailMap.jsx         # Trail progress visualization
│   │       ├── PartyStatus.jsx      # Party health/supplies
│   │       ├── SundayRestPrompt.jsx # Sunday rest decision
│   │       ├── HuntingMinigame.jsx  # Canvas-based hunting
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
│   └── catholic-curriculum.json # CWM, Commandments, Beatitudes
└── utils/
    ├── logger.js              # Client-side logger with buffer
    ├── api.js                 # API client wrapper
    └── dateUtils.js           # Game date utilities
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
│   └── export.js              # CSV session export
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
- [x] NPC Encounters (4 characters, 3-exchange cap)
- [x] Personalized Examination of Conscience (AI-generated from event log)
- [x] Teacher Insight Generator (anonymized aggregate analysis)
- [x] Graceful fallbacks when API unavailable
- [x] API key security (server-side only, never logged)

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

### Visual Design
- [x] Warm illustrated storybook palette (tan/brown/blue/gold)
- [x] Animated wagon SVG
- [x] Parallax trail scene header
- [x] Health-coded party status bars
- [x] Grace-colored progress bar (teacher only)
- [x] Pulsing knowledge panel indicators
- [x] Moral label slide-in/fade-out animation
- [x] Mission vs Fort distinct visual treatment

---

## Design Decisions

1. **useReducer over Redux** — Game state is complex but contained within a single provider. No need for middleware or dev tools at MVP.
2. **Polling over WebSocket** — Simpler to implement; 10s interval acceptable for classroom use. WebSocket planned for v2.
3. **In-memory server state** — No database for MVP. Sessions are ephemeral (single class period). Server restart clears all data.
4. **CWM deceptive flag never in student state serialization to client** — The `recipientGenuine` field is stored in `cwmEvents[]` but the student UI never reads it. Teacher dashboard reads it from server-synced state.
5. **Separate landmark data files per grade band** — Avoids complex filtering in-game; K-2 has its own trail.
6. **Moral labels as JSON data** — All label text externalized for easy editing by curriculum reviewers.

---

## Known Limitations (MVP)

- No persistent database — sessions lost on server restart
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

---

*This document should be updated as features are added, bugs are fixed, and architectural decisions are made.*
