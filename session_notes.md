# Session Notes — The Long Way Home

*Build session log — updated March 2, 2026*

---

## Session Summary

### What Was Built
Full implementation of "The Long Way Home," a browser-based educational Oregon Trail game for Catholic classrooms. Three grade-band variants (K-2, 3-5, 6-8) sharing one engine, one teacher dashboard.

### Architecture
- **Client**: React (Vite) + Tailwind CSS + Framer Motion
- **Server**: Node.js + Express, in-memory state, polling-based sync
- **AI**: Anthropic API proxied through server (teacher provides key)
- **Directory**: `/long-way-home/` (renamed from `pioneer-trail`)

---

## Changes Made This Session

### Rebranding
- Renamed project directory from `pioneer-trail/` to `long-way-home/`
- Updated all code comments, export filenames, and localStorage keys
- Game title is "The Long Way Home" everywhere

### Grace System (Spec Alignment)
- **HIGH (75-100)**: Illness -15%, good events +10%, score 1.2x, guaranteed stranger help
- **MODERATE (40-74)**: Baseline, no modifiers
- **LOW (15-39)**: Good events -10%, illness recovery 1 day/tier slower
- **DEPLETED (0-14)**: Morale ceiling 0 (10 with chaplain), guaranteed hardship, events skew hostile

### New Features Added
1. **Prayer During Crisis**: Available when any party member reaches Critical health. Once-per-day cooldown. Grace +3, morale +3. No chaplain required (chaplain enhances the message).

2. **Bison Overhunting**: `bisonPopulation` tracks herd depletion. Killing 3+ bison in a hunt = grace penalty (-5). Low populations reduce bison spawn frequency in hunting minigame.

3. **NPC Encounters at Landmarks**: Location-specific historical NPCs:
   - Fr. De Smet at St. Mary's Mission
   - Marcus Whitman at Whitman Mission
   - James Bordeaux at Fort Laramie
   - Takoda (Pawnee Scout) at forts
   Inline chat component, max 3 exchanges per NPC.

4. **Deceptive CWM Guarantee**: At least 1 deceptive CWM event is guaranteed if the student reaches South Pass (landmark index 5+) and none have occurred yet.

5. **Last Rites**: Now properly triggers during death checks when chaplain is present. Reduces morale impact of death by 40% (0.6x multiplier). Fires once per game.

6. **Sunday Rest Health Recovery**: All party members recover 1 health tier on Sunday rest. Morale +5 bonus.

7. **Dashboard Charts**: SVG-based visualizations added:
   - Grace distribution bar chart
   - CWM choices (helped vs. declined) progress bar
   - Trail progress per student
   - Class health overview (avg survival, morale, grace, engagement metrics)

8. **Highlight Student for Discussion**: Teachers can highlight a student card with a purple ring for class discussion.

### Session Settings (New)
- `scripture_in_labels` (boolean, default true)
- `cwm_reveal_end_screen` (boolean, default true)
- `chaos_level` (low/standard/high)

### CSV Export Enhancement
38 columns now including: grace_range, score, grace_adjusted_score, profession, chaplain_in_party, cwm_deceptive_count, reconciliation_events, reciprocity_events, sunday_rests_skipped, feast_days, prayers_offered, moral_labels_dismissed, life_in_oregon.

---

## Known Issues / Future Work
- WebSocket real-time sync (polling at 10s currently)
- K-2 guardian angel component needs deeper implementation
- No persistent database (in-memory only)
- No LMS integration
- Mobile-responsive but optimized for Chromebook landscape (1366x768)

---

## File Structure (Current)

```
long-way-home/
├── client/
│   ├── src/
│   │   ├── game/          # Core game logic (engine, grace, cwm, events, etc.)
│   │   ├── components/
│   │   │   ├── game/      # Student-facing components
│   │   │   │   ├── shared/  # TrailMap, PartyStatus, Historian, Knowledge, Hunting
│   │   │   │   └── k2/     # K-2 variant components
│   │   │   ├── dashboard/ # Teacher dashboard components + charts
│   │   │   └── shared/    # MoralLabel
│   │   ├── data/          # JSON data files (landmarks, events, moral-labels, etc.)
│   │   ├── store/         # GameContext (state management)
│   │   ├── shared/        # types.js (constants, types)
│   │   └── utils/         # api.js, logger.js, dateUtils.js
│   └── index.html
├── server/
│   ├── routes/            # Express routes (session, historian, npc, insights, export)
│   ├── state/             # In-memory store
│   ├── ai/                # Prompts and API proxy
│   └── logger.js
└── shared/
    └── types.js
```

---

*End of session notes*
