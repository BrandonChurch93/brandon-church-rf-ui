import { useEffect, useState } from 'react';

/** Form-sheet plumbing: a draft taken each time the sheet opens, dirty tracking, touched fields. */
export function useDraft<T>(open: boolean, initial: () => T) {
  const [draft, setDraft] = useState<T>(initial);
  const [base, setBase] = useState<T>(initial);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (!open) return;
    const v = initial();
    setDraft(v);
    setBase(v);
    setTouched({});
    setSubmitted(false);
    // The draft is taken once each time the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  const set = <K extends keyof T>(k: K, v: T[K]) => setDraft((x) => ({ ...x, [k]: v }));
  return {
    draft,
    setDraft,
    set,
    dirty,
    touched,
    // Leaving a field flags it only once the form has been edited: tabbing or clicking through a
    // pristine form shows no errors, so nothing shifts under the pointer mid-click. Submit shows all.
    touch: (k: string) => {
      if (dirty) setTouched((t) => ({ ...t, [k]: true }));
    },
    submitted,
    setSubmitted,
    /** The error for a field, once it has been touched or the form submitted. */
    show: <E extends Record<string, string | undefined>>(errors: E, k: keyof E & string) => (touched[k] || submitted ? errors[k] : undefined),
  };
}
