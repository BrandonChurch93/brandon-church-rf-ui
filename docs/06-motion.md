# 06 · Motion

Motion is the part of this project the owner cares about most and the part reviewers will remember. It is also where unreviewed builds most often feel cheap. Follow this document literally. Values are not suggestions.

The owner's words from the derby review: hovers that were 220 ms felt "very very fast, not cinematic and smooth at all, very jarring". Everything here is tuned against that.

## Tokens (`src/styles/tokens.scss` and `src/motion/tokens.ts`)

| Token | Value | Use |
|---|---|---|
| `--dur-xs` | 120 ms | press feedback, switch knob, checkbox tick, menu item hover |
| `--dur-sm` | 200 ms | color and opacity changes on small controls, menu and popover enter |
| `--dur-md` | 320 ms | modals, toast enter, sheet and drawer exit, expand and collapse exit, theme fallback crossfade |
| `--dur-lg` | 480 ms | sheets, drawer, expand and collapse enter, Flip reflows, new-card arrival |
| `--dur-hover-in` | 420 ms | hover enter on cards, buttons, rows |
| `--dur-hover-out` | 560 ms | hover leave (always slower than enter) |
| `--dur-xl` | 700 ms | landing beats, progress fills, theme switch (View Transitions path) |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | anything entering or responding to hover |
| `--ease-in` | `cubic-bezier(0.64, 0, 0.78, 0)` | anything leaving |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | things that move from one resting place to another |
| GSAP `power3.out` | | entering, settling |
| GSAP `power2.inOut` | | the mode transition's camera move |
| GSAP `power1.inOut` | | opacity during the camera move |
| GSAP `back.out(1.6)` | | the pill's entrance |
| GSAP `back.out(2.2)` | | small pops (the chip, a check mark) |
| GSAP `elastic.out(1, 0.5)` | | the pill's hover release and catch |

## Rules

1. Enter with ease-out, leave with ease-in, and leave 20 to 40 percent faster than you entered. The catalog below already obeys this; keep new animations inside the same band.
2. Hover in at `--dur-hover-in`, hover out at `--dur-hover-out`, both `--ease-out`. Never under 400 ms for a lift.
3. Animate only `transform` and `opacity` for anything larger than a button. Colors, borders and shadows may transition on small elements (cards count as small; full layers do not).
4. Never animate `filter`, `backdrop-filter`, `width`, `height`, `top`, `left` or `box-shadow` on anything larger than a card. For height changes use GSAP (measure, then tween `height` on the element only for the duration, then set `auto`).
5. `will-change` only during an animation, removed after. Never leave it on resting elements.
6. Stagger lists by 40 to 70 ms per item, capped so the last item starts within 400 ms.
7. Things that appear come from where they were triggered (a menu grows from its trigger's corner, a popover from its anchor, a toast from the bottom edge, a sheet from the right edge, a new card from its grid slot at 96 percent scale).
8. Nothing loops forever at full energy. The pill's attention beats stop after the first click; its border keeps turning, slowly.
9. No shimmer, glint or light sweep on any surface. The pill is the single exception and only before the first click.
10. Interrupting an animation reverses or redirects it; it never snaps. Use GSAP's `overwrite: 'auto'` for hover tweens and keep a reference to running timelines so a second click reverses instead of restarting.
11. `prefers-reduced-motion: reduce`, or the user's "Reduce motion" setting, turns every duration over 200 ms into a 150 ms opacity crossfade with no transforms, disables the pill's beats and border rotation, and replaces the mode transition with a 250 ms crossfade.

## Hover language

| Element | Hover in | Hover out |
|---|---|---|
| Clickable card | `translateY(-3px)`, shadow `--shadow-1` to `--shadow-2`, border `--line` to `--line-hover`, its action buttons fade and rise in (`opacity 0 → 1`, `translateY(-4px → 0)`) | reverse, slower |
| Button primary | `translateY(-1px)`, glow intensifies 20 percent | reverse |
| Button secondary and ghost | background to `--accent-soft` (ghost) or `--surface-2` (secondary) | reverse |
| Nav item | background to `--accent-soft`, text to `--text` | reverse |
| Table row (clickable) | background `--surface-2`, row actions fade in | reverse |
| Setting row (Guide Step 1) | background `--surface-2`, chevron slides 2 px right | reverse |
| Menu item | background `--accent-soft` instantly (menus feel better fast: 120 ms) | 200 ms |
| Icon button | background `--field` 200 ms | 320 ms |
| Non-interactive text, labels, descriptions | nothing. Ever. | |

Press (mousedown) on buttons and cards: `scale(0.98)` at `--dur-xs`, release back at `--dur-sm` ease-out.

## Enter and exit catalog

| Element | Enter | Exit |
|---|---|---|
| View (on nav change) | outgoing: opacity 1 → 0, `translateY(0 → -6px)`, 240 ms ease-in; incoming: header then each section, `opacity 0 → 1`, `translateY(12px → 0)`, 360 ms ease-out, stagger 60 ms; scroll resets to top first | |
| Side sheet | `translateX(24px → 0)` and `opacity 0 → 1`, 480 ms ease-out; scrim `opacity 0 → 1` 320 ms | `translateX(0 → 16px)`, opacity to 0, 320 ms ease-in; scrim 240 ms |
| Bottom sheet (mobile) | `translateY(100% → 0)`, 480 ms ease-out | `translateY(0 → 100%)`, 320 ms ease-in |
| Modal | `scale(0.96 → 1)` and opacity, 320 ms ease-out; scrim 320 | `scale(1 → 0.98)`, opacity, 200 ms ease-in |
| Menu and popover | `scale(0.96 → 1)` from the trigger corner (`transform-origin` set), opacity, 200 ms ease-out | 140 ms ease-in |
| Tooltip | opacity and `translateY(4px → 0)` 160 ms after a 400 ms delay | 100 ms |
| Toast | `translateY(16px → 0)`, opacity, 320 ms ease-out; others shift up with Flip | `translateY(0 → 8px)`, opacity, 240 ms ease-in |
| Drawer (mobile nav) | `translateX(-100% → 0)` 480 ms ease-out, scrim 320 | 320 ms ease-in |
| Command palette | `scale(0.98 → 1)`, `translateY(-8px → 0)`, opacity, 240 ms ease-out; list items do not stagger (speed matters here) | 160 ms |
| New card in a grid | Flip the grid (480 ms) while the new card goes `scale(0.96 → 1)`, opacity 0 → 1, 420 ms ease-out, starting 80 ms after the Flip begins | |
| Removed card or row | the element `scale(1 → 0.96)`, opacity → 0, 280 ms ease-in, then Flip the remaining items into place (480 ms ease-in-out) | |
| Reordered list (drag end) | dnd-kit handles the drag; on drop, Flip the final positions 320 ms ease-out | |
| Expand and collapse (nav group, "Show all", accordion) | GSAP height tween 480 ms ease-out with the revealed children fading in, stagger 40 | height tween 320 ms ease-in, children fade out first (120 ms) |
| Check mark (item configured) | the check path draws in (stroke-dashoffset) 360 ms ease-out, then `back.out(2.2)` scale pop 1 → 1.15 → 1 over 300 ms | |
| Progress bar value change | width tween 700 ms ease-out | |
| Switch toggle | knob 120 ms ease-out, track color 200 ms | |
| Save success | button label crossfades to a check icon for 1200 ms, then back; the saved record flashes its border `--accent` at 40 percent for 600 ms | |
| Copy to clipboard | the copy icon morphs to a check for 1200 ms, tooltip reads "Copied" | |
| Gate unlock (Guide Step 2) | the locked cards' overlay fades out 420 ms, cards rise 4 px, 60 ms stagger; the tooltip disappears | |
| Theme switch | if `document.startViewTransition` exists: circular clip from the toggle's position, 700 ms ease-in-out; otherwise all color tokens transition 320 ms via a temporary `transition: background-color, color, border-color, fill` rule on `*` for 320 ms, then removed | |
| Event switch | body content fades out 240 ms, data swaps, view enter choreography runs; the rail badge crossfades 240 ms | |
| Sign out and sign in | the whole app `opacity → 0` 320 ms ease-in; sign-in screen fades in 420 ms; reverse on sign in | |

## The pill

The single most important control. It lives in `src/app/Pill.tsx` + `pill.module.scss` + `src/motion/pillIdle.ts`. Reference feel: `reference/prototypes/transition-derby.html` (idle beats, hover, press) and `reference/prototypes/pill-border-derby.html` option 4 (the border).

### Anatomy
- `<button type="button" aria-pressed={mode === 'paper'}>`, `position: fixed`, `z-index` above everything including sheets' scrims (the pill is always reachable), `right: 28px; bottom: 28px` on desktop; on mobile `right: 16px; bottom: calc(var(--tabbar-h) + 16px)` in Brandon's Mode and `bottom: 16px` in faithful mode.
- Height 44, padding `0 18px 0 14px`, gap 10, `border-radius: 999px`, `isolation: isolate`.
- Surface: `#1E0A3F` (near-black grape). Same in both themes.
- Glyph: a 14 px four-point spark (SVG path `M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z`), white.
- Label: Inter 600 13 px, `letter-spacing: 0.01em`, white. Two spans stacked in one grid cell: "Brandon's Mode" and "View original". The inactive one is `opacity: 0; transform: translateY(6px)` and `aria-hidden`. Crossfade 300 ms ease-out when the mode changes (starts at click, not at transition end).
- Shadow at rest: `0 10px 30px rgba(92, 0, 220, 0.35), 0 2px 6px rgba(92, 0, 220, 0.25)`.

### Dual chase border
Two arcs, grape and berry, chase each other around the edge. Implemented with a `::before` ring and a `::after` halo, both using a conic gradient driven by a registered custom property:

```scss
@property --pill-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }

.pill::before {
  content: ''; position: absolute; inset: -2px; border-radius: inherit; padding: 2px; z-index: -1;
  background: conic-gradient(from var(--pill-angle), #5C00DC 0 20%, transparent 30% 50%, #E71356 50% 70%, transparent 80%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: pill-spin var(--pill-spin, 3.4s) linear infinite;
}
.pill::after {
  content: ''; position: absolute; inset: -4px; border-radius: inherit; z-index: -2;
  background: /* same gradient */; filter: blur(12px); opacity: var(--pill-halo, 0.6);
  animation: pill-spin var(--pill-spin, 3.4s) linear infinite;
}
@keyframes pill-spin { to { --pill-angle: 360deg; } }
```

The halo's `filter: blur` is allowed because the element is roughly 150 x 44 px, not a surface. In browsers without `@property` (Firefox before 128, older Safari) the ring falls back to a static two-arc gradient with no rotation: detect with `'registerProperty' in CSS` (nothing else; `paint()` is Chromium-only and must not be used as the test) and set `animation: none`; it must still look intentional.

After the first click: `--pill-spin` becomes `6s` and `--pill-halo` `0.45` (transition the opacity over 600 ms; the speed change happens at the next animation iteration via a class swap that keeps the angle continuous, or simply accept a restart at the moment of the click when the pill is already animating its press).

### Entrance
On first paint of faithful mode, the pill starts at `translateY(140%)`, `opacity: 0`. At 800 ms after the page is interactive: `y → 0`, `opacity → 1`, 900 ms, `back.out(1.6)`. Then the idle loop starts.

### Idle attention beats (until the first click)
A single GSAP timeline, `repeat: -1`, 4.2 s per cycle:
- 0.0 s: shadow intensifies to `0 14px 40px rgba(92,0,220,.55), 0 2px 6px rgba(92,0,220,.3)` over 1.6 s `sine.inOut`, back to rest over the next 1.6 s. (Shadow tween is allowed here: a roughly 150 x 44 px element.)
- 0.2 s: a 1.5 px ring (`border: 1.5px solid rgba(138, 63, 255, 0.7)`, same radius, inset 0, pointer-events none) scales 1 → 1.9 and fades 0.8 → 0 over 1.4 s `power2.out`.
- 3.0 s: a light sweep: a clipped child spanning the pill with a `linear-gradient(115deg, transparent 40%, rgba(255,255,255,.38) 50%, transparent 60%)` translates from -60% to 60% over 0.9 s `power2.inOut`. At the same moment the glyph rotates +90° over 0.5 s `back.out(2)`.
- Hover pauses the loop; leave resumes it.

### Hover and press
- Enter: `scale → 1.04`, 250 ms ease-out; the surface gradient position shifts (if a gradient is used on the surface; with the solid `#1E0A3F` surface, instead brighten the halo opacity to 0.8).
- Magnetic: on `mousemove` within the pill, translate by `(cursor − center) × 0.18`, 300 ms `power2.out`.
- Leave: `x, y → 0`, `scale → 1`, 500 ms `elastic.out(1, 0.5)`.
- Press: `scale → 0.96` 100 ms; release `→ 1.04` 200 ms; on click, a hard ripple: the ring scales 1 → 2.6 and fades 1 → 0 over 700 ms `power3.out`.
- Keyboard: Enter and Space trigger; focus ring is a 2 px white outline, offset 3.

### Stepping aside
The pill must never sit on top of a sheet's footer actions, a modal, the palette, the drawer or a mobile bulk bar. While any of those layers is open (or selection mode is active on mobile), the pill slides off screen (`translateY(140%)`, 320 ms ease-in) and returns when the last layer closes (480 ms ease-out). Toasts are positioned so they never overlap the pill (`07-shell.md`), so the pill stays visible while toasts show.

### Reduced motion
No entrance animation (appears at rest), no beats, no magnetic, no ring rotation (static arcs), label crossfade becomes an instant swap. The step-aside becomes an instant hide and show. The pill still works.

## The mode transition · "Pull back · rise"

Chosen by the owner from `reference/prototypes/transition-derby.html` (button "Pull back · rise"). His requirement, verbatim: the outgoing page must keep fading while it recedes as the new one fades in, so two solid pages are never on screen together. The timeline below satisfies that: the outgoing layer begins fading at 100 ms and is gone at 1000 ms; the incoming layer begins arriving at 300 ms. At 650 ms the outgoing layer is at about 0.3 opacity and the incoming at about 0.6, so neither is solid. Verify this with mid-transition screenshots and with the motion gate's seek check.

Implemented in `src/motion/modeTransition.ts` as one GSAP timeline returned to `ModeStage`. Both layers are mounted before it starts. The stage has `perspective: 1600px; perspective-origin: 50% 40%`. While it runs the stage carries `data-transitioning="true"`, and `window.__rf.transition` exposes the live timeline (`pause()`, `seek(seconds)`, `play()`) so the motion gate can inspect exact moments instead of racing the clock.

Setup (synchronous, before the timeline plays):
- Outgoing layer: add class `is-card` (`border-radius: var(--r-2xl); overflow: hidden; box-shadow: 0 40px 120px rgba(20,10,40,.45), 0 10px 30px rgba(20,10,40,.25)`), `z-index: 2`, `will-change: transform, opacity`, `transform-origin: 50% 40%`. Its scroll position is frozen by the `overflow: hidden`.
- Incoming layer: `z-index: 1`, `will-change: transform, opacity`, `opacity: 0`, `scale: 0.97`, `y: 56px`, scrolled to top. Its "parts" (for Brandon's Mode: rail, sidebar, view header, then each top-level section of the view, in DOM order, max 6; for faithful mode: rail, sidebar, event header, intro, module) start at `y: 20px, opacity: 0`.
- Dim overlay (`position: fixed; inset: 0; pointer-events: none; z-index: 3; background: radial-gradient(ellipse at 50% 45%, rgba(20,14,34,.35) 0%, rgba(20,14,34,.70) 100%)`) at `opacity: 0`.
- `busy = true`: the pill ignores clicks and keys until the timeline completes.

Timeline (t in milliseconds from the click; eases are GSAP names):

| t | Target | Tween |
|---|---|---|
| 0 | pill | hard ripple (above); label crossfade 300 ms; `aria-pressed` flips |
| 0 | dim | `opacity 0 → 0.8`, 500 ms, `sine.out` |
| 0 | outgoing layer | `scale 1 → 0.88`, `y 0 → -30`, `rotateX 0 → 7deg`, 1400 ms, `power2.out` |
| 100 | outgoing layer | `opacity 1 → 0`, 900 ms, `power1.inOut` (reaches 0 at 1000) |
| 300 | incoming layer | `opacity 0 → 1`, `scale 0.97 → 1`, `y 56 → 0`, 1300 ms, `power3.out` |
| 450 | incoming parts | `y 20 → 0`, `opacity 0 → 1`, 1000 ms, `power3.out`, stagger 70 ms |
| 700 | dim | `opacity 0.8 → 0`, 900 ms, `sine.inOut` |
| 1050 | landing beats (only when entering Brandon's Mode and the Guide view is showing) | progress bar width `0 → value`, 900 ms, `power3.out` |
| 1200 | landing beats | "days out" chip `scale 0.6 → 1`, `opacity 0 → 1`, 500 ms, `back.out(2.2)` |
| 1950 (at most 1800 when there are no landing beats; 1730 with five parts) | complete | the timeline's last tween ends (the parts stagger ends at 1800; the progress bar ends at 1950); then clear all inline styles and `will-change`, remove `is-card`, unmount the outgoing layer, `busy = false` |

Reverse (Brandon's Mode → faithful) uses the same table with the roles swapped and no landing beats. It is a fresh timeline built the same way, not `timeline.reverse()`, because the incoming layer's parts differ.

Entering Brandon's Mode for the first time shows the Guide view (or the hash's view). Returning to faithful mode shows the faithful page scrolled to top.

The dim overlay sits above both layers but below the pill; the pill is never dimmed.

What you must verify by screenshot at 300, 650, 1000, 1400 and 2000 ms, both directions, both themes, at 1447 and 390 wide:
- At 300: outgoing visibly smaller, rounded, lifted, still mostly opaque; incoming just beginning to appear beneath.
- At 650: outgoing about 0.3 opacity, incoming about 0.6; incoming clearly rising; dim at peak.
- At 1000: outgoing gone; incoming near full opacity, parts still settling; dim fading.
- At 1400: incoming settled; progress bar drawing; chip popping.
- At 2000: clean final state; no inline styles left; `getComputedStyle(layer).willChange === 'auto'`.

Performance: the gate in `19-testing.md` records long tasks during the transition; none may exceed 100 ms, and the total transition must complete within 2.4 s of the click.

### Mobile
Same timeline, same values. The incoming "parts" are the top bar, the view header and the first three sections (fewer elements are visible). The pill's position shift (faithful `bottom: 16px` → Brandon's Mode `bottom: tabbar + 16px`) animates over 480 ms ease-out, starting at t = 300 so it travels with the incoming layer.

### Reduced motion
Both layers mounted; incoming fades in over 250 ms while outgoing fades out over 200 ms; no card, no dim, no beats; label swaps instantly.

## Verifying motion

Besides screenshots, record a short Playwright video of: the pill entrance and one idle cycle; the transition both directions; a card hover; opening a sheet; removing a card with undo. Step through frames. If any frame shows a snap, a plateau where nothing moves, or two solid pages, fix the timing. Log notable tuning in `decisions.md`.
