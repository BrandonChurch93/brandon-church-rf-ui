import type { PaperAppProps } from '@/app/ModeStage';
import s from './placeholder.module.scss';

// Placeholder destination for the P2 transition; the real shell arrives in P3.
export function PaperApp(_props: PaperAppProps) {
  return (
    <div className={s.page}>
      <header className={s.header} data-part>
        <h1>Brandon&apos;s Mode</h1>
        <p>The finished product view arrives in the next phase.</p>
      </header>
      <section className={s.card} data-part />
      <section className={s.card} data-part />
    </div>
  );
}
