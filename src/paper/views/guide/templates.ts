import type { IconName } from '../../ui/Icon';
import type { StepKind } from '@/store/types';

export interface WorkflowTemplate {
  name: string;
  description: string;
  /** Matched by name against the event's attendee types; falls back to the default type. */
  targetType: string | null;
  steps: StepKind[];
  icon: IconName;
}

export const TEMPLATES: WorkflowTemplate[] = [
  { name: 'Attendee', description: 'General registration with package selection and payment.', targetType: 'Attendee', steps: ['details', 'type', 'package', 'payment', 'confirmation'], icon: 'users' },
  { name: 'Employee', description: 'Internal registration, no payment.', targetType: 'Employee', steps: ['details', 'sessions', 'confirmation'], icon: 'building' },
  { name: 'Staff', description: 'Event staff with shift sessions.', targetType: 'Staff', steps: ['details', 'sessions', 'confirmation'], icon: 'user-check' },
  { name: 'VIP', description: 'Invited guests, complimentary, with session picks.', targetType: 'VIP', steps: ['details', 'sessions', 'confirmation'], icon: 'star' },
  { name: 'Speaker', description: 'Speakers confirm their sessions and details.', targetType: 'Speaker', steps: ['details', 'sessions', 'confirmation'], icon: 'mic' },
  { name: 'Exhibitor staff', description: 'Booth staff registered by their company.', targetType: 'Exhibitor staff', steps: ['details', 'confirmation'], icon: 'store' },
  { name: 'Press', description: 'Credentialed media, approval required.', targetType: 'Press', steps: ['details', 'confirmation'], icon: 'file-text' },
  { name: 'Start from scratch', description: 'An empty workflow you build step by step.', targetType: null, steps: [], icon: 'plus' },
];

export const STEP_KINDS: Array<{ kind: StepKind; name: string; icon: IconName; label: string }> = [
  { kind: 'details', name: 'Details', icon: 'file-text', label: 'Collects the registration form' },
  { kind: 'type', name: 'Attendee type selection', icon: 'tag', label: 'Attendee chooses a type' },
  { kind: 'package', name: 'Package selection', icon: 'ticket', label: 'Attendee chooses a package' },
  { kind: 'payment', name: 'Payment', icon: 'credit-card', label: 'Takes payment' },
  { kind: 'sessions', name: 'Sessions', icon: 'calendar-clock', label: 'Attendee picks sessions' },
  { kind: 'confirmation', name: 'Confirmation', icon: 'circle-check', label: 'Confirms and sends the email' },
];
export const stepMeta = (k: StepKind) => STEP_KINDS.find((s) => s.kind === k)!;
