// Little hand-drawn doodles (hearts, stars, sparkles, arrows) used to decorate the
// home, about and 404 pages. All decorative: hidden from screen readers.
import type { CSSProperties } from 'react';

interface DoodleProps {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

const base = {
  fill: 'none',
  stroke: 'var(--ink)',
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
};

export function DoodleHeart({ size = 34, color = 'var(--tomato)', className, style }: DoodleProps) {
  return (
    <svg {...base} className={className} style={style} width={size} height={size} viewBox="0 0 40 40">
      <path
        d="M20 34c-1.2-.9-13.5-8.4-14.6-16.3C4.6 11.9 8.4 7 13.3 7.2c3.1.1 5.3 2.2 6.6 4.9 1.4-2.8 3.8-5 7-5 4.9 0 8.4 4.8 7.5 10.3C33.2 25.4 21.4 33 20 34Z"
        fill={color}
      />
      <path d="M11.5 13.5c.8-1.6 2-2.4 3.4-2.5" stroke="#fff" strokeWidth={2} />
    </svg>
  );
}

export function DoodleStar({ size = 34, color = 'var(--butter)', className, style }: DoodleProps) {
  return (
    <svg {...base} className={className} style={style} width={size} height={size} viewBox="0 0 40 40">
      <path
        d="M20 4.5l4.4 9.6 10.4 1.2-7.7 7.1 2.1 10.3L20 27.5l-9.2 5.2 2.1-10.3-7.7-7.1 10.4-1.2L20 4.5Z"
        fill={color}
      />
    </svg>
  );
}

export function DoodleSparkle({ size = 28, color = 'var(--sky)', className, style }: DoodleProps) {
  return (
    <svg {...base} className={className} style={style} width={size} height={size} viewBox="0 0 40 40">
      <path d="M20 3c1 9 5 13.5 14 15-9 1.5-13 6-14 15-1-9-5-13.5-14-15 9-1.5 13-6 14-15Z" fill={color} />
    </svg>
  );
}

/** A loopy hand-drawn arrow pointing right. */
export function DoodleArrow({ size = 90, className, style }: DoodleProps) {
  return (
    <svg {...base} className={className} style={style} width={size} height={(size * 46) / 100} viewBox="0 0 100 46">
      <path d="M4 30c14-14 30-18 40-8 6 6-1 14-6 8-4-5 4-13 16-15 13-2 25 2 38 9" />
      <path d="M82 13l10 11-14 3" />
    </svg>
  );
}

/** Three little motion dashes, like the ones she draws around happy figures. */
export function DoodleDashes({ size = 30, className, style }: DoodleProps) {
  return (
    <svg {...base} className={className} style={style} width={size} height={size} viewBox="0 0 40 40">
      <path d="M8 14l-4-6M20 10V3M32 14l4-6" />
    </svg>
  );
}

/** A tiny sprig of leaves. */
export function DoodleSprig({ size = 40, color = 'var(--sage)', className, style }: DoodleProps) {
  return (
    <svg {...base} className={className} style={style} width={size} height={size} viewBox="0 0 40 40">
      <path d="M8 34C16 26 22 17 30 6" />
      <path d="M16 25c-6 0-9-3-10-7 5-1 9 1 10 7Z" fill={color} />
      <path d="M21 18c0-6 3-9 7-10 1 5-1 9-7 10Z" fill={color} />
      <path d="M23 21c5-2 9-1 11 2-4 3-8 3-11-2Z" fill={color} />
    </svg>
  );
}
