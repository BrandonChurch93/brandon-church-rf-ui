# Progress log

The Builder's memory across sessions and compactions. Newest entries at the bottom of each section. Keep it factual and dated. Re-read this file at the start of every session.

## Phase checklist

```
[x] P0 Scaffold
[x] P1 Faithful mode
[x] P2 Pill and mode transition
[x] P3 Design system, primitives and shell
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

## Current phase

P4 · Store and data.

## Session log

Format per entry:

```
### <YYYY-MM-DD HH:MM> · <phase>
Done: ...
Gates: ...
Next: ...
```

(entries start below)

### 2026-11-07 19:40 · P0 Scaffold
Done: Vite + React 19 + TS 5 strict scaffold, single-file build to build/index.html, tokens (Paper, faithful, motion), globals scoped per layer, mixins, ESLint (zero warnings), Playwright (chromium, webkit, build projects), scripts (verify, verify-build, package, generate-seed), window.__rf skeleton, assets copied, seed JSON generated and self-checked (deterministic).
Gates: typecheck, lint, build pass. Build gate passes over file:// in Chromium and WebKit (placeholder page, 0.28 MB). Other gates land with their phases.
Next: P1 faithful mode.

### 2026-11-07 20:05 · P1 Faithful mode
Done: reference/faithful ported to src/faithful (FaithfulPage.tsx, faithful.module.scss, tokens in faithful-tokens.scss). Responsive rules ported; drawer is React state with aria-expanded, inert when closed, focus trap, Escape, scrim, focus return. Layer root carries the reference body styles; element resets scoped with :where so they never outrank module classes.
Gates: pixel gate 0.000% at 1447, 1024, 768, 390, 320 and 1447 dark (overlays reviewed: no ghosting). a11y faithful 0 serious/critical (color-contrast disabled per D-6). e2e faithful 15 passing. Build gate passes in Chromium and WebKit. Motion and visual gates not applicable until P2/P3.
Next: P2 pill and Pull back · rise.

### 2026-11-07 20:40 · P2 Pill and mode transition
Done: Pill (Dual chase border with @property, halo, entrance 800 ms + back.out(1.6), idle beats with ring, sweep and glyph turn, hover scale and magnetic, press, ripple, label crossfade, calm state after first click, static fallback, reduced motion, step-aside, mobile slide above the tab bar). ModeStage with both layers, lazy Brandon's Mode preloaded on idle and pill hover, Pull back · rise timeline in src/motion/modeTransition.ts with dim, parts stagger, landing-beat hooks, reduced-motion crossfade, cleanup, window.__rf.transition. Layer stack (closeAll at t = 0, step-aside). Minimal persisted ui store (theme, reduce motion) and theme sync with View Transitions reveal and fallback.
Gates: motion gate in 1613 ms / out 1731 ms at 1447, longest task 0 ms; seek at 650 ms outgoing 0.30, incoming 0.71; reduced crossfade under 500 ms. Frames at 300, 650, 1000, 1400, 2000 reviewed both directions, 1447 and 390. Pixel gate still 0.000% everywhere with the pill masked. e2e pill and transition specs pass. Build gate toggles the pill over file:// in Chromium and WebKit.
Next: P3 primitives, gallery, shell.

### 2026-11-07 23:30 · P3 Design system, primitives and shell
Done: every 05 primitive in src/paper/ui (Button, IconButton, Field/Input/Textarea, NumberField, CurrencyField, Select, Combobox, DateField with Calendar, TimeField, Switch, Checkbox, Radio, SegmentedControl, TagInput, Chip/FilterChip/RemovableChip, Badge, Avatar, StatusDot, ProgressBar, EmptyState, Divider, SectionLabel, DragHandle, Kbd, Tooltip host, Popover, BottomSheet, Menu, Sheet, Modal, Confirm host with a promise API, Toast host with undo and pause, Tabs, Table SortHeader, Pagination, SearchField). Dev-only gallery at #dev-gallery (excluded from the build). Shell: rail, sidebar with one sliding indicator and GSAP expand and collapse, lg icon rail with the Attendees flyout, top bar, drawer with swipe, bottom tabs, attendee sub-nav strip, view switch choreography, command palette (fuzzy, recents, pages, actions, attendees and codes groups, gated by intents views register), account popover, event switcher (switching wired), About sheet, sign-in screen with fade, Event editor and Logo editor (create event wired). Full store with all slices, undo tokens, persistence, version check and validation (exercised in P4).
Gates: verify green. a11y 0 serious/critical/moderate on all eight view shells both themes 1447 and 390, plus palette, account, confirm, drawer, About. e2e shell, theme, keyboard, pill step-aside. Visual catalog and primitives gallery captured and reviewed.
Next: P4 store and data tests (persistence, reset, version, fallback, create event).

## Notes for future sessions

Quirks, workarounds, non-obvious learnings. Keep each to one or two lines.

- Fonts: the fontsource woff2 is byte-identical to reference/faithful/fonts (checked with cmp). globals.scss references it as `@fontsource-variable/inter/files/...` and Vite inlines it.
- lucide-react 1.x names: Ellipsis, EllipsisVertical, TriangleAlert, CircleCheck, SquarePen exist (old aliases may not).
- Test project emulates a Windows UA (Desktop Chrome device): shortcuts accept Cmd or Ctrl (D-12); use ControlOrMeta in tests.
- Overlays: useOverlay in src/paper/ui/overlay; layers register in src/app/layerStack.ts. Focus return is deferred to a microtask (D-14).
- Contact sheets of captures: render an HTML grid via file:// (PIL is not installed).
- Scratch screenshot scripts live in the session scratchpad with a node_modules symlink to the repo; tests/helpers.ts `boot()` is the standard way to open the app in tests.
- Faker surnames replaced by a curated list (D-2). Re-run `npm run seed`; it fails loudly if any count drifts.

## Completion report

(written in P12, format in `21-delivery.md`)
