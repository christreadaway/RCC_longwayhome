<!-- PART 3 OF 4: AI Features, Dashboard, Graphics (Sections 4D-4G) -->

| AI model | claude-haiku-4-5 / claude-sonnet-4-6 / custom endpoint | claude-haiku-4-5 |
| API key | Teacher-provided key entered in session setup | None (required to enable) |
| Historian access mode | Free (any rest point) / Prompted (post-event only) | Prompted |
| CWM labels in-game | Labeled / Unlabeled | Unlabeled |
| Examination of Conscience CWM reveal | Reveal framework / Keep unlabeled | Reveal |

#### Cost Estimate for Teachers
At Haiku pricing (~$0.25/M input tokens, ~$1.25/M output tokens), a 30-student session with moderate Historian use (5 queries per student, ~200 tokens each) costs approximately **$0.02–0.05 per session**. Negligible. Note this in teacher setup documentation.

---

### 4E. Historical Knowledge Panel

A set of 5–8 contextual "Did You Know?" cards available at every landmark and after every major event type. **Fully preloaded as static JSON — no API calls.** Content is researched, accurate, and age-appropriate. Cards appear as small pulsing icons in the sidebar; clicking opens a brief illustrated card without leaving the game screen.

**Design principles:**
- Never interrupts active gameplay — cards only available at rest points and post-event
- Dismissible in one tap
- Reading is optional; game never gates progress on engaging with cards
- Each card is 3–5 sentences max with one visual element

**Card triggers and sample content:**

| Trigger | Card Title | Content Summary |
|---------|-----------|-----------------|
| Cholera event fires | "What Was Cholera?" | Caused by contaminated water; killed thousands on the trail; not understood until the 1850s; how symptoms progressed |
| River crossing | "The Platte River" | Why the Platte was both essential and dangerous; "a mile wide and an inch deep"; quicksand; historical crossing statistics |
| Arrive at St. Mary's Mission | "The Jesuits on the Frontier" | Who the Jesuits were; Fr. Pierre-Jean De Smet; the mission system; relationships with Flathead and Potawatomi peoples |
| Arrive at Fort Laramie | "Fort Laramie's History" | Originally a fur trading post; purchased by US Army 1849; meeting point for thousands of emigrants |
| Bison hunting | "The Great Bison Herds" | 30–60 million bison before westward expansion; role in Plains Indian culture; collapse by 1890 |
| Party member dies | "Death on the Trail" | 1 in 10 emigrants died on the Oregon Trail; cholera most common cause; graves unmarked to prevent desecration |
| Wagon breakdown | "What It Took to Cross" | Weight limits; wagon construction; the spare parts emigrants carried; common failure points |
| Blizzard in mountain pass | "The Donner Party" | Brief, age-appropriate account; same mountain passes; same timing window; what went wrong |
| First Sunday rest prompt | "Sabbath on the Trail" | How different religious communities observed Sunday; historical accounts of Sunday rest debates among wagon trains |
| Whitman Mission stop | "Marcus and Narcissa Whitman" | Their story; role as Oregon pioneers and missionaries; the 1847 Whitman Massacre and its causes |
| CWM event fires (any) | "Hospitality on the Trail" | Historical accounts of wagon train generosity; the culture of mutual aid among emigrants; what travelers were expected to offer strangers |
| Arrive Willamette Valley | "The Oregon Country" | What settlers found; land claims; the founding of Oregon Territory; what happened to the Native peoples already there |

**Data structure (preloaded JSON):**
```json
{
  "cards": [
    {
      "id": "cholera_explainer",
      "trigger_events": ["illness_cholera"],
      "trigger_landmarks": [],
      "title": "What Was Cholera?",
      "body": "...",
      "image_key": "cholera_card",
      "grade_level": "6-8",
      "sources": ["Oregon-California Trails Association", "PBS Oregon Trail documentary"]
    }
  ]
}
```

**Teacher view:** Dashboard shows which Knowledge Panel cards each student clicked. Included in session export. Teacher can use this to gauge curiosity and depth of engagement.

---

### 4F. Additional AI-Powered Features

Beyond the Trail Historian, three additional AI features use the same Anthropic API key. All are **off by default**, individually toggleable in teacher settings.

#### 1. Personalized Examination of Conscience
At game end, instead of templated reflection text, Haiku generates a unique 3–4 sentence Examination of Conscience drawn from the student's actual event log. It references specific decisions, specific names, specific moments.

Example output for a student who declined a CWM event and pushed grueling pace while sick:
*"You faced hard choices on this trail. When you met the Garza family outside Fort Kearney, you kept moving — their hunger didn't stop your clock. And in the days after Sarah fell ill, you pushed Grueling when the trail demanded rest. She made it. But the question worth sitting with: what would you do if she hadn't?"*

**System prompt note:** AI is given event log, Grace score, CWM decisions, deaths, and party names. Instructed to be honest but not punishing — a mirror, not a judge.

#### 2. Dynamic NPC Encounters
At Catholic mission stops and select fort stops, students can initiate a brief AI conversation with a historically grounded character. **Maximum 3 exchanges, then the conversation closes naturally.**

| Location | Character | Historical Basis |
|----------|-----------|-----------------|
| St. Mary's Mission | Father Pierre-Jean De Smet, SJ | Real Jesuit missionary, known to many wagon trains |
| Whitman Mission | Marcus Whitman | Real figure; mission stop on the historical trail |
| Fort Laramie | Bordeaux, fur trader | Composite of documented Fort Laramie traders |
| Any fort | Pawnee scout | Composite; many wagon trains hired Native scouts |

System prompt constrains character to: speak in period-appropriate voice, answer questions about their life and the trail ahead, stay in character, end gracefully after 3 exchanges. Never discusses modern topics or game mechanics.

**Teacher can see all NPC transcripts** in the same Historian transcript viewer.

#### 3. Teacher Insight Generator
After a session closes (or any time during), the teacher can trigger an AI analysis of class-wide patterns. Haiku receives anonymized aggregate data: distribution of CWM choices, Grace score ranges, most common causes of death, most asked Historian questions, common NPC exchange topics.

Output: 3–5 discussion prompts specific to what *this class* experienced.

Example output:
*"17 of your 24 students helped the stranger at Fort Kearney — but 11 of those were later helped by a stranger in return, while 6 received nothing back. That's your entry point: why did 17 help if they couldn't know what would happen? And what do the 7 who passed think now? Your class also asked the Historian about cholera more than any other topic — consider pairing the historical explanation with a modern parallel (contaminated water systems, vaccine access) for a live ethics bridge."*

This feature is the most direct AI ethics curriculum hook — a real AI analyzing student behavior and generating pedagogical recommendations, in a classroom studying AI ethics. That recursion is worth naming explicitly to students.

---

### 4G. Teacher Feedback

A permanent feedback link available in the teacher dashboard footer. Clicking opens a Google Form in a new tab.

**Pre-populated fields (passed as URL query params):**
- Session date
- Session code
- Student count
- AI features enabled (Y/N per feature)
- Game version

**Form fields:**
1. Overall session rating (1–5 stars)
2. Did students engage with the game? (Yes / Somewhat / No)
3. Did the AI Historian add value? (Yes / No / Not enabled)
4. Were the CWM events effective discussion anchors? (Yes / No / Didn't use them)
5. What would you change? (open text)
6. What worked best? (open text)
7. Would you use this again? (Yes / No / Maybe)

Google Form owned by teacher/admin. Claude Code implements URL construction to pre-populate fields. Actual form creation is outside build scope — teacher provides the base URL as environment variable `VITE_FEEDBACK_FORM_URL`.

---

### 4B. Teacher Dashboard

#### Access
- Separate URL route: `/teacher` or `/dashboard`
- Password-protected (simple class password set at session start — no Google Auth required for MVP)
- Teacher sets a **session code** students use to join (e.g., "TRAIL42")

#### Dashboard Layout
- Grid of student cards — one per active student
- Each card shows:
  - Student name
  - Current landmark / location on trail
  - Date in-game
  - Party health summary (color-coded: green / yellow / red)
  - Cash remaining
  - Food remaining
  - Party members alive / total
  - Last major event (text)
  - **Chaplain in party** (Y/N indicator)
  - **Works of Mercy encountered** — icon badge: count fired, dot per event (green = helped, red = declined, yellow = helped/deceptive recipient)
  - **Grace meter** — small progress bar (0–100), color-coded: gold (75+), gray (40–74), amber (15–39), red (0–14)
  - **Historian queries** — count; chat icon opens full transcript
  - **Knowledge Panel cards clicked** — count of historical cards the student read
- Cards update in real time (polling every 10 seconds or WebSocket)

#### Dashboard Footer
- **"Generate Class Insights" button** — triggers AI Teacher Insight Generator (Section 4F)
- **"Give Feedback" link** — opens Google Form pre-populated with session data (Section 4G)

#### Filtering & Sorting
- Sort by: name, location, health, date, score
- Filter by: struggling (1+ critical members), at risk (low food or cash), completed

#### Teacher Controls
- **Pause all games** — freezes all student sessions simultaneously (good for discussion moments)
- **Reset session** — clears all student data for current session
- **Highlight a student** — projects their game state for class discussion (read-only view)
- **Session settings panel** — accessible before and during session:
  - Toggle AI Historian on/off
  - Set Historian access mode (free / post-event only)
  - Enter API key for all AI features
  - Toggle AI Personalized Examination of Conscience on/off
  - Toggle AI NPC Encounters on/off
  - Toggle CWM in-game labels (labeled / unlabeled)
  - Toggle CWM reveal on Examination of Conscience end screen
  - Set randomness/chaos level (Low / Standard / High — affects frequency of hardship events)

#### Historian Transcript Viewer
- Accessible from each student card ("Historian" tab)
- Shows full conversation: student question → Historian response → timestamp → game context at time of query
- Teacher can scan all transcripts quickly to identify rich discussion material
- Flag icon: teacher can mark specific exchanges to spotlight in class discussion

#### Session Export
- At session end, teacher can download CSV with:
  - Student name
  - Final location reached
  - Party survivors
  - Score (raw + Grace-adjusted)
  - Final Grace score (0–100)
  - Key decisions made (pace, rations, profession, chaplain included Y/N)
  - Cause of each death
  - CWM events: type, choice (helped/declined), recipient genuine or deceptive, reciprocity event fired Y/N
  - Sunday rest choices (how many Sundays rested vs. traveled)
  - Whether Last Rites was available and triggered
  - AI Historian: number of queries, topic summary (history / illness / ethics / Catholic / other)
  - Knowledge Panel: count of cards clicked, card IDs
  - NPC encounters: location, character, exchange count

---

### 4C. Upgraded Graphics

Replace all original ASCII/16-color graphics with:

| Element | Approach |
|---------|----------|
| **Background landscapes** | Layered parallax CSS/Canvas scenes — prairie, river, mountain, desert biomes; changes as player progresses |
| **Wagon** | Animated SVG wagon that rocks as it travels; shows damage state if parts broken |
| **Hunting scene** | Side-scrolling Canvas animation with animal sprites |
| **Weather effects** | CSS particle effects: rain, snow, dust |
| **Event illustrations** | Illustrated scene cards (SVG or generated pixel-art style) for each major event type |
| **Mission landmarks** | Distinct visual — adobe or stone chapel, bell tower, courtyard; warmer and quieter than fort scenes |
| **Last Rites scene** | Simple, dignified illustrated card — candlelight, friar, bedside. Not graphic, not maudlin. |
| **Corporal Works events** | Each CWM event has its own illustrated scene card — the starving family, the roadside stranger, the abandoned child |
| **UI chrome** | Clean, modern educational UI — warm tan/brown/blue palette; large readable type |
| **Map view** | Stylized trail map showing current progress with animated wagon marker; mission stops marked with small cross icon |

**Style reference:** Warm, illustrated storybook aesthetic — not cartoonish, not photorealistic. Think Ken Burns documentary art direction crossed with a well-designed educational app.

---

## 5. Business Rules and Logic

```
IF pace = Grueling AND rations = Bare Bones THEN illness probability += 30%
IF oxen_count < 2 THEN trail_speed = 0 (wagon cannot move)
IF food_lbs <= 0 THEN rations forced to Bare Bones; health degrades daily
IF party_member health = Critical AND rations != Filling THEN death_check each travel day
IF mountain_pass_date > Oct 15 THEN blizzard_probability = 80%
IF ammunition = 0 THEN hunting disabled
IF cash = 0 THEN fort purchases disabled
IF river_depth > 3ft AND caulk_float THEN loss_probability = 40%
IF river_depth > 5ft AND ford THEN certain wagon loss, 60% drowning per member
IF all_party_members dead THEN game_over, show final stats
IF student session inactive > 30 min THEN auto-pause (preserves state)

// Catholic mechanics
IF chaplain_in_party = true THEN morale_floor += 10 (baseline morale never drops below 10%)
IF chaplain_in_party = true AND party_member = Critical THEN prayer_option = always_visible
IF chaplain_in_party = true AND party_member = dying THEN last_rites_scene fires before death
IF last_rites_fired = true THEN morale_death_penalty *= 0.6
IF sunday_rest = true THEN all_party_members recover 1 health tier; morale += 5
IF CWM_event fires AND all_party_members healthy AND food > 50lbs THEN event is valid (don't fire into survival crisis)
IF CWM_events_fired >= 2 THEN no further CWM events for this playthrough
IF player_chooses_help on CWM event THEN resource cost applied; morale += 8; grace += 15
IF player_chooses_pass on CWM event THEN no resource cost; morale -= 3; grace -= 8
IF game_date = Aug 15 OR Nov 1 OR Nov 2 THEN feast_day_flavor_text fires (no mechanical effect)

// Grace meter effects
IF grace >= 75 THEN illness_escalation_probability -= 15%; good_event_probability += 10%; score_multiplier = 1.2
IF grace <= 14 THEN morale_floor = 0; one guaranteed hardship event fires in final trail third
IF grace >= 75 AND game_complete THEN arrival_narrative = 'high_grace' variant; show Life in Oregon (high)
IF grace <= 14 AND game_complete THEN arrival_narrative = 'depleted_grace' variant; show Life in Oregon (depleted)
IF grace 15-39 THEN illness_recovery_time += 1 day per tier; good_event_probability -= 10%

// Grade band routing
IF grade_band = 'k2' THEN disable: supply_system, illness_progression, hunting_minigame, chaplain, last_rites, ai_historian, npc_encounters, knowledge_panel
