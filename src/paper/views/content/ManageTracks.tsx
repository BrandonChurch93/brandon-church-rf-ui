import { useEffect, useRef, useState } from 'react';
import { useStore, selectActive } from '@/store/store';
import { SWATCHES, type Swatch, type Track } from '@/store/types';
import { uid } from '@/store/ids';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Input } from '../../ui/form/Input';
import { Popover } from '../../ui/overlay/Popover';
import { DisabledReason } from '../../ui/DisabledReason';
import { SortableList } from '../../ui/Sortable';
import { toast } from '../../ui/toastStore';
import { plural } from '../../lib/format';
import s from './content.module.scss';

/** Tracks: order (the grid's column order), name, color. A track with sessions cannot be removed. */
export function ManageTracks({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ev = useStore(selectActive);
  const save = useStore((st) => st.saveTracks);
  const [tracks, setTracks] = useState<Track[]>(ev.tracks);
  const [submitted, setSubmitted] = useState(false);
  const focusNew = useRef<string | null>(null);
  useEffect(() => {
    if (open) {
      setTracks(structuredClone(ev.tracks));
      setSubmitted(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (focusNew.current) {
      document.getElementById(`track-${focusNew.current}`)?.focus();
      focusNew.current = null;
    }
  }, [tracks.length]);

  const count = (id: string) => ev.sessions.filter((x) => x.trackId === id).length;
  const err = (t: Track) => (!t.name.trim() ? 'Enter a name' : tracks.filter((x) => x.name.trim().toLowerCase() === t.name.trim().toLowerCase()).length > 1 ? 'Names must be unique' : null);
  const set = (id: string, patch: Partial<Track>) => setTracks((l) => l.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage tracks"
      width={480}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setSubmitted(true);
              if (tracks.some((t) => err(t))) return;
              save(tracks.map((t) => ({ ...t, name: t.name.trim() })));
              toast.success('Saved tracks');
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className={s.trackList}>
        <SortableList
          items={tracks}
          getId={(t) => t.id}
          getName={(t) => t.name || 'New track'}
          onReorder={(ids) => setTracks((l) => ids.map((id) => l.find((t) => t.id === id)!))}
          render={(t, p) => {
            const n = count(t.id);
            return (
              <div ref={p.setNodeRef} style={p.style} className={s.trackRow}>
                {p.handle}
                <SwatchPicker value={t.swatch} name={t.name} onChange={(sw) => set(t.id, { swatch: sw })} />
                <Input id={`track-${t.id}`} label={`Name of ${t.name || 'new track'}`} labelHidden value={t.name} onChange={(e) => set(t.id, { name: e.target.value })} size="sm" error={submitted ? err(t) : null} maxLength={40} />
                <span className={s.trackCount}>{plural(n, 'session')}</span>
                {n > 0 || tracks.length === 1 ? (
                  <DisabledReason reason={n > 0 ? 'Move or remove its sessions first' : 'Keep at least one track'} label={`Remove ${t.name}, unavailable`}>
                    <IconButton icon="trash" label={`Remove ${t.name}`} size={30} disabled tooltip={false} tabIndex={-1} />
                  </DisabledReason>
                ) : (
                  <IconButton icon="trash" label={`Remove ${t.name || 'new track'}`} size={30} onClick={() => setTracks((l) => l.filter((x) => x.id !== t.id))} />
                )}
              </div>
            );
          }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <Button
          variant="secondary"
          icon="plus"
          disabled={tracks.length >= 8}
          onClick={() => {
            const id = uid();
            focusNew.current = id;
            const used = new Set(tracks.map((t) => t.swatch));
            setTracks((l) => [...l, { id, name: '', swatch: SWATCHES.find((x) => !used.has(x)) ?? 'slate' }]);
          }}
        >
          Add track
        </Button>
      </div>
    </Modal>
  );
}

function SwatchPicker({ value, name, onChange }: { value: Swatch; name: string; onChange: (s: Swatch) => void }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={btn} type="button" className={s.swatchButton} aria-label={`Color of ${name || 'new track'}: ${value}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <i style={{ background: `var(--sw-${value})` }} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={btn} label="Track color" placement="bottom-start" alwaysAnchored width={156}>
        <div className={s.swatchGrid} role="radiogroup" aria-label="Track color">
          {SWATCHES.map((sw) => (
            <button
              key={sw}
              type="button"
              role="radio"
              aria-checked={sw === value}
              aria-label={sw}
              style={{ background: `var(--sw-${sw})` }}
              onClick={() => {
                onChange(sw);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </Popover>
    </>
  );
}
