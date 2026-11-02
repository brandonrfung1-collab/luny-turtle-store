import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { existingArt, figuresLabel, snippet, useDocumentTitle } from '../components/commission/content';
import { Icon } from '../components/Icons';
import { Turtle } from '../components/TurtleLogo';
import { occasionLabels, productBySlug, products } from '../data/products';
import { site } from '../data/site';
import type { CartItem } from '../data/types';
import { dollars, plural } from '../lib/format';
import { useCart } from '../state/cart';
import styles from './Cart.module.css';

const UNDO_MS = 7000;

export default function Cart() {
  useDocumentTitle('Your cart · Luny Turtle');
  const { items, subtotal, removeItem, addItem, photosNotPersisted } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [removed, setRemoved] = useState<CartItem | null>(null);
  const [savedId, setSavedId] = useState<string | null>(() => (location.state as { savedId?: string } | null)?.savedId ?? null);
  const undoTimer = useRef<number>();
  const undoBtnRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // "Saved your changes" comes in via router state; clear it so a refresh doesn't show it again.
  useEffect(() => {
    if ((location.state as { savedId?: string } | null)?.savedId) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!savedId) return;
    const t = window.setTimeout(() => setSavedId(null), 5000);
    return () => window.clearTimeout(t);
  }, [savedId]);

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  function remove(item: CartItem) {
    removeItem(item.id);
    setRemoved(item);
    setSavedId(null);
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setRemoved(null), UNDO_MS);
    // Keep keyboard focus somewhere sensible once the row disappears.
    requestAnimationFrame(() => (undoBtnRef.current ?? headingRef.current)?.focus({ preventScroll: true }));
  }

  function undo() {
    if (!removed) return;
    addItem(removed.config, removed.quantity);
    setRemoved(null);
    window.clearTimeout(undoTimer.current);
    headingRef.current?.focus({ preventScroll: true });
  }

  const undoBar = removed && (
    <div className={`notice ${styles.undo} pop-in`} role="status">
      <Icon name="trash" size={18} />
      <span className={styles.undoText}>
        Removed <strong>{productBySlug(removed.config.productSlug)?.name ?? 'drawing'}</strong> from your cart.
      </span>
      <button ref={undoBtnRef} type="button" className="btn btn--sm btn--butter" onClick={undo}>
        Undo
      </button>
    </div>
  );

  if (items.length === 0) {
    return (
      <section className="section">
        <div className={`container container--narrow ${styles.empty}`}>
          {undoBar}
          <div className={styles.emptyArt} aria-hidden="true">
            <Turtle size={150} />
          </div>
          <h1 ref={headingRef} tabIndex={-1} className="h1">
            Your cart is empty
          </h1>
          <p className="lead">Nothing here yet, but I'd love to draw the people (and pets) you love.</p>
          <Link to="/shop" className="btn btn--primary btn--lg">
            Pick your drawing <Icon name="arrowRight" size={20} />
          </Link>
          <ul className={styles.emptyLinks} aria-label="Drawing types">
            {products.map((p) => (
              <li key={p.slug}>
                <Link to={`/shop/${p.slug}`} className="chip">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section className={`section--tight ${styles.page}`}>
      <div className="container">
        <div className={styles.head}>
          <div>
            <h1 ref={headingRef} tabIndex={-1} className="h1">
              Your cart
            </h1>
            <p className="muted">
              {plural(items.length, 'drawing')}, {items.length === 1 ? 'an original' : 'each one an original'} made just for you.
            </p>
          </div>
          <Link to="/shop" className="btn btn--sm">
            <Icon name="plus" size={16} strokeWidth={2.8} /> Add another drawing
          </Link>
        </div>

        <div className={styles.layout}>
          <div className={styles.listCol}>
            {undoBar}
            {savedId && items.some((i) => i.id === savedId) && (
              <div className={`notice notice--green ${styles.saved} pop-in`} role="status">
                <Icon name="check" size={18} strokeWidth={3} /> Saved your changes.
              </div>
            )}
            {photosNotPersisted && (
              <div className={`notice notice--blue ${styles.photosNote}`}>
                <Icon name="camera" size={20} />
                <span>
                  Your reference photos are a little too big to save in this browser, so they're kept in this tab only. Check out from
                  here and they'll come along; if you close the tab you may need to add them again.
                </span>
              </div>
            )}
            <ul className={styles.list} aria-label="Commissions in your cart">
              {items.map((item) => (
                <CartLine key={item.id} item={item} highlight={item.id === savedId} onRemove={() => remove(item)} />
              ))}
            </ul>
          </div>

          <aside className={styles.summaryCol} aria-labelledby="summary-title">
            <div className={`card ${styles.summary}`}>
              <h2 id="summary-title" className={styles.summaryTitle}>
                Order summary
              </h2>
              <dl className={styles.lines}>
                <div className={styles.line}>
                  <dt>Subtotal ({plural(items.length, 'drawing')})</dt>
                  <dd>{dollars(subtotal)}</dd>
                </div>
                <div className={styles.line}>
                  <dt>Shipping</dt>
                  <dd className={styles.free}>
                    <Icon name="truck" size={16} /> Included
                  </dd>
                </div>
              </dl>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span key={subtotal} className={styles.total}>
                  {dollars(subtotal)}
                </span>
              </div>
              <Link to="/checkout" className="btn btn--primary btn--lg btn--block">
                <Icon name="lock" size={18} /> Checkout
              </Link>
              <ul className={styles.trust}>
                <li>
                  <Icon name="pencil" size={16} />
                  <span>You'll approve a pencil sketch before any ink goes down.</span>
                </li>
                <li>
                  <Icon name="truck" size={16} />
                  <span>Shipping is included, and it can go straight to a giftee.</span>
                </li>
                <li className={styles.demo}>
                  <Icon name="info" size={16} />
                  <span>{site.demoNotice}</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function CartLine({ item, highlight, onRemove }: { item: CartItem; highlight: boolean; onRemove: () => void }) {
  const product = productBySlug(item.config.productSlug);
  const c = item.config;
  const photo = c.referencePhotos?.[0];
  const art = product ? existingArt([product.heroArtId])[0] : undefined;
  const name = product?.name ?? 'Custom drawing';
  const photos = c.referencePhotos?.length ?? 0;

  return (
    <li className={`card ${styles.item} ${highlight ? styles.highlight : ''}`}>
      <div className={styles.thumb}>
        {photo ? (
          <img src={photo.dataUrl} alt={`Your reference photo for the ${name.toLowerCase()}`} />
        ) : art ? (
          <img src={art.src} alt={`Example: ${art.alt}`} />
        ) : (
          <Turtle size={56} />
        )}
      </div>

      <div className={styles.info}>
        <h2 className={styles.itemTitle}>
          {name}
          {product && <span className={styles.itemSize}>{product.size}</span>}
        </h2>

        <ul className={styles.tags} aria-label="Details">
          <li>
            <Icon name="sparkle" size={14} /> {occasionLabels[c.occasion] ?? c.occasion}
          </li>
          {product?.hasFigures && (
            <li>
              <Icon name={c.people === 0 && c.pets > 0 ? 'paw' : 'people'} size={15} /> {figuresLabel(c)}
            </li>
          )}
          <li>
            <Icon name="camera" size={15} /> {photos > 0 ? plural(photos, 'reference photo') : 'No photos'}
          </li>
          {c.isGift && (
            <li className={styles.giftTag}>
              <Icon name="gift" size={15} /> Gift
            </li>
          )}
        </ul>

        {(c.sceneIdea || c.ornaments || c.textToInclude) && (
          <dl className={styles.details}>
            {c.sceneIdea && (
              <div>
                <dt>{product?.hasFigures ? 'Scene' : 'Ornament'}</dt>
                <dd>{snippet(c.sceneIdea)}</dd>
              </div>
            )}
            {c.ornaments && (
              <div>
                <dt>Ornaments</dt>
                <dd>{snippet(c.ornaments, 90)}</dd>
              </div>
            )}
            {c.textToInclude && (
              <div>
                <dt>Text</dt>
                <dd>&ldquo;{snippet(c.textToInclude, 60)}&rdquo;</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      <span className={styles.price}>
        {dollars(item.unitPrice * item.quantity)}
        {item.quantity > 1 && <span className={styles.qty}> ({item.quantity} × {dollars(item.unitPrice)})</span>}
      </span>

      <div className={styles.actions}>
        <Link to={`/shop/${item.config.productSlug}?edit=${encodeURIComponent(item.id)}`} className="btn btn--sm" aria-label={`Edit ${name}`}>
          <Icon name="edit" size={16} /> Edit
        </Link>
        <button type="button" className={`btn btn--sm btn--ghost ${styles.remove}`} onClick={onRemove} aria-label={`Remove ${name}`}>
          <Icon name="trash" size={16} /> Remove
        </button>
      </div>
    </li>
  );
}
