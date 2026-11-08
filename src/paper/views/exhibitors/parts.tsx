import type { ExhibitorTier } from '@/store/types';
import { Chip } from '../../ui/display';
import { TIER_META, monogram } from './meta';
import s from './exhibitors.module.scss';

/** Two-letter tile in the tier swatch: soft fill, ink text. */
export function Monogram({ name, tier, size = 44 }: { name: string; tier: ExhibitorTier; size?: number }) {
  const sw = TIER_META[tier].swatch;
  return (
    <span className={s.mono} style={{ width: size, height: size, fontSize: Math.round(size * 0.34), background: `var(--sw-${sw}-soft)`, color: `var(--sw-${sw}-ink)` }} aria-hidden="true">
      {monogram(name)}
    </span>
  );
}

export function TierChip({ tier }: { tier: ExhibitorTier }) {
  return <Chip swatch={TIER_META[tier].swatch}>{TIER_META[tier].label}</Chip>;
}
