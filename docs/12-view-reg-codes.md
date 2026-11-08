# 12 · View · Reg codes (`#reg-codes`)

Registration codes: comp codes, discount links and access codes. A table with generation, bulk generation, copy, activation and expiry.

## View header
- `h1` "Reg codes", description: "Codes attendees enter or follow to register with special access or pricing."
- Actions: secondary "Bulk generate" (`Layers` icon), primary "Generate code" (`Plus`).

## Toolbar
- `SearchField` (placeholder "Search codes or labels"), matches code (case-insensitive, ignoring dashes) and label.
- Filter chips: "Type" (Comp · Discount · Access), "Status" (Active · Inactive · Expired · Exhausted).
- Right: count `caption` "8 codes".

## Table
Columns (xl):
| Column | Width | Content | Sortable |
|---|---|---|---|
| Code | 220 | `mono` code (e.g., `RF-7X2K-4MQ9`) with a copy `IconButton` (16) at the right that appears on row hover and focus; click copies and morphs to a check with tooltip "Copied" per `06-motion.md`; also toast "Copied RF-7X2K-4MQ9" | yes |
| Label | grows | label (`body-sm`), and below it `caption` `--muted` the linked discount or package if any | yes |
| Type | 120 | chip: Comp (accent-soft), Discount (berry-soft), Access (neutral) | yes |
| Uses | 160 | "12 of 50" (`body-sm`, tabular) over a 4 px `ProgressBar`; unlimited reads "12 used" with no bar | yes (by uses) |
| Expires | 130 | "Dec 10, 2026" or "No expiry" `--muted`; expired dates render in `--danger` | yes |
| Active | 80 | `Switch`. Toggling is immediate with a toast "Deactivated RF-7X2K-4MQ9 · Undo". A switch is disabled (tooltip) when the code is Expired or Exhausted: "Expired codes cannot be activated" / "All uses consumed" | no |
| Actions | 56 | kebab → Edit, Copy code, Duplicate, Remove (danger) | no |

Status is derived: Expired (expiry < today), Exhausted (uses ≥ max), Inactive (switch off), else Active. The Status filter uses the derived value.

Row click opens Edit. Rows 56 px. The table scrolls horizontally inside its card when its columns exceed the card width (lg), like the Attendees table.

## Generate code (side sheet, 480)
Title "Generate code".
1. Label (Input, required, e.g., "Speaker comp")
2. Type (SegmentedControl: Comp · Discount · Access). Discount reveals a Select "Applies discount" (every non-removed discount, active or not, with inactive ones labeled "(inactive)"; required). Access reveals a Select "Grants attendee type" (optional).
3. Code (Input, `mono`, prefilled with a generated code; a "Regenerate" icon button at the right; editable; validation: 6 to 20 chars, letters, digits and dashes, unique; auto-uppercase). Pattern for generation: `RF-XXXX-XXXX` using an unambiguous alphabet (no 0, O, 1, I, L).
4. Max uses (NumberField, blank = unlimited) and Expires (DateField, optional) side by side
5. Active (Switch, default on)
Footer: Cancel / primary "Generate". On success the row enters at the top (the default sort is newest first), flashes, toast "Generated RF-7X2K-4MQ9".

Edit opens the same sheet titled "Edit code" with uses shown read-only ("12 of 50 used").

## Bulk generate (modal, 480)
"Bulk generate codes". Fields: Count (NumberField 1 to 100, default 10), Label prefix (Input, "Partner comp" → labels "Partner comp 01" to "Partner comp 10"), Type (SegmentedControl), Max uses per code (NumberField, default 1), Expires (DateField optional). A preview line shows three example codes. Footer: Cancel / primary "Generate 10 codes". On confirm: rows stream in with a 40 ms stagger (cap at 400 ms total; beyond 10 they appear together after the first 10), toast "Generated 10 codes · Undo" (Undo removes all of them).

## Remove
Confirm "Remove RF-7X2K-4MQ9? Attendees who used it keep their registrations." → danger → toast with Undo. Codes referenced by attendees remain removable (the attendee's `regCodeId` becomes null and their activity logs "Code RF-7X2K-4MQ9 removed").

## Empty states
- None: `EmptyState` `KeyRound` icon, "No codes yet", "Generate codes for comps, discounts or special access.", primary "Generate code".
- Filter miss: "No codes match" with "Clear filters".

## Mobile
Cards: code (`mono`, 15 px) with copy button, label, type chip, uses text, expiry, and the Active switch at the right. Bulk generate becomes a bottom sheet. Header actions: primary stays, Bulk generate moves to the header kebab.

## Seeded data (RainFocus Summit)
8 codes:
- `RF-SPKR-2026` · Speaker comp · Comp · 14 of 30 · Dec 14, 2026 · Active
- `RF-VIP-GOLD` · VIP guest comp · Comp · 9 of 10 · No expiry · Active
- `RF-EARLY-25` · Early bird 25% · Discount (Early bird) · 61 of 100 · Nov 1, 2026 · Expired
- `RF-PARTNER-15` · Partner 15% · Discount (Partner) · 22 unlimited · No expiry · Active
- `RF-STAFF-ALL` · Staff access · Access (Staff) · 18 of 25 · No expiry · Active
- `RF-PRESS-26` · Press access · Access (Press) · 3 of 20 · Dec 15, 2026 · Active
- `RF-TEAM-OFFSITE` · Internal team · Comp · 12 of 12 · No expiry · Exhausted
- `RF-TEST-0001` · QA test code · Comp · 0 of 1 · No expiry · Inactive
