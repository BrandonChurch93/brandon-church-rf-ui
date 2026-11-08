// Undo tokens: every destructive action returns an inverse operation that the caller hands to the
// toast system. Undo re-applies the inverse against the current state, so list positions come back.
export interface UndoToken {
  undo: () => void;
}

export const noUndo: UndoToken = { undo: () => undefined };
