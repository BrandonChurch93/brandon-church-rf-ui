import type { Ref, RefCallback } from 'react';

/** Combines refs so one element can feed several owners. */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (el) => {
    for (const r of refs) {
      if (!r) continue;
      if (typeof r === 'function') r(el);
      else (r as { current: T | null }).current = el;
    }
  };
}
