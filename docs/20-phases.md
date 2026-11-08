# 20 · Phases

Build order with exit criteria. Work the phases in order; each one leaves the repo in a working, committed state. There are no time estimates here on purpose: the owner does not want them, and they do not change the work. Every phase ends with `npm run verify` green for everything that exists so far (gates that depend on later phases are skipped with a logged reason until their phase lands, then never skipped again).

Mark progress in `docs/progress.md` using the checklist at the bottom of this file.

## P0 · Scaffold
Read: 00, 01, 02, 03, 19.
- Vite + React + TS project at the repo root (the folder is already named `brandon-church-rf-ui`). Install the approved dependencies only. Record versions in `decisions.md`.
- `vite.config.ts` per `03` (single-file build, `base: './'`, outDir `build`).
- Folder layout per `03`. `styles/tokens.scss`, `faithful-tokens.scss`, `globals.scss`, `mixins.scss` with every token from `04` and `05`. `motion/tokens.ts` mirroring `06`.
- Fonts via fontsource. Favicon from the rf mark.
- ESLint config, `tsconfig` strict, Playwright config with Chromium and WebKit installed, the `scripts/` stubs (`verify-build.mjs`, `package.mjs`, `generate-seed.mjs` with the generator written and run; commit the seed JSON).
- `window.__rf` hooks skeleton. `setTheme` already sets `data-theme` on `<html>` in P0 (the full theme system lands in P3) so the faithful gate's dark run can execute in P1.
- `.gitignore` (node_modules, build, tests/report, tests/gates/__out__, .DS_Store). `git init -b main`, first commit.
- Exit: `npm run dev` shows a placeholder; `npm run build` produces a single `build/index.html` that opens over `file://`; typecheck and lint pass; seed JSON generated and validated by the script's own checks.

## P1 · Faithful mode
Read: 04 (all), 19 (faithful gate), reference files.
- Port `reference/faithful` into `src/faithful/` as React + SCSS modules using `faithful-tokens.scss`. Assets copied to `src/assets/`.
- Responsive behavior ported, drawer accessible.
- `ModeStage` renders faithful mode only for now. Pill placeholder not yet present (P2), so the gate's mask is a no-op.
- Write `tests/e2e/faithful.spec.ts` and `tests/gates/faithful.spec.ts`.
- Exit: faithful gate passes at all five widths; overlay images reviewed; no horizontal scroll at 320; build gate's faithful checks pass over `file://`.

## P2 · Pill and mode transition
Read: 06 (all), 03 (stage), 19 (motion gate), prototypes.
- `Pill.tsx` with the Dual chase border, entrance, idle beats, hover, press, label crossfade, reduced motion, mobile position.
- `ModeStage` with both layers, `modeTransition.ts` implementing "Pull back · rise" exactly, including the dim overlay, the parts stagger, landing beats hooks (the Guide view will register its progress bar and chip as landing targets in P5; until then the hooks are no-ops), reverse direction, interrupt protection, cleanup.
- A placeholder `PaperApp` (canvas-colored page with a heading "Brandon's Mode") so the transition has a destination.
- Tests: `pill.spec.ts`, `transition.spec.ts`, `gates/motion.spec.ts`. Capture transition frames and look at them.
- Exit: motion gate passes; frames at 650 ms show both layers semi-transparent; faithful gate still passes with the pill masked.

## P3 · Design system, primitives and shell
Read: 05, 07, 17, 18.
- Theme system (`data-theme`, system tracking, persistence in a minimal store slice; the full store is P4 but `ui` can start here).
- Every primitive in `05` with all states, in `src/paper/ui/`. Build a primitives gallery page (`src/dev/Gallery.tsx`, mounted only when `import.meta.env.DEV` and `location.hash === '#dev-gallery'`, excluded from the production bundle) that shows every primitive in every state, and `tests/visual/primitives.spec.ts` that captures it in both themes. Use the gallery yourself to review every state.
- Shell: rail, sidebar, icon rail (lg), top bar, drawer, bottom tabs, view header pattern, hash routing, view switch choreography, command palette (pages and actions groups; attendee and code groups come alive in P6 and P7), account menu (theme, reduce motion, about, sign out and sign in; reset wired in P4), event switcher UI (switch wired in P4), About panel, Sign-in screen, toast host with undo plumbing.
- Eight empty view shells with their headers and descriptions so navigation is complete.
- Tests: `shell.spec.ts`, `theme.spec.ts`, `keyboard.spec.ts` (shell parts), a11y gate wired.
- Exit: every shell element works with mouse, keyboard and touch emulation at all widths in both themes; a11y gate passes on the shells; visual captures reviewed.

## P4 · Store and data
Read: 16, 03 (state).
- Full Zustand store with slices, selectors, undo tokens, persistence, version check, storage fallback, `resetDemoData`, event switching, create event.
- Load the seed JSON. Wire the event switcher, reset, and the test hooks fully.
- Tests: `persistence.spec.ts`, store unit checks via e2e where simpler.
- Exit: switching events changes the shell's event block and badge; reset works with confirm and toast; reload keeps data and lands on faithful mode.

## P5 · Guide view
Read: 08, 06, 05.
- Everything in `08`: hero (logo editor, inline rename, chip), intro with summary, module accordion with progress, Step 1 settings grid and three sheets, Step 2 gate and tooltip, workflow cards with hover actions, drag reorder, template picker, workflow editor, remove with undo, show all, Step 3 experience cards with portal and calendar previews. Landing beats registered with the transition.
- Tests: `guide.spec.ts`. Visual captures including Horizon's locked state.
- Exit: all of `08` works on all three events in both themes at all widths; the transition into Guide shows the landing beats.

## P6 · Attendees view
Read: 09, 17 (tables to cards), 18 (tables).
- Table, toolbar, filters, sorting, pagination, selection, bulk bar, detail sheet with explicit edit and activity, add sheet with duplicate detection, CSV export, mobile card list with filters sheet and selection mode. Palette "Attendees" group wired.
- Tests: `attendees.spec.ts`.
- Exit: `09` complete; export verified over `file://` in the build gate.

## P7 · Attendee types, Packages, Reg codes, Discounts
Read: 10, 11, 12, 13.
- All four views complete including inline editors, reassignment modal, archive filter, live price preview, bulk generation, copy feedback. Palette "Reg codes" group wired.
- Tests: the four spec files.
- Exit: cross-entity invariants verified by tests (remove type reassigns, remove discount warns codes, package sold counts derive).

## P8 · Content view
Read: 14.
- Grid with drag (pointer and keyboard), list view, session sheet with overlap validation, manage tracks, day tabs, empty states, now line. Portal and calendar previews on Guide reflect sessions.
- Tests: `content.spec.ts`.
- Exit: no overlaps possible through the UI; keyboard moves announced; mobile list.

## P9 · Exhibitors view
Read: 15.
- Cards, filters, detail sheet with staff linking, add sheet, floor map SVG with hover, click, assign popover, keyboard, dark theme.
- Tests: `exhibitors.spec.ts`.
- Exit: `15` complete; map works at 390 with horizontal scroll.

## P10 · Mobile pass
Read: 17, 07 (mobile), 18 (touch).
- Walk every view at 390 and 320 with touch emulation (`hasTouch: true`) in both themes: bottom sheets, drawer, tab bar, selection modes, drag handles with the touch sensor, safe areas, 44 px targets (write a test that measures every interactive element's bounding box at 390 and fails below 44 x 44 unless it is inside a dense text context explicitly allowed in the spec; log allowed exceptions).
- Landscape 844 x 390 check.
- Exit: visual catalog at 390 and 320 reviewed for every view and state; no horizontal overflow anywhere.

## P11 · Polish pass
Read: 02, 06, 05.
- Motion audit: open every surface and watch it; compare against the enter and exit catalog; fix timings and eases that drift; verify no `transition: all`, no `filter` animations on surfaces, `will-change` cleaned up.
- Copy audit: grep string literals and JSX text under `src/paper/`, `src/app/` and `src/store/` for em dashes (`—` and `–`), exclamation marks inside strings (the `!` operator in code does not count), "TODO", "Lorem", "goes here", "coming soon". Must be none. `src/faithful/` is exempt because it reproduces the design's own placeholder copy. Sentence case check by reading every label.
- Dark theme audit: every capture in dark reviewed side by side with light.
- Empty and overflow audit: 200 attendees after adding, 0 of everything after removing, very long names.
- Performance: build size recorded; the motion gate passes three times in a row; no console warnings in dev or build.
- Exit: you have looked at every capture in `tests/visual/__captures__` and would show any of them to a design director.

## P12 · Delivery
Read: 21.
- `README.md` written per `21`. `vercel.json`. `scripts/package.mjs` finished and run; zip inspected (unzip to a temp dir, open `build/index.html` from there, confirm it renders; confirm no `node_modules`, `docs/`, `reference/figma/`, `reference/prototypes/`, `tests/visual/__captures__/`, `CLAUDE.md`, `.claude/`, `START_PROMPT.md` inside, and that `reference/faithful/` is present).
- `npm run verify` green twice.
- `docs/progress.md` completion report written.
- Final local commit `P12: Delivery`.
- Stop.

## Checklist (copy into `progress.md` and tick)

```
[ ] P0 Scaffold
[ ] P1 Faithful mode
[ ] P2 Pill and mode transition
[ ] P3 Design system, primitives and shell
[ ] P4 Store and data
[ ] P5 Guide view
[ ] P6 Attendees view
[ ] P7 Attendee types, Packages, Reg codes, Discounts
[ ] P8 Content view
[ ] P9 Exhibitors view
[ ] P10 Mobile pass
[ ] P11 Polish pass
[ ] P12 Delivery
```
