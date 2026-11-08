# 05 · Design system · "Paper"

Brandon's Mode's visual system. Chosen by the owner from `reference/prototypes/canvas-derby.html` option A. Warm off-white canvas, white raised surfaces, charcoal text, RainFocus grape and berry as the only accents. Dark theme is a warm charcoal, not black.

Everything here becomes CSS custom properties in `src/styles/tokens.scss`, scoped to `:root[data-theme="light"]` and `:root[data-theme="dark"]`, plus SCSS maps for the static scales (spacing, radius, type). Components read variables, never literals.

## Color tokens

Contrast was checked against WCAG 2.2 AA. Where a color is used both as a fill and as text, there are two tokens: the fill (`--x`) and the text-safe version (`--x-ink`). Use `-ink` for any text or icon-on-canvas; use the plain token for fills, dots and borders.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--canvas` | `#F6F3EE` | `#1B1A1F` | page background |
| `--side` | `#FBF9F6` | `#1F1E24` | rail and sidebar background |
| `--surface` | `#FFFFFF` | `#242229` | cards, sheets, modals, menus, table |
| `--surface-2` | `#FAF8F4` | `#2A2830` | nested surfaces, table header, hover rows |
| `--field` | `#EFEBE4` | `#2C2A32` | inputs, search, segmented control track, kbd |
| `--text` | `#26242B` | `#ECE9E4` | primary text |
| `--text-2` | `#4A4650` | `#C9C5CF` | secondary text, table cells |
| `--muted` | `#6F6A75` | `#9A96A3` | metadata, placeholders, inactive nav (AA on canvas and surface) |
| `--line` | `#E6E1D8` | `#312F37` | borders, dividers |
| `--line-hover` | `#CFC8BC` | `#4A4752` | border on hovered cards |
| `--accent` | `#5C00DC` | `#7A3BFF` | primary button fill, active indicator, progress, selection |
| `--accent-ink` | `#5C00DC` | `#B894FF` | accent text and icons on canvas or surface, links, focus ring |
| `--accent-soft` | `rgba(92, 0, 220, 0.08)` | `rgba(154, 102, 255, 0.14)` | active nav background, selected rows, hover on nav |
| `--on-accent` | `#FFFFFF` | `#FFFFFF` | text on `--accent` |
| `--berry` | `#E71356` | `#FF4D7D` | status dot, the chip's dot, berry fills |
| `--berry-ink` | `#B80F45` | `#FF7A9C` | berry text (the "days out" chip label) |
| `--berry-soft` | `rgba(231, 19, 86, 0.12)` | `rgba(255, 77, 125, 0.16)` | chip background |
| `--success` | `#177A4F` | `#4CC38A` | live, registered, confirmed |
| `--success-soft` | `rgba(23, 122, 79, 0.12)` | `rgba(76, 195, 138, 0.16)` | |
| `--warning` | `#8A5A0C` | `#E2B13C` | pending, draft with issues, expiring |
| `--warning-soft` | `rgba(138, 90, 12, 0.12)` | `rgba(226, 177, 60, 0.16)` | |
| `--danger` | `#B42332` | `#FF6B6B` | destructive actions, errors, cancelled |
| `--danger-soft` | `rgba(180, 35, 50, 0.10)` | `rgba(255, 107, 107, 0.14)` | |
| `--scrim` | `rgba(38, 36, 43, 0.40)` | `rgba(0, 0, 0, 0.55)` | behind sheets, modals, drawer |
| `--shadow-1` | `0 1px 2px rgba(40,30,20,.06), 0 6px 16px rgba(40,30,20,.05)` | `0 1px 2px rgba(0,0,0,.30), 0 8px 20px rgba(0,0,0,.25)` | resting cards |
| `--shadow-2` | `0 2px 4px rgba(40,30,20,.08), 0 14px 30px rgba(40,30,20,.10)` | `0 2px 4px rgba(0,0,0,.40), 0 18px 40px rgba(0,0,0,.45)` | hovered cards, popovers, menus |
| `--shadow-3` | `0 8px 16px rgba(40,30,20,.10), 0 32px 64px rgba(40,30,20,.18)` | `0 8px 16px rgba(0,0,0,.45), 0 40px 80px rgba(0,0,0,.60)` | sheets, modals, palette |
| `--glow-accent` | `0 8px 24px rgba(92, 0, 220, 0.22)` | `0 8px 28px rgba(122, 59, 255, 0.38)` | primary button, pill halo base |

Swatches (a palette users pick from for attendee types, tracks and monograms; 8 names, each with a light and dark value that pass 3:1 as a dot on surface): grape `#5C00DC/#9A66FF`, berry `#E71356/#FF4D7D`, amber `#D98A1F/#F0B254`, teal `#0F8C8C/#3FC1C1`, sky `#1F6FD4/#5FA3FF`, lime `#5B8E1E/#9AD14A`, plum `#8A2E8A/#C967C9`, slate `#5C6478/#9AA3B8`. Store the swatch name on the entity, not the hex.

Text on swatches: never put white text on a swatch fill. Wherever initials or letters sit on a swatch (avatars, exhibitor monogram tiles, event monogram logos), use the swatch's soft form as the fill (the swatch color at 16% over surface) and the swatch's ink form as the text: light ink values grape `#5C00DC`, berry `#B80F45`, amber `#8A5A0C`, teal `#0B6B6B`, sky `#1A57A8`, lime `#43701A`, plum `#6E2470`, slate `#4A5163`; dark ink values are the dark swatch values for amber, teal, sky, lime and slate, and lighter tints for the three that would fall short: grape `#C4A3FF`, plum `#E3A6E3`, berry `#FF9DB5`. All pass 4.5:1 on their soft fills in both themes; verify with axe.

## Typography

Inter variable, weights 300 to 700. `font-feature-settings: "cv11", "ss01"` off (Inter default). `-webkit-font-smoothing: antialiased`. Tabular numerals wherever numbers align (tables, prices, counts, times): `font-variant-numeric: tabular-nums`.

| Token | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|
| `display` | 32 / 1.15 | 300 | -0.01em | event title in the Guide header |
| `h1` | 24 / 1.2 | 600 | -0.01em | view titles |
| `h2` | 20 / 1.25 | 600 | -0.005em | module titles, sheet titles |
| `h3` | 16 / 1.3 | 600 | 0 | section titles inside sheets, modal titles |
| `title` | 14 / 1.4 | 600 | 0 | card titles, nav labels, table headers, menu items |
| `body` | 14 / 1.5 | 400 | 0 | paragraphs, form values |
| `body-sm` | 13 / 1.5 | 400 | 0 | descriptions, table cells, list secondary text |
| `caption` | 12 / 1.4 | 500 | 0 | metadata, help text, timestamps |
| `micro` | 11 / 1.2 | 600 | +0.02em | chips, badges, kbd, column counts |
| `mono` | 13 / 1.4 | 500 | 0 | reg codes (`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`) |

Mobile (< 600): `display` 26, `h1` 22, everything else unchanged. Minimum body text on mobile is 14; `caption` and `micro` stay for metadata only.

## Spacing

4 px base. Scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Expose as `--space-1` through `--space-10` and as an SCSS map. Use nothing in between. Component internal padding comes from this scale; page gutters are 48 (xl), 32 (lg), 24 (md), 16 (sm).

## Radius

| Token | Value | Use |
|---|---|---|
| `--r-xs` | 4 | checkboxes, small tags |
| `--r-sm` | 6 | inputs, buttons, kbd |
| `--r-md` | 8 | chips, menu items, table row highlights |
| `--r-nav` | 10 | nav items |
| `--r-lg` | 12 | cards, popovers |
| `--r-xl` | 16 | menus, command palette |
| `--r-2xl` | 18 | sheets, modals, the outgoing card during the mode transition |
| `--r-pill` | 999 | pills, avatars, switches |

## Layout

| Token | Value |
|---|---|
| `--rail-w` | 64 |
| `--sidebar-w` | 240 |
| `--topbar-h` | 56 (mobile) |
| `--tabbar-h` | `calc(64px + env(safe-area-inset-bottom))` (mobile) |
| `--content-max` | 1440 (body content centers beyond this) |
| `--sheet-w` | 480 (side sheets; 560 for the workflow editor and event editor) |
| `--modal-w` | 520 (confirmations 420) |
| `--palette-w` | 640 |
| Card grid | 3 columns at xl; 2 at lg; at md 2 when the container is 700 px or wider, else 1; 1 at sm. Gap 24 x 16 at xl, 16 x 16 at lg and md, 12 at sm |

## Elevation and surfaces

- Canvas is flat `--canvas`. Rail and sidebar are `--side` with a 1 px `--line` edge.
- Cards: `--surface`, 1 px `--line`, `--r-lg`, `--shadow-1`. Hover (if clickable): translateY(-3px), `--shadow-2`, border `--line-hover`. Motion in `06-motion.md`.
- Nested content inside a card (a table inside a card, a row inside a sheet section): `--surface-2`, no shadow.
- Popovers and menus: `--surface`, `--r-xl`, `--shadow-2`, 1 px `--line`.
- Sheets and modals: `--surface`, `--r-2xl`, `--shadow-3`, scrim behind.
- Dark theme never uses pure black and keeps shadows visible by making them deeper, not by adding borders everywhere. Borders in dark are lighter than the surface they sit on.

## Focus

`:focus-visible` on every interactive element: `outline: 2px solid var(--accent-ink); outline-offset: 2px; border-radius: inherit`. Inside the pill: white outline, offset 3. Never remove outlines without replacing them. Focus is never shown on mouse click (`:focus-visible` handles it).

## Icons

Lucide (`lucide-react`) everywhere in Brandon's Mode, through one wrapper `<Icon name size={18} />` that sets `strokeWidth={1.75}`, `aria-hidden` by default, and accepts `label` to make an icon meaningful. Sizes: 20 in the rail and empty states, 18 in nav, buttons and sheet headers, 16 in table rows, chips and menu items. Icon color inherits `currentColor`.

Mapping for the nav: Guide `Compass`, Attendees `Users`, Content `CalendarDays`, Exhibitors `Store`. Rail: the rf mark is the decoded SVG (not Lucide). Faithful mode never uses Lucide.

## Primitives (`src/paper/ui/`)

Every one of these is written here, styled with SCSS modules, with the states listed. "States" always includes default, hover, focus-visible, active (pressed), disabled; forms add error. Everything keyboard-operable.

| Primitive | Variants and sizes | Behavior notes |
|---|---|---|
| `Button` | primary, secondary (surface + line), ghost (no border), danger; `md` 36 px, `sm` 30 px; optional leading or trailing icon; `loading` (spinner replaces icon, label stays, width locked); `iconOnly` | Press scale 0.98. Loading disables clicks but keeps focus. |
| `IconButton` | ghost, subtle (field background), 36 and 30 | Requires `label` (aria-label) and shows it as a tooltip after 400 ms. |
| `Input`, `Textarea` | with `label`, `help`, `error`, optional `prefix` or `suffix` (text or icon), `size` md or sm | Label always visible above; placeholder is an example, never the label. Error replaces help text and tints the border `--danger`. |
| `NumberField`, `CurrencyField` | Input with stepper and formatting | Formats on blur with `Intl`. |
| `Select` | custom listbox (button + popover list) | Arrow keys, type-ahead, Escape, Enter; renders options with optional icon and description. |
| `Combobox` | input + filtered list | Used for "Assign exhibitor to booth" and type pickers in forms. |
| `DateField` | input + month grid popover | Keyboard grid navigation, today marker, min and max. One month visible; prev and next buttons. |
| `TimeField` | input with 15 minute steps | 12 hour display, stores 24 h. |
| `Switch` | 36 x 20, knob 16 | Knob slides 120 ms ease-out; label on either side. |
| `Checkbox`, `Radio` | 16 px | Custom drawn, indeterminate state on checkbox (bulk select). |
| `SegmentedControl` | 2 to 4 options, `md` and `sm` | Sliding thumb animates with Flip (240 ms). Used for Light/Dark/System, Grid/List, Cards/Map, %/$. |
| `Chip` | filter (toggle), removable (x), status (dot + label), count | Status chips use the `-soft` background and `-ink` text. |
| `Badge` | number or short text, neutral or accent | |
| `Avatar` | initials on a swatch derived from the name, 24 / 32 / 40 | Swatch from a hash of the name over the 8 swatches; soft fill with ink text (see "Text on swatches"). |
| `Tooltip` | dark surface (`--text` background, `--canvas` text), 7 placements with a small arrow | 400 ms show delay, 0 ms when moving between tooltips, hides on scroll and Escape. Never holds interactive content. |
| `Popover` | anchored, auto-flip to stay on screen, focus trapped, Escape and outside-click close | Used for event switcher, booth assignment, column filters. |
| `Menu` | items with icon, label, optional shortcut hint, optional description, dividers, danger items | Roving focus, type-ahead, submenu not needed. Opens from the trigger's corner; flips when near an edge. |
| `Sheet` | side (right, `--sheet-w`) on desktop; bottom, full height on mobile; header with title, optional subtitle and close; scrollable body; sticky footer for actions | Focus trapped, Escape closes, return focus to trigger, unsaved-changes guard when `dirty`. |
| `Modal` | centered, `--modal-w`; `Confirm` preset (title, body, cancel, confirm with danger option) | Same focus rules. Confirm's primary action is focused on open unless it is destructive, then Cancel is. |
| `Toast` | neutral, success, danger; optional action (Undo); optional progress bar for timed undo | Host at bottom left of the body on desktop, above the tab bar on mobile (positions in `07-shell.md`). Max 3 visible, newest at the bottom. `aria-live="polite"`. Pause timer on hover and focus. |
| `Tabs` | underline style with sliding indicator | Arrow keys move, Home and End. |
| `Table` | sticky header, sortable columns (icon shows direction), row hover, row selection, column widths from the view spec, truncation with tooltip on the full value | Keyboard: rows are focusable when they open something; Enter opens; Space toggles selection. Renders as `<table>` at xl and lg; at md and sm each view renders its own card-list component instead, not a CSS hack. |
| `Pagination` | prev, next, page numbers with ellipsis, page size select (25, 50, 100) | |
| `EmptyState` | icon in a `--field` circle, title, one line of body, one primary action, optional secondary link | Height fills the list area it replaces. |
| `ProgressBar` | 6 px track `--field`, fill gradient grape to berry, animated width | Used in the Guide header and for capacities (solid `--accent` fill for capacities; the gradient is only for the Guide). |
| `Kbd` | 11 px, `--field`, 1 px `--line`, `--r-sm` | Renders symbols: ⌘ on Mac, Ctrl on others (detect via `navigator.platform` or `userAgentData`). |
| `DragHandle` | 6-dot grip, 24 x 24, `cursor: grab` | Keyboard sortable via dnd-kit's keyboard sensor; the handle is the focusable element and announces instructions. |
| `StatusDot` | 8 px dot with optional label | Colors from semantic tokens. |
| `SearchField` | Input with search icon, clear button, `⌘K` kbd hint when it opens the palette | |
| `Divider` | 1 px `--line`, optional label | |
| `VisuallyHidden` | | For screen reader text. |

## Component anatomy rules

- Every primitive accepts `className` for layout only (margins, grid placement), never for restyling internals.
- Sizes and spacing from tokens. Icons optically centered (Lucide icons often need `margin-top: -1px` next to 13 to 14 px text; check and align).
- Disabled: 50% opacity on the whole control, `cursor: not-allowed`, not focusable. A disabled control that needs explaining is wrapped in a focusable span that carries the tooltip, so keyboard users can read the reason.
- Truncation: single-line truncation with ellipsis and a tooltip showing the full value on hover and focus. Never clip text silently.
- Loading: controls show their own spinner; views never show skeletons (data is local). The only "loading" the user sees is a button's spinner during a simulated 300 to 600 ms save, which exists purely to make the success morph legible (see `06-motion.md`).

## Writing copy in components

- Sentence case: "Add attendee", "Save changes", "Attendee types".
- Buttons are verbs. Titles are nouns. Help text is one short sentence without a period if it is a fragment, with a period if it is a sentence.
- Counts: "1 attendee", "24 attendees", "No attendees yet".
- Dates: "Dec 15, 2026" and "Dec 15" when the year is obvious; times "9:00 AM"; ranges "9:00 to 9:45 AM"; relative "38 days out", "Today", "Ended".
- Currency: `Intl.NumberFormat(locale, { style: 'currency', currency })`, no trailing ".00" when whole (`minimumFractionDigits: 0` if integer).
- Interpunct (·) separates inline metadata: "Lehi, Utah · Dec 15". Never an em dash.
