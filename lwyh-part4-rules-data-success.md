<!-- PART 4 OF 4: Business Rules, Data, Success Criteria, Logging (Sections 5-10) -->

IF grade_band = 'k2' THEN enable: guardian_angel_companion, golden_rule_prompts, simple_prayer_cards, 5_stop_trail
IF grade_band = '3_5' THEN disable: last_rites, npc_encounters (default off), full_knowledge_panel
IF grade_band = '3_5' THEN enable: reconciliation_events, commandment_labels, beatitude_labels, 2_tier_illness
IF grade_band = '6_8' THEN all features active per teacher settings

// Moral labeling
IF moral_label_mode = 'full' THEN label fires immediately after choice
IF moral_label_mode = 'post_choice' THEN label fires after event resolution
IF moral_label_mode = 'discussion_only' THEN no labels fire; events logged for teacher
IF grade_band = 'k2' THEN moral_label_mode = 'full' (locked)
IF grade_band = '3_5' THEN moral_label_mode = 'full' (default; teacher can change)
IF grade_band = '6_8' THEN moral_label_mode = 'full' (default; teacher can set to post_choice or discussion_only)
IF deceptive_charity_event AND player_helps THEN label = Work of Mercy label (same as genuine); deceptive flag NOT referenced

// Reconciliation events
IF sinful_choice_made AND grade_band IN ('3_5', '6_8') THEN reconciliation_pending = true; probability = 0.4
IF reconciliation_pending AND trail_legs_since_sin BETWEEN 1 AND 2 THEN roll probability
IF player_takes_reconciliation THEN grace += 5; morale += 3; apply affirming label; clear pending
IF player_declines_reconciliation THEN apply second-refusal label; clear pending
IF reconciliation already fired for this sin THEN no second attempt

// Deceptive charity / stranger reciprocity
IF cwm_event_fires THEN randomly assign recipient_is_deceptive (25% probability)
IF player_helps AND recipient_is_deceptive THEN grace += 15 (same as genuine — intent tracked, not outcome)
IF player_helps THEN set reciprocity_pending = true; reciprocity_fire_probability = 0.5
IF reciprocity_pending = true AND trail_legs_since_cwm >= 2 THEN roll reciprocity_fire_probability
IF reciprocity_fires THEN select appropriate Stranger Returns event from table; clear reciprocity_pending
// NEVER reveal to student whether recipient was genuine or deceptive during gameplay
// Teacher dashboard flags deceptive events; student never sees this

// AI Historian
IF historian_enabled = false THEN historian_ui_hidden completely
IF historian_enabled = true AND access_mode = 'prompted' THEN historian_accessible only at rest points + 30s post-event window
IF historian_enabled = true AND access_mode = 'free' THEN historian_accessible at all rest points
IF historian_query fires THEN log { student_id, timestamp, game_context_snapshot, question, response }
IF api_key_invalid OR api_unreachable THEN historian_shows graceful error; game continues unaffected

// AI Personalized Examination of Conscience
IF exam_conscience_ai_enabled = true AND game_complete THEN send event_log to Haiku; render returned text
IF exam_conscience_ai_enabled = false THEN render templated reflection text from event_log

// AI NPC Encounters
IF npc_encounters_enabled = true AND student_at_mission_or_fort THEN show "Speak with [character]" option
IF npc_conversation_exchanges >= 3 THEN character ends conversation gracefully
IF npc_api_fails THEN hide NPC option silently; game continues

// Teacher Insight Generator
IF teacher_clicks_generate_insights THEN send anonymized aggregate session data to Haiku; render returned prompts
IF insight_api_fails THEN show error message; session data not lost

// Knowledge Panel
IF landmark_reached OR major_event_fires THEN load matching card_ids from knowledge_panel.json
IF student_clicks_card THEN log { student_id, card_id, timestamp }; mark card as read

// Feedback
IF teacher_clicks_feedback THEN construct Google Form URL with session metadata; open in new tab
IF VITE_FEEDBACK_FORM_URL not set THEN hide feedback link
```

Illness progression:
- Illness strikes randomly based on terrain, water source, and rations
- Severity determined on event trigger
- Rest reduces severity; continuing travel at Grueling pace worsens it
- Untreated illness: Good → Fair → Poor → Critical over 3–7 trail days; Critical → Dead in 1–3 days

---

## 6. Data Requirements

### Student Game State (stored per session)
```
session_code: string
student_id: string (generated)
student_name: string
grade_band: 'k2' | '3_5' | '6_8'
party_members: [{ name, health_status, alive }]
chaplain_in_party: boolean
profession: enum
current_landmark: string
trail_day: int
game_date: date
cash: float
food_lbs: float
clothing_sets: int
ammo_boxes: int
spare_parts: { wheels, axles, tongues }
oxen_yokes: int
pace: enum
rations: enum
morale: int (0–100)
grace: int (0–100)  // invisible to student
sunday_rests_taken: int
sunday_rests_skipped: int
cwm_events: [{ event_type, date, choice: helped|declined, recipient_genuine: boolean, reciprocity_fired: boolean }]
reconciliation_events: [{ sin_event_ref, fired: boolean, taken: boolean, declined: boolean }]
reconciliation_pending: boolean
reciprocity_pending: boolean
last_rites_fired: boolean
feast_days_encountered: [string]
moral_labels_dismissed: [string]  // card IDs the student dismissed without reading
knowledge_cards_read: [string]
historian_transcript: [{ timestamp, game_context, question, response }]
npc_transcripts: [{ location, character, timestamp, exchanges: [{question, response}] }]
event_log: [{ date, event_type, outcome, description, moral_label_id: string|null }]
score: int
grace_adjusted_score: int
life_in_oregon_narrative: string  // set at game completion
status: active | paused | completed | failed
```

### Session Configuration (teacher-level)
```
session_code: string
teacher_password: string (hashed)
created_at: timestamp
status: active | closed
grade_band: 'k2' | '3_5' | '6_8'
students: [student_ids]
settings: {
  historian_enabled: boolean
  historian_model: string
  historian_api_key: string (server-side only)
  historian_access_mode: 'free' | 'prompted'
  ai_exam_conscience_enabled: boolean
  ai_npc_enabled: boolean
  moral_label_mode: 'full' | 'post_choice' | 'discussion_only'
  scripture_in_labels: boolean
  cwm_reveal_end_screen: boolean
  chaos_level: 'low' | 'standard' | 'high'
}
```

### Persistence
- MVP: **localStorage + in-memory server state** (no database required)
- Student state stored client-side; synced to server on each action
- If student refreshes browser, game resumes from last saved state
- Session data lives only for duration of class period (no long-term storage required)

---

## 7. Integrations and Dependencies

| Dependency | Purpose | Notes |
|------------|---------|-------|
| **React** | Frontend framework | Vite + React recommended |
| **Canvas API or Pixi.js** | Hunting mini-game, animated scenes | Pixi.js preferred for performance |
| **CSS Animations / Framer Motion** | Weather effects, transitions | |
| **WebSocket or polling** | Real-time teacher dashboard sync | Simple polling (10s) acceptable for MVP |
| **Node.js + Express** | Backend: session state, API proxy, insight generator | |
| **Anthropic API** | Historian, NPC encounters, Exam of Conscience, Teacher Insights | claude-haiku-4-5 default; server-side proxy only |
| **Knowledge Panel JSON** | Static preloaded historical content | Bundled with app; no runtime API needed |
| **Google Forms** | Teacher feedback | URL-only integration; form created separately |
| **No database for MVP** | In-memory state only | Add Firebase/Firestore in v2 if needed |

> **⚠️ API Key Security:** The teacher's Anthropic API key must NEVER be exposed to the client/browser. All API calls proxy through Node.js. Key absent from all client-side code, logs, and network responses.

**Environment variables required:**
```
VITE_FEEDBACK_FORM_URL=<Google Form base URL>
ANTHROPIC_API_KEY_STORAGE=session  # key stored in server memory per session, never persisted
LOG_LEVEL=info
PORT=3000
```

---

## 8. Out of Scope (Not Building Yet)

- User accounts / login system (MVP uses session codes only)
- Long-term data persistence across class periods
- Multiplayer interactions between student games
- AI-generated event content (all events are pre-scripted)
- Mobile-native app (web-only, but should be tablet-friendly)
- Accessibility compliance beyond basic keyboard navigation
- LMS integration (Google Classroom, Canvas)
- Leaderboard persistence across sessions

---

## 9. Open Questions — Items Requiring Chris's Input

| # | Question | Why It Matters | Default If No Answer |
|---|----------|----------------|----------------------|
| 1 | **Game name** — "The Long Way Home" or something else? | Branding, avoids HMH IP issue | Use "The Long Way Home" |
| 2 | **Art style** — Illustrated storybook vs. modern pixel art vs. 3D flat? | Drives entire visual build | Illustrated storybook / warm palette |
| 3 | **Session persistence** — Should teacher be able to save and resume sessions next class period? | Determines if we need a real database | No — single-session only for MVP |
| 4 | **Teacher auth** — Simple password or Google Auth? | Complexity + security tradeoff | Simple password |
| 5 | **Screen target** — What devices are students using? Chromebooks, iPads, desktops? | Affects responsive design priorities | Chromebook (landscape, 1366×768) |
| 6 | **Class size** — How many students max per session? | Affects dashboard grid layout | 30 students |
| 7 | **Chaplain naming** — "Jesuit" or "Franciscan" or generic "trail friar"? | Historical accuracy, denominational sensitivity | Generic "trail friar" — teacher can contextualize |
| 8 | **Grace meter visibility** — Should students ever see any hint of the Grace system, or purely invisible throughout? | Affects whether virtue feels discovered or meta-gamed | Fully invisible — students feel it, never see it |
| 9 | **Historian persona depth** — Should the Historian have a name and illustrated portrait, or stay as a journal interface? | Immersion vs. build complexity | Named journal ("The Trail Record") with no character portrait for MVP |
| 10 | **Who provides the API key** — School-level key managed by IT, or teacher enters their own per session? | Operational workflow | Teacher enters own key at session setup |

> ✅ **Resolved from prior version:** CWM labeling and Examination of Conscience reveal are now teacher-configurable settings (see Section 4D Teacher Configuration Settings).

> **⚠️ No D64 disk image needed.** This is a full rebuild from scratch in React/Node.js using only the gameplay mechanics (which are not copyrightable). No original MECC code, assets, or media will be used.

---

## 10. Success Criteria

| Criterion | Measure |
|-----------|---------|
| Student can complete a full game end-to-end | Start → Independence → Willamette Valley (win or death) without errors |
| Teacher dashboard shows all students in real time | Latency under 15 seconds; all active students visible |
| Teacher pause/resume works across all sessions | All student games freeze within 5 seconds of teacher command |
| Game is playable on classroom Chromebooks | No crashes; 60fps or better on 4+ year old hardware |
| Event system fires correctly | All 20+ event types trigger, resolve, and update state correctly |
| Hunting mini-game works | Ammo consumed, food gained, displayed correctly |
| River crossing decisions reflect correct probability | Test 100 fords at >5ft depth — 60% should result in loss |
| Session export produces accurate CSV | All fields populated including CWM, Grace, deceptive flags, Knowledge Panel, NPC data |
| No original MECC IP used | Zero borrowed code, assets, or copyrighted content |
| Teacher can onboard class in under 5 minutes | Session code generated, shared, and students joined |
| CWM events fire correctly | 1–3 events per playthrough; at least 1 guaranteed past Fort Laramie; never fires in crisis |
| Deceptive charity fires at ~25% of CWM events | Test 100 sessions — deceptive rate within 20–30% |
| Grace tracks intent not outcome | Deceptive recipient still yields Grace +15 when player helps |
| Stranger reciprocity fires ~50% when eligible | 2+ trail legs since CWM; correct Stranger Returns event selected |
| Recipient deception never revealed to student | No UI, text, or log entry in student view exposes deceptive flag |
| Sunday rest mechanic functions | Rest recovers health tier; skip provides no bonus; morale tracked correctly |
| Last Rites scene triggers correctly | Only fires with chaplain in party + member dying; morale reduction applies |
| Grace meter invisible to students | No UI element in student view exposes Grace value |
| Arrival scene varies by Grace | High and low Grace yield distinct narrative text on end screen |
| Knowledge Panel cards load contextually | Correct card IDs load per landmark and event type; wrong-context cards never shown |
| Knowledge Panel does not interrupt gameplay | Cards only accessible at rest points; no auto-pop during active events |
| AI Historian responds in context | References current landmark, date, and recent event |
| AI NPC encounters cap at 3 exchanges | Character closes naturally after 3; no 4th exchange possible |
| Personalized Exam of Conscience references specific events | Student's actual party names and decisions appear in AI-generated text |
| Teacher Insight Generator produces relevant prompts | Output references actual class data, not generic suggestions |
| API key never in client | Verified by network inspection — key absent from all browser-visible requests/responses |
| All AI features fail gracefully | API down → game continues; student sees friendly error; no data lost |
| Feedback link constructs correct URL | Google Form pre-populated with session metadata |
| Teacher settings propagate within 10 seconds | Toggling any setting reflects in active student sessions promptly |

---

## Logging Infrastructure (Required)

Claude Code must implement logging at these layers:

**Client-side (browser console + log buffer)**
```javascript
// All game state transitions logged
logger.info('EVENT_FIRED', { type, date, outcome, partyState })
logger.warn('HEALTH_CRITICAL', { member, cause, trailDay })
logger.error('STATE_SYNC_FAILED', { studentId, error, retryCount })
logger.info('GRACE_CHANGED', { studentId, delta, newValue, trigger })
logger.info('HISTORIAN_QUERY', { studentId, question, gameContext })
logger.error('HISTORIAN_API_FAILED', { studentId, error, fallbackShown })
```

**Server-side (Node.js)**
```javascript
// Session-level logging
logger.info('STUDENT_JOINED', { sessionCode, studentId, timestamp })
logger.info('GAME_STATE_UPDATE', { studentId, landmark, partyHealth, grace })
logger.info('HISTORIAN_PROXIED', { studentId, tokenCount, model, latencyMs })
logger.error('SYNC_ERROR', { studentId, error, stack })
logger.error('API_KEY_ERROR', { sessionCode, error }) // Never log the key itself
```

- Log buffer stored in memory (last 100 events per student)
- Teacher dashboard includes hidden "Debug" panel showing last 10 errors per student
- Errors include copy-pasteable stack traces for Claude Code debugging sessions
- Log verbosity controlled by `VITE_LOG_LEVEL` environment variable (debug | info | warn | error)

---

*Document prepared for Claude Code build session. All gameplay mechanics are original implementations of uncopyrightable game concepts. Catholic elements are historically grounded in the 1840s Oregon Trail era — Jesuit missions, trail chaplains, and Catholic feast days are documented history, not invented additions. No MECC, HMH, or Learning Company code or assets used.*
