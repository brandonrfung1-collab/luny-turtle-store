import { useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { CommissionBuilder } from '../components/commission/CommissionBuilder';
import { moreArtFor, priceRuleTail, productArt, useDocumentTitle } from '../components/commission/content';
import { ProductGallery } from '../components/commission/ProductGallery';
import { Icon } from '../components/Icons';
import { Turtle } from '../components/TurtleLogo';
import { productBySlug, products } from '../data/products';
import { processSteps } from '../data/site';
import type { Product } from '../data/types';
import { dollars } from '../lib/format';
import { useCart } from '../state/cart';
import styles from './ProductPage.module.css';

const plaidFor: Record<string, string> = {
  'full-portrait': 'plaid-pink',
  'close-up-portrait': 'plaid-blue',
  'christmas-tree': 'plaid-green',
  ornament: 'plaid-butter',
};

export default function ProductPage() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const { getItem } = useCart();
  const product = productBySlug(slug);
  const [total, setTotal] = useState(product?.basePrice ?? 0);

  useDocumentTitle(product ? `${product.name} · Luny Turtle` : 'Drawing not found · Luny Turtle');

  if (!product) return <ProductNotFound />;

  const editId = params.get('edit');
  const candidate = editId ? getItem(editId) : undefined;
  // An edit link that points at the wrong product page: send it to the right one.
  if (candidate && candidate.config.productSlug !== product.slug) {
    return <Navigate to={`/shop/${candidate.config.productSlug}?edit=${encodeURIComponent(candidate.id)}`} replace />;
  }
  const editItem = candidate;
  const staleEdit = !!editId && !editItem;

  return (
    <>
      <div className={`container ${styles.page}`}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link to="/shop">Commission</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className={styles.layout}>
          <div className={styles.galleryCol}>
            <div className={styles.sticky}>
              <ProductGallery key={product.slug} product={product} total={total} plaid={plaidFor[product.slug]} />
            </div>
          </div>

          <header className={styles.head}>
            <p className="eyebrow">
              <Icon name="sparkle" size={14} /> {editItem ? 'Editing your commission' : 'Commission a drawing'}
            </p>
            <h1 className={`h1 ${styles.title}`}>{product.name}</h1>
            <p className={`lead ${styles.tagline}`}>{product.tagline}</p>
            <div className={styles.priceRow}>
              <span className={styles.price}>{dollars(product.basePrice)}</span>
              <span className={styles.priceTail}>{priceRuleTail(product)}</span>
              {!product.priceConfirmed && <span className="badge">Demo price</span>}
            </div>
            <p className={styles.desc}>{product.description}</p>
            {staleEdit && (
              <div className="notice">
                <Icon name="info" size={20} />
                <span>That drawing isn't in your cart anymore, so this is a fresh one. Your other cart items are safe.</span>
              </div>
            )}
          </header>

          <div className={styles.formCol}>
            <CommissionBuilder key={`${product.slug}:${editItem?.id ?? 'new'}`} product={product} editItem={editItem} onTotalChange={setTotal} />
          </div>
        </div>
      </div>

      <HowItWorks />
      <MoreDrawings product={product} />
    </>
  );
}

function HowItWorks() {
  return (
    <section className={`section--tight plaid-blue ${styles.how}`} aria-labelledby="how-title">
      <div className="container">
        <div className={styles.howHead}>
          <h2 id="how-title" className="h2">
            How it works
          </h2>
          <Link to="/faq" className="link">
            Questions? Read the FAQ
          </Link>
        </div>
        <ol className={styles.steps}>
          {processSteps.map((s, i) => (
            <li key={s.title} className={`card ${styles.step}`}>
              <span className={styles.stepNum} aria-hidden="true">
                {i + 1}
              </span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepBody}>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function MoreDrawings({ product }: { product: Product }) {
  // Close-ups already show every close-up example above, so suggest the full-body drawing instead.
  const crossSell = product.slug === 'close-up-portrait' ? productBySlug('full-portrait') : undefined;
  const source = crossSell ?? product;
  const shown = [...productArt(product), ...productArt(source)].map((a) => a.id);
  const more = moreArtFor(source, shown, 3);
  if (more.length === 0) return null;
  return (
    <section className={`section--tight ${styles.more}`} aria-labelledby="more-title">
      <div className="container">
        <div className={styles.howHead}>
          <h2 id="more-title" className="h2">
            {crossSell ? 'Want the whole scene?' : 'More from the sketchbook'}
          </h2>
          {crossSell ? (
            <Link to={`/shop/${crossSell.slug}`} className="link">
              Try a {crossSell.name.toLowerCase()}
            </Link>
          ) : (
            <Link to="/gallery" className="link">
              See the whole gallery
            </Link>
          )}
        </div>
        <ul className={styles.moreGrid}>
          {more.map((a, i) => (
            <li key={a.id}>
              <figure className={styles.moreFig}>
                <div className="sticker sticker--hover" style={{ ['--tilt' as string]: `${[-2, 1.5, -1][i % 3]}deg` }}>
                  <img src={a.src} alt={a.alt} width={a.width} height={a.height} loading="lazy" />
                </div>
                <figcaption className={styles.moreCaption}>{a.title}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProductNotFound() {
  return (
    <section className="section">
      <div className={`container container--narrow ${styles.notFound}`}>
        <Turtle size={120} className={styles.notFoundTurtle} />
        <h1 className="h1">Hmm, I don't draw that one (yet)!</h1>
        <p className="lead">That drawing type doesn't exist, but here's everything I do make:</p>
        <ul className={styles.notFoundList}>
          {products.map((p) => (
            <li key={p.slug}>
              <Link to={`/shop/${p.slug}`} className="chip">
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/shop" className="btn btn--primary btn--lg">
          Pick your drawing <Icon name="arrowRight" size={20} />
        </Link>
      </div>
    </section>
  );
}
