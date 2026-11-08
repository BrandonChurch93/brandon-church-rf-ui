# 09 · View · Attendees (`#attendees`)

The data-heavy view. A real table with search, filters, sorting, selection, bulk actions, pagination, CSV export, a detail sheet, and an add form. On mobile it becomes a card list with the same capabilities.

## View header
- `h1` "Attendees", description `body-sm` `--muted`: "Everyone registered for RainFocus Summit." (event name interpolated).
- Actions (right): secondary button "Export CSV" (`Download` icon), primary "Add attendee" (`Plus`).

## Toolbar
A row under the header, gap 12, wraps on narrow widths:
- `SearchField` (width 320 at xl, grows to full on mobile), placeholder "Search by name, email or company", debounced 150 ms, clear button. Matches case-insensitively on name, email, company.
- Filter chips (toggle chips that open a small Popover with checkboxes): "Type" (all attendee types with their color dots and counts), "Status" (Registered, Pending, Waitlisted, Cancelled), "Package" (all packages). A chip with an active selection shows its count ("Type · 2") and a clear x. "Clear filters" ghost link appears when any filter or search is active.
- Right side: result count `caption` `--muted` "240 attendees" (filtered count of total when filtered: "12 of 240 attendees").

## Table (desktop, xl and lg)
`Table` primitive inside a card (`--surface`, `--line`, `--r-lg`, no padding). Sticky header row (`--surface-2`; header labels in `micro` weight 600 `--muted`, sentence case, never uppercase).

Columns (widths at xl; the table is `table-layout: fixed`):
| Column | Width | Content | Sortable |
|---|---|---|---|
| Select | 40 | Checkbox; header checkbox is indeterminate when some rows on the page are selected | no |
| Name | grows (min 220) | `Avatar` 32 + name (`title`) over email (`caption` `--muted`); both truncate | yes (name) |
| Company | 160 | company (`body-sm`), job title below (`caption`) | yes |
| Type | 130 | status-style chip with the type's color dot | yes |
| Package | 140 | package name (`body-sm`) or "None" `--muted` | yes |
| Status | 120 | `StatusDot` + label: Registered (success), Pending (warning), Waitlisted (neutral `--muted`), Cancelled (danger) | yes |
| Registered | 110 | "Nov 2, 2026" (`body-sm`, tabular) | yes (default sort, newest first) |
| Actions | 48 | kebab icon button → Menu: View details, Change type (submenu-less: opens a small popover with the type list), Resend confirmation (appends the activity entry "Confirmation email resent" and shows the toast "Confirmation sent to jane@example.com"; no real email is sent and the toast does not pretend otherwise beyond that wording), Cancel registration (danger; for Cancelled rows this reads "Reinstate"), Remove (danger) | no |

Rows 60 px tall. Column widths at xl: Select 40, Name grows (min 220), Company 160, Type 130, Package 140, Status 120, Registered 110, Actions 48; this fits the 1047 px of content width at 1447. At lg the Company column is hidden and, when the remaining columns still exceed the card's width (they do below about 810 px), the table scrolls horizontally inside its card with the header staying sticky; this is one of the designated inner scrollers in `17-responsive.md`. Row hover: `--surface-2` background, the kebab becomes visible (it is `opacity: 0` at rest except for keyboard focus, when it is always visible). Row click (anywhere but the checkbox and the kebab) opens the detail sheet. Selected rows: `--accent-soft` background and a 3 px `--accent` left edge.

Sorting: click a header to sort ascending, again for descending, a third time clears to the default. Arrow icon shows direction. Sort state is per session (not persisted).

Pagination: 25 per page default; `Pagination` below the table inside the card footer: "1 to 25 of 240" at the left, page controls and a page-size Select (25 / 50 / 100) at the right. Changing filters resets to page 1. Keyboard: the table body is a focusable region; Up and Down move a row focus ring; Enter opens; Space toggles selection; `⌘A` / `Ctrl+A` while the table is focused selects all rows on the page.

### Bulk action bar
Appears (slides up from the bottom of the table card, 320 ms ease-out) when at least one row is selected. Content: "3 selected" (`title`), "Select all 240" ghost link when the selection is one page and more exist, then actions: "Change type" (Select-style popover), "Change status" (popover: Registered / Pending / Waitlisted / Cancelled), "Export selected" (CSV of the selection), "Remove" (danger). Escape clears the selection.

Remove: Confirm "Remove 3 attendees? This cannot be undone after the undo window closes." → danger "Remove 3 attendees" → rows exit (Flip), toast "Removed 3 attendees · Undo". Undo restores them at their original positions.

## Detail sheet (side sheet, 480)
Opens from a row click, the kebab's "View details", or the command palette.

- Header: `Avatar` 40, name (`h3`, editable inline like the event title), email below (`caption`), close button. Under the header, the status chip and type chip side by side.
- Body sections (each `h3`-less; use a `micro` `--muted` section label with a divider):
  - **Details**: a two-column definition list on desktop (label `caption` `--muted`, value `body`): Email (editable Input), Phone (editable), Company (editable), Job title (editable), Attendee type (Select), Package (Select, with price shown in the option), Reg code (Combobox over the event's codes; shows the code in `mono`), Registered on (read-only date), Notes (Textarea). Edits are explicit: an "Edit" ghost button in the section label row switches the section to inputs with "Save" and "Cancel"; this avoids accidental edits. Save shows the success morph and a toast "Saved changes".
  - **Activity**: a vertical timeline (dot and line in `--line`, dot in `--accent` for the latest) of the attendee's activity entries, newest first: "Registered via Attendee Registration", "Confirmation email sent", "Package changed to Full Conference", etc., each with a relative time (`caption` `--muted`: "2 days ago", via `Intl.RelativeTimeFormat`). Every store mutation on an attendee appends an entry (type change, status change, package change, notes edited). Maximum 50 kept per attendee.
- Footer: at the left a danger ghost button "Remove attendee" (Confirm → remove → sheet closes → toast with Undo); at the right "Close".

## Add attendee (side sheet, 480)
Title "Add attendee". Fields: First name, Last name (two columns), Email (required, valid, unique within the event: on duplicate show "An attendee with this email already exists" and offer a "View" link that opens that attendee), Phone (optional, loose validation), Company, Job title, Attendee type (Select, default the event's default type), Package (Select, "None" allowed), Status (Select, default Registered), Notes. Footer Cancel / primary "Add attendee". On success: sheet closes, the new row is inserted (sorted position), the table scrolls it into view and flashes it (`--accent-soft` fade over 1200 ms), toast "Added Jane Doe". Activity gets "Added manually".

## Export CSV
Client-side: builds a CSV of the current filtered and sorted rows (or the selection) with columns Name, Email, Phone, Company, Job title, Type, Package, Reg code, Status, Registered, then triggers a download named `rainfocus-summit-attendees-2026-11-07.csv` (event slug + date). Shows toast "Exported 240 attendees". Over `file://` the download still works in Chromium; verify.

## Empty states
- No attendees at all: `EmptyState` with `Users` icon, "No attendees yet", "Attendees appear here as they register, or add them yourself.", primary "Add attendee", secondary link "Restore demo data" (runs the account menu's reset with confirm).
- Filters match nothing: `EmptyState` with `SearchX` icon, "No attendees match", "Try a different search or clear the filters.", primary "Clear filters".
- Toolbar and header remain visible in both cases.

## Mobile (md and sm)
- Header actions collapse: primary "Add attendee" stays full width under the title; "Export CSV" moves into a kebab menu in the header.
- Toolbar: search full width; one "Filters" button with a count badge opens a bottom sheet with the three filter groups as checkbox lists and a "Show 12 attendees" primary button at the bottom (live count). Sort is a Select in the same sheet.
- List: cards instead of a table. Each card: avatar, name, email, type chip and status dot row, company line, chevron. Tap opens the detail sheet as a bottom sheet (full height). Long-press (500 ms) or the "Select" ghost button in the toolbar enters selection mode: checkboxes appear at the left, the bulk bar appears above the tab bar, and the pill steps aside for the duration (`06-motion.md`, "Stepping aside").
- Pagination becomes "Load 25 more" button at the end of the list, plus the count.
- 44 px minimum targets everywhere.

## Seeded data (RainFocus Summit)
240 attendees (ten pages at 25). Mix: 70% Registered, 15% Pending, 10% Waitlisted, 5% Cancelled; types weighted toward Attendee; package assignments fixed so the Packages view shows the intended sold percentages (see `11-view-packages.md`), with 8 attendees on no package; registration dates spread over the 8 weeks before the seed date; about 60% have a reg code; every attendee has 1 to 4 activity entries. Full spec in `16-data-model.md`.
