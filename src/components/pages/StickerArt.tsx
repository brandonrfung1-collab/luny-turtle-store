import type { CSSProperties } from 'react';
import type { Artwork } from '../../data/types';

interface StickerArtProps {
  art: Artwork;
  /** degrees */
  tilt?: number;
  tape?: boolean;
  /** straighten + lift on hover (only when the sticker sits inside a link or button) */
  hover?: boolean;
  eager?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** One of Esther's drawings shown as a white-bordered sticker, at its natural aspect ratio (never cropped). */
export function StickerArt({ art, tilt = 0, tape, hover, eager, className = '', style }: StickerArtProps) {
  const classes = ['sticker', tape ? 'tape' : '', hover ? 'sticker--hover' : '', className].filter(Boolean).join(' ');
  return (
    <div className={classes} style={{ ['--tilt' as string]: `${tilt}deg`, ...style }}>
      <img
        src={art.src}
        alt={art.alt}
        width={art.width}
        height={art.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
}
