# 14 · View · Content (`#content`)

The event agenda: sessions placed on a time grid across tracks, with drag to reschedule, a list view, and a session editor. Sessions feed the Attendee Portal and Calendar previews on the Guide view.

## View header
- `h1` "Content", description: "Sessions, speakers and the schedule attendees will see."
- Actions: `SegmentedControl` "Grid · List" (default Grid on xl and lg; at md and sm the list is the only presentation and the control hides), secondary "Manage tracks" (`Rows3` icon), primary "Add session" (`Plus`).

## Day and track bar
Under the header: a `Tabs` strip of event days (single-day events show one tab, "Mon, Dec 15"; multi-day events one per day; selecting changes the grid), then at the right a row of track filter chips (one per track, colored dot, toggle; all on by default) and a `caption` count "14 sessions".

## Grid view (xl, lg)
A card with horizontal scroll if tracks exceed the width (min track column 240).

- Left gutter column (64 px) with hour labels (`caption` `--muted`, right aligned, tabular) from the event's agenda start to end (seeded 8:00 to 18:00). Rows: 30 minutes = 44 px, so one hour = 88 px; the grid height for 10 hours is 880 px plus header. Hour lines `--line`; half-hour lines `--line` at 50% opacity.
- Column header per track (sticky): track color dot + name (`title`), count `caption`.
- **Session block**: absolutely positioned within its track column: `top = (start − agendaStart) / 30min × 44px`, `height = duration / 30min × 44px − 4` (4 px gap), left and right inset 6 px. `--surface`, 1 px `--line`, `--r-md`, left 3 px bar in the track color, padding 8 10. Content: title (`title` 13 px, 2 lines max then truncate), time range (`caption` `--muted`, "9:00 to 9:45 AM"), speaker (`caption`) when height allows (≥ 66 px shows speaker; ≥ 40 shows title and time, which every 30-minute block does). Hover: `--shadow-1`, border `--line-hover`, lift 1 px. Click: opens the Session sheet. Focusable; Enter opens.
- A "now" line (2 px `--berry` with a dot in the gutter) if the selected day is today and the current time is within the agenda; updates every minute.
- **Drag to reschedule**: dnd-kit. Each 15-minute slot in each track is a droppable cell (invisible grid behind the blocks: 4 cells per hour × tracks). Dragging a session shows a ghost of the block following the pointer with the new time range updating live in its `caption`; the target cells highlight (`--accent-soft`). Drop snaps the start to the 15-minute slot and keeps the duration. If the drop would overlap another session in that track, the drop is refused: the block springs back (320 ms `back.out(1.6)`) and a toast reads "That slot overlaps 'Opening keynote'". Keyboard sensor: focus a block, Space to lift, arrows move by 15 minutes (up and down) or one track (left and right), Space to drop, Escape to cancel; the live region announces the new time and track. On drop the block Flips to its new place and a toast "Moved 'Scaling live events' to 10:15 AM in Workshop A · Undo" appears.
- Overlapping seeded data is not allowed; the seed script must verify no overlaps per track.
- Empty track column: a faint centered `caption` "No sessions" at the top of the column plus a dashed "Add session here" button on hover of any empty hour cell (click opens the sheet with track and start prefilled). Keep this: it is the fastest way to add.

## List view (all widths; the only view on md and sm)
Grouped by hour (`micro` `--muted` group label "9:00 AM"), rows per session: time range (`body-sm` tabular, 100 px), track dot + name (`caption`), title (`title`) and speaker (`caption`), chevron. Row click opens the sheet. Sorted by start then track. Reordering is not available in list view; the sheet changes times.

## Session sheet (side sheet, 480)
Title is the session title (inline editable). Fields:
1. Track (Select from tracks)
2. Date (Select of event days) and Start (TimeField, 15-minute steps within the agenda range) on one row
3. Duration (Select: 30, 45, 60, 75, 90, 120 minutes; 30 is the minimum so every block has room for its title and time)
4. Speaker: Name (Input), Title and company (Input, "Head of Platform, Horizon") on one row; an `Avatar` preview of the speaker's initials at the left
5. Description (Textarea, 400 max)
6. Capacity (NumberField, optional) and Room (Input, optional, e.g., "Ballroom A") on one row
7. Tags (tag input, suggestions from existing tags)
Validation: the resulting time range must fit the agenda and not overlap another session in the same track; the error names the conflicting session. Footer: at the left danger ghost "Remove session"; at the right Cancel / primary "Save". Dirty guard.

"Add session" opens the sheet with defaults: first track, the first free 45-minute slot of the selected day, no speaker.

## Manage tracks (modal, 480)
A sortable list of tracks: color dot (swatch picker like attendee types), name (inline Input), session count, remove (disabled with tooltip when the track has sessions: "Move or remove its sessions first"). "Add track" appends. Order is the grid's column order. Save applies; Cancel discards. Minimum one track.

## Empty states
- No sessions: the grid still renders (empty columns with the hover add affordance); the list view shows `EmptyState` `CalendarPlus`, "No sessions yet", "Add the first session to start building the agenda.", primary "Add session".
- Track filter hides everything: `caption` banner "All tracks are hidden" with a "Show all tracks" link above the grid.

## Mobile
List view only. Day tabs scroll horizontally. Track chips collapse into a "Tracks" filter button opening a bottom sheet. Session sheet is a bottom sheet. "Add session" primary full width under the header.

## Seeded data (RainFocus Summit, Dec 15, 2026, agenda 8:00 AM to 6:00 PM, America/Denver)
Tracks: Main Stage (grape), Workshop A (teal), Workshop B (amber).
Sessions (14):
- Main Stage: Registration and coffee 8:00 (60, no speaker, room "Lobby"), Opening keynote 9:00 (60, "Priya Natarajan, CEO, RainFocus", "Ballroom A"), The next decade of live events 10:15 (45), Partner showcase 11:15 (45), Lunch 12:00 (75, no speaker), Fireside chat: measuring event ROI 13:30 (45), Closing keynote 16:30 (60), Evening reception 17:30 (30, no speaker, room "Terrace")
- Workshop A: Building registration flows that convert 9:00 (90), Designing attendee journeys 10:45 (60), Accessibility for event sites 13:30 (60), Hands-on: the attendee portal 15:00 (90)
- Workshop B: Data hygiene for large events 9:00 (60), Sponsorship packages that sell 10:15 (90)
Speakers are fictional, with realistic names, titles and companies (see `16-data-model.md`). Capacities set on workshops (40), none on Main Stage. Tags: Keynote, Workshop, Networking, Product.
