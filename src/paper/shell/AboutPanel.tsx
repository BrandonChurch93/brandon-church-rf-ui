import { useEffect, useRef } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button, ButtonLink } from '../ui/Button';
import { Chip } from '../ui/display';
import { Kbd } from '../ui/Kbd';
import { useShell } from '../shellStore';
import { author } from '@/data/author';
import rfMark from '@/assets/icons/rf-logo.svg';
import badge from '@/assets/images/event-logo-178.png';
import s from './overlays.module.scss';

const STACK = ['React', 'TypeScript', 'Vite', 'SCSS modules', 'GSAP', 'Zustand', 'dnd-kit', 'Lucide', 'Playwright', 'Claude Code'];

/** About this build: what it is, who built it, the stack and the shortcuts. */
export function AboutPanel({ onViewOriginal }: { onViewOriginal: () => void }) {
  const about = useShell((st) => st.about);
  const close = useShell((st) => st.closeAbout);
  const shortcuts = useRef<HTMLElement>(null);

  useEffect(() => {
    if (about.open && about.section === 'shortcuts') {
      const t = window.setTimeout(() => shortcuts.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
      return () => window.clearTimeout(t);
    }
  }, [about]);

  return (
    <Sheet
      open={about.open}
      onClose={close}
      title="About this build"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              close();
              window.setTimeout(onViewOriginal, 340);
            }}
          >
            View original
          </Button>
          <span style={{ flex: 1 }} />
          <Button variant="primary" onClick={close}>
            Close
          </Button>
        </>
      }
    >
      <section className={s.aboutSection}>
        <div className={s.aboutMarks}>
          <img src={badge} alt="RainFocus Summit badge" />
          <span className={s.aboutMark}>
            <img src={rfMark} alt="RainFocus" />
          </span>
        </div>
        <h3>RainFocus UI challenge, taken a little further</h3>
        <p>
          The original view is a pixel-exact build of the Figma design from the take-home brief. Brandon&apos;s Mode is what that page becomes as a finished product: the same information
          architecture, every control working, light and dark, desktop and mobile.
        </p>
      </section>
      <section className={s.aboutSection}>
        <h3>Built by</h3>
        <p>
          {author.name}, {author.role}
        </p>
        <div className={s.aboutLinks}>
          <ButtonLink href={author.portfolioUrl} target="_blank" rel="noreferrer" trailingIcon="external-link" aria-label="Portfolio (opens in a new tab)">
            Portfolio
          </ButtonLink>
          {author.repoUrl && (
            <ButtonLink href={author.repoUrl} target="_blank" rel="noreferrer" trailingIcon="external-link" aria-label="Repository (opens in a new tab)">
              Repository
            </ButtonLink>
          )}
        </div>
      </section>
      <section className={s.aboutSection}>
        <h3>Stack</h3>
        <div className={s.aboutChips}>
          {STACK.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      </section>
      <section className={s.aboutSection} ref={shortcuts}>
        <h3>Shortcuts</h3>
        <dl className={s.shortcuts}>
          <dt>
            <Kbd mod>K</Kbd>
          </dt>
          <dd>Search and commands</dd>
          <dt>
            <Kbd>Esc</Kbd>
          </dt>
          <dd>Close the top layer</dd>
          <dt>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
          </dt>
          <dd>Move in lists and menus</dd>
          <dt>
            <Kbd>Enter</Kbd>
          </dt>
          <dd>Open or confirm</dd>
          <dt>
            <Kbd>?</Kbd>
          </dt>
          <dd>Show these shortcuts</dd>
          <dt>
            <Kbd mod>Z</Kbd>
          </dt>
          <dd>Undo the last change while its notice is showing</dd>
        </dl>
      </section>
    </Sheet>
  );
}
