import { useEffect, useState } from 'react';
import { onAnnounce } from '../lib/announce';

/** The two live regions: polite for notices, assertive for blocking errors. */
export function Announcer() {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  useEffect(
    () =>
      onAnnounce((msg, p) => {
        const set = p === 'assertive' ? setAssertive : setPolite;
        set('');
        window.setTimeout(() => set(msg), 50);
      }),
    [],
  );
  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </>
  );
}
