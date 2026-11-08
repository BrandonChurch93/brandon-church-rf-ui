import { useState, type Ref } from 'react';
import { useStore, selectActive } from '@/store/store';
import { eventStatus } from '@/store/selectors';
import { EventLogo } from '../../shell/EventLogo';
import { LogoEditor } from '../../shell/LogoEditor';
import { InlineEdit } from '../../ui/InlineEdit';
import { Chip } from '../../ui/display';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Tooltip } from '../../ui/Tooltip';
import { useShell } from '../../shellStore';
import { formatDateLong, formatDateRange } from '../../lib/format';
import type { EventLogo as Logo } from '@/store/types';
import s from './guide.module.scss';

/** Logo (opens the logo editor), inline-editable name, date and place, the status chip, Edit event. */
export function EventHero({ chipRef }: { chipRef: Ref<HTMLSpanElement> }) {
  const ev = useStore(selectActive);
  const update = useStore((st) => st.updateEventDetails);
  const setLogo = useStore((st) => st.setEventLogo);
  const setEditor = useShell((st) => st.setEventEditor);
  const [logoOpen, setLogoOpen] = useState(false);
  const status = eventStatus(ev);
  const when = ev.endDate && ev.endDate !== ev.startDate ? formatDateRange(ev.startDate, ev.endDate) : formatDateLong(ev.startDate);
  const defaultLogo: Logo = ev.id === 'evt-rainfocus-summit' ? { kind: 'bundled', key: 'rainfocus' } : ev.logo.kind === 'monogram' ? ev.logo : { kind: 'monogram', letters: ev.name.slice(0, 2).toUpperCase(), swatch: 'grape' };

  return (
    <header className={s.hero} data-part>
      <Tooltip content="Change event logo" describe={false}>
        <button type="button" className={s.logoButton} aria-label="Change event logo" onClick={() => setLogoOpen(true)}>
          <EventLogo key={JSON.stringify(ev.logo).length} logo={ev.logo} size={96} radius="lg" className="rf-fade-in" />
          <span className={s.logoOverlay} aria-hidden="true">
            <Icon name="camera" size={20} />
            Change
          </span>
        </button>
      </Tooltip>
      <div className={s.heroText}>
        <InlineEdit className={s.eventName} value={ev.name} label="Event name" requiredMessage="Event name is required" onCommit={(name) => update({ name })} />
        <p className={s.eventMeta}>
          {when} · {ev.location}
        </p>
        <div className={s.chipRow}>
          <span ref={chipRef} style={{ display: 'inline-flex' }}>
            <Chip tone={status.tone} dot>
              {status.text}
            </Chip>
          </span>
        </div>
      </div>
      <div className={s.heroAction}>
        <Button variant="primary" icon="pencil" onClick={() => setEditor('edit')}>
          Edit event
        </Button>
      </div>
      <LogoEditor open={logoOpen} onClose={() => setLogoOpen(false)} logo={ev.logo} defaultLogo={defaultLogo} onSave={setLogo} />
    </header>
  );
}
