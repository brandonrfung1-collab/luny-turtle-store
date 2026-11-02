import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { Turtle } from '../components/TurtleLogo';
import { pickArt } from '../components/pages/artHelpers';
import { StickerArt } from '../components/pages/StickerArt';
import { getProduct, products } from '../data/products';
import { processSteps, site } from '../data/site';
import { dollars } from '../lib/format';
import styles from './Faq.module.css';
import { usePageTitle } from '../components/pages/usePageTitle';

interface Qa {
  id: string;
  q: string;
  a: ReactNode;
}

function PaddleboardQuote() {
  const [art] = pickArt(['paddleboard-family']);
  return (
    <div className={styles.quoteWithArt}>
      <blockquote className={styles.pullQuote}>
        <p>“Here are pics of my fam. Can you draw us paddle boarding?”</p>
      </blockquote>
      {art && (
        <Link to="/gallery?art=paddleboard-family" className={styles.inlineArt} aria-label={`${art.title} (open in gallery)`}>
          <StickerArt art={art} tilt={3} hover />
        </Link>
      )}
    </div>
  );
}

function buildFaqs(): Qa[] {
  const full = getProduct('full-portrait');
  return [
    {
      id: 'pricing',
      q: 'How much does a drawing cost? What counts as a figure?',
      a: (
        <>
          <p>
            A full-body portrait is <strong>{dollars(full.basePrice)} for up to {full.includedFigures} figures</strong>, plus{' '}
            {dollars(full.extraFigurePrice)} for every additional figure. Every person <em>and</em> every pet counts as one figure, so
            a couple with their dog is 3 figures and a family of four with a cat is 5. Shipping is included.
          </p>
          <ul className={styles.priceList}>
            {products.map((p) => (
              <li key={p.slug}>
                <Link to={`/shop/${p.slug}`} className={styles.priceName}>
                  {p.name}
                </Link>
                <span className={styles.priceRule}>
                  {dollars(p.basePrice)}
                  {p.hasFigures ? ` for up to ${p.includedFigures} figures, +${dollars(p.extraFigurePrice)} each extra` : ', flat price'}
                </span>
                {p.priceConfirmed ? (
                  <span className="badge badge--green">Confirmed</span>
                ) : (
                  <span className="badge">Demo price</span>
                )}
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: 'size',
      q: 'What size is the drawing, and what is it made with?',
      a: (
        <p>
          Full-body, close-up and Christmas tree portraits are <strong>8" x 10"</strong>. Ornament drawings are a smaller{' '}
          <strong>4" x 6"</strong>. Everything is drawn by hand in {site.medium.toLowerCase()}, finished with white sticker-style
          outlines and signed with my name and a little turtle.
        </p>
      ),
    },
    {
      id: 'photo',
      q: 'Do I need a perfect photo?',
      a: (
        <>
          <p>
            Nope! A few everyday photos of your people (and pets) are plenty, and you don't need an exact photo of the scene you
            want. A message like this works just as well:
          </p>
          <PaddleboardQuote />
        </>
      ),
    },
    {
      id: 'sketch',
      q: 'Can I see a sketch first?',
      a: <p>Yes! {processSteps[1].body}</p>,
    },
    {
      id: 'changes',
      q: 'What if I want changes after I order?',
      a: (
        <p>
          That's what the sketch is for. After you order, I'll email you a pencil sketch for approval. Tell me what to tweak (a
          hairstyle, a pose, the color of the dog's sweater) and I'll only start inking once you're happy with it.
        </p>
      ),
    },
    {
      id: 'timing',
      q: 'How long does it take?',
      a: (
        <p>
          Typically {site.turnaround}. <span className="badge">Demo estimate</span> If you have a special date in mind, mention it
          in your order notes and I'll let you know honestly whether I can make it.
        </p>
      ),
    },
    {
      id: 'shipping',
      q: 'How does shipping work?',
      a: (
        <p>
          Shipping is included in every price. Your original drawing is packed with care and shipped to {site.shipsTo}.{' '}
          <span className="badge">Demo detail</span> You can follow along on the{' '}
          <Link to="/track" className="link">
            Track an order
          </Link>{' '}
          page, from sketch to shipped.
        </p>
      ),
    },
    {
      id: 'gift',
      q: 'Can I order a drawing as a gift?',
      a: (
        <p>
          Absolutely, drawings make lovely gifts! Mark your drawing as a gift, add a little gift note, and use the recipient's
          address at checkout so it ships straight to the lucky giftee.
        </p>
      ),
    },
    {
      id: 'holidays',
      q: 'When should I order for the holidays?',
      a: (
        <p>
          As early as you can! {site.holidayNotice} Holiday spots are limited, so ordering early gives us the most time for the
          sketch, any changes, and shipping. Christmas tree portraits and ornament drawings are both available.
        </p>
      ),
    },
    {
      id: 'real',
      q: 'Is this store real?',
      a: (
        <p>
          Not yet! {site.demoNotice} To commission a real drawing today, send a DM on Instagram to{' '}
          <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="link">
            {site.instagramHandle}
          </a>
          .
        </p>
      ),
    },
  ];
}

export default function Faq() {
  usePageTitle('FAQ · Luny Turtle');
  const faqs = buildFaqs();
  const [sideArt] = pickArt(['two-cats', 'windmill-friends', 'hanbok-couple']);
  return (
    <>
      <section className={styles.head}>
        <div className="container">
          <p className="eyebrow">FAQ</p>
          <h1 className="h1">Questions, answered</h1>
          <p className="lead">Everything you might want to know before commissioning a drawing.</p>
        </div>
      </section>

      <section className={styles.body}>
        <div className={`container ${styles.layout}`}>
          <div className={styles.list}>
            {faqs.map((f, i) => (
              <details key={f.id} id={f.id} className={styles.item} open={i === 0}>
                <summary className={styles.summary}>
                  <span className={styles.q}>{f.q}</span>
                  <span className={styles.toggle} aria-hidden="true">
                    <Icon name="plus" size={20} strokeWidth={2.6} />
                  </span>
                </summary>
                <div className={styles.answer}>{f.a}</div>
              </details>
            ))}
          </div>

          <aside className={styles.aside} aria-label="Contact">
            <div className={`card ${styles.contact}`}>
              {sideArt && (
                <div className={styles.contactArt}>
                  <StickerArt art={sideArt} tilt={-3} tape />
                </div>
              )}
              <h2 className="h3">Still have a question?</h2>
              <p className="small muted">
                DM me on Instagram and tell me what you're dreaming up. I'm happy to help you figure out the right drawing.
              </p>
              <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="btn btn--block">
                <Icon name="instagram" size={20} /> {site.instagramHandle}
              </a>
              <Link to="/shop" className="btn btn--primary btn--block">
                Start a commission
              </Link>
              <p className={styles.contactSign}>
                <Turtle size={26} /> {site.artistFirstName}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
