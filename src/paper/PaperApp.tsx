import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { PaperAppProps } from '@/app/ModeStage';
import { PaperRootContext } from './ui/overlay/Portal';
import { Shell } from './shell/Shell';
import { SignInScreen } from './shell/SignInScreen';
import { Announcer } from './shell/Announcer';
import { TooltipHost } from './ui/Tooltip';
import { ToastHost } from './ui/ToastHost';
import { ConfirmHost } from './ui/ConfirmHost';
import { toast, useToasts } from './ui/toastStore';
import { useStore } from '@/store/store';
import { onStorageFallback } from '@/store/storage';
import { isReducedMotion } from '@/motion/reduced';
import { layerStack } from '@/app/layerStack';

/** Brandon's Mode: the shell (or the sign-in screen) plus every global host. */
export function PaperApp({ onViewOriginal, arriving }: PaperAppProps) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const signedOut = useStore((st) => st.ui.signedOut);
  const setSignedOut = useStore((st) => st.setSignedOut);
  const app = useRef<HTMLDivElement>(null);

  // One-time notices: version reseed, restored records, storage that cannot persist.
  useEffect(() => {
    useStore
      .getState()
      .consumeNotices()
      .forEach((n) => toast(n));
    let shown = false;
    return onStorageFallback(() => {
      if (shown) return;
      shown = true;
      toast("Changes won't be saved in this browser");
    });
  }, []);

  const fadeSwap = (next: boolean) => {
    const el = app.current;
    layerStack.closeAll({ instant: true });
    // Signing out or in starts a fresh session: toasts about the previous one go with it.
    useToasts.getState().toasts.forEach((t) => useToasts.getState().dismiss(t.id));
    if (!el || isReducedMotion()) {
      setSignedOut(next);
      return;
    }
    gsap.to(el, {
      opacity: 0,
      duration: 0.32,
      ease: 'power2.in',
      onComplete: () => {
        setSignedOut(next);
        requestAnimationFrame(() => gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.42, ease: 'power3.out', clearProps: 'opacity' }));
      },
    });
  };

  return (
    <PaperRootContext.Provider value={root}>
      <div ref={app} data-app-root>
        {signedOut ? <SignInScreen onSignIn={() => fadeSwap(false)} /> : <Shell arriving={arriving} onViewOriginal={onViewOriginal} onSignOut={() => fadeSwap(true)} />}
      </div>
      <div ref={setRoot} data-paper-root />
      <TooltipHost />
      <ToastHost />
      <ConfirmHost />
      <Announcer />
    </PaperRootContext.Provider>
  );
}
