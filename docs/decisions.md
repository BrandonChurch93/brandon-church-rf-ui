# Decisions log

Every call the Builder makes that the specs did not make. Also: installed dependency versions, any deviation from a spec (with the reason), any a11y "moderate" finding left in place (with justification), and any tuning of motion values after watching them.

Format:

```
### D-<n> · <YYYY-MM-DD> · <short title>
Context: what was unclear or what forced the choice.
Decision: what was chosen.
Why: one or two lines, referencing the quality bar or a spec section.
```

## Pre-made decisions (from the planning conversation, for context)

These were decided with the owner before the build and are reflected in the specs. Listed so you do not relitigate them.

- D-0.1 · Framework and styling: React + TypeScript + Vite, SCSS modules, no styling or component libraries; GSAP, Zustand, dnd-kit and Lucide allowed in Brandon's Mode only.
- D-0.2 · Faithful mode is static and never reads the store. Mode is never persisted.
- D-0.3 · Visual direction "Paper" (option A of the canvas derby), with the RainFocus grape and berry kept as accents, dark theme included, light as the default.
- D-0.4 · Every nav item is a fully working feature (no lightweight views).
- D-0.5 · Mobile parity through one responsive codebase with purpose-built mobile components where needed.
- D-0.6 · No sound design, no onboarding tour, no analytics dashboard, no "what changed" panel.
- D-0.7 · Realistic fake data, generated deterministically.
- D-0.8 · The pill: bottom right, Dual chase border (option 4 of the border derby), attention beats until the first click, label flips to "View original".
- D-0.9 · The mode transition: "Pull back · rise" with a continuous crossfade so two solid pages are never on screen together.
- D-0.10 · Hover motion is slow (420 ms in, 560 ms out); no shimmer effects; no hover affordance on non-interactive text; Step 1 in Brandon's Mode fills its row.
- D-0.11 · No em dashes anywhere.
- D-0.12 · The title is "RainFocus Summit · Claude" in every mode.
- D-0.13 · The deliverable zip excludes the build kit (`docs/`, `reference/figma/`, `reference/prototypes/`, `CLAUDE.md`, `.claude/`, `START_PROMPT.md`) and the visual captures; it keeps `reference/faithful/` so the test suite runs from the zip.

## Builder decisions

(entries start below)

### D-1 · 2026-11-07 · Installed versions
Context: 03-architecture asks for exact versions.
Decision: react 19.3.1, react-dom 19.3.1, typescript 5.9.3, vite 8.3.6, @vitejs/plugin-react 6.2.1, sass 1.108.1, vite-plugin-singlefile 2.3.4, gsap 3.15.1, zustand 5.1.0, @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, @dnd-kit/utilities 3.2.2, lucide-react 1.70.0, @fontsource-variable/inter 5.3.0, @playwright/test 1.65.0, @axe-core/playwright 4.14.0, pixelmatch 8.0.0, pngjs 7.0.0, @faker-js/faker 10.6.0, eslint 9.39.5, @eslint/js 9.39.5, typescript-eslint 8.72.1, eslint-plugin-react-hooks 7.1.1, eslint-plugin-jsx-a11y 6.10.2, globals 17.14.0, archiver 8.0.0.
Why: TypeScript pinned to 5.x because the spec names TypeScript 5 (npm's latest is 6). ESLint pinned to 9 because eslint-plugin-jsx-a11y does not yet declare ESLint 10 support.

### D-2 · 2026-11-07 · Seed surnames
Context: 16-data-model asks for faker.person.lastName(). Faker's en and en_US surname lists produce invented names ("Pfannerstill", "Kuhic", "MacGyver") that read as fake, against quality bar principle 5 (real data).
Decision: first names come from faker (fakerEN_US, full spread). Surnames come from a curated list of about 300 common US surnames across origins, picked with faker's seeded RNG, so the output stays deterministic.
Why: names must look like a real event's data; determinism is unchanged.

### D-3 · 2026-11-07 · Scripts layout
Context: 03 lists verify as a chain of npm scripts and asks for a summary table.
Decision: `npm run verify` runs `scripts/verify.mjs`, which executes the same chain in the same order, fails fast and prints the table. `gate:build` builds then runs `scripts/verify-build.mjs`, which does the static external-reference check and runs `tests/gates/build.spec.ts` in Chromium and WebKit against `BUILD_HTML` (default `build/index.html`); `package.mjs` reuses it with the unzipped path. Playwright projects: `chromium` (all suites), `webkit` (e2e smoke only), `build-chromium` and `build-webkit` (build gate only).
Why: one source of truth for each check; the package step can verify the unzipped copy with the same test.

### D-4 · 2026-11-07 · Zip includes the root index.html
Context: 21-delivery lists the files to zip; the Vite entry `index.html` is not named but `npm run build` needs it.
Decision: include the root `index.html` in the zip.
Why: the zip must build from source as well as open from `build/`.

### D-5 · 2026-11-07 · No color-scheme meta tag
Context: a `color-scheme` meta would let the OS theme tint default controls and scrollbars in faithful mode.
Decision: no meta tag; `color-scheme` is set per theme on `:root[data-theme]` for Brandon's Mode, and the faithful layer pins `color-scheme: light`.
Why: a dark OS or a persisted dark theme must have zero effect on faithful mode.

### D-6 · 2026-11-07 · Faithful a11y exceptions and additions
Context: 18-accessibility and 19-testing allow exactly one exception on faithful mode: `color-contrast` is disabled because the design's #777777 labels are below AA on white.
Decision: that rule is the only one disabled. Two invisible additions keep the rest of axe green without changing a pixel: the user link's accessible name is "FL, First Name Last Name" (label in name, WCAG 2.5.3), and below 900 px the open drawer is a modal dialog (focus moves in, Tab is trapped, Escape and the scrim close it, focus returns to the menu button; the closed drawer is `inert`).
Why: faithful mode must reproduce the design exactly; accessibility fixes that do not render are allowed and expected.

### D-7 · 2026-11-07 · Overlay portal and Paper base scope
Context: 03 scopes every Paper base style under `[data-layer="paper"]`. Sheets, menus and toasts need a portal; portaling to `<body>` would lose those base styles, and a second element carrying `data-layer="paper"` would break the structural test hooks.
Decision: overlays portal into a root inside the paper layer (`data-paper-root`), and the Paper base styles are scoped to `:where([data-layer='paper'], [data-paper-root])`. The paper layer is its own scroll container; rail and sidebar are sticky inside it.
Why: one scroll container per layer (03), base styles reach overlays, and the transition still freezes the outgoing layer's scroll.

### D-8 · 2026-11-07 · Motion gate uses the real clock
Context: 19 says every test installs the fake clock; the motion gate measures real wall-clock duration and long tasks.
Decision: the motion gate does not install the clock; every other suite does. A sanity test in `pill.spec.ts` proves GSAP advances under the installed clock.
Why: the gate's subject is real time; a faked `performance.now` would make its duration meaningless.

### D-9 · 2026-11-07 · Pill structure
Context: the pill's entrance and stepping aside move it vertically, the mobile position shift moves it vertically, and hover, magnetic and press transform it too.
Decision: a fixed dock wraps the button. The dock owns position, entrance (`yPercent`), stepping aside (`yPercent`) and the mobile position slide (`y`, FLIP from the previous position, starting at t = 300 for 480 ms). The button owns hover scale, magnetic `x`/`y` and press. The visually hidden description sits outside the button so it is not part of the accessible name.
Why: separate transform owners never fight, and GSAP composes `yPercent` with `y` cleanly.

### D-10 · 2026-11-07 · `--muted` light value
Context: 05 gives `--muted` #6F6A75 as AA on canvas and surface; it is also used for placeholders and keyboard hints on `--field`, where axe measured 4.4:1.
Decision: light `--muted` is #67626D (one step darker). Dark is unchanged (#9A96A3 passes on every dark surface).
Why: AA everywhere muted text appears; the visual change is barely perceptible.

### D-11 · 2026-11-07 · Event switch fade duration
Context: 07 says the body fades out 160 ms on event switch; 06 (which says its values are literal) says 240 ms.
Decision: 240 ms, per 06.
Why: 06 governs motion values.

### D-12 · 2026-11-07 · Shortcut modifier
Context: ⌘K and ⌘Z on Mac, Ctrl elsewhere. Platform detection can disagree with the keyboard actually in use (an emulated user agent, a Windows keyboard on a Mac).
Decision: shortcuts accept either Cmd or Ctrl. The visible hint still shows ⌘ on Mac and Ctrl elsewhere.
Why: a shortcut that silently fails is worse than one that accepts both modifiers; neither conflicts with browser shortcuts in this app.

### D-13 · 2026-11-07 · Which layers move the pill
Context: 06 lists sheets, modals, the palette, the drawer and the mobile bulk bar.
Decision: exactly those, plus every bottom sheet (on mobile, menus and popovers become bottom sheets that cover the pill's corner). Anchored desktop popovers and menus do not move the pill. The step-aside distance is computed from the pill's resting position so it clears the viewport from its raised mobile position too.
Why: the pill must never sit on a layer's actions, and nothing else should make it jump.

### D-14 · 2026-11-07 · Overlay focus timing
Context: React restores the element that was focused before a commit at the end of that commit, which undid focus returns made in layout-effect cleanups; a palette keystroke could also arrive before a frame-delayed initial focus.
Decision: initial focus happens synchronously in the overlay's layout effect (with a one-frame retry), the Escape and Tab handlers attach in the same layout effect, and focus return runs in a microtask after the commit.
Why: Escape always closes the topmost layer, focus always returns to the trigger, and the first keystroke always lands in the input.

### D-15 · 2026-11-07 · Account menu semantics
Context: 07 calls the account menu a Menu, but it contains a segmented control and a switch, which a `role="menu"` may not contain.
Decision: it is a popover dialog (bottom sheet on mobile) holding the header, the two settings rows and menu-styled action buttons. Keyboard: Tab through, Escape closes and returns focus to the avatar.
Why: valid ARIA beats a nominal menu role; the look and placement match the spec.

### D-16 · 2026-11-07 · Theme reveal only for the user's own switch
Context: Chromium crashed when a View Transition started from an OS color-scheme change (prefers-color-scheme emulation).
Decision: the circular View Transitions reveal runs when the user switches the theme from a control (it has an origin point); OS-driven changes under "System", and the palette's Toggle theme, use the 320 ms color crossfade fallback.
Why: robust in every browser; the designed reveal still plays where it matters.

### D-17 · 2026-11-08 · Guide view details
Context: points 08 leaves open.
Decision: (a) The page's h1 is "Event setup guide"; the event name in the hero is an inline-edit control, not a heading. (b) The portal preview's "signed-in demo attendee" is the earliest registrant (the seed list is newest first). (c) Preview buttons use the swatch's soft fill with ink text, per 05 "never white text on a swatch". (d) Attendee attributes: Full name and Email keep their label, type and Required switch locked, each explained by the "Required by the registration form" tooltip. (e) Workflow cards are one pointer target (a stretched title button) with separate Edit, menu and drag-handle buttons above it, so there are no nested interactive elements. (f) Add registration workflow from the palette on a locked event shows the gate's own message as a toast instead of opening the picker. (g) The Event editor's and every setting sheet's Cancel goes through the unsaved-changes guard.
Why: valid semantics and the quality bar's honest affordances; the spec's own copy is reused.
