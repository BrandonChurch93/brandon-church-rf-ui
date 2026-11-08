import type { Attendee, EventRecord } from '@/store/types';
import { fullName } from '@/store/selectors';
import { formatDateTimeAsDate } from '../../lib/format';
import { statusMeta } from './query';

const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Name, Email, Phone, Company, Job title, Type, Package, Reg code, Status, Registered. */
export function attendeesCsv(ev: EventRecord, rows: Attendee[]) {
  const type = new Map(ev.attendeeTypes.map((t) => [t.id, t.name]));
  const pkg = new Map(ev.packages.map((p) => [p.id, p.name]));
  const code = new Map(ev.regCodes.map((c) => [c.id, c.code]));
  const header = ['Name', 'Email', 'Phone', 'Company', 'Job title', 'Type', 'Package', 'Reg code', 'Status', 'Registered'];
  const lines = rows.map((a) =>
    [
      fullName(a),
      a.email,
      a.phone ?? '',
      a.company ?? '',
      a.jobTitle ?? '',
      type.get(a.attendeeTypeId) ?? '',
      a.packageId ? (pkg.get(a.packageId) ?? '') : 'None',
      a.regCodeId ? (code.get(a.regCodeId) ?? '') : '',
      statusMeta(a.status).label,
      formatDateTimeAsDate(a.registeredAt, ev.timezone),
    ]
      .map(esc)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n') + '\n';
}
