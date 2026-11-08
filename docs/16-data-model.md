# 16 · Data model and seed data

All data is local. The store (`03-architecture.md`) holds a record per event. Seed JSON is generated once by `scripts/generate-seed.mjs` (Faker, fixed seed `20261215`) and committed under `src/data/seed/`. The app never imports Faker.

## Entities (`src/store/types.ts`)

```ts
type Id = string;
type ISODate = string;      // '2026-12-15'
type ISODateTime = string;  // '2026-11-02T16:20:00.000Z'
type Swatch = 'grape' | 'berry' | 'amber' | 'teal' | 'sky' | 'lime' | 'plum' | 'slate';

interface EventRecord {
  id: Id; slug: string; name: string;
  startDate: ISODate; endDate: ISODate | null;
  location: string; timezone: string; currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  description: string;
  logo: { kind: 'bundled'; key: 'rainfocus' } | { kind: 'monogram'; letters: string; swatch: Swatch } | { kind: 'custom'; dataUrl: string };
  agenda: { startMinutes: number; endMinutes: number };   // 480 and 1080 for 8:00 to 18:00
  guide: GuideState;
  attendeeTypes: AttendeeType[];          // ordered
  attendees: Attendee[];
  packages: Package[];                    // ordered
  regCodes: RegCode[];                    // newest first
  discounts: Discount[];
  tracks: Track[];                        // ordered
  sessions: Session[];
  exhibitors: Exhibitor[];
  booths: Booth[];                        // fixed 24 per event
  moduleCollapsed: boolean;
}

interface GuideState {
  settings: {
    general: null | { eventType: string; capacity: number; registrationOpens: ISODate; registrationCloses: ISODate; supportEmail: string };
    attributes: null | { fields: Array<{ id: Id; label: string; type: 'text' | 'email' | 'phone' | 'select' | 'checkbox'; required: boolean }> };
    communications: null | { senderName: string; replyTo: string; subject: string; body: string; reminder: boolean };
  };
  workflows: Workflow[];                  // ordered
  experiences: {
    portal: null | { showAgenda: boolean; showNetworking: boolean; accent: 'grape' | 'berry' | 'teal' | 'slate' };
    calendar: null | { allowAdd: boolean; showRooms: boolean; firstDay: 'sunday' | 'monday' };
  };
}

interface Workflow {
  id: Id; name: string; description: string; attendeeTypeId: Id;
  status: 'draft' | 'live';
  steps: Array<{ id: Id; kind: 'details' | 'type' | 'package' | 'payment' | 'sessions' | 'confirmation'; name: string }>;
  template: string | null; updatedAt: ISODateTime;
}

interface AttendeeType { id: Id; name: string; description: string; swatch: Swatch; isDefault: boolean }

interface Attendee {
  id: Id; firstName: string; lastName: string; email: string; phone: string | null;
  company: string | null; jobTitle: string | null;
  attendeeTypeId: Id; packageId: Id | null; regCodeId: Id | null; exhibitorId: Id | null;
  status: 'registered' | 'pending' | 'waitlisted' | 'cancelled';
  registeredAt: ISODateTime; notes: string;
  activity: Array<{ id: Id; at: ISODateTime; text: string }>;   // newest first, max 50
}

interface Package {
  id: Id; name: string; priceMinor: number; capacity: number | null;
  status: 'draft' | 'active' | 'archived';
  description: string; includes: string[]; attendeeTypeIds: Id[];   // empty = all
}

interface RegCode {
  id: Id; code: string; label: string; type: 'comp' | 'discount' | 'access';
  discountId: Id | null; grantsTypeId: Id | null;
  maxUses: number | null; uses: number; expiresOn: ISODate | null; active: boolean; createdAt: ISODateTime;
}

interface Discount {
  id: Id; name: string; kind: 'percent' | 'fixed'; amount: number;   // percent 1..100, or minor units
  packageIds: Id[];   // empty = all
  startsOn: ISODate | null; endsOn: ISODate | null; limit: number | null; uses: number; active: boolean;
}

interface Track { id: Id; name: string; swatch: Swatch }

interface Session {
  id: Id; title: string; trackId: Id; date: ISODate; startMinutes: number; durationMinutes: number;
  speaker: null | { name: string; title: string };
  description: string; capacity: number | null; room: string | null; tags: string[];
}

interface Exhibitor {
  id: Id; name: string; tier: 'platinum' | 'gold' | 'silver'; status: 'confirmed' | 'pending' | 'cancelled';
  tagline: string; website: string | null; boothId: Id | null;
  contact: { name: string; email: string; phone: string | null }; notes: string;
}

interface Booth { id: Id; label: string; row: 'A' | 'B' | 'C' | 'D'; col: 1 | 2 | 3 | 4 | 5 | 6 }
```

Derived (selectors, never stored): attendee counts per type and package, sold per package, code status, discount status, guide progress, "days out", session overlap checks.

## Invariants the store enforces

- Exactly one attendee type `isDefault` per event; it cannot be removed.
- Removing a type reassigns attendees and workflows to a chosen type (never leaves dangling ids).
- Removing a package sets affected attendees' `packageId` to null only when sold = 0 (otherwise archiving is the only path).
- Removing a reg code nulls `regCodeId` on attendees and logs activity.
- Removing a discount nulls `discountId` on codes (they keep type `discount` and show the missing-discount warning).
- Removing a track is blocked while it has sessions.
- Sessions in the same track never overlap; the store rejects writes that would overlap and returns the conflicting session for the UI to name.
- Removing an exhibitor frees its booth and nulls `exhibitorId` on its staff.
- Every booth label is unique per event; an exhibitor has at most one booth; a booth has at most one exhibitor.
- Undo tokens restore list positions, not just records.

## Seed script rules (`scripts/generate-seed.mjs`)

- `faker.seed(20261215)`; use `@faker-js/faker` locale `en_US`.
- Output one JSON file per event in `src/data/seed/` plus an `index.json` listing them and the default `activeEventId`.
- People: `faker.person.firstName()` and `lastName()` with the full gender and ethnicity spread Faker gives; emails as `first.last@<company-domain>.example` (lowercase, deduplicated with a numeric suffix); companies from a curated list of 40 plausible fictional company names in the events and tech space (write them in the script; do not use Faker's company generator, which produces nonsense); job titles from a curated list of 30.
- Timestamps: the seed's "now" is `2026-11-07T18:00:00Z`. Registration dates spread over the 56 days before that with a mild ramp toward recent dates. Activity timestamps are after the registration date and before "now". At runtime, relative times are computed against the real current time, so they age naturally.
- Verify in the script: no session overlaps per track; package sold counts match the exact targets below; type counts sum to the attendee total; booth assignments are unique. Fail loudly if any check fails.
- Keep the generator deterministic: re-running it must produce identical files (commit the output; CI is not involved, but the Partner may re-run it).

## The three events

### 1. RainFocus Summit (default active)
- `slug: 'rainfocus-summit'`, Dec 15, 2026, single day, Lehi, Utah, America/Denver, USD, bundled logo.
- Description: "RainFocus's annual customer summit: product announcements, workshops and partner showcases."
- Guide: General configured (Summit, capacity 600, opens Sep 1, closes Dec 12, 2026, support `summit@rainfocus.example`); Attributes configured (the six seeded fields in `08-view-guide.md`); Communications null. Workflows and experiences per `08-view-guide.md`. Module expanded.
- Attendee types: the seven in `10-view-attendee-types.md`.
- Attendees: 240. Type distribution: Attendee 168, Speaker 14, VIP 9, Staff 18, Employee 16, Exhibitor staff 12, Press 3. Status: 168 Registered, 36 Pending, 24 Waitlisted, 12 Cancelled (status is independent of type, but VIPs and Speakers are all Registered). Packages exact: Full Conference 150, Expo Only 40, Workshop Day 30, VIP Experience 9, Press Pass 3, none 8. Reg codes: about 60% have one, consistent with each code's `uses` (the script sets `uses` to the actual count of attendees holding the code, except codes whose uses exceed attendee links, which represent public registrations; keep the table's seeded `uses` values from `12-view-reg-codes.md` and allow uses ≥ linked attendees). Exhibitor staff: 6 of the 12 linked to exhibitors.
- Packages: per `11-view-packages.md`.
- Reg codes: the 8 in `12-view-reg-codes.md`, `createdAt` spread over September and October 2026.
- Discounts: the 4 in `13-view-discounts.md`.
- Tracks and sessions: per `14-view-content.md`. Speakers (fictional): Priya Natarajan (CEO, RainFocus), Marcus Oyelaran (Head of Platform, Horizon Events), Elena Vasquez (Director of Attendee Experience, Meridian Conferences), Tomasz Lewandowski (Principal Engineer, Northwind Media), Aisha Rahman (Accessibility Lead, Brightline Labs), Daniel Kim (VP Partnerships, Summit Partners), Grace Okafor (Data Lead, Cascade Analytics), Jonah Feldman (Design Director, RainFocus), Sofia Marchetti (Product Manager, RainFocus), Liam Gallagher (Founder, Lumen AV).
- Exhibitors: 18 per `15-view-exhibitors.md`. Booths A1 to D6.

### 2. Horizon Developer Days
- `slug: 'horizon-dev-days'`, Feb 3 to Feb 4, 2027, Austin, Texas, America/Chicago, USD, monogram logo "HD" on teal.
- Description: "A two-day developer conference for the Horizon platform."
- Guide: nothing configured; one Draft workflow "Attendee Registration" (3 steps); experiences null. Step 2 is locked here (this is the event that demonstrates the gate).
- Types: Attendee (default, grape), Speaker (berry), Staff (teal). Attendees: 36 (Attendee 30, Speaker 4, Staff 2), mostly Pending (registration just opened). Packages: Developer Pass $299 (cap 300, Active, 28 sold), Workshop Add-on $99 (cap 60, Draft, 0). Reg codes: 2 (a speaker comp and an inactive test). Discounts: 1 (Early access 20%, active, window Jan 1 to Jan 31, 2027, scheduled). Tracks: Keynotes (grape), Sessions (sky), Labs (lime). Sessions: 6 on day 1 and 5 on day 2, no overlaps. Exhibitors: 5 (1 Platinum, 2 Gold, 2 Silver), 4 assigned.

### 3. Northwind Partner Forum
- `slug: 'northwind-partner-forum'`, Apr 22, 2027, Chicago, Illinois, America/Chicago, USD, monogram "NP" on plum.
- Description: "An invitation-only forum for Northwind's channel partners."
- Guide: all three settings configured; workflows Partner Registration (Live), Sponsor Registration (Live), Press Registration (Draft); both experiences configured. Progress 7 of 8.
- Types: Partner (default, plum), Sponsor (amber), Press (slate), Staff (teal). Attendees: 92. Packages: Partner Pass $0 (cap 150, Active), Sponsor Pass $2,500 (cap 20, Active, 14 sold), Press Pass $0 (unlimited, Active). Reg codes: 4. Discounts: 0 (the empty state is visible here). Tracks: Plenary (plum), Breakouts (amber). Sessions: 9. Exhibitors: 10 (all Gold or Platinum), all assigned, so 10 of the 24 booths are occupied and 14 are empty.

Every event has 24 booths A1 to D6.

## New event defaults

"Create event" (`07-shell.md`) builds an `EventRecord` from the editor's fields plus these defaults, which satisfy every invariant above:
- `logo`: `{ kind: 'monogram', letters, swatch }` where `letters` are the first letters of the first two words of the name (one letter if the name is one word), uppercase, and `swatch` is the first of the 8 swatches not used by another event's monogram. Monograms render per `05-design-system.md` "Text on swatches" (soft fill, ink text), including the seeded "HD" on teal and "NP" on plum.
- `agenda`: `{ startMinutes: 480, endMinutes: 1080 }` (8:00 to 18:00).
- `attendeeTypes`: one type, "Attendee", description "General admission attendees", swatch grape, `isDefault: true`.
- `tracks`: one track, "Main Stage", swatch grape.
- `booths`: the 24 booths A1 to D6.
- `guide`: all three settings null, no workflows, both experiences null. Step 2 is therefore locked on a new event.
- Everything else empty; `moduleCollapsed: false`.

## Fallbacks

- If `localStorage` is unavailable or throws (private mode, quota), the store runs in memory and shows a one-time toast "Changes won't be saved in this browser". Never crash.
- If the persisted `version` differs from the current, reseed and toast "Demo data was updated".
- If a persisted record fails validation (shape check on load), reseed that event only and log to the console with a warning (not an error; the console must stay free of errors).
