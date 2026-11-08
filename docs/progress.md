# Progress log

The Builder's memory across sessions and compactions. Newest entries at the bottom of each section. Keep it factual and dated. Re-read this file at the start of every session.

## Phase checklist

```
[x] P0 Scaffold
[x] P1 Faithful mode
[x] P2 Pill and mode transition
[x] P3 Design system, primitives and shell
[x] P4 Store and data
[x] P5 Guide view
[x] P6 Attendees view
[x] P7 Attendee types, Packages, Reg codes, Discounts
[x] P8 Content view
[x] P9 Exhibitors view
[ ] P10 Mobile pass
[ ] P11 Polish pass
[ ] P12 Delivery
```

## Current phase

P10 · Mobile pass.

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

### 2026-11-07 23:55 · P4 Store and data
Done: store proven end to end: persistence across reload (mode never persisted), reset with confirm and toast, version mismatch reseeds with "Demo data was updated", invalid records restored from seed with a console warning, storage failure runs in memory with a one-time toast, create event with the 16 defaults (monogram on the next free swatch, one type, one track, 24 booths) and the switch to it, unsaved-changes guard on the event editor (Cancel, Escape, scrim, close). window.__rf.resetData wired. Overlay focus now inherits the trigger of a layer that opened it (menu item to confirm).
Gates: verify green; e2e 56 in Chromium plus WebKit smoke.
Next: P5 Guide view.

### 2026-11-08 01:40 · P5 Guide view
Done: hero (logo editor with upload, zoom, pan, reset, 512 px PNG; inline rename with validation and flash; status chip from calendar dates in the event timezone; Edit event), intro with summary, Attendee module accordion (GSAP height, persisted per event) with gradient progress, Step 1 settings panel (container-query layout) and the General, Attendee attributes (sortable, undo, locked pair) and Communications sheets with the draw-and-pop check, Step 2 gate with tooltip and unlock rise, sortable workflow cards (pointer, touch, keyboard, announcements) with hover actions, rename, duplicate, remove with confirm and undo, Show all, template picker and workflow editor (Live rules, sortable steps, add step popover), Step 3 portal and calendar previews from live data. Landing beats registered with the transition. Shared: InlineEdit, SortableList, DisabledReason, card styles.
Gates: verify green. guide.spec 18 tests stable (x2). Motion longest task 81 ms (under 100). a11y clean incl. sheets, picker, editor, portal both themes. Build gate checks the Guide heading, dark theme and persistence over file://.
Next: P6 Attendees.

### 2026-11-08 03:10 · P6 Attendees view
Done: table (sortable columns with aria-sort, selection with indeterminate header, keyboard row focus, Cmd or Ctrl+A, row hover kebab with View, Change type popover, Resend, Cancel or Reinstate, Remove), toolbar (debounced search, Type, Status and Package filter chips with counts, Clear filters, live count), pagination with page size, bulk bar (change type and status with undo, select all, export selected, remove with confirm and undo at original positions), detail sheet (inline name, explicit Edit with validation, activity timeline), add sheet (duplicate email with View link, flash, sorted insert), CSV export (named file, toast), empty states, mobile card list with Load more, filters bottom sheet with sort and live count, long-press and Select mode with the pill stepping aside. Palette Attendees group live.
Gates: verify green. attendees.spec 16 tests stable (x2). a11y clean incl. detail, edit, bulk, confirm. CSV download verified over file://.
Next: P7.

### 2026-11-08 05:00 · P7 Attendee types, Packages, Reg codes, Discounts
Done: Attendee types (sortable, inline editor with swatch radio group, default with Flip chip, duplicate, remove unused with undo, remove in use through the reassign modal moving attendees, workflows, package limits and access codes, undo restores everything). Packages (card grid with sold bars and warning or danger, includes chips with "+N more" tooltip, Active and Archived filter, editor with CurrencyField, NumberField, TagInput and type checklist, archive and unarchive with undo, remove blocked when sold). Reg codes (table and mobile cards, copy with check morph, derived status, switch rules with reasons, generate and edit sheet with regenerate and validation, bulk generate with streamed rows and one undo, remove nulls attendee links with activity, missing-discount warning). Discounts (sentence rows, windows, scheduled chip, ended rules, editor with integer minor-unit preview, fixed-amount bound, remove warns about codes).
Gates: verify green. Specs: attendee-types 8, packages 6, reg-codes 7, discounts 6, all stable (x2). a11y clean on all four editors and the bulk modal, both themes.
Next: P8 Content.

### 2026-11-08 06:30 · P8 Content view
Done: agenda grid (sticky track headers and hour gutter, 15-minute geometry, blocks with title, time and speaker by height, hover lift, now line, empty-column note and "Add session here" on free slots), pointer and touch drag with ghost and target highlight, overlap and agenda-end refusal with the named toast, keyboard move mode with announcements, undoable moves, list view grouped by hour, day tabs (Horizon has two days), track filter chips with the all-hidden banner, mobile list-only with a Tracks sheet, session sheet (inline title, track, date, start, duration, speaker with avatar preview, description, capacity, room, tags, overlap validation naming the session, remove with undo), Manage tracks modal (sortable, swatch picker, rename, add, guarded remove). Portal and calendar previews read live sessions.
Gates: verify green; content.spec 11 stable (x2); a11y clean on grid, list, session sheet, tracks. Gate scripts now clear their report files first.
Next: P9 Exhibitors.

### 2026-11-08 08:10 · P9 Exhibitors view
Done: card grid sorted by tier then name (monogram tile in the tier swatch, tier chip, status dot with tooltip, booth or Assign link, contact, hover Email copy and kebab with Edit, Assign or Change booth, Mark confirmed or pending, Remove), Tier, Status and Booth filters with search over name and contact and a live count, empty and filter-miss states. Floor map SVG (24 booths, aisle, hall outline, entrance arch, legend, caption, tier fill and stroke, status dot, monogram and clipped name, dashed empty booths with +), hover thickening with the shared HTML tooltip, filters dim non-matching booths, keyboard reading order with an SVG focus ring, assign popover (bottom sheet on mobile) with fill and monogram animation and an undo toast, "Add a new exhibitor here". Detail sheet (inline name with uniqueness, explicit Edit for details and contact, booth select disabling occupied booths with the occupant, Copy email, staff list with link and unlink and undo, remove with confirm that frees the booth and unlinks staff, undo). Add sheet with validation and a free-booth select. Palette intent. Mobile map scrolls inside its card at 720 with a fade hint that hides at the end.
Shared fix: overlays whose content autofocuses now return focus to the real trigger (D-23).
Gates: verify green; exhibitors.spec 11 stable (x2); a11y clean on map, assign, detail, edit and add errors in both themes. The mobile audit skips controls straddling the tab bar edge (D-24).
Next: P10 Mobile pass.

## Notes for future sessions

Quirks, workarounds, non-obvious learnings. Keep each to one or two lines.

- Fonts: the fontsource woff2 is byte-identical to reference/faithful/fonts (checked with cmp). globals.scss references it as `@fontsource-variable/inter/files/...` and Vite inlines it.
- lucide-react 1.x names: Ellipsis, EllipsisVertical, TriangleAlert, CircleCheck, SquarePen exist (old aliases may not).
- Test project emulates a Windows UA (Desktop Chrome device): shortcuts accept Cmd or Ctrl (D-12); use ControlOrMeta in tests.
- Overlays: useOverlay in src/paper/ui/overlay; layers register in src/app/layerStack.ts. Focus return is deferred to a microtask (D-14).
- dnd-kit's KeyboardSensor double-counts when its container scrolls; the agenda uses its own keyboard mode (D-20). Sortable lists still use dnd-kit keyboard (they do not scroll inside a container).
- Contact sheets of captures: render an HTML grid via file:// (PIL is not installed).
- Scratch screenshot scripts live in the session scratchpad with a node_modules symlink to the repo; tests/helpers.ts `boot()` is the standard way to open the app in tests.
- The a11y gate measures at a fixed scroll position; controls under the mobile tab bar are excluded by marking them `data-axe-under-chrome` (tab bar has `data-tabbar`).
- Never run `npm run build` while a Playwright run is in progress: the preview server serves build/ live and tests fail mid-run.
- Faker surnames replaced by a curated list (D-2). Re-run `npm run seed`; it fails loudly if any count drifts.

## Completion report

(written in P12, format in `21-delivery.md`)
