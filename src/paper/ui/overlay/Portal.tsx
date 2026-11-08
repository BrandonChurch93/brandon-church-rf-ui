import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Overlays render into a root inside the paper layer so they inherit the Paper base styles (D-7).
export const PaperRootContext = createContext<HTMLElement | null>(null);

export function Portal({ children }: { children: ReactNode }) {
  const root = useContext(PaperRootContext);
  if (!root) return null;
  return createPortal(children, root);
}
