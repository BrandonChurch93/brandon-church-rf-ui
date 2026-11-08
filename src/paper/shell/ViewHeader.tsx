import type { ReactNode } from 'react';
import { useRoute } from './routeContext';
import { useBreakpoint } from '../hooks/useMediaQuery';
import { ATTENDEE_ROUTES } from '../routes';
import { AttendeeSubnav } from './AttendeeSubnav';
import s from './shell.module.scss';

interface ViewHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

/** Title, one-line description and the view's actions (one primary at most). */
export function ViewHeader({ title, description, actions }: ViewHeaderProps) {
  const { route, navigate } = useRoute();
  const { isMobile } = useBreakpoint();
  const header = (
    <header className={s.viewHeader} data-part>
      <div className={s.viewTitleBlock}>
        <h1 className={s.viewTitle} id="view-title">
          {title}
        </h1>
        {description && <p className={s.viewDescription}>{description}</p>}
      </div>
      {actions && <div className={s.viewActions}>{actions}</div>}
    </header>
  );
  if (!isMobile || !ATTENDEE_ROUTES.includes(route)) return header;
  return (
    <>
      {header}
      <AttendeeSubnav route={route} onNavigate={navigate} />
    </>
  );
}
