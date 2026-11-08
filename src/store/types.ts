// Entity types (docs/16-data-model.md). Dates are ISO strings; money is in minor units.
export type Id = string;
export type ISODate = string; // '2026-12-15'
export type ISODateTime = string; // '2026-11-02T16:20:00.000Z'
export type Swatch = 'grape' | 'berry' | 'amber' | 'teal' | 'sky' | 'lime' | 'plum' | 'slate';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export const SWATCHES: Swatch[] = ['grape', 'berry', 'amber', 'teal', 'sky', 'lime', 'plum', 'slate'];

export type EventLogo =
  | { kind: 'bundled'; key: 'rainfocus' }
  | { kind: 'monogram'; letters: string; swatch: Swatch }
  | { kind: 'custom'; dataUrl: string };

export interface GeneralSettings {
  eventType: string;
  capacity: number;
  registrationOpens: ISODate;
  registrationCloses: ISODate;
  supportEmail: string;
}
export type AttributeType = 'text' | 'email' | 'phone' | 'select' | 'checkbox';
export interface AttributeField {
  id: Id;
  label: string;
  type: AttributeType;
  required: boolean;
}
export interface CommunicationsSettings {
  senderName: string;
  replyTo: string;
  subject: string;
  body: string;
  reminder: boolean;
}
export type PortalAccent = 'grape' | 'berry' | 'teal' | 'slate';
export interface PortalSettings {
  showAgenda: boolean;
  showNetworking: boolean;
  accent: PortalAccent;
}
export interface CalendarSettings {
  allowAdd: boolean;
  showRooms: boolean;
  firstDay: 'sunday' | 'monday';
}

export interface GuideState {
  settings: {
    general: null | GeneralSettings;
    attributes: null | { fields: AttributeField[] };
    communications: null | CommunicationsSettings;
  };
  workflows: Workflow[];
  experiences: {
    portal: null | PortalSettings;
    calendar: null | CalendarSettings;
  };
}

export type StepKind = 'details' | 'type' | 'package' | 'payment' | 'sessions' | 'confirmation';
export interface WorkflowStep {
  id: Id;
  kind: StepKind;
  name: string;
}
export interface Workflow {
  id: Id;
  name: string;
  description: string;
  attendeeTypeId: Id;
  status: 'draft' | 'live';
  steps: WorkflowStep[];
  template: string | null;
  updatedAt: ISODateTime;
}

export interface AttendeeType {
  id: Id;
  name: string;
  description: string;
  swatch: Swatch;
  isDefault: boolean;
}

export type AttendeeStatus = 'registered' | 'pending' | 'waitlisted' | 'cancelled';
export interface ActivityEntry {
  id: Id;
  at: ISODateTime;
  text: string;
}
export interface Attendee {
  id: Id;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  attendeeTypeId: Id;
  packageId: Id | null;
  regCodeId: Id | null;
  exhibitorId: Id | null;
  status: AttendeeStatus;
  registeredAt: ISODateTime;
  notes: string;
  activity: ActivityEntry[];
}

export type PackageStatus = 'draft' | 'active' | 'archived';
export interface Package {
  id: Id;
  name: string;
  priceMinor: number;
  capacity: number | null;
  status: PackageStatus;
  description: string;
  includes: string[];
  attendeeTypeIds: Id[];
}

export type RegCodeType = 'comp' | 'discount' | 'access';
export interface RegCode {
  id: Id;
  code: string;
  label: string;
  type: RegCodeType;
  discountId: Id | null;
  grantsTypeId: Id | null;
  maxUses: number | null;
  uses: number;
  expiresOn: ISODate | null;
  active: boolean;
  createdAt: ISODateTime;
}

export interface Discount {
  id: Id;
  name: string;
  kind: 'percent' | 'fixed';
  amount: number;
  packageIds: Id[];
  startsOn: ISODate | null;
  endsOn: ISODate | null;
  limit: number | null;
  uses: number;
  active: boolean;
}

export interface Track {
  id: Id;
  name: string;
  swatch: Swatch;
}

export interface Session {
  id: Id;
  title: string;
  trackId: Id;
  date: ISODate;
  startMinutes: number;
  durationMinutes: number;
  speaker: null | { name: string; title: string };
  description: string;
  capacity: number | null;
  room: string | null;
  tags: string[];
}

export type ExhibitorTier = 'platinum' | 'gold' | 'silver';
export type ExhibitorStatus = 'confirmed' | 'pending' | 'cancelled';
export interface Exhibitor {
  id: Id;
  name: string;
  tier: ExhibitorTier;
  status: ExhibitorStatus;
  tagline: string;
  website: string | null;
  boothId: Id | null;
  contact: { name: string; email: string; phone: string | null };
  notes: string;
}

export type BoothRow = 'A' | 'B' | 'C' | 'D';
export interface Booth {
  id: Id;
  label: string;
  row: BoothRow;
  col: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface EventRecord {
  id: Id;
  slug: string;
  name: string;
  startDate: ISODate;
  endDate: ISODate | null;
  location: string;
  timezone: string;
  currency: Currency;
  description: string;
  logo: EventLogo;
  agenda: { startMinutes: number; endMinutes: number };
  guide: GuideState;
  attendeeTypes: AttendeeType[];
  attendees: Attendee[];
  packages: Package[];
  regCodes: RegCode[];
  discounts: Discount[];
  tracks: Track[];
  sessions: Session[];
  exhibitors: Exhibitor[];
  booths: Booth[];
  moduleCollapsed: boolean;
}

export type ThemePref = 'light' | 'dark' | 'system';
export type StepId = 'workflows';

export interface UiState {
  theme: ThemePref;
  reduceMotion: boolean | null;
  sidebarGroups: Record<string, boolean>;
  recentCommands: string[];
  guideShowAll: Record<string, boolean>;
  signedOut: boolean;
}
