# 08 · View · Event setup guide (`#guide`)

The home view and the direct counterpart of the Figma page. Reviewers will land here first after the transition, so it carries the landing beats and must be the most polished view.

## Layout (xl)

```
[ Event hero ]                                   (logo, title, date, location, chip, Edit event)
[ Section intro ]                                ("Event setup guide" + description)
[ Module: Attendee ]                             (accordion card with header + 3 steps)
```

Body padding per shell. Vertical gap 40 between the hero and the intro, 32 between intro and module.

## Event hero

Horizontal, gap 20, align start.

- **Logo** 96 x 96, `--r-lg`, `--shadow-2`, `object-fit: cover`. It is a button:
  - Hover: a dark overlay (`rgba(38,36,43,.45)`) fades in with a white camera icon (20) and `micro` "Change" below it; the logo lifts 2 px. Tooltip "Change event logo".
  - Click: opens the **Logo editor** modal (520): drop zone or "Choose image" (file input, `image/*`, max 8 MB; larger shows an inline error), preview square 280 x 280 with the image inside, zoom slider 1x to 3x (range input styled), drag to pan inside the square (pointer events; touch too), "Reset to default" ghost button, footer Cancel / "Save logo". Save renders a 512 x 512 PNG via canvas to a data URL stored on the event as `event.logo = { kind: 'custom', dataUrl }` (`16-data-model.md`); the hero, rail badge, sidebar, event switcher and portal preview all update (crossfade 240 ms). Default is the bundled RainFocus badge for the RainFocus event and a generated monogram for others.
- **Title block**, grows:
  - Event name as `display`. It is editable inline: hover shows a faint `--field` background with 6 px inset and a pencil icon at the right (`--muted`); click turns it into an input with the same typography, selects all; Enter commits, Escape cancels, blur commits; empty is invalid (border `--danger`, help "Event name is required", stays in edit). Commit saves to the store and flashes the border per `06-motion.md`.
  - Below (gap 6): "December 15, 2026" and "Lehi, Utah" on one line separated by an interpunct, `body` `--muted`. Formatted from the event's `startDate` and `location` in the event's timezone.
  - Below (gap 10): the **status chip**: dot + `micro` text. Computed from today's calendar date in the event's timezone against `startDate` and `endDate` (or `startDate` when `endDate` is null), in this order:
    1. today is before `startDate` → "N days out" where N is the whole-day difference, "1 day out" when N is 1 (berry);
    2. today equals `startDate` → "Today" (berry);
    3. today is after `startDate` and on or before `endDate` → "Live now" (success);
    4. otherwise → "Ended" (neutral `--field` fill, `--muted` text).
    Compute N by comparing calendar dates, not milliseconds, so timezones and DST cannot produce off-by-one results; `Intl.RelativeTimeFormat` is not needed. This chip pops in as a landing beat after the mode transition.
- **Edit event** primary button (`md`, icon `Pencil` leading). Opens the Event editor sheet.

Responsive: lg same; md and sm: the logo is 72, the title block wraps under nothing (stays beside the logo), the button moves to its own full-width row below; `display` 26 on sm.

### Event editor (side sheet, 560)
Title "Edit event" (or "Create event" from the switcher). Fields in order:
1. Event name (Input, required)
2. Logo (small preview 56 with "Change" ghost button opening the Logo editor)
3. Start date (DateField, required), End date (DateField, optional, must be ≥ start; blank means single day)
4. Location (Input, placeholder "City, State or venue", required)
5. Timezone (Select, list of 24 common IANA zones with city labels; default America/Denver for RainFocus Summit)
6. Currency (Select: USD, EUR, GBP, CAD, AUD)
7. Description (Textarea, optional, 280 chars max with counter)
Footer: "Cancel", primary "Save changes" (disabled until dirty and valid; loading 400 ms then success morph then the sheet closes 300 ms later). Unsaved-changes guard: closing with dirty state asks "Discard changes?" (Confirm: "Keep editing" / danger "Discard").

Validation inline, on blur and on submit. Changing the currency reformats every price in the app.

## Section intro

`h1` "Event setup guide", below it `body` `--muted`: "See the available list of modules below. We suggest that you start with the attendee module." (kept from the design). At the right of the title row, a `caption` `--muted` summary: "4 of 8 configured" that mirrors the module progress (useful when the module is collapsed).

## Module: Attendee

A card (`--surface`, `--line`, `--r-lg`, `--shadow-1`, padding 24). It is an accordion with one module (the design has one); the header is the toggle.

### Header
Horizontal, gap 20, align center.
- Person Portal icon 36 (the decoded three-color SVG; in dark theme keep its colors, it reads fine).
- Title block, grows: `h2` "Attendee"; below, gap 8, a row: `ProgressBar` (grape to berry gradient, 6 px, width 100%) and to its right a `caption` `--muted` "4 of 8 configured" (tabular). The bar's value animates on changes and as a landing beat.
- Chevron icon button at the right (`ChevronDown`, rotates 180° when open). Tooltip "Collapse" / "Expand". The whole header row is clickable (role button, aria-expanded) except the progress bar, which is non-interactive.
- Collapsed state persists per event in the store. Default open.

Progress counts configured items across the three steps: Step 1 items configured + workflows with status Live + experiences configured, out of the total count of those items. With seeded RainFocus data: 2 of 3 settings, 1 of 3 workflows Live, 1 of 2 experiences → "4 of 8 configured".

### Step 1 · Base settings
Label row (`title` "Step 1" in `--text` + `body-sm` `--muted` "Base settings"). Below, a bordered panel (`--surface` with a 1 px `--line` border and `--r-lg`, matching the design's row) containing a 3-column grid (gap 0; 1 px `--line` dividers between columns and between wrapped rows; at lg, when the panel is narrower than 840 px, two columns with the third item spanning both and carrying a top divider, per `17-responsive.md`) of **setting rows**, filling the full width (the composed version of the design's Step 1 row; no dead zone).

Each setting row: padding 16 20, min height 88, vertical: title row (`title` + status at right) and `body-sm` `--muted` description. Status: configured → check icon in `--success` with `micro` "Configured"; not configured → `micro` `--muted` "Not configured". Hover: `--surface-2` background, chevron (right edge, `--muted`) slides 2 px right. Click: opens the setting's sheet. Keyboard: row is a button.

The three settings (real names replace the design's placeholders):
1. **General** · "Event basics, capacity and registration window." Sheet fields: Event type (Select: Conference, Summit, Workshop, Meetup, Webinar), Capacity (NumberField, 1 to 100000), Registration opens (DateField), Registration closes (DateField, ≥ opens, ≤ event start), Attendee support email (Input, email validation). "Save" marks it configured (all required fields valid).
2. **Attendee attributes** · "Define the fields attendees fill in when they register." Sheet: a list of attribute rows (Label, Type select: Text / Email / Phone / Select / Checkbox, Required switch) with drag reorder (DragHandle), "Add attribute", remove per row (undo toast). Seeded with: Full name (Text, required), Email (Email, required), Company (Text), Job title (Text), Dietary needs (Select), Accessibility needs (Text). "Save" marks configured if at least Full name and Email exist and are required (enforced: those two cannot be removed; show a tooltip on their disabled remove buttons "Required by the registration form").
3. **Communications** · "Confirmation email and reminders." Sheet: Sender name (Input), Reply-to (Input, email), Confirmation subject (Input, default "You're registered for {event}"), Confirmation body (Textarea, with a `caption` note that `{first_name}` and `{event}` are replaced), Reminder switch "Send a reminder 1 day before" . "Save" marks configured when sender, reply-to and subject are valid.

Each sheet's footer: Cancel / primary "Save". A configured setting's sheet opens pre-filled; saving again is allowed. There is no "unconfigure" action by design; to see the unconfigured state use the Horizon event (seeded unconfigured) or Reset demo data.

Check mark animation on configure per `06-motion.md`.

### Step 2 · Build registration workflows
Label row: "Step 2" + "Build registration workflows". At the right: `caption` "3 workflows" and, when more than 6 exist, a ghost sm button "Show all" / "Show less" (expands with the collapse animation; state in `ui.guideShowAll`).

**Gate**: Step 2 is locked until General is configured. Locked state: the whole grid is wrapped in a group with `opacity: 0.55`, `pointer-events: none` on the cards, and a hovering `Tooltip` (anchored to the group, shown on hover anywhere over it and on focus of the group's single focusable "Locked" badge): "Configure general settings before creating registration workflows." (the design's own tooltip copy). A small lock badge (`Lock` icon + `micro` "Locked") sits at the right of the label row. Configuring General runs the unlock animation.

Grid: card grid (per `05-design-system.md` card grid rules). Cards 132 tall at xl (taller than the design's 120 to fit the status row), `--surface`, `--line`, `--r-lg`, `--shadow-1`, padding 20 24.

**Workflow card** (clickable, opens the Workflow editor):
- Top row: icon 20 in `--accent-ink` (`GitBranch` for the arrow feel, or keep the decoded logic-arrow recolored to `--accent-ink` via `currentColor` if you inline it as a component; either is fine, be consistent), title `title`, grows; at the right a `StatusDot` chip: Live (success) or Draft (neutral).
- Middle: `body-sm` `--muted` description, 2 lines max, truncating.
- Bottom row (`caption` `--muted`): attendee type name · "N steps" · "Updated 2 days ago".
- Hover (per `06-motion.md`): lift, and an action row fades in at the top right over the status chip: `IconButton` "Edit" (pencil) and a kebab `Menu`: Duplicate, Rename (inline on the title), Remove (danger). This is the design's hover state ("Edit" / "Use template") made real: "Use template" is what the Add card's picker does, so here the primary quick action is Edit.
- A `DragHandle` appears at the top left on hover (and is always visible with keyboard focus); drag reorders cards within the grid (dnd-kit sortable grid). Order persists.
- Remove: Confirm modal "Remove Employee Registration? Attendees already registered through it keep their records." → danger "Remove" → card exits, grid Flips, toast "Removed Employee Registration · Undo" (6 s).

**Add card**: dashed 1 px `--line-hover` border, no shadow, `--canvas`-colored background, centered `Plus` icon in a 36 px `--field` circle and `title` "Add registration workflow". Hover: background `--accent-soft`, the circle becomes `--accent` with a white plus. Click opens the **Template picker** modal (640): a 2-column grid of template tiles. Each tile: icon, name, one-line description, and the attendee type it will target in this event. Selecting a tile and pressing "Create workflow" (or double click) adds a Draft workflow with the template's name, type and steps, closes the modal, and the new card animates into the grid and briefly flashes. If a workflow with that name exists, suffix " 2".

Templates (name · description · target type · steps, in order). The target type is matched by name against the event's attendee types; when the event has no type of that name, the event's default type is used and the tile says so ("Uses Attendee, this event's default type"):
- Attendee · "General registration with package selection and payment." · Attendee · Details, Attendee type selection, Package selection, Payment, Confirmation
- Employee · "Internal registration, no payment." · Employee · Details, Sessions, Confirmation
- Staff · "Event staff with shift sessions." · Staff · Details, Sessions, Confirmation
- VIP · "Invited guests, complimentary, with session picks." · VIP · Details, Sessions, Confirmation
- Speaker · "Speakers confirm their sessions and details." · Speaker · Details, Sessions, Confirmation
- Exhibitor staff · "Booth staff registered by their company." · Exhibitor staff · Details, Confirmation
- Press · "Credentialed media, approval required." · Press · Details, Confirmation
- Start from scratch · "An empty workflow you build step by step." · the event's default type · (no steps; the card is created as Draft and the Workflow editor opens immediately so the user adds steps)
Workflow names are "<Template> Registration"; "Start from scratch" creates "New workflow". The `template` field stores the template name or null.

**Workflow editor** (side sheet, 560), title is the workflow name (editable inline in the sheet header):
1. Attendee type (Select from the event's types)
2. Status (SegmentedControl: Draft · Live). Going Live requires at least one step and a type; otherwise the control shows a tooltip and stays Draft.
3. Description (Textarea, 160 max)
4. Steps: a sortable list (DragHandle) of step rows (icon by kind, name, kind label). Kinds: Details, Attendee type selection, Package selection, Payment, Sessions, Confirmation. "Add step" opens a small Popover with the kinds not yet present. Each row has a remove icon button (no undo needed inside a draft; the sheet's Cancel discards everything).
5. Footer: Cancel / primary "Save". Dirty guard.

Seeded workflows for RainFocus: Attendee Registration (Live, type Attendee, 5 steps), Employee Registration (Draft, type Employee, 3 steps), Staff Registration (Draft, type Staff, 3 steps).

### Step 3 · Design post-registration experiences
Label row: "Step 3" + "Design post-registration experiences".

Two **experience cards** (same card anatomy as workflows, without drag and without status chip; instead a `micro` configured or not configured at the top right):
1. **Attendee Portal** (`Monitor` icon) · "Manage the portal that attendees will see after they've registered for your event." (typo from the design fixed here; faithful mode keeps the original text.) Click opens the **Portal preview** modal (840 wide, 90 vw on small screens): a device frame (rounded 12, `--line` border) showing a mini portal rendered from live data: event logo and name, date and location, "Your registration" card with the signed-in demo attendee (first seeded attendee), their type and package, a "Your sessions" list of 3 sessions from Content, and a footer. Light and dark follow the app theme. Below the frame: a settings strip with two switches, "Show agenda" and "Show networking", and a Select "Accent color" (grape, berry, teal, slate) that re-tints the preview live. "Save" marks the experience configured and persists the three settings. Footer: Close / Save.
2. **Attendee Calendar** (`CalendarRange` icon) · "Manage what the attendee can see on their personal event calendar." Click opens the **Calendar preview** modal (same frame): a month grid with the event day highlighted and, below, that day's sessions from Content as a time list; switches "Allow adding sessions to personal calendar" and "Show room names"; Select "First day of week" (Sunday, Monday). Save marks configured.

Both previews re-render when Content changes; they are a direct payoff for the Content view.

## Empty and edge states

- Event with no workflows: Step 2 shows only the Add card and a `caption` under the label "No workflows yet".
- Over 6 workflows: the grid shows 6 and "Show all" reveals the rest.
- A workflow whose attendee type was removed (types view reassignment keeps this consistent; if a type is reassigned, workflows pointing to it are moved to the replacement). Never show a dangling type name.
- Long workflow names: truncate with tooltip.
- Module collapsed: the intro's summary count still reads correctly.

## Landing beats after the mode transition

Only when the Guide view is the first view shown after entering Brandon's Mode: the progress bar draws from 0 to its value and the status chip pops, per `06-motion.md`. On subsequent visits to Guide (via nav) the bar animates from its previous value only if it changed.

## Seeded Guide state (RainFocus Summit)

- General: configured. Attendee attributes: configured. Communications: not configured.
- Workflows: Attendee Registration (Live), Employee Registration (Draft), Staff Registration (Draft).
- Experiences: Portal configured (Show agenda on, Show networking off, accent grape); Calendar not configured.
- Progress: 4 of 8.

Horizon Developer Days: nothing configured, one Draft workflow, Step 2 locked. Northwind Partner Forum: all three settings configured, three workflows of which two are Live and one Draft, both experiences configured. Progress 7 of 8 (3 settings + 2 Live + 2 experiences). See `16-data-model.md`.
