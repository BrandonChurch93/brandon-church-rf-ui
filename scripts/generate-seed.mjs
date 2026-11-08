// Generates the seed data for the three events into src/data/seed/*.json.
// Deterministic: faker is seeded with 20261215 and every timestamp derives from SEED_NOW.
// Run with `npm run seed`. The output is committed; the app never imports faker.
import { fakerEN_US as faker } from '@faker-js/faker';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

faker.seed(20261215);

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'seed');
const SEED_NOW = Date.parse('2026-11-07T18:00:00Z');
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// ---------- curated lists ----------
const COMPANIES = [
  'Horizon Events', 'Meridian Conferences', 'Northwind Media', 'Brightline Labs', 'Summit Partners',
  'Cascade Analytics', 'Lumen AV', 'Atlas Venues', 'Bluefin Software', 'Copperleaf Group',
  'Driftwood Hospitality', 'Elevate Marketing', 'Foxglove Studios', 'Granite Peak Consulting', 'Harbor Health',
  'Ironbridge Financial', 'Juniper Learning', 'Keystone Logistics', 'Larkspur Retail', 'Monarch Biotech',
  'Nimbus Cloud', 'Oakline Partners', 'Pinecrest Education', 'Quarry Robotics', 'Redwood Insurance',
  'Saltwater Travel', 'Tidewater Energy', 'Upland Agency', 'Vantage Point Research', 'Willow Creative',
  'Yellowstone Outfitters', 'Zephyr Mobility', 'Arcadia Publishing', 'Beacon Security', 'Cobalt Systems',
  'Dovetail Associations', 'Evergreen Nonprofit Alliance', 'Fieldstone Manufacturing', 'Glacier Telecom', 'Highline Ventures',
];
const JOB_TITLES = [
  'Event Manager', 'Senior Event Manager', 'Director of Events', 'VP of Marketing', 'Marketing Manager',
  'Field Marketing Manager', 'Program Manager', 'Product Manager', 'Software Engineer', 'Senior Software Engineer',
  'Solutions Architect', 'Customer Success Manager', 'Account Executive', 'Sales Director', 'Operations Manager',
  'Registration Lead', 'Partner Manager', 'Community Manager', 'Content Strategist', 'Data Analyst',
  'Head of Partnerships', 'Chief Marketing Officer', 'Brand Manager', 'Experience Designer', 'IT Director',
  'Procurement Specialist', 'Communications Director', 'Training Coordinator', 'Exhibit Coordinator', 'Hospitality Manager',
];

// Faker's surname lists read as invented ("Pfannerstill", "Kuhic"); surnames come from common US surnames
// across origins instead, picked with faker's seeded RNG so the output stays deterministic.
const SURNAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez',
  'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes',
  'Fisher', 'Vasquez', 'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham', 'Reynolds',
  'Griffin', 'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant', 'Herrera', 'Gibson', 'Ellis',
  'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray', 'Ford', 'Castro', 'Marshall', 'Owens', 'Harrison',
  'Fernandez', 'McDonald', 'Woods', 'Washington', 'Kennedy', 'Wells', 'Vargas', 'Henry', 'Chen', 'Freeman',
  'Webb', 'Tucker', 'Guzman', 'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter', 'Gordon',
  'Mendez', 'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Munoz', 'Hunt', 'Hicks', 'Holmes',
  'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd', 'Rose', 'Stone', 'Salazar', 'Fox', 'Warren',
  'Mills', 'Meyer', 'Rice', 'Schmidt', 'Garza', 'Daniels', 'Ferguson', 'Nichols', 'Stephens', 'Soto',
  'Weaver', 'Ryan', 'Gardner', 'Payne', 'Grant', 'Dunn', 'Kelley', 'Spencer', 'Hawkins', 'Arnold',
  'Pierce', 'Vazquez', 'Hansen', 'Peters', 'Santos', 'Hart', 'Bradley', 'Knight', 'Elliott', 'Cunningham',
  'Duncan', 'Armstrong', 'Hudson', 'Carroll', 'Lane', 'Riley', 'Andrews', 'Ray', 'Berry', 'Perkins',
  'Hoffman', 'Johnston', 'Matthews', 'Pena', 'Richards', 'Contreras', 'Willis', 'Carpenter', 'Lawrence', 'Sandoval',
  'Wang', 'Li', 'Zhang', 'Liu', 'Huang', 'Shah', 'Singh', 'Kumar', 'Gupta', 'Desai',
  'Mehta', 'Rao', 'Iyer', 'Chowdhury', 'Tanaka', 'Sato', 'Suzuki', 'Nakamura', 'Yamamoto', 'Park',
  'Choi', 'Kang', 'Cho', 'Yoon', 'Pham', 'Le', 'Vu', 'Hoang', 'Dang', 'Okafor',
  'Adeyemi', 'Mensah', 'Owusu', 'Boateng', 'Abubakar', 'Haddad', 'Nasser', 'Khalil', 'Farah', 'Rahman',
  'Hussain', 'Ali', 'Khan', 'Cohen', 'Levy', 'Friedman', 'Novak', 'Kowalski', 'Nowak', 'Petrov',
  'Ivanova', 'Rossi', 'Russo', 'Romano', 'Bianchi', 'Moretti', 'Dubois', 'Laurent', 'Lefebvre', 'Bernard',
  'Muller', 'Schneider', 'Fischer', 'Weber', 'Becker', 'Schulz', 'Larsen', 'Nielsen', 'Johansson', 'Lindqvist',
  "O'Brien", 'Byrne', 'Walsh', 'Doyle', 'Gallagher',
];
const lastName = () => faker.helpers.arrayElement(SURNAMES);

const domainOf = (company) => company.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '') + '.example';
const slugify = (s) => s.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const iso = (ms) => new Date(ms).toISOString();

function makeEmailFactory() {
  const used = new Set();
  return (first, last, company) => {
    const base = `${slugify(first).replace(/-/g, '')}.${slugify(last).replace(/-/g, '')}`;
    const domain = domainOf(company);
    let email = `${base}@${domain}`;
    let n = 2;
    while (used.has(email)) email = `${base}${n++}@${domain}`;
    used.add(email);
    return email;
  };
}

function phone() {
  return faker.datatype.boolean({ probability: 0.7 })
    ? `(${faker.number.int({ min: 201, max: 989 })}) ${faker.number.int({ min: 200, max: 989 })}-${String(faker.number.int({ min: 0, max: 9999 })).padStart(4, '0')}`
    : null;
}

// Registration timestamps across the 56 days before SEED_NOW with a mild ramp toward recent dates.
function registrationTimes(count, spanDays = 56) {
  const times = [];
  for (let i = 0; i < count; i++) {
    const u = faker.number.float({ min: 0, max: 1 });
    const daysAgo = spanDays * (1 - Math.sqrt(u)); // density rises toward recent dates
    const t = SEED_NOW - daysAgo * DAY - faker.number.int({ min: 30, max: 600 }) * MINUTE;
    times.push(Math.round(t / MINUTE) * MINUTE);
  }
  return times.sort((a, b) => a - b);
}

function booths(prefix) {
  const list = [];
  for (const row of ['A', 'B', 'C', 'D']) {
    for (let col = 1; col <= 6; col++) list.push({ id: `${prefix}-booth-${row}${col}`, label: `${row}${col}`, row, col });
  }
  return list;
}

const STEP_NAMES = {
  details: 'Details',
  type: 'Attendee type selection',
  package: 'Package selection',
  payment: 'Payment',
  sessions: 'Sessions',
  confirmation: 'Confirmation',
};
function steps(prefix, kinds) {
  return kinds.map((kind, i) => ({ id: `${prefix}-step-${i + 1}`, kind, name: STEP_NAMES[kind] }));
}

const ATTRIBUTE_FIELDS = (prefix) => [
  { id: `${prefix}-attr-1`, label: 'Full name', type: 'text', required: true },
  { id: `${prefix}-attr-2`, label: 'Email', type: 'email', required: true },
  { id: `${prefix}-attr-3`, label: 'Company', type: 'text', required: false },
  { id: `${prefix}-attr-4`, label: 'Job title', type: 'text', required: false },
  { id: `${prefix}-attr-5`, label: 'Dietary needs', type: 'select', required: false },
  { id: `${prefix}-attr-6`, label: 'Accessibility needs', type: 'text', required: false },
];

function hm(h, m = 0) {
  return h * 60 + m;
}

function fail(msg) {
  console.error(`Seed check failed: ${msg}`);
  process.exit(1);
}

// Builds attendees from an ordered list of "slots" (type, package, status, code, company override...).
function buildAttendees(prefix, slots, opts) {
  const emailFor = makeEmailFactory();
  const times = registrationTimes(slots.length, opts.spanDays);
  // Slots that require early registration (early bird code) take the earliest times.
  const order = slots.map((s, i) => i).sort((a, b) => Number(Boolean(slots[b].early)) - Number(Boolean(slots[a].early)));
  const timeFor = new Map();
  const earlyCount = slots.filter((s) => s.early).length;
  const earlyTimes = times.slice(0, earlyCount);
  const lateTimes = faker.helpers.shuffle(times.slice(earlyCount));
  const earlyShuffled = faker.helpers.shuffle(earlyTimes);
  let ei = 0;
  let li = 0;
  for (const idx of order) timeFor.set(idx, slots[idx].early ? earlyShuffled[ei++] : lateTimes[li++]);

  return slots.map((slot, i) => {
    const first = slot.firstName ?? faker.person.firstName();
    const last = slot.lastName ?? lastName();
    const company = slot.company ?? faker.helpers.arrayElement(COMPANIES);
    const jobTitle = slot.jobTitle ?? faker.helpers.arrayElement(JOB_TITLES);
    const registeredAt = timeFor.get(i);
    const id = `${prefix}-att-${String(i + 1).padStart(3, '0')}`;
    const activity = [];
    let t = registeredAt;
    activity.push({ at: t, text: slot.registeredVia });
    if (slot.codeLabel) {
      activity.push({ at: t + MINUTE, text: `Reg code ${slot.codeLabel} applied` });
    }
    const extra = faker.number.int({ min: 0, max: 2 });
    const room = Math.max(MINUTE * 10, SEED_NOW - registeredAt - HOUR);
    if (slot.status !== 'pending' && slot.status !== 'waitlisted') {
      activity.push({ at: t + faker.number.int({ min: 2, max: 9 }) * MINUTE, text: 'Confirmation email sent' });
    }
    if (extra >= 1 && slot.packageName) {
      t = registeredAt + Math.round(faker.number.float({ min: 0.3, max: 0.9 }) * room);
      activity.push({ at: t, text: `Package changed to ${slot.packageName}` });
    }
    if (slot.status === 'cancelled') {
      activity.push({ at: registeredAt + Math.round(0.95 * room), text: 'Registration cancelled' });
    } else if (slot.status === 'waitlisted') {
      activity.push({ at: registeredAt + 5 * MINUTE, text: 'Added to the waitlist' });
    }
    const trimmed = activity.slice(0, 4);
    trimmed.sort((a, b) => b.at - a.at);
    return {
      id,
      firstName: first,
      lastName: last,
      email: slot.email ?? emailFor(first, last, company),
      phone: phone(),
      company,
      jobTitle,
      attendeeTypeId: slot.typeId,
      packageId: slot.packageId,
      regCodeId: slot.regCodeId ?? null,
      exhibitorId: slot.exhibitorId ?? null,
      status: slot.status,
      registeredAt: iso(registeredAt),
      notes: slot.notes ?? '',
      activity: trimmed.map((a, k) => ({ id: `${id}-act-${k + 1}`, at: iso(Math.min(a.at, SEED_NOW - MINUTE)), text: a.text })),
    };
  });
}

function assertNoOverlaps(event) {
  const byTrack = new Map();
  for (const s of event.sessions) {
    const key = `${s.trackId}|${s.date}`;
    if (!byTrack.has(key)) byTrack.set(key, []);
    byTrack.get(key).push(s);
  }
  for (const [key, list] of byTrack) {
    list.sort((a, b) => a.startMinutes - b.startMinutes);
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      if (prev.startMinutes + prev.durationMinutes > list[i].startMinutes) fail(`${event.slug}: overlap in ${key}: ${prev.title} / ${list[i].title}`);
    }
    for (const s of list) {
      if (s.startMinutes < event.agenda.startMinutes || s.startMinutes + s.durationMinutes > event.agenda.endMinutes) fail(`${event.slug}: ${s.title} outside agenda`);
    }
  }
}

function assertBooths(event) {
  const seen = new Set();
  for (const ex of event.exhibitors) {
    if (!ex.boothId) continue;
    if (seen.has(ex.boothId)) fail(`${event.slug}: booth ${ex.boothId} assigned twice`);
    if (!event.booths.some((b) => b.id === ex.boothId)) fail(`${event.slug}: unknown booth ${ex.boothId}`);
    seen.add(ex.boothId);
  }
  if (event.booths.length !== 24) fail(`${event.slug}: expected 24 booths`);
}

function countBy(list, key) {
  const m = {};
  for (const x of list) m[x[key] ?? 'none'] = (m[x[key] ?? 'none'] ?? 0) + 1;
  return m;
}

// =====================================================================================
// 1. RainFocus Summit
// =====================================================================================
function rainfocusSummit() {
  const P = 'rfs';
  const type = (k) => `${P}-type-${k}`;
  const attendeeTypes = [
    { id: type('attendee'), name: 'Attendee', description: 'General admission attendees', swatch: 'grape', isDefault: true },
    { id: type('speaker'), name: 'Speaker', description: 'Presenting at one or more sessions', swatch: 'berry', isDefault: false },
    { id: type('vip'), name: 'VIP', description: 'Sponsors, partners and invited guests', swatch: 'amber', isDefault: false },
    { id: type('staff'), name: 'Staff', description: 'RainFocus event staff', swatch: 'teal', isDefault: false },
    { id: type('employee'), name: 'Employee', description: 'RainFocus employees attending', swatch: 'sky', isDefault: false },
    { id: type('exhibitor-staff'), name: 'Exhibitor staff', description: 'Booth staff for exhibitors', swatch: 'plum', isDefault: false },
    { id: type('press'), name: 'Press', description: 'Media and analysts', swatch: 'slate', isDefault: false },
  ];

  const pkg = (k) => `${P}-pkg-${k}`;
  const packages = [
    { id: pkg('full'), name: 'Full Conference', priceMinor: 89900, capacity: 400, status: 'active', description: 'Two days of sessions, workshops and the evening reception.', includes: ['All sessions', 'Workshops', 'Lunch both days', 'Evening reception', 'Recording access'], attendeeTypeIds: [] },
    { id: pkg('expo'), name: 'Expo Only', priceMinor: 14900, capacity: 600, status: 'active', description: 'Access to the expo floor and keynotes.', includes: ['Expo floor', 'Keynotes'], attendeeTypeIds: [] },
    { id: pkg('workshop'), name: 'Workshop Day', priceMinor: 39900, capacity: 40, status: 'active', description: 'Hands-on workshop track.', includes: ['Workshops', 'Lunch', 'Recording access'], attendeeTypeIds: [type('attendee'), type('employee')] },
    { id: pkg('vip'), name: 'VIP Experience', priceMinor: 189900, capacity: 10, status: 'active', description: 'Front-row seating, speaker dinner and lounge access.', includes: ['All sessions', 'Workshops', 'Speaker dinner', 'VIP lounge', 'Priority seating', 'Recording access', 'Reserved parking'], attendeeTypeIds: [type('vip')] },
    { id: pkg('student'), name: 'Student', priceMinor: 0, capacity: 60, status: 'draft', description: 'Complimentary access for verified students.', includes: ['Keynotes', 'Expo floor'], attendeeTypeIds: [] },
    { id: pkg('press'), name: 'Press Pass', priceMinor: 0, capacity: null, status: 'archived', description: 'Credentialed media.', includes: ['All sessions', 'Press room'], attendeeTypeIds: [type('press')] },
  ];
  const pkgName = Object.fromEntries(packages.map((p) => [p.id, p.name]));

  const disc = (k) => `${P}-disc-${k}`;
  const discounts = [
    { id: disc('early'), name: 'Early bird', kind: 'percent', amount: 25, packageIds: [pkg('full'), pkg('workshop')], startsOn: '2026-09-01', endsOn: '2026-11-01', limit: 100, uses: 61, active: false },
    { id: disc('partner'), name: 'Partner', kind: 'percent', amount: 15, packageIds: [], startsOn: null, endsOn: null, limit: null, uses: 22, active: true },
    { id: disc('team'), name: 'Team of five', kind: 'fixed', amount: 10000, packageIds: [pkg('full')], startsOn: '2026-11-01', endsOn: '2026-12-10', limit: null, uses: 8, active: true },
    { id: disc('student'), name: 'Student verification', kind: 'percent', amount: 100, packageIds: [pkg('student')], startsOn: null, endsOn: null, limit: null, uses: 0, active: true },
  ];

  const code = (k) => `${P}-code-${k}`;
  const regCodes = [
    { id: code('test'), code: 'RF-TEST-0001', label: 'QA test code', type: 'comp', discountId: null, grantsTypeId: null, maxUses: 1, uses: 0, expiresOn: null, active: false, createdAt: '2026-10-28T16:05:00.000Z' },
    { id: code('team'), code: 'RF-TEAM-OFFSITE', label: 'Internal team', type: 'comp', discountId: null, grantsTypeId: null, maxUses: 12, uses: 12, expiresOn: null, active: true, createdAt: '2026-10-19T15:40:00.000Z' },
    { id: code('press'), code: 'RF-PRESS-26', label: 'Press access', type: 'access', discountId: null, grantsTypeId: type('press'), maxUses: 20, uses: 3, expiresOn: '2026-12-15', active: true, createdAt: '2026-10-09T17:20:00.000Z' },
    { id: code('staff'), code: 'RF-STAFF-ALL', label: 'Staff access', type: 'access', discountId: null, grantsTypeId: type('staff'), maxUses: 25, uses: 18, expiresOn: null, active: true, createdAt: '2026-09-30T14:10:00.000Z' },
    { id: code('partner'), code: 'RF-PARTNER-15', label: 'Partner 15%', type: 'discount', discountId: disc('partner'), grantsTypeId: null, maxUses: null, uses: 22, expiresOn: null, active: true, createdAt: '2026-09-21T19:00:00.000Z' },
    { id: code('early'), code: 'RF-EARLY-25', label: 'Early bird 25%', type: 'discount', discountId: disc('early'), grantsTypeId: null, maxUses: 100, uses: 61, expiresOn: '2026-11-01', active: true, createdAt: '2026-09-08T16:30:00.000Z' },
    { id: code('vip'), code: 'RF-VIP-GOLD', label: 'VIP guest comp', type: 'comp', discountId: null, grantsTypeId: null, maxUses: 10, uses: 9, expiresOn: null, active: true, createdAt: '2026-09-04T18:45:00.000Z' },
    { id: code('spkr'), code: 'RF-SPKR-2026', label: 'Speaker comp', type: 'comp', discountId: null, grantsTypeId: null, maxUses: 30, uses: 14, expiresOn: '2026-12-14', active: true, createdAt: '2026-09-02T15:15:00.000Z' },
  ];
  const codeLabel = Object.fromEntries(regCodes.map((c) => [c.id, c.code]));

  const track = (k) => `${P}-track-${k}`;
  const tracks = [
    { id: track('main'), name: 'Main Stage', swatch: 'grape' },
    { id: track('wa'), name: 'Workshop A', swatch: 'teal' },
    { id: track('wb'), name: 'Workshop B', swatch: 'amber' },
  ];

  const SPEAKERS = {
    priya: { name: 'Priya Natarajan', title: 'CEO, RainFocus' },
    marcus: { name: 'Marcus Oyelaran', title: 'Head of Platform, Horizon Events' },
    elena: { name: 'Elena Vasquez', title: 'Director of Attendee Experience, Meridian Conferences' },
    tomasz: { name: 'Tomasz Lewandowski', title: 'Principal Engineer, Northwind Media' },
    aisha: { name: 'Aisha Rahman', title: 'Accessibility Lead, Brightline Labs' },
    daniel: { name: 'Daniel Kim', title: 'VP Partnerships, Summit Partners' },
    grace: { name: 'Grace Okafor', title: 'Data Lead, Cascade Analytics' },
    jonah: { name: 'Jonah Feldman', title: 'Design Director, RainFocus' },
    sofia: { name: 'Sofia Marchetti', title: 'Product Manager, RainFocus' },
    liam: { name: 'Liam Gallagher', title: 'Founder, Lumen AV' },
  };
  let sn = 0;
  const session = (trackKey, title, start, duration, speaker, extra = {}) => ({
    id: `${P}-session-${String(++sn).padStart(2, '0')}`,
    title,
    trackId: track(trackKey),
    date: '2026-12-15',
    startMinutes: start,
    durationMinutes: duration,
    speaker: speaker ? SPEAKERS[speaker] : null,
    description: extra.description ?? '',
    capacity: extra.capacity ?? null,
    room: extra.room ?? null,
    tags: extra.tags ?? [],
  });
  const sessions = [
    session('main', 'Registration and coffee', hm(8), 60, null, { room: 'Lobby', tags: ['Networking'], description: 'Pick up your badge, grab a coffee and meet other attendees before the keynote.' }),
    session('main', 'Opening keynote', hm(9), 60, 'priya', { room: 'Ballroom A', tags: ['Keynote'], description: 'Where RainFocus is headed next, and the launches that will shape your events in 2027.' }),
    session('main', 'The next decade of live events', hm(10, 15), 45, 'elena', { room: 'Ballroom A', tags: ['Keynote'], description: 'What attendees will expect from in-person events over the next ten years, and how to get ahead of it.' }),
    session('main', 'Partner showcase', hm(11, 15), 45, 'daniel', { room: 'Ballroom A', tags: ['Product'], description: 'Short demos from partners building on the RainFocus platform.' }),
    session('main', 'Lunch', hm(12), 75, null, { room: 'Terrace Hall', tags: ['Networking'], description: 'Lunch is served on the terrace. Dietary options are labeled.' }),
    session('main', 'Fireside chat: measuring event ROI', hm(13, 30), 45, 'grace', { room: 'Ballroom A', tags: ['Product'], description: 'A candid conversation about the metrics that actually predict pipeline from events.' }),
    session('main', 'Closing keynote', hm(16, 30), 60, 'priya', { room: 'Ballroom A', tags: ['Keynote'], description: 'A look back at the day and a preview of the roadmap.' }),
    session('main', 'Evening reception', hm(17, 30), 30, null, { room: 'Terrace', tags: ['Networking'], description: 'Drinks and conversation to close out the summit.' }),
    session('wa', 'Building registration flows that convert', hm(9), 90, 'marcus', { room: 'Workshop Room A', capacity: 40, tags: ['Workshop'], description: 'Build a registration workflow from scratch and test it against real conversion data.' }),
    session('wa', 'Designing attendee journeys', hm(10, 45), 60, 'jonah', { room: 'Workshop Room A', capacity: 40, tags: ['Workshop'], description: 'Map the attendee experience from invitation to follow-up, and find the moments that matter.' }),
    session('wa', 'Accessibility for event sites', hm(13, 30), 60, 'aisha', { room: 'Workshop Room A', capacity: 40, tags: ['Workshop'], description: 'Practical checks that make registration and portal pages work for every attendee.' }),
    session('wa', 'Hands-on: the attendee portal', hm(15), 90, 'sofia', { room: 'Workshop Room A', capacity: 40, tags: ['Workshop', 'Product'], description: 'Configure an attendee portal end to end, with agenda, networking and personal calendars.' }),
    session('wb', 'Data hygiene for large events', hm(9), 60, 'tomasz', { room: 'Workshop Room B', capacity: 40, tags: ['Workshop'], description: 'Deduplicate, validate and enrich attendee records before they reach your CRM.' }),
    session('wb', 'Sponsorship packages that sell', hm(10, 15), 90, 'liam', { room: 'Workshop Room B', capacity: 40, tags: ['Workshop'], description: 'Design sponsor tiers with clear value, and price them so they sell out.' }),
  ];

  // ---- exhibitors ----
  const ex = (k) => `${P}-ex-${k}`;
  const booth = (label) => `${P}-booth-${label}`;
  const exhibitorDefs = [
    ['Checkpoint Kiosks', 'platinum', 'confirmed', 'Attendee check-in hardware', 'D3', 'Nadia Brooks'],
    ['Lumen AV', 'platinum', 'confirmed', 'Stage audio, lighting and video', 'D2', 'Liam Gallagher'],
    ['Leadline', 'platinum', 'confirmed', 'Lead retrieval for booth teams', 'D4', 'Owen Mercer'],
    ['Badgecraft', 'gold', 'confirmed', 'On-demand badge printing', 'C3', 'Priscilla Huang'],
    ['Tablefare Catering', 'gold', 'confirmed', 'Event catering for groups of any size', 'C4', 'Marco Bellini'],
    ['Wayfare Travel', 'gold', 'confirmed', 'Group travel and room blocks', 'D1', 'Hannah Osei'],
    ['Signal Insights', 'gold', 'confirmed', 'Event analytics and attribution', 'C2', 'Ravi Kapoor'],
    ['Streamwise', 'gold', 'confirmed', 'Live streaming for hybrid sessions', 'C5', 'Julia Novak'],
    ['Meetwell', 'gold', 'confirmed', 'Attendee networking app', 'D6', 'Camille Laurent'],
    ['Stagehand Rentals', 'gold', 'cancelled', 'Furniture and staging rental', 'C1', 'Derek Yamamoto'],
    ['Swagsmith', 'silver', 'confirmed', 'Branded merchandise and swag', 'A2', 'Tessa Whitfield'],
    ['Sentinel Event Security', 'silver', 'confirmed', 'Venue security and crowd management', 'A5', 'Marcus Reyes'],
    ['Framelight Photo', 'silver', 'confirmed', 'Event photography and headshots', 'B1', 'Ines Duarte'],
    ['Venuelink Wifi', 'silver', 'confirmed', 'Temporary venue wifi', 'B3', 'Arjun Mehta'],
    ['Polyglot Live', 'silver', 'confirmed', 'Live translation and captions', 'B4', 'Sophie Lindqvist'],
    ['Appetize Events', 'silver', 'confirmed', 'Branded event mobile apps', 'B6', 'Kofi Mensah'],
    ['Signpost Displays', 'silver', 'pending', 'Digital and printed signage', null, 'Grace Whelan'],
    ['Coverall Insurance', 'silver', 'pending', 'Event cancellation insurance', null, 'Peter Lindholm'],
  ];
  const exhibitors = exhibitorDefs.map(([name, tier, status, tagline, boothLabel, contactName], i) => {
    const [first, last] = contactName.split(' ');
    const domain = domainOf(name);
    return {
      id: ex(String(i + 1).padStart(2, '0')),
      name,
      tier,
      status,
      tagline,
      website: `https://${domain.replace('.example', '')}.example`,
      boothId: boothLabel ? booth(boothLabel) : null,
      contact: { name: contactName, email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`, phone: phone() },
      notes: '',
    };
  });

  // ---- attendee slots ----
  const slots = [];
  const push = (n, base) => {
    for (let i = 0; i < n; i++) slots.push({ ...base });
  };
  // Speakers: the ten named speakers plus four more. All Registered, all Full Conference, all on the speaker comp.
  const named = Object.values(SPEAKERS);
  for (let i = 0; i < 14; i++) {
    const sp = named[i];
    const [title, company] = sp ? sp.title.split(', ') : [null, null];
    slots.push({
      typeId: type('speaker'),
      packageId: pkg('full'),
      status: 'registered',
      regCodeId: code('spkr'),
      registeredVia: 'Imported from the speaker list',
      firstName: sp ? sp.name.split(' ')[0] : undefined,
      lastName: sp ? sp.name.split(' ').slice(1).join(' ') : undefined,
      company: company ?? undefined,
      jobTitle: title ?? undefined,
    });
  }
  // VIP: 9, VIP Experience, VIP code, Registered.
  push(9, { typeId: type('vip'), packageId: pkg('vip'), status: 'registered', regCodeId: code('vip'), registeredVia: 'Registered via Attendee Registration' });
  // Press: 3, Press Pass, press code.
  push(3, { typeId: type('press'), packageId: pkg('press'), regCodeId: code('press'), registeredVia: 'Registered via Attendee Registration' });
  // Staff: 18, staff code, RainFocus.
  push(18, { typeId: type('staff'), regCodeId: code('staff'), company: 'RainFocus', registeredVia: 'Registered via Staff Registration' });
  // Employees: 16, 12 on the team offsite code, RainFocus.
  push(12, { typeId: type('employee'), regCodeId: code('team'), company: 'RainFocus', registeredVia: 'Registered via Employee Registration' });
  push(4, { typeId: type('employee'), company: 'RainFocus', registeredVia: 'Registered via Employee Registration' });
  // Exhibitor staff: 12, six linked to Platinum and Gold exhibitors.
  const linkTo = [ex('01'), ex('02'), ex('03'), ex('04'), ex('05'), ex('07')];
  for (let i = 0; i < 12; i++) {
    const exId = linkTo[i];
    const exName = exId ? exhibitors.find((e) => e.id === exId).name : undefined;
    slots.push({ typeId: type('exhibitor-staff'), exhibitorId: exId ?? null, company: exName, jobTitle: exId ? 'Exhibit Coordinator' : undefined, registeredVia: 'Registered by their exhibitor' });
  }
  // Attendees: 168. 61 on the early bird code (registered early), 22 on the partner code.
  push(61, { typeId: type('attendee'), regCodeId: code('early'), early: true, registeredVia: 'Registered via Attendee Registration' });
  push(22, { typeId: type('attendee'), regCodeId: code('partner'), registeredVia: 'Registered via Attendee Registration' });
  push(168 - 61 - 22, { typeId: type('attendee'), registeredVia: 'Registered via Attendee Registration' });

  // Packages for slots without one yet: Workshop Day 30 (24 Attendee + 6 Employee), none 8 (Staff), rest Full 150 / Expo 40.
  const needPkg = (pred) => slots.filter((s) => s.packageId === undefined && pred(s));
  const assign = (list, n, packageId) => {
    const picks = faker.helpers.shuffle(list).slice(0, n);
    if (picks.length !== n) fail(`not enough slots for ${packageId}`);
    for (const s of picks) s.packageId = packageId;
  };
  assign(needPkg((s) => s.typeId === type('attendee')), 24, pkg('workshop'));
  assign(needPkg((s) => s.typeId === type('employee')), 6, pkg('workshop'));
  assign(needPkg((s) => s.typeId === type('staff')), 8, null);
  const fullSoFar = slots.filter((s) => s.packageId === pkg('full')).length;
  assign(needPkg(() => true), 40, pkg('expo'));
  const rest = needPkg(() => true);
  for (const s of rest) s.packageId = pkg('full');
  if (fullSoFar + rest.length !== 150) fail(`Full Conference would be ${fullSoFar + rest.length}`);

  // Status: Speakers and VIPs registered. Others fill 168/36/24/12 overall.
  const statusTargets = { registered: 168, pending: 36, waitlisted: 24, cancelled: 12 };
  const preset = slots.filter((s) => s.status).length;
  statusTargets.registered -= preset;
  const open = faker.helpers.shuffle(slots.filter((s) => !s.status));
  let k = 0;
  for (const [status, n] of Object.entries(statusTargets)) for (let i = 0; i < n; i++) open[k++].status = status;
  if (k !== open.length) fail('status targets do not cover every attendee');

  for (const s of slots) {
    s.packageName = s.packageId ? pkgName[s.packageId] : null;
    s.codeLabel = s.regCodeId ? codeLabel[s.regCodeId] : null;
  }
  const attendees = buildAttendees(P, faker.helpers.shuffle(slots), { spanDays: 56 });
  // Notes on a few attendees so the detail sheet has realistic content.
  const noteTexts = ['Requested a vegetarian lunch.', 'Arriving after the opening keynote.', 'Needs an accessible seat near the aisle.', 'Bringing two colleagues next year.', 'Asked for an invoice in their company name.'];
  for (let i = 0; i < noteTexts.length; i++) attendees[i * 37].notes = noteTexts[i];
  // Newest first, matching the table's default sort.
  attendees.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));

  const workflows = [
    { id: `${P}-wf-attendee`, name: 'Attendee Registration', description: 'General registration with package selection and payment.', attendeeTypeId: type('attendee'), status: 'live', steps: steps(`${P}-wf-attendee`, ['details', 'type', 'package', 'payment', 'confirmation']), template: 'Attendee', updatedAt: '2026-11-05T17:12:00.000Z' },
    { id: `${P}-wf-employee`, name: 'Employee Registration', description: 'Internal registration for RainFocus employees, no payment.', attendeeTypeId: type('employee'), status: 'draft', steps: steps(`${P}-wf-employee`, ['details', 'sessions', 'confirmation']), template: 'Employee', updatedAt: '2026-11-03T20:40:00.000Z' },
    { id: `${P}-wf-staff`, name: 'Staff Registration', description: 'Event staff choose their shift sessions.', attendeeTypeId: type('staff'), status: 'draft', steps: steps(`${P}-wf-staff`, ['details', 'sessions', 'confirmation']), template: 'Staff', updatedAt: '2026-10-29T15:05:00.000Z' },
  ];

  const event = {
    id: `evt-rainfocus-summit`,
    slug: 'rainfocus-summit',
    name: 'RainFocus Summit',
    startDate: '2026-12-15',
    endDate: null,
    location: 'Lehi, Utah',
    timezone: 'America/Denver',
    currency: 'USD',
    description: "RainFocus's annual customer summit: product announcements, workshops and partner showcases.",
    logo: { kind: 'bundled', key: 'rainfocus' },
    agenda: { startMinutes: 480, endMinutes: 1080 },
    guide: {
      settings: {
        general: { eventType: 'Summit', capacity: 600, registrationOpens: '2026-09-01', registrationCloses: '2026-12-12', supportEmail: 'summit@rainfocus.example' },
        attributes: { fields: ATTRIBUTE_FIELDS(P) },
        communications: null,
      },
      workflows,
      experiences: { portal: { showAgenda: true, showNetworking: false, accent: 'grape' }, calendar: null },
    },
    attendeeTypes,
    attendees,
    packages,
    regCodes,
    discounts,
    tracks,
    sessions,
    exhibitors,
    booths: booths(P),
    moduleCollapsed: false,
  };

  // ---- checks ----
  const byType = countBy(attendees, 'attendeeTypeId');
  const expectType = { attendee: 168, speaker: 14, vip: 9, staff: 18, employee: 16, 'exhibitor-staff': 12, press: 3 };
  for (const [k2, n] of Object.entries(expectType)) if (byType[type(k2)] !== n) fail(`type ${k2}: ${byType[type(k2)]} != ${n}`);
  const byPkg = countBy(attendees, 'packageId');
  const expectPkg = { [pkg('full')]: 150, [pkg('expo')]: 40, [pkg('workshop')]: 30, [pkg('vip')]: 9, [pkg('press')]: 3, none: 8 };
  for (const [k2, n] of Object.entries(expectPkg)) if (byPkg[k2] !== n) fail(`package ${k2}: ${byPkg[k2]} != ${n}`);
  const byStatus = countBy(attendees, 'status');
  for (const [k2, n] of Object.entries({ registered: 168, pending: 36, waitlisted: 24, cancelled: 12 })) if (byStatus[k2] !== n) fail(`status ${k2}: ${byStatus[k2]} != ${n}`);
  for (const a of attendees) {
    const p = packages.find((x) => x.id === a.packageId);
    if (p && p.attendeeTypeIds.length && !p.attendeeTypeIds.includes(a.attendeeTypeId)) fail(`${a.id} holds ${p.name} but its type is not allowed`);
    if ((a.attendeeTypeId === type('speaker') || a.attendeeTypeId === type('vip')) && a.status !== 'registered') fail('speakers and VIPs must be registered');
  }
  for (const c of regCodes) {
    const linked = attendees.filter((a) => a.regCodeId === c.id).length;
    if (linked > c.uses) fail(`${c.code} has ${linked} linked attendees but uses ${c.uses}`);
  }
  const early = attendees.filter((a) => a.regCodeId === code('early'));
  if (early.some((a) => a.registeredAt >= '2026-11-01')) fail('early bird holders must have registered before Nov 1');
  if (attendees.filter((a) => a.exhibitorId).length !== 6) fail('expected 6 linked exhibitor staff');
  if (sessions.length !== 14) fail('expected 14 sessions');
  if (exhibitors.length !== 18 || exhibitors.filter((e) => e.boothId).length !== 16) fail('expected 18 exhibitors, 16 assigned');
  assertNoOverlaps(event);
  assertBooths(event);
  return event;
}

// Generic attendee builder for the two smaller events.
function simpleSlots(defs) {
  const slots = [];
  for (const d of defs) for (let i = 0; i < d.n; i++) slots.push({ ...d.slot });
  return slots;
}
function distributeStatus(slots, targets) {
  const open = faker.helpers.shuffle(slots.filter((s) => !s.status));
  let k = 0;
  for (const [status, n] of Object.entries(targets)) for (let i = 0; i < n; i++) open[k++].status = status;
  if (k !== open.length) fail('status distribution mismatch');
}

// =====================================================================================
// 2. Horizon Developer Days
// =====================================================================================
function horizonDevDays() {
  const P = 'hdd';
  const type = (k) => `${P}-type-${k}`;
  const attendeeTypes = [
    { id: type('attendee'), name: 'Attendee', description: 'Developers attending both days', swatch: 'grape', isDefault: true },
    { id: type('speaker'), name: 'Speaker', description: 'Presenting talks or labs', swatch: 'berry', isDefault: false },
    { id: type('staff'), name: 'Staff', description: 'Horizon event staff', swatch: 'teal', isDefault: false },
  ];
  const pkg = (k) => `${P}-pkg-${k}`;
  const packages = [
    { id: pkg('dev'), name: 'Developer Pass', priceMinor: 29900, capacity: 300, status: 'active', description: 'Both days of talks and labs, lunch included.', includes: ['All sessions', 'Labs', 'Lunch both days'], attendeeTypeIds: [] },
    { id: pkg('workshop'), name: 'Workshop Add-on', priceMinor: 9900, capacity: 60, status: 'draft', description: 'A reserved seat in one hands-on lab.', includes: ['Reserved lab seat'], attendeeTypeIds: [type('attendee')] },
  ];
  const disc = (k) => `${P}-disc-${k}`;
  const discounts = [
    { id: disc('early'), name: 'Early access', kind: 'percent', amount: 20, packageIds: [pkg('dev')], startsOn: '2027-01-01', endsOn: '2027-01-31', limit: 200, uses: 0, active: true },
  ];
  const code = (k) => `${P}-code-${k}`;
  const regCodes = [
    { id: code('test'), code: 'HD-TEST-0001', label: 'QA test code', type: 'comp', discountId: null, grantsTypeId: null, maxUses: 1, uses: 0, expiresOn: null, active: false, createdAt: '2026-10-22T16:00:00.000Z' },
    { id: code('spkr'), code: 'HD-SPEAKER-27', label: 'Speaker comp', type: 'comp', discountId: null, grantsTypeId: null, maxUses: 20, uses: 4, expiresOn: '2027-02-02', active: true, createdAt: '2026-10-14T18:30:00.000Z' },
  ];
  const track = (k) => `${P}-track-${k}`;
  const tracks = [
    { id: track('key'), name: 'Keynotes', swatch: 'grape' },
    { id: track('ses'), name: 'Sessions', swatch: 'sky' },
    { id: track('lab'), name: 'Labs', swatch: 'lime' },
  ];
  let sn = 0;
  const s = (t, date, title, start, dur, speaker, room, tags) => ({
    id: `${P}-session-${String(++sn).padStart(2, '0')}`, title, trackId: track(t), date, startMinutes: start, durationMinutes: dur,
    speaker, description: '', capacity: t === 'lab' ? 30 : null, room, tags,
  });
  const D1 = '2027-02-03';
  const D2 = '2027-02-04';
  const sessions = [
    s('key', D1, 'Welcome and platform keynote', hm(9), 60, { name: 'Renata Alves', title: 'CTO, Horizon' }, 'Hall 1', ['Keynote']),
    s('ses', D1, "What's new in the Horizon API", hm(10, 15), 45, { name: 'Kenji Watanabe', title: 'API Lead, Horizon' }, 'Room 201', ['Product']),
    s('ses', D1, 'Building with webhooks', hm(11, 15), 45, { name: 'Maya Lindgren', title: 'Developer Advocate, Horizon' }, 'Room 201', ['Workshop']),
    s('lab', D1, 'Lab: your first Horizon app', hm(13), 90, { name: 'Omar Haddad', title: 'Solutions Engineer, Horizon' }, 'Lab A', ['Workshop']),
    s('ses', D1, 'Performance at scale', hm(14), 45, { name: 'Kenji Watanabe', title: 'API Lead, Horizon' }, 'Room 201', ['Product']),
    s('key', D1, 'Community panel', hm(15), 60, null, 'Hall 1', ['Networking']),
    s('key', D2, 'Day two opening', hm(9), 45, { name: 'Renata Alves', title: 'CTO, Horizon' }, 'Hall 1', ['Keynote']),
    s('ses', D2, 'Auth patterns for integrations', hm(10), 60, { name: 'Maya Lindgren', title: 'Developer Advocate, Horizon' }, 'Room 201', ['Product']),
    s('lab', D2, 'Lab: migrating to v3', hm(10), 120, { name: 'Omar Haddad', title: 'Solutions Engineer, Horizon' }, 'Lab A', ['Workshop']),
    s('ses', D2, 'Observability for integrations', hm(13), 45, null, 'Room 201', ['Product']),
    s('key', D2, 'Closing and roadmap', hm(16), 60, { name: 'Renata Alves', title: 'CTO, Horizon' }, 'Hall 1', ['Keynote']),
  ];
  const ex = (k) => `${P}-ex-${k}`;
  const booth = (label) => `${P}-booth-${label}`;
  const exDefs = [
    ['Cloudnest Hosting', 'platinum', 'confirmed', 'Managed hosting for Horizon apps', 'D3', 'Lena Fischer'],
    ['Bitforge Tools', 'gold', 'confirmed', 'Developer tooling and CI', 'C2', 'Sam Okoro'],
    ['Querylane', 'gold', 'confirmed', 'Hosted databases', 'C5', 'Amira Saleh'],
    ['Stickerdrop', 'silver', 'confirmed', 'Developer swag', 'A1', 'Jules Moreau'],
    ['Pagerly', 'silver', 'pending', 'On-call alerting', null, 'Victor Chen'],
  ];
  const exhibitors = exDefs.map(([name, tier, status, tagline, b, contactName], i) => {
    const [first, last] = contactName.split(' ');
    const domain = domainOf(name);
    return { id: ex(String(i + 1).padStart(2, '0')), name, tier, status, tagline, website: `https://${domain.replace('.example', '')}.example`, boothId: b ? booth(b) : null, contact: { name: contactName, email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`, phone: phone() }, notes: '' };
  });

  const slots = simpleSlots([
    { n: 4, slot: { typeId: type('speaker'), packageId: pkg('dev'), status: 'registered', regCodeId: code('spkr'), registeredVia: 'Imported from the speaker list' } },
    { n: 2, slot: { typeId: type('staff'), packageId: null, company: 'Horizon', registeredVia: 'Added by an admin' } },
    { n: 24, slot: { typeId: type('attendee'), packageId: pkg('dev'), registeredVia: 'Registered via Attendee Registration' } },
    { n: 6, slot: { typeId: type('attendee'), packageId: null, registeredVia: 'Registered via Attendee Registration' } },
  ]);
  distributeStatus(slots, { pending: 22, registered: 10, waitlisted: 0, cancelled: 0 });
  for (const sl of slots) {
    sl.packageName = sl.packageId === pkg('dev') ? 'Developer Pass' : null;
    sl.codeLabel = sl.regCodeId ? 'HD-SPEAKER-27' : null;
  }
  const attendees = buildAttendees(P, faker.helpers.shuffle(slots), { spanDays: 21 });
  attendees.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));

  const event = {
    id: 'evt-horizon-dev-days',
    slug: 'horizon-dev-days',
    name: 'Horizon Developer Days',
    startDate: '2027-02-03',
    endDate: '2027-02-04',
    location: 'Austin, Texas',
    timezone: 'America/Chicago',
    currency: 'USD',
    description: 'A two-day developer conference for the Horizon platform.',
    logo: { kind: 'monogram', letters: 'HD', swatch: 'teal' },
    agenda: { startMinutes: 480, endMinutes: 1080 },
    guide: {
      settings: { general: null, attributes: null, communications: null },
      workflows: [
        { id: `${P}-wf-attendee`, name: 'Attendee Registration', description: 'General registration for developers.', attendeeTypeId: type('attendee'), status: 'draft', steps: steps(`${P}-wf-attendee`, ['details', 'package', 'confirmation']), template: 'Attendee', updatedAt: '2026-10-30T16:20:00.000Z' },
      ],
      experiences: { portal: null, calendar: null },
    },
    attendeeTypes,
    attendees,
    packages,
    regCodes,
    discounts,
    tracks,
    sessions,
    exhibitors,
    booths: booths(P),
    moduleCollapsed: false,
  };
  if (attendees.length !== 36) fail('Horizon expects 36 attendees');
  if (attendees.filter((a) => a.packageId === pkg('dev')).length !== 28) fail('Horizon Developer Pass expects 28 sold');
  assertNoOverlaps(event);
  assertBooths(event);
  return event;
}

// =====================================================================================
// 3. Northwind Partner Forum
// =====================================================================================
function northwindPartnerForum() {
  const P = 'npf';
  const type = (k) => `${P}-type-${k}`;
  const attendeeTypes = [
    { id: type('partner'), name: 'Partner', description: 'Channel partners attending the forum', swatch: 'plum', isDefault: true },
    { id: type('sponsor'), name: 'Sponsor', description: 'Forum sponsors and their guests', swatch: 'amber', isDefault: false },
    { id: type('press'), name: 'Press', description: 'Media and analysts', swatch: 'slate', isDefault: false },
    { id: type('staff'), name: 'Staff', description: 'Northwind event staff', swatch: 'teal', isDefault: false },
  ];
  const pkg = (k) => `${P}-pkg-${k}`;
  const packages = [
    { id: pkg('partner'), name: 'Partner Pass', priceMinor: 0, capacity: 150, status: 'active', description: 'Complimentary access for invited partners.', includes: ['All sessions', 'Lunch', 'Partner awards dinner'], attendeeTypeIds: [type('partner')] },
    { id: pkg('sponsor'), name: 'Sponsor Pass', priceMinor: 250000, capacity: 20, status: 'active', description: 'Sponsor access with a reserved table and logo placement.', includes: ['All sessions', 'Reserved table', 'Logo placement', 'Partner awards dinner'], attendeeTypeIds: [type('sponsor')] },
    { id: pkg('press'), name: 'Press Pass', priceMinor: 0, capacity: null, status: 'active', description: 'Credentialed media.', includes: ['All sessions', 'Press room'], attendeeTypeIds: [type('press')] },
  ];
  const code = (k) => `${P}-code-${k}`;
  const regCodes = [
    { id: code('vip'), code: 'NW-INVITE-2027', label: 'Partner invitation', type: 'access', discountId: null, grantsTypeId: type('partner'), maxUses: 150, uses: 61, expiresOn: '2027-04-15', active: true, createdAt: '2026-10-20T15:00:00.000Z' },
    { id: code('sponsor'), code: 'NW-SPONSOR', label: 'Sponsor guests', type: 'access', discountId: null, grantsTypeId: type('sponsor'), maxUses: 30, uses: 14, expiresOn: null, active: true, createdAt: '2026-10-12T15:00:00.000Z' },
    { id: code('press'), code: 'NW-PRESS-27', label: 'Press access', type: 'access', discountId: null, grantsTypeId: type('press'), maxUses: 10, uses: 5, expiresOn: '2027-04-21', active: true, createdAt: '2026-10-08T15:00:00.000Z' },
    { id: code('staff'), code: 'NW-STAFF', label: 'Staff comp', type: 'comp', discountId: null, grantsTypeId: null, maxUses: 10, uses: 6, expiresOn: null, active: true, createdAt: '2026-10-01T15:00:00.000Z' },
  ];
  const track = (k) => `${P}-track-${k}`;
  const tracks = [
    { id: track('plen'), name: 'Plenary', swatch: 'plum' },
    { id: track('brk'), name: 'Breakouts', swatch: 'amber' },
  ];
  let sn = 0;
  const D = '2027-04-22';
  const s = (t, title, start, dur, speaker, room, tags) => ({ id: `${P}-session-${String(++sn).padStart(2, '0')}`, title, trackId: track(t), date: D, startMinutes: start, durationMinutes: dur, speaker, description: '', capacity: null, room, tags });
  const sessions = [
    s('plen', 'Welcome to the forum', hm(9), 45, { name: 'Helen Carver', title: 'Chief Partner Officer, Northwind' }, 'Grand Hall', ['Keynote']),
    s('plen', 'Partner program roadmap', hm(10), 60, { name: 'Andre Silva', title: 'VP Channels, Northwind' }, 'Grand Hall', ['Product']),
    s('plen', 'Lunch', hm(12), 60, null, 'Atrium', ['Networking']),
    s('plen', 'Partner awards', hm(16), 60, { name: 'Helen Carver', title: 'Chief Partner Officer, Northwind' }, 'Grand Hall', ['Networking']),
    s('brk', 'Co-selling playbook', hm(10), 60, { name: 'Wen Zhao', title: 'Director of Alliances, Northwind' }, 'Room B', ['Workshop']),
    s('brk', 'Pricing and margins', hm(11, 15), 45, { name: 'Andre Silva', title: 'VP Channels, Northwind' }, 'Room B', ['Product']),
    s('brk', 'Joint marketing that works', hm(13, 15), 60, { name: 'Zoe Abernathy', title: 'Partner Marketing Lead, Northwind' }, 'Room B', ['Workshop']),
    s('brk', 'Services attach', hm(14, 30), 45, null, 'Room B', ['Workshop']),
    s('brk', 'Partner portal walkthrough', hm(15, 30), 30, { name: 'Wen Zhao', title: 'Director of Alliances, Northwind' }, 'Room B', ['Product']),
  ];
  const ex = (k) => `${P}-ex-${k}`;
  const booth = (label) => `${P}-booth-${label}`;
  const exDefs = [
    ['Ledgerline', 'platinum', 'confirmed', 'Partner billing and payouts', 'D3', 'Clara Jensen'],
    ['Routewise', 'platinum', 'confirmed', 'Deal registration software', 'D4', 'Felix Romero'],
    ['Quotient CPQ', 'gold', 'confirmed', 'Configure, price and quote', 'C1', 'Ana Petrova'],
    ['Partnerpath', 'gold', 'confirmed', 'Partner relationship management', 'C3', 'James Whitaker'],
    ['Fieldkit', 'gold', 'confirmed', 'Sales enablement content', 'C4', 'Yara Haddad'],
    ['Cobalt Systems', 'gold', 'confirmed', 'Integration services', 'C6', 'Noah Becker'],
    ['Brightline Labs', 'gold', 'confirmed', 'Implementation partners', 'D1', 'Lucia Moreno'],
    ['Signal Insights', 'gold', 'confirmed', 'Channel analytics', 'D6', 'Ravi Kapoor'],
    ['Copperleaf Group', 'gold', 'confirmed', 'Managed services', 'B2', 'Ethan Park'],
    ['Juniper Learning', 'gold', 'confirmed', 'Partner certification', 'B5', 'Mei Tanaka'],
  ];
  const exhibitors = exDefs.map(([name, tier, status, tagline, b, contactName], i) => {
    const [first, last] = contactName.split(' ');
    const domain = domainOf(name);
    return { id: ex(String(i + 1).padStart(2, '0')), name, tier, status, tagline, website: `https://${domain.replace('.example', '')}.example`, boothId: booth(b), contact: { name: contactName, email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`, phone: phone() }, notes: '' };
  });
  const slots = simpleSlots([
    { n: 14, slot: { typeId: type('sponsor'), packageId: pkg('sponsor'), status: 'registered', regCodeId: code('sponsor'), registeredVia: 'Registered via Sponsor Registration' } },
    { n: 5, slot: { typeId: type('press'), packageId: pkg('press'), regCodeId: code('press'), registeredVia: 'Registered via Press Registration' } },
    { n: 6, slot: { typeId: type('staff'), packageId: null, regCodeId: code('staff'), company: 'Northwind', registeredVia: 'Added by an admin' } },
    { n: 61, slot: { typeId: type('partner'), packageId: pkg('partner'), regCodeId: code('vip'), registeredVia: 'Registered via Partner Registration' } },
    { n: 6, slot: { typeId: type('partner'), packageId: pkg('partner'), registeredVia: 'Registered via Partner Registration' } },
  ]);
  distributeStatus(slots, { registered: 56, pending: 14, waitlisted: 5, cancelled: 3 });
  for (const sl of slots) {
    sl.packageName = sl.packageId ? packages.find((p) => p.id === sl.packageId).name : null;
    sl.codeLabel = sl.regCodeId ? regCodes.find((c) => c.id === sl.regCodeId).code : null;
  }
  const attendees = buildAttendees(P, faker.helpers.shuffle(slots), { spanDays: 30 });
  attendees.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));

  const event = {
    id: 'evt-northwind-partner-forum',
    slug: 'northwind-partner-forum',
    name: 'Northwind Partner Forum',
    startDate: '2027-04-22',
    endDate: null,
    location: 'Chicago, Illinois',
    timezone: 'America/Chicago',
    currency: 'USD',
    description: "An invitation-only forum for Northwind's channel partners.",
    logo: { kind: 'monogram', letters: 'NP', swatch: 'plum' },
    agenda: { startMinutes: 480, endMinutes: 1080 },
    guide: {
      settings: {
        general: { eventType: 'Summit', capacity: 150, registrationOpens: '2026-10-01', registrationCloses: '2027-04-15', supportEmail: 'forum@northwind.example' },
        attributes: { fields: ATTRIBUTE_FIELDS(P) },
        communications: { senderName: 'Northwind Partner Forum', replyTo: 'forum@northwind.example', subject: "You're registered for {event}", body: 'Hi {first_name},\n\nThanks for registering for {event}. We will send your agenda two weeks before the forum.\n\nThe Northwind partner team', reminder: true },
      },
      workflows: [
        { id: `${P}-wf-partner`, name: 'Partner Registration', description: 'Invited partners confirm their seat.', attendeeTypeId: type('partner'), status: 'live', steps: steps(`${P}-wf-partner`, ['details', 'sessions', 'confirmation']), template: null, updatedAt: '2026-10-21T16:00:00.000Z' },
        { id: `${P}-wf-sponsor`, name: 'Sponsor Registration', description: 'Sponsors register their table and guests.', attendeeTypeId: type('sponsor'), status: 'live', steps: steps(`${P}-wf-sponsor`, ['details', 'package', 'payment', 'confirmation']), template: null, updatedAt: '2026-10-18T16:00:00.000Z' },
        { id: `${P}-wf-press`, name: 'Press Registration', description: 'Credentialed media, approval required.', attendeeTypeId: type('press'), status: 'draft', steps: steps(`${P}-wf-press`, ['details', 'confirmation']), template: 'Press', updatedAt: '2026-11-02T16:00:00.000Z' },
      ],
      experiences: {
        portal: { showAgenda: true, showNetworking: true, accent: 'berry' },
        calendar: { allowAdd: true, showRooms: true, firstDay: 'sunday' },
      },
    },
    attendeeTypes,
    attendees,
    packages,
    regCodes,
    discounts: [],
    tracks,
    sessions,
    exhibitors,
    booths: booths(P),
    moduleCollapsed: false,
  };
  if (attendees.length !== 92) fail('Northwind expects 92 attendees');
  if (attendees.filter((a) => a.packageId === pkg('sponsor')).length !== 14) fail('Sponsor Pass expects 14 sold');
  if (sessions.length !== 9) fail('Northwind expects 9 sessions');
  assertNoOverlaps(event);
  assertBooths(event);
  return event;
}

// =====================================================================================
mkdirSync(OUT, { recursive: true });
const events = [rainfocusSummit(), horizonDevDays(), northwindPartnerForum()];
for (const e of events) writeFileSync(join(OUT, `${e.slug}.json`), JSON.stringify(e, null, 1) + '\n');
writeFileSync(
  join(OUT, 'index.json'),
  JSON.stringify({ version: 1, seedNow: iso(SEED_NOW), activeEventId: events[0].id, events: events.map((e) => ({ id: e.id, slug: e.slug })) }, null, 2) + '\n',
);
for (const e of events) {
  console.log(`${e.slug}: ${e.attendees.length} attendees, ${e.packages.length} packages, ${e.regCodes.length} codes, ${e.discounts.length} discounts, ${e.sessions.length} sessions, ${e.exhibitors.length} exhibitors`);
}
console.log('Seed checks passed.');
