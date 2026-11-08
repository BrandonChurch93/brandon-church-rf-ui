# 17 · Responsive

One codebase, shared state and tokens, with a few purpose-built mobile components where a desktop pattern does not translate (tables, the command palette, side sheets, drag handles). Decided with the owner: not two separate apps, and not a squeeze.

## Breakpoints

| Name | Range | Query |
|---|---|---|
| xl | ≥ 1200 | default styles |
| lg | 900 to 1199 | `@media (max-width: 1199px)` |
| md | 600 to 899 | `@media (max-width: 899px)` |
| sm | 320 to 599 | `@media (max-width: 599px)` |

Mixins in `styles/mixins.scss`: `@include lg { }`, `@include md { }`, `@include sm { }` (max-width based, cascading down). `useMediaQuery` exposes `isLg`, `isMd`, `isSm` with the same thresholds for behavior switches (table vs cards, side vs bottom sheet).

Test widths: 1920, 1447, 1200, 1199, 1024, 900, 899, 768, 600, 599, 414, 390, 375, 320. Landscape phone: 844 x 390.

## Shell by breakpoint
See `07-shell.md`: xl full; lg icon rail with flyouts; md and sm top bar, drawer, bottom tabs.

Safe areas: `--tabbar-h` is `calc(64px + env(safe-area-inset-bottom))`; the pill's bottom offset includes it; sheets' footers include it. `viewport-fit=cover` is set in the meta tag.

## Primitive behavior by breakpoint

| Primitive | xl and lg | md and sm |
|---|---|---|
| Sheet | side, right, `--sheet-w` | bottom, full height minus 24 px top inset, rounded top corners `--r-2xl`, drag handle bar at the top (visual only plus swipe down to close) |
| Modal | centered | centered, width 100% minus 32; Confirm stays centered |
| Menu | popover | bottom sheet with the same items, 52 px rows |
| Popover (filters, event switcher, booth assign) | anchored | bottom sheet |
| Tooltip | hover and focus | no hover on touch; tooltips show on focus and on long-press (500 ms) for icon-only buttons; everything a tooltip explains must also be reachable another way (e.g., the label is visible) |
| Table | table | the view's card list component |
| Pagination | page controls | "Load 25 more" |
| Command palette | centered dialog | full-screen sheet |
| Toasts | bottom left, 360 wide | full width minus 32, above the tab bar |
| DragHandle | visible on hover and focus | always visible |
| DateField and TimeField | popover | bottom sheet with the same grid |

## Views by breakpoint

| View | lg | md | sm |
|---|---|---|---|
| Guide | grids 2-up; Step 1 panel keeps 3 columns while the panel is 840 px or wider, otherwise 2 columns with the third item spanning both | hero: logo 72, button full-width row; grids 2-up at ≥ 700 else 1; Step 1 panel 1 column (rows divided by `--line`) | everything 1 column |
| Attendees | table with the Company column hidden (the Name cell keeps the email line; company is visible in the detail sheet) | card list, filters sheet, selection mode | same |
| Attendee types | same list | same; editor fields stack | same |
| Packages | 2-up | 2-up at ≥ 700 else 1 | 1 |
| Reg codes | table with Expires hidden (shown in the row's second line) | card list | same |
| Discounts | rows | rows stack to two lines | same |
| Content | grid with horizontal scroll if tracks overflow; day tabs | list only; the Grid · List control hides | same |
| Exhibitors | 2-up; map scales | 2-up at ≥ 700 else 1; map scrolls horizontally at min 720 px | 1; same map |

## Touch rules

- Minimum target 44 x 44 for every control on md and sm (use padding or pseudo-element hit areas; the visual can stay smaller).
- No hover-only information. Anything revealed on hover (card actions, row kebabs, drag handles) is always visible or reachable by tap on touch devices (`@media (hover: none)`).
- Swipe to close bottom sheets and the drawer (threshold 80 px or velocity). Swipe-to-delete is not used (undo through explicit actions is enough).
- Long-press enters selection mode in lists that support bulk actions; a "Select" button also exists so the feature is discoverable.
- Drag and drop on touch: dnd-kit's `TouchSensor` with a 200 ms delay and 6 px tolerance so scrolling still works; the handle is the only drag start area.

## Typography and spacing shifts

- sm: `display` 26, `h1` 22, body stays 14, `caption` 12, `micro` 11. Page gutters 16, card padding 16, grid gaps 12.
- md: gutters 24, card padding 20, grid gaps 16.
- lg: gutters 32.

## Things that must be true at every width

- No horizontal page scroll (only designated inner scrollers: the agenda grid, the floor map card, segmented strips, and the Attendees and Reg codes table cards at lg when their columns exceed the card width).
- The pill never covers a primary action: on mobile the bottom tab bar is under it and the body gets `padding-bottom: calc(var(--tabbar-h) + 72px)` so the last card is reachable above the pill.
- Sheets never exceed the viewport; their bodies scroll.
- Text never overflows its container; truncation with tooltips where single-line, wrapping where multi-line.
- Images and SVGs scale with their containers; the event logo keeps its aspect ratio.
- Focus order follows visual order after reflow.

## Faithful mode

Faithful mode has its own responsive rules in `04-faithful-mode.md` and shares only the breakpoint values.
