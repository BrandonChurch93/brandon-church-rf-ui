# 13 · View · Discounts (`#discounts`)

Percent or fixed-amount discounts that apply to packages during a window. The payoff feature is the live price preview while editing.

## View header
- `h1` "Discounts", description: "Reduce package prices for a window of time or a group of attendees."
- Actions: primary "Add discount" (`Plus`).

## List
A card containing rows (not a table; each discount reads as a sentence).

Row (72 px, padding 16 20, grid: main, window, usage, switch, kebab):
- Main: name (`title`) and below it the rule as `body-sm` `--muted`: "25% off Full Conference and Workshop Day" or "$50 off all packages". Built from the data; pluralize and list up to 2 package names then "and 2 more".
- Window (`body-sm`): "Sep 1 to Nov 1, 2026" or "Always" or "Until Dec 10, 2026". Past windows render in `--muted` with "Ended" caption.
- Usage: "61 uses" (`body-sm`, tabular), `--muted`.
- Active `Switch` (same disabled rules as codes: ended windows cannot be activated, tooltip "This window has ended").
- Kebab → Edit, Duplicate, Remove (danger; if any reg code points at it, the Confirm explains "2 codes reference this discount and will stop applying it").
- Status chip at the left of the switch on narrow widths only; on xl the switch is enough plus a derived "Scheduled" chip (`micro`, neutral) when the window starts in the future.

Row hover: `--surface-2`; row click opens Edit.

## Editor (side sheet, 480)
Title "Edit discount" / "New discount".
1. Name (Input, required)
2. Type and amount on one row: `SegmentedControl` "% · $" (the "$" label uses the event currency symbol) and a NumberField / CurrencyField. Percent: 1 to 100 integer. Fixed: > 0 and ≤ the lowest non-zero price among the selected packages (validation message: "Cannot exceed the lowest selected package price ($149)"); free packages are ignored by this check and preview as "Free · no change".
3. Applies to (checklist of non-archived packages, Draft ones labeled "(draft)"; "All packages" checkbox at the top toggles all; at least one required)
4. Window: Starts (DateField, optional) and Ends (DateField, optional, ≥ starts). Both blank = Always.
5. Limit (NumberField, optional, total uses allowed; blank = unlimited)
6. Active (Switch)
7. **Live preview** (a `--surface-2` panel pinned under the fields, updates on every keystroke): one line per selected package: "Full Conference · $899 → $674.25" with the new price in `title` weight and the old price struck through in `--muted`; free packages read "Free · no change". A discount that brings a price exactly to zero (a 100% discount, or a fixed amount equal to the price) is valid and previews as "Free". A fixed amount greater than a selected package's price is the validation error in field 2.
Footer: Cancel / primary "Save". Dirty guard. Success morph, toast.

Calculations are integers in minor units (cents) to avoid float artifacts; round half up; format with `Intl`.

## Remove
Confirm → remove → toast with Undo. Reg codes pointing at it lose the link (their label caption updates to "Discount removed", their type stays Discount; the Reg codes editor shows the Select as "Choose a discount" with error until fixed, and the row shows a warning dot with tooltip "Discount missing").

## Empty state
`EmptyState` `Percent` icon, "No discounts yet", "Create a discount and attach it to a reg code or a window.", primary "Add discount".

## Mobile
Rows stack: name and rule, then window and usage on one line, then the switch at the right of the first line. Editor as bottom sheet; the live preview stays visible above the footer (sticky inside the sheet body) so typing updates it in view.

## Seeded data (RainFocus Summit)
- Early bird · 25% · Full Conference, Workshop Day · Sep 1 to Nov 1, 2026 · 61 uses · Inactive (ended)
- Partner · 15% · All packages · Always · 22 uses · Active
- Team of five · $100 fixed · Full Conference · Nov 1 to Dec 10, 2026 · 8 uses · Active
- Student verification · 100% · Student · Always · 0 uses · Active (shows "Free" math: $0 → Free)
