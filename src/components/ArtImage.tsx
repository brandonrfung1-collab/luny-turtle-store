import type { ImgHTMLAttributes } from 'react';
import { artById } from '../data/artworks';

interface ArtImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> {
  /** Artwork id from src/data/artworks.ts */
  id: string;
  /** set true for above-the-fold images */
  eager?: boolean;
}

/** Renders one of Esther's drawings by id, with correct alt text and intrinsic size. */
export function ArtImage({ id, eager, ...rest }: ArtImageProps) {
  const art = artById(id);
  if (!art) {
    if (import.meta.env.DEV) console.warn(`ArtImage: unknown artwork id "${id}"`);
    return null;
  }
  return (
    <img
      src={art.src}
      alt={art.alt}
      width={art.width}
      height={art.height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      {...rest}
    />
  );
}
