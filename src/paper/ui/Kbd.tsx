import { isMac } from '@/paper/hooks/useHotkey';
import s from './kbd.module.scss';

/** A keyboard key. `mod` renders ⌘ on Mac and Ctrl elsewhere. */
export function Kbd({ children, mod, className }: { children?: React.ReactNode; mod?: boolean; className?: string }) {
  const modLabel = isMac() ? '⌘' : 'Ctrl';
  return (
    <kbd className={`${s.kbd} ${className ?? ''}`}>
      {mod && <span aria-label={isMac() ? 'Command' : 'Control'}>{modLabel}</span>}
      {mod && !isMac() && children ? <span aria-hidden="true">+</span> : null}
      {children}
    </kbd>
  );
}
