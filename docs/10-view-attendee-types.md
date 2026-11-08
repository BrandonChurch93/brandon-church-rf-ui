# 10 · View · Attendee types (`#attendee-types`)

A small, perfect CRUD list. Types are the categories attendees belong to (Attendee, Speaker, VIP, Staff, Employee, Exhibitor staff, Press). They are referenced by attendees, workflows and the registration form, so removal has consequences the UI must handle gracefully.

## View header
- `h1` "Attendee types", description: "Categories that drive registration workflows and badges."
- Actions: primary "Add type" (`Plus`).

## List
A card containing a vertical, sortable list. No table header; rows are self-describing.

Row (64 px, padding 0 16 0 8, gap 12, divider `--line` between rows):
- `DragHandle` (visible on hover and focus; always visible on touch devices).
- Color dot 12 px in the type's swatch color (see `05-design-system.md` palette).
- Name (`title`) and description (`caption` `--muted`) stacked; both truncate.
- Spacer.
- Count badge: "24 attendees" (`Badge` neutral, tabular). Zero reads "No attendees" in `--muted`.
- "Default" chip (`micro`, `--accent-soft` background, `--accent-ink`) on the default type. Exactly one type is default.
- Kebab → Menu: Edit, Set as default (disabled on the current default), Duplicate, Remove (danger; disabled with tooltip "The default type cannot be removed" on the default).

Row hover: `--surface-2`. Row click (outside controls) opens Edit. Drag reorders; order persists and is the order used in every type Select across the app.

## Add and Edit (inline editor, not a sheet)
Types are small, so editing happens in place: the row expands (height tween) into an editor panel:
- Name (Input, required, unique, max 32)
- Description (Input, optional, max 80)
- Color: a row of the 8 swatches as 24 px circles; the selected one has a 2 px `--text` ring with 2 px offset; keyboard: radio group semantics.
- Row of actions at the right: ghost "Cancel", primary "Save" (sm). Enter saves, Escape cancels.
"Add type" appends an empty editor row at the bottom with the name input focused and the first unused swatch preselected; Cancel removes it. New types are not default.

Save: the row collapses back, flashes `--accent-soft`, toast "Saved Speaker" or "Added Press".

## Remove
If the type has zero attendees and is referenced by no workflow: Confirm "Remove Press?" → remove → toast with Undo.

If it is in use: a **Reassign** modal (420): "Remove Speaker? 6 attendees and 1 workflow use this type. Choose where they should go." A Select of the remaining types (default: the default type). Confirm is danger "Remove and reassign". On confirm: attendees and workflows move to the chosen type (each attendee gets an activity entry "Type changed to Attendee during removal of Speaker"), the row exits, toast "Removed Speaker · Undo". Undo restores the type and moves everything back.

## Set as default
Moves the "Default" chip with a Flip (320 ms). The default type is what "Add attendee" and new workflows preselect. Toast "Attendee is now the default type".

## Duplicate
Creates "<Name> copy" with the same description and the next unused color, inserted directly below, in edit mode with the name selected.

## Empty state
Cannot be fully empty (the default type cannot be removed), so the minimum is one type. No empty state needed beyond the zero-attendee badge text.

## Mobile
Same list; the drag handle is always visible; the kebab is always visible; the inline editor stacks its fields; swatches wrap. The count badge drops the word on sm ("24") with the full phrase as a tooltip.

## Seeded data (RainFocus Summit)
Order and swatches: Attendee (grape, default, "General admission attendees"), Speaker (berry, "Presenting at one or more sessions"), VIP (amber, "Sponsors, partners and invited guests"), Staff (teal, "RainFocus event staff"), Employee (sky, "RainFocus employees attending"), Exhibitor staff (plum, "Booth staff for exhibitors"), Press (slate, "Media and analysts"). Counts derive from the seeded attendees.
