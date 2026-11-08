# 02 · The quality bar

This is the document that governs every decision the specs do not make for you. Read it at the start of every session.

## The standard in one sentence

Brandon's Mode should feel like a shipped product from a team that cares about craft the way Linear, Vercel, Stripe and Raycast do: calm, fast, precise, quietly beautiful, with motion that feels physical and copy that gets out of the way.

Not a demo. Not a prototype. Not a portfolio flourish bolted onto a mock. A product.

## Reference points

Use these as calibration when you decide something. You can look them up.

- **Linear** (linear.app): density, keyboard-first, the command palette, the restraint of its hover states, how little it animates and how good the few animations are.
- **Vercel dashboard**: surfaces and borders on a neutral canvas, tabular data done cleanly, toasts, empty states with a single clear action.
- **Stripe dashboard**: forms and side sheets, inline validation, how destructive actions are confirmed, number and currency formatting.
- **Raycast**: the feel of a list that responds instantly to typing, selection highlights, keyboard hints.
- **Arc / Things 3**: spring-feeling but never bouncy motion, lift on hover, the sense that elements have weight.

Texts worth applying: Refactoring UI (Wathan and Schoger) on hierarchy, spacing and color; Emil Kowalski's writing on web animation (ease-out for entering, ease-in for leaving, animate transform and opacity, respect reduced motion); Apple HIG and Material on touch targets (44 and 48 px); WCAG 2.2 AA on contrast and focus.

## Principles

### 1. Finished, not demo
Every control works and leads somewhere real. Every list can be empty and looks designed when it is. Every form validates. Every destructive action can be undone or is confirmed. If you build a button, you build what it does. If you cannot build what it does, the button does not exist.

### 2. Composed, not placed
Layouts are deliberate. No dead zones (the Figma's Step 1 row leaves two thirds of itself empty; Brandon's Mode fills the row with an even grid). Alignment holds across the page: text baselines, card edges, icon optical centers. Spacing comes from the scale in `05-design-system.md`, never from eyeballed pixels. Widths come from the grid.

### 3. Motion is slow, eased and physical
Hovers take 400 to 560 ms with a long ease-out tail. Things that appear come from slightly below or slightly smaller and settle. Things that leave go faster than they came. Nothing bounces except a deliberate "pop" on a small element. No shimmer, no glossy sweeps on cards, no parallax gimmicks. If an animation calls attention to itself rather than to the content, remove it. The full rules are in `06-motion.md`; this principle is why they exist.

### 4. Affordance is honest
Only clickable things respond to hover. Text that is not a link does not get a background on hover. Cards that open something lift; cards that do not, do not. Cursor is `pointer` only on real controls. Disabled states are visibly disabled and explain why on hover (tooltip).

### 5. Real data, real formatting
Names, companies, emails and dates look like a real event's data. Numbers are formatted with `Intl` (thousands separators, currency with the event's currency, dates in "Dec 15, 2026" form, relative counts like "38 days out"). Pluralization is correct ("1 attendee", "2 attendees"). Tabular numbers in tables and prices (`font-variant-numeric: tabular-nums`).

### 6. Typography carries hierarchy
One family (Inter), weight and size do the work. Display sizes get slightly tighter tracking. Body text never below 13 px on desktop, 14 px on mobile for primary content; 12 px only for captions and metadata with sufficient contrast. Line height 1.5 for paragraphs, tighter for headings. Never center long text.

### 7. Color is quiet, accent is rare
The Paper canvas is warm off-white; surfaces are white; text is charcoal. Grape is for the primary action, active states and focus. Berry is for a single accent moment per screen (the status chip, a highlight) and for the pill. Semantic colors (success, warning, danger) appear only when meaning requires. Never two primary buttons on one surface.

### 8. Both themes are first-class
Dark is not inverted light. Shadows become darker and softer, borders become lighter than surfaces, the accent lifts to a lighter violet so it stays legible. Every component is checked in both themes before it is called done. The theme switch itself is designed.

### 9. Keyboard and screen reader complete
Everything reachable by Tab in a sensible order. Escape closes the topmost layer. Arrow keys move within menus, lists, tabs and the palette. Focus is visible and designed (not the browser default) and returns to the trigger when a layer closes. Every icon-only control has an accessible name. Live regions announce toasts. Contrast meets AA in both themes.

### 10. Mobile is a product, not a squeeze
Below 900 px the shell changes shape (top bar, drawer, bottom tabs), tables become card lists, sheets become bottom sheets, touch targets are 44 px minimum, and nothing requires hover. Interactions that use drag get a handle that works with touch. See `17-responsive.md`.

### 11. Performance is a feature
Transitions run on the compositor: transform and opacity only, `will-change` scoped to the animation, no `filter` on large surfaces, no layout thrash. Lists over 100 rows paginate or virtualize. The initial load shows faithful mode fast; Brandon's Mode may lazy-load behind the pill.

### 12. Copy is plain and short
Sentence case everywhere except proper nouns. No exclamation marks. No marketing adjectives. Buttons are verbs ("Add attendee", "Save changes", "Remove"). Empty states say what is missing and offer the one action that fixes it. Error messages say what happened and what to do. No em dashes anywhere; use a period, a comma, a colon or an interpunct (·).

## Anti-patterns you must avoid

- Fast snappy hovers (under 300 ms) or linear easing. The only allowed fast hovers are the ones `06-motion.md` names explicitly: menu items (120 ms), icon buttons (200 ms) and the pill's own scale (250 ms), because those are small targets where lag reads as unresponsiveness.
- Shimmer, glint or light-sweep effects on surfaces. (The pill is the single exception, defined in `06-motion.md`.)
- Hover backgrounds or cursor changes on non-interactive text.
- Pure white canvas, pure black text.
- Default browser focus rings, default form controls, default scrollbars inside custom panels without styling.
- Toasts that cover the pill, or stack without limit.
- Modals for things a side sheet handles (forms), side sheets for things a popover handles (a 3-item choice).
- Dropdown menus that open off-screen.
- Placeholder text as the only label on inputs.
- Lorem ipsum or "Title / Description goes here" copy anywhere in Brandon's Mode.
- Icons from more than one set, or icons with inconsistent stroke width.
- Animating `height: auto` with CSS (use GSAP or measure and tween).
- `transition: all`.
- Skipping the empty, loading, error or disabled state because the seeded data never hits it. Build it anyway; the user can empty any list.
- Em dashes.

## How to decide when the spec is silent

Ask, in order:

1. What would make this feel finished to a reviewer who clicks on it without reading any docs?
2. What would Linear or Stripe do here?
3. Does this choice hold up in dark mode, on a phone, with a keyboard, with 0 items and with 200 items?
4. Does it respect the motion rules and the copy rules?

Pick that. Log it in `decisions.md` in two or three lines. Keep going.

## Quality checks you run yourself

Before closing any view or component, open it and check, in both themes:

- Hover every interactive element. Does it respond slowly and smoothly, and does nothing non-interactive respond?
- Tab through it. Is the order sensible, is focus visible, does Escape work?
- Empty it. Fill it. Overflow it (long names, 200 rows, 0 rows).
- Resize from 1600 to 320. Does it reflow at the breakpoints in `17-responsive.md` with no horizontal scroll and no overlap?
- Trigger every toast, sheet, modal, menu. Do they open from where they came from, close on Escape and on backdrop click, and return focus?
- Read every string. Sentence case, no exclamation marks, no em dashes, no placeholders.
- Screenshot it and look at the PNG. Does it look like a shipped product?

If any answer is no, it is not done.
