# 07 · The shell (Brandon's Mode)

Everything that is not a view: navigation chrome, global menus, the command palette, toasts, the about panel and the sign-in screen. The shell is the same across all eight views.

## Desktop layout (xl, 1200 px and up)

```
| rail 64 | sidebar 240 | body (fluid, content max 1440 centered) |
```

Full height, three columns. Rail and sidebar are `--side` with a 1 px `--line` right edge each. Body is `--canvas`, scrolls independently; rail and sidebar do not scroll with it (sidebar scrolls internally only if its content exceeds the height, which it does not with the seeded nav).

Body padding 40 top and bottom, 48 left and right. Inside: a view header, then the view's content.

### Rail (64 px)
Vertical, `justify-content: space-between`, padding 12 top and bottom.

Top:
- **rf mark** 44 x 44 hit area, the decoded `rf-logo.svg` at 28 px centered. Click opens the About panel (`#about` is not a route; it is a sheet). Tooltip "About this build". Hover: background `--accent-soft` (icon button rules).
- **Event badge** 44 x 44 hit area, the active event's logo at 32 px, radius `--r-md`, `--shadow-1`. Click opens the Event switcher popover anchored to it. Tooltip shows the event name. Hover: lift 1 px, `--shadow-2`.

Bottom:
- **Avatar** 44 x 44 hit area, 32 px avatar with initials "FL". The signed-in user's avatar is the one deliberate exception to the Avatar primitive's swatch rule: it uses `--accent` fill with `--on-accent` text (both themes pass 4.5:1) and `--glow-accent` at half strength, so the owner's own mark reads as the brand accent. The same treatment is used wherever the signed-in user appears (account menu header, top bar). Click opens the Account menu anchored to it. Tooltip "Account".

### Sidebar (240 px)
Padding 16 12.

- **Event block**: event name (`title`, `--text`), below it "Lehi, Utah · Dec 15" (`caption`, `--muted`), each truncating with tooltip. The block is a button that opens the Event switcher (same as the rail badge), with a small chevrons-up-down icon at the right that appears on hover.
- **Search field** (margin 12 0 16): `SearchField` primitive, read-only, `⌘K` kbd at the right, placeholder "Search". Click or focus opens the Command palette. Height 36.
- **Mega nav**: four groups in order.
  - Guide (`Compass`) → `#guide`
  - Attendees (`Users`) → `#attendees`, expandable, with sub-items: Attendees `#attendees`, Attendee types `#attendee-types`, Packages `#packages`, Reg codes `#reg-codes`, Discounts `#discounts`
  - Content (`CalendarDays`) → `#content`
  - Exhibitors (`Store`) → `#exhibitors`
  - Item: 40 px tall, padding 0 12, gap 12, `--r-nav`, icon 18, label `title`, color `--muted`. Hover: background `--accent-soft`, color `--text`. Active (its route or a child route is current): background `--accent-soft`, color `--accent-ink`, a 3 px `--accent` indicator bar at the left edge (top and bottom inset 10), radius 3. The indicator is one element that Flips between items (320 ms ease-out), not one per item.
  - The Attendees group has a chevron at the right (rotates 90° when expanded, 240 ms). Clicking the Attendees label navigates to `#attendees` and expands; clicking the chevron only toggles. Expanded state persists in the store (`ui.sidebarGroups`). When a child route is active the group is forced open.
  - Sub-items: 32 px tall, padding 0 12 0 42, `body-sm` 500, `--muted`; hover: `--text` and `--surface-2`; active: `--accent-ink` 600, no background, a 4 px dot at x 30 (vertically centered) in `--accent`.
  - Expand and collapse per `06-motion.md`.
- **Footer** (pinned to the sidebar bottom): a single `caption` line "RainFocus · Admin" in `--muted`. Decorative, not interactive.

### View header (inside the body, every view)
- Row: `h1` title at the left, actions at the right (max one primary button plus secondary and icon buttons).
- Below the title, an optional `body-sm` `--muted` description, one line.
- Margin bottom 24. Not sticky; it scrolls with the content.
- The Guide view replaces this with the event hero (see `08-view-guide.md`).

## Tablet layout (lg, 900 to 1199)

The sidebar collapses to an icon rail: the rail and sidebar merge into one 64 px column. The rf mark, badge and avatar keep their places; the four nav items become 44 x 44 icon buttons stacked under the badge with the active indicator bar at the left. Hovering or focusing a nav icon shows a tooltip with its label; for Attendees, the tooltip is a flyout menu (Popover) listing the five sub-items. The search field becomes a 44 x 44 search icon button that opens the palette. Body padding 32.

## Mobile layout (md and sm, below 900)

### Top bar (56 px, sticky)
`--side`, 1 px `--line` bottom edge, padding 0 8 0 12. Left to right: menu button (44 x 44, `Menu` icon, `aria-expanded`), event badge 28 px radius `--r-sm`, event name (`title`, truncates), spacer, search icon button (opens palette), avatar 28 px (opens account menu as a bottom sheet).

### Drawer
Slides from the left over a scrim, 280 px wide (100% minus 56 on screens under 360). Contains the full sidebar content (event block, search, nav with sub-items) plus a header row with the rf mark and a close button. Opening: `06-motion.md`. Focus trapped; Escape, scrim tap and swipe-left close it. Navigating closes it after the view enter animation starts.

### Bottom tab bar (`--tabbar-h`, fixed)
`--surface`, 1 px `--line` top edge, four tabs: Guide, Attendees, Content, Exhibitors, each an icon 20 + `micro` label, `--muted`; active `--accent-ink` with a 20 x 3 px indicator above the icon that Flips between tabs. The Attendees tab is active for any attendee sub-route. Tab bar hides while a bottom sheet or the palette is open (translateY 100%, 240 ms) and while the mode transition runs.

### Attendees sub-navigation on mobile
Below the view header on any of the five attendee routes: a horizontally scrollable `SegmentedControl`-styled strip of the five sub-items (Attendees · Types · Packages · Codes · Discounts), 36 px tall, the active segment filled `--surface` with `--shadow-1`. Scroll-snaps the active segment into view on route change.

## Command palette

Opened by `⌘K` / `Ctrl+K` anywhere in Brandon's Mode (not in faithful mode), by the sidebar search field, by the top bar search button, and by the "Search" command in the About panel. Closed by Escape, backdrop click, or executing a command.

Desktop: centered dialog, `--palette-w` 640, top at 15 vh, `--r-xl`, `--shadow-3`, scrim. Mobile: full-screen sheet with the input pinned at the top and a close button.

Structure:
- Input (44 px, search icon, placeholder "Search pages, actions, attendees and codes", clear button when non-empty).
- Results list, max height 60 vh, grouped with `micro` `--muted` group labels:
  1. **Pages** (always): the eight views with their icons. No shortcut hints on Pages. Match on label.
  2. **Actions**: Add attendee, Add registration workflow, Generate reg code, Add session, Add exhibitor, Edit event, Switch event, Toggle theme, Reduce motion on/off, Reset demo data, View original. Each executes the real thing (opens the relevant sheet or runs the store action). "View original" runs the mode transition.
  3. **Attendees**: live search over name, email and company, top 5, shows avatar, name and email; Enter opens the attendee's detail sheet on the Attendees view.
  4. **Reg codes**: match on code or label, top 3; Enter copies the code and shows a toast "Copied RF-XXXX-XXXX".
- Empty query: shows **Recent** (last 5 executed commands from `ui.recentCommands`) above Pages. No recents yet: just Pages and Actions.
- No matches: an inline empty row "No results for 'xyz'".
- Keyboard: Up and Down move (wrapping), Enter executes, Escape closes, Tab is trapped inside, typing goes to the input even if focus moved to the list. Mouse hover moves the highlight. The highlighted row has `--accent-soft` background and `--text` color, with a small "Enter ↵" `Kbd` at the right.
- Fuzzy matching: subsequence match with contiguous-bonus scoring; highlight matched characters in `--accent-ink` 600. Keep it simple and fast; no library.

## Account menu

Anchored to the avatar (rail or top bar). Desktop: `Menu` popover 280 wide. Mobile: bottom sheet.

Contents, top to bottom:
1. Header row: 40 px avatar, "First Name Last Name" (`title`), "firstname@rainfocus.com" (`caption`, `--muted`). Non-interactive.
2. Divider.
3. **Theme**: label at left, `SegmentedControl` sm at right: Light · Dark · System. Changing runs the theme switch animation.
4. **Reduce motion**: label at left, `Switch` at right. Default follows the system (`ui.reduceMotion === null`); toggling sets an explicit value. Sublabel `caption`: "Following system" or "On" or "Off".
5. Divider.
6. **Reset demo data** (icon `RotateCcw`): opens a Confirm modal "Reset demo data? This restores every event to its seeded state. Your changes will be lost." Confirm is danger-styled "Reset". On confirm: reseed, toast "Demo data restored".
7. **About this build** (icon `Info`): opens the About panel.
8. Divider.
9. **Sign out** (icon `LogOut`): runs the sign out animation and shows the Sign-in screen.

## Event switcher

Popover anchored to the rail badge or the sidebar event block (desktop) or a bottom sheet (mobile). Width 320.

- Header `micro` `--muted`: "Switch event".
- One row per event (three seeded): badge 32 px (the event logo), name (`title`), "Location · Date" (`caption`), a check icon at the right for the active one. Hover: `--accent-soft`. Keyboard: arrows, Enter.
- Choosing another event: popover closes, body content fades out 160 ms, `activeEventId` changes, the view re-enters with its choreography, the rail badge and sidebar event block crossfade. The current view stays the same (if you were on Packages, you see the new event's packages). Toast: none (the change is obvious).
- Footer row: "Create event" as a ghost button that opens the Event editor sheet in create mode (see `08-view-guide.md`, "Edit event"). A new event is real: name, dates, location, timezone, currency and a generated monogram logo (first letters of the first two words, on the next unused swatch). It starts with the defaults in `16-data-model.md` "New event defaults" (one default attendee type, one track, the 8:00 to 18:00 agenda, 24 empty booths, nothing configured, no attendees). After saving, the app switches to it.

## About panel

A side sheet (`--sheet-w` 480), title "About this build".

Content:
- The RainFocus event badge and the rf mark side by side, 48 px each, then `h3` "RainFocus UI challenge, taken a little further".
- Paragraph (`body`): "The original view is a pixel-exact build of the Figma design from the take-home brief. Brandon's Mode is what that page becomes as a finished product: the same information architecture, every control working, light and dark, desktop and mobile."
- `h3` "Built by": Brandon Church, Design Engineer. Links as a row of secondary buttons with external-link icons: Portfolio (`https://www.brandonchurchportfolio.com`), and Repository if `author.repoUrl` is non-empty (it is empty in the kit; the owner may set it later).
- `h3` "Stack": a wrap of neutral chips: React, TypeScript, Vite, SCSS modules, GSAP, Zustand, dnd-kit, Lucide, Playwright, Claude Code.
- `h3` "Shortcuts": a small two-column list: `⌘K` Search and commands · `Esc` Close the top layer · `↑ ↓` Move in lists and menus · `Enter` Open or confirm.
- Footer: secondary button "View original" (runs the mode transition after closing the sheet) and primary "Close".

Author details come from `src/data/author.ts`:
```ts
export const author = {
  name: 'Brandon Church',
  role: 'Design Engineer',
  portfolioUrl: 'https://www.brandonchurchportfolio.com',
  repoUrl: '',
};
```

## Sign-in screen

Shown when `ui.signedOut` is true. Replaces the whole Brandon's Mode shell (the pill stays, and still switches to faithful mode; faithful mode never shows sign-in).

- `--canvas` full screen. Centered card 400 wide, `--surface`, `--r-2xl`, `--shadow-3`, padding 40.
- Event badge 56 px, `h2` "You're signed out", `body` `--muted` "This is a demo. No account is needed.", primary button full width "Sign in as First Name Last Name", below it a `caption` `--muted` "Signing in restores your session exactly as you left it."
- Enter key and the button sign in. Animation per `06-motion.md`.
- Mobile: card is full width minus 32, vertically centered.

## Toasts

`ToastHost` renders bottom left on desktop (left 24 + rail + sidebar, so toasts sit over the body's bottom-left corner: `left: calc(var(--rail-w) + var(--sidebar-w) + 24px); bottom: 24px`), width 360. On lg the left offset is `var(--rail-w) + 24px`. On mobile: `left: 16px; right: 16px; bottom: calc(var(--tabbar-h) + 72px)`, which is above the pill (the pill sits at `tabbar + 16` and is 44 tall), so toasts and the pill never overlap at any width.

- Anatomy: `--surface`, 1 px `--line`, `--r-lg`, `--shadow-2`, padding 12 14, row: optional icon (success check, danger triangle, neutral info), message (`body-sm`, `--text`, up to two lines), optional action button (ghost sm, "Undo"), close icon button. For timed undo toasts a 2 px progress bar along the bottom edge in `--accent` shrinks from 100 to 0 over the toast's life (6 s).
- Max 3 visible; a fourth pushes the oldest out. Hover or focus pauses all timers.
- Messages follow the pattern "<Verb past tense> <object>" and name the thing: "Removed Jane Doe", "Added Full Conference", "Copied RF-7X2K-4MQ9", "Saved changes", "Demo data restored". Undo toasts: "Removed 3 attendees · Undo". The interpunct is rendered as layout (message, then the Undo button), not typed into the string.
- Undo restores the exact prior state (position in lists included) and shows a quick neutral toast "Restored".
- Durations: undo toasts live 6 s; plain success and neutral toasts 4 s; danger toasts (an action failed) stay until dismissed.

## Keyboard shortcuts (global in Brandon's Mode)

| Keys | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open command palette (toggles) |
| `Esc` | Close the topmost layer: palette, sheet, modal, menu, popover, drawer; if nothing is open, clear a table selection |
| `?` (Shift + /) when no input is focused | Open the About panel to its Shortcuts section |
| `⌘Z` / `Ctrl+Z` when no input is focused | Undo the most recent undoable action if its toast is still alive |

No single-letter navigation shortcuts; they conflict with typing and screen readers.

## Hash routing behavior (shell responsibilities)

- On entering Brandon's Mode: read the hash; if valid show that view, else set `#guide`.
- On nav click: update the hash; the view switch choreography runs; `document.title` stays "RainFocus Summit · Claude".
- Back and forward buttons work (hashchange listener).
- Sheets, modals, selection and filters are never in the hash. Reloading lands on faithful mode regardless of hash (mode is not persisted), and the hash is honored when the user next enters Brandon's Mode.

## Scroll behavior

- Body scroll resets to top on view change.
- Opening a sheet or modal locks body scroll (`overflow: hidden` on the body layer, with scrollbar-gutter compensation so content does not shift).
- Within sheets, only the sheet body scrolls; header and footer are sticky.

## Empty, long and odd states the shell must handle

- Event with a very long name: truncates in rail tooltip, sidebar block and top bar; full name on hover.
- No recents in the palette; no results in the palette.
- Three toasts at once; a toast while a sheet is open (toast sits above the scrim).
- Theme switch while a menu is open (menu re-themes live).
- Mode transition while a sheet is open: close all layers instantly (no exit animation) at t = 0, then run the transition.
- Narrow landscape phones (e.g., 844 x 390): the tab bar and top bar still fit; the body scrolls between them.
