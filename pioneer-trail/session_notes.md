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

*Add new session entries below as the project evolves.*
