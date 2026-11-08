// Anchored positioning for popovers, menus and tooltips: prefer a side, flip when it would leave the
// viewport, then clamp so a floating element never opens off screen.
export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';
export type Placement = `${Side}` | `${Side}-${Exclude<Align, 'center'>}`;

export interface Positioned {
  left: number;
  top: number;
  side: Side;
  align: Align;
  /** CSS transform-origin pointing back at the anchor, so the element grows from its trigger. */
  origin: string;
  /** Arrow offset along the edge, for tooltips. */
  arrow: number;
}

const MARGIN = 8;

export function parsePlacement(p: Placement): { side: Side; align: Align } {
  const [side, align] = p.split('-') as [Side, Align | undefined];
  return { side, align: align ?? 'center' };
}

const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

export function computePosition(anchor: DOMRect, floating: { width: number; height: number }, placement: Placement, gap = 6): Positioned {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let { side, align } = parsePlacement(placement);

  const fits = (s: Side) => {
    if (s === 'bottom') return anchor.bottom + gap + floating.height <= vh - MARGIN;
    if (s === 'top') return anchor.top - gap - floating.height >= MARGIN;
    if (s === 'right') return anchor.right + gap + floating.width <= vw - MARGIN;
    return anchor.left - gap - floating.width >= MARGIN;
  };
  if (!fits(side) && fits(opposite[side])) side = opposite[side];

  let left = 0;
  let top = 0;
  if (side === 'bottom' || side === 'top') {
    top = side === 'bottom' ? anchor.bottom + gap : anchor.top - gap - floating.height;
    if (align === 'start') left = anchor.left;
    else if (align === 'end') left = anchor.right - floating.width;
    else left = anchor.left + anchor.width / 2 - floating.width / 2;
    // Flip the alignment when the preferred one would overflow horizontally.
    if (align === 'start' && left + floating.width > vw - MARGIN) {
      align = 'end';
      left = anchor.right - floating.width;
    } else if (align === 'end' && left < MARGIN) {
      align = 'start';
      left = anchor.left;
    }
  } else {
    left = side === 'right' ? anchor.right + gap : anchor.left - gap - floating.width;
    if (align === 'start') top = anchor.top;
    else if (align === 'end') top = anchor.bottom - floating.height;
    else top = anchor.top + anchor.height / 2 - floating.height / 2;
  }
  left = Math.min(Math.max(MARGIN, left), Math.max(MARGIN, vw - floating.width - MARGIN));
  top = Math.min(Math.max(MARGIN, top), Math.max(MARGIN, vh - floating.height - MARGIN));

  const ox = side === 'left' ? '100%' : side === 'right' ? '0%' : align === 'start' ? '0%' : align === 'end' ? '100%' : '50%';
  const oy = side === 'top' ? '100%' : side === 'bottom' ? '0%' : align === 'start' ? '0%' : align === 'end' ? '100%' : '50%';
  const arrow = side === 'top' || side === 'bottom' ? anchor.left + anchor.width / 2 - left : anchor.top + anchor.height / 2 - top;
  return { left, top, side, align, origin: `${ox} ${oy}`, arrow };
}
