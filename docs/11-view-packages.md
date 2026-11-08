# 11 · View · Packages (`#packages`)

Ticket packages with pricing, inclusions and capacity. Card grid with a side sheet editor.

## View header
- `h1` "Packages", description: "What attendees can buy, and what each option includes."
- Actions: a `SegmentedControl` sm "Active · Archived" at the left of the actions group (filters the grid; default Active), primary "Add package" (`Plus`).

## Grid
Card grid (per `05-design-system.md` card grid rules). Each **package card** (clickable → editor), padding 20 24, min height 200:

- Top row: name (`h3`, truncates) and at the right a status chip: Active (success), Draft (neutral), Sold out (warning, derived when sold ≥ capacity), Archived (neutral `--muted`).
- Price line: `display`-sized 28 px, weight 500, tabular, the event currency ("$899"), followed by `caption` `--muted` "per attendee". Free packages read "Free".
- Description (`body-sm` `--muted`, 2 lines max).
- Includes: a wrap of up to 4 neutral chips (`micro`), with a "+2 more" chip when there are more (full list in the editor and in a tooltip on the "+N" chip).
- Capacity row: `ProgressBar` (solid `--accent`; `--warning` at 90% or more; `--danger` when sold out) with `caption` "150 of 400 sold" at the right. Unlimited capacity reads "3 sold · Unlimited" with no bar.
- Hover: lift; action row fades in at the top right: Edit (pencil), kebab → Duplicate, Archive (or Unarchive), Remove (danger; disabled with tooltip "Packages with sales can be archived, not removed" when sold > 0).

**Add card** at the end of the Active grid: dashed, "Add package" (same style as the Guide's add card). Not shown in the Archived filter.

## Editor (side sheet, 480)
Title "Edit package" / "New package".
1. Name (Input, required, unique)
2. Price (CurrencyField in the event currency, 0 allowed = Free) and Capacity (NumberField, blank = unlimited) side by side
3. Status (SegmentedControl: Draft · Active). Archived is set from the card menu, not here.
4. Description (Textarea, 200 max)
5. Includes (tag input: type and press Enter to add a chip, Backspace removes the last, x on each; max 12; suggestions popover with the inclusions used by other packages)
6. Available to (multi-select checklist of attendee types; empty = all types). Show "All attendee types" summary when empty.
Footer: Cancel / primary "Save". Dirty guard. Success morph and toast.

Sold count is derived from attendees whose `packageId` matches; it is never edited directly.

## Archive and remove
- Archive: immediate, card Flips out of the Active grid (and appears under Archived), toast "Archived Expo Only · Undo".
- Unarchive: reverse.
- Remove (only when sold = 0): Confirm → remove → toast with Undo.
- Duplicate: "<Name> copy", Draft, same fields, opens the editor.

## Empty states
- No active packages: `EmptyState` with `Ticket` icon, "No packages yet", "Create the options attendees choose from when they register.", primary "Add package".
- No archived packages: `EmptyState` compact: "Nothing archived".

## Mobile
Cards per the `05-design-system.md` card grid rule (2 columns at md when the container is 700 px or wider, else 1), full-width add button under the header instead of the add card, bottom-sheet editor. Price line stays large; the includes wrap.

## Seeded data (RainFocus Summit, USD)
- Full Conference · $899 · capacity 400 · Active · "Two days of sessions, workshops and the evening reception." · Includes: All sessions, Workshops, Lunch both days, Evening reception, Recording access · all types
- Expo Only · $149 · capacity 600 · Active · "Access to the expo floor and keynotes." · Includes: Expo floor, Keynotes · all types
- Workshop Day · $399 · capacity 40 · Active · "Hands-on workshop track." · Includes: Workshops, Lunch, Recording access · Attendee, Employee
- VIP Experience · $1,899 · capacity 10 · Active · "Front-row seating, speaker dinner and lounge access." · Includes: All sessions, Workshops, Speaker dinner, VIP lounge, Priority seating, Recording access, Reserved parking · VIP
- Student · $0 · capacity 60 · Draft · "Complimentary access for verified students." · Includes: Keynotes, Expo floor
- Press Pass · $0 · unlimited · Archived · "Credentialed media." · Includes: All sessions, Press room · Press

Sold counts derive from attendees. The 240 seeded attendees are assigned so that: Full Conference 150 sold (38%), Expo Only 40 (7%), Workshop Day 30 (75%), VIP Experience 9 (90%, warning color), Press Pass 3 (archived, Press attendees), Student 0, and 8 attendees have no package. These numbers are exact in the seed script so the bars look intentional.
