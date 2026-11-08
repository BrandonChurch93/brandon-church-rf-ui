import { Fragment, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Portal } from '../ui/overlay/Portal';
import { useOverlay } from '../ui/overlay/useOverlay';
import { usePresence } from '../hooks/usePresence';
import { Icon, type IconName } from '../ui/Icon';
import { Kbd } from '../ui/Kbd';
import { Avatar } from '../ui/display';
import { useStore, selectActive } from '@/store/store';
import { useShell, INTENT_ROUTE, handledIntents, openSwitcher, type IntentType } from '../shellStore';
import { NAV, ROUTE_ICON, ROUTE_LABEL } from '../routes';
import type { Route } from '../hooks/useHashRoute';
import { fuzzy, substring } from '../lib/fuzzy';
import { fullName } from '@/store/selectors';
import { resolveTheme } from '@/app/theme';
import { confirmDialog } from '../ui/confirmStore';
import { toast } from '../ui/toastStore';
import { copyText } from '../lib/clipboard';
import { useSystemReducedMotion } from '@/motion/reduced';
import s from './palette.module.scss';

interface Command {
  id: string;
  group: 'Recent' | 'Pages' | 'Actions' | 'Attendees' | 'Reg codes';
  label: string;
  sub?: string;
  icon?: IconName;
  leading?: ReactNode;
  indices?: number[];
  /** Remembered in recents (pages and actions only). */
  recent?: boolean;
  run: () => void;
}

interface PaletteProps {
  onNavigate: (r: Route) => void;
  onViewOriginal: () => void;
}

const PAGES: Array<{ route: Route; label: string }> = NAV.flatMap((n) => (n.children ? n.children.map((c) => ({ route: c.route, label: c.label })) : [{ route: n.route, label: n.route === 'guide' ? 'Guide' : n.label }]));

export function CommandPalette({ onNavigate, onViewOriginal }: PaletteProps) {
  const open = useShell((st) => st.palette);
  const setOpen = useShell((st) => st.setPalette);
  const presence = usePresence(open, 160);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const ev = useStore(selectActive);
  const recents = useStore((st) => st.ui.recentCommands);
  const pushRecent = useStore((st) => st.pushRecentCommand);
  const theme = useStore((st) => st.ui.theme);
  const setTheme = useStore((st) => st.setTheme);
  const reduce = useStore((st) => st.ui.reduceMotion);
  const setReduce = useStore((st) => st.setReduceMotion);
  const resetData = useStore((st) => st.resetDemoData);
  const shell = useShell();
  const systemReduced = useSystemReducedMotion();

  const close = (o?: { instant?: boolean }) => {
    if (o?.instant) presence.skipExit();
    setOpen(false);
  };
  useOverlay({ open: presence.mounted && open, onClose: close, container: panel, trap: true, stepAside: true, lockScroll: true, initialFocus: input });

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  // Typing always lands in the input, even if focus moved to a button in the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && document.activeElement !== input.current) input.current?.focus();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  const intent = (type: IntentType, payload?: string) => {
    onNavigate(INTENT_ROUTE[type]);
    window.setTimeout(() => shell.raise(type, payload), 40);
  };

  const pages: Command[] = PAGES.map((p) => ({ id: `page:${p.route}`, group: 'Pages', label: p.label, icon: ROUTE_ICON[p.route], recent: true, run: () => onNavigate(p.route) }));
  const reduceOn = reduce ?? systemReduced;
  const actionDefs: Array<Omit<Command, 'group'> & { intent?: IntentType }> = [
    { id: 'action:add-attendee', label: 'Add attendee', icon: 'user-plus', intent: 'add-attendee', run: () => intent('add-attendee') },
    { id: 'action:add-workflow', label: 'Add registration workflow', icon: 'git-branch', intent: 'add-workflow', run: () => intent('add-workflow') },
    { id: 'action:generate-code', label: 'Generate reg code', icon: 'key-round', intent: 'generate-code', run: () => intent('generate-code') },
    { id: 'action:add-session', label: 'Add session', icon: 'calendar-plus', intent: 'add-session', run: () => intent('add-session') },
    { id: 'action:add-exhibitor', label: 'Add exhibitor', icon: 'store', intent: 'add-exhibitor', run: () => intent('add-exhibitor') },
    { id: 'action:edit-event', label: 'Edit event', icon: 'pencil', run: () => shell.setEventEditor('edit') },
    { id: 'action:switch-event', label: 'Switch event', icon: 'chevrons-up-down', run: () => openSwitcher(document.querySelector<HTMLElement>('[data-switcher-anchor]:not([data-hidden])')) },
    { id: 'action:toggle-theme', label: 'Toggle theme', sub: resolveTheme(theme) === 'dark' ? 'Switch to light' : 'Switch to dark', icon: resolveTheme(theme) === 'dark' ? 'sun' : 'moon', run: () => setTheme(resolveTheme(theme) === 'dark' ? 'light' : 'dark') },
    { id: 'action:reduce-motion', label: reduceOn ? 'Reduce motion off' : 'Reduce motion on', icon: 'accessibility', run: () => setReduce(!reduceOn) },
    {
      id: 'action:reset',
      label: 'Reset demo data',
      icon: 'rotate-ccw',
      run: async () => {
        if (await confirmDialog({ title: 'Reset demo data?', body: 'This restores every event to its seeded state. Your changes will be lost.', confirmLabel: 'Reset', danger: true })) {
          resetData();
          toast.success('Demo data restored');
        }
      },
    },
    { id: 'action:view-original', label: 'View original', icon: 'monitor', run: () => window.setTimeout(onViewOriginal, 180) },
  ];
  const actions: Command[] = actionDefs.filter((a) => !a.intent || handledIntents.has(a.intent)).map((a) => ({ ...a, group: 'Actions', recent: true }));

  const results = useMemo(() => {
    const q = query.trim();
    const out: Command[] = [];
    if (!q) {
      const all = [...pages, ...actions];
      const rec = recents.map((id) => all.find((c) => c.id === id)).filter(Boolean) as Command[];
      out.push(...rec.map((c) => ({ ...c, group: 'Recent' as const })), ...pages, ...actions);
      return out;
    }
    const rank = (list: Command[]) =>
      list
        .map((c) => ({ c, m: fuzzy(q, c.label) }))
        .filter((x) => x.m)
        .sort((a, b) => b.m!.score - a.m!.score)
        .map((x) => ({ ...x.c, indices: x.m!.indices }));
    out.push(...rank(pages), ...rank(actions));
    if (ev) {
      const hits = ev.attendees
        .map((a) => {
          const name = fullName(a);
          const nameHit = substring(q, name);
          if (nameHit) return { a, name, indices: nameHit, prio: 0 };
          if (substring(q, a.email) || substring(q, a.company ?? '')) return { a, name, indices: [], prio: 1 };
          return null;
        })
        .filter(Boolean)
        .sort((x, y) => x!.prio - y!.prio)
        .slice(0, 5) as Array<{ a: (typeof ev.attendees)[number]; name: string; indices: number[] }>;
      if (handledIntents.has('open-attendee'))
        out.push(
          ...hits.map((h) => ({
            id: `attendee:${h.a.id}`,
            group: 'Attendees' as const,
            label: h.name,
            sub: h.a.email,
            indices: h.indices,
            leading: <Avatar name={h.name} size={24} />,
            run: () => intent('open-attendee', h.a.id),
          })),
        );
      const norm = (x: string) => x.replace(/-/g, '').toLowerCase();
      const codes = ev.regCodes.filter((c) => norm(c.code).includes(norm(q)) || c.label.toLowerCase().includes(q.toLowerCase())).slice(0, 3);
      out.push(
        ...codes.map((c) => ({
          id: `code:${c.id}`,
          group: 'Reg codes' as const,
          label: c.code,
          sub: c.label,
          icon: 'key-round' as IconName,
          indices: substring(q, c.code) ?? [],
          run: async () => {
            await copyText(c.code);
            toast.success(`Copied ${c.code}`);
          },
        })),
      );
    }
    return out;
    // pages and actions are rebuilt each render from current state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, recents, ev, theme, reduceOn]);

  useEffect(() => {
    setActive(0);
  }, [query]);
  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);

  const execute = (c: Command | undefined) => {
    if (!c) return;
    if (c.recent) pushRecent(c.id.replace(/^recent:/, ''));
    close();
    c.run();
  };

  if (!presence.mounted) return null;
  const state = presence.state === 'open' ? 'open' : presence.state === 'opening' ? 'opening' : 'closed';
  let lastGroup = '';
  return (
    <Portal>
      <div className={s.root}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- scrim is a pointer affordance; Escape closes */}
        <div className={s.scrim} data-state={state} onClick={() => close()} />
        <div ref={panel} className={s.panel} role="dialog" aria-modal="true" aria-label="Command palette" data-state={state} tabIndex={-1}>
          <div className={s.inputRow}>
            <Icon name="search" size={18} className={s.inputIcon} />
            <input
              ref={input}
              className={s.input}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
              aria-label="Search pages, actions, attendees and codes"
              placeholder="Search pages, actions, attendees and codes"
              value={query}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  const n = results.length;
                  if (n) setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + n) % n);
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  execute(results[active]);
                }
              }}
            />
            {query && (
              <button type="button" className={s.clear} aria-label="Clear search" onClick={() => (setQuery(''), input.current?.focus())}>
                <Icon name="x" size={14} />
              </button>
            )}
            <button type="button" className={s.close} aria-label="Close, Esc" onClick={() => close()}>
              <Kbd>Esc</Kbd>
            </button>
          </div>
          <div id={listId} role="listbox" aria-label="Results" className={s.list} onPointerDown={(e) => e.preventDefault()}>
            {results.length === 0 && <div className={s.empty}>No results for &lsquo;{query.trim()}&rsquo;</div>}
            {results.map((c, i) => {
              const header = c.group !== lastGroup ? c.group : null;
              lastGroup = c.group;
              return (
                <Fragment key={`${c.group}-${c.id}`}>
                  {header && (
                    <div className={s.groupLabel} role="presentation">
                      {header}
                    </div>
                  )}
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- the input owns focus; Enter executes the active option (aria-activedescendant) */}
                  <div
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={s.option}
                    data-active={i === active ? 'true' : undefined}
                    onPointerMove={() => setActive(i)}
                    onClick={() => execute(c)}
                  >
                    <span className={s.optionIcon}>{c.leading ?? (c.icon ? <Icon name={c.icon} size={16} /> : null)}</span>
                    <span className={s.optionText}>
                      <span className={s.optionLabel}>
                        <Highlight text={c.label} indices={c.indices} />
                      </span>
                      {c.sub && <span className={s.optionSub}>{c.sub}</span>}
                    </span>
                    {i === active && (
                      <span className={s.enter} aria-hidden="true">
                        <Kbd>Enter ↵</Kbd>
                      </span>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </Portal>
  );
}

function Highlight({ text, indices }: { text: string; indices?: number[] }) {
  if (!indices?.length) return <>{text}</>;
  const set = new Set(indices);
  return (
    <>
      {Array.from(text).map((ch, i) =>
        set.has(i) ? (
          <mark key={i} className={s.mark}>
            {ch}
          </mark>
        ) : (
          <Fragment key={i}>{ch}</Fragment>
        ),
      )}
    </>
  );
}

export { ROUTE_LABEL };
