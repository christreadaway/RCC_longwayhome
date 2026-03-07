# The Long Way Home — Business Specification
*Market positioning, monetization, and growth strategy*

---

## Product Summary

**The Long Way Home** is a browser-based educational game that rebuilds Oregon Trail mechanics for Catholic classroom use. It serves three grade bands (K-2, 3-5, 6-8), includes a real-time teacher monitoring dashboard, and integrates Catholic moral education through gameplay — not lectures.

The game runs in any modern browser. No app store, no installation, no student accounts. A teacher creates a session, students join with a code, and gameplay begins.

---

## Target Market

### Primary: Catholic Schools (K-8)
- ~6,000 Catholic elementary/middle schools in the United States
- ~1.6 million students enrolled
- Schools actively seek technology-integrated curriculum tools
- Religion/moral education is a daily requirement — teachers need engaging content
- Many schools are 1:1 Chromebook environments

### Secondary: Catholic Homeschool Families
- ~300,000+ Catholic homeschool students in the US
- Parents seek curriculum-aligned educational games
- Willing to pay for quality Catholic content
- Active online communities for content discovery (Catholic Homeschool Conference, Seton, Mother of Divine Grace)

### Tertiary: Catholic Religious Education (CCD/Faith Formation)
- Parish-based programs serving public school Catholic students
- Weekly 1-hour sessions need engaging, low-prep activities
- Volunteer catechists need turnkey tools

---

## Value Proposition

### For Teachers
- **Zero-prep Catholic curriculum integration** — game handles moral education content; teacher facilitates discussion
- **Real-time visibility** — see every student's choices, Grace meter, and moral decisions on one dashboard
- **Discussion anchors** — deceptive charity mechanic, reconciliation events, and AI-generated exam of conscience create natural conversation starters
- **Grade-appropriate automation** — one click selects the right complexity, vocabulary, and Catholic content depth
- **Export & accountability** — CSV export documents student engagement for administrators

### For Students
- **Actually fun** — Oregon Trail mechanics are proven engaging across decades
- **Moral discovery** — students learn through consequence, not lecture
- **Historical education** — 1848 trail content, NPC scouts from real tribal nations, period-accurate details
- **AI-powered curiosity** — Trail Historian answers student questions in context

### For Administrators
- **Curriculum alignment** — maps to Corporal Works of Mercy, Ten Commandments, Beatitudes, Catholic Social Teaching
- **No data privacy concerns** — no student accounts, no PII stored, no long-term data retention
- **No installation required** — browser-based, works on existing Chromebooks
- **Teacher accountability** — exportable session data for observation and evaluation

---

## Product Tiers

### Basic (Free)
- Full game for all three grade bands
- "Play Offline" mode (single player, no teacher dashboard)
- All game mechanics, events, moral labeling, knowledge panels
- LocalStorage save/resume
- No server features, no AI, no teacher dashboard

### Classroom (Requires API Key)
- Everything in Basic, plus:
- Teacher dashboard with real-time student monitoring
- Session management (create, pause, resume, export)
- AI Trail Historian (teacher provides their own Anthropic API key)
- AI NPC encounters
- AI-generated Examination of Conscience
- AI-generated Class Insights
- Multi-student session with polling sync
- CSV session export

### Premium (Future — see Enhancements Requirements)
- Everything in Classroom, plus:
- 150+ events (expanded from ~50)
- 3 branching trail routes (Main Trail, Southern Cutoff, Northern Mountain)
- Party personality system (Working Genius + Myers-Briggs dimensions)
- Event history tracking (prevents repeat events across playthroughs)
- Student accounts with cross-session persistence
- Hidden achievements system
- Managed API key (no teacher setup required)

---

## Monetization Strategy

### Phase 1: Free + BYOK (Current)
- Game is free to use
- AI features require teacher-provided Anthropic API key
- No revenue — focus on adoption and feedback
- Goal: 50 teachers using the game, collecting feedback

### Phase 2: Freemium with Managed API
- Basic tier remains free forever
- Classroom tier: flat monthly fee per teacher ($X/month) includes managed API key
- Eliminates API key friction — teacher signs up, gets a dashboard, students play
- Revenue from subscription covers API costs + margin

### Phase 3: School/Diocese Licensing
- Annual site license for schools or dioceses
- Includes Premium features, managed API, support
- Volume pricing for multi-school purchases
- Professional development webinar included

---

## Distribution Channels

### Direct
- **Website** — longwayhome.netlify.app (current)
- **Social media** — Catholic education Twitter/X, Catholic homeschool Facebook groups
- **Email** — teacher mailing list from early adopters

### Partnerships
- **Catholic curriculum publishers** — Loyola Press, Sophia Institute Press, Our Sunday Visitor
- **Diocesan technology offices** — present at diocesan tech days
- **NCEA** (National Catholic Educational Association) — conference booth, newsletter feature
- **Catholic homeschool conferences** — Great Homeschool Conventions (Catholic track), IHM Conference

### Organic
- **Teacher word-of-mouth** — the primary growth channel for classroom tools
- **Catholic education blogs** — guest posts, reviews
- **Social sharing** — teachers share student outcomes and discussion moments

---

## Competitive Landscape

| Product | Overlap | Differentiation |
|---------|---------|-----------------|
| Original Oregon Trail (HMH) | Same core mechanics | No Catholic content, no teacher dashboard, no AI, not browser-based |
| Catholic curriculum apps (various) | Catholic education | Not game-based, not engaging, no real-time monitoring |
| Kahoot / Blooket | Classroom gamification | Quiz-based, not narrative, no moral education depth |
| Classcraft | Classroom RPG | Not historically grounded, not Catholic, complex setup |
| Bible-themed games (various) | Catholic/Christian education | Usually low quality, not pedagogically rigorous |

**Key moat:** No other product combines proven game mechanics + Catholic moral education + real-time teacher dashboard + AI features. The closest competitors are either secular games or Catholic content that isn't engaging.

---

## Key Metrics

### Engagement
- Sessions per teacher per month
- Average session duration
- Student completion rate (% who reach Willamette Valley)
- Historian questions asked per session
- Knowledge panel cards read per student

### Catholic Education Effectiveness
- CWM events: % of students choosing to help
- Grace distribution at game end (are students learning?)
- Reconciliation events taken vs. declined
- Teacher-reported discussion quality (survey)

### Growth
- New teachers per month
- Retention (teachers who run 2+ sessions)
- Referral source tracking
- Geographic distribution (dioceses reached)

### Technical
- Crash rate per session
- AI API latency (p50, p95)
- Server uptime
- Build size / load time

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API key friction deters teachers | High | High | Phase 2 managed API eliminates this |
| Serverless state loss during classroom use | High | Medium | Document limitation; recommend Render/Railway for classroom use |
| HMH trademark claim on "Oregon Trail" mechanics | Low | High | No copyrightable elements used; game mechanics are not copyrightable; name is different |
| Catholic content controversy | Low | Medium | All content reviewed against Catechism; deceptive charity mechanic is teacher-facing only |
| AI generates inappropriate content | Low | High | Server-side proxy with system prompts; fallback responses; teacher can disable AI |
| Low adoption without marketing | High | Medium | Start with direct outreach to 5-10 teachers; iterate based on feedback before scaling |

---

## Roadmap

### Now (MVP Complete)
- [x] Full game for all three grade bands
- [x] Teacher dashboard with real-time monitoring
- [x] AI features (Historian, NPC, Insights, Exam of Conscience)
- [x] Netlify deployment
- [x] Play Offline mode

### Next (v2)
- [ ] Persistent database for classroom sessions (PostgreSQL or SQLite)
- [ ] WebSocket real-time sync (replace polling)
- [ ] Managed API key tier (eliminate teacher BYOK)
- [ ] Teacher onboarding flow with tutorial
- [ ] Mobile-responsive improvements

### Later (v3 — Premium)
- [ ] Expanded event pool (150+ events)
- [ ] Branching trail routes
- [ ] Party personality system
- [ ] Student accounts with cross-session persistence
- [ ] Hidden achievements
- [ ] School/diocese licensing portal

### Aspirational
- [ ] Second game: "Journey of Paul" (Mediterranean, 50 AD)
- [ ] Engine extraction for multi-game platform
- [ ] LMS integration (Google Classroom, Canvas)
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Localization (Spanish)

---

*This document should be updated as business strategy evolves, pricing is determined, and market feedback is collected.*
