import { useState } from 'react';
import type { Product } from '../../data/types';
import { Icon } from '../Icons';
import { Turtle } from '../TurtleLogo';
import { includedFor, productArt } from './content';
import styles from './ProductGallery.module.css';

const plaids = ['plaid-pink', 'plaid-blue', 'plaid-green', 'plaid-butter'];

interface ProductGalleryProps {
  product: Product;
  /** live total from the builder, shown on the price tag */
  total: number;
  plaid?: string;
}

/** Left column of the product page: big drawing + thumbnails, quick facts, what's included. */
export function ProductGallery({ product, total, plaid = plaids[0] }: ProductGalleryProps) {
  const art = productArt(product);
  const [activeId, setActiveId] = useState(art[0]?.id);
  const active = art.find((a) => a.id === activeId) ?? art[0];

  return (
    <div className={styles.gallery}>
      <figure className={`${styles.stage} ${plaid}`}>
        {active ? (
          <div key={active.id} className={`sticker ${styles.mainSticker}`}>
            <img src={active.src} alt={active.alt} width={active.width} height={active.height} className={styles.mainImg} />
          </div>
        ) : (
          <div className={styles.placeholder}>
            <Turtle size={120} />
            <span className="hand">Drawings coming soon</span>
          </div>
        )}
        <p className={styles.facts}>
          <span>{product.size}</span>
          <span aria-hidden="true">·</span>
          <span>{product.medium}</span>
        </p>
        <div className={styles.tag}>
          <span className={styles.tagLabel}>your total</span>
          <span key={total} className={styles.tagPrice}>
            ${total}
          </span>
        </div>
        {active && (
          <figcaption className={styles.caption}>
            {active.caption ? <>&ldquo;{trimCaption(active.caption)}&rdquo;</> : active.title}
          </figcaption>
        )}
      </figure>

      {art.length > 1 && (
        <div className={styles.thumbs} role="group" aria-label="More examples of this drawing">
          {art.map((a, i) => (
            <button
              key={a.id}
              type="button"
              className={styles.thumb}
              aria-pressed={a.id === active?.id}
              aria-label={`Show ${a.title}`}
              onClick={() => setActiveId(a.id)}
              style={{ ['--tilt' as string]: `${[-3, 2, -1.5, 3, -2, 1.5, -2.5][i % 7]}deg` }}
            >
              <img src={a.src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className={styles.included}>
        <h2 className={styles.includedTitle}>What's included</h2>
        <ul>
          {includedFor(product).map((line) => (
            <li key={line}>
              <span className={styles.check} aria-hidden="true">
                <Icon name="check" size={13} strokeWidth={3.4} />
              </span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Captions can be long Instagram posts; keep the first sentence or so. */
function trimCaption(c: string): string {
  const first = c.split(/(?<=[.!?~])\s+/)[0] ?? c;
  return first.length > 140 ? `${first.slice(0, 137).trimEnd()}…` : first;
}
