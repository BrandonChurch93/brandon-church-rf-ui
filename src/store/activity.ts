import type { Attendee } from './types';
import { uid } from './ids';

const MAX_ACTIVITY = 50;

export function withActivity(a: Attendee, ...texts: string[]): Attendee {
  if (!texts.length) return a;
  const at = new Date().toISOString();
  const entries = texts.map((text) => ({ id: uid(), at, text }));
  return { ...a, activity: [...entries.reverse(), ...a.activity].slice(0, MAX_ACTIVITY) };
}
