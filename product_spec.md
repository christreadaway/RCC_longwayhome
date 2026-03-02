# The Long Way Home — Product Specification

*Implementation Status Document — March 2, 2026*

---

## 1. Product Overview

**The Long Way Home** is a browser-based educational game that rebuilds Oregon Trail mechanics for Catholic classroom use. Three grade-band variants share one engine and teacher dashboard. All content is original — no MECC/HMH code or assets.

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | React (Vite) + Tailwind CSS | Implemented |
| Styling | Tailwind with custom trail theme | Implemented |
| Animation | SVG-based scenes, CSS animations | Implemented |
| Backend | Node.js + Express | Implemented |
| Real-time sync | Polling (10s intervals) | Implemented |
| AI features | Anthropic API via server proxy | Implemented |
| Database | In-memory (MVP) | Implemented |
| Deployment | Not specified | Pending |

---

## 2. Grade Band Variants

### K-2: "Journey to the Valley"
- 5-stop trail, simplified decisions
- Guardian angel companion, golden rule prompts
- No supply system, hunting, or illness progression
- Fixed preset supplies (200 lbs food, 2 yoke oxen)

### 3-5: "The Long Trail"
- 15-stop trail, ~60% complexity
- Supply system, basic illness, no chaplain
- Beatitudes and Ten Commandments curriculum
- Simplified knowledge panel (5 cards)

### 6-8: Full Game
- 16-stop trail (Independence MO → Willamette Valley)
- Complete mechanics: hunting, illness tiers, river crossings
- Chaplain, Last Rites, AI Historian, NPC encounters
- CST and Works of Mercy curriculum
- AI Examination of Conscience at game end

---

## 3. Trail Landmarks (6-8 / 3-5)

16 stops, 2,040 total miles:

| # | Landmark | Type | Miles | Features |
|---|----------|------|-------|----------|
| 1 | Independence, MO | Town | 0 | Start, general store |
| 2 | Fort Kearney | Fort | 310 | Resupply, Pawnee Scout NPC |
| 3 | Chimney Rock | Natural | 450 | — |
| 4 | Fort Laramie | Fort | 535 | Resupply, Bordeaux NPC |
| 5 | Independence Rock | Natural | 710 | — |
| 6 | South Pass | Natural | 775 | Deceptive CWM guarantee |
| 7 | St. Mary's Mission | Mission | 870 | Resupply, Fr. De Smet NPC |
| 8 | Fort Bridger | Fort | 975 | Resupply, Pawnee Scout |
| 9 | Green River | Natural | 1030 | River crossing |
| 10 | Fort Hall | Fort | 1210 | Resupply, Pawnee Scout |
| 11 | Snake River | Natural | 1330 | River crossing |
| 12 | Fort Boise | Fort | 1460 | Resupply, Pawnee Scout |
| 13 | Whitman Mission | Mission | 1640 | Resupply, Whitman NPC |
| 14 | Blue Mountains | Natural | 1750 | — |
| 15 | The Dalles | Town | 1890 | Resupply |
| 16 | Willamette Valley | Destination | 2040 | Win condition |

---

## 4. Core Game Systems

### Grace Meter (0-100)
Starting value: 50. Moral/spiritual health tracker.

| Range | Effects |
|-------|---------|
| HIGH (75-100) | Illness -15%, good events +10%, score 1.2x, guaranteed stranger help |
| MODERATE (40-74) | Baseline |
| LOW (15-39) | Good events -10%, illness recovery 1 day/tier slower |
| DEPLETED (0-14) | Morale ceiling 0 (10 w/ chaplain), guaranteed hardship, hostile events |

Grace deltas: CWM Help +15 (+20 at hardship), CWM Decline -8, Sunday Rest +5, Prayer +3, Chaplain Join +5, Last Rites +8, Fair Trade +5, Exploit -10, Grueling while sick -3, Overhunt -5, Reconciliation Taken +5, Forgive +10.

### Corporal Works of Mercy (CWM)
- 7 event types (feed hungry, shelter homeless, clothe naked, visit sick, visit imprisoned, bury dead, give drink)
- Max 3 per game (6-8), 2 per game (3-5/K-2)
- 25% deceptive recipient probability
- Guaranteed deceptive event if past South Pass with none yet
- Deceptive flag teacher-dashboard-only — never student-facing
- Same moral labels for deceptive and genuine events

### Stranger Reciprocity
- Fires after player helps in CWM event
- 2-4 legs delay, 50% fire probability
- Each CWM type maps to a specific return event and reward

### Reconciliation ("Make It Right")
- Fires after CWM decline or exploit choice
- 40% probability per trail leg advance
- Specific text per original sin event type

### Prayer During Crisis
- Available when any party member reaches Critical health
- Once-per-day cooldown (prayerCooldownDay < trailDay)
- Grace +3, morale +3
- Chaplain enhances message but is not required

### Last Rites
- Triggers on death when chaplain is alive
- Grace +8, morale hit reduced by 40% (0.6x)
- Fires once per game

### Bison Population / Overhunting
- Starts at 100%, depleted by 10-15 per bison killed
- 3+ bison in one hunt = grace penalty (-5)
- Low population reduces bison spawn in hunting minigame

### Catholic Feast Days
- Aug 15 (Assumption), Nov 1 (All Saints), Nov 2 (All Souls)
- Flavor text, no mechanical effect

### Sunday Rest
- All party members recover 1 health tier
- Morale +5, Grace +5
- Costs one day of travel

---

## 5. AI Features

All AI calls proxied through server. Teacher provides API key (in-memory only).

| Feature | Prompt Key | Grade Bands | Max |
|---------|-----------|-------------|-----|
| Trail Historian | HISTORIAN_SYSTEM | 3-5, 6-8 | Unlimited |
| NPC Encounters | NPC_DESMET, NPC_WHITMAN, NPC_BORDEAUX, NPC_SCOUT | 6-8 | 3 exchanges |
| Exam of Conscience | EXAM_CONSCIENCE | 6-8 | End of game |
| Teacher Insights | TEACHER_INSIGHTS | All | On demand |

NPC characters with location assignments:
- Fr. De Smet (St. Mary's Mission) — Jesuit missionary, warm, French-influenced
- Marcus Whitman (Whitman Mission) — Physician, practical (never mention Whitman Massacre)
- James Bordeaux (Fort Laramie) — Fur trader, gruff but fair
- Takoda (Fort Kearney, Fort Hall, Fort Bridger, Fort Boise) — Pawnee scout, thoughtful

---

## 6. Teacher Dashboard

### Student Cards
Name, location, day, alive/total, cash, food, chaplain, profession, morale, score, prayers, grace bar, CWM dots (color-coded: green=helped genuine, yellow=helped deceptive, red=declined), last event, historian count, knowledge cards, Sunday rests, highlight for discussion.

### Charts
- Grace distribution bar chart (4 bands)
- CWM choices progress bar (helped vs. declined, deceptive count)
- Trail progress per student (horizontal bars)
- Class health overview (avg survival %, avg morale, avg grace, engagement totals)

### Controls
- Pause/Resume All
- Sort by name, location, health, grace
- Filter by all, struggling, at risk, completed
- Highlight student for class discussion (purple ring)
- Export CSV (38 fields)
- AI Class Insights (aggregate analysis)
- Settings panel (runtime-adjustable)

### Session Settings
| Setting | Default | Options |
|---------|---------|---------|
| moral_label_mode | full | full, post_choice, discussion_only |
| historian_enabled | false | boolean |
| historian_access_mode | prompted | prompted, free |
| ai_npc_enabled | false | boolean |
| ai_exam_conscience_enabled | true | boolean |
| scripture_in_labels | true | boolean |
| cwm_reveal_end_screen | true | boolean |
| chaos_level | standard | low, standard, high |

---

## 7. Scoring

Score = survivors bonus + supplies + days remaining bonus + grace multiplier

- +200 per survivor
- +food/10, +cash, +oxen x20, +spare parts x10
- +clothing x10, +ammo x5
- +500 for reaching Willamette Valley
- +5 per day remaining before Dec 31
- Grace HIGH: 1.2x final multiplier

---

## 8. Data Files

| File | Count | Description |
|------|-------|-------------|
| landmarks.json | 16 landmarks | Trail segments with prices, terrain, hazards |
| landmarks-k2.json | 5 landmarks | Simplified K-2 trail |
| events.json | 40+ events | Weather, hazards, CWM, river crossings |
| events-k2.json | 12 events | Simplified K-2 events |
| knowledge-panel.json | 12+ cards | Historical content (6-8) |
| knowledge-panel-3-5.json | 5 cards | Simplified (3-5) |
| moral-labels.json | 50+ labels | All labels by grade band, event, choice |
| illness.json | 8 illnesses | With symptoms, severity, treatments |
| catholic-curriculum.json | — | CWM names, Commandments, Beatitudes |

---

## 9. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/session/create | Create session |
| POST | /api/session/:code/join | Student joins |
| GET | /api/session/:code/students | All student states |
| PUT | /api/session/:code/state | Update student state |
| POST | /api/session/:code/pause | Pause all |
| POST | /api/session/:code/resume | Resume all |
| PUT | /api/session/:code/settings | Update settings |
| GET | /api/session/:code/info | Session info (public) |
| POST | /api/session/:code/verify | Verify teacher password |
| POST | /api/historian/query | AI historian query |
| POST | /api/npc/chat | NPC encounter chat |
| POST | /api/insights/generate | AI class insights |
| GET | /api/export/:code/csv | Download CSV export |

---

## 10. Security

- API key provided by teacher at session creation, held in memory only
- API key never in client code, network responses, server logs, or git history
- Password required for teacher dashboard access
- `sessionToPublic()` strips sensitive fields before any client response

---

## 11. Not Yet Built (Out of Scope for MVP)

- User accounts / persistent login
- Long-term database storage
- WebSocket real-time sync
- Mobile-native app
- LMS integration
- Full accessibility compliance
- Leaderboard persistence across sessions
- Production deployment configuration

---

*Last updated: March 2, 2026*
