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
- **Trail chaplain:** Named "Fr. Joseph" (Franciscan friar) — generic enough to avoid denominational issues
- **Moral labeling:** Implemented all 3 modes (full, post-choice, discussion-only) with teacher control
- **Deceptive charity:** 25% probability, Grace tracks intent not outcome, teacher dashboard shows flag, student never sees it
- **Grade band lock:** One grade band per session, set at creation, cannot be changed

### Open items
- [ ] Playtest all game phases end-to-end
- [ ] Verify CWM event firing logic across multiple playthroughs
- [ ] Test deceptive charity rate across 100+ events
- [ ] Verify Sunday rest health recovery
- [ ] Test AI Historian with real API key
- [ ] Test NPC encounters with 3-exchange cap
- [ ] Verify CSV export completeness
- [ ] Test K-2 simplified trail flow
- [ ] Test 3-5 intermediate variant
- [ ] Performance test on Chromebook-equivalent specs
- [ ] Verify no API key leakage in client network traffic

### Issues found during build
- Build error: `Could not resolve "../../shared/types"` — paths went outside client dir. Fixed with Vite alias `@shared` and copied types.js to `client/src/shared/`
- Build warning: Duplicate `speed: 3` key in HuntingMinigame.jsx — removed duplicate
- Port 3000 EADDRINUSE — killed stale process
- Dashboard field mismatches: `student.name` → `student.studentName`, `student.id` → `student.studentId` in StudentCard, DashboardMain, TranscriptViewer

---

## Session 2 — Playtest & Bug Fixes (2026-03-01)

### Bugs found (via automated code review)

#### Critical
1. **`distanceToNextLandmark` never initialized** — Initial state had `distanceToNextLandmark: 0`, TravelScreen useEffect dispatched ADVANCE_DAY (which doesn't set distance) instead of a proper distance setter. Every day immediately "arrived" at next landmark. **Fix:** Added `SET_DISTANCE` reducer action; TravelScreen useEffect now dispatches `SET_DISTANCE` with `nextLandmark.distance_from_previous`.
2. **Sunday "Don't rest" infinite loop** — Declining rest called `travelOneDay()`, which re-detected Sunday and showed the prompt again. **Fix:** Added `skipSundayCheckRef` that bypasses Sunday check when player explicitly declines rest.
3. **Game win shows failure screen** — `ARRIVE_LANDMARK` reducer set `phase: 'GAME_OVER'` for final landmark but never set `status: 'completed'`. GameOverScreen checked `status === 'completed'` for win detection. **Fix:** `ARRIVE_LANDMARK` now sets `status: 'completed'` when isFinal.

#### Medium
4. **Starvation doesn't kill party members** — `UPDATE_PARTY_HEALTH` degraded health to 'dead' but `alive` flag stayed true (only `PARTY_MEMBER_DIES` sets alive=false). **Fix:** TravelScreen starvation logic now dispatches `PARTY_MEMBER_DIES` for members whose health would become 'dead'.
5. **Stale `aliveMembers` after starvation** — Death check used pre-starvation alive list. **Fix:** Compute `aliveAfterStarvation` after starvation processing, use it for all subsequent checks.
6. **Default travel message overwrites illness/death** — `travelMessage` state was stale in closure; default message always overwrote. **Fix:** Use local `dayMessage` variable, only set default when empty.
7. **`handleRest` missing guards** — No check for end date or all-dead before resting. **Fix:** Added guard checks at start of handleRest.
8. **Feast day fires on wrong date** — Feast check used `state.gameDate` before ADVANCE_DAY. **Fix:** Use `addDays(state.gameDate, 1)` for post-advance date.

#### Low
9. **EventScreen dispatch during render** — `dispatch({ type: 'SET_PHASE' })` called during render body when event is null. **Fix:** Moved to useEffect.
10. **`useGameState()` confusing guard** — `if (!context && context !== initialState)` was logically misleading. **Fix:** Simplified to `if (context === null)`.
11. **GameOverScreen useMemo [state]** — Entire state object as dependency defeats memoization. **Fix:** Listed specific field dependencies.
12. **HuntingMinigame stale ammo** — `ammoLeft <= 1` check used closure value before `setAmmoLeft`. **Fix:** Compute `newAmmo` locally, check against that.
13. **HuntingMinigame nested state update** — `setFoodGained` called inside `setAnimals` callback. **Fix:** Accumulate food in local variable, set state after.
14. **Unused `useCallback` import in HuntingMinigame** — Removed.
15. **Missing `dispatch` dependency in MoralLabel useEffect** — Added.

### Key decisions
- `SET_DISTANCE` added as a dedicated reducer action for clarity over overloading SET_PHASE
- LandmarkScreen final-landmark useEffect kept as safety fallback with proper guards
- Empty `[]` deps in LandmarkScreen CWM/reconciliation/reciprocity useEffects are correct since component unmounts between landmarks

### Open items
- [x] Playtest all game phases end-to-end
- [ ] Verify CWM event firing logic across multiple playthroughs
- [ ] Test deceptive charity rate across 100+ events
- [x] Verify Sunday rest health recovery
- [ ] Test AI Historian with real API key
- [ ] Test NPC encounters with 3-exchange cap
- [ ] Verify CSV export completeness
- [ ] Test K-2 simplified trail flow
- [ ] Test 3-5 intermediate variant
- [ ] Performance test on Chromebook-equivalent specs
- [ ] Verify no API key leakage in client network traffic

---

## Session 3 — Verification & Deployment (2026-03-02)

### What was done

#### Full Project Verification
- Ran comprehensive automated verification across 10 checkpoints
- All checks passed: package.json, dependencies, build, imports, server routes, client state, game logic, components, API client, utilities
- Production build confirmed: 67 modules, 366KB JS (111KB gzipped), 35KB CSS (6KB gzipped)
- Server confirmed serving built client + API from single port in production mode

#### Deployment Setup
- Added Netlify deployment support as primary deploy target
  - `netlify.toml`: build config, Node 20, esbuild bundler, API redirects, SPA fallback
  - `netlify/functions/api.js`: wraps Express app via `serverless-http`
  - Refactored `server/index.js` with `require.main === module` guard so app.listen() only runs standalone
- Added multi-platform deploy configs as alternatives:
  - `Dockerfile` + `.dockerignore` for container-based platforms
  - `render.yaml` for Render one-click deploy
  - `Procfile` for Heroku/Railway
- Updated `package.json`: `postinstall` for client deps, `engines` field (Node 18+), improved build script

#### Netlify Deployment
- Site created at longwayhome.netlify.app
- Initial deploy failed: 404 because Netlify couldn't find project files
- Root cause: repo root is `RCC_longwayhome/` but project lives in `long-way-home/` subdirectory
- Fix: set **Base directory** to `long-way-home` in Netlify UI settings (required because Netlify reads `netlify.toml` only after it knows the base directory)
- Updated `netlify.toml` base from `.` to `long-way-home` for consistency

### Key decisions
- **Netlify as primary deploy platform** — free tier, no-login offline play works perfectly as static site, serverless functions available for classroom features
- **Express app exported without listen()** — `require.main === module` pattern allows the same `server/index.js` to work both as standalone server and as serverless function import
- **Offline mode confirmed fully static** — no server calls needed; all game logic client-side, state in localStorage

### Netlify deployment notes
- Base directory MUST be set in Netlify UI — `netlify.toml`'s `base` field is only read after Netlify finds the file, creating a chicken-and-egg problem when the toml is in a subdirectory
- Netlify Functions are stateless — in-memory session store resets between cold starts, so classroom sessions (multi-student) won't persist. For persistent classroom use, deploy to a long-running host or add a database
- "Play Offline" works regardless of backend state — fully client-side

### Open items
- [ ] Confirm Netlify deploy succeeds after Base directory fix
- [ ] Verify CWM event firing logic across multiple playthroughs
- [ ] Test deceptive charity rate across 100+ events
- [ ] Test AI Historian with real API key
- [ ] Test NPC encounters with 3-exchange cap
- [ ] Verify CSV export completeness
- [ ] Test K-2 simplified trail flow
- [ ] Test 3-5 intermediate variant
- [ ] Performance test on Chromebook-equivalent specs
- [ ] Verify no API key leakage in client network traffic
- [ ] Add database for persistent classroom sessions (v2)

---

## Session 4 — Playtest Feedback & Major UI Overhaul (2026-03-02)

### Context
Live playtest by Chris revealed 13+ issues across UI, game logic, difficulty, NPC accuracy, and content variety. All addressed in this session.

### What was done

#### Layout Overhaul (no scrolling)
- Rewrote TravelScreen from scrollable `min-h-screen` to viewport-fitting `h-screen flex flex-col overflow-hidden`
- New 3-column layout: left sidebar (terrain scene, party status, supplies, settings), center (map, progress bar, travel actions), right (optional historian panel)
- Grace score now visible in top bar with color-coded progress bar

#### SVG Trail Map
- Created `OregonTrailMap.jsx` — full SVG map with 1848 state/territory boundaries
- Shows landmark dots, trail path, rivers, mountain ranges, wagon icon at current position
- Zoom/pan controls, compass rose, landmark labels
- Wagon interpolates position between landmarks based on distance traveled

#### Terrain Visualization
- Created `TerrainScene.jsx` — 4 scene types (plains, hills, mountains, river)
- Each scene has unique geographic elements matching current trail segment
- Includes animated wagon with oxen on trail

#### Moral Labels Fix
- Changed from slide-in-from-right to centered pop-in animation
- Green (border + background) for positive valence, red for negative
- **Critical fix:** CWM choice ID detection — code checked `choice.id === 'help'` but CWM events use IDs like `share_food`, `pay_fair_price`, `forgive`, `bury_deceased`, etc. Changed to check `choice.effects?.grace_change > 0` which reliably distinguishes charitable choices.
- This was causing the user's reported bug: paying fair price for a wheel showed a NEGATIVE moral label

#### Event Template Placeholders
- Events.json used `{member_name}`, `{student_name}`, `{party_size}` but EventScreen rendered raw text
- Added `useMemo` that resolves templates on event mount using a random alive party member
- Fixed the "After drinking from a stagnant creek, {member_name} begins showing terrible symptoms..." bug

#### Event Effects Fix
- events.json used `morale_change` and `health_change` keys
- EventScreen only checked for `morale` and `health_delta` — never matched
- Fixed by checking both: `const moraleVal = eff.morale || eff.morale_change`
- Added full `health_change` processing with tier conversion (each -5 = 1 tier down)
- Added `oxen_loss` effect handling

#### Hunting Minigame
- Animal sizes increased: squirrel 20→35, rabbit 25→40, deer 40→55, bison 55→70
- **Critical fix:** Food wasn't accumulating (user shot animals but got 0 food). Root cause: React state batching — `setFoodGained` was called outside `setAnimals` callback, reading stale state. Fixed by using functional state updates inside the callback.
- Hit radius increased to `size * 0.9`
- Added hit/miss flash feedback with floating text

#### Historically Accurate NPC Scouts
- Researched which tribes occupied each fort's region in 1848
- Fort Kearney: Takoda (Pawnee Scout) — Great Plains
- Fort Bridger: Washakie (Shoshone Guide) — Rocky Mountains
- Fort Hall: Taghee (Bannock Guide) — Snake River region
- Fort Boise: Hímiin Maqsmáqs (Nez Perce Scout) — Blue Mountains/Columbia Plateau
- Each scout has preloaded dialogue with 4-5 suggested questions containing gameplay tips
- Fr. De Smet, Whitman, Bordeaux also got preloaded dialogue
- AI free-form questions still available as fallback

#### Difficulty Increase
- Base illness rate: 3% → 6% with terrain/seasonal modifiers
- Added weekly trail wear (health degradation from journey hardship)
- Added morale decay every 5 days without rest
- Death chance increased: filling 15%→20%, meager 25%→30%, bare_bones 40%→50%
- Event frequency: threshold 0.75 → 0.60 (40% more events)

#### Trail Flavor Text (300+ messages)
- Created `trail-flavor.js` with context-aware ambient messages across 14 categories:
  terrain (4 types × 20 each), weather, wildlife, campLife, humanity (40 messages),
  children, faith, hardship, wagonTrain, nightSky, food, water, seasonal, milestone
- Humanity messages include: singing "Oh! Susanna", fiddle playing, reading Pilgrim's Progress,
  harmonica "Amazing Grace", writing journals, reading James Fenimore Cooper, whittling,
  card games, dancing, poetry recitation, accordion polka, reading Robinson Crusoe
- Weighted random selection: hardship increases when food/morale low, seasonal matches game
  date month, night sky every 4th day, milestone reflections every 12th day
- Replaced old 20-message `getTerrainMessages()` in TravelScreen

### Files created
- `client/src/components/game/shared/OregonTrailMap.jsx` — SVG trail map
- `client/src/components/game/shared/TerrainScene.jsx` — terrain visualization
- `client/src/data/trail-flavor.js` — 300+ ambient messages

### Files modified
- `client/src/components/game/TravelScreen.jsx` — complete layout rewrite
- `client/src/components/game/EventScreen.jsx` — template resolution, effect key fix, CWM label fix
- `client/src/components/game/LandmarkScreen.jsx` — historically accurate NPCs, preloaded dialogue
- `client/src/components/game/shared/MoralLabel.jsx` — centered, green/red coloring
- `client/src/components/game/shared/HuntingMinigame.jsx` — hit detection fix, larger animals
- `client/src/index.css` — moral label pop-in animation
- `server/ai/prompts.js` — new scout character prompt keys

### Open items
- [ ] Verify moral-labels.json valence correctness for all event/choice combinations
- [ ] Test difficulty balance across full playthrough (may need further tuning)
- [ ] AI chat quality review (user reported "none of the chats seem to be working well")
- [ ] Verify CWM event firing logic across multiple playthroughs
- [ ] Test K-2 simplified trail flow
- [ ] Test 3-5 intermediate variant
- [ ] Performance test on Chromebook-equivalent specs
- [ ] Add database for persistent classroom sessions (v2)

---

## Session 5 — Weather, Camp Activities, Trail Dangers & Crash Logging (2026-03-02)

### Context
Chris requested comprehensive trip management features: daily weather affecting travel, camp activities for older grades, trail dangers, difficulty scoring, grace-influenced fortune, historically accurate 1848 content, and crash logging.

### What was built

#### Weather System (`client/src/game/weather.js`)
- Historically accurate 1848 weather generation using seeded PRNG for determinism
- 16 weather conditions: sunny, mostly_sunny, partly_cloudy, cloudy, overcast, light_rain, rain, heavy_rain, thunderstorm, light_snow, snow, heavy_snow, sleet, fog, dust_storm, hail
- Monthly temperature ranges calibrated to 1848 Great Plains/Rocky Mountain data
- Terrain modifiers: mountains (-12°F, more snow), desert (+8°F, dust storms), river valley (fog, rain)
- Wind system: calm, light, moderate, strong, gale — with travel modifiers
- Ground conditions accumulate moisture from recent weather (last 5 days) and dry with sun/wind
- Ground states: firm, dry, damp, wet, muddy, sloshy, icy, snowpack
- Travel modifier applied per weather condition (e.g., heavy snow = -70%, thunderstorm = -50%)
- `WeatherBox.jsx` UI: compact display with Unicode icons, temperature, wind, ground, travel impact

#### Camp Activities System (`client/src/game/campActivities.js`)
- 11 activities all written in 1848-appropriate language:
  - Talk with Family: rich dialogue system (40+ lines across morale states + conditionals)
  - Tend the Oxen: check yokes, hooves, find good grass (travel bonus)
  - Cook a Proper Meal: johnnycakes, bacon, dried apple pie (food cost + morale)
  - Take Stock of Provisions: count barrels, check spoilage (awareness bonus)
  - Wash Up at the Creek: hygiene with lye soap (health + morale)
  - Pray Together: family devotions, psalms (grace + morale)
  - Attend Mass: at missions only, with priest (grace + morale + health)
  - Go to Confession: sacrament of Reconciliation at missions (clears reconciliation pending)
  - Let the Children Play: mumblety-peg, hoop rolling, river skipping stones (morale)
  - Mend the Wagon: tallow axles, check felloes, tighten spokes (breakdown prevention)
  - Help Fellow Emigrants: assist nearby wagon train families (grace + morale)
- Each activity has: time cost, cooldown days, grade band filter, requirements
- Family dialogue includes conditional lines for: hungry, sick member (by name), bad weather, death, lingering
- Family suggestions provide actionable hints based on current game state
- `CampActivitiesPanel.jsx` UI: activity list → selection → confirmation → result flow

#### Trail Dangers (`client/src/data/trail-dangers.json`)
- 30+ dangers across 9 categories: environmental, mechanical, animal, wildlife, human, health, navigation, social, supply
- Each danger has: difficulty score (0-10), terrain filters, season filters, weather triggers, probability weight
- Choice-based dangers: robbery (comply/resist/negotiate), bad water (drink/boil/search), etc.
- `lingering_boost: true` on theft, robbery, hostile encounters — probability increases with stationary days
- 13 positive encounters including CWM opportunities:
  - Sick traveler, struggling family, found lost belongings, shared campfire, traveling musician
  - Grace-threshold encounters: helpful native guide (grace ≥ 50)
  - Choice-based: share food (grace +10) or keep it (-5); return found goods (+15) or keep (-10)

#### Trip Difficulty Report (`client/src/game/tripReport.js`)
- End-of-trip difficulty index (0-10) with labels: "Remarkably Easy" through "Nearly Impossible"
- Four weighted categories: weather (25%), dangers (35%), health (25%), supplies (15%)
- Grace influence summary based on final grace score
- Comprehensive stats: days traveled, bad weather days, dangers, deaths, robberies, breakdowns
- Period-appropriate narrative builder

#### Crash Logging (`client/src/utils/crashLogger.js` + `server/routes/crashReport.js`)
- Client tracks last 30 user actions with timestamps
- Crash reports capture: error + stack, sanitized game state, recent actions, event log, browser info, log buffer
- Reports stored in localStorage (up to 20) AND sent to server
- Global error handlers for window.onerror and unhandledrejection
- React Error Boundary helper (`logReactError`)
- Server: POST `/api/session/crash-report` writes JSON lines to `crash-reports.log`
- Server: GET `/api/session/crash-reports` returns last 50 for teacher debug panel

#### TravelScreen Integration
- `travelOneDay()` now: generates weather → applies to miles → checks trail dangers → checks positive encounters → adjusts illness
- Miles = baseMiles × paceMultiplier × weatherModifier × oxenBonus × graceModifier
- Trail danger selection filtered by terrain, season, weather, with lingering boost
- Positive encounter probability boosted by grace score
- Lingering warning after 2+ consecutive rest days
- Weather description used as daily flavor text
- Camp activities panel available during rest for non-K2 grades

#### GameContext Updates
- New state fields: currentWeather, weatherLog, recentWeather, activityCooldowns, activityLog, daysStationary, totalDaysStationary, oxenChecked, wagonMaintained, illnessPreventionBonus, spoilagePreventionBonus, dangerLog, tripDifficultyPoints
- 6 new reducer actions: SET_WEATHER, CAMP_ACTIVITY_PERFORMED, INCREMENT_STATIONARY, RESET_STATIONARY, RESET_DAILY_BONUSES, LOG_DANGER

#### Tests
- 12 weather tests: valid reports, determinism, terrain effects, seasonal temps, travel modifiers, ground conditions from rain, drying
- 12 camp activities tests: activity structure, grade band filtering, mission requirements, cooldowns, effects, dialogue, anachronism check
- Custom ESM loader (`loader.mjs`) handles extensionless imports and @shared Vite alias for Node test execution
- All 24 tests passing

### Files created
- `client/src/game/weather.js` — weather generation engine
- `client/src/game/campActivities.js` — camp activities with 1848-accurate dialogue
- `client/src/game/tripReport.js` — difficulty scoring and trip report
- `client/src/data/trail-dangers.json` — 30+ dangers + 13 positive encounters
- `client/src/utils/crashLogger.js` — client crash logging
- `client/src/components/game/shared/WeatherBox.jsx` — weather display UI
- `client/src/components/game/shared/CampActivitiesPanel.jsx` — camp activities UI
- `client/src/game/__tests__/weather.test.js` — weather tests
- `client/src/game/__tests__/campActivities.test.js` — camp activities tests
- `client/src/game/__tests__/loader.mjs` — custom ESM loader for tests
- `server/routes/crashReport.js` — crash report server endpoint

### Files modified
- `client/src/components/game/TravelScreen.jsx` — major integration of weather, dangers, camp activities, miles calculation
- `client/src/store/GameContext.jsx` — new state fields and 6 reducer actions
- `server/index.js` — added crash report route

### Key decisions
- **Seeded PRNG for weather** — same date always produces same weather, enabling reproducibility and consistency
- **Ground conditions as accumulated moisture** — solves the "geography memory" problem by tracking last 5 days
- **Lingering danger** — historically accurate: emigrants who fell behind faced increased risk from bandits and hostile encounters
- **Grace-influenced fortune** — higher grace subtly increases positive encounters and reduces dangers, testing greed vs. charity
- **1848-appropriate language throughout** — johnnycakes (not pancakes), buffalo chips (not firewood), mumblety-peg (not tag), tallow (not grease), felloe (not rim)
- **Test files run via Node with custom ESM loader** — avoids needing a test framework dependency while handling Vite's extensionless imports and @shared alias

### Open items
- [ ] Playtest weather impact on game balance (may need modifier tuning)
- [ ] Verify camp activities work at all missions on the trail
- [ ] Test positive encounter frequency feels balanced (not too rare/common)
- [ ] Test lingering danger escalation at various stationary day counts
- [ ] Integrate trip report into GameOverScreen
- [ ] Verify crash logger captures enough info for debugging real issues
- [ ] Test AI Historian with real API key
- [ ] Test K-2 simplified trail flow
- [ ] Test 3-5 intermediate variant
- [ ] Performance test on Chromebook-equivalent specs
- [ ] Add database for persistent classroom sessions (v2)

---

## Session 6 — Bible, Item Loss, Profession Difficulty Tiers & Balance Playtest (2026-03-02)

### Context
Chris requested: Bible as purchasable/giftable item, items (books, tools, Bible) that can be lost/destroyed/stolen on the journey, profession difficulty labels (Easy/Medium/Hard), and cash rebalancing verified by Monte Carlo simulation.

### What was built

#### Bible System
- **Holy Bible (Douay-Rheims), $25** — purchasable at the store or received as a gift at mission landmarks (40% chance if not owned)
- Effects:
  - `prayerGraceBonus: +2` — amplifies prayer grace (praying with Scripture)
  - `moraleFloor: 5` — morale can't drop below 5 if you have a Bible
  - `restMoraleBonus: +3` — extra morale on Sunday rest and regular rest
  - `deathMoraleMitigation: 0.3` — reduces morale loss from party deaths by 30%
  - `sundayRestGraceBonus: +3` — extra grace on Sunday rest (reading Scripture)
- Wired into: `handleSundayChoice`, `handleRest`, prayer button, `UPDATE_MORALE` reducer
- Can be received from missionaries at mission landmarks during travel

#### Item Loss Mechanics
- Items (Farmer's Almanac, Trail Guide, Tool Set, Bible) can be lost, destroyed, or stolen during dangerous events
- Triggers: river crossings, theft, fire, storms, mechanical breakdowns — any danger in these categories
- 12% chance per qualifying danger event (when items are owned)
- Loss verbs are context-appropriate: "was stolen" (theft), "was lost in the crossing" (river), "was destroyed" (fire/storm)
- `LOSE_ITEM` reducer action in GameContext for clean state management
- Lost items lose all their gameplay benefits immediately

#### Profession Difficulty Tiers (Balance-Tested)
- Ran 500-run Monte Carlo simulation across multiple cash configurations
- Final values validated by `balancePlaytest.mjs`:
  - **Tradesman $1,200 (Easy)** — 78.2% arrival, 96-100% repair success, 0 days lost to repairs
  - **Farmer $900 (Medium)** — 77.0% arrival, 88-91% repair success, ~1 day lost to repairs
  - **Banker $650 (Hard)** — 68.8% arrival, 72-74% repair success, ~2 days lost to repairs
- SetupScreen updated: professions displayed easiest-first with color-coded difficulty badges
- Default selection changed to Tradesman (easiest, first in list)
- Cash ordering is consistent with difficulty: more money = easier

#### Supply Store Updates
- Bible added as toggle item alongside books and tools
- Available for 6-8 and 3-5 grade bands

### Files created
- `client/src/game/__tests__/balancePlaytest.mjs` — 500-run Monte Carlo balance simulation

### Files modified
- `client/src/shared/types.js` — Added `STORE_BIBLE`, updated `PROFESSION_CASH` to difficulty-tiered values
- `shared/types.js` — Updated `PROFESSION_CASH` to match client
- `client/src/store/GameContext.jsx` — Added `hasBible` state, `LOSE_ITEM` reducer, Bible morale floor/death mitigation in `UPDATE_MORALE`
- `client/src/components/game/TravelScreen.jsx` — Bible wiring (Sunday rest, rest, prayer), item loss in danger events, Bible gift at missions
- `client/src/components/game/SupplyStore.jsx` — Bible toggle item
- `client/src/components/game/SetupScreen.jsx` — Difficulty labels, reordered professions (Easy/Medium/Hard), default to Tradesman

### Key decisions
- **Bible is cheap ($25)** — spiritual benefits are accessible to any profession, but the material cost is a real trade-off for the tradesman's tight budget
- **Item loss at 12%** — high enough to create tension but not so frequent that buying items feels pointless
- **Difficulty tiers, not equal balance** — professions intentionally represent Easy/Medium/Hard modes. The tradesman's repair mastery plus adequate funds makes the game comfortable; the banker's wealth can't buy trail skills.
- **Cash ordering consistent with difficulty** — most money = easiest, smallest budget = hardest. The "paradox" (tradesman gets more than banker) is explained by the difficulty label.
- **Monte Carlo validation** — profession balance claims backed by 500-run statistical simulation, not guesswork

### Open items
- [ ] Consider profession-specific scoring multipliers (banker gets bonus points for difficulty)
- [ ] Test Bible gift at mission landmarks during full playthrough
- [ ] Verify item loss messages display correctly in all danger categories
- [ ] Test that Bible morale floor interacts correctly with chaplain morale floor
- [ ] Test AI Historian with real API key
- [ ] Test K-2 simplified trail flow
- [ ] Test 3-5 intermediate variant
- [ ] Performance test on Chromebook-equivalent specs
- [ ] Add database for persistent classroom sessions (v2)

---

## Session 7 — Resource Management, Per-Member Morale, Terrain-Adaptive Difficulty & UI Redesign (2026-03-02)

### Context
Chris playtested the game and provided extensive feedback on layout, gameplay depth, and difficulty progression. Key complaints: map too large, dashboard requires scrolling, "Settings" should be "Travel Plan", unicode gibberish in weather, lack of resource management depth, morale too abstract (party-wide, not per-person), terrain difficulty doesn't vary enough. Also requested: water rationing, firewood for winter, per-member morale with Talk action, terrain-adaptive difficulty modeled after original Oregon Trail.

### What was done

#### Resource Management — Water, Firewood, Cold/Heat Effects
- **Water rationing system** (full/moderate/minimal) paralleling food rations
  - Full: 0.75 gal/person, Moderate: 0.50, Minimal: 0.25
  - Oxen consume 3× person rate
  - Heat multiplier: 1.25× at 80°F, 1.5× at 90°F, 1.8× at 100°F
  - Auto-refill at river terrain, forts, missions
  - "Find Water" action added (success varies by terrain: 95% river, 45% plains, 20% desert)
- **Firewood resource** for cold weather survival
  - 1 bundle/night below 50°F, 2 bundles below 32°F
  - "Gather Firewood" action (yield varies: 5 in mountains, 2 on plains)
  - No fire in cold: morale drops (-2 to -5), sleep recovery negated
- **Cold weather food increase**: 1.2× below 50°F, 1.4× below 32°F (bodies burn more calories)
- **Sleep schedule**: short (5hr), normal (7hr), long (9hr) — affects travel distance, health, morale

#### Per-Member Morale System
- Each party member now has individual `morale` field (initialized at INITIAL_MORALE = 70)
- `UPDATE_MORALE` applies delta to ALL alive members, computes average for backward compat
- `UPDATE_MEMBER_MORALE` targets specific member
- `TALK_TO_MEMBER` action: boosts morale (+12 if < 40, +8 if < 60, +5 otherwise), sets cooldown (once per day)
- Talk button visible in family panel when member needs help (morale < 50 or health poor/critical)
- Contextual dialogue: 15+ lines covering critical health, poor health, low morale, mid morale, okay, good spirits

#### Terrain-Adaptive Difficulty
- Event frequency, danger chance, illness rate, and positive encounter rate now scale with terrain type:
  - Plains: eventMod +0.06 (fewer events), dangerMod -0.03, encounterMod +0.04
  - Hills: baseline (all zero)
  - Mountains: eventMod -0.06 (more events), dangerMod +0.06, illnessMod +0.04, encounterMod -0.02
  - River: eventMod -0.03, dangerMod +0.04, illnessMod +0.03, encounterMod +0.01
- All modifiers stacked with weather difficulty (difficultyScore >= 5 adds +5%)
- Landmark `hazard_multiplier` applied to danger chance and trail wear
- Late-season escalation: +3% danger after Sep 15, +5% after Nov 1
- Early journey (< 500 miles) gets +3% positive encounter chance (more fellow travelers)
- Weekly trail wear scales with hazard_multiplier and terrain type

#### Travel Screen UI Redesign
- **Layout**: Hero terrain scene (35vh) at top → narrative bar → dashboard (left: actions/travel plan/supplies, right: weather/family/log)
- **Terrain scene rewrite**: 800×280 SVG with detailed wagon (oxen, wheels, yoke, canvas), weather-responsive sky, terrain-specific art (buffalo silhouettes, pine forests, water reflections, snow-capped peaks)
- **Mini-map overlay**: bottom of terrain scene showing next 2-3 landmarks, click for full map modal
- **Travel Plan**: renamed from "Settings", now includes pace, rations, water rationing, sleep schedule
- **Family panel**: per-member health badge + morale indicator + Talk button
- **Supply display**: now shows water, firewood with warning indicators
- **"Miles today" → "Miles yesterday"** (nitpick fix)
- **WeatherBox unicode fix**: `\u00B0` in JSX renders literally as text, replaced with `°`

### Files modified
- `client/src/components/game/TravelScreen.jsx` — Complete layout rewrite, resource management, terrain-adaptive difficulty, Talk to Family, Gather Firewood, Find Water
- `client/src/store/GameContext.jsx` — Per-member morale, water rationing, firewood, cold-without-fire penalty, sleep schedule, cold food consumption, TALK_TO_MEMBER, UPDATE_MEMBER_MORALE, SET_WATER_RATIONS, SET_SLEEP_SCHEDULE
- `client/src/shared/types.js` — SLEEP_SCHEDULE, WATER_RATIONS, WATER_OXEN_MULTIPLIER, getHeatWaterMultiplier, FIREWOOD_CONSUMPTION
- `client/src/components/game/shared/TerrainScene.jsx` — Complete rewrite to 800×280 immersive hero visual
- `client/src/components/game/shared/WeatherBox.jsx` — Unicode fix, compact prop
- `client/src/components/game/shared/OregonTrailMap.jsx` — Topographical features added
- `client/src/components/game/SetupScreen.jsx` — Per-member morale initialization

### Key decisions
- **Water rationing parallels food** — same UX pattern (dropdown) makes it intuitive. Heat multiplier adds realistic seasonal pressure.
- **Firewood as a "gather or suffer" resource** — creates strategic decisions: spend a day gathering or push through cold nights. Mountains yield more wood (forests) but consume more (colder).
- **Per-member morale rather than party-wide** — makes Talk to Family meaningful (target the one who needs it most), adds depth without complexity.
- **Terrain-adaptive difficulty via modifier table** — clean implementation that stacks with weather. Plains early = easy, mountains late = hard. Mirrors the original Oregon Trail experience.
- **Hero terrain scene as primary visual** — the landscape IS the game. Dashboard is secondary. This design philosophy matches the user's feedback that the trail visual should be most prominent.

### Balance analysis
- **Trip duration**: ~136 days at steady pace (2040mi / 15mi/day), ~151 with weather. April 1 start → ~Sep arrival. Plenty of time.
- **Food**: 5 people × 3 lbs × 151 days = 2,265 lbs. At $0.10/lb = $226.50. Tradesman ($1,200) has ample budget.
- **Water**: 8.25 gal/day (5 people + 2 oxen) × 24 days per full tank. Multiple river segments and fort refills.
- **Firewood**: 1-2 bundles/night in cold months. Gather action yields 2-5 bundles. Manageable with occasional gather days.
- **Difficulty curve**: Plains (early) → Hills → Mountains → River → Mountains (late). Natural escalation matches historical trail geography.

### Open items
- [ ] Firewood purchasable at supply store (currently gather-only)
- [ ] Supply purchase screen updates for water/firewood
- [ ] Thematic CSS improvements (parchment textures, period styling)
- [ ] Test K-2 simplified trail flow
- [ ] Test 3-5 intermediate variant
- [ ] Performance test on Chromebook-equivalent specs
- [ ] Add database for persistent classroom sessions (v2)

---

*Add new session entries below as the project evolves.*
