import { Button } from '../ui/Button';
import { EventLogo } from './EventLogo';
import { useStore, selectActive } from '@/store/store';
import { USER } from './AccountMenu';
import s from './shell.module.scss';

/** Shown after signing out. Signing in restores the session exactly as it was. */
export function SignInScreen({ onSignIn }: { onSignIn: () => void }) {
  const ev = useStore(selectActive);
  return (
    <main className={s.signIn} aria-labelledby="signin-title">
      <div className={s.signInCard}>
        <EventLogo logo={ev.logo} size={56} radius="lg" />
        <h2 id="signin-title">You&apos;re signed out</h2>
        <p>This is a demo. No account is needed.</p>
        <Button variant="primary" fullWidth className={s.signInButton} autoFocus onClick={onSignIn}>
          Sign in as {USER.name}
        </Button>
        <span className={s.signInNote}>Signing in restores your session exactly as you left it.</span>
      </div>
    </main>
  );
}
