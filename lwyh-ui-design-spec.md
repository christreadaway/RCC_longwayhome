# The Long Way Home — UI Design Specification
*Version 2.0 · Game Screen · Optimized for tablet, iPad, desktop · No scrolling*

---

## Design Philosophy

The game screen never scrolls. Every element is a flex child that proportionally shares available height — nothing demands more space than it's given. On small screens, content compresses gracefully; on large screens, it breathes. The aesthetic is warm parchment and frontier ink — Playfair Display for headings, Crimson Pro for body text. The player should feel transported, not like they're using a web app.

---

## Typefaces

Load via Google Fonts CDN:

```
https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap
```

| Role | Family | Weight | Size |
|------|--------|--------|------|
| Game title | Playfair Display | 700 | `clamp(13px, 1.8vw, 18px)` |
| Event title | Playfair Display | 700 | `clamp(15px, 1.8vw, 19px)` |
| Body / UI | Crimson Pro | 400 | `clamp(12px, 1.3vw, 14px)` |
| Choice labels | Crimson Pro | 700 | `clamp(13px, 1.4vw, 16px)` |
| Eyebrows / labels | Crimson Pro | 600 | 9.5–11px, uppercase, letter-spacing 1px |

`clamp()` ensures type scales proportionally between breakpoints rather than snapping.

---

## Color Tokens

```css
--parchment:  #f5ead8   /* page background */
--parch-dark: #ecdabc   /* resource bar background */
--amber:      #c2873a   /* primary accent */
--amber-dk:   #9a6828   /* amber hover / selected state */
--green:      #4a7c59   /* blessing events, healthy status, rest choice */
--red:        #b94040   /* crisis events, critical status, action choice */
--blue:       #4a6890   /* encounter events, moral choice */
--gold:       #c2a84f   /* grace meter, trail fill, header accents */
--ink:        #2c1f14   /* primary text */
--ink-lt:     #5a4030   /* secondary text */
--hdr:        #2c1f14   /* header background (same as ink — intentional) */
--border:     rgba(120,80,40,0.18)
```

---

## Layout — Three Breakpoints

The root element receives a class (`bp-desktop`, `bp-tablet`, `bp-mobile`) set by a `useWindowWidth` hook. This is preferred over CSS-only media queries because it also controls JSX logic (which chips to show, face sizes, etc.).

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Desktop | ≥ 1024px | Side-by-side: scene 44% left, panel 56% right |
| Tablet | 640–1023px | Stacked: scene 38% top, panel 62% bottom |
| Mobile | < 640px | Stacked: scene 30% top, panel 70% bottom |
| Landscape phone | any width, height < 480px | Override to side-by-side regardless of bp class |

**Critical CSS rules for no-scroll:**
```css
html, body, #root { width: 100%; height: 100%; overflow: hidden; }

.game-root { width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; }

/* Every flex container must have this pair to allow shrinking */
flex: 1;
min-height: 0;   /* ← without this, flex children refuse to shrink */
overflow: hidden;
```

---

## Fixed Chrome Heights

```css
--hdr-h:  48px   /* header bar */
--res-h:  38px   /* resource bar */
```

Everything else flexes to fill the remaining space.

---

## Header Bar

**Height:** 48px  
**Background:** `#2c1f14`  
**Bottom border:** 2px solid `--amber-dk`

Three regions in a horizontal flex row (`justify-content: space-between`):

### Left — Title Group
- **Game title:** Playfair Display 700, `--gold`, `clamp(13px, 1.8vw, 18px)`, `white-space: nowrap`
- **Era subtitle:** 10px, uppercase, `rgba(245,234,216,0.48)`, hidden on mobile

### Center — Chips + Weather
Pill-shaped chips (`border-radius: 20px`, `background: rgba(255,255,255,0.08)`, `border: 1px solid rgba(255,255,255,0.12)`):
- `📅 Aug 14, 1848` — always visible
- `Day 112` — hidden on mobile
- `Steady Pace` — desktop only
- **Weather Widget** (interactive pill, cycles sunny → rainy → stormy on click):
  - Shows emoji icon + label + temperature in two stacked lines
  - `sunny`: ☀️ Sunny 74°F
  - `rainy`: 🌧️ Rainy 58°F
  - `stormy`: ⛈️ Stormy 52°F

### Right — Grace Meter
Horizontal row: `✝` cross icon · "Grace" label · pip track · numeric value

**Pip track:** 10 small rectangles (`12px × 6px`, `border-radius: 2px`), filled color based on value:
- > 70: `--gold` (`#c2a84f`)
- 41–70: muted green (`#9aaa6a`)
- ≤ 40: `--red`

On mobile: reduce to 5 pips, hide "Grace" text label.

---

## Resource Bar

**Height:** 38px  
**Background:** `--parch-dark`  
**Bottom border:** 1px solid `--border`

Six resource items in equal-width flex columns (`flex: 1` each, `border-right: 1px solid --border`, last child no border):

| Icon | Label | Warn |
|------|-------|------|
| 🌾 | Food | — |
| 💰 | Cash | — |
| 🔫 | Ammo | ⚠️ red value |
| 🔧 | Spares | — |
| 💊 | Medicine | ⚠️ red value |
| 🐂 | Oxen | — |

Each item: emoji icon (14px) + two-line text block (value in `--ink` 700, label in 9px uppercase `--ink-lt` 60% opacity). Warning items: value color switches to `--red`. Text uses `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` — never wraps.

---

## Scene Column (Left / Top)

### Trail Scene Canvas

Fills all available height above the trail progress bar. Pure CSS/SVG scene — no image assets required.

**Sky gradient** (changes with weather):
```css
sunny:  linear-gradient(180deg, #4a90d9 0%, #a8d0f0 55%, #d4e8c2 100%)
rainy:  linear-gradient(180deg, #5a6a7a 0%, #8a9aaa 50%, #aab8aa 100%)
stormy: linear-gradient(180deg, #2a3040 0%, #4a5060 50%, #6a7068 100%)
```

**Scene layers (bottom to top):**
1. **Far hill** — `width: 140%`, `left: -20%`, `height: 36%`, `bottom: 27%`, `background: #5a7c4a`, `opacity: 0.75`, `border-radius: 50% 50% 0 0`
2. **Mid hill** — `width: 120%`, `left: -10%`, `height: 28%`, `bottom: 21%`, `background: #6a8c5a`
3. **Road** — `height: 28%` from bottom, `linear-gradient(180deg, #c8a870, #b89050)`. Dashed center line via `::after` pseudo-element (`left: 48%; right: 48%; border-left/right: 1px dashed rgba(255,220,120,0.28)`)
4. **Trees** — CSS div trees (trunk + crown). Placed at `left: 7% bottom: 28%`, `left: 76% bottom: 27%`, `left: 85% bottom: 33%`. Crown: `background: #3a6830`, `border-radius: 50% 50% 40% 40%`, inner shadow.
5. **Clouds** — Two CSS clouds with `::before`/`::after` pseudo-elements for puffiness. Second cloud scaled to 68%. On travel: animate `translateX` drift.
6. **Wagon group** — Positioned `bottom: 20%; left: 38%`. Comprises two 🐂 ox emojis + CSS wagon (canvas top + bed + two wheels).
7. **Weather overlays** — Storm: dark rgba overlay `rgba(20,20,40,0.32)`. Rain/storm: `N` rain-drop divs animated with `translateY(110%) rotate(10deg)`.

**Travel animation** (triggered when player chooses "Push Forward"):
```css
@keyframes wagonTravel {
  0%   { left: 38%; }
  35%  { left: 47%; }
  65%  { left: 30%; }
  100% { left: 38%; }
}
/* Duration: 3.5s ease-in-out forwards */
```
Wagon body also wobbles vertically (`translateY -2px` at 50%, `0.35s` cycle). Dust puff animates off the back-left with `scale()` + `translateX` keyframes.

Cloud drift animation runs during travel (`3.5s ease-in-out infinite alternate`).

### Trail Progress Bar

**Background:** `#2c1f14` (dark ink)  
**Padding:** `9px 13px 11px`  
Fixed height — never flexes.

**Header row:** "🗺️ Trail to Oregon" (gold, 11px, 600) + miles counter (10px, 48% white) space-between.

**Trail track:** `height: 6px`, `border-radius: 3px`, light white background. Gold gradient fill to current position.

Seven landmark markers positioned absolutely along the track:
- **Done:** gold filled dot (14px circle)
- **Ahead:** dim white filled dot
- Name label 8px below each dot (hidden on mobile to prevent overlap)

**Wagon emoji** (`🐂`) positioned at current mile percentage with gold drop shadow.

**Next stop row:** "Next: [Name]" label · progress bar (`flex: 1`) filled green · distance string (gold). All `white-space: nowrap`.

---

## Panel Column (Right / Bottom)

The panel column is a vertical flex container. Children share the height proportionally — no child ever causes overflow. `overflow: hidden` on every container.

### Flex weights

| Section | Flex value | Notes |
|---------|-----------|-------|
| Event panel | `flex: 3` | ~30% of panel |
| Party label + grid | `flex-shrink: 0` | Exactly as tall as the cards need |
| Choices section | `flex: 4` | Fills all remaining space |

### Event Panel

Left border 4px, color by event type:

| Type | Border | Background tint |
|------|--------|----------------|
| crisis | `--red` | `rgba(185,64,64,0.05)` |
| blessing | `--green` | `rgba(74,124,89,0.05)` |
| encounter | `--blue` | `rgba(74,104,144,0.05)` |
| moral | `--amber` | `rgba(194,135,58,0.05)` |

**Structure (flex column, gap 4px):**
1. **Eyebrow** — "⚡ What Just Happened", 9.5px uppercase, `--ink-lt` 60% opacity
2. **Title** — Playfair Display 700, `clamp(15px, 1.8vw, 19px)`. `-webkit-line-clamp: 2` — never blows out on long titles.
3. **Body** — `clamp(12px, 1.3vw, 14px)`, line-height 1.5, `-webkit-line-clamp: 3` — gracefully truncates at 3 lines.
4. **Moral badge** — pill shape, solid color background (set per event), white text 11px 600. Color examples: Perseverance `#c2873a`, Courage `#b94040`, Charity `#4a7c59`. `align-self: flex-start`.

### Party Section

Section eyebrow label: 9.5px uppercase, `--ink-lt` 60% opacity. Padding `6px 14px 0`.

Party grid: `display: grid`, columns based on breakpoint:
- Desktop: `1fr 1fr` (2×2)
- Tablet + Mobile: `repeat(4, 1fr)` (all four in a row)

**Party card:**  
`background: rgba(255,252,245,0.85)`, `border: 1px solid --border`, `border-radius: 7px`, `padding: 6px 8px`

Sick: amber border tint. Critical: red border tint. Dead: `opacity: 0.45; filter: grayscale(0.8)`.

**Inside each card — horizontal flex:**

**Character face (SVG, drawn in code — no image assets):**
- Ellipse hair (color by role)
- Ellipse face (skin tone by role)
- Two rosy cheek ellipses (pink, 40% opacity)
- Two eye ellipses + white shine circles
- Mouth path — SVG quadratic curve, shape based on mood:
  - `happy`: upward curve
  - `neutral`: horizontal line
  - `worried`: downward bow
  - `grim`: sharp inverted V
- Status dot (top-right, 9px radius): green=healthy, amber=sick, red=critical, grey=dead

Face sizes: 48px desktop/tablet, 40px mobile.

**Text details (flex column):**
- Name: `clamp(12px, 1.2vw, 14px)` 700, ellipsis overflow
- Role: 10px, `--ink-lt` 55% opacity
- Health bar: 4px height, color: green >70, amber 41–70, red ≤40
- Status text: 10px 600, same color as health bar

### Choices Section

`flex: 4` — owns the remaining panel height. Padding `0 14px 10px`. Top border `1px solid --border`.

Section label: same eyebrow style. When a choice is selected, appends `→ [Choice Name]` in amber-dark 700.

**Choices list:** `flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 5px`

**Each choice button:** `flex: 1` — all four share height equally. Never a fixed height.

```
[Emoji]  [Label text        ]  [›]
         [Sublabel text      ]
```

- **Emoji:** `clamp(18px, 2vw, 22px)`, `flex-shrink: 0`
- **Label:** `clamp(13px, 1.4vw, 16px)`, 700, `--ink`, ellipsis
- **Sublabel:** `clamp(10px, 1vw, 12px)`, `--ink-lt` 75% opacity, `-webkit-line-clamp: 2`
- **Chevron `›`:** 20px, color = tone accent, `flex-shrink: 0`
- **Sublabels hidden** on tablet/mobile 2-col grid (too small to read)

**Tone accent colors** (used for border + chevron when selected):

| Tone | Color | Use case |
|------|-------|----------|
| action | `#b94040` | Push forward, hunt, cross river |
| rest | `#4a7c59` | Rest, camp, wait |
| moral | `#5a7aaa` | Help others, share supplies |
| faith | `#c2a84f` | Pray, reflect, seek guidance |

**Default state:** `border: 1.5px solid rgba(120,80,40,0.22)`, `background: rgba(255,250,242,0.9)`

**Hover:** `border-color: --amber`, `background: rgba(245,234,216,1)`, `transform: translateX(3px)`

**Selected:** border = tone accent, background = tone accent at 8% opacity, `box-shadow: 0 0 0 2px [accent]28`, `transform: translateX(3px)`

---

## Responsive Behavior Summary

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Layout | Side-by-side | Stacked | Stacked |
| Scene height | ~65% of screen | 38% | 30% |
| Header era subtitle | Visible | Visible | Hidden |
| Header "Steady Pace" chip | Visible | Hidden | Hidden |
| Header "Day 112" chip | Visible | Visible | Hidden |
| Grace meter pips | 10 | 10 | 5 |
| "Grace" text label | Visible | Visible | Hidden |
| Party grid | 2×2 | 4-across | 4-across |
| Choices layout | 1-column | 2×2 grid | 2×2 grid |
| Choice sublabels | Visible | Hidden | Hidden |
| Landmark names on trail | Visible | Visible | Hidden |
| Face size | 48px | 48px | 40px |

---

## Animations

| Animation | Trigger | Duration | Notes |
|-----------|---------|----------|-------|
| Wagon travel | "Push Forward" choice | 3.5s | Left position: 38→47→30→38%, ease-in-out |
| Wagon wobble | During travel | 0.35s loop | `translateY(-2px)` at 50% |
| Dust puff | During travel | 0.85s loop | scale + translateX off wagon rear |
| Cloud drift | During travel | 3.5s / 4.2s alternate | Both clouds drift left simultaneously |
| Rain fall | Weather = rainy/stormy | 0.75s / 0.5s loop | `translateY(110%) rotate(10deg)` |
| Grace pip fill | Any grace change | 0.3s | CSS `transition: background 0.3s` |
| Trail fill | Mile update | 0.5s | CSS `transition: width 0.5s` |
| Health bar | Health change | 0.4s | CSS `transition: width 0.4s` |
| Choice hover | Hover | 0.12s | `translateX(3px)` |

**Performance note:** All animations are CSS-only (no JS animation loops). Rain uses `N` static divs with staggered `animation-delay`, not dynamically spawned elements. Total animation cost is minimal — suitable for Chromebook hardware.

---

## Landmark Data Reference

| Short | Full Name | Mile |
|-------|-----------|------|
| Start | Independence, MO | 0 |
| Kearny | Fort Kearny | 307 |
| Chimney | Chimney Rock | 521 |
| Laramie | Fort Laramie | 667 |
| S.Pass | South Pass | 932 |
| Ft.Hall | Fort Hall | 1,288 |
| Oregon | Oregon City | 2,170 |

---

## Implementation Notes for Claude Code

1. **No-scroll is structural, not cosmetic.** Every flex container needs `min-height: 0` or it will refuse to shrink and cause overflow. This is the most common mistake.

2. **Choice buttons must be `flex: 1` inside a flex-direction column.** Do not give them a fixed height. On short screens they compress; on tall screens they expand. The font `clamp()` values ensure text remains readable at both extremes.

3. **`-webkit-line-clamp`** is the correct tool for graceful text truncation inside fixed containers. Use it on event body (3 lines) and choice sublabels (2 lines).

4. **Weather state lives in React**, not CSS classes on the body. The sky gradient, rain divs, and storm overlay are all conditionally rendered based on a `weather` state string (`"sunny" | "rainy" | "stormy"`).

5. **Character faces are procedural SVG** — no image files needed. The face is parameterized by `member.role` (skin/hair color), `member.mood` (eye shape + mouth curve), and `member.status` (status dot color). Size is a prop (`size={48}`).

6. **Breakpoint class** (`bp-desktop`, `bp-tablet`, `bp-mobile`) is set on `.game-root` by a `useWindowWidth` hook, not via CSS media queries alone. This allows JSX logic (conditional chip rendering, face sizes) to stay in sync with layout.

7. **Trail progress bar background is `#2c1f14`** (same as header). This creates a visual anchor — dark bookends (header + trail) frame the parchment content between them.

8. **Resource bar uses `overflow: hidden`**, not `overflow-x: auto`. At the target sizes (tablet+) all six items fit comfortably with `flex: 1` equal columns. If a future build adds more resources, consider switching to scroll or using `display: grid` with `minmax`.
