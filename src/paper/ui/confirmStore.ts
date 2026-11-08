// Confirmations as a promise: `if (await confirmDialog({...})) remove()`. The host renders them.
import type { ReactNode } from 'react';
import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Extra content between the body and the buttons (the reassign Select). */
  extra?: ReactNode;
}

interface Pending extends ConfirmOptions {
  id: number;
  resolve: (ok: boolean) => void;
}

interface ConfirmState {
  queue: Pending[];
  push(p: Pending): void;
  settle(id: number, ok: boolean): void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  queue: [],
  push: (p) => set({ queue: [...get().queue, p] }),
  settle: (id, ok) => {
    const p = get().queue.find((q) => q.id === id);
    p?.resolve(ok);
    set({ queue: get().queue.filter((q) => q.id !== id) });
  },
}));

let counter = 0;
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => useConfirmStore.getState().push({ ...opts, id: ++counter, resolve }));
}
