import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { CommissionConfig, Product } from '../../data/types';
import { priceFor } from '../../lib/pricing';
import { useCart } from '../../state/cart';
import { Icon } from '../Icons';
import { existingArt, figuresLabel } from './content';
import styles from './Builder.module.css';

interface AddedToastProps {
  product: Product;
  config: CommissionConfig;
  onClose: () => void;
}

/** "Added to your cart!" panel that pops up after adding a commission. Escape closes it. */
export function AddedToast({ product, config, onClose }: AddedToastProps) {
  const { count } = useCart();
  const viewRef = useRef<HTMLAnchorElement>(null);
  const art = existingArt([product.heroArtId])[0];
  const photo = config.referencePhotos[0];

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    viewRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={styles.toast} role="dialog" aria-modal="false" aria-labelledby="added-toast-title">
      <button type="button" className={styles.toastClose} onClick={onClose} aria-label="Close">
        <Icon name="close" size={18} strokeWidth={2.8} />
      </button>
      <div className={styles.toastBody}>
        <div className={styles.toastArt}>
          {photo ? <img src={photo.dataUrl} alt="" /> : art ? <img src={art.src} alt="" /> : <Icon name="palette" size={30} />}
          <span className={styles.toastCheck} aria-hidden="true">
            <Icon name="check" size={16} strokeWidth={3.4} />
          </span>
        </div>
        <div>
          <p id="added-toast-title" className={styles.toastTitle}>
            Added to your cart!
          </p>
          <p className={styles.toastMeta}>
            {product.name}
            {product.hasFigures && <> · {figuresLabel(config)}</>} · ${priceFor(config)}
          </p>
        </div>
      </div>
      <div className={styles.toastActions}>
        <Link ref={viewRef} to="/cart" className="btn btn--primary btn--sm">
          View cart{count > 1 ? ` (${count})` : ''} <Icon name="arrowRight" size={18} />
        </Link>
        <Link to="/shop" className="btn btn--ghost btn--sm">
          Keep browsing
        </Link>
      </div>
    </div>
  );
}
