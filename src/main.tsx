import '@/styles/globals.scss';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { installTestHooks } from '@/app/testHooks';

installTestHooks();

const root = document.getElementById('root');
if (root) {
  if (import.meta.env.DEV && window.location.hash === '#dev-gallery') {
    // The primitives gallery is dev only; this branch is removed from production builds.
    void import('@/dev/Gallery').then(({ Gallery }) => {
      document.documentElement.dataset.theme ||= 'light';
      createRoot(root).render(
        <StrictMode>
          <Gallery />
        </StrictMode>,
      );
    });
  } else {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
}
