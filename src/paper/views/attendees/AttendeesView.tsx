import { ViewHeader } from '../../shell/ViewHeader';
import type { ViewProps } from '../../shell/ViewSwitch';
import { useStore, selectActive } from '@/store/store';

export function AttendeesView(_props: ViewProps) {
  const ev = useStore(selectActive);
  return <ViewHeader title="Attendees" description={`Everyone registered for ${ev.name}.`} />;
}
