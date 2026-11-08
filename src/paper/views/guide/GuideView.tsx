import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { ViewProps } from '../../shell/ViewSwitch';
import { useStore, selectActive } from '@/store/store';
import { guideProgress } from '@/store/selectors';
import { ProgressBar } from '../../ui/display';
import { Icon } from '../../ui/Icon';
import { isReducedMotion } from '@/motion/reduced';
import { registerLanding } from '@/motion/landing';
import { EventHero } from './EventHero';
import { SettingsStep } from './SettingsStep';
import { WorkflowsStep } from './WorkflowsStep';
import { ExperiencesStep } from './ExperiencesStep';
import personPortal from '@/assets/icons/person-portal.svg';
import s from './guide.module.scss';

/** The home view: the Figma page as a finished product. */
export function GuideView(_props: ViewProps) {
  const ev = useStore(selectActive);
  const setCollapsed = useStore((st) => st.setModuleCollapsed);
  const progress = guideProgress(ev);
  const open = !ev.moduleCollapsed;
  const body = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  const summary = `${progress.done} of ${progress.total} configured`;

  // The progress bar and status chip are the landing beats of the mode transition.
  useLayoutEffect(() => registerLanding({ progressFill: fill.current, chip: chip.current }), []);

  // Progress changes draw the bar from its previous value (700 ms).
  const lastPct = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = fill.current;
    const pct = (progress.done / Math.max(1, progress.total)) * 100;
    if (el && lastPct.current !== null && lastPct.current !== pct && !isReducedMotion()) {
      gsap.fromTo(el, { width: `${lastPct.current}%` }, { width: `${pct}%`, duration: 0.7, ease: 'power3.out', clearProps: 'width' });
    }
    lastPct.current = pct;
  }, [progress.done, progress.total]);

  // Accordion: 480 ms open with the steps fading in, 320 ms close.
  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    if (first.current) {
      first.current = false;
      gsap.set(el, { height: open ? 'auto' : 0 });
      return;
    }
    gsap.killTweensOf(el);
    if (isReducedMotion()) {
      gsap.set(el, { height: open ? 'auto' : 0 });
      return;
    }
    const kids = Array.from(el.firstElementChild?.children ?? []);
    if (open) {
      gsap.fromTo(el, { height: el.offsetHeight }, { height: el.scrollHeight, duration: 0.48, ease: 'power3.out', onComplete: () => gsap.set(el, { height: 'auto' }) });
      gsap.fromTo(kids, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.04, clearProps: 'opacity,transform' });
    } else {
      gsap.to(kids, { opacity: 0, duration: 0.12, ease: 'power2.in' });
      gsap.fromTo(el, { height: el.offsetHeight }, { height: 0, duration: 0.32, ease: 'power2.in', delay: 0.08, onComplete: () => gsap.set(kids, { clearProps: 'opacity' }) });
    }
  }, [open]);

  const toggle = () => setCollapsed(open);

  return (
    <div className={s.view}>
      <EventHero chipRef={chip} />
      <section className={s.intro} data-part aria-labelledby="view-title">
        <div className={s.introRow}>
          <h1 id="view-title" className={s.introTitle}>
            Event setup guide
          </h1>
          <span className={s.summary}>{summary}</span>
        </div>
        <p className={s.introDescription}>See the available list of modules below. We suggest that you start with the attendee module.</p>
      </section>

      <section className={s.module} data-part aria-labelledby="module-attendee">
        {/* The header row is the accordion toggle; the progress bar inside it is display only. */}
        <div
          className={s.moduleHeader}
          role="button"
          tabIndex={0}
          aria-expanded={open}
          aria-controls="module-attendee-body"
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle();
            }
          }}
        >
          <img className={s.moduleIcon} src={personPortal} alt="" />
          <div className={s.moduleTitleBlock}>
            <h2 id="module-attendee" className={s.moduleTitle}>
              Attendee
            </h2>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- stops the bar from toggling the module; it is not interactive */}
            <div className={s.progressRow} onClick={(e) => e.stopPropagation()}>
              <ProgressBar value={progress.done} max={progress.total} label={`Setup progress, ${summary}`} variant="gradient" fillRef={fill} />
              <span className={s.progressText}>{summary}</span>
            </div>
          </div>
          <span className={s.chevron} data-open={open} aria-hidden="true">
            <Icon name="chevron-down" size={18} />
          </span>
          <span className="sr-only">{open ? 'Collapse' : 'Expand'}</span>
        </div>
        <div ref={body} id="module-attendee-body" className={s.moduleBody} inert={!open}>
          <div className={s.moduleInner}>
            <SettingsStep />
            <WorkflowsStep />
            <ExperiencesStep />
          </div>
        </div>
      </section>
    </div>
  );
}
