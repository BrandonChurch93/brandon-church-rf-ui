import type { EventLogo as Logo } from '@/store/types';
import rainfocusBadge from '@/assets/images/event-logo-178.png';
import rainfocusLarge from '@/assets/images/event-logo.png';
import s from './eventLogo.module.scss';

interface EventLogoProps {
  logo: Logo;
  size: number;
  radius?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Decorative unless an accessible name is given. */
  alt?: string;
}

/** The event's mark: the bundled RainFocus badge, an uploaded image, or a monogram on a swatch. */
export function EventLogo({ logo, size, radius = 'md', className, alt = '' }: EventLogoProps) {
  const style = { width: size, height: size };
  const cls = `${s.logo} ${s[radius]} ${className ?? ''}`;
  if (logo.kind === 'bundled') return <img className={cls} style={style} src={size > 64 ? rainfocusLarge : rainfocusBadge} alt={alt} width={size} height={size} draggable={false} />;
  if (logo.kind === 'custom') return <img className={cls} style={style} src={logo.dataUrl} alt={alt} width={size} height={size} draggable={false} />;
  return (
    <span
      className={`${cls} ${s.monogram}`}
      style={{ ...style, fontSize: Math.round(size * 0.36), background: `var(--sw-${logo.swatch}-soft)`, color: `var(--sw-${logo.swatch}-ink)` }}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      {logo.letters}
    </span>
  );
}
