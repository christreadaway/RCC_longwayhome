# PROJECT_STATUS.md — The Long Way Home
*Quick-reference status document. Updated 2026-03-20.*

---

## Current State: MVP Complete

The Long Way Home is a browser-based educational game — Oregon Trail mechanics rebuilt for Catholic classroom use (K-2, 3-5, 6-8). The MVP is feature-complete and deployed.

**Live URL:** longwayhome.netlify.app
**Repo:** christreadaway/RCC_longwayhome
**Project root:** `long-way-home/`

---

## Build Status

| Check | Status |
|-------|--------|
| Client build (`npm run build`) | Passing (77 modules, 500KB JS, 40KB CSS) |
| Server starts (`npm start`) | Passing |
| Tests (24 unit tests) | Passing |
| TODO/FIXME/HACK in code | 0 |
| Deployment (Netlify) | Live |

---

## Codebase Metrics

| Metric | Value |
|--------|-------|
| Client source files | 63 (JS/JSX/JSON) |
| Server source files | 11 (JS) |
| Game logic modules | 12 files (~166KB) |
| Reducer actions | 53 |
| Game events | ~50 |
| Trail landmarks (6-8) | 16 |
| Trail stops (K-2) | 5 |
| Trail flavor messages | 300+ |
| Trail dangers | 30+ |
| Positive encounters | 13 |
| Knowledge panel cards | 17 (12 for 6-8, 5 for 3-5) |
| Moral label groups | 22 (x3 grade bands) |
| Camp activities | 11 |
| Weather conditions | 16 |
| NPC characters | 7 |
| Unit tests | 24 |

---

## What Works

### Core Game
- Complete state machine: TITLE → SETUP → SUPPLY_PURCHASE → TRAVELING → LANDMARK → EVENT → GAME_OVER
- K-2 shortcut: SETUP → TRAVELING (skip profession/store)
- Daily travel with weather, food/water consumption, illness, death checks
- Pace, rations, water rationing, sleep schedule settings
- Per-member health (good → fair → poor → critical → dead)
- Per-member morale with Talk to Family interaction
- Age-based modifiers (child, teen, adult, elder) on illness, death, food, pace
- Hunting minigame, firewood gathering, water finding
- Item loss mechanics (12% per qualifying danger event)
- Mountain pass deadline with blizzard risk
- Score calculation with Grace multiplier

### Catholic Content
- Grace Meter (0-100, teacher-visible only)
- 7 Corporal Works of Mercy events (max 3 per game, 25% deceptive)
- Stranger Reciprocity system (returns after CWM help)
- Reconciliation "Make It Right" events
- Sunday rest mechanic
- Chaplain with random skill (7 types) enabling prayer, Mass, confession, last rites
- Holy Bible item with spiritual bonuses
- Moral labeling (3 modes: full, post-choice, discussion-only)
- Grade-appropriate labels for all event types
- Examination of Conscience at game end
- Grace-based arrival narrative (4 variants)

### AI Features (server-proxied, teacher provides API key)
- Trail Historian Q&A
- NPC encounters (7 characters, preloaded + AI dialogue)
- Examination of Conscience generator
- Class Insights generator
- Graceful fallbacks when API unavailable

### Teacher Dashboard
- Session creation with code, password, grade band
- Real-time student grid (10-second polling)
- Student cards with health, Grace, location, CWM indicators
- Pause/Resume all, settings panel, transcript viewer
- CSV export, crash report viewer, debug panel

### Visual Design
- Material Design 3 period-document aesthetic with semantic color system
- Typography: Newsreader (headlines), Noto Serif (body), Work Sans (labels)
- No-scroll viewport-locked layout
- Responsive: desktop side-by-side, tablet/mobile stacked
- Animated terrain scene with walking family (age/gender-aware)
- Period-appropriate 1840s SVG portraits (felt hats, sunbonnets, newsboy caps, pigtails, biretta)
- 15+ unique portrait variations per gender via name-seeded deterministic traits
- Terrain-specific trail scenes (plains, hills, mountains, river) with all 16 weather conditions rendered
- SVG trail map with 1848 boundaries
- SupplyStore with emoji visuals
- Event category SVG icons
- CSS keyframe animations for weather, vegetation, and water effects

---

## What Doesn't Work Yet

### Known Limitations (MVP)
- **No persistent database** — sessions lost on server restart / serverless cold start
- **Polling, not WebSocket** — 10-second dashboard latency
- **Serverless state issue** — Netlify Functions are stateless; classroom sessions with teacher dashboard need a long-running server (Render, Railway, Docker)
- **No mobile layout** — works on tablet landscape, not phone
- **Bundle size** — 500KB JS (should code-split for production)

### Not Yet Tested
- [ ] AI Historian with real Anthropic API key
- [ ] Full K-2 playthrough end-to-end
- [ ] Full 3-5 playthrough end-to-end
- [ ] CWM event firing across many playthroughs
- [ ] Deceptive charity rate statistical validation
- [ ] NPC 3-exchange cap enforcement
- [ ] CSV export data completeness
- [ ] Performance on low-end Chromebooks
- [ ] No API key leakage in client network traffic

### Bugs / Polish Needed
- Bundle size warning (500KB+ gzipped at 154KB — consider code splitting)
- Firewood not purchasable at supply store (gather-only currently)

---

## Grade Band Differences

| Feature | K-2 | 3-5 | 6-8 |
|---------|-----|-----|-----|
| Trail stops | 5 | 16 | 16 |
| Supply store | Skip | Simplified (care package) | Full |
| Profession choice | No (settler) | Yes | Yes |
| Starting cash | $0 (auto-provisioned) | $300-500 | $400-800 |
| Illness | Single event | 2-tier | Full progression |
| Hunting | No | Yes | Yes |
| Chaplain | No | Optional | Optional |
| AI Historian | No | No | Yes |
| Reconciliation | No | Yes | Yes |
| Moral labels | Immediate | Post-choice | Teacher-controlled |
| Guardian angel | Yes | No | No |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| State | React Context + useReducer (53 actions) |
| Server | Node.js + Express |
| AI | Anthropic API (claude-haiku-4-5) via server proxy |
| Sync | HTTP polling (10s) |
| Storage | In-memory (server) + localStorage (client) |
| Deploy | Netlify (client + serverless) |

---

## Documentation Map

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Architecture, coding standards, debugging — for Claude Code sessions |
| `product_spec.md` | Full feature list, implementation details, version history |
| `business_spec.md` | Market, monetization, distribution, competitive analysis |
| `session_notes.md` | Build log — decisions, bugs, fixes per session |
| `the-long-way-home-requirements.md` | Original PRD (grade bands, user stories, features) |
| `catholic.md` | Catholic values framework for game design |
| `lwyh-enhancements-requirements.md` | Future: 150+ events, branching routes, personality system |
| `lwyh-ui-design-spec.md` | UI/UX design spec v2.0 |

---

## Roadmap

### Next (v2)
- Persistent database (PostgreSQL or SQLite)
- WebSocket real-time sync
- Managed API key tier
- Teacher onboarding tutorial
- Code splitting for bundle size

### Later (v3 — Premium)
- 150+ events
- 3 branching trail routes
- Party personality system
- Student accounts
- School/diocese licensing

---

## Quick Start

```bash
cd long-way-home
npm install && cd client && npm install && cd ..
cp .env.example .env
npm run dev
# Client: http://localhost:5173
# Server: http://localhost:3000
# Teacher dashboard: http://localhost:5173/teacher
```

---

*Last updated: 2026-03-20 | 13 build sessions completed*
