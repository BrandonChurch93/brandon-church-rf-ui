# Progress log

The Builder's memory across sessions and compactions. Newest entries at the bottom of each section. Keep it factual and dated. Re-read this file at the start of every session.

## Phase checklist

```
[x] P0 Scaffold
[x] P1 Faithful mode
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

## Current phase

P2 · Pill and mode transition.

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

## Notes for future sessions

Quirks, workarounds, non-obvious learnings. Keep each to one or two lines.

- Fonts: the fontsource woff2 is byte-identical to reference/faithful/fonts (checked with cmp). globals.scss references it as `@fontsource-variable/inter/files/...` and Vite inlines it.
- lucide-react 1.x names: Ellipsis, EllipsisVertical, TriangleAlert, CircleCheck, SquarePen exist (old aliases may not).
- Scratch screenshot scripts live in the session scratchpad with a node_modules symlink to the repo; tests/helpers.ts `boot()` is the standard way to open the app in tests.
- Faker surnames replaced by a curated list (D-2). Re-run `npm run seed`; it fails loudly if any count drifts.

## Completion report

(written in P12, format in `21-delivery.md`)
