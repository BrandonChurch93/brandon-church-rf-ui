# 15 · View · Exhibitors (`#exhibitors`)

Companies with booths on the expo floor. Two presentations of the same data: a card grid and an SVG floor map, both interactive.

## View header
- `h1` "Exhibitors", description: "Companies on the expo floor and where to find them."
- Actions: `SegmentedControl` "Cards · Floor map" (default Cards), primary "Add exhibitor" (`Plus`).

## Toolbar
- `SearchField` (placeholder "Search exhibitors"), matches name and contact name.
- Filter chips: "Tier" (Platinum · Gold · Silver), "Status" (Confirmed · Pending · Cancelled), "Booth" (Assigned · Unassigned).
- Right: count `caption` "18 exhibitors".

## Cards view
Card grid (per `05-design-system.md` card grid rules). **Exhibitor card** (clickable → detail sheet), padding 20, min height 168:
- Top row: a 44 px monogram tile (`--r-md`) with 2-letter initials, using the tier's swatch in soft-fill-with-ink-text form per `05-design-system.md` "Text on swatches" (Platinum: slate, Gold: amber, Silver: a ninth neutral swatch, light `#8E8A93` and dark `#A9A4B0`, with ink `#5F5B64` light and `#C3BFC9` dark), then name (`h3`-sized 16 px 600, truncates) with a tier chip under it (`micro`: "Platinum" etc.), spacer, status dot (Confirmed success, Pending warning, Cancelled danger) with tooltip.
- Middle: `body-sm` `--muted` one-line tagline (e.g., "Attendee check-in hardware").
- Bottom row (`caption`): booth label "Booth B4" in `mono`-ish weight 600 (or "No booth" `--muted` with a "Assign" ghost link that opens the booth popover) · contact name.
- Hover: lift; an action row fades in at the top right: `IconButton` "Email" (copies the contact email, toast "Copied ops@horizon.example"), kebab → Edit, Assign booth, Mark confirmed / pending, Remove (danger).

**Add card** at the end: dashed, "Add exhibitor".

Sorting: by tier (Platinum first) then name. No user sort control; the search and filters are enough. Log that decision if you change it.

## Floor map view
A card containing an SVG floor plan, responsive width (viewBox 1200 x 640), with a legend at the top right (tier colors, "Empty" dashed) and a `caption` under the map: "Click a booth to open its exhibitor. Click an empty booth to assign one."

Layout: 24 booths in a 6 x 4 grid with a central aisle: rows A to D, columns 1 to 6, booth size 150 x 110 in viewBox units, gaps 30 horizontal (90 at the aisle between columns 3 and 4), 40 vertical; an entrance marker at the bottom center ("Entrance", a small arch). Booth labels "A1" to "D6" top left inside each booth (`micro`). Occupied booth: filled with the tier color at 18% opacity, 2 px stroke in the tier color, the exhibitor's monogram tile (32) and name (truncated with an SVG `<title>` for the full name) centered. Empty booth: dashed `--line-hover` stroke, no fill, a faint "+" in the center.

Interactions:
- Hover occupied: stroke thickens to 3, fill to 28%, the name becomes `--text` (420 ms). A real HTML `Tooltip` (not an SVG label) positioned from the booth's bounding rect shows name, tier and contact.
- Click occupied: opens the detail sheet.
- Hover empty: fill `--accent-soft`, the "+" becomes `--accent-ink`.
- Click empty: opens the **Assign booth** popover anchored to the booth (a `Combobox` listing exhibitors without a booth, searchable; choosing one assigns it; the booth animates to occupied: fill fades in, monogram scales 0.8 → 1, 420 ms; toast "Assigned Horizon to B4 · Undo").
- Keyboard: booths are focusable in reading order (A1 to D6), Enter activates, the focus ring is an SVG rect with `--accent-ink` stroke.
- The map re-themes in dark (colors from tokens via CSS variables on the SVG).
- Pan and zoom are not needed at xl; on narrow widths the card scrolls horizontally with a scroll hint (a subtle fade at the right edge).

## Detail sheet (side sheet, 480)
Title is the exhibitor name (inline editable). Header shows the monogram tile 48 and the tier chip.
Sections:
- **Details** (same explicit Edit pattern as attendees): Tier (Select: Platinum, Gold, Silver), Status (Select), Tagline (Input, 60 max), Website (Input, URL), Booth (Select of booths: "Unassigned" plus every booth, occupied ones shown disabled with the occupant's name), Notes (Textarea).
- **Contact**: Name, Email, Phone (Inputs in the same Edit pattern), plus a "Copy email" ghost sm button.
- **Staff**: the attendees whose type is Exhibitor staff and whose `exhibitorId` matches: avatar list with names; an "Add staff" Combobox over attendees of that type without an exhibitor; remove per row (unlinks, does not delete the attendee).
Footer: danger ghost "Remove exhibitor" (Confirm; frees the booth; unlinks staff; toast with Undo) / "Close".

## Add exhibitor (side sheet)
Fields: Name (required, unique), Tier (SegmentedControl: Platinum · Gold · Silver, default Gold), Tagline, Website, Contact name, Contact email (required, valid), Contact phone, Booth (Select of free booths, optional), Status (default Pending). Footer Cancel / "Add exhibitor". Success: card animates into the grid (or the booth fills on the map), toast.

## Empty states
- None: `EmptyState` `Store`, "No exhibitors yet", "Add exhibitors and place them on the floor map.", primary "Add exhibitor". The floor map still renders with all booths empty.
- Filter miss: "No exhibitors match" with "Clear filters".

## Mobile
Cards per the `05-design-system.md` card grid rule; the Cards · Floor map control stays (the map scrolls horizontally inside its card at a minimum width of 720 CSS px, with the scroll hint). Sheets become bottom sheets. The assign popover becomes a bottom sheet Combobox.

## Seeded data (RainFocus Summit)
18 exhibitors: 3 Platinum, 7 Gold, 8 Silver; 15 Confirmed, 2 Pending, 1 Cancelled; 16 assigned to booths (the entrance is at the bottom center, so Platinum takes D2, D3 and D4 nearest the entrance; Gold takes 7 of the remaining 9 booths in rows C and D; Silver sits in rows A and B), 2 unassigned (both Pending) so the assign flow has candidates and the map has 8 empty booths. Names are fictional companies with plausible taglines (event tech, badge printing, AV, catering, travel, lead retrieval, analytics, streaming, furniture rental, networking apps, swag, security, photography, venue wifi, translation, mobile apps, signage, insurance). Each has a contact with a `.example` email domain. 6 seeded attendees of type Exhibitor staff are linked to Platinum and Gold exhibitors.
