import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { Turtle } from '../components/TurtleLogo';
import { pickArt, pickArtWithFallback } from '../components/pages/artHelpers';
import { DoodleArrow, DoodleDashes, DoodleHeart, DoodleSparkle, DoodleSprig, DoodleStar } from '../components/pages/Doodles';
import { StickerArt } from '../components/pages/StickerArt';
import { artById } from '../data/artworks';
import { getProduct, products } from '../data/products';
import { aboutCopy, processSteps, site } from '../data/site';
import type { Product, ProductSlug } from '../data/types';
import { dollars } from '../lib/format';
import styles from './Home.module.css';

/** The confirmed starting price (full-body portrait). */
const fromPrice = dollars(getProduct('full-portrait').basePrice);

export default function Home() {
  return (
    <div className={styles.home}>
      <Hero />
      <ChooseDrawing />
      <HowItWorks />
      <GalleryTeaser />
      <Holidays />
      <MeetEsther />
      <ClosingCta />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

/** A family with their pup, a couple, a wedding: the range in a single glance. */
// (paddleboard-family and moo-closeup already front the product cards just below, so they're not repeated here.)
const heroArt = () => pickArtWithFallback(['autumn-dog-family', 'tulip-couple', 'elopement-wedding'], 3);

function Hero() {
  const [big, top, bottom] = heroArt();
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroInner}`}>
        <div className={styles.heroCopy}>
          <p className={`eyebrow ${styles.heroEyebrow}`}>
            <Turtle size={30} fill="var(--sage-soft)" /> Hand-drawn portrait commissions
          </p>
          <h1 className={`h-display ${styles.heroTitle}`}>
            Little drawings of{' '}
            <span className={styles.nowrap}>
              the <span className={styles.heroUnderline}>people you love</span>
            </span>
          </h1>
          <p className={`lead ${styles.heroLead}`}>
            Ink and colored pencil portraits of couples, families and pets, drawn by hand by {site.artistName}.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/shop" className="btn btn--primary btn--lg">
              Start a commission <Icon name="arrowRight" size={20} />
            </Link>
            <Link to="/gallery" className="btn btn--lg">
              See the gallery
            </Link>
          </div>
          <ul className={styles.facts} aria-label="At a glance">
            <li>
              <Icon name="heart" size={18} /> From {fromPrice}
            </li>
            <li>
              <Icon name="pencil" size={18} /> 8" x 10"
            </li>
            <li>
              <Icon name="truck" size={18} /> Shipping included
            </li>
          </ul>
        </div>

        <div className={styles.heroArt}>
          <div className={`plaid-pink ${styles.heroMat}`} aria-hidden="true" />
          <div className={styles.cluster}>
            {big && <StickerArt art={big} tilt={-3} tape eager className={styles.clusterBig} />}
            {top && <StickerArt art={top} tilt={4} eager className={styles.clusterTop} />}
            {bottom && <StickerArt art={bottom} tilt={-2} tape eager className={styles.clusterBottom} />}
          </div>
          <DoodleHeart className={`${styles.doodle} ${styles.dHeart}`} size={44} />
          <DoodleStar className={`${styles.doodle} ${styles.dStar}`} size={40} />
          <DoodleSparkle className={`${styles.doodle} ${styles.dSparkle}`} size={32} />
          <DoodleHeart className={`${styles.doodle} ${styles.dHeart2}`} size={26} color="var(--blush)" />
          <DoodleDashes className={`${styles.doodle} ${styles.dDashes}`} size={34} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Choose your drawing                                                 */
/* ------------------------------------------------------------------ */

const productTint: Record<ProductSlug, string> = {
  'full-portrait': 'plaid-pink',
  'close-up-portrait': 'plaid-blue',
  'christmas-tree': 'plaid-green',
  ornament: 'plaid-butter',
};

const productTilt: Record<ProductSlug, number> = {
  'full-portrait': -3,
  'close-up-portrait': 2.5,
  'christmas-tree': -2,
  ornament: 3,
};

function priceRule(p: Product) {
  if (!p.hasFigures) return 'One drawing, flat price';
  return `Up to ${p.includedFigures} figures, +${dollars(p.extraFigurePrice)} each extra`;
}

function ChooseDrawing() {
  return (
    <section className={`section ${styles.choose}`} aria-labelledby="choose-title">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">4 types of artwork</p>
          <h2 id="choose-title" className="h2">
            Choose your drawing
          </h2>
          <p className="muted">
            Every piece is drawn by hand in {site.medium.toLowerCase()} and signed with my little turtle. People and pets each
            count as one figure.
          </p>
        </div>

        <ul className={styles.productGrid}>
          {products.map((p) => {
            const art = artById(p.heroArtId);
            return (
              <li key={p.slug}>
                <Link to={`/shop/${p.slug}`} className={`card ${styles.productCard}`}>
                  <div className={`${productTint[p.slug]} ${styles.productArt}`}>
                    {art && (
                      <img
                        className={styles.productImg}
                        src={art.src}
                        alt={art.alt}
                        width={art.width}
                        height={art.height}
                        loading="lazy"
                        decoding="async"
                        style={{ ['--tilt' as string]: `${productTilt[p.slug]}deg` }}
                      />
                    )}
                  </div>
                  <div className={styles.productBody}>
                    <h3 className={`h3 ${styles.productName}`}>{p.name}</h3>
                    <p className={styles.productTagline}>{p.tagline}</p>
                    <div className={styles.productPrice}>
                      <span className="price">{dollars(p.basePrice)}</span>
                      {!p.priceConfirmed && <span className="badge">Demo price</span>}
                    </div>
                    <p className={styles.productRule}>{priceRule(p)}</p>
                    <p className={styles.productSize}>
                      {p.size} · {p.medium}
                    </p>
                    <span className={styles.productCta}>
                      Start this one <Icon name="arrowRight" size={18} />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  const [sketch] = pickArt(['sketch-proposal', 'sketch-tree-pencil', 'sketch-tree-scene']);
  const finalFor: Record<string, string[]> = {
    'sketch-proposal': ['ringpop-proposal'],
    'sketch-tree-pencil': ['yellow-christmas-tree', 'navy-christmas-tree', 'ladder-christmas-tree'],
    'sketch-tree-scene': ['yellow-christmas-tree', 'navy-christmas-tree', 'ladder-christmas-tree'],
  };
  const [finished] = sketch ? pickArtWithFallback(finalFor[sketch.id] ?? [], 1) : pickArtWithFallback([], 1);
  const moreSketches = pickArt(['sketch-tree-scene', 'sketch-tree-pencil', 'sketch-proposal']).filter((a) => a.id !== sketch?.id);

  return (
    <section className={`section ${styles.how}`} aria-labelledby="how-title">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title" className="h2">
            From your photos to your wall
          </h2>
        </div>

        <div className={styles.howGrid}>
          <ol className={styles.steps}>
            {processSteps.map((s, i) => (
              <li key={s.title} className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3 className={styles.stepTitle}>
                    <span className="visually-hidden">Step {i + 1}: </span>
                    {s.title}
                  </h3>
                  <p className={styles.stepBody}>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.howVisual}>
            <div className={styles.beforeAfter}>
              {sketch && (
                <div className={styles.baItem}>
                  <StickerArt art={sketch} tilt={-3} tape />
                  <p className={styles.baLabel}>the pencil sketch</p>
                </div>
              )}
              {sketch && finished && <DoodleArrow className={styles.baArrow} size={84} />}
              {finished && (
                <div className={`${styles.baItem} ${styles.baFinal}`}>
                  <StickerArt art={finished} tilt={2.5} tape />
                  <p className={styles.baLabel}>the finished drawing!</p>
                </div>
              )}
            </div>
            {moreSketches.length > 0 && (
              <div className={styles.moreSketches}>
                <p className={styles.moreSketchesLabel}>More from the sketchbook</p>
                <div className={styles.moreSketchesRow}>
                  {moreSketches.map((a, i) => (
                    <Link key={a.id} to={`/gallery?c=process&art=${a.id}`} className={styles.sketchThumb} aria-label={`${a.title} (open in gallery)`}>
                      <StickerArt art={a} tilt={i % 2 ? 2 : -2} hover />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Gallery teaser                                                      */
/* ------------------------------------------------------------------ */

const teaserIds = [
  'hanbok-couple',
  'autumn-dog-family',
  'elopement-wedding',
  'two-cats',
  'dad-baby',
  'graduation-family',
  'roses-couple',
  'teddy-kids',
  'windmill-friends',
  'bench-anniversary',
];

function GalleryTeaser() {
  const exclude = heroArt().map((a) => a.id);
  const items = pickArtWithFallback(teaserIds, 8, exclude);
  if (items.length === 0) return null;
  const tilts = [-2, 1.5, -1, 2, 1, -2.5, 2, -1.5];
  return (
    <section className={`section ${styles.teaser}`} aria-labelledby="teaser-title">
      <div className="container">
        <div className={styles.teaserHead}>
          <div>
            <p className="eyebrow">From the gallery</p>
            <h2 id="teaser-title" className="h2">
              Couples, families, friends &amp; fluffballs
            </h2>
          </div>
          <Link to="/gallery" className={`btn ${styles.teaserBtnDesktop}`}>
            See the whole gallery <Icon name="arrowRight" size={18} />
          </Link>
        </div>
        <ul className={styles.teaserGrid}>
          {items.map((a, i) => (
            <li key={a.id} className={styles.teaserItem}>
              <Link to={`/gallery?art=${a.id}`} className={styles.teaserLink}>
                <StickerArt art={a} tilt={tilts[i % tilts.length]} hover />
                <span className={styles.teaserTitle}>{a.title}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className={styles.teaserFoot}>
          <Link to="/gallery" className="btn">
            See the whole gallery <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Holidays                                                            */
/* ------------------------------------------------------------------ */

function Holidays() {
  const [tree1, tree2] = pickArt(['yellow-christmas-tree', 'navy-christmas-tree', 'ladder-christmas-tree']);
  const ornament = artById('nyc-taxi-ornament');
  const costumes = pickArt(['ghost-onesies', 'pooh-family', 'superhero-family']);
  const tree = products.find((p) => p.slug === 'christmas-tree');
  const orn = products.find((p) => p.slug === 'ornament');

  return (
    <section className={`section ${styles.holidaySection}`} aria-labelledby="holiday-title">
      <div className="container">
        <div className={`plaid-green ${styles.holiday}`}>
          <div className={styles.holidayCopy}>
            <p className={styles.holidayRibbon}>
              <Icon name="sparkle" size={16} /> Holiday commissions are open
            </p>
            <h2 id="holiday-title" className="h2">
              A Christmas tree full of the things you love
            </h2>
            <blockquote className={styles.holidayQuote}>
              <p>“{site.holidayNotice}”</p>
              <footer>
                <Turtle size={26} /> {site.artistFirstName}
              </footer>
            </blockquote>
            <p className="muted">
              Send me photos of your favorite ornaments (or just tell me the things you love) and I'll draw a cozy tree decorated
              with them, with your people and pets gathered around. Or pick one special ornament for a little 4" x 6" drawing.
            </p>
            <div className={styles.holidayOptions}>
              {tree && (
                <Link to="/shop/christmas-tree" className={styles.holidayOption}>
                  <span className={styles.holidayOptionName}>{tree.name}</span>
                  <span className={styles.holidayOptionMeta}>
                    {dollars(tree.basePrice)} · {tree.size}
                    {!tree.priceConfirmed && <span className="badge">Demo price</span>}
                  </span>
                  <Icon name="arrowRight" size={20} className={styles.holidayOptionArrow} />
                </Link>
              )}
              {orn && (
                <Link to="/shop/ornament" className={styles.holidayOption}>
                  <span className={styles.holidayOptionName}>{orn.name}</span>
                  <span className={styles.holidayOptionMeta}>
                    {dollars(orn.basePrice)} · {orn.size}
                    {!orn.priceConfirmed && <span className="badge">Demo price</span>}
                  </span>
                  <Icon name="arrowRight" size={20} className={styles.holidayOptionArrow} />
                </Link>
              )}
            </div>
          </div>

          <div className={styles.holidayArt}>
            {tree2 && <StickerArt art={tree2} tilt={4} className={styles.holidayBack} />}
            {tree1 && <StickerArt art={tree1} tilt={-3} className={styles.holidayFront} />}
            {ornament && <StickerArt art={ornament} tilt={-7} tape className={styles.holidayOrnament} />}
            <DoodleStar className={`${styles.doodle} ${styles.hdStar}`} size={46} />
            <DoodleSprig className={`${styles.doodle} ${styles.hdSprig}`} size={44} />
          </div>
        </div>

        {costumes.length > 0 && (
          <div className={`card ${styles.costume}`}>
            <div className={styles.costumeArt}>
              {costumes.map((a, i) => (
                <StickerArt key={a.id} art={a} tilt={[-4, 2, -1][i] ?? 0} className={styles.costumeSticker} />
              ))}
            </div>
            <div className={styles.costumeCopy}>
              <p className="eyebrow" style={{ color: '#b0531a' }}>
                Still in costume?
              </p>
              <h3 className="h3">Halloween costume portraits</h3>
              <p className="small muted">
                Ghosts, superheroes, a whole Hundred Acre Wood family: send me your costume photos and I'll draw your crew in full
                spooky (or silly) glory as a full-body portrait.
              </p>
              <div className="row">
                <Link to="/gallery?c=halloween" className="btn btn--sm">
                  See costume portraits
                </Link>
                <Link to="/shop/full-portrait" className="link small">
                  Commission one
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Meet Esther                                                         */
/* ------------------------------------------------------------------ */

function MeetEsther() {
  return (
    <section className={`section ${styles.meet}`} aria-labelledby="meet-title">
      <div className={`container ${styles.meetInner}`}>
        <div className={styles.meetArt} aria-hidden="true">
          <div className={styles.meetCircle}>
            <Turtle size={190} fill="#fff" />
            <span className={styles.meetSig}>Esther Jun</span>
          </div>
          <DoodleHeart className={`${styles.doodle} ${styles.mdHeart}`} size={38} />
          <DoodleSparkle className={`${styles.doodle} ${styles.mdSparkle}`} size={30} color="var(--butter)" />
          <DoodleDashes className={`${styles.doodle} ${styles.mdDashes}`} size={36} />
        </div>
        <div className={styles.meetCopy}>
          <p className="eyebrow">Meet the artist</p>
          <h2 id="meet-title" className="h2">
            Hi, I'm {site.artistFirstName}!
          </h2>
          <p className={styles.meetIntro}>{aboutCopy.intro}</p>
          <p className="small muted">
            {site.artistName} ({site.pronouns}) · {site.role} · {site.medium}
          </p>
          <div className="row" style={{ marginTop: 18 }}>
            <Link to="/about" className="btn btn--butter">
              Read my story <Icon name="arrowRight" size={18} />
            </Link>
            <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="btn btn--ghost">
              <Icon name="instagram" size={20} /> {site.instagramHandle}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing CTA                                                         */
/* ------------------------------------------------------------------ */

function ClosingCta() {
  return (
    <section className={`plaid-butter ${styles.closing}`} aria-labelledby="closing-title">
      <div className={`container ${styles.closingInner}`}>
        <DoodleStar className={`${styles.doodle} ${styles.cdStar}`} size={42} />
        <DoodleHeart className={`${styles.doodle} ${styles.cdHeart}`} size={38} />
        <h2 id="closing-title" className="h1">
          Ready for your own little drawing?
        </h2>
        <p className="lead">Tell me about your people (and pets). I'll take it from there.</p>
        <div className={styles.closingCtas}>
          <Link to="/shop" className="btn btn--primary btn--lg">
            Start a commission <Icon name="arrowRight" size={20} />
          </Link>
          <Link to="/faq" className="btn btn--lg">
            Read the FAQ
          </Link>
        </div>
        <p className={styles.closingFacts}>From {fromPrice} · 8" x 10" · shipping included</p>
      </div>
    </section>
  );
}
