# 04 · Faithful mode

The graded deliverable. A pixel-exact recreation of the Figma frame "RainFocus UI Challenge- Updated" (1447 x 1024), responsive down to 320 px, static, hand-rolled SCSS, zero libraries.

## Source of truth

`reference/faithful/index.html` + `styles.scss` is a finished, verified recreation. It was built from the decoded .fig node data (every position, size, padding, gap, color and type value), then overlaid on the owner's Figma screenshot until the two matched (`reference/figma/overlay-figma-vs-recreation.png`; residual difference is only glyph rasterization). Your job in Phase 1 is to port it into React + SCSS modules without changing a single rendered pixel at 1447, and to keep its responsive behavior.

Port, do not reinterpret. If the reference and this document ever disagree, the reference wins and you log it.

## Fonts

Inter only. The Figma file's components reference Open Sans in places, but every text node on the design page resolves to Inter through text styles, and the render confirms it. Use the single `@font-face` described in `03-architecture.md`, pointing at the fontsource `inter-latin-wght-normal.woff2`, which is byte-identical to `reference/faithful/fonts/inter-latin-wght-normal.woff2`. Weights used: 300, 400, 500, 600, 700. Line height "normal" below means the font's natural line height (Inter: about 1.21), which is what Figma's "100%" auto line height produced in this file.

## Tokens (`src/styles/faithful-tokens.scss`)

These are the Figma values. Names are the ones RainFocus uses in their library where known.

| Token | Value | Figma name / use |
|---|---|---|
| `$rf-grape` | `#5C00DC` | Brand/Secondary Grape · primary button, active nav, card icons |
| `$rf-berry` | `#E71356` | Brand/Primary Berry · Person Portal icon, rf mark |
| `$rf-grape-3` | `#AB99FF` | Complimentary/Grape 3 · Person Portal icon |
| `$rf-text-header` | `#222222` | Text/G1 Header · titles |
| `$rf-text-body` | `#393551` | body and description text |
| `$rf-text-g3` | `#444444` | Text/G3 · step labels, avatar, plus icon |
| `$rf-text-muted` | `#777777` | inactive nav, search placeholder |
| `$rf-border` | `#CBC6DE` | all 1 px borders on this page |
| `$rf-search-bg` | `#F5F5F5` | search field |
| `$rf-white` | `#FFFFFF` | canvas, cards |
| `$rf-black` | `#000000` | sidebar header text |
| `$rf-active-tint` | `rgba(92, 0, 220, 0.08)` | active nav background (Grape at 8%) |
| `$rf-font` | `'Inter', system-ui, -apple-system, sans-serif` | |
| `$rf-radius-sm` | `4px` | cards, search, button, badge |
| `$rf-radius-md` | `8px` | nav items, rail items, event logo |
| `$rf-rail-width` | `63px` | |
| `$rf-sidebar-width` | `215px` | |

## Layout at 1447 x 1024

All strokes in Figma are drawn inside the padding. In CSS a 1 px border therefore replaces 1 px of padding (Figma padding 24 becomes CSS `padding: 23px` + `border: 1px`). The reference already does this; keep it.

### Frame
White, 1447 x 1024, horizontal flex: rail 63, sidebar 215, body fills the rest (1169).

### Rail (63 px)
- Borders: left and right 1 px `$rf-border`.
- Padding: 12 px top and bottom, 6.5 px horizontal + the borders (Figma 7.5). Content width 48.
- Vertical flex, `justify-content: space-between`.
- Top group:
  - **Nav Logo** 48 x 64, radius 8, padding 8 top, 12 left, 24 bottom, 0 right. Contains the rf mark (`icons/rf-logo.svg`) at 32 x 32.
  - **Nav Org** 48 x 44, radius 8, white, padding 4 8 8 8. Contains the event badge image (`images/event-logo-178.png`) at 32 x 32, radius 4, `object-fit: cover`.
- Bottom group:
  - **Nav User** 48 x 40, radius 8, white, padding 4 8 4 8. Contains a 32 px circle `$rf-text-g3` with "FL" in Inter 400 16/18.2 px white, centered.

### Sidebar (215 px)
- Border right 1 px `$rf-border`.
- Padding 12 px top and bottom, 8 px left, 7 px right + border.
- **Header**: padding 8 8 12 8. "RainFocus Summit" Inter 600 14 px / 18.2 px, `$rf-black`.
- **Details**: padding 0 8 12 8, horizontal. "Lehi, UT" Inter 500 10 / 18.2 `$rf-black`; a 15 px wide centered bullet "•"; "December 15th" same style.
- **Search**: padding 0 8 12 8. Field 100% x 24, `$rf-search-bg`, radius 4, padding 4, gap 4, horizontal, items centered: search icon 16 x 16 (`icons/search.svg`, #444444 fill), "Search" Inter 600 10 / 10 `$rf-text-muted`.
- **Mega nav** (100% width, which is 199 px):
  - Item: height 40, padding 8 12, gap 12, radius 8, white background. Icon: 24 px circle (radius 15 in Figma, renders round) `$rf-text-muted`. Label Inter 600 14 / 18.2 `$rf-text-muted`.
  - Active item (Attendees): background `$rf-active-tint`, icon and label `$rf-grape`.
  - Sub-list under Attendees: padding 4 top, 48 left, 12 bottom, 12 right. Five items: Attendees, Attendee types, Packages, Reg codes, Discounts. Each 30 px tall, padding 8 0, Inter 600 14 / 14 `$rf-text-muted`.
  - Order: Guide, Attendees (+ sub-list), Content, Exhibitors. No gaps between groups beyond their own heights (Guide at y 0, Attendees at 40, Content at 246, Exhibitors at 286 inside the nav).

### Body (1169 px)
- Padding 40 px top and bottom, 48 px left and right. Vertical flex, gap 40.
- **Event header**: horizontal, gap 16, align start.
  - Logo 95 x 95, radius 8, `images/event-logo.png` (the square crop; see Assets), `object-fit: cover`.
  - Title block grows, vertical gap 8: "RainFocus Summit" Inter 300 32 px / normal `$rf-text-header`; then two lines "December 15th" and "Lehi, Utah" Inter 400 16 / 24 `$rf-text-body`, no gap between them.
  - "Edit event" button: Inter 700 14 / normal white on `$rf-grape`, padding 8 16, radius 4, no border. Renders 101 x 33.
- **Section 1**: vertical gap 16. "Event setup guide" Inter 600 24 / normal `$rf-text-header`. Description Inter 400 16 / 24 `$rf-text-body`: "See the available list of modules below. We suggest that you start with the attendee module."
- **Module "Attendee"**: border top 1 px `$rf-border`, padding top 24, vertical gap 24.
  - Header: horizontal, gap 24, center aligned. Person Portal icon 35 x 35 (`icons/person-portal.svg`). "Attendee" Inter 600 20 / normal `$rf-text-header`.
  - **Step** (three of them): vertical gap 8. Label Inter 400 14 / normal `$rf-text-g3` with the "Step N:" prefix in Inter 700. Texts: "Step 1: Base settings." "Step 2: Build registration workflows." "Step 3: Design post-registration experiences."
  - **Step 1 row**: height 120, white, border 1 px `$rf-border`, radius 4, padding 15 23 (+ border = 16 24), horizontal, gap 32, align start. Three items, each 221 wide, padding 8, radius 4, vertical gap 4: title Inter 700 13 / 16 `$rf-text-header`; description Inter 400 12 / normal `$rf-text-body`. Texts: "General" / "Define Attendee types & attributes"; "Title" / "Description that explains the value goes here. Description that explains the value goes here. " (twice, exactly as in the design, trailing space included in the source but irrelevant to rendering).
  - **Step 2 grid**: 3 columns `repeat(3, minmax(0, 1fr))`, column gap 24, row gap 16. Cards 120 tall, white, border 1 px `$rf-border`, radius 4, padding 23 31 (+ border = 24 32), vertical gap 4. Header row 24 tall, horizontal gap 8, center aligned: logic-arrow icon 24 x 24 in `$rf-grape` (`icons/logic-arrow-primary.svg`), title Inter 700 13 / normal `$rf-text-header` "Attendee Registration". Description Inter 400 12 / normal `$rf-text-body`, width 267 px (max 100%), "Start by creating a general registration workflow" (wraps to two lines). Row 1: three identical cards. Row 2: the Add card, then two invisible filler cells (same size, no border, no background) that hold the grid.
    - **Add card**: same box; content centered vertically and horizontally: add-circle-outline icon 24 x 24 in `$rf-text-g3` (`icons/add-circle-outline.svg`) above "Add Registration Workflow" Inter 400 12 / normal `$rf-text-header`, centered.
  - **Step 3 grid**: same grid; one card with the computer icon in `$rf-grape` (`icons/computer-primary.svg`), title "Attendee Portal", description "Manage the portal that attendees will see after they’ve register for your event." (typo in "register" is in the design; keep it; curly apostrophe).

Vertical positions that result (for checking): header at y 40, section 1 at 175, module border at 284, Attendee header at 308, Step 1 label at 367, Step 1 row at 392, Step 2 label at 536, Step 2 row 1 at 561, row 2 at 697, Step 3 label at 841, Step 3 card at 866, page content ends at 986.

## Assets (`src/assets/`)

Copy from `reference/faithful/`:

- `icons/rf-logo.svg` (24 x 24 viewBox, berry), `search.svg`, `person-portal.svg` (35 x 35, three colors), `logic-arrow-primary.svg` (grape), `computer-primary.svg` (grape), `add-circle-outline.svg` (#444444), `check.svg` (#444444, used only in Brandon's Mode).
- `images/event-logo.png` 380 x 380: the exact square crop Figma applies to the 1820 x 1214 original (crop rect x 472, y 170, 875 x 875, resampled to 380). Use this for the 95 px header logo.
- `images/event-logo-178.png`: the 178 px square badge Figma uses for the rail.
- `images/event-logo-1820.png`: the original, for Brandon's Mode's logo upload default and the About panel.

Do not recolor icons with CSS filters in faithful mode; use the pre-colored files.

## Responsive behavior

The reference implements this; port it exactly. Breakpoints shared with Brandon's Mode (`03-architecture.md`).

- **1200 px and up**: the design as-is. The body is fluid; the grids stretch. (The reference's media queries use `max-width: 1199px`, `899px` and `599px`, matching the shared breakpoints exactly.)
- **900 to 1199**: Step 2 and 3 grids become 2 columns; the two filler cells are hidden; the Step 1 row wraps to 2 items per line with `gap: 16px 32px` and auto height.
- **600 to 899**: the rail and sidebar leave the flow and become a left drawer (`transform: translateX(-100%)`, 250 ms ease), opened by a menu button in a sticky 56 px top bar (rf mark 28 px, event badge 28 px radius 4, "RainFocus Summit" Inter 600 14 / 18.2 black, hamburger 40 x 40 at right). Opening uses a hidden checkbox and `:checked` sibling selectors in the reference (no JavaScript); in React use state, and keep the drawer accessible: the menu button is a `<button aria-expanded>`, the scrim closes it, Escape closes it, focus moves into the drawer and returns to the button, and the closed drawer carries the `inert` attribute so its links are not tabbable off screen. Body padding-bottom is 88 px at this and the next breakpoint (the reference includes this) so the pill never covers the last card when the grid is a single column. A scrim at `rgba(34, 34, 34, 0.4)` (`$rf-text-header` at 40%) fades in behind the drawer. Body padding 24 (bottom 88), gap 32. Event header wraps: logo 72 px, button full width on its own line, title 28 px.
- **320 to 599**: body padding 16 (bottom 88), gap 24. Grids single column, cards `height: auto; min-height: 120px`, description width auto. Step 1 row becomes a vertical stack with gap 8 and padding 7 (+ border). Logo 64 px, title 24 px, details 14 / 20, section title 20, description 14 / 20, module header gap 16, module title 18.

No horizontal scrolling at any width from 320 up. Verify at 320, 375, 390, 414, 600, 768, 900, 1024, 1200, 1447, 1920.

## The pill in faithful mode

The pill is not part of `FaithfulPage`; `ModeStage` renders it over both modes. In faithful mode it sits at `right: 28px; bottom: 28px` on desktop, `right: 16px; bottom: 16px` below 900 px. At 900 px and up the design's bottom right is empty (the Step 3 card occupies the left third or half), so the pill covers nothing; below 900 the body's 88 px bottom padding keeps the last card clear of it. Everything about the pill is in `06-motion.md`.

## Interactivity in faithful mode

None, by design. Links are anchors with `href="#"` that prevent default and do nothing; buttons do nothing. No hover states beyond the browser default cursor on the button and links (match the reference: no color change on hover). The only interactive pieces are the mobile drawer and the pill. Do not add tooltips, hover lifts or focus effects beyond a visible focus ring for keyboard users (the reference has none; add a minimal 2 px `$rf-grape` outline on `:focus-visible` so keyboard users are not lost; this is the one permitted addition and it does not affect the pixel gate because nothing is focused in the gate).

## Pixel gate

Defined fully in `19-testing.md`. Summary: render the app in faithful mode (reduced motion on, so the pill is static) and `reference/faithful/index.html` in the same Chromium at 1447 x 1024, mask the pill's bounding box expanded by 48 px, and require a pixelmatch mismatch below 1.0% of pixels. Also compare at 1024, 768, 390 and 320 at the reference's full scroll height as the viewport height, under 2.0%, and once more at 1447 with `data-theme="dark"` set, which must change nothing. Then open the overlay PNG the gate writes and look at it yourself; the numbers catch drift, your eyes catch everything else.

Why these thresholds: the reference and the app use the identical Inter woff2, so the only legitimate differences are sub-pixel text rasterization. Anything above these numbers is a layout mistake.

## Legibility for the live interview

A reviewer will ask the owner to change things live. Make sure:

- Every color, size, radius and width in faithful mode is a named token in `faithful-tokens.scss`, used by name in `faithful.module.scss`.
- The SCSS is organized top to bottom in page order (rail, sidebar, body, header, section, module, steps, cards, responsive) with one comment line per block.
- Class names describe the thing (`.rail`, `.sidebar`, `.eventHeader`, `.stepRow`, `.card`), not its style.
