/* eslint-disable jsx-a11y/anchor-is-valid -- the design's links are static anchors that intentionally go nowhere */
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import s from './faithful.module.scss';
import rfLogo from '@/assets/icons/rf-logo.svg';
import searchIcon from '@/assets/icons/search.svg';
import personPortal from '@/assets/icons/person-portal.svg';
import logicArrow from '@/assets/icons/logic-arrow-primary.svg';
import computerIcon from '@/assets/icons/computer-primary.svg';
import addCircle from '@/assets/icons/add-circle-outline.svg';
import eventBadge from '@/assets/images/event-logo-178.png';
import eventLogo from '@/assets/images/event-logo.png';
import { useNarrowViewport } from './useNarrowViewport';

const stay = (e: MouseEvent) => e.preventDefault();

const SUB_ITEMS = ['Attendees', 'Attendee types', 'Packages', 'Reg codes', 'Discounts'];
const PLACEHOLDER_DESC = 'Description that explains the value goes here. Description that explains the value goes here. ';

export function FaithfulPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isNarrow = useNarrowViewport();
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setDrawerOpen(false);
    menuButton.current?.focus();
  }, []);

  // Leaving the narrow layout closes the drawer so it never reappears half-open.
  useEffect(() => {
    if (!isNarrow) setDrawerOpen(false);
  }, [isNarrow]);

  // Focus moves into the open drawer, Escape closes it, Tab stays inside it.
  useEffect(() => {
    if (!drawerOpen) return;
    const el = drawer.current;
    const focusables = () =>
      Array.from(el?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []).filter((n) => n.offsetParent !== null);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab') {
        const list = focusables();
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen, close]);

  const drawerIsModal = isNarrow && drawerOpen;

  return (
    <div className={`${s.app} ${drawerOpen ? s.isOpen : ''}`}>
      <header className={s.topbar} data-part="topbar">
        <img src={rfLogo} alt="RainFocus" width={28} height={28} />
        <img className={s.topbar__badge} src={eventBadge} alt="" width={28} height={28} />
        <span className={s.topbar__title}>RainFocus Summit</span>
        <button
          ref={menuButton}
          type="button"
          className={s.topbar__menu}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls="faithful-drawer"
          onClick={() => setDrawerOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>
      <div className={s.scrim} aria-hidden="true" onClick={close} />
      <div
        ref={drawer}
        id="faithful-drawer"
        className={s.drawer}
        inert={isNarrow && !drawerOpen}
        role={drawerIsModal ? 'dialog' : undefined}
        aria-modal={drawerIsModal ? true : undefined}
        aria-label={drawerIsModal ? 'Navigation' : undefined}
      >
        <aside className={s.rail} data-part="rail">
          <div className={s.rail__top}>
            <a className={s.rail__logo} href="#" aria-label="RainFocus" onClick={stay}>
              <img src={rfLogo} alt="" width={32} height={32} />
            </a>
            <a className={s.rail__org} href="#" aria-label="Company" onClick={stay}>
              <img src={eventBadge} alt="" width={32} height={32} />
            </a>
          </div>
          <div className={s.rail__bottom}>
            <a className={s.rail__user} href="#" aria-label="FL, First Name Last Name" onClick={stay}>
              <span className={s.avatar}>FL</span>
            </a>
          </div>
        </aside>

        <nav className={s.sidebar} aria-label="Event navigation" data-part="sidebar">
          <div className={s.sidebar__header}>
            <h2 className={s.sidebar__title}>RainFocus Summit</h2>
          </div>
          <div className={s.sidebar__details}>
            <span>Lehi, UT</span>
            <span className={s.sidebar__dot}>•</span>
            <span>December 15th</span>
          </div>
          <div className={s.sidebar__search}>
            <button className={s.search} type="button">
              <img src={searchIcon} alt="" width={16} height={16} />
              <span>Search</span>
            </button>
          </div>

          <ul className={s.meganav}>
            <li>
              <a className={s.meganav__item} href="#" onClick={stay}>
                <span className={s.meganav__icon} />
                <span className={s.meganav__label}>Guide</span>
              </a>
            </li>
            <li>
              <a className={`${s.meganav__item} ${s.isActive}`} href="#" aria-current="page" onClick={stay}>
                <span className={s.meganav__icon} />
                <span className={s.meganav__label}>Attendees</span>
              </a>
              <ul className={s.subnav}>
                {SUB_ITEMS.map((label) => (
                  <li key={label}>
                    <a className={s.subnav__item} href="#" onClick={stay}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <a className={s.meganav__item} href="#" onClick={stay}>
                <span className={s.meganav__icon} />
                <span className={s.meganav__label}>Content</span>
              </a>
            </li>
            <li>
              <a className={s.meganav__item} href="#" onClick={stay}>
                <span className={s.meganav__icon} />
                <span className={s.meganav__label}>Exhibitors</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <main className={s.body}>
        <header className={s.event} data-part="header">
          <img className={s.event__logo} src={eventLogo} alt="RainFocus Summit logo" width={95} height={95} />
          <div className={s.event__meta}>
            <h1 className={s.event__title}>RainFocus Summit</h1>
            <div className={s.event__details}>
              <p>December 15th</p>
              <p>Lehi, Utah</p>
            </div>
          </div>
          <button className={s.button} type="button">
            Edit event
          </button>
        </header>

        <section className={s.intro} data-part="intro">
          <h2 className={s.intro__title}>Event setup guide</h2>
          <p className={s.intro__desc}>See the available list of modules below. We suggest that you start with the attendee module.</p>
        </section>

        <section className={s.module} data-part="module">
          <header className={s.module__header}>
            <img src={personPortal} alt="" width={35} height={35} />
            <h3 className={s.module__title}>Attendee</h3>
          </header>

          <div className={s.step}>
            <p className={s.step__label}>
              <strong>Step 1:</strong> Base settings.
            </p>
            <div className={s.stepRow}>
              <a className={s.setting} href="#" onClick={stay}>
                <span className={s.setting__title}>General</span>
                <span className={s.setting__desc}>Define Attendee types &amp; attributes</span>
              </a>
              <a className={s.setting} href="#" onClick={stay}>
                <span className={s.setting__title}>Title</span>
                <span className={s.setting__desc}>{PLACEHOLDER_DESC}</span>
              </a>
              <a className={s.setting} href="#" onClick={stay}>
                <span className={s.setting__title}>Title</span>
                <span className={s.setting__desc}>{PLACEHOLDER_DESC}</span>
              </a>
            </div>
          </div>

          <div className={s.step}>
            <p className={s.step__label}>
              <strong>Step 2:</strong> Build registration workflows.
            </p>
            <div className={s.cards}>
              {[0, 1, 2].map((i) => (
                <a key={i} className={s.card} href="#" onClick={stay}>
                  <span className={s.card__header}>
                    <img src={logicArrow} alt="" width={24} height={24} />
                    <span className={s.card__title}>Attendee Registration</span>
                  </span>
                  <span className={s.card__desc}>Start by creating a general registration workflow</span>
                </a>
              ))}
              <a className={`${s.card} ${s['card--add']}`} href="#" onClick={stay}>
                <img src={addCircle} alt="" width={24} height={24} />
                <span className={s.card__desc}>Add Registration Workflow</span>
              </a>
              <span className={`${s.card} ${s['card--filler']}`} aria-hidden="true" />
              <span className={`${s.card} ${s['card--filler']}`} aria-hidden="true" />
            </div>
          </div>

          <div className={s.step}>
            <p className={s.step__label}>
              <strong>Step 3:</strong> Design post-registration experiences.
            </p>
            <div className={s.cards}>
              <a className={s.card} href="#" onClick={stay}>
                <span className={s.card__header}>
                  <img src={computerIcon} alt="" width={24} height={24} />
                  <span className={s.card__title}>Attendee Portal</span>
                </span>
                <span className={s.card__desc}>Manage the portal that attendees will see after they’ve register for your event.</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
