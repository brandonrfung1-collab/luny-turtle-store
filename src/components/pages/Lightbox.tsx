import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { getProduct } from '../../data/products';
import { site } from '../../data/site';
import type { ArtCategory, Artwork } from '../../data/types';
import { dollars } from '../../lib/format';
import { Icon } from '../Icons';
import { Turtle } from '../TurtleLogo';
import { categoryLabels, productFor } from './artHelpers';
import styles from './Lightbox.module.css';

interface LightboxProps {
  items: Artwork[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  /** show every drawing in this category (closes the lightbox) */
  onPickCategory?: (c: ArtCategory) => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Full-screen, accessible viewer for one drawing, with prev/next within the current list. */
export function Lightbox({ items, index, onClose, onNavigate, onPickCategory }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const art = items[index];
  const count = items.length;
  const go = (delta: number) => onNavigate((index + delta + count) % count);

  // Keep the latest callbacks for the document-level key handler.
  const latest = useRef({ go, onClose });
  latest.current = { go, onClose };

  // Lock page scroll, make the page behind inert, and move focus into the dialog.
  useEffect(() => {
    const { body } = document;
    const root = document.getElementById('root');
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    root?.setAttribute('inert', '');
    root?.setAttribute('aria-hidden', 'true');
    closeRef.current?.focus();
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      root?.removeAttribute('inert');
      root?.removeAttribute('aria-hidden');
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        latest.current.onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        latest.current.go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        latest.current.go(-1);
      } else if (e.key === 'Tab' && dialogRef.current) {
        // Trap focus inside the dialog.
        const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Warm up the neighbours so arrowing through feels instant.
  useEffect(() => {
    if (count < 2) return;
    for (const d of [1, -1]) {
      const n = items[(index + d + count) % count];
      if (n) new Image().src = n.src;
    }
  }, [index, items, count]);

  if (!art) return null;
  const product = getProduct(productFor(art));
  const isSketch = art.kind === 'process';
  const cats = art.categories.filter((c) => c !== 'process');

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="lightbox-title">
        <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close">
          <Icon name="close" size={24} />
        </button>

        <div className={styles.stage}>
          <img key={art.id} className={styles.image} src={art.src} alt={art.alt} width={art.width} height={art.height} />
          {count > 1 && (
            <>
              <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => go(-1)} aria-label="Previous drawing">
                <Icon name="arrowLeft" size={22} />
              </button>
              <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => go(1)} aria-label="Next drawing">
                <Icon name="arrowRight" size={22} />
              </button>
            </>
          )}
        </div>

        <div className={styles.info}>
          <p className="visually-hidden" aria-live="polite">
            {art.title}, {index + 1} of {count}
          </p>
          <p className={styles.counter} aria-hidden="true">
            {index + 1} of {count}
            {isSketch && <span className="badge badge--blue">Sketch</span>}
          </p>
          <h2 id="lightbox-title" className={styles.title}>
            {art.title}
          </h2>

          {art.caption && (
            <blockquote className={styles.caption}>
              <p>“{art.caption}”</p>
              <footer>
                <Turtle size={24} /> {site.artistFirstName}
              </footer>
            </blockquote>
          )}

          {cats.length > 0 && onPickCategory && (
            <div className={styles.cats}>
              <span className={styles.catsLabel}>More like this:</span>
              {cats.map((c) => (
                <button key={c} type="button" className={styles.cat} onClick={() => onPickCategory(c)}>
                  {categoryLabels[c]}
                </button>
              ))}
            </div>
          )}

          <div className={styles.cta}>
            <Link to={`/shop/${product.slug}`} className="btn btn--primary btn--block">
              Commission something like this
            </Link>
            <p className={styles.ctaNote}>
              {product.name} · {product.hasFigures ? 'from ' : ''}
              {dollars(product.basePrice)}
              {!product.priceConfirmed && <span className="badge">Demo price</span>}
            </p>
          </div>

          <p className={styles.hint} aria-hidden="true">
            Use ← → to browse · Esc to close
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
