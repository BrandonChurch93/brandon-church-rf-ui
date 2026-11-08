// Focus helpers shared by every dialog-like layer.
const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
    if (el.closest('[inert]')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    return el.getClientRects().length > 0;
  });
}

/** Keeps Tab and Shift+Tab inside `root`. Returns true when it handled the key. */
export function trapTab(e: KeyboardEvent, root: HTMLElement) {
  if (e.key !== 'Tab') return false;
  const list = focusables(root);
  if (!list.length) {
    e.preventDefault();
    root.focus();
    return true;
  }
  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement as HTMLElement | null;
  const inside = active && root.contains(active);
  if (e.shiftKey && (active === first || !inside)) {
    e.preventDefault();
    last.focus();
    return true;
  }
  if (!e.shiftKey && (active === last || !inside)) {
    e.preventDefault();
    first.focus();
    return true;
  }
  return false;
}
