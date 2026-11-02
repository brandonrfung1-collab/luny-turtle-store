import { Link } from 'react-router-dom';
import { existingArt, priceRuleTail, useDocumentTitle } from '../components/commission/content';
import { Icon, type IconName } from '../components/Icons';
import { Turtle } from '../components/TurtleLogo';
import { products } from '../data/products';
import { site } from '../data/site';
import type { Product } from '../data/types';
import { dollars } from '../lib/format';
import styles from './Shop.module.css';

const plaids = ['plaid-pink', 'plaid-blue', 'plaid-green', 'plaid-butter'];
const tilts = [-2.5, 2, -1.5, 2.5];

const goodToKnow: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'truck',
    title: site.shippingIncluded ? 'Shipping is included' : 'Shipping',
    body: 'Your original drawing is packed with care and shipped to your door, or straight to the lucky giftee.',
  },
  {
    icon: 'pencil',
    title: 'Sketch approval before ink',
    body: 'I send you a pencil sketch first, so you can request changes before any ink goes down.',
  },
  {
    icon: 'camera',
    title: 'No perfect photo needed',
    body: '"Here are pics of my fam. Can you draw us paddle boarding?" works just as well.',
  },
];

export default function Shop() {
  useDocumentTitle('Commission a drawing · Luny Turtle');

  return (
    <>
      <section className={`section--tight ${styles.intro}`}>
        <div className="container">
          <div className={styles.introInner}>
            <p className="eyebrow">
              <Icon name="sparkle" size={14} /> Commissions
            </p>
            <h1 className="h-display">
              Pick your <span className="squiggle">drawing</span>
            </h1>
            <p className="lead">
              Four ways to turn your people (and pets) into a little piece of joy. Every drawing is made by hand in{' '}
              {site.medium.toLowerCase()}, and you'll see a sketch before I ink a thing.
            </p>
          </div>
          <Turtle size={96} className={styles.introTurtle} />
        </div>
      </section>

      <section className={styles.listSection} aria-label="Drawing types">
        <div className="container">
          <ul className={styles.grid}>
            {products.map((p, i) => (
              <li key={p.slug}>
                <ProductCard product={p} plaid={plaids[i % plaids.length]} tilt={tilts[i % tilts.length]} eager={i < 2} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section--tight" aria-labelledby="good-to-know">
        <div className="container">
          <div className={`${styles.strip} plaid-butter`}>
            <h2 id="good-to-know" className={styles.stripTitle}>
              Good to know
            </h2>
            <ul className={styles.stripList}>
              {goodToKnow.map((g) => (
                <li key={g.title}>
                  <span className={styles.stripIcon} aria-hidden="true">
                    <Icon name={g.icon} size={24} />
                  </span>
                  <div>
                    <h3 className={styles.stripItemTitle}>{g.title}</h3>
                    <p className={styles.stripItemBody}>{g.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className={styles.stripFoot}>
              More questions about sizes, timing or photos?{' '}
              <Link to="/faq" className="link">
                Read the FAQ
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductCard({ product: p, plaid, tilt, eager }: { product: Product; plaid: string; tilt: number; eager: boolean }) {
  const art = existingArt([p.heroArtId, ...p.exampleArtIds])[0];
  const href = `/shop/${p.slug}`;
  return (
    <article className={`card ${styles.card}`}>
      <div className={`${styles.art} ${plaid}`}>
        {art ? (
          <div className={`sticker ${styles.sticker}`} style={{ ['--tilt' as string]: `${tilt}deg` }}>
            <img src={art.src} alt={art.alt} width={art.width} height={art.height} loading={eager ? 'eager' : 'lazy'} />
          </div>
        ) : (
          <Turtle size={110} />
        )}
        <span className={styles.size}>{p.size}</span>
      </div>
      <div className={styles.body}>
        <h2 className={styles.name}>
          <Link to={href} className={styles.stretched}>
            {p.name}
          </Link>
        </h2>
        <p className={styles.tagline}>{p.tagline}</p>
        <p className={styles.meta}>
          {p.size} · {p.medium}
        </p>
        <div className={styles.foot}>
          <div className={styles.priceBlock}>
            <span className={styles.price}>{dollars(p.basePrice)}</span>
            <span className={styles.rule}>
              <span>
                {priceRuleTail(p)
                  .split(', ')
                  .map((part, i) => (
                    <span key={part} className={styles.ruleLine}>
                      {i > 0 && <span className="visually-hidden">, </span>}
                      {part}
                    </span>
                  ))}
              </span>
              {!p.priceConfirmed && <span className="badge">Demo price</span>}
            </span>
          </div>
          <span className={`btn btn--primary ${styles.cta}`} aria-hidden="true">
            Start <Icon name="arrowRight" size={18} />
          </span>
        </div>
      </div>
    </article>
  );
}
