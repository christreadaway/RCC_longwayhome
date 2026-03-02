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

*Add new session entries below as the project evolves.*
