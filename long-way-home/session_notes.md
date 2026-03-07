# Session Notes — The Long Way Home
*Running log of build sessions, decisions, and issues*

---

## Session 1 — Initial Build (2026-03-01)

### What was built
- Complete project scaffolding: React + Vite client, Node.js + Express server
- All 9 game data files (landmarks, events, illness, knowledge panel, moral labels, catholic curriculum)
- All 9 game logic modules (engine, events, grace, gradeband, cwm, reciprocity, reconciliation, morallabels, probability)
- Full server backend with 5 route groups (session, historian, npc, insights, export)
- AI proxy with Anthropic API integration and fallback responses
- Complete student game UI (7 screens + 8 shared components)
- Complete teacher dashboard (session setup, student grid, settings, transcripts, CSV export)
- Shared types and constants module
- Client-side utilities (logger, API client, date utils)
- product_spec.md and session_notes.md

### Key decisions made
- **Game name:** "The Long Way Home" (confirmed from spec)
- **Primary grade band:** 6-8 built first with full features; K-2 and 3-5 supported via feature flags
- **Art style:** Warm illustrated storybook palette with SVG/CSS graphics (no external assets needed for MVP)
- **State management:** React Context + useReducer (simpler than Redux for MVP)
- **Server state:** In-memory only (no database for MVP)
- **AI model:** claude-haiku-4-5 default (cheapest for classroom use)
- **Trail chaplain:** Named "Fr. Joseph" (Franciscan friar)
- **Moral labeling:** Implemented all 3 modes (full, post-choice, discussion-only) with teacher control
- **Deceptive charity:** 25% probability, Grace tracks intent not outcome, teacher dashboard shows flag, student never sees it
- **Grade band lock:** One grade band per session, set at creation, cannot be changed

### Issues found during build
- Build error: `Could not resolve "../../shared/types"` — paths went outside client dir. Fixed with Vite alias `@shared` and copied types.js to `client/src/shared/`
- Build warning: Duplicate `speed: 3` key in HuntingMinigame.jsx — removed duplicate
- Port 3000 EADDRINUSE — killed stale process
- Dashboard field mismatches: `student.name` → `student.studentName`, `student.id` → `student.studentId`

---

## Session 2 — Playtest & Bug Fixes (2026-03-01)

### Bugs found (15 total via automated code review)

#### Critical (3)
1. **`distanceToNextLandmark` never initialized** — TravelScreen immediately "arrived" at next landmark. **Fix:** Added `SET_DISTANCE` reducer action.
2. **Sunday "Don't rest" infinite loop** — Declining rest re-detected Sunday. **Fix:** Added `skipSundayCheckRef`.
3. **Game win shows failure screen** — `ARRIVE_LANDMARK` never set `status: 'completed'`. **Fix:** Set status when isFinal.

#### Medium (5)
4. Starvation doesn't kill party members — Fixed with `PARTY_MEMBER_DIES` dispatch
5. Stale `aliveMembers` after starvation — Compute post-starvation list
6. Default travel message overwrites illness/death — Use local `dayMessage` variable
7. `handleRest` missing guards — Added end date and all-dead checks
8. Feast day fires on wrong date — Use `addDays()` for post-advance date

#### Low (7)
9–15. Render-time dispatch, confusing hook guard, useMemo with full state dep, stale closure in hunting ammo, nested state update in hunting, unused import, missing useEffect dependency

---

## Session 3 — Verification & Deployment (2026-03-02)

### What was done
- Full project verification across 10 checkpoints — all passing
- Production build: 67 modules, 366KB JS (111KB gzipped)
- Netlify deployment support (`netlify.toml`, serverless function wrapper)
- Multi-platform configs: Dockerfile, render.yaml, Procfile
- Refactored `server/index.js` with `require.main === module` guard
- Site deployed at longwayhome.netlify.app

### Key decisions
- **Netlify as primary deploy** — free tier, offline play works as static site
- **Express app exported without listen()** — works standalone and as serverless function
- Base directory must be set in Netlify UI (chicken-and-egg with `netlify.toml`)

---

## Session 4 — Playtest Feedback & Major UI Overhaul (2026-03-02)

### Context
Live playtest revealed 13+ issues across UI, game logic, difficulty, NPC accuracy, and content variety.

### What was done
- **Layout overhaul** — viewport-fitting, no scrolling, 3-column layout
- **SVG Trail Map** — `OregonTrailMap.jsx` with 1848 state/territory boundaries, zoom/pan
- **Terrain visualization** — `TerrainScene.jsx` with 4 scene types
- **Moral labels fix** — CWM choice detection changed from `choice.id === 'help'` to `grace_change > 0`
- **Event template placeholders** — `{member_name}`, `{student_name}`, `{party_size}` now resolved
- **Event effects fix** — `morale_change`/`health_change` keys now recognized alongside `morale`/`health_delta`
- **Hunting minigame** — Larger animals, food accumulation fix (React state batching), hit feedback
- **NPC scouts** — Historically accurate tribal scouts per region (Pawnee, Shoshone, Bannock, Nez Perce)
- **Difficulty increase** — Illness 3%→6%, trail wear, morale decay, event frequency +40%
- **Trail flavor text** — 300+ ambient messages across 14 categories

---

## Session 5 — Weather, Camp Activities, Trail Dangers & Crash Logging (2026-03-02)

### What was built
- **Weather system** — 16 conditions, seeded PRNG, ground moisture tracking, terrain modifiers, travel speed effects
- **Camp activities** — 11 activities in 1848-appropriate language, family dialogue (40+ lines), suggestions
- **Trail dangers** — 30+ dangers (9 categories), 13 positive encounters, grace-influenced, lingering danger
- **Trip difficulty report** — 0-10 index with weighted scoring
- **Crash logging** — Client action tracking (30 actions), game state snapshots, server persistence
- **TravelScreen integration** — weather → miles → dangers → encounters → illness pipeline
- **Tests** — 12 weather + 12 camp activities, all passing

### Key decisions
- Seeded PRNG for reproducible weather
- Ground conditions as accumulated moisture (5-day window)
- Lingering danger — historically accurate: stragglers faced more bandits
- 1848-appropriate language throughout (johnnycakes, buffalo chips, mumblety-peg, tallow, felloe)

---

## Session 6 — Bible, Item Loss, Profession Difficulty Tiers (2026-03-02)

### What was built
- **Holy Bible** ($25) — prayer/morale/grace bonuses, can be gifted at missions (40% chance)
- **Item loss mechanics** — 12% chance per qualifying danger (river, theft, fire, storm)
- **Profession difficulty tiers** — Tradesman Easy ($1200), Farmer Medium ($900), Banker Hard ($650). Validated via 500-run Monte Carlo simulation.
- **Balance playtest script** (`balancePlaytest.mjs`)

### Key decisions
- Bible is cheap ($25) — spiritual benefits accessible to any profession
- Item loss at 12% — tension without frustration
- Professions are intentional difficulty tiers, not balanced equally
- Monte Carlo validation, not guesswork

---

## Session 7 — Resource Management, Per-Member Morale, Terrain-Adaptive Difficulty & UI Redesign (2026-03-02)

### What was done
- **Water rationing** (full/moderate/minimal) with heat multiplier
- **Firewood** for cold weather survival, gather action
- **Cold weather effects** — increased food consumption, no-fire penalties
- **Sleep schedule** (short/normal/long)
- **Per-member morale** — individual tracking, Talk to Family action, contextual dialogue
- **Terrain-adaptive difficulty** — plains quieter, mountains harder, weather compounds terrain
- **UI redesign** — Hero terrain scene (35vh), narrative bar, dashboard below
- **TerrainScene rewrite** — 800x280 SVG with detailed wagon, oxen, weather-responsive sky
- **Mini-map overlay** on terrain scene
- **Playtest bug fixes** — starvation cold weather mismatch, water rations healthModifier wiring

### Balance analysis
- Trip duration ~136 days at steady pace, ~151 with weather (April → ~September)
- Food budget: 2,265 lbs needed, affordable for all professions
- Difficulty curve: Plains (easy) → Hills → Mountains (hard) → River → Mountains (late)

---

## Session 8 — Comprehensive UI/UX Overhaul (2026-03-02)

### What was done

#### TravelScreen
- 2/3 terrain scene + 1/3 weather/log layout
- 4-column dashboard: actions, travel plan, supplies with icons, party status
- Per-person health bars and morale meters with contextual status hints
- Toggleable camp activities panel
- Zero scrollbars enforced

#### TerrainScene
- Animated walking family members (gender/age-aware)
- Chaplain figure with cross
- Spinning wagon wheels, animated oxen
- Drifting clouds, pulsing dust effects

#### SetupScreen
- Age picker: Child (0-12) / Teen (13-17) / Adult (18-54) / Elder (55-65)
- Gender selector (male/female) for player and all companions
- Chaplain with random age and skill preview

#### EventScreen
- SVG illustration icons per event category (weather, illness, hazard, resource, cwm, moral choice)

#### LandmarkScreen
- Rest & recover mechanic (1-3 days): heals party, boosts morale, refills water
- Medicine button for sick members
- Enhanced party status with morale bars and supply details

#### New Data Model Additions
- Clergy skills system: 7 skills (Banker, Carpenter, Blacksmith, Doctor, Scout, Teacher, Tradesman) with gameplay effects
- Medicine supply with USE_MEDICINE reducer
- Per-member age and gender fields

#### SupplyStore
- Medicine added as purchasable item

### Files modified
- TravelScreen, TerrainScene, SetupScreen, EventScreen, LandmarkScreen, SupplyStore, index.css, types.js (both), GameContext

---

## Session 9 — K-2 Simplification & No-Scroll UI Redesign (2026-03-03)

### What was done

#### K-2 Game Start Simplification
- K-2 skips profession selection and supply store entirely
- Players start as "settler" (moderate repair: 45% without parts, 0.25 day penalty)
- Auto-provisioned wagon: 400 lbs food, 200 gal water, 2 oxen yokes, spare parts, medicine
- Added SETUP → TRAVELING direct transition for K-2
- Added 'settler' to Profession typedef

#### Grade-Band Economics Rebalance
- **3-5:** Pre-loaded care package (1 oxen yoke, 200 lbs food, 100 gal water) free in wagon. Store only charges above baseline. Reduced budgets: Tradesman $500, Farmer $400, Banker $300
- **6-8:** Tight budgets forcing real trade-offs: Tradesman $800, Farmer $600, Banker $400 (down from $1200/$900/$650)

#### No-Scroll UI Redesign (Design Spec v2.0)
- Viewport-locked layout: `html/body/root overflow:hidden`
- Side-by-side on desktop (scene 44% / panel 56%), stacked on tablet/mobile
- JS breakpoint hook (`useWindowWidth`) drives CSS and JSX logic
- Fixed header bar (48px) and resource bar (38px), everything else flexes

#### New Components
- `CharacterFace.jsx` — Procedural SVG faces parameterized by role, mood, health
- `TrailSceneCSS.jsx` — Pure CSS trail scene (sky gradients, hills, road, trees, clouds, wagon) with weather overlays and travel animation
- `TrailProgressBar.jsx` — Dark-background trail with landmark markers and gold fill
- `useWindowWidth.js` — Responsive breakpoint hook (desktop/tablet/mobile)

#### Typography & Color
- Playfair Display for headings, Crimson Pro for body (Google Fonts)
- New color token system: --parchment, --amber, --ink, --gold, etc.
- clamp() font sizing for proportional scaling across breakpoints

### Key decisions
- **K-2 skips store** — young children shouldn't make economic decisions
- **3-5 care package** — scaffolding reduces cognitive load while keeping the store experience
- **6-8 tight budgets** — previous $1200/$900/$650 was too easy; every dollar now matters
- **No-scroll layout** — critical for Chromebook 768px viewports

---

## Session 10 — Age-Based Gameplay & Visual Differentiation (2026-03-03)

### What was done

#### Age-Based Gameplay Modifiers
- New `AGE_MODIFIERS` and `getAgeGroup`/`getAgeModifiers` in types.js
- **Child:** slower pace (0.85x), less food (0.6x), can't hunt/repair, higher illness (+4%) and death (+2%) risk
- **Teen:** faster pace (1.05x), slight morale bonus (+3), lower illness (-2%) and death (-1%) risk
- **Adult:** baseline
- **Elder:** slower pace (0.9x), less food (0.8x), highest illness (+5%) and death (+3%) risk

#### Engine Integration
- `probability.js`: illness and death checks factor member age
- `engine.js`: food consumption uses per-member age multiplier, party travel speed limited by slowest member
- `illness.json`: age_vulnerability multipliers on all 7 illnesses (measles hits kids, exhaustion hits elders)

#### Visual Differentiation
- `CharacterFace.jsx`: children get rounder faces + freckles + big eyes, teens get eyebrow emphasis, elders get gray hair streaks + crow's feet wrinkles
- `TerrainScene.jsx`: age-differentiated walking figures with size scaling, animation speed (teens bounce faster, elders walk slower), clothing colors by age, walking stick for elders

#### Fixes
- Elder age range corrected: 55-65 (was 46-65), Adult now 18-54
- Overflow: hidden on root elements was cutting off EventScreen buttons — fixed
- SetupScreen font sizes bumped ~2px throughout

---

## Session 11 — Unicode Fixes, Font Scaling & SupplyStore Redesign (2026-03-03 to 2026-03-06)

### What was done

#### Unicode Fixes
- Fixed `\u00B0` (degree symbol) rendering as literal text `\u00B0` in JSX
- Replaced all unicode escapes with literal characters throughout codebase
- Affected files: SetupScreen, TravelScreen, WeatherBox

#### Font Scaling
- Increased font sizes throughout for Chromebook readability
- TitleScreen: fixed scrolling issue, increased all type sizes
- SetupScreen: bumped fonts ~2px

#### SupplyStore Redesign
- Complete visual overhaul with bigger item cards and emoji icons
- Fits one screen on 768px viewport (no scrolling)
- Compacted layout for Chromebook landscape

### Files modified
- TitleScreen, SupplyStore (major rewrites), SetupScreen, TravelScreen, WeatherBox, index.css

---

## Session 12 — CLAUDE.md Update (2026-03-07)

### What was done
- Updated CLAUDE.md to match actual project structure
- Removed aspirational engine/games directory separation that doesn't exist
- Removed Future Games section (Journey of Paul, Mayflower, Crusades)
- Removed engine extraction philosophy
- Removed "Open Questions for Chris" section
- Updated file tree to reflect all actual source files
- Added deployment info (Render + Netlify)
- Filled in Grace Meter documentation (was "see above" placeholder)
- Updated running locally section with correct relative paths
- Updated product_spec.md with sessions 8-12 version history
- Created business_spec.md
- Updated session_notes.md with sessions 8-12

---

*Add new session entries below as the project evolves.*
