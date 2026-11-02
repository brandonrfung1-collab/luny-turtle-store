import { artById } from '../../data/artworks';
import { productBySlug } from '../../data/products';
import type { ProductSlug } from '../../data/types';
import { ArtImage } from '../ArtImage';
import { Turtle } from '../TurtleLogo';
import styles from './ItemThumb.module.css';

interface ItemThumbProps {
  slug: ProductSlug;
  /** first reference photo (data URL in the cart, /uploads/... URL on an order) */
  photo?: string;
  size?: number;
  tilt?: number;
  className?: string;
}

/** Square sticker thumbnail for a commission: the customer's first reference photo, else the product's example drawing. */
export function ItemThumb({ slug, photo, size = 64, tilt = 0, className = '' }: ItemThumbProps) {
  const product = productBySlug(slug);
  const hasArt = Boolean(product && artById(product.heroArtId));
  return (
    <span className={`${styles.thumb} ${className}`} style={{ width: size, height: size, ['--tilt' as string]: `${tilt}deg` }}>
      {photo ? (
        <img src={photo} alt="" className={styles.img} />
      ) : hasArt && product ? (
        <ArtImage id={product.heroArtId} className={styles.img} eager />
      ) : (
        <span className={styles.fallback}>
          <Turtle size={Math.round(size * 0.62)} fill="var(--sage-soft)" />
        </span>
      )}
    </span>
  );
}
