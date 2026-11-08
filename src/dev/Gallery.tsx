// Dev-only primitives gallery (#dev-gallery). Every primitive in its static states, for review
// in both themes. Never part of the production bundle.
import { useState, type ReactNode } from 'react';
import '@/styles/globals.scss';
import { PaperRootContext } from '@/paper/ui/overlay/Portal';
import { Button } from '@/paper/ui/Button';
import { IconButton } from '@/paper/ui/IconButton';
import { Input, Textarea } from '@/paper/ui/form/Input';
import { NumberField } from '@/paper/ui/form/NumberField';
import { CurrencyField } from '@/paper/ui/form/CurrencyField';
import { Select } from '@/paper/ui/form/Select';
import { Combobox } from '@/paper/ui/form/Combobox';
import { DateField, Calendar } from '@/paper/ui/form/DateField';
import { TimeField } from '@/paper/ui/form/TimeField';
import { Switch } from '@/paper/ui/form/Switch';
import { Checkbox, Radio } from '@/paper/ui/form/Checkbox';
import { SegmentedControl } from '@/paper/ui/form/SegmentedControl';
import { TagInput } from '@/paper/ui/form/TagInput';
import { Chip, FilterChip, RemovableChip, Badge, Avatar, StatusDot, ProgressBar, EmptyState, Divider, DragHandle, SectionLabel } from '@/paper/ui/display';
import { Kbd } from '@/paper/ui/Kbd';
import { Tabs } from '@/paper/ui/Tabs';
import { Pagination } from '@/paper/ui/Pagination';
import { SearchField, SearchOpener } from '@/paper/ui/SearchField';
import { Menu } from '@/paper/ui/Menu';
import { Popover } from '@/paper/ui/overlay/Popover';
import { Sheet } from '@/paper/ui/Sheet';
import { Modal } from '@/paper/ui/Modal';
import { ConfirmHost } from '@/paper/ui/ConfirmHost';
import { confirmDialog } from '@/paper/ui/confirmStore';
import { ToastHost } from '@/paper/ui/ToastHost';
import { toast } from '@/paper/ui/toastStore';
import { Tooltip, TooltipHost } from '@/paper/ui/Tooltip';
import { SortHeader, tableStyles as t } from '@/paper/ui/Table';
import { SWATCHES } from '@/store/types';
import s from './gallery.module.scss';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={s.section}>
      <h2>{title}</h2>
      <div className={s.row}>{children}</div>
    </section>
  );
}

export function Gallery() {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>((document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light');
  const [seg, setSeg] = useState('grid');
  const [tab, setTab] = useState('a');
  const [sw, setSw] = useState(true);
  const [num, setNum] = useState<number | null>(400);
  const [money, setMoney] = useState<number | null>(89900);
  const [sel, setSel] = useState<string | null>('b');
  const [combo, setCombo] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>('2026-12-15');
  const [time, setTime] = useState<number | null>(540);
  const [tags, setTags] = useState(['Keynote', 'Workshop']);
  const [page, setPage] = useState(3);
  const [size, setSize] = useState(25);
  const [sheet, setSheet] = useState(false);
  const [modal, setModal] = useState(false);
  const [pop, setPop] = useState(false);
  const [popAnchor, setPopAnchor] = useState<HTMLButtonElement | null>(null);
  const [q, setQ] = useState('');
  const options = [
    { value: 'a', label: 'Attendee', description: 'General admission' },
    { value: 'b', label: 'Speaker', hint: '14' },
    { value: 'c', label: 'VIP' },
    { value: 'd', label: 'Press', disabled: true },
  ];

  return (
    <PaperRootContext.Provider value={root}>
      <div data-layer="paper" className={s.page}>
        <header className={s.header}>
          <h1>Primitives gallery</h1>
          <SegmentedControl
            label="Theme"
            value={theme}
            onChange={(v) => {
              setTheme(v);
              document.documentElement.dataset.theme = v;
            }}
            options={[
              { value: 'light', label: 'Light', icon: 'sun' },
              { value: 'dark', label: 'Dark', icon: 'moon' },
            ]}
          />
        </header>

        <Section title="Button">
          <Button variant="primary" icon="plus">Primary</Button>
          <Button variant="secondary" icon="download">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="danger-ghost" icon="trash">Danger ghost</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" loading>Saving</Button>
          <Button variant="primary" success>Save</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="secondary" trailingIcon="chevron-down">Trailing</Button>
        </Section>
        <Section title="Icon button">
          <IconButton icon="pencil" label="Edit" />
          <IconButton icon="ellipsis" label="More actions" variant="subtle" />
          <IconButton icon="x" label="Close" size={30} />
          <IconButton icon="trash" label="Remove" disabled />
        </Section>
        <Section title="Inputs">
          <div className={s.col}>
            <Input label="Event name" required value="RainFocus Summit" onChange={() => undefined} help="Shown to attendees" />
            <Input label="Email" value="not-an-email" onChange={() => undefined} error="Enter a valid email address" />
            <Input label="Website" prefix="https://" value="" placeholder="rainfocus.example" onChange={() => undefined} />
            <Input label="Disabled" value="Locked" disabled onChange={() => undefined} />
            <Input label="Code" mono value="RF-7X2K-4MQ9" onChange={() => undefined} size="sm" />
          </div>
          <div className={s.col}>
            <Textarea label="Description" value="Two days of sessions." onChange={() => undefined} maxCount={200} />
            <NumberField label="Capacity" value={num} onChange={setNum} min={1} max={100000} />
            <CurrencyField label="Price" value={money} onChange={setMoney} currency="USD" />
            <TagInput label="Includes" value={tags} onChange={setTags} suggestions={['Lunch', 'Recording access', 'Workshops']} />
          </div>
          <div className={s.col}>
            <Select label="Attendee type" value={sel} onChange={setSel} options={options} />
            <Select label="Empty select" value={null} onChange={setSel} options={options} placeholder="Choose a type" error="Choose a type" />
            <Combobox label="Assign exhibitor" value={combo} onChange={setCombo} options={options} placeholder="Search exhibitors" />
            <DateField label="Start date" value={date} onChange={setDate} />
            <TimeField label="Start" value={time} onChange={setTime} from={480} to={1080} />
          </div>
          <div className={s.col}>
            <Calendar value={date} today="2026-11-07" onSelect={setDate} />
            <SearchField label="Search attendees" value={q} onChange={setQ} placeholder="Search by name, email or company" />
            <SearchOpener onOpen={() => undefined} />
          </div>
        </Section>
        <Section title="Choice controls">
          <Switch checked={sw} onChange={setSw} label="Send a reminder" />
          <Switch checked={false} onChange={() => undefined} label="Off" />
          <Switch checked disabled onChange={() => undefined} label="Disabled" />
          <Checkbox checked onChange={() => undefined} label="Checked" />
          <Checkbox checked={false} onChange={() => undefined} label="Unchecked" />
          <Checkbox checked={false} indeterminate onChange={() => undefined} label="Indeterminate" />
          <Checkbox checked disabled onChange={() => undefined} label="Disabled" />
          <Radio checked name="r" value="1" onChange={() => undefined} label="Selected" />
          <Radio checked={false} name="r" value="2" onChange={() => undefined} label="Not selected" />
          <SegmentedControl label="View" value={seg} onChange={setSeg} options={[{ value: 'grid', label: 'Grid', icon: 'grid' }, { value: 'list', label: 'List', icon: 'list' }]} />
          <SegmentedControl label="Theme" size="sm" value="light" onChange={() => undefined} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]} />
        </Section>
        <Section title="Chips, badges, avatars, status">
          {(['neutral', 'accent', 'berry', 'success', 'warning', 'danger', 'muted', 'outline'] as const).map((tone) => (
            <Chip key={tone} tone={tone} dot>
              {tone}
            </Chip>
          ))}
          <Chip swatch="teal">Workshop A</Chip>
          <FilterChip label="Type" />
          <FilterChip label="Status" count={2} onClear={() => undefined} />
          <RemovableChip removeLabel="Remove Lunch" onRemove={() => undefined}>
            Lunch
          </RemovableChip>
          <Badge>24</Badge>
          <Badge tone="accent">New</Badge>
          {[24, 32, 40].map((sz) => (
            <Avatar key={sz} name="Priya Natarajan" size={sz as 24} />
          ))}
          {SWATCHES.map((sw2) => (
            <Avatar key={sw2} name={sw2} swatch={sw2} size={32} />
          ))}
          <Avatar name="First Last" initials="FL" self size={32} />
          <StatusDot tone="success">Registered</StatusDot>
          <StatusDot tone="warning">Pending</StatusDot>
          <StatusDot tone="neutral">Waitlisted</StatusDot>
          <StatusDot tone="danger">Cancelled</StatusDot>
          <Kbd mod>K</Kbd>
          <Kbd>Esc</Kbd>
          <DragHandle label="Reorder" />
        </Section>
        <Section title="Progress">
          <div className={s.col}>
            <ProgressBar value={4} max={8} label="Setup progress" variant="gradient" />
            <ProgressBar value={150} max={400} label="Sold" />
            <ProgressBar value={9} max={10} label="Sold" variant="warning" />
            <ProgressBar value={10} max={10} label="Sold" variant="danger" thin />
          </div>
        </Section>
        <Section title="Tabs, pagination, dividers">
          <div className={s.col} style={{ minWidth: 520 }}>
            <Tabs label="Days" idPrefix="g" value={tab} onChange={setTab} items={[{ value: 'a', label: 'Mon, Dec 15' }, { value: 'b', label: 'Tue, Dec 16' }]} />
            <Pagination page={page} pageSize={size} total={240} onPage={setPage} onPageSize={setSize} />
            <Divider />
            <Divider label="Or" />
            <SectionLabel action={<Button size="sm" variant="ghost">Edit</Button>}>Details</SectionLabel>
          </div>
        </Section>
        <Section title="Table">
          <div className={t.card} style={{ width: '100%' }}>
            <table className={t.table}>
              <thead>
                <tr>
                  <SortHeader sortKey="name" sort={{ key: 'name', dir: 'asc' }} onSort={() => undefined}>
                    Name
                  </SortHeader>
                  <SortHeader sortKey="status" sort={null} onSort={() => undefined}>
                    Status
                  </SortHeader>
                </tr>
              </thead>
              <tbody>
                <tr data-clickable>
                  <td>Priya Natarajan</td>
                  <td>
                    <StatusDot tone="success">Registered</StatusDot>
                  </td>
                </tr>
                <tr data-clickable data-selected>
                  <td>Marcus Oyelaran</td>
                  <td>
                    <StatusDot tone="warning">Pending</StatusDot>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
        <Section title="Empty state">
          <div className={s.card}>
            <EmptyState icon="users" title="No attendees yet" body="Attendees appear here as they register, or add them yourself." action={{ label: 'Add attendee', icon: 'plus', onClick: () => undefined }} secondary={{ label: 'Restore demo data', onClick: () => undefined }} />
          </div>
        </Section>
        <Section title="Layers">
          <Tooltip content="A tooltip">
            <Button>Hover for tooltip</Button>
          </Tooltip>
          <Menu
            label="Actions"
            items={[
              { id: 'e', label: 'Edit', icon: 'pencil', onSelect: () => undefined },
              { id: 'd', label: 'Duplicate', icon: 'duplicate', shortcut: <Kbd mod>D</Kbd>, onSelect: () => undefined },
              { id: 'x', type: 'divider' },
              { id: 'r', label: 'Remove', icon: 'trash', danger: true, onSelect: () => undefined },
            ]}
            trigger={(p) => <Button {...p}>Open menu</Button>}
          />
          <Button ref={setPopAnchor} onClick={() => setPop(true)}>
            Open popover
          </Button>
          <Popover open={pop} onClose={() => setPop(false)} anchor={{ current: popAnchor }} label="Filter">
            <div style={{ padding: 12, display: 'grid', gap: 8 }}>
              <Checkbox checked onChange={() => undefined} label="Registered" />
              <Checkbox checked={false} onChange={() => undefined} label="Pending" />
            </div>
          </Popover>
          <Button onClick={() => setSheet(true)}>Open sheet</Button>
          <Button onClick={() => setModal(true)}>Open modal</Button>
          <Button onClick={() => confirmDialog({ title: 'Remove Jane Doe?', body: 'This cannot be undone after the undo window closes.', confirmLabel: 'Remove', danger: true })}>Confirm</Button>
          <Button onClick={() => toast.success('Saved changes')}>Success toast</Button>
          <Button onClick={() => toast.undo('Removed Jane Doe', { undo: () => undefined })}>Undo toast</Button>
          <Button onClick={() => toast.danger('Could not copy to the clipboard')}>Danger toast</Button>
        </Section>
        <Sheet open={sheet} onClose={() => setSheet(false)} title="Edit package" subtitle="Full Conference" footer={<><span style={{ flex: 1 }} /><Button onClick={() => setSheet(false)}>Cancel</Button><Button variant="primary">Save</Button></>}>
          <Input label="Name" value="Full Conference" onChange={() => undefined} />
        </Sheet>
        <Modal open={modal} onClose={() => setModal(false)} title="Bulk generate codes" footer={<><Button onClick={() => setModal(false)}>Cancel</Button><Button variant="primary">Generate 10 codes</Button></>}>
          <p>Modal body.</p>
        </Modal>
      </div>
      <div ref={setRoot} data-paper-root />
      <TooltipHost />
      <ToastHost />
      <ConfirmHost />
    </PaperRootContext.Provider>
  );
}
