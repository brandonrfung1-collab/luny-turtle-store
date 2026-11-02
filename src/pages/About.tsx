import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { Turtle } from '../components/TurtleLogo';
import { pickArt } from '../components/pages/artHelpers';
import { DoodleDashes, DoodleHeart, DoodleSparkle, DoodleSprig, DoodleStar } from '../components/pages/Doodles';
import { StickerArt } from '../components/pages/StickerArt';
import { aboutCopy, site } from '../data/site';
import styles from './About.module.css';
import { usePageTitle } from '../components/pages/usePageTitle';

export default function About() {
  usePageTitle('About Esther · Luny Turtle');
  return (
    <>
      <section className={styles.hero}>
        <div className={`container container--narrow ${styles.heroInner}`}>
          <div className={styles.heroTurtle} aria-hidden="true">
            <Turtle size={150} fill="#fff" />
            <DoodleHeart className={`${styles.doodle} ${styles.dHeart}`} size={36} />
            <DoodleSparkle className={`${styles.doodle} ${styles.dSparkle}`} size={28} color="var(--butter)" />
            <DoodleDashes className={`${styles.doodle} ${styles.dDashes}`} size={32} />
          </div>
          <p className="eyebrow">About the artist</p>
          <h1 className="h-display">Hi, I'm {site.artistFirstName}!</h1>
          <p className={`lead ${styles.intro}`}>{aboutCopy.intro}</p>
          <ul className={styles.meta} aria-label="About Esther">
            <li>{site.artistName}</li>
            <li>{site.pronouns}</li>
            <li>{site.role}</li>
            <li>{site.medium}</li>
          </ul>
        </div>
      </section>

      <section className={styles.factsBand} aria-label="A few numbers from my story">
        <ul className={`container ${styles.facts}`}>
          <li className={`${styles.fact} ${styles.factButter}`}>
            <span className={styles.factBig}>25 years</span>
            <span className={styles.factSmall}>of drawing for the people I love (since the dawn of time)</span>
          </li>
          <li className={`${styles.fact} ${styles.factSky}`}>
            <span className={styles.factBig}>8 years</span>
            <span className={styles.factSmall}>in NYC, figuring out who I am</span>
          </li>
          <li className={`${styles.fact} ${styles.factBlush}`}>
            <span className={styles.factBig}>1 Moo</span>
            <span className={styles.factSmall}>grumpy ole kitty cat and studio supervisor</span>
          </li>
        </ul>
      </section>

      <div className={styles.story}>
        <StoryRow
          artIds={['nyc-taxi-ornament']}
          artCaption="a little NYC taxi, drawn as an ornament"
          eyebrow="The city years"
          title="Eight years in the big city"
          tilt={-4}
          tint="plaid-blue"
        >
          <p>{aboutCopy.nyc}</p>
        </StoryRow>

        <StoryRow
          artIds={['pier-couple']}
          artCaption="Miyoung & Moses"
          eyebrow="Family"
          title="My biggest fans"
          tilt={3}
          tint="plaid-pink"
          flip
        >
          <p>{aboutCopy.family}</p>
          <p className="muted">That's the two of them in the drawing, out on the pier.</p>
        </StoryRow>

        <StoryRow
          artIds={['moo-closeup', 'two-cats']}
          artCaption="Moo and her #1 fan, my mom"
          eyebrow="The studio supervisor"
          title="Meet Moo (yes, Moo)"
          tilt={-2.5}
          tint="plaid-butter"
        >
          <p>{aboutCopy.moo}</p>
          <p className="muted">Pets are family too: in your drawing, every pet counts as a figure, just like the humans.</p>
        </StoryRow>
      </div>

      <section className="section">
        <div className="container container--narrow">
          <div className={`plaid-green ${styles.closing}`}>
            <DoodleStar className={`${styles.doodle} ${styles.cStar}`} size={44} />
            <DoodleSprig className={`${styles.doodle} ${styles.cSprig}`} size={42} />
            <Turtle size={70} fill="var(--sage-soft)" className={styles.closingTurtle} />
            <p className={styles.closingLine}>{aboutCopy.closing}</p>
            <div className={styles.closingCtas}>
              <Link to="/shop" className="btn btn--primary btn--lg">
                Start a commission <Icon name="arrowRight" size={20} />
              </Link>
              <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="btn btn--lg">
                <Icon name="instagram" size={20} /> Say hi on Instagram
              </a>
            </div>
            <p className={styles.closingSign}>
              <Icon name="heart" size={16} /> {site.artistName}, {site.instagramHandle}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

interface StoryRowProps {
  artIds: string[];
  artCaption: string;
  eyebrow: string;
  title: string;
  tilt: number;
  tint: string;
  flip?: boolean;
  children: ReactNode;
}

function StoryRow({ artIds, artCaption, eyebrow, title, tilt, tint, flip, children }: StoryRowProps) {
  const [art] = pickArt(artIds);
  return (
    <section className={`section--tight ${styles.row} ${flip ? styles.rowFlip : ''}`}>
      <div className={`container ${styles.rowInner} ${art ? '' : styles.rowNoArt}`}>
        {art && (
          <figure className={styles.rowArt}>
            <div className={`${tint} ${styles.rowMat}`} aria-hidden="true" />
            <StickerArt art={art} tilt={tilt} tape className={styles.rowSticker} />
            <figcaption className={styles.rowCaption}>{artCaption}</figcaption>
          </figure>
        )}
        <div className={styles.rowCopy}>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="h2">{title}</h2>
          <div className={styles.rowText}>{children}</div>
        </div>
      </div>
    </section>
  );
}
