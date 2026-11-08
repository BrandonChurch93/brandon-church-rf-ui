import { useEffect, useState } from 'react';
import { useStore, selectActive } from '@/store/store';
import { Icon } from '../../ui/Icon';
import { ConfiguredStatus } from './ConfiguredCheck';
import { GeneralSheet, AttributesSheet, CommunicationsSheet } from './SettingSheets';
import s from './guide.module.scss';

type SettingKey = 'general' | 'attributes' | 'communications';
const SETTINGS: Array<{ key: SettingKey; title: string; desc: string }> = [
  { key: 'general', title: 'General', desc: 'Event basics, capacity and registration window.' },
  { key: 'attributes', title: 'Attendee attributes', desc: 'Define the fields attendees fill in when they register.' },
  { key: 'communications', title: 'Communications', desc: 'Confirmation email and reminders.' },
];

/** Step 1: three setting rows filling the panel; each opens its sheet. */
export function SettingsStep() {
  const ev = useStore(selectActive);
  const [open, setOpen] = useState<SettingKey | null>(null);
  useEffect(() => setOpen(null), [ev.id]);
  return (
    <div className={s.step}>
      <div className={s.stepLabel}>
        <h3 className={s.stepName}>
          <strong>Step 1</strong>
          <span>Base settings</span>
        </h3>
      </div>
      <div className={s.settingsWrap}>
        <div className={s.settings}>
          {SETTINGS.map((item) => {
            const done = Boolean(ev.guide.settings[item.key]);
            return (
              <button key={item.key} type="button" className={s.setting} onClick={() => setOpen(item.key)}>
                <span className={s.settingTop}>
                  <span className={s.settingTitle}>{item.title}</span>
                  <ConfiguredStatus done={done} />
                </span>
                <span className={s.settingDesc}>{item.desc}</span>
                <Icon name="chevron-right" size={18} className={s.settingChevron} />
              </button>
            );
          })}
        </div>
      </div>
      <GeneralSheet open={open === 'general'} onClose={() => setOpen(null)} />
      <AttributesSheet open={open === 'attributes'} onClose={() => setOpen(null)} />
      <CommunicationsSheet open={open === 'communications'} onClose={() => setOpen(null)} />
    </div>
  );
}
