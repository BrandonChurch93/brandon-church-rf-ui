# 18 · Accessibility

Target: WCAG 2.2 AA across both modes, both themes, all breakpoints. The owner's background includes accessibility leadership; reviewers may tab through the app. This is part of every feature, not a pass at the end.

## Structure
- One `<main>` per layer; `<nav aria-label="Event navigation">` for the sidebar and drawer, `<nav aria-label="Sections">` for the bottom tabs. Headings in order: `h1` per view, `h2` for modules, `h3` for sheet titles and card groups. Never skip levels for styling; style with classes.
- A "Skip to content" link as the first focusable element in Brandon's Mode (visually hidden until focused), targeting the view's `<main>`.
- Landmarks: `banner` for the top bar on mobile. Sheets, modals, the palette and the drawer are dialogs (`role="dialog" aria-modal="true" aria-labelledby`), not landmarks.
- Live regions: one polite region for toasts and announcements (drag results, copy confirmations, "Saved"), one assertive region reserved for errors that block (rare).

## Keyboard
- Everything interactive is reachable with Tab in visual order; custom widgets follow the WAI-ARIA Authoring Practices patterns: menu button, listbox (Select), combobox, tabs, dialog, switch, checkbox, radio group (swatches), grid (agenda keyboard moves), slider (zoom), tooltip.
- Escape closes the topmost layer and returns focus to its trigger. Focus is trapped inside dialogs and the drawer.
- Roving tabindex in menus, lists, tabs, segmented controls and the palette; Home and End supported.
- Tables: header buttons for sort announce the direction (`aria-sort`); row selection checkboxes are labeled with the attendee's name; the bulk bar is announced when it appears.
- Drag and drop: dnd-kit keyboard sensor on every sortable with `announcements` customized to say what moved where ("Moved Employee Registration to position 2 of 3", "Moved Scaling live events to 10:15 AM in Workshop A").
- The pill: a real button with `aria-pressed` and a visible label; `aria-describedby` a visually hidden sentence "Switches between the original design and Brandon's Mode".
- No keyboard traps; no single-key shortcuts beyond `?` (which is ignored while typing in inputs).

## Screen readers
- Icon-only buttons have `aria-label`; decorative icons `aria-hidden`.
- Status chips include the status as text (not color only). Progress bars have `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and an `aria-label` ("Setup progress, 4 of 8 configured").
- The floor map: `role="group" aria-label="Floor map"`, each booth a focusable element with an accessible name ("Booth B4, Horizon, Gold, confirmed" or "Booth C2, empty, assign exhibitor").
- The agenda grid: each session block is a button with name "Opening keynote, 9:00 to 10:00 AM, Main Stage"; the grid lines and hour labels are presentational.
- Toasts: `role="status"`; undo buttons are labeled "Undo removing Jane Doe".
- Inline edit controls announce their editable state ("Event name, editable, press Enter to edit").
- Theme and reduce-motion controls announce their current value.

## Color and contrast
- Text contrast ≥ 4.5:1 (body) and ≥ 3:1 (large text ≥ 24 px or 19 px bold) in both themes. Tokens in `05-design-system.md` were chosen for this; verify with axe on every view in both themes.
- Non-text contrast ≥ 3:1 for control boundaries, focus rings, status dots against their background, progress fills against tracks.
- Never color alone: status has text or an icon; type swatches have the type name; the agenda's track color is paired with the track name.
- Focus ring color `--accent-ink` on both themes meets 3:1 against canvas, surface and side.

## Motion and vestibular safety
- `prefers-reduced-motion: reduce` and the user's setting disable transforms over 200 ms, parallax-like effects, the pill's beats and ring rotation, and replace the mode transition with a crossfade (`06-motion.md`).
- No flashing content. The pill's ripple and sweep are slow and low contrast.

## Forms
- Every input has a visible label (`<label for>`), help text linked via `aria-describedby`, errors linked via `aria-describedby` and `aria-invalid="true"`, and error text that says how to fix it.
- Required fields marked with text ("Required" in the label's `caption`), not only an asterisk.
- Validation on blur and submit; never on every keystroke except the live preview math which is not validation.
- Submit on Enter in single-line inputs; Textareas do not submit on Enter.

## Touch and pointer
- 44 px targets on touch; 24 px minimum on desktop (WCAG 2.5.8 at AA allows 24 with spacing).
- Drag has a keyboard alternative everywhere (above). Swipe gestures have button alternatives (close buttons).
- No hover-only content on touch devices.

## Text and zoom
- Layout survives 200% browser zoom (effectively 720 px wide at 1440): verify the lg and md layouts at zoom.
- Text can be resized; no fixed-height text containers that clip.
- `lang="en"` on the document.

## The a11y gate
`tests/gates/a11y.spec.ts` runs axe (`@axe-core/playwright`, WCAG 2.1 AA and 2.2 AA tags) on: faithful mode at 1447 and 390; Brandon's Mode on each of the eight views in both themes at 1447 and 390; with a sheet open (attendee detail), a modal open (confirm), a menu open (account), the palette open, and the drawer open. Zero `serious` or `critical` violations, with one scoped exception: on faithful mode the `color-contrast` rule is disabled, because the Figma's own `#777777` nav labels and search placeholder sit below AA on white and faithful mode must reproduce the design as given; this exception is logged in `decisions.md` and applies to nothing else. `moderate` ones must be reviewed and either fixed or listed with a justification in `decisions.md` (expect very few; color-contrast on `--muted` is the usual suspect and the tokens were tuned for it).
