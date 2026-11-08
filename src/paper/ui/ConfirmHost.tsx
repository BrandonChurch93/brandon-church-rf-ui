import { useId, useRef, useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useConfirmStore } from './confirmStore';
import s from './sheet.module.scss';

/** Renders the oldest pending confirmation. Destructive ones focus Cancel; others focus the action. */
export function ConfirmHost() {
  const pending = useConfirmStore((st) => st.queue[0]);
  const settle = useConfirmStore((st) => st.settle);
  const cancel = useRef<HTMLButtonElement>(null);
  const confirm = useRef<HTMLButtonElement>(null);
  const bodyId = useId();
  const [shown, setShown] = useState(pending);
  const [open, setOpen] = useState(Boolean(pending));

  useEffect(() => {
    if (pending) {
      setShown(pending);
      setOpen(true);
    } else setOpen(false);
  }, [pending]);

  if (!shown) return null;
  const done = (ok: boolean) => settle(shown.id, ok);
  return (
    <Modal
      open={open}
      onClose={() => done(false)}
      title={shown.title}
      width={420}
      role="alertdialog"
      describedBy={shown.body ? bodyId : undefined}
      initialFocus={shown.danger ? cancel : confirm}
      hideClose
      footer={
        <>
          <Button ref={cancel} variant="secondary" onClick={() => done(false)}>
            {shown.cancelLabel ?? 'Cancel'}
          </Button>
          <Button ref={confirm} variant={shown.danger ? 'danger' : 'primary'} onClick={() => done(true)}>
            {shown.confirmLabel}
          </Button>
        </>
      }
    >
      {shown.body && (
        <div id={bodyId} className={s.confirmBody}>
          {shown.body}
        </div>
      )}
      {shown.extra}
    </Modal>
  );
}
