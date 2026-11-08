import { useEffect, useRef, useState } from 'react';
import { isReducedMotion } from '@/motion/reduced';
import s from './guide.module.scss';

/** "Configured" with a check that draws in and pops the moment an item becomes configured. */
export function ConfiguredStatus({ done }: { done: boolean }) {
  const prev = useRef(done);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    if (!prev.current && done && !isReducedMotion()) {
      setAnimate(true);
      const t = window.setTimeout(() => setAnimate(false), 900);
      prev.current = done;
      return () => window.clearTimeout(t);
    }
    prev.current = done;
  }, [done]);
  if (!done)
    return (
      <span className={s.status} data-done="false">
        Not configured
      </span>
    );
  return (
    <span className={s.status} data-done="true">
      <svg className={`${s.check} ${animate ? s.checkDraw : ''}`} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" data-check={animate ? 'drawing' : 'static'}>
        <path d="M2.5 7.4 5.6 10.4 11.5 3.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Configured
    </span>
  );
}
