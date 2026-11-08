# 19 · Testing and gates

Tests exist so you can prove the product works without anyone watching, and so the Partner can trust the build. Every interaction in the specs gets an e2e test. Every visual surface gets a captured screenshot you look at. Five gates must pass before a phase closes and before you report completion.

## Setup

- `@playwright/test` with Chromium (gate browser) and WebKit (smoke). Install browsers in Phase 0 (`npx playwright install chromium webkit`).
- `playwright.config.ts`: `webServer` runs `npm run preview -- --port 4173` after a build for e2e and gates (except the build gate which uses `file://`). `use.viewport` default 1447 x 1024. Reporter `list` plus `html` output to `tests/report/` (gitignored).
- Deterministic time: every test calls `await page.clock.install({ time: new Date('2026-11-07T18:00:00Z') })` before navigation so "38 days out", relative times and code expiry are stable while time still advances (GSAP's ticker reads `Date.now`, so never use `setFixedTime`, which would freeze every tween). Add one sanity test that a GSAP tween actually advances under the installed clock. (The seed's "now" is the same instant; see `16-data-model.md`.)
- Deterministic data: before each test, clear `localStorage` so the seed loads fresh.
- Reduced motion is OFF in tests unless a test is specifically about reduced motion (the gates must exercise real motion).

## Test hooks (`window.__rf`)

Expose a tiny, harmless object in all builds (it is useful for the interview too):

```ts
window.__rf = {
  setMode(mode: 'faithful' | 'paper', opts?: { instant?: boolean }),  // instant skips the transition
  setTheme(theme: 'light' | 'dark' | 'system'),
  setReduceMotion(value: boolean | null),
  resetData(),
  getState(),           // read-only snapshot of the store
  transition: null | { pause(): void; seek(seconds: number): void; play(): void },  // the live mode-transition timeline while one runs
  version: string,      // from package.json
};
```

Tests use `setMode('paper', { instant: true })` to reach views quickly, and the real pill for transition tests.

## E2E suite (`tests/e2e/`)

One spec file per area. Each spec covers the happy path, the empty state, validation, keyboard operation, and undo where applicable. Required files and the minimum they assert:

- `faithful.spec.ts`: renders at 1447, title is "RainFocus Summit · Claude", no console errors, mobile drawer opens and closes with mouse and keyboard, no horizontal overflow at 320.
- `pill.spec.ts`: entrance happens (pill visible after 2 s), label flips on click, `aria-pressed` flips, second click returns, clicks during transition are ignored, keyboard activation works, reduced motion path works.
- `transition.spec.ts`: mid-frames (see the motion gate), final state clean, hash view honored, both directions, mobile width.
- `shell.spec.ts`: nav routes and hash sync, back and forward, active indicator, group expand and collapse persists, palette open and close and execute (page, action, attendee, code), account menu (theme, reduce motion, reset, about, sign out and sign in), event switcher (switch, data changes, create event), toasts (max 3, undo, pause on hover), drawer and bottom tabs at 390.
- `guide.spec.ts`: hero inline rename with validation, logo editor (upload a fixture PNG, zoom, save, propagation to rail), status chip text, module collapse, progress count, each setting sheet saves and marks configured with the check animation present, gate locked on Horizon and unlocks after configuring General, workflow card hover actions, reorder by drag and by keyboard, template picker adds a card, editor saves, status Live validation, remove with undo, show all, portal and calendar previews reflect Content changes and save their settings.
- `attendees.spec.ts`: search, each filter, sort each column, pagination and page size, selection and bulk actions, add with duplicate email error, detail sheet edit and save, activity entries appended, remove with undo, export produces a download with the right row count, mobile card list and filters sheet and selection mode at 390.
- `attendee-types.spec.ts`: add, edit, color, reorder, default, duplicate, remove unused, remove in use with reassignment and undo, default cannot be removed.
- `packages.spec.ts`: add, edit, includes tag input, archive and unarchive filter, remove blocked when sold, sold percentages match seed, currency change reformats.
- `reg-codes.spec.ts`: generate, regenerate code, uniqueness, bulk generate count and undo, copy code (clipboard permission granted in the test context), active switch rules for expired and exhausted, edit, remove nulls attendee links.
- `discounts.spec.ts`: add percent and fixed with live preview math (assert exact strings), validation bounds, window rules, remove updates codes with warning.
- `content.spec.ts`: grid renders 14 blocks at the right positions, drag to a free slot moves (dnd-kit via pointer), drag to an overlapping slot is refused with the named toast, keyboard move, sheet edit with overlap validation, add session from an empty cell, manage tracks, list view on mobile, day tabs on Horizon.
- `exhibitors.spec.ts`: cards and filters, add, detail edit, staff linking, floor map booth hover and click, assign from empty booth with undo, remove frees booth, map scrolls at 390.
- `persistence.spec.ts`: changes survive reload (mode does not), reset restores seed, version mismatch reseeds, storage failure falls back to memory with the toast.
- `theme.spec.ts`: light default, dark applies `data-theme`, system follows `prefers-color-scheme` emulation, switch animation does not throw, persists.
- `keyboard.spec.ts`: skip link, focus trap in sheets and modals and palette and drawer, Escape stack order, return focus to trigger, roving focus in menus and lists.

Use accessible locators (`getByRole`, `getByLabel`) so the tests also enforce naming. Avoid `waitForTimeout` except in motion tests where fixed frames are the point.

## Visual catalog (`tests/visual/capture.spec.ts`)

Not a strict diff; a catalog for human review (you now, the Partner later). Because the app's document never scrolls, "full page" is captured by setting the viewport height to the active layer's `scrollHeight` (minimum 900) before each shot, the same technique as the pixel gate. Captures PNGs into `tests/visual/__captures__/<mode>/<theme>/<view>-<width>.png` for:

- Faithful mode at 1447, 1024, 768, 390, 320 (light only; faithful has no theme), plus 390 with the drawer open.
- Brandon's Mode, light and dark, each of the eight views at 1447, 1024, 768, 390, 320.
- States: Guide with a sheet open, Attendees with a selection and the bulk bar, Attendees detail sheet, palette open with results, account menu open, event switcher open, Horizon's locked Step 2 with its tooltip, a toast stack of three, sign-in screen, Content grid mid-drag (pointer held), Exhibitors floor map with hover, Logo editor open, Template picker open.
- Hover states: a card hovered, a nav item hovered, a table row hovered (use `page.hover`).
- Transition frames at 300, 650, 1000, 1400, 2000 ms (via `__rf.transition.seek`), both directions, both themes, at 1447 and 390.

After every capture run, open the PNGs and look. Fix what is wrong. These files are committed so the Partner reviews the same images.

## Gates (`tests/gates/`)

### Faithful pixel gate (`faithful.spec.ts`)
1. Serve the app (preview) and open it at 1447 x 1024 in faithful mode with `page.emulateMedia({ reducedMotion: 'reduce' })` set before `goto` (this removes the pill's entrance, beats, halo rotation and ring, none of which affect layout, and cannot race the entrance timer). Wait for `document.fonts.ready`. Screenshot the viewport to a buffer.
2. In the same browser, open `reference/faithful/index.html` over `file://` at 1447 x 1024. Wait for fonts. Screenshot the viewport to a buffer.
3. Mask: paint the pill's bounding box expanded by 48 px on every side with white on both images (the reference has no pill; the pill's shadow and halo reach beyond its box). Nothing else is masked.
4. Compare with `pixelmatch` (`threshold: 0.1`, `includeAA: false`). The pass metric is pixelmatch's returned mismatch count divided by total pixels. Require < 1.0% at 1447 x 1024.
5. Repeat at 1024, 768, 390 and 320. The app's document never scrolls (the stage is fixed and the layers are their own scroll containers), so full-page captures are not comparable. Instead: open the reference at the width, read `document.documentElement.scrollHeight`, set both pages' viewport to that width and height (the faithful layer then needs no scrolling either), and compare viewport screenshots. Require < 2.0%.
6. Run the 1447 comparison a second time with `__rf.setTheme('dark')` applied first; faithful mode must be unaffected by theme, so the result must be identical within the same threshold.
7. Write `tests/gates/__out__/faithful-diff-<width>.png` (the pixelmatch diff image) and `faithful-overlay-<width>.png` (50/50 blend). Open the overlay and look at it. If the number passes but the overlay shows drift, fix the drift anyway.

Both pages use the identical Inter woff2 (the app via fontsource, the reference via its local `fonts/`), so sub-pixel text rasterization is the only legitimate difference. Wait for fonts (`document.fonts.ready`) before screenshotting; reduced motion is already emulated, so there is no entrance to wait for.

### A11y gate (`a11y.spec.ts`)
As specified in `18-accessibility.md`. Zero serious or critical violations across the listed pages and states, both themes. For faithful mode only, the `color-contrast` rule is disabled, because the Figma's own `#777777` labels are below AA and faithful mode must not change them; log this as a decision. Output the report to `tests/gates/__out__/a11y.json`.

### Motion gate (`motion.spec.ts`)
1. In faithful mode at 1447 x 1024, install a `PerformanceObserver` for `longtask` via `page.evaluate` (buffered), click the pill, wait for the stage's `data-transitioning` attribute to clear, then read long tasks. Require none > 100 ms during the window and total duration from click to clear < 2400 ms.
2. In a second run, click the pill, `page.waitForFunction(() => window.__rf.transition !== null)` (the timeline is created only once the paper chunk has loaded), then `__rf.transition.pause()` and `seek(0.65)`. Read the computed opacity of both layers: the outgoing must be between 0.15 and 0.45 and the incoming between 0.45 and 0.85. Also seek to 0.3 and 1.0 and screenshot each for the visual catalog. Then `play()` and wait for completion. This encodes the owner's "never two solid pages" requirement without racing wall-clock time.
3. After completion: both layers' `will-change` is `auto`, the outgoing layer is unmounted, no inline `transform` on the incoming layer, the pill's label reads "View original" and `aria-pressed="true"`.
4. Repeat in reverse. Repeat at 390 wide. Repeat with `setReduceMotion(true)`: complete within 500 ms, no transforms applied.

### Build gate (`build.spec.ts` + `scripts/verify-build.mjs`)
1. `npm run build` produces `build/index.html` and nothing the page needs outside it (assert no `<script src>` or `<link href>` pointing to files; favicon may be a data URI).
2. Launch Chromium, open `file://<abs path>/build/index.html`. Assert: title "RainFocus Summit · Claude"; the faithful page renders (the "Event setup guide" heading is visible); zero console errors and zero failed requests; fonts loaded (`document.fonts.check('600 14px Inter')` true); the pill is visible; clicking it reaches Brandon's Mode (Guide heading visible); theme switch to dark works; a CSV export triggers a download; reload returns to faithful mode with Brandon's Mode data still persisted (check a changed event name survives).
3. Repeat the render and pill check in WebKit.
4. Record the file size of `build/index.html` in `progress.md`. Expect 2 to 5 MB.

### Lint and types
`npm run typecheck` and `npm run lint` with zero warnings are part of `verify`.

## `npm run verify`

Runs, in order: typecheck, lint, build, e2e, faithful gate, a11y gate, motion gate, build gate, visual capture. Fails fast. Prints a summary table.

## When to run what

- While building a component: capture and look, many times.
- Before closing a phase: `npm run verify` green.
- Before reporting completion: `npm run verify` green twice in a row (flakiness is a bug; fix it rather than retrying).

## Writing tests that are not brittle

- Prefer roles and labels to CSS selectors. The only data-testids allowed are on the stage layers (`data-layer="faithful|paper"`) and the pill (`data-pill`), because they are structural.
- Never assert exact pixel positions in e2e; assert relationships (block A above block B, column count, visible or not). Exact pixels belong to the faithful gate only.
- For GSAP, wait on state (`data-transitioning`), not on time, except in the motion gate where time is the subject.
- Clipboard tests grant `clipboard-read` and `clipboard-write` in the context and read back `navigator.clipboard.readText()`.
- Download tests use `page.waitForEvent('download')` and parse the CSV to count rows.
